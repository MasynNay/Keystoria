"""Verify the game ticker delivers terminal snapshots over actual WebSockets.

A server-side victory or defeat is not useful unless the browser learns about it;
these tests exercise the production broadcast loop, not just the room engine.
"""
from __future__ import annotations

import asyncio
import unittest
from unittest.mock import patch

from aiohttp import ClientSession, web

from server import app as server_app
from server.game import GameEngine


class Clock:
    def __init__(self):
        self.value = 100.0

    def __call__(self):
        return self.value

    def advance(self, seconds):
        self.value += seconds


async def snapshot(ws, *, phase=None):
    for _ in range(75):
        message = await asyncio.wait_for(ws.receive_json(), timeout=4)
        if message.get('type') != 'snapshot':
            continue
        state = message['room']
        if phase is None or state['phase'] == phase:
            return state
    raise AssertionError(f'Never received snapshot phase={phase!r}')


class FinalSnapshotDeliveryTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.clock = Clock()
        self.engine = GameEngine(self.clock)
        self.patch = patch.object(server_app, 'ENGINE', self.engine)
        self.patch.start()
        self.runner = web.AppRunner(server_app.create_app())
        await self.runner.setup()
        self.site = web.TCPSite(self.runner, '127.0.0.1', 0)
        await self.site.start()
        self.address = f'http://127.0.0.1:{self.site._server.sockets[0].getsockname()[1]}'
        self.session = ClientSession()

    async def asyncTearDown(self):
        await self.session.close()
        await self.runner.cleanup()
        self.patch.stop()

    async def test_duo_timer_loss_reaches_both_screens_and_rematch(self):
        async with self.session.ws_connect(self.address + '/ws') as host:
            await host.send_json({'type': 'create', 'name': 'FIRST', 'mission': 'hollow'})
            welcome = await host.receive_json()
            self.assertEqual(welcome['type'], 'welcome')
            await snapshot(host, phase='lobby')
            async with self.session.ws_connect(self.address + '/ws') as partner:
                await partner.send_json({'type':'join', 'name':'SECOND', 'code':welcome['code']})
                self.assertEqual((await partner.receive_json())['type'], 'welcome')
                await snapshot(partner, phase='lobby')
                await host.send_json({'type':'start'})
                await host.send_json({'type':'ready'})
                await partner.send_json({'type':'ready'})
                await snapshot(host, phase='countdown')
                self.clock.advance(10.1)
                await snapshot(host, phase='armed')
                await host.send_json({'type':'launch'})
                await partner.send_json({'type':'launch'})
                await snapshot(host, phase='playing')
                await snapshot(partner, phase='playing')
                self.clock.advance(250)
                a = await snapshot(host, phase='lost')
                b = await snapshot(partner, phase='lost')
                for state in (a,b):
                    self.assertIn('clock', state['finishReason'])
                    self.assertEqual(state['finalGrade'], 'F')
                await host.send_json({'type':'rematch'})
                await snapshot(host, phase='lobby')
                await snapshot(partner, phase='lobby')

    async def test_solo_bot_final_action_reaches_outbreak_results_screen(self):
        async with self.session.ws_connect(self.address + '/ws') as host:
            await host.send_json({'type':'create','name':'TESTER','mission':'outbreak','solo':True})
            self.assertEqual((await host.receive_json())['type'],'welcome')
            await snapshot(host, phase='lobby')
            await host.send_json({'type':'start'})
            await host.send_json({'type':'ready'})
            await snapshot(host, phase='countdown')
            self.clock.advance(10.1)
            await snapshot(host, phase='armed')
            await host.send_json({'type':'launch'})
            await snapshot(host, phase='playing')
            room = next(iter(self.engine.rooms.values()))
            # Reproduce a legitimate last-command AI resolution on the tick;
            # previous builds dropped this final snapshot because the phase
            # changed to 'won' before the broadcast filter ran.
            room.stage = 2
            room.progress = 5
            room.crisis_triggered = True
            room.crisis_active = False
            self.engine._new_hack(room)
            room.next_bot_at = self.clock() - 1
            final = await snapshot(host, phase='won')
            self.assertTrue(final['solo'])
            self.assertEqual(final['mission'],'outbreak')
            self.assertEqual(final['overallProgress'],100)
            self.assertEqual(final['objectivesComplete'],11)
            self.assertTrue(final['finishReason'])
            await host.send_json({'type':'rematch'})
            await snapshot(host, phase='lobby')


if __name__ == '__main__':
    unittest.main()
