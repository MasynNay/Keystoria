"""Every narrative prompt needs a meaningful on-screen explanation."""
import unittest

from server.content import MISSIONS
from server.mechanics import WORLD_RULES
from server.objectives import STORY_PATHS, STEP_DESCRIPTIONS
from server.game import GameEngine


class ObjectiveNotesTests(unittest.TestCase):
    def test_every_possible_command_and_defense_prompt_has_a_human_explanation(self):
        for mission, spec in MISSIONS.items():
            with self.subTest(mission=mission):
                targets = set(spec['commands'] + spec['defense'] + [spec['crisis_phrase']])
                targets.update(choice['phrase'] for choice in WORLD_RULES[mission]['choices'].values())
                self.assertEqual(targets, set(STEP_DESCRIPTIONS[mission].keys()))
                for explanation in STEP_DESCRIPTIONS[mission].values():
                    self.assertGreaterEqual(len(explanation), 58)

    def test_paths_cover_exactly_five_and_six_valid_story_steps(self):
        for mission, spec in MISSIONS.items():
            with self.subTest(mission=mission):
                chapters=STORY_PATHS[mission]
                self.assertEqual(tuple(map(len,chapters)),(5,6))
                for command in [*chapters[0],*chapters[1]]:
                    self.assertIn(command,spec['commands'])

    def test_docking_clamps_step_explains_why_it_matters(self):
        message=STEP_DESCRIPTIONS['station']['release docking clamps'].lower()
        for concept in ('escape craft','mechanical arms','cannot launch'):
            self.assertIn(concept,message)

    def test_engine_exposes_current_action_explanation_to_each_player(self):
        now=[100.0]
        engine=GameEngine(lambda: now[0])
        room,host=engine.create('Tester','station',solo=True)
        engine.start(room,host)
        engine.ready(room,host)
        now[0]+=10
        engine.tick(room)
        engine.launch(room,host)
        snapshot=engine.view(room,host)
        self.assertEqual(snapshot['target']['text'],'override access')
        self.assertIn('maintenance console',snapshot['target']['explanation'])
        self.assertTrue(room.threat_target['explanation'])
        # A different chapter uses the same server-authoritative descriptions.
        room.stage=2
        room.progress=2
        engine._new_hack(room)
        self.assertEqual(room.hack_target['text'],'release docking clamps')
        self.assertIn('cannot launch',room.hack_target['explanation'])


if __name__ == '__main__':
    unittest.main()
