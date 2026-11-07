"""State-machine tests: no network or browser dependency required."""
import unittest

from server.game import GameEngine, GameError, MISSION_SECONDS, RECONNECT_GRACE
from server.mechanics import WORLD_RULES


class FakeTime:
    def __init__(self):
        self.value = 100.0
    def __call__(self):
        return self.value
    def step(self, seconds):
        self.value += seconds


class EngineTests(unittest.TestCase):
    def setUp(self):
        self.clock = FakeTime()
        self.game = GameEngine(self.clock)
        self.room, self.host = self.game.create("CAPTAIN", "station")
        self.room, self.guest = self.game.join(self.room.code.lower(), "GHOST")

    def launch(self):
        self.game.start(self.room, self.host)
        self.game.ready(self.room, self.host)
        self.game.ready(self.room, self.guest)
        self.clock.step(10.1)
        self.game.tick(self.room)
        self.game.launch(self.room, self.host)
        self.game.launch(self.room, self.guest)

    def resolve_tactic(self, room=None, hacker=None, defender=None):
        room = room or self.room
        if not room.tactic_active:
            return
        hacker = hacker or self.host
        defender = defender or self.guest
        first_choice = next(iter(WORLD_RULES[room.mission]["choices"]))
        self.game.choose_tactic(room, hacker, first_choice)
        if defender.is_bot:
            self.game._bot_action(room, self.clock())
        else:
            task = room.threat_target.copy()
            self.game.submit(room, defender, task["id"], task["text"])

    def test_room_code_and_player_private_tokens(self):
        self.assertEqual(6, len(self.room.code))
        self.assertNotEqual(self.host.token, self.guest.token)
        self.assertEqual(self.host.id, self.room.host_id)
        with self.assertRaises(GameError):
            self.game.join(self.room.code, "THIRD")

    def test_host_controls_mission(self):
        with self.assertRaises(GameError):
            self.game.change_mission(self.room, self.guest, "hollow")
        self.game.change_mission(self.room, self.host, "hollow")
        self.assertEqual(self.room.mission, "hollow")
        self.assertIn("THE HOLLOW HOUSE", self.game.view(self.room, self.host)["missionInfo"]["title"])

    def test_two_players_required_for_coop(self):
        empty_room, owner = self.game.create("SOLO-NOT-A-BOT")
        with self.assertRaises(GameError):
            self.game.start(empty_room, owner)
        with self.assertRaises(GameError):
            self.game.start(self.room, self.guest)

    def test_stages_and_roles_reverse(self):
        self.launch()
        self.assertEqual("hacker", self.room.role_for(self.host.id))
        self.assertEqual("defender", self.room.role_for(self.guest.id))
        for idx in range(5):
            command = self.room.hack_target.copy()
            self.assertTrue(self.game.submit(self.room, self.host, command["id"], command["text"].upper()))
            self.resolve_tactic()
            self.assertEqual(idx + 1, self.room.progress)
            self.clock.step(.20)
        self.assertEqual("switching", self.room.phase)
        self.clock.step(5)
        self.game.tick(self.room)
        self.assertEqual("playing", self.room.phase)
        self.assertEqual(2, self.room.stage)
        self.assertEqual("defender", self.room.role_for(self.host.id))
        self.assertEqual("hacker", self.room.role_for(self.guest.id))
        self.assertEqual(0, self.room.progress)
        for _ in range(6):
            if self.room.crisis_active:
                defense = self.room.threat_target.copy()
                self.assertTrue(self.game.submit(self.room, self.host, defense["id"], defense["text"]))
                self.clock.step(.2)
            command = self.room.hack_target.copy()
            self.assertTrue(self.game.submit(self.room, self.guest, command["id"], command["text"]))
            self.clock.step(.2)
        self.assertEqual("won", self.room.phase)
        self.assertGreater(self.room.final_score, 1000)
        self.assertIn(self.room.final_grade, ("S", "A", "B"))

    def test_wrong_input_costs_integrity(self):
        self.launch()
        target = self.room.hack_target["id"]
        self.assertFalse(self.game.submit(self.room, self.host, target, "wrong input"))
        self.assertEqual(98, self.room.stability)
        self.assertEqual(1, self.host.mistakes)
        self.assertEqual(0, self.room.progress)
        self.assertEqual(0, self.guest.mistakes)

    def test_outdated_target_is_safely_ignored(self):
        self.launch()
        target = self.room.hack_target.copy()
        self.game.submit(self.room, self.host, target["id"], target["text"])
        self.clock.step(.3)
        self.assertFalse(self.game.submit(self.room, self.host, target["id"], target["text"]))
        self.assertEqual(1, self.host.correct)
        self.assertEqual(1, self.room.progress)

    def test_defense_prevents_impact(self):
        self.launch()
        threat = self.room.threat_target.copy()
        self.assertTrue(self.game.submit(self.room, self.guest, threat["id"], threat["text"]))
        self.assertEqual(100, self.room.stability)
        self.assertIsNone(self.room.threat_target)
        self.clock.step(1.2)
        self.game.tick(self.room)
        self.assertIsNotNone(self.room.threat_target)
        self.assertNotEqual(threat["id"], self.room.threat_target["id"])

    def test_missed_enemy_damages_team(self):
        self.launch()
        self.clock.step(13.1)
        self.game.tick(self.room)
        self.assertEqual(83, self.room.stability)
        self.assertIsNone(self.room.threat_target)

    def test_elapsed_time_is_monotonic_even_after_delayed_tick(self):
        self.launch()
        self.clock.step(30)
        self.game.tick(self.room)
        self.assertEqual(MISSION_SECONDS - 30, self.room.remaining)

    def test_game_clock_timeout(self):
        self.launch()
        for _ in range(MISSION_SECONDS + 1):
            self.clock.step(1)
            self.game.tick(self.room)
        self.assertEqual("lost", self.room.phase)
        self.assertEqual("F", self.room.final_grade)

    def test_disconnect_pauses_and_recovers(self):
        self.launch()
        self.game.disconnect(self.room, self.guest)
        start = self.room.remaining
        self.clock.step(13)
        self.game.tick(self.room)
        self.assertEqual(start, self.room.remaining)
        self.game.reconnect(self.room.code, self.guest.token)
        self.clock.step(1)
        self.game.tick(self.room)
        self.assertEqual(start - 1, self.room.remaining)

    def test_disconnect_has_grace_period(self):
        self.launch()
        self.game.disconnect(self.room, self.guest)
        self.clock.step(RECONNECT_GRACE + 1)
        self.game.tick(self.room)
        self.assertEqual("lost", self.room.phase)

    def test_solo_room_has_bot_which_types(self):
        room, host = self.game.create("LONE_WOLF", "outbreak", solo=True)
        self.game.start(room, host)
        self.game.ready(room, host)
        self.clock.step(10.1)
        self.game.tick(room)
        self.game.launch(room, host)
        self.clock.step(5.1)
        self.game.tick(room)
        bot = next(p for p in room.players if p.is_bot)
        self.assertGreaterEqual(bot.correct, 1)
        self.assertEqual("hacker", room.role_for(host.id))

    def test_disconnected_lobby_slot_reopens(self):
        self.game.disconnect(self.room, self.guest)
        self.clock.step(31)
        self.game.tick(self.room)
        self.assertEqual(1, len(self.room.players))
        new_room, new_guest = self.game.join(self.room.code, "REPLACEMENT")
        self.assertIs(new_room, self.room)
        self.assertEqual("REPLACEMENT", new_guest.name)

    def test_difficulty_presets_change_time_damage_and_require_host(self):
        with self.assertRaises(GameError):
            self.game.change_difficulty(self.room, self.guest, "story")
        with self.assertRaises(GameError):
            self.game.change_difficulty(self.room, self.host, "impossible")
        self.game.change_difficulty(self.room, self.host, "overdrive")
        self.launch()
        self.assertEqual(165, self.room.remaining)
        self.assertEqual("Overdrive", self.game.view(self.room, self.host)["difficultyLabel"])
        target = self.room.hack_target.copy()
        self.game.submit(self.room, self.host, target["id"], "wrong")
        self.assertEqual(97, self.room.stability)
        self.clock.step(self.room.threat_total + .1)
        self.game.tick(self.room)
        self.assertEqual(74, self.room.stability)

    def test_signal_pulse_needs_two_roles_and_restores_integrity(self):
        self.launch()
        for _ in range(4):
            hack = self.room.hack_target.copy()
            self.game.submit(self.room, self.host, hack["id"], hack["text"])
            self.resolve_tactic()
            self.clock.step(.2)
        self.assertEqual(4, self.room.sync_charge)
        self.assertTrue(self.game.view(self.room, self.host)["syncReady"])
        self.clock.step(.2)
        self.game.submit(self.room, self.host, self.room.hack_target["id"], "wrong")
        self.assertEqual(98, self.room.stability)
        self.game.pulse(self.room, self.guest)
        self.assertEqual(100, self.room.stability)
        self.assertEqual(1, self.room.pulses_used)
        self.assertEqual(0, self.room.sync_charge)
        with self.assertRaises(GameError):
            self.game.pulse(self.room, self.host)

    def test_pulse_requires_distinct_players_after_role_swap(self):
        self.launch()
        for _ in range(5):
            hack = self.room.hack_target.copy()
            self.game.submit(self.room, self.host, hack["id"], hack["text"])
            self.resolve_tactic()
            if self.room.progress == 4:
                self.game.pulse(self.room, self.host)
            self.clock.step(.2)
        # A fresh pulse requires both participants after the role swap.
        self.clock.step(5)
        self.game.tick(self.room)
        defense = self.room.threat_target.copy()
        self.game.submit(self.room, self.host, defense["id"], defense["text"])
        self.assertEqual(2, self.room.sync_charge)
        self.assertFalse(self.game.view(self.room, self.host)["syncReady"])
        with self.assertRaises(GameError):
            self.game.pulse(self.room, self.host)
        self.clock.step(.2)
        hack = self.room.hack_target.copy()
        self.game.submit(self.room, self.guest, hack["id"], hack["text"])
        self.clock.step(.2)
        hack = self.room.hack_target.copy()
        self.game.submit(self.room, self.guest, hack["id"], hack["text"])
        self.assertTrue(self.game.view(self.room, self.host)["syncReady"])

    def test_squad_pings_are_fixed_and_rate_limited(self):
        self.launch()
        self.game.ping(self.room, self.host, "help")
        self.assertIn("REQUESTING SUPPORT", self.room.logs[0]["message"])
        with self.assertRaises(GameError):
            self.game.ping(self.room, self.host, "ready")
        self.clock.step(5.1)
        with self.assertRaises(GameError):
            self.game.ping(self.room, self.host, "injected content")
        self.game.ping(self.room, self.host, "ready")
        self.assertEqual("signal", self.room.logs[0]["kind"])

    def _enter_crisis(self):
        self.launch()
        for _ in range(5):
            hack = self.room.hack_target.copy()
            self.game.submit(self.room, self.host, hack["id"], hack["text"])
            self.resolve_tactic()
            self.clock.step(.2)
        self.clock.step(5)
        self.game.tick(self.room)
        for _ in range(3):
            hack = self.room.hack_target.copy()
            self.game.submit(self.room, self.guest, hack["id"], hack["text"])
            self.clock.step(.2)
        self.assertTrue(self.room.crisis_active)
        self.assertEqual(3, self.room.progress)
        self.assertIsNone(self.room.hack_target)

    def test_climax_blocks_hack_until_partner_clears_threat(self):
        self._enter_crisis()
        defense = self.room.threat_target.copy()
        self.assertTrue(defense["critical"])
        self.assertEqual("stabilize reactor core", defense["text"])
        self.assertFalse(self.game.submit(self.room, self.guest, "H999", "anything"))
        self.game.submit(self.room, self.host, defense["id"], defense["text"])
        self.assertFalse(self.room.crisis_active)
        self.assertIsNotNone(self.room.hack_target)
        self.assertTrue(self.room.crisis_triggered)

    def test_climax_expiry_damages_team_then_releases_hacker(self):
        self._enter_crisis()
        self.clock.step(self.room.threat_total + .1)
        self.game.tick(self.room)
        self.assertEqual(72, self.room.stability)
        self.assertFalse(self.room.crisis_active)
        self.assertIsNotNone(self.room.hack_target)
        self.assertEqual(3, self.room.progress)

    def test_rematch_retains_players_and_clears_round_state(self):
        self.launch()
        self.game._finish(self.room, True)
        with self.assertRaises(GameError):
            self.game.rematch(self.room, self.guest)
        ids = [p.token for p in self.room.players]
        self.game.rematch(self.room, self.host)
        self.assertEqual("lobby", self.room.phase)
        self.assertEqual(ids, [p.token for p in self.room.players])
        self.assertEqual(0, self.room.progress)
        self.assertEqual(0, self.room.final_score)
        self.assertEqual(0, self.room.pulses_used)
        self.game.start(self.room, self.host)
        self.assertEqual("briefing", self.room.phase)
        self.assertEqual(set(), self.room.briefing_ready)

    def test_solo_crisis_does_not_stall_ai_partner(self):
        room, human = self.game.create("SOLO", "hollow", solo=True)
        self.game.start(room, human)
        self.game.ready(room, human)
        self.clock.step(10.1)
        self.game.tick(room)
        self.game.launch(room, human)
        for _ in range(5):
            target = room.hack_target.copy()
            self.game.submit(room, human, target["id"], target["text"])
            self.resolve_tactic(room, human, room.players[1])
            self.clock.step(.2)
        self.clock.step(5)
        self.game.tick(room)
        for _ in range(60):
            self.clock.step(1)
            self.game.tick(room)
            if room.crisis_active:
                break
        self.assertTrue(room.crisis_active)
        defense = room.threat_target.copy()
        self.game.submit(room, human, defense["id"], defense["text"])
        self.assertIsNotNone(room.hack_target)
        self.assertFalse(room.crisis_active)

    def test_cleanup_of_abandoned_rooms(self):
        self.game.disconnect(self.room, self.host)
        self.game.disconnect(self.room, self.guest)
        self.clock.step(16 * 60)
        self.assertEqual(1, self.game.cleanup())
        self.assertNotIn(self.room.code, self.game.rooms)


if __name__ == "__main__":
    unittest.main()
