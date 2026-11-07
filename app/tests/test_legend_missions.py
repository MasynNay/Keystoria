"""Narrative and mechanics coverage for six original worlds (v0.17)."""
from __future__ import annotations
import unittest

from server.content import MISSIONS, PUBLIC_MISSIONS
from server.legend_missions import ADVENTURES, LEGEND_FIELDS
from server.mechanics import WORLD_RULES
from server.objectives import STORY_PATHS, STEP_DESCRIPTIONS


class LegendChapterTests(unittest.TestCase):
    def test_exactly_six_original_chapters_with_authored_throughlines(self):
        self.assertEqual(6, len(ADVENTURES))
        self.assertEqual(24, len(MISSIONS))
        self.assertEqual(len(MISSIONS),len(set(MISSIONS)))
        for key, story in ADVENTURES.items():
            with self.subTest(mission=key):
                self.assertEqual([5,6],list(map(len,STORY_PATHS[key])))
                actions=STORY_PATHS[key][0]+STORY_PATHS[key][1]
                self.assertEqual(11,len(set(actions)))
                self.assertEqual(actions,tuple(MISSIONS[key]['commands']))
                self.assertGreater(len(MISSIONS[key]['story']),140)
                self.assertGreater(len(MISSIONS[key]['briefing']['opening']),180)
                self.assertGreater(len(MISSIONS[key]['briefing']['hacker']),75)
                self.assertGreater(len(MISSIONS[key]['briefing']['defender']),75)
                self.assertEqual(MISSIONS[key]['title'],PUBLIC_MISSIONS[key]['title'])
                for i,action in enumerate(actions):
                    self.assertGreater(len(STEP_DESCRIPTIONS[key][action]),50,(key,i))
                self.assertEqual(len(story['defense']),10)
                self.assertEqual(len(set(story['defense'])),10)
                for defense in story['defense']:
                    self.assertGreater(len(STEP_DESCRIPTIONS[key][defense]),48,(key,defense))
                self.assertEqual(2,len(WORLD_RULES[key]['choices']))
                self.assertEqual(2,len(LEGEND_FIELDS[key]))
                self.assertEqual([2,2],[len(x['options']) for x in LEGEND_FIELDS[key]])
                self.assertEqual({(1,2),(1,5),(2,2),(2,5)},set(story['beats']))
                self.assertTrue(all(bool(x) for x in story['outro'].strip('.').split('.')))

    def test_each_perspective_has_real_job_and_shared_stakes(self):
        for key in ADVENTURES:
            spec=MISSIONS[key]
            briefing=spec['briefing']
            with self.subTest(mission=key):
                self.assertNotEqual(briefing['hacker'],briefing['defender'])
                self.assertNotEqual(spec['attack_title'],spec['defend_title'])
                self.assertNotEqual(spec['attack_action'],spec['defend_action'])
                self.assertIn('integrity',briefing['stakes'].lower())
                self.assertTrue(any(w in briefing['stakes'].lower() for w in ('clock','time')))
                self.assertGreater(len(spec['crisis_intro']),70)
                self.assertIn(spec['crisis_phrase'],STEP_DESCRIPTIONS[key])
                for opt in WORLD_RULES[key]['choices'].values():
                    self.assertIn(opt['phrase'],STEP_DESCRIPTIONS[key])
                    self.assertTrue(opt['outcome'])

    def test_new_missions_keep_distinct_settings_and_defeat_paths(self):
        captions=set()
        for key in ADVENTURES:
            story=MISSIONS[key]
            with self.subTest(mission=key):
                self.assertNotEqual(story['win'],story['lose'])
                self.assertNotIn(story['title'],captions)
                captions.add(story['title'])
                self.assertTrue(WORLD_RULES[key]['failure'])
                self.assertEqual('high',WORLD_RULES[key]['direction'])

if __name__=='__main__': unittest.main()
