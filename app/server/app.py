"""Aiohttp entry point: WebSocket rooms + static, zero-build frontend.

Run with ``python -m server.app``. Deploy behind a reverse proxy that supports
WebSocket upgrades. The in-memory engine intentionally uses a single worker.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from pathlib import Path
from urllib.parse import urlsplit

from aiohttp import WSMsgType, web, ClientSession, ClientTimeout

from .game import GameEngine, GameError, Player, Room
from .socket_limits import SocketLimits
from .video_match import VideoResolver

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
ENGINE = GameEngine()
LOG = logging.getLogger("keystoria")
SESSIONS_KEY = web.AppKey("sessions", dict[str, web.WebSocketResponse])
SOCKET_LIMITS_KEY = web.AppKey("socket_limits", SocketLimits)
GAME_TASK_KEY = web.AppKey("game_task", asyncio.Task)
VIDEO_RESOLVER_KEY = web.AppKey("video_resolver", VideoResolver)
VIDEO_SESSION_KEY = web.AppKey("video_session", ClientSession)


async def broadcast(app: web.Application, room: Room) -> None:
    """Personalize every snapshot, so each operator receives only their task."""
    sessions: dict[str, web.WebSocketResponse] = app[SESSIONS_KEY]
    outgoing = []
    for player in room.players:
        if player.is_bot or not player.connected:
            continue
        ws = sessions.get(player.id)
        if ws and not ws.closed:
            outgoing.append(ws.send_json({"type": "snapshot", "room": ENGINE.view(room, player)}))
    if outgoing:
        await asyncio.gather(*outgoing, return_exceptions=True)


async def game_loop(app: web.Application) -> None:
    """One shared ticker avoids per-room interval leaks and runaway timers."""
    iteration = 0
    while True:
        await asyncio.sleep(0.25)
        iteration += 1
        for room in list(ENGINE.rooms.values()):
            previous_phase = room.phase
            ENGINE.tick(room)
            # A transition to won/lost can happen inside tick (timer, bot or
            # world pressure). Send its final snapshot exactly once; otherwise
            # the browser remains stranded on the last active screen.
            finished_now = previous_phase not in ("won", "lost") and room.phase in ("won", "lost")
            if finished_now or previous_phase != room.phase or room.phase in ("playing", "switching", "countdown") or (room.phase in ("lobby", "armed") and iteration % 4 == 0):
                await broadcast(app, room)
        if iteration % 240 == 0:  # Every 60 seconds.
            app[SOCKET_LIMITS_KEY].prune()
            count = ENGINE.cleanup()
            if count:
                LOG.info("Expired %d inactive rooms", count)


async def start_loop(app: web.Application) -> None:
    app[GAME_TASK_KEY] = asyncio.create_task(game_loop(app), name="game-tick")


async def stop_loop(app: web.Application) -> None:
    task = app[GAME_TASK_KEY]
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    # Include idle / not-yet-joined sockets, not only operator sessions.
    for ws in list(app[SOCKET_LIMITS_KEY].active):
        if not ws.closed:
            await ws.close(code=1001, message=b"Server shutting down")


async def send_error(ws: web.WebSocketResponse, message: str) -> None:
    await ws.send_json({"type": "error", "message": message})


def local_bind_host(environ: dict[str, str] | None = None) -> str:
    """Bind local installs to loopback unless the operator explicitly opts in.

    Docker intentionally sets HOST=0.0.0.0 *inside* the container; host
    exposure is then controlled by the port publish address. This is not
    a public-hosting security boundary on its own.
    """
    env = os.environ if environ is None else environ
    return env.get("HOST", "").strip() or "127.0.0.1"


def socket_transport_peer(request: web.Request) -> str:
    """Use only the TCP connection address, not spoofable forwarded headers."""
    transport = request.transport
    identity = transport.get_extra_info("peername") if transport else None
    if not isinstance(identity, tuple) or not identity or not isinstance(identity[0], str):
        raise web.HTTPForbidden(text="Socket peer could not be verified.")
    return identity[0]


async def websocket(request: web.Request) -> web.WebSocketResponse:
    # Browser connections must originate from this site's host. A direct CLI
    # WebSocket client may omit Origin, as specified by the WebSocket protocol.
    origin = request.headers.get("Origin")
    if origin:
        source = urlsplit(origin)
        if source.scheme not in ("http", "https") or source.netloc != request.host:
            raise web.HTTPForbidden(text="Cross-origin room connections are disabled.")
    app = request.app
    limits = app[SOCKET_LIMITS_KEY]
    peer = socket_transport_peer(request)
    ws = web.WebSocketResponse(heartbeat=25, max_msg_size=2048, autoping=True)
    if not limits.acquire(ws, peer):
        raise web.HTTPTooManyRequests(text="Too many local game connections.")
    try:
        await ws.prepare(request)
    except BaseException:
        limits.release(ws)
        raise
    sessions: dict[str, web.WebSocketResponse] = app[SESSIONS_KEY]
    current_room: Room | None = None
    current_player: Player | None = None
    window_start = time.monotonic()
    window_count = 0
    try:
        async for message in ws:
            if message.type == WSMsgType.TEXT:
                # A bounded message rate protects the shared worker from floods.
                now = time.monotonic()
                if now - window_start >= 1:
                    window_start, window_count = now, 0
                window_count += 1
                if window_count > 25:
                    await ws.close(code=1008, message=b"Rate limit exceeded")
                    break
                try:
                    payload = json.loads(message.data)
                    if not isinstance(payload, dict):
                        raise GameError("Malformed message.")
                    kind = payload.get("type")
                    if kind in ("create", "join", "reconnect"):
                        if current_player is not None:
                            raise GameError("Already in a room. Reload to change rooms.")
                        old: web.WebSocketResponse | None = None
                        if kind == "create":
                            if not limits.allow_create(peer):
                                raise GameError("Room creation limit reached. Try again in a minute.")
                            room, player = ENGINE.create(
                                payload.get("name", ""), payload.get("mission", "station"),
                                payload.get("solo") is True,
                            )
                        elif kind == "join":
                            room, player = ENGINE.join(payload.get("code", ""), payload.get("name", ""))
                        else:
                            room, player = ENGINE.reconnect(payload.get("code", ""), payload.get("token", ""))
                            old = sessions.get(player.id)
                        current_room, current_player = room, player
                        # Transfer ownership BEFORE awaiting the old socket's
                        # close: its finally block may run during that await.
                        # The departing socket must never mark the new owner
                        # disconnected or pause an active mission.
                        sessions[player.id] = ws
                        await ws.send_json({"type": "welcome", "code": room.code, "token": player.token})
                        if old and old is not ws and not old.closed:
                            await old.close(code=1000, message=b"Reconnected in another tab")
                        await broadcast(app, room)
                    else:
                        if not current_room or not current_player:
                            raise GameError("Join or create a room first.")
                        # A superseded socket may still have a queued action
                        # while its close handshake completes. Only the
                        # currently registered owner can mutate a room.
                        if sessions.get(current_player.id) is not ws:
                            await ws.close(code=1008, message=b"Session superseded")
                            break
                        if ENGINE.rooms.get(current_room.code) is not current_room:
                            raise GameError("Room expired. Start a new mission.")
                        if kind == "set_mission":
                            ENGINE.change_mission(current_room, current_player, payload.get("mission", ""))
                        elif kind == "difficulty":
                            ENGINE.change_difficulty(current_room, current_player, payload.get("difficulty", ""))
                        elif kind == "start":
                            ENGINE.start(current_room, current_player)
                        elif kind == "ready":
                            ENGINE.ready(current_room, current_player)
                        elif kind == "launch":
                            ENGINE.launch(current_room, current_player)
                        elif kind == "rematch":
                            ENGINE.rematch(current_room, current_player)
                        elif kind == "ping":
                            ENGINE.ping(current_room, current_player, payload.get("code", ""))
                        elif kind == "pulse":
                            ENGINE.pulse(current_room, current_player)
                        elif kind == "field_action":
                            ENGINE.operate_field(current_room, current_player, str(payload.get("action", ""))[:32])
                        elif kind == "tactic":
                            ENGINE.choose_tactic(current_room, current_player, payload.get("choice", ""))
                        elif kind == "accuse":
                            ENGINE.accuse(current_room, current_player, str(payload.get("suspect", ""))[:32])
                        elif kind == "submit":
                            ENGINE.submit(current_room, current_player, str(payload.get("targetId", ""))[:24], str(payload.get("value", "")))
                        else:
                            raise GameError("Unknown action.")
                        await broadcast(app, current_room)
                except (GameError, ValueError, TypeError) as exc:
                    await send_error(ws, str(exc))
                except Exception:
                    LOG.exception("Unexpected socket message error")
                    await send_error(ws, "An unexpected error occurred. Please try again.")
            elif message.type == WSMsgType.ERROR:
                LOG.warning("WebSocket error: %s", ws.exception())
    finally:
        limits.release(ws)
        if current_room and current_player and sessions.get(current_player.id) is ws:
            sessions.pop(current_player.id, None)
            ENGINE.disconnect(current_room, current_player)
            await broadcast(app, current_room)
    return ws


async def start_video_match(app: web.Application) -> None:
    """The API key stays on the server; never put it into HTML or JavaScript."""
    client = ClientSession(timeout=ClientTimeout(total=9, connect=4))
    app[VIDEO_SESSION_KEY] = client
    app[VIDEO_RESOLVER_KEY] = VideoResolver(client, os.getenv('YOUTUBE_API_KEY', ''))


async def stop_video_match(app: web.Application) -> None:
    await app[VIDEO_SESSION_KEY].close()


async def resolve_music_video(request: web.Request) -> web.Response:
    """Match one selected track, not twenty videos per lyrics search."""
    title = request.query.get('title', '').strip()
    artist = request.query.get('artist', '').strip()
    if not (2 <= len(title) <= 120 and 1 <= len(artist) <= 120):
        raise web.HTTPBadRequest(text='Song title and artist are required (120 characters max).')
    try:
        duration = int(float(request.query.get('duration', '0')))
    except (ValueError, TypeError, OverflowError):
        raise web.HTTPBadRequest(text='Invalid duration.')
    if duration < 0 or duration > 1500:
        raise web.HTTPBadRequest(text='Duration must be between 0 and 1500 seconds.')
    try:
        result = await request.app[VIDEO_RESOLVER_KEY].resolve(title, artist, duration)
    except Exception:
        LOG.exception('Auto music video lookup failed')
        result = {'videoId': None, 'source': 'none', 'reason': 'Video matching is temporarily unavailable.'}
    response = web.json_response(result)
    response.headers['Cache-Control'] = 'private, max-age=60'
    return response


async def index(request: web.Request) -> web.FileResponse:
    return web.FileResponse(WEB / "index.html")


async def health(request: web.Request) -> web.Response:
    return web.json_response({
        "status": "ok", "version": "0.24.0", "active_rooms": len(ENGINE.rooms),
        "connected_operators": len(request.app[SESSIONS_KEY]),
    })


def create_app() -> web.Application:
    app = web.Application(client_max_size=4096)
    app[SESSIONS_KEY] = {}
    app[SOCKET_LIMITS_KEY] = SocketLimits()
    app.router.add_get("/ws", websocket)
    app.router.add_get("/health", health)
    app.router.add_get("/api/music/resolve", resolve_music_video)
    app.router.add_get("/", index)
    app.router.add_static("/assets/", WEB, show_index=False)
    app.on_startup.append(start_loop)
    app.on_startup.append(start_video_match)
    app.on_cleanup.append(stop_loop)
    app.on_cleanup.append(stop_video_match)
    return app


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    host = local_bind_host()
    if host in ("0.0.0.0", "::"):
        LOG.warning("Listening on all interfaces by explicit HOST opt-in; not safe for public hosting.")
    web.run_app(create_app(), host=host, port=int(os.getenv("PORT", "8080")))
