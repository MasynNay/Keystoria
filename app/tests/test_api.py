"""Real HTTP/WebSocket integration: two independent clients sharing a room."""
import unittest
import asyncio

from aiohttp import ClientSession, web
from server.app import create_app


async def receive_type(ws, wanted):
    for _ in range(180):
        event = await ws.receive_json(timeout=3)
        if event.get("type") == wanted:
            return event
    raise AssertionError(f"No {wanted} message received")


class WebSocketTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.runner = web.AppRunner(create_app())
        await self.runner.setup()
        self.site = web.TCPSite(self.runner, "127.0.0.1", 0)
        await self.site.start()
        self.port = self.site._server.sockets[0].getsockname()[1]
        self.session = ClientSession()

    async def asyncTearDown(self):
        await self.session.close()
        await self.runner.cleanup()

    async def test_cross_site_websocket_origin_is_rejected(self):
        from aiohttp import WSServerHandshakeError

        with self.assertRaises(WSServerHandshakeError) as result:
            await self.session.ws_connect(
                f"http://127.0.0.1:{self.port}/ws",
                headers={"Origin": "https://unrelated.example"},
            )
        self.assertEqual(403, result.exception.status)

    async def test_difficulty_pings_and_pulse_validation_over_websocket(self):
        """Exercise the real socket protocol, rather than bypassing the app router."""
        address = f"http://127.0.0.1:{self.port}"
        async with self.session.ws_connect(address + "/ws") as ws:
            await ws.send_json({"type": "create", "name": "RAVEN", "mission": "outbreak", "solo": True})
            await receive_type(ws, "welcome")
            await receive_type(ws, "snapshot")
            await ws.send_json({"type": "difficulty", "difficulty": "overdrive"})
            for _ in range(20):
                state = (await receive_type(ws, "snapshot"))["room"]
                if state["difficulty"] == "overdrive":
                    break
            self.assertEqual("Overdrive", state["difficultyLabel"])
            await ws.send_json({"type": "start"})
            await ws.send_json({"type": "ready"})
            for _ in range(50):
                state = (await receive_type(ws, "snapshot"))["room"]
                if state["phase"] == "armed":
                    break
            self.assertEqual("armed",state["phase"])
            await ws.send_json({"type":"launch"})
            while state["phase"] != "playing":
                state = (await receive_type(ws, "snapshot"))["room"]
            self.assertEqual(165, state["remaining"])
            await ws.send_json({"type": "ping", "code": "help"})
            for _ in range(20):
                state = (await receive_type(ws, "snapshot"))["room"]
                if any("REQUESTING SUPPORT" in item["message"] for item in state["logs"]):
                    break
            self.assertTrue(any("REQUESTING SUPPORT" in item["message"] for item in state["logs"]))
            await ws.send_json({"type": "pulse"})
            error = await receive_type(ws, "error")
            self.assertIn("Both operators", error["message"])

    async def test_tactical_decision_relay_over_two_real_websockets(self):
        """Hacker selects a plan; only the defender receives its execution phrase."""
        address = f"http://127.0.0.1:{self.port}"
        async with self.session.ws_connect(address + "/ws") as host:
            await host.send_json({"type": "create", "name": "ALPHA", "mission": "station"})
            code = (await receive_type(host, "welcome"))["code"]
            await receive_type(host, "snapshot")
            async with self.session.ws_connect(address + "/ws") as guest:
                await guest.send_json({"type": "join", "name": "BETA", "code": code})
                await receive_type(guest, "welcome")
                await receive_type(guest, "snapshot")
                await host.send_json({"type": "start"})
                await host.send_json({"type": "ready"})
                await guest.send_json({"type": "ready"})
                state = (await receive_type(host, "snapshot"))["room"]
                while state["phase"] != "armed":
                    state = (await receive_type(host, "snapshot"))["room"]
                await host.send_json({"type":"launch"})
                await guest.send_json({"type":"launch"})
                while state["phase"] != "playing":
                    state = (await receive_type(host, "snapshot"))["room"]
                for expected in range(1, 4):
                    target = state["target"]
                    await host.send_json({"type": "submit", "targetId": target["id"], "value": target["text"]})
                    state = (await receive_type(host, "snapshot"))["room"]
                    for _ in range(20):
                        if state["progress"] == expected:
                            break
                        state = (await receive_type(host, "snapshot"))["room"]
                    self.assertEqual(expected, state["progress"])
                    await asyncio.sleep(.16)
                self.assertTrue(state["tacticActive"])
                self.assertIsNone(state["target"])
                self.assertEqual(2, len(state["tacticOptions"]))
                await guest.send_json({"type": "tactic", "choice": "vent"})
                self.assertIn("current hacker", (await receive_type(guest, "error"))["message"])
                await host.send_json({"type": "tactic", "choice": "vent"})
                defender = (await receive_type(guest, "snapshot"))["room"]
                for _ in range(20):
                    if defender["tacticChoice"] == "vent":
                        break
                    defender = (await receive_type(guest, "snapshot"))["room"]
                self.assertTrue(defender["target"]["critical"])
                self.assertIn("plasma", defender["target"]["text"])
                await guest.send_json({"type": "submit", "targetId": defender["target"]["id"], "value": defender["target"]["text"]})
                resumed = (await receive_type(host, "snapshot"))["room"]
                for _ in range(20):
                    if not resumed["tacticActive"]:
                        break
                    resumed = (await receive_type(host, "snapshot"))["room"]
                self.assertFalse(resumed["tacticActive"])
                self.assertIsNotNone(resumed["target"])
                self.assertEqual("hacker", resumed["role"])

    async def test_two_player_join_start_and_asymmetric_tasks(self):
        address = f"http://127.0.0.1:{self.port}"
        async with self.session.get(address + "/health") as response:
            self.assertEqual(200, response.status)
            self.assertEqual("ok", (await response.json())["status"])
        async with self.session.ws_connect(address + "/ws") as host:
            await host.send_json({"type": "create", "name": "MAVERICK", "mission": "hollow"})
            welcome = await receive_type(host, "welcome")
            code = welcome["code"]
            await receive_type(host, "snapshot")
            async with self.session.ws_connect(address + "/ws") as guest:
                await guest.send_json({"type": "join", "name": "PHANTOM", "code": code})
                await receive_type(guest, "welcome")
                joined = (await receive_type(guest, "snapshot"))["room"]
                self.assertEqual(2, len(joined["players"]))
                self.assertEqual("hollow", joined["mission"])
                await host.send_json({"type": "start"})
                await host.send_json({"type": "ready"})
                await guest.send_json({"type": "ready"})
                a = (await receive_type(host, "snapshot"))["room"]
                while a["phase"] != "armed":
                    a = (await receive_type(host, "snapshot"))["room"]
                await host.send_json({"type":"launch"})
                await guest.send_json({"type":"launch"})
                while a["phase"] != "playing":
                    a = (await receive_type(host, "snapshot"))["room"]
                b = (await receive_type(guest, "snapshot"))["room"]
                while b["phase"] != "playing":
                    b = (await receive_type(guest, "snapshot"))["room"]
                self.assertEqual("hacker", a["role"])
                self.assertEqual("defender", b["role"])
                self.assertNotEqual(a["target"]["id"], b["target"]["id"])
                self.assertIn(a["target"]["text"], [
                    "light the candles", "turn the key", "break the seal", "read the diary",
                    "trace the sigil", "uncover the truth", "name the spirit", "unlock the cellar",
                    "follow the footsteps", "break the mirror", "lift the curse", "open the iron gate",
                    "speak the old words", "reveal the passage", "restore the circle", "release the trapped soul",
                ])
                await host.send_json({"type": "submit", "targetId": a["target"]["id"], "value": a["target"]["text"]})
                updated = (await receive_type(host, "snapshot"))["room"]
                while updated["progress"] == 0:
                    updated = (await receive_type(host, "snapshot"))["room"]
                self.assertEqual(1, updated["progress"])
                self.assertEqual(100, updated["stability"])


if __name__ == "__main__":
    unittest.main()
