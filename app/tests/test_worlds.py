"""World-specific missions: decisions, failures and reconnection invariants."""
import unittest

from server.game import GameEngine, GameError
from server.mechanics import WORLD_RULES, risk_level, public_world


class Clock:
    def __init__(self):
        self.value = 100.0

    def __call__(self):
        return self.value

    def advance(self, amount=0.2):
        self.value += amount


class WorldRulesTests(unittest.TestCase):
    def setUp(self):
        self.clock = Clock()
        self.engine = GameEngine(self.clock)

    def create(self, world):
        room, hacker = self.engine.create("NOVA", world)
        _, defender = self.engine.join(room.code, "ASH")
        self.engine.start(room, hacker)
        self.engine.ready(room, hacker)
        self.engine.ready(room, defender)
        self.clock.advance(10.1)
        self.engine.tick(room)
        self.engine.launch(room, hacker)
        self.engine.launch(room, defender)
        return room, hacker, defender

    def submit(self, room, player, kind):
        target = room.hack_target if kind == "hack" else room.threat_target
        self.assertIsNotNone(target)
        success = self.engine.submit(room, player, target["id"], target["text"])
        self.assertTrue(success)
        self.clock.advance()

    def reach_encounter(self, room, hacker):
        for _ in range(3):
            self.submit(room, hacker, "hack")
        self.assertTrue(room.tactic_active)
        self.assertIsNone(room.hack_target)
        self.assertEqual(3, room.progress)

    def test_every_world_reaches_a_different_tactical_choice(self):
        for world in WORLD_RULES:
            with self.subTest(world=world):
                self.setUp()
                room, hacker, defender = self.create(world)
                self.reach_encounter(room, hacker)
                self.assertEqual(2, len(self.engine.view(room, hacker)["tacticOptions"]))
                with self.assertRaises(GameError):
                    self.engine.choose_tactic(room, defender, "vent")
                self.assertNotIn("phrase", str(public_world(world)))
                first_choice = next(iter(WORLD_RULES[world]["choices"]))
                before = room.ambient
                self.engine.choose_tactic(room, hacker, first_choice)
                self.assertIsNone(room.hack_target)
                self.assertTrue(room.threat_target["critical"])
                self.assertEqual([], self.engine.view(room, hacker)["tacticOptions"])
                self.assertIsNone(self.engine.view(room, hacker)["target"])
                self.assertEqual(room.threat_target["text"], self.engine.view(room, defender)["target"]["text"])
                self.submit(room, defender, "defense")
                self.assertFalse(room.tactic_active)
                self.assertIsNotNone(room.hack_target)
                self.assertNotEqual(before, room.ambient)

    def test_every_world_can_complete_the_full_game(self):
        for world in WORLD_RULES:
            for choice in WORLD_RULES[world]["choices"]:
                with self.subTest(world=world, choice=choice):
                    self.setUp()
                    room, host, guest = self.create(world)
                    self.reach_encounter(room, host)
                    self.engine.choose_tactic(room, host, choice)
                    self.submit(room, guest, "defense")
                    for _ in range(2):
                        self.submit(room, host, "hack")
                    self.assertEqual("switching", room.phase)
                    self.clock.advance(5)
                    self.engine.tick(room)
                    self.assertEqual("playing", room.phase)
                    for _ in range(6):
                        if room.crisis_active:
                            self.submit(room, host, "defense")
                        if room.accusation_active:
                            self.engine.accuse(room, guest, "vale")
                        self.submit(room, guest, "hack")
                    self.assertEqual("won", room.phase)
                    self.assertGreater(room.final_score, 0)
                    self.assertEqual(6, room.progress)  # Stage 2 contains six commands.

    def test_tactical_choice_cannot_be_replayed_or_forged(self):
        room, hacker, defender = self.create("hollow")
        with self.assertRaises(GameError):
            self.engine.choose_tactic(room, hacker, "lantern")
        self.reach_encounter(room, hacker)
        with self.assertRaises(GameError):
            self.engine.choose_tactic(room, hacker, "secret-plan")
        self.engine.choose_tactic(room, hacker, "lantern")
        with self.assertRaises(GameError):
            self.engine.choose_tactic(room, hacker, "sigil")
        self.submit(room, defender, "defense")
        with self.assertRaises(GameError):
            self.engine.choose_tactic(room, hacker, "lantern")

    def test_expired_tactical_order_uses_fallback_instead_of_softlock(self):
        room, hacker, _ = self.create("station")
        self.reach_encounter(room, hacker)
        self.engine.choose_tactic(room, hacker, "vent")
        self.clock.advance(room.threat_total + 0.2)
        self.engine.tick(room)
        self.assertFalse(room.tactic_active)
        self.assertIsNotNone(room.hack_target)
        self.assertGreater(room.stability, 0)
        self.assertGreater(room.progress, 0)
        self.assertIn("Emergency bypass", " ".join(row["message"] for row in room.logs))

    def test_pressure_failures_are_distinct_from_integrity(self):
        for world in WORLD_RULES:
            with self.subTest(world=world):
                self.setUp()
                room, _, _ = self.create(world)
                room.ambient = 98 if WORLD_RULES[world]["direction"] == "high" else 2
                self.engine._change_ambient(room, 4 if world != "outbreak" else -4)
                self.assertEqual("lost", room.phase)
                self.assertGreater(room.stability, 0)
                self.assertEqual("F", room.final_grade)

    def test_ambient_danger_changes_threat_speed(self):
        room, _, _ = self.create("station")
        base = room.threat_total
        room.ambient = 78
        self.assertTrue(risk_level("station", room.ambient))
        self.engine._new_threat(room, self.clock())
        self.assertLess(room.threat_total, base)

    def test_reconnect_pauses_threats_and_bot_tasks(self):
        room, _, defender = self.create("station")
        deadline = room.threat_due
        self.engine.disconnect(room, defender)
        self.clock.advance(15)
        self.engine.tick(room)
        self.engine.reconnect(room.code, defender.token)
        self.assertAlmostEqual(deadline + 15, room.threat_due)
        self.clock.advance(0.5)
        self.engine.tick(room)
        self.assertIsNotNone(room.threat_target)

    def test_reconnect_pauses_switch_animation_too(self):
        room, hacker, defender = self.create("station")
        self.reach_encounter(room, hacker)
        self.engine.choose_tactic(room, hacker, "vent")
        self.submit(room, defender, "defense")
        self.submit(room, hacker, "hack")
        self.submit(room, hacker, "hack")
        self.assertEqual("switching", room.phase)
        deadline = room.switch_until
        self.engine.disconnect(room, defender)
        self.clock.advance(12)
        self.engine.reconnect(room.code, defender.token)
        self.assertAlmostEqual(deadline + 12, room.switch_until)
        self.clock.advance(3)
        self.engine.tick(room)
        self.assertEqual("switching", room.phase)
        self.clock.advance(1.5)
        self.engine.tick(room)
        self.assertEqual("playing", room.phase)

    def test_abandoned_lobby_can_assign_a_new_host(self):
        room, original = self.engine.create("ORIGINAL", "hollow")
        self.engine.disconnect(room, original)
        self.clock.advance(31)
        self.engine.tick(room)
        self.assertEqual(0, len(room.players))
        _, replacement = self.engine.join(room.code, "REPLACEMENT")
        self.assertEqual(replacement.id, room.host_id)
        self.assertEqual(1, len(room.players))

    def test_rematch_clears_world_and_tactic_state(self):
        room, hacker, defender = self.create("outbreak")
        self.reach_encounter(room, hacker)
        self.engine.choose_tactic(room, hacker, "reinforce")
        self.engine._finish(room, False)
        old_run = room.run_id
        self.engine.rematch(room, hacker)
        self.engine.start(room, hacker)
        self.engine.ready(room, hacker)
        self.engine.ready(room, defender)
        self.clock.advance(10.1)
        self.engine.tick(room)
        self.engine.launch(room, hacker)
        self.engine.launch(room, defender)
        self.assertNotEqual(old_run, room.run_id)
        self.assertEqual(WORLD_RULES["outbreak"]["initial"], room.ambient)
        self.assertFalse(room.tactic_active)
        self.assertFalse(room.tactic_triggered)
        self.assertEqual(0, room.threat_bonus)


if __name__ == "__main__":
    unittest.main()
