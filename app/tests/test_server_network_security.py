"""Loopback default and real WebSocket negative controls for LOCAL play only.

These tests do not authorize an internet-facing hosted co-op service.
"""
from __future__ import annotations

import asyncio
import unittest

from aiohttp import ClientSession, WSMsgType, WSServerHandshakeError, web
from server.app import ENGINE, SOCKET_LIMITS_KEY, create_app, local_bind_host
from server.socket_limits import (
    SocketLimits, MAX_OPEN_SOCKETS, MAX_SOCKETS_PER_PEER,
    MAX_CREATES_PER_PEER, CREATE_WINDOW_SECONDS, MAX_TRACKED_CREATE_PEERS,
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
