"""Deployment grace-period invariants for solo and duo games."""
import unittest
from server.game import GameEngine


class Clock:
    def __init__(self):
        self.now = 100.0
    def __call__(self):
        return self.now
    def advance(self, seconds):
        self.now += seconds


class DeploymentTests(unittest.TestCase):
    def test_no_time_or_attack_progress_during_preparation(self):
        for solo in (True, False):
            with self.subTest(solo=solo):
                clock = Clock()
                engine = GameEngine(clock)
                room, host = engine.create('ALPHA', 'dead_air', solo=solo)
                guest = None if solo else engine.join(room.code, 'BETA')[1]
                engine.start(room, host)
                engine.ready(room, host)
                if guest:
                    engine.ready(room, guest)
                self.assertEqual(room.phase, 'countdown')
                initial = room.remaining
                self.assertIsNone(room.hack_target)
                for elapsed in (3.0, 2.5, 3.9):
                    clock.advance(elapsed)
                    engine.tick(room)
                    self.assertEqual('countdown', room.phase)
                    self.assertEqual(initial, room.remaining)
                    self.assertIsNone(room.hack_target)
                clock.advance(.7)
                engine.tick(room)
                self.assertEqual('armed', room.phase)
                self.assertEqual(initial, room.remaining)
                with self.assertRaises(Exception):
                    engine.submit(room, host, 'fake', 'fake')
                engine.launch(room, host)
                if guest: engine.launch(room, guest)
                self.assertEqual('playing', room.phase)
                self.assertEqual(initial, room.remaining)
                self.assertIsNotNone(room.hack_target)
                self.assertIsNotNone(room.threat_target)
