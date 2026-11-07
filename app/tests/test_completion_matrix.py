"""Full-route completion tests for every shipped mission.

A successful route must work through both operators' jobs, the shared tactical
choice, the role swap, the critical incident, and the final result. Tests use a
manual clock so they remain deterministic and finish quickly in CI.
"""
from __future__ import annotations

import unittest

from server.content import MISSIONS
from server.game import DIFFICULTIES, GameEngine, STAGE_GOALS
from server.mechanics import WORLD_RULES


class Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now

    def advance(self, seconds: float):
        self.now += seconds


class AllMissionCompletionTests(unittest.TestCase):
    def setUp(self):
        self.clock = Clock()
        self.engine = GameEngine(self.clock)

    def setup_room(self, mission, mode, difficulty):
        room, host = self.engine.create('RAVEN', mission, solo=mode == 'solo')
        if mode == 'duo':
            room, teammate = self.engine.join(room.code, 'ECHO HUMAN')
        else:
            teammate = next(p for p in room.players if p.is_bot)
        self.engine.change_difficulty(room, host, difficulty)
        self.engine.start(room, host)
        self.engine.ready(room, host)
        if mode == 'duo':
            self.engine.ready(room, teammate)
        self.assertEqual(room.phase, 'countdown')
        self.clock.advance(10.1)
        self.engine.tick(room)
        self.assertEqual(room.phase, 'armed')
        self.engine.launch(room, host)
        if mode == 'duo': self.engine.launch(room, teammate)
        self.assertEqual(room.phase, 'playing')
        return room, host, teammate

    def drive_to_end(self, room, human, partner, choice):
        """Apply legal actions at a modest human pace; AI uses the real ticker."""
        last_hack_time = self.clock()
        last_defense_time = self.clock()
        encountered_swap = encountered_tactic = encountered_crisis = False
        iterations = 0
        while room.phase not in ('won', 'lost') and iterations < 6000:
            iterations += 1
            now = self.clock()
            if room.phase == 'switching':
                encountered_swap = True
            if room.phase == 'playing':
                if room.tactic_active:
                    encountered_tactic = True
                    if room.tactic_choice is None:
                        hacker = next(p for p in room.players if room.role_for(p.id) == 'hacker')
                        if not hacker.is_bot:
                            self.engine.choose_tactic(room, hacker, choice)
                if room.crisis_active:
                    encountered_crisis = True
                if room.accusation_active:
                    investigator = next(p for p in room.players if room.role_for(p.id) == 'hacker')
                    if not investigator.is_bot:
                        self.engine.accuse(room, investigator, MISSIONS['casefile']['culprit'])
                # Answer defense prompts before they expire, but do not let a
                # human impersonate the bot in solo mode.
                defender = next(p for p in room.players if room.role_for(p.id) == 'defender')
                if not defender.is_bot and room.threat_target and now - last_defense_time >= 1.4:
                    target = room.threat_target.copy()
                    self.assertTrue(self.engine.submit(room, defender, target['id'], target['text']))
                    last_defense_time = now
                hacker = next(p for p in room.players if room.role_for(p.id) == 'hacker')
                if not hacker.is_bot and room.hack_target and now - last_hack_time >= 2.2:
                    target = room.hack_target.copy()
                    self.assertTrue(self.engine.submit(room, hacker, target['id'], target['text']))
                    last_hack_time = now
            self.clock.advance(.25)
            self.engine.tick(room)
        self.assertLess(iterations, 6000, 'Mission got stuck without a terminal state')
        self.assertTrue(encountered_tactic, 'The tactical encounter did not occur')
        self.assertTrue(encountered_swap, 'The role swap did not occur')
        self.assertTrue(encountered_crisis, 'The climax did not occur')
        self.assertEqual(room.phase, 'won', f"{room.mission} {room.difficulty}: {room.finish_reason}")
        self.assertEqual(room.stage, 2)
        self.assertEqual(room.progress, STAGE_GOALS[1])
        self.assertGreater(room.final_score, 0)
        self.assertTrue(room.finish_reason)
        for player in room.players:
            view = self.engine.view(room, player)
            self.assertEqual(view['phase'], 'won')
            self.assertEqual(view['overallProgress'], 100)
            self.assertEqual(view['objectivesComplete'], view['objectivesTotal'])
            self.assertTrue(view['finishReason'])
            self.assertEqual(view['finalScore'], room.final_score)
            self.assertEqual(view['solo'], room.is_solo)

    def test_every_world_every_difficulty_both_player_modes_both_tactics(self):
        for mission in MISSIONS:
            for difficulty in DIFFICULTIES:
                for mode in ('solo', 'duo'):
                    for tactic in WORLD_RULES[mission]['choices']:
                        with self.subTest(mission=mission, difficulty=difficulty, mode=mode, tactic=tactic):
                            self.setUp()
                            room, host, teammate = self.setup_room(mission, mode, difficulty)
                            self.drive_to_end(room, host, teammate, tactic)

    def test_every_world_rematches_without_losing_room_or_players(self):
        for mission in MISSIONS:
            for mode in ('solo', 'duo'):
                with self.subTest(mission=mission, mode=mode):
                    self.setUp()
                    room, host, teammate = self.setup_room(mission, mode, 'story')
                    choice = next(iter(WORLD_RULES[mission]['choices']))
                    self.drive_to_end(room, host, teammate, choice)
                    code = room.code
                    tokens = [p.token for p in room.players]
                    previous_run_id = room.run_id
                    self.engine.rematch(room, host)
                    self.assertEqual(room.phase, 'lobby')
                    self.assertEqual(room.code, code)
                    self.assertEqual(tokens, [p.token for p in room.players])
                    self.assertEqual(room.progress, 0)
                    self.assertEqual(room.finish_reason, '')
                    self.engine.start(room, host)
                    self.engine.ready(room, host)
                    if mode == 'duo':
                        self.engine.ready(room, teammate)
                    self.clock.advance(10.1)
                    self.engine.tick(room)
                    self.engine.launch(room, host)
                    if mode == 'duo': self.engine.launch(room, teammate)
                    self.assertNotEqual(room.run_id, previous_run_id)
                    self.drive_to_end(room, host, teammate, choice)

    def test_timeouts_produce_viewable_losses_in_every_world_and_mode(self):
        for mission in MISSIONS:
            for mode in ('solo', 'duo'):
                with self.subTest(mission=mission, mode=mode):
                    self.setUp()
                    room, host, teammate = self.setup_room(mission, mode, 'standard')
                    self.clock.advance(DIFFICULTIES['standard']['seconds'] + 1)
                    self.engine.tick(room)
                    self.assertEqual(room.phase, 'lost')
                    self.assertIn('clock', room.finish_reason)
                    for player in room.players:
                        view = self.engine.view(room, player)
                        self.assertEqual(view['phase'], 'lost')
                        self.assertTrue(view['finishReason'])
                        self.assertEqual(view['finalGrade'], 'F')
                    self.engine.rematch(room, host)
                    self.assertEqual(room.phase, 'lobby')


if __name__ == '__main__':
    unittest.main()
