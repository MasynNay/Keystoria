"""Loopback default and real WebSocket negative controls for LOCAL play only.

These tests do not authorize an internet-facing hosted co-op service.
"""
from __future__ import annotations

import asyncio
import json
import unittest

from aiohttp import ClientSession, WSMsgType, WSServerHandshakeError, web
from server.app import (
    ENGINE, SESSIONS_KEY, SOCKET_LIMITS_KEY, broadcast, close_expired_rooms,
    create_app, local_bind_host,
)
from server.game import MAX_ROOM_AGE
from server.socket_limits import (
    SocketLimits, MAX_OPEN_SOCKETS, MAX_SOCKETS_PER_PEER,
    MAX_CREATES_PER_PEER, CREATE_WINDOW_SECONDS, MAX_TRACKED_CREATE_PEERS,
    MAX_ROOM_ACCESS_ATTEMPTS_PER_PEER, ROOM_ACCESS_WINDOW_SECONDS,
    MAX_TRACKED_ACCESS_PEERS,
)


class LocalBindTests(unittest.TestCase):
    def test_normal_cli_defaults_to_loopback(self):
        self.assertEqual(local_bind_host({}), "127.0.0.1")
        self.assertEqual(local_bind_host({"HOST": ""}), "127.0.0.1")
        self.assertEqual(local_bind_host({"HOST": "  "}), "127.0.0.1")

    def test_lan_requires_explicit_override(self):
        self.assertEqual(local_bind_host({"HOST": "0.0.0.0"}), "0.0.0.0")
        self.assertEqual(local_bind_host({"HOST": " :: "}), "::")
        self.assertEqual(local_bind_host({"HOST": "192.0.2.12"}), "192.0.2.12")


class SocketQuotaUnitTests(unittest.TestCase):
    def test_per_peer_slots_global_cap_release_and_idempotence(self):
        limits = SocketLimits()
        sockets = [object() for _ in range(MAX_SOCKETS_PER_PEER)]
        for ws in sockets:
            self.assertTrue(limits.acquire(ws, "127.0.0.1"))
        self.assertFalse(limits.acquire(object(), "127.0.0.1"))
        self.assertFalse(limits.acquire(sockets[0], "127.0.0.1"))
        limits.release(sockets[0])
        limits.release(sockets[0])
        self.assertTrue(limits.acquire(object(), "127.0.0.1"))
        total = SocketLimits()
        opened = [object() for _ in range(MAX_OPEN_SOCKETS)]
        for index, ws in enumerate(opened):
            self.assertTrue(total.acquire(ws, f"192.0.2.{index}"))
        self.assertFalse(total.acquire(object(), "198.51.100.2"))
        total.release(opened[0])
        self.assertTrue(total.acquire(object(), "198.51.100.2"))

    def test_create_window_expiry_and_bounded_peer_tracking(self):
        now = [1000.0]
        limits = SocketLimits(clock=lambda: now[0])
        for _ in range(MAX_CREATES_PER_PEER):
            self.assertTrue(limits.allow_create("192.0.2.1"))
        self.assertFalse(limits.allow_create("192.0.2.1"))
        self.assertFalse(limits.allow_create(""))
        now[0] += CREATE_WINDOW_SECONDS - 0.001
        self.assertFalse(limits.allow_create("192.0.2.1"))
        now[0] += 0.001
        self.assertTrue(limits.allow_create("192.0.2.1"))
        for index in range(MAX_TRACKED_CREATE_PEERS - 1):
            self.assertTrue(limits.allow_create(f"198.51.100.{index}"))
        self.assertFalse(limits.allow_create("203.0.113.99"))
        self.assertLessEqual(len(limits.creates), MAX_TRACKED_CREATE_PEERS)
        now[0] += CREATE_WINDOW_SECONDS
        self.assertTrue(limits.allow_create("203.0.113.99"))
        self.assertEqual(len(limits.creates), 1)


    def test_access_attempt_window_bounded_and_independent_of_creation(self):
        now = [250.0]
        limits = SocketLimits(clock=lambda: now[0])
        for _ in range(MAX_ROOM_ACCESS_ATTEMPTS_PER_PEER):
            self.assertTrue(limits.allow_room_access("192.0.2.1"))
        self.assertFalse(limits.allow_room_access("192.0.2.1"))
        self.assertFalse(limits.allow_room_access(""))
        self.assertTrue(limits.allow_create("192.0.2.1"))
        self.assertTrue(limits.allow_room_access("192.0.2.2"))
        now[0] += ROOM_ACCESS_WINDOW_SECONDS - 0.001
        self.assertFalse(limits.allow_room_access("192.0.2.1"))
        now[0] += 0.001
        self.assertTrue(limits.allow_room_access("192.0.2.1"))
        for i in range(MAX_TRACKED_ACCESS_PEERS - 1):
            self.assertTrue(limits.allow_room_access(f"198.51.100.{i}"))
        self.assertFalse(limits.allow_room_access("203.0.113.23"))
        self.assertLessEqual(len(limits.room_access), MAX_TRACKED_ACCESS_PEERS)
        now[0] += ROOM_ACCESS_WINDOW_SECONDS
        self.assertTrue(limits.allow_room_access("203.0.113.23"))
        self.assertEqual(len(limits.room_access), 1)
        limits.prune()
        self.assertEqual(len(limits.room_access), 1)

class SocketBoundaryTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.runner = web.AppRunner(create_app())
        await self.runner.setup()
        self.site = web.TCPSite(self.runner, "127.0.0.1", 0)
        await self.site.start()
        self.port = self.site._server.sockets[0].getsockname()[1]
        self.address = f"http://127.0.0.1:{self.port}/ws"
        self.client = ClientSession()

    async def asyncTearDown(self):
        await self.client.close()
        await self.runner.cleanup()

    async def test_same_host_browser_origin_and_cli_without_origin(self):
        baseline = len(ENGINE.rooms)
        async with self.client.ws_connect(
            self.address, headers={"Origin": f"http://127.0.0.1:{self.port}"}
        ) as browser:
            self.assertFalse(browser.closed)
        async with self.client.ws_connect(self.address) as cli:
            self.assertFalse(cli.closed)
        self.assertEqual(len(ENGINE.rooms), baseline)

    async def test_foreign_and_opaque_origins_are_forbidden_at_handshake(self):
        for origin in ("null", "https://unrelated.example",
                       "http://127.0.0.1.evil.example",
                       f"https://127.0.0.1:{self.port + 1}", "file://local"):
            with self.subTest(origin=origin):
                with self.assertRaises(WSServerHandshakeError) as caught:
                    await self.client.ws_connect(self.address, headers={"Origin": origin})
                self.assertEqual(caught.exception.status, 403)

    async def test_oversized_frames_are_rejected_before_room_creation(self):
        baseline = len(ENGINE.rooms)
        async with self.client.ws_connect(self.address) as ws:
            await ws.send_str("X" * 4096)
            events = []
            for _ in range(4):
                msg = await ws.receive(timeout=3)
                events.append(msg.type)
                if msg.type in (WSMsgType.CLOSE, WSMsgType.CLOSED, WSMsgType.ERROR):
                    break
            self.assertTrue(ws.closed or WSMsgType.CLOSE in events or WSMsgType.CLOSED in events)
            self.assertNotIn(WSMsgType.TEXT, events, "oversized input must not yield a room welcome")
        self.assertEqual(len(ENGINE.rooms), baseline)

    async def test_upgrade_capacity_ignores_forwarded_ip_and_recovers_after_close(self):
        sockets = []
        try:
            for index in range(MAX_SOCKETS_PER_PEER):
                ws = await self.client.ws_connect(
                    self.address, headers={"X-Forwarded-For": f"198.51.100.{index}"}
                )
                sockets.append(ws)
            self.assertEqual(len(self.runner.app[SOCKET_LIMITS_KEY].active), MAX_SOCKETS_PER_PEER)
            with self.assertRaises(WSServerHandshakeError) as caught:
                await self.client.ws_connect(
                    self.address, headers={"X-Forwarded-For": "203.0.113.22"}
                )
            self.assertEqual(caught.exception.status, 429)
            await sockets.pop().close()
            # Closing an unjoined WebSocket must promptly release its slot.
            for _ in range(50):
                if len(self.runner.app[SOCKET_LIMITS_KEY].active) == MAX_SOCKETS_PER_PEER - 1:
                    break
                await asyncio.sleep(0.01)
            replacement = await self.client.ws_connect(self.address)
            sockets.append(replacement)
            self.assertEqual(len(self.runner.app[SOCKET_LIMITS_KEY].active), MAX_SOCKETS_PER_PEER)
        finally:
            for ws in sockets:
                await ws.close()

    async def test_room_creation_attempt_limit_preserves_join_and_reconnect(self):
        codes = []
        first_token = None
        try:
            for index in range(MAX_CREATES_PER_PEER):
                async with self.client.ws_connect(self.address) as ws:
                    await ws.send_json({"type": "create", "name": f"LIMIT{index}"})
                    welcome = await ws.receive_json(timeout=3)
                    self.assertEqual(welcome["type"], "welcome")
                    if index == 0:
                        first_token = welcome["token"]
                    codes.append(welcome["code"])
            async with self.client.ws_connect(self.address) as ws:
                await ws.send_json({"type": "create", "name": "BLOCKED"})
                denied = await ws.receive_json(timeout=3)
                self.assertEqual(denied["type"], "error")
                self.assertIn("creation limit", denied["message"].lower())
                # Rejecting create must not consume the socket or block joins.
                await ws.send_json({"type": "join", "code": codes[0], "name": "GUEST"})
                joined = await ws.receive_json(timeout=3)
                self.assertEqual(joined["type"], "welcome")
                self.assertEqual(joined["code"], codes[0])
            async with self.client.ws_connect(self.address) as ws:
                await ws.send_json({"type": "reconnect", "code": codes[0], "token": first_token})
                welcome = await ws.receive_json(timeout=3)
                self.assertEqual(welcome["type"], "welcome")
        finally:
            for code in codes:
                ENGINE.rooms.pop(code, None)

    async def test_active_session_handoff_rotates_pass_without_pause_or_replay(self):
        """A same-operator tab takeover must never disconnect the new owner."""
        code = None
        async with self.client.ws_connect(self.address) as first:
            try:
                await first.send_json({"type": "create", "name": "CAPTAIN"})
                first_welcome = await first.receive_json(timeout=3)
                self.assertEqual(first_welcome["type"], "welcome")
                code, old_pass = first_welcome["code"], first_welcome["token"]
                room = ENGINE.rooms[code]
                owner = room.players[0]
                owner_id = owner.id
                self.assertEqual(self.runner.app[SESSIONS_KEY][owner_id].closed, False)

                async with self.client.ws_connect(self.address) as second:
                    await second.send_json({"type": "reconnect", "code": code, "token": old_pass})
                    new_welcome = await second.receive_json(timeout=3)
                    self.assertEqual(new_welcome["type"], "welcome")
                    self.assertEqual(new_welcome["code"], code)
                    self.assertNotEqual(new_welcome["token"], old_pass)
                    self.assertEqual(owner.id, owner_id)
                    self.assertIsNotNone(self.runner.app[SESSIONS_KEY][owner_id])
                    self.assertTrue(owner.connected, "the displaced tab must not pause its replacement")
                    self.assertIsNone(room.paused_since)

                    # Old token is spent, even if the old tab is still around.
                    async with self.client.ws_connect(self.address) as replay:
                        await replay.send_json({"type": "reconnect", "code": code, "token": old_pass})
                        denied = await replay.receive_json(timeout=3)
                        self.assertEqual(denied["type"], "error")
                        self.assertIn("reconnect pass", denied["message"])

                    # The new owner can still perform a host-only action.
                    await second.send_json({"type": "difficulty", "difficulty": "overdrive"})
                    for _ in range(6):
                        response = await second.receive_json(timeout=3)
                        if (response.get("type") == "snapshot"
                                and response["room"].get("difficulty") == "overdrive"):
                            break
                    else:
                        self.fail("new session did not retain host authority")
                    self.assertTrue(owner.connected)
                    self.assertIsNone(room.paused_since)

                # A new reconnect pass should work after a genuine disconnect.
                async with self.client.ws_connect(self.address) as third:
                    await third.send_json({"type": "reconnect", "code": code,
                                           "token": new_welcome["token"]})
                    third_welcome = await third.receive_json(timeout=3)
                    self.assertEqual(third_welcome["type"], "welcome")
                    self.assertNotEqual(third_welcome["token"], new_welcome["token"])
            finally:
                if code is not None:
                    ENGINE.rooms.pop(code, None)

    async def test_wrong_room_and_duplicate_reconnect_pass_are_rejected(self):
        codes = []
        try:
            welcomes = []
            for callsign in ("A1", "B2"):
                async with self.client.ws_connect(self.address) as socket:
                    await socket.send_json({"type": "create", "name": callsign})
                    welcome = await socket.receive_json(timeout=3)
                    self.assertEqual(welcome["type"], "welcome")
                    codes.append(welcome["code"])
                    welcomes.append(welcome)
            async with self.client.ws_connect(self.address) as wrong:
                await wrong.send_json({"type": "reconnect",
                                       "code": codes[1], "token": welcomes[0]["token"]})
                result = await wrong.receive_json(timeout=3)
                self.assertEqual(result["type"], "error")
                self.assertIn("reconnect pass", result["message"])
            self.assertEqual(ENGINE.rooms[codes[0]].players[0].token, welcomes[0]["token"])
        finally:
            for code in codes:
                ENGINE.rooms.pop(code, None)

    async def test_two_live_rooms_ignore_forged_room_ids_and_keep_snapshots_private(self):
        """Identical names on the same TCP peer must not mix state or actions."""
        codes = []
        try:
            async with self.client.ws_connect(self.address) as alpha:
                await alpha.send_json({"type": "create", "name": "SAME", "mission": "station"})
                a = await alpha.receive_json(timeout=3)
                self.assertEqual(a["type"], "welcome")
                codes.append(a["code"])
                a_snapshot = await alpha.receive_json(timeout=3)
                self.assertEqual(a_snapshot["type"], "snapshot")
                async with self.client.ws_connect(self.address) as beta:
                    await beta.send_json({"type": "create", "name": "SAME", "mission": "hollow"})
                    b = await beta.receive_json(timeout=3)
                    self.assertEqual(b["type"], "welcome")
                    codes.append(b["code"])
                    self.assertNotEqual(a["code"], b["code"])
                    self.assertNotEqual(a["token"], b["token"])
                    b_snapshot = await beta.receive_json(timeout=3)
                    self.assertEqual(b_snapshot["room"]["code"], b["code"])
                    self.assertNotIn(a["token"], str(b_snapshot))
                    self.assertNotIn(b["token"], str(a_snapshot))
                    self.assertNotEqual(
                        a_snapshot["room"]["viewerId"], b_snapshot["room"]["viewerId"])

                    # An authenticated client can only control its own room.
                    # Supplying another code in the message does not retarget
                    # its server-held current_room.
                    await beta.send_json({"type": "difficulty",
                                          "room": a["code"], "difficulty": "overdrive"})
                    for _ in range(12):
                        response = await beta.receive_json(timeout=3)
                        if response.get("type") != "snapshot":
                            continue
                        self.assertEqual(response["room"]["code"], b["code"])
                        if response["room"]["difficulty"] == "overdrive":
                            break
                    else:
                        self.fail("room B difficulty was not updated")
                    self.assertEqual(ENGINE.rooms[a["code"]].difficulty, "standard")
                    self.assertEqual(ENGINE.rooms[b["code"]].difficulty, "overdrive")

                    # A room-B reconnect pass cannot claim an operator in A.
                    async with self.client.ws_connect(self.address) as intruder:
                        await intruder.send_json({"type": "reconnect",
                                                  "code": a["code"], "token": b["token"]})
                        denied = await intruder.receive_json(timeout=3)
                        self.assertEqual(denied["type"], "error")
                        self.assertIn("reconnect pass", denied["message"])
                    self.assertEqual(ENGINE.rooms[a["code"]].players[0].token, a["token"])
                    self.assertEqual(ENGINE.rooms[b["code"]].players[0].token, b["token"])

                    # A's own host remains authorized and sees only A.
                    await alpha.send_json({"type": "difficulty", "difficulty": "story"})
                    for _ in range(12):
                        response = await alpha.receive_json(timeout=3)
                        if response.get("type") != "snapshot":
                            continue
                        self.assertEqual(response["room"]["code"], a["code"])
                        if response["room"]["difficulty"] == "story":
                            break
                    else:
                        self.fail("room A difficulty was not updated")
                    self.assertEqual(ENGINE.rooms[b["code"]].difficulty, "overdrive")
        finally:
            for code in codes:
                ENGINE.rooms.pop(code, None)

    async def test_retired_room_never_broadcasts_stale_snapshots(self):
        """A room removed by cleanup cannot leak a final stale snapshot."""
        from unittest.mock import AsyncMock
        code = None
        try:
            async with self.client.ws_connect(self.address) as host:
                await host.send_json({"type": "create", "name": "RETIRED"})
                welcome = await host.receive_json(timeout=3)
                code = welcome["code"]
                await host.receive_json(timeout=3)
                room = ENGINE.rooms[code]
                viewer = room.players[0]
                fake_socket = type("Sink", (), {})()
                fake_socket.closed = False
                fake_socket.send_json = AsyncMock()
                sessions = self.runner.app[SESSIONS_KEY]
                original_socket = sessions[viewer.id]
                sessions[viewer.id] = fake_socket
                try:
                    await broadcast(self.runner.app, room)
                    fake_socket.send_json.assert_awaited_once()
                    fake_socket.send_json.reset_mock()
                    ENGINE.rooms.pop(code)
                    await broadcast(self.runner.app, room)
                    fake_socket.send_json.assert_not_awaited()
                finally:
                    sessions[viewer.id] = original_socket
        finally:
            if code is not None:
                ENGINE.rooms.pop(code, None)

    async def test_lost_reconnect_welcome_fails_closed_without_token_replay(self):
        """If a rotated pass is never received, do not revive the old pass."""
        code = None
        try:
            async with self.client.ws_connect(self.address) as original:
                await original.send_json({"type": "create", "name": "RECOVERY"})
                initial = await original.receive_json(timeout=3)
                code, old_pass = initial["code"], initial["token"]
            async with self.client.ws_connect(self.address) as interrupted:
                await interrupted.send_json({"type": "reconnect",
                                             "code": code, "token": old_pass})
                # Simulate the client losing the connection before reading welcome.
                # Server-side processing is not guaranteed before closing, so wait
                # until the rotation is visible to make this deterministic.
                for _ in range(100):
                    if ENGINE.rooms[code].players[0].token != old_pass:
                        break
                    await asyncio.sleep(.01)
                self.assertNotEqual(ENGINE.rooms[code].players[0].token, old_pass)
            async with self.client.ws_connect(self.address) as retry:
                await retry.send_json({"type": "reconnect",
                                       "code": code, "token": old_pass})
                denied = await retry.receive_json(timeout=3)
                self.assertEqual(denied["type"], "error")
                self.assertIn("reconnect pass", denied["message"])
        finally:
            if code is not None:
                ENGINE.rooms.pop(code, None)

    async def test_room_expiry_closes_only_retired_sockets_and_releases_capacity(self):
        """TTL removes a live room and closes it without disrupting a peer room."""
        codes = []
        try:
            async with self.client.ws_connect(self.address) as old:
                await old.send_json({"type": "create", "name": "OLD"})
                old_welcome = await old.receive_json(timeout=3)
                self.assertEqual(old_welcome["type"], "welcome")
                codes.append(old_welcome["code"])
                await old.receive_json(timeout=3)
                async with self.client.ws_connect(self.address) as current:
                    await current.send_json({"type": "create", "name": "CURRENT"})
                    current_welcome = await current.receive_json(timeout=3)
                    self.assertEqual(current_welcome["type"], "welcome")
                    codes.append(current_welcome["code"])
                    await current.receive_json(timeout=3)

                    retired = ENGINE.rooms[old_welcome["code"]]
                    retained = ENGINE.rooms[current_welcome["code"]]
                    retired.created -= MAX_ROOM_AGE + 5
                    self.assertEqual(await close_expired_rooms(self.runner.app), 1)
                    self.assertNotIn(old_welcome["code"], ENGINE.rooms)
                    self.assertIs(ENGINE.rooms[current_welcome["code"]], retained)

                    # The retired owner receives a comprehensible error before
                    # the socket close; snapshots already in flight are ignored.
                    for _ in range(12):
                        message = await old.receive(timeout=3)
                        if message.type != WSMsgType.TEXT:
                            self.fail("expired socket closed without an expiry notice")
                        payload = json.loads(message.data)
                        if payload.get("type") == "error":
                            self.assertIn("expired", payload["message"].lower())
                            break
                    else:
                        self.fail("no expiry notice delivered")
                    self.assertIn(
                        (await old.receive(timeout=3)).type,
                        (WSMsgType.CLOSE, WSMsgType.CLOSED),
                    )
                    for _ in range(100):
                        if len(self.runner.app[SOCKET_LIMITS_KEY].active) == 1:
                            break
                        await asyncio.sleep(.01)
                    self.assertEqual(len(self.runner.app[SOCKET_LIMITS_KEY].active), 1)
                    self.assertEqual(len(self.runner.app[SESSIONS_KEY]), 1)

                    # The other room continues to accept authenticated commands.
                    await current.send_json({"type": "difficulty", "difficulty": "story"})
                    for _ in range(12):
                        snapshot = await current.receive_json(timeout=3)
                        if snapshot.get("type") == "snapshot" and snapshot["room"]["difficulty"] == "story":
                            self.assertEqual(snapshot["room"]["code"], current_welcome["code"])
                            break
                    else:
                        self.fail("unexpired room stopped accepting controls")

                    async with self.client.ws_connect(self.address) as reconnect:
                        await reconnect.send_json({"type": "reconnect", "code": old_welcome["code"],
                                                   "token": old_welcome["token"]})
                        denied = await reconnect.receive_json(timeout=3)
                        self.assertEqual(denied["type"], "error")
                        self.assertIn("expired", denied["message"].lower())
        finally:
            for code in codes:
                ENGINE.rooms.pop(code, None)

    async def test_room_expiry_closes_both_operators_not_idle_websockets(self):
        """Disconnect all room occupants; a pre-room socket stays available."""
        code = None
        try:
            async with self.client.ws_connect(self.address) as idle:
                async with self.client.ws_connect(self.address) as host:
                    await host.send_json({"type": "create", "name": "HOST"})
                    welcome = await host.receive_json(timeout=3)
                    code = welcome["code"]
                    await host.receive_json(timeout=3)
                    async with self.client.ws_connect(self.address) as guest:
                        await guest.send_json({"type": "join", "code": code, "name": "GUEST"})
                        joined = await guest.receive_json(timeout=3)
                        self.assertEqual(joined["type"], "welcome")
                        ENGINE.rooms[code].created -= MAX_ROOM_AGE + 1
                        self.assertEqual(await close_expired_rooms(self.runner.app), 1)
                        for ws in (host, guest):
                            for _ in range(12):
                                msg = await ws.receive(timeout=3)
                                if msg.type == WSMsgType.TEXT:
                                    if json.loads(msg.data).get("type") == "error":
                                        break
                                else:
                                    self.fail("missing room expiry notice")
                            else:
                                self.fail("missing expired notice")
                            self.assertIn((await ws.receive(timeout=3)).type,
                                          (WSMsgType.CLOSE, WSMsgType.CLOSED))
                        for _ in range(100):
                            if len(self.runner.app[SOCKET_LIMITS_KEY].active) == 1:
                                break
                            await asyncio.sleep(.01)
                        self.assertEqual(len(self.runner.app[SOCKET_LIMITS_KEY].active), 1)
                        self.assertFalse(idle.closed)
                        self.assertEqual(await close_expired_rooms(self.runner.app), 0)
        finally:
            if code is not None:
                ENGINE.rooms.pop(code, None)

    async def test_room_access_attempts_are_shared_across_sockets_and_forwarded_headers(self):
        """Invalid join/reconnect guesses exhaust a peer quota, not game state."""
        code = None
        try:
            async with self.client.ws_connect(self.address) as host:
                await host.send_json({"type": "create", "name": "CAPTAIN"})
                initial = await host.receive_json(timeout=3)
                self.assertEqual(initial["type"], "welcome")
                code, original_pass = initial["code"], initial["token"]
                await host.receive_json(timeout=3)  # Initial snapshot.
                limits = self.runner.app[SOCKET_LIMITS_KEY]
                original_clock = limits.clock
                try:
                    async with self.client.ws_connect(
                        self.address, headers={"X-Forwarded-For": "198.51.100.11"}
                    ) as first:
                        for index in range(MAX_ROOM_ACCESS_ATTEMPTS_PER_PEER // 2):
                            await first.send_json({"type": "join", "code": "WRONG1",
                                                   "name": "PROBE"})
                            error = await first.receive_json(timeout=3)
                            self.assertEqual(error["type"], "error")
                            self.assertIn("Room not found", error["message"])
                    async with self.client.ws_connect(
                        self.address, headers={"X-Forwarded-For": "203.0.113.9"}
                    ) as second:
                        for index in range(MAX_ROOM_ACCESS_ATTEMPTS_PER_PEER // 2):
                            await second.send_json({"type": "reconnect", "code": code,
                                                    "token": "not-a-real-pass"})
                            error = await second.receive_json(timeout=3)
                            self.assertEqual(error["type"], "error")
                            self.assertIn("reconnect pass", error["message"])
                        self.assertEqual(
                            len(limits.room_access.get("127.0.0.1", ())),
                            MAX_ROOM_ACCESS_ATTEMPTS_PER_PEER,
                        )
                        # Even a valid request is throttled until its window
                        # expires. No private identity mutation may occur.
                        await second.send_json({"type": "reconnect", "code": code,
                                                "token": original_pass})
                        blocked = await second.receive_json(timeout=3)
                        self.assertEqual(blocked["type"], "error")
                        self.assertIn("room access attempts", blocked["message"])
                        await second.send_json({"type": "join", "code": code, "name": "GUEST"})
                        blocked_join = await second.receive_json(timeout=3)
                        self.assertEqual(blocked_join["type"], "error")
                        self.assertIn("room access attempts", blocked_join["message"])
                        self.assertEqual(ENGINE.rooms[code].players[0].token, original_pass)
                        self.assertEqual(len(ENGINE.rooms[code].players), 1)
                        self.assertTrue(ENGINE.rooms[code].players[0].connected)

                        # Already authenticated hosts remain playable even
                        # while this TCP peer's pre-room attempts are capped.
                        await host.send_json({"type": "difficulty", "difficulty": "story"})
                        for _ in range(12):
                            result = await host.receive_json(timeout=3)
                            if result.get("type") == "snapshot" and result["room"]["difficulty"] == "story":
                                break
                        else:
                            self.fail("active room became unresponsive during throttling")

                        limits.clock = lambda: original_clock() + ROOM_ACCESS_WINDOW_SECONDS + 1
                        await second.send_json({"type": "join", "code": code, "name": "GUEST"})
                        accepted = await second.receive_json(timeout=3)
                        self.assertEqual(accepted["type"], "welcome")
                        self.assertEqual(accepted["code"], code)
                        self.assertEqual(len(ENGINE.rooms[code].players), 2)
                    async with self.client.ws_connect(self.address) as replacement:
                        await replacement.send_json({"type": "reconnect",
                                                     "code": code, "token": original_pass})
                        recovered = await replacement.receive_json(timeout=3)
                        self.assertEqual(recovered["type"], "welcome")
                        self.assertNotEqual(recovered["token"], original_pass)
                finally:
                    limits.clock = original_clock
        finally:
            if code:
                ENGINE.rooms.pop(code, None)

    async def test_excessive_messages_close_connection(self):
        baseline = len(ENGINE.rooms)
        async with self.client.ws_connect(self.address) as ws:
            for _ in range(26):
                await ws.send_json({"type": "invalid_action"})
            for _ in range(35):
                msg = await ws.receive(timeout=3)
                if msg.type in (WSMsgType.CLOSE, WSMsgType.CLOSED, WSMsgType.ERROR):
                    break
            self.assertTrue(ws.closed or msg.type in (WSMsgType.CLOSE, WSMsgType.CLOSED),
                            "sending over 25 messages within one second must close the socket")
            self.assertEqual(ws.close_code, 1008)
        self.assertEqual(len(ENGINE.rooms), baseline)


if __name__ == "__main__":
    unittest.main()
