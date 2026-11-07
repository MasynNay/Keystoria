"""Two live WebSocket clients see the same authoritative world intervention."""
from __future__ import annotations

import unittest

from aiohttp import ClientSession, web
from server.app import ENGINE, create_app
from tests import test_api as protocol


class FieldWebSocketTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.runner = web.AppRunner(create_app())
        await self.runner.setup()
        self.site = web.TCPSite(self.runner, '127.0.0.1', 0)
        await self.site.start()
        self.port = self.site._server.sockets[0].getsockname()[1]
        self.session = ClientSession()

    async def asyncTearDown(self):
        await self.session.close()
        await self.runner.cleanup()

    async def test_two_players_receive_the_same_choice_and_duplicate_is_denied(self):
        endpoint = f'http://127.0.0.1:{self.port}/ws'
        async with self.session.ws_connect(endpoint) as host:
            await host.send_json({'type': 'create', 'name': 'RAVEN', 'mission': 'last_stop'})
            code = (await protocol.receive_type(host, 'welcome'))['code']
            await protocol.receive_type(host, 'snapshot')
            async with self.session.ws_connect(endpoint) as guest:
                await guest.send_json({'type': 'join', 'name': 'GHOST', 'code': code})
                await protocol.receive_type(guest, 'welcome')
                await protocol.receive_type(guest, 'snapshot')
                room = ENGINE.rooms[code]
                room.phase = 'playing'
                room.progress = 1
                room.last_tick = ENGINE.clock()
                room.hack_target = None
                await guest.send_json({'type': 'field_action', 'action': 'brake'})
                async def updated(socket):
                    for _ in range(25):
                        view = (await protocol.receive_type(socket, 'snapshot'))['room']
                        if view['fieldOps']['selected'] == 'brake':
                            return view
                    raise AssertionError('Field decision not delivered to operator')
                first = await updated(host)
                second = await updated(guest)
                for view in (first, second):
                    self.assertEqual('brake', view['fieldOps']['selected'])
                    self.assertTrue(view['fieldOps']['used'])
                    self.assertFalse(view['fieldOps']['available'])
                    self.assertIn('CHARGE RESERVE AIR BRAKES', view['fieldOps']['history'][0]['label'])
                await host.send_json({'type':'field_action', 'action':'clear'})
                rejected = await protocol.receive_type(host, 'error')
                self.assertIn('already committed', rejected['message'])
                self.assertEqual(len(room.field_history), 1)
        ENGINE.rooms.pop(code, None)


if __name__ == '__main__':
    unittest.main()
