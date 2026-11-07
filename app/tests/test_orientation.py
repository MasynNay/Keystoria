"""Narrative briefing, synchronized launch and evidence persistence invariants."""
import unittest

from server.content import MISSIONS, PUBLIC_MISSIONS
from server.game import GameEngine, GameError, DIFFICULTIES


class Clock:
    def __init__(self):
        self.value = 200.0

    def __call__(self):
        return self.value

    def advance(self, seconds):
        self.value += seconds


class OrientationTests(unittest.TestCase):
    def setUp(self):
        self.clock = Clock()
        self.engine = GameEngine(self.clock)
        self.room, self.host = self.engine.create("ALPHA", "casefile")
        _, self.guest = self.engine.join(self.room.code, "BETA")

    def briefing(self):
        self.engine.start(self.room, self.host)
        self.assertEqual("briefing", self.room.phase)

    def begin(self):
        self.briefing()
        self.engine.ready(self.room, self.host)
        self.engine.ready(self.room, self.guest)
        self.clock.advance(10.1)
        self.engine.tick(self.room)
        self.assertEqual("armed", self.room.phase)
        self.engine.launch(self.room, self.host)
        self.engine.launch(self.room, self.guest)
        self.assertEqual("playing", self.room.phase)

    def test_every_story_explains_both_roles_and_stakes(self):
        self.assertEqual(set(MISSIONS), set(PUBLIC_MISSIONS))
        for mission, content in PUBLIC_MISSIONS.items():
            with self.subTest(mission=mission):
                briefing = content["briefing"]
                for key in ("chapter", "opening", "hacker", "defender", "stakes", "outro"):
                    self.assertGreater(len(briefing[key]), 24)
                self.assertEqual(2, len(briefing["stageObjectives"]))

    def test_host_opens_briefing_not_gameplay(self):
        self.briefing()
        self.assertEqual(DIFFICULTIES["standard"]["seconds"], self.room.remaining)
        self.assertIsNone(self.room.hack_target)
        self.assertIsNone(self.room.threat_target)
        self.clock.advance(45)
        self.engine.tick(self.room)
        self.assertEqual("briefing", self.room.phase)
        self.assertEqual(DIFFICULTIES["standard"]["seconds"], self.room.remaining)
        with self.assertRaises(GameError):
            self.engine.submit(self.room, self.host, "fake", "anything")

    def test_both_humans_must_read_and_confirm(self):
        self.briefing()
        self.engine.ready(self.room, self.host)
        self.engine.ready(self.room, self.host)  # Duplicate ready is idempotent.
        self.assertEqual("briefing", self.room.phase)
        self.assertEqual({self.host.id}, self.room.briefing_ready)
        self.engine.ready(self.room, self.guest)
        self.assertEqual("countdown", self.room.phase)
        self.clock.advance(2.0)
        self.engine.tick(self.room)
        self.assertEqual("countdown", self.room.phase)
        self.assertEqual(210, self.room.remaining)
        self.assertIsNone(self.room.hack_target)
        self.clock.advance(8.1)
        self.engine.tick(self.room)
        self.assertEqual("armed", self.room.phase)
        self.engine.launch(self.room, self.host)
        self.engine.launch(self.room, self.guest)
        self.assertEqual("playing", self.room.phase)
        self.assertEqual(210, self.room.remaining)
        self.assertIsNotNone(self.room.hack_target)
        self.assertIsNotNone(self.room.threat_target)
        with self.assertRaises(GameError):
            self.engine.ready(self.room, self.host)

    def test_solo_ai_confirms_briefing_without_external_dependency(self):
        room, human = self.engine.create("ONE", "station", solo=True)
        self.engine.start(room, human)
        self.assertEqual(1, len(room.briefing_ready))
        self.engine.ready(room, human)
        self.assertEqual("countdown", room.phase)
        self.clock.advance(10.1)
        self.engine.tick(room)
        self.assertEqual("armed", room.phase)
        self.engine.launch(room, human)
        self.assertEqual("playing", room.phase)
        self.assertEqual("hacker", room.role_for(human.id))

    def test_reconnect_during_countdown_does_not_skip_time(self):
        self.briefing()
        self.engine.ready(self.room, self.host)
        self.engine.ready(self.room, self.guest)
        deadline = self.room.countdown_until
        self.engine.disconnect(self.room, self.guest)
        self.clock.advance(20)
        self.engine.tick(self.room)
        self.assertEqual("countdown", self.room.phase)
        self.engine.reconnect(self.room.code, self.guest.token)
        self.assertAlmostEqual(deadline + 20, self.room.countdown_until)
        self.clock.advance(10.1)
        self.engine.tick(self.room)
        self.assertEqual("armed", self.room.phase)
        self.engine.launch(self.room, self.host)
        self.engine.launch(self.room, self.guest)
        self.assertEqual("playing", self.room.phase)

    def test_investigator_must_deduce_killer_before_final_command(self):
        self.begin()
        # Reach the second stage with a valid two-person tactical maneuver.
        for _ in range(3):
            target = self.room.hack_target.copy()
            self.engine.submit(self.room, self.host, target["id"], target["text"])
            self.clock.advance(.2)
        self.engine.choose_tactic(self.room, self.host, "backup")
        target = self.room.threat_target.copy()
        self.engine.submit(self.room, self.guest, target["id"], target["text"])
        self.clock.advance(.2)
        for _ in range(2):
            target = self.room.hack_target.copy()
            self.engine.submit(self.room, self.host, target["id"], target["text"])
            self.clock.advance(.2)
        self.clock.advance(10.5)
        self.engine.tick(self.room)
        self.assertEqual(2, self.room.stage)
        for _ in range(5):
            if self.room.crisis_active:
                target = self.room.threat_target.copy()
                self.engine.submit(self.room, self.host, target["id"], target["text"])
                self.clock.advance(.2)
            target = self.room.hack_target.copy()
            self.engine.submit(self.room, self.guest, target["id"], target["text"])
            self.clock.advance(.2)
        self.assertTrue(self.room.accusation_active)
        self.assertIsNone(self.room.hack_target)
        self.assertEqual(5, self.room.progress)
        self.assertEqual(6, len(self.room.discoveries))
        with self.assertRaises(GameError):
            self.engine.accuse(self.room, self.host, "vale")
        with self.assertRaises(GameError):
            self.engine.accuse(self.room, self.guest, "unknown")
        before = self.room.stability
        self.engine.accuse(self.room, self.guest, "pierce")
        self.assertEqual(before - 10, self.room.stability)
        self.assertTrue(self.room.accusation_active)
        with self.assertRaises(GameError):
            self.engine.accuse(self.room, self.guest, "vale")
        self.clock.advance(2.1)
        self.engine.accuse(self.room, self.guest, "vale")
        self.assertEqual("MARA VALE", self.room.accusation_verdict)
        self.assertIsNotNone(self.room.hack_target)
        final = self.room.hack_target.copy()
        self.engine.submit(self.room, self.guest, final["id"], final["text"])
        self.assertEqual("won", self.room.phase)
        self.assertEqual(7, len(self.room.discoveries))
        view = self.engine.view(self.room, self.guest)
        self.assertEqual("MARA VALE", view["accusationVerdict"])
        self.assertEqual(2, view["accusationAttempts"])

    def test_solo_ai_can_make_a_deduction_without_becoming_stuck(self):
        room, human = self.engine.create("SOLO", "casefile", solo=True)
        self.engine.start(room, human)
        self.engine.ready(room, human)
        self.clock.advance(10.1)
        self.engine.tick(room)
        self.engine.launch(room, human)
        room.stage = 2
        room.progress = 5
        room.accusation_triggered = room.accusation_active = True
        room.hack_target = None
        self.engine._bot_action(room, self.clock())
        self.assertFalse(room.accusation_active)
        self.assertEqual("MARA VALE", room.accusation_verdict)
        self.assertIsNotNone(room.hack_target)

    def test_case_evidence_is_progressive_and_visible_on_result(self):
        self.begin()
        visible = self.engine.view(self.room, self.host)
        self.assertEqual([], visible["discovered"])
        self.assertEqual("", visible["missionInfo"]["briefing"]["outro"])
        for _ in range(3):
            target = self.room.hack_target.copy()
            self.engine.submit(self.room, self.host, target["id"], target["text"])
            self.clock.advance(.2)
        self.assertTrue(self.room.tactic_active)
        self.assertEqual(2, len(self.room.discoveries))
        self.assertIn("ARCHIVE ENTRY", self.room.discoveries[0])
        self.engine._finish(self.room, True)
        result = self.engine.view(self.room, self.host)
        self.assertEqual(2, len(result["discovered"]))
        self.assertIn("Mara Vale", result["missionInfo"]["briefing"]["outro"])
        self.engine.rematch(self.room, self.host)
        self.assertEqual([], self.room.discoveries)
        self.assertEqual(set(), self.room.briefing_ready)


if __name__ == "__main__":
    unittest.main()
