"""Campaign extension invariants: no new mission requires bespoke engine branches."""
import unittest

from server.content import MISSIONS, PUBLIC_MISSIONS
from server.game import GameEngine
from server.mechanics import WORLD_RULES
from server.objectives import STORY_PATHS, STEP_DESCRIPTIONS


class NewMissionTests(unittest.TestCase):
    def test_nine_missions_each_have_two_clear_acts_and_full_explanations(self):
        self.assertEqual(24,len(MISSIONS))
        self.assertEqual(set(WORLD_RULES),set(MISSIONS))
        for key in ("dead_air", "last_stop"):
            spec=MISSIONS[key]
            self.assertGreater(len(spec["briefing"]["opening"]),200)
            self.assertEqual(tuple(map(len,STORY_PATHS[key])),(5,6))
            self.assertEqual(len(WORLD_RULES[key]["choices"]),2)
            self.assertEqual(set(STEP_DESCRIPTIONS[key]),
               set(spec['commands']+spec['defense']+[spec['crisis_phrase']]+[choice['phrase'] for choice in WORLD_RULES[key]['choices'].values()]))
            self.assertEqual(spec['title'],PUBLIC_MISSIONS[key]['title'])

    def test_story_moments_explain_progression_and_reset_on_replay(self):
        now=[100.0]
        engine=GameEngine(lambda:now[0]);room,player=engine.create('PILOT','dead_air',solo=True)
        engine.start(room,player);engine.ready(room,player)
        now[0]+=10.2;engine.tick(room);engine.launch(room,player)
        for i in range(2):
            target=room.hack_target
            self.assertTrue(engine.submit(room,player,target['id'],target['text']))
            now[0]+=0.21
        self.assertIn('Backup power',room.story_moment)
        self.assertIn('Backup power',engine.view(room,player)['storyMoment'])
        engine._finish(room,True)
        engine.rematch(room,player)
        self.assertEqual('',room.story_moment)

if __name__=='__main__':unittest.main()
