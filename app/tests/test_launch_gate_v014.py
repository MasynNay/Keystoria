"""Manual launch is an explicit server-side safety gate, not a UI illusion."""
import unittest

from server.content import MISSIONS
from server.game import GameEngine, GameError, DIFFICULTIES


class Clock:
    def __init__(self): self.now=100.0
    def __call__(self): return self.now
    def advance(self,seconds): self.now+=seconds


class LaunchGateTests(unittest.TestCase):
    def exercise(self,mission,solo):
        clock=Clock();game=GameEngine(clock)
        room,host=game.create('NOVA',mission,solo=solo)
        guest=None if solo else game.join(room.code,'SAGE')[1]
        game.start(room,host)
        game.ready(room,host)
        if guest:game.ready(room,guest)
        start_time=room.remaining
        with self.assertRaises(GameError): game.launch(room,host)
        clock.advance(10.1);game.tick(room)
        self.assertEqual('armed',room.phase)
        self.assertFalse(room.hack_target)
        self.assertFalse(room.threat_target)
        # Remaining here is safe even if the human needs a long time to read.
        clock.advance(240);game.tick(room)
        self.assertEqual('armed',room.phase)
        self.assertEqual(start_time,room.remaining)
        self.assertEqual({p.id for p in room.players if p.is_bot},room.launch_ready)
        if guest:
            game.launch(room,host)
            self.assertEqual('armed',room.phase)
            game.launch(room,host) # Duplicate from the same operator is idempotent.
            self.assertEqual('armed',room.phase)
            self.assertIn(host.id,game.view(room,guest)['launchReadyPlayers'])
            game.launch(room,guest)
        else:
            game.launch(room,host)
        self.assertEqual('playing',room.phase)
        self.assertEqual(start_time,room.remaining)
        self.assertIsNotNone(room.hack_target)
        self.assertIsNotNone(room.threat_target)
        with self.assertRaises(GameError):game.launch(room,host)
        clock.advance(2);game.tick(room)
        self.assertLess(room.remaining,start_time)

    def test_all_twenty_four_launch_paths(self):
        for mission in MISSIONS:
            for solo in (True,False):
                with self.subTest(mission=mission,solo=solo):self.exercise(mission,solo)

    def test_cannot_start_with_disconnected_partner(self):
        clock=Clock();game=GameEngine(clock)
        room,host=game.create('ALPHA','dead_air')
        _,guest=game.join(room.code,'BRAVO')
        game.start(room,host);game.ready(room,host);game.ready(room,guest)
        clock.advance(10.1);game.tick(room)
        game.disconnect(room,guest)
        with self.assertRaises(GameError):game.launch(room,host)
        game.reconnect(room.code,guest.token)
        game.launch(room,host);game.launch(room,guest)
        self.assertEqual('playing',room.phase)

    def test_rematch_resets_launch_confirmation(self):
        clock=Clock();game=GameEngine(clock)
        room,host=game.create('ALPHA','station',solo=True)
        game.start(room,host);game.ready(room,host)
        clock.advance(10.1);game.tick(room);game.launch(room,host)
        game._finish(room,True)
        game.rematch(room,host)
        self.assertEqual('lobby',room.phase)
        self.assertFalse(room.launch_ready)
        game.start(room,host);game.ready(room,host)
        clock.advance(10.1);game.tick(room)
        self.assertEqual('armed',room.phase)
        self.assertNotIn(host.id,room.launch_ready)

if __name__ == '__main__':unittest.main()
