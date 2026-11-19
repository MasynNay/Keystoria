"""Loopback default and real WebSocket negative controls for LOCAL play only.

These tests do not authorize an internet-facing hosted co-op service.
"""
from __future__ import annotations

import asyncio
import unittest

from aiohttp import ClientSession, WSMsgType, WSServerHandshakeError, web
from server.app import ENGINE, create_app, local_bind_host


class LocalBindTests(unittest.TestCase):
    def test_normal_cli_defaults_to_loopback(self):
        self.assertEqual(local_bind_host({}), "127.0.0.1")
        self.assertEqual(local_bind_host({"HOST": ""}), "127.0.0.1")
        self.assertEqual(local_bind_host({"HOST": "  "}), "127.0.0.1")

    def test_lan_requires_explicit_override(self):
        self.assertEqual(local_bind_host({"HOST": "0.0.0.0"}), "0.0.0.0")
        self.assertEqual(local_bind_host({"HOST": " :: "}), "::")
        self.assertEqual(local_bind_host({"HOST": "192.0.2.12"}), "192.0.2.12")


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
