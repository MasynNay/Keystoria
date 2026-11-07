"""Authoritative emergency controls: validity, consequences, lifecycle, and completion.

Every shipped operation is exercised against the real room state machine. The
client never supplies balancing numbers; only opaque action identifiers.
"""
from __future__ import annotations

import unittest

from server.content import MISSIONS
from server.field_operations import FIELD_OPERATIONS
from server.game import GameEngine, GameError
from server.mechanics import WORLD_RULES
from tests import test_completion_matrix as completion


class FieldOperationTests(unittest.TestCase):
    def setUp(self):
        self.harness = completion.AllMissionCompletionTests()
        self.harness.setUp()
        self.engine = self.harness.engine
        self.clock = self.harness.clock

    def enter(self, mission, mode='solo', difficulty='story'):
        return self.harness.setup_room(mission, mode, difficulty)

    def test_controls_are_locked_before_first_objective_and_reject_unknown_actions(self):
        for mission in MISSIONS:
            with self.subTest(mission=mission):
                self.setUp()
                room, host, partner = self.enter(mission)
                operation = FIELD_OPERATIONS[mission][0]['options'][0]['id']
                with self.assertRaisesRegex(GameError, 'unlock'):
                    self.engine.operate_field(room, host, operation)
                room.progress = 1
                with self.assertRaisesRegex(GameError, 'Unknown'):
                    self.engine.operate_field(room, host, 'fabricated')
                self.assertFalse(room.field_actions)
                self.assertFalse(room.field_history)

    def test_each_of_the_24_options_applies_exactly_once_and_is_publicly_visible(self):
        for mission in MISSIONS:
            for act in (1, 2):
                for option in FIELD_OPERATIONS[mission][act - 1]['options']:
                    with self.subTest(mission=mission, act=act, option=option['id']):
                        self.setUp()
                        room, host, partner = self.enter(mission)
                        room.stage = act
                        room.progress = 1
                        room.remaining = 110
                        room.stability = 70
                        room.ambient = 50
                        before = (room.remaining, room.stability, room.ambient)
                        self.engine.operate_field(room, host, option['id'])
                        effects = option['effects']
                        self.assertAlmostEqual(room.remaining, before[0] + effects.get('seconds', 0))
                        self.assertEqual(room.stability, before[1] + effects.get('integrity', 0))
                        self.assertEqual(room.ambient, before[2] + effects.get('meter', 0))
                        self.assertEqual(room.field_actions[act], option['id'])
                        self.assertEqual(len(room.field_history), 1)
                        view = self.engine.view(room, host)['fieldOps']
                        self.assertTrue(view['used'])
                        self.assertFalse(view['available'])
                        self.assertEqual(view['selected'], option['id'])
                        self.assertIn(option['outcome'], view['history'][0]['outcome'])
                        self.assertNotIn('effects', view['options'][0])
                        with self.assertRaisesRegex(GameError, 'already committed'):
                            self.engine.operate_field(room, host, option['id'])
                        self.assertEqual(len(room.field_history), 1)

    def test_rematch_clears_both_interventions(self):
        self.setUp()
        room, host, _ = self.enter('outbreak')
        room.progress = 1
        self.engine.operate_field(room, host, 'seal')
        room.stage = 2
        room.progress = 1
        self.engine.operate_field(room, host, 'foam')
        self.assertEqual(len(room.field_history), 2)
        self.engine._finish(room, True)
        self.engine.rematch(room, host)
        self.assertEqual(room.field_actions, {})
        self.assertEqual(room.field_history, [])
        self.assertEqual(room.phase, 'lobby')

    def test_each_world_can_still_finish_after_both_act_interventions(self):
        """Run real solo/duo AI and timed actions, choosing both field options."""
        for mission in MISSIONS:
            for mode in ('solo', 'duo'):
                for option_number in (0, 1):
                    with self.subTest(mission=mission, mode=mode, option=option_number):
                        self.setUp()
                        room, host, partner = self.enter(mission, mode)
                        old_submit = self.engine.submit
                        old_tick = self.engine.tick
                        # Hook only the first earned unlock of each act. The
                        # rest of the completion path runs with normal rules.
                        chosen_acts = set()
                        def intervene():
                            if (room.phase == 'playing' and room.progress >= 1
                                and room.stage not in chosen_acts):
                                action = FIELD_OPERATIONS[mission][room.stage - 1]['options'][option_number]['id']
                                self.engine.operate_field(room, host, action)
                                chosen_acts.add(room.stage)
                        def submit_with_field(*args, **kwargs):
                            value = old_submit(*args, **kwargs)
                            intervene()
                            return value
                        def tick_with_field(*args, **kwargs):
                            value = old_tick(*args, **kwargs)
                            intervene()
                            return value
                        self.engine.submit = submit_with_field
                        self.engine.tick = tick_with_field
                        choice = next(iter(WORLD_RULES[mission]['choices']))
                        try:
                            self.harness.drive_to_end(room, host, partner, choice)
                        finally:
                            self.engine.submit = old_submit
                            self.engine.tick = old_tick
                        self.assertEqual(chosen_acts, {1, 2})
                        self.assertEqual(len(room.field_history), 2)
                        self.assertEqual(room.phase, 'won')


if __name__ == '__main__':
    unittest.main()
