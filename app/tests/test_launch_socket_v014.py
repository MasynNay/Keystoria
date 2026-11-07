"""Two real WebSocket clients must each consent before mission time starts."""
import unittest
from aiohttp import ClientSession, web
from server.app import ENGINE, create_app


async def phase_snapshot(socket, wanted):
    for _ in range(35):
        message = await socket.receive_json(timeout=2.0)
        if message.get('type') == 'snapshot' and message['room']['phase'] == wanted:
            return message['room']
    raise AssertionError(f'Did not receive phase={wanted}')


class WebSocketLaunchTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.runner=web.AppRunner(create_app())
        await self.runner.setup()
        self.site=web.TCPSite(self.runner,'127.0.0.1',0)
        await self.site.start()
        self.port=self.site._server.sockets[0].getsockname()[1]
        self.client=ClientSession()

    async def asyncTearDown(self):
        await self.client.close()
        await self.runner.cleanup()

    async def test_duo_requires_both_play_buttons(self):
        address=f'http://127.0.0.1:{self.port}/ws'
        async with self.client.ws_connect(address) as alpha:
            await alpha.send_json({'type':'create','name':'ALPHA','mission':'dead_air'})
            welcome=await alpha.receive_json()
            self.assertEqual('welcome',welcome['type'])
            room_code=welcome['code']
            await phase_snapshot(alpha,'lobby')
            async with self.client.ws_connect(address) as beta:
                await beta.send_json({'type':'join','name':'BETA','code':room_code})
                self.assertEqual('welcome',(await beta.receive_json())['type'])
                await phase_snapshot(beta,'lobby')
                await alpha.send_json({'type':'start'})
                await alpha.send_json({'type':'ready'})
                await beta.send_json({'type':'ready'})
                await phase_snapshot(alpha,'countdown')
                room=ENGINE.rooms[room_code]
                before=room.remaining
                room.countdown_until=ENGINE.clock()-.001
                armed=await phase_snapshot(alpha,'armed')
                self.assertEqual(before,armed['remaining'])
                await alpha.send_json({'type':'launch'})
                waiting=await phase_snapshot(beta,'armed')
                # Even if a stale armed frame arrived first, the server-owned
                # phase and initial mission health cannot have changed.
                self.assertEqual('armed',room.phase)
                self.assertEqual(before,room.remaining)
                self.assertIsNone(room.threat_target)
                await beta.send_json({'type':'launch'})
                a=await phase_snapshot(alpha,'playing')
                b=await phase_snapshot(beta,'playing')
                self.assertIsNotNone(a['target'])
                self.assertIsNotNone(b['target'])
                self.assertEqual(before,a['remaining'])
                self.assertEqual(before,b['remaining'])
        ENGINE.rooms.pop(room_code,None)

if __name__ == '__main__':unittest.main()
