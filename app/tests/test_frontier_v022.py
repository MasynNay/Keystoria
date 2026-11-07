"""Six new mission packages must be complete from both operator perspectives."""
import unittest
from server.content import MISSIONS, PUBLIC_MISSIONS
from server.frontier_missions import (
    STORIES, FRONTIER_PATHS, FRONTIER_DESCRIPTIONS, FRONTIER_RULES, FRONTIER_FIELDS,
)
from server.objectives import STORY_PATHS, STEP_DESCRIPTIONS
from server.mechanics import WORLD_RULES
from server.field_operations import FIELD_OPERATIONS


class FrontierCampaignTests(unittest.TestCase):
    def test_complete_chapters_and_both_roles(self):
        self.assertEqual(24,len(MISSIONS))
        self.assertEqual(6,len(STORIES))
        for id, story in STORIES.items():
            with self.subTest(id=id):
                self.assertEqual(tuple(map(len,STORY_PATHS[id])),(5,6))
                self.assertEqual(len(set(sum((list(x) for x in STORY_PATHS[id]), []))),11)
                self.assertEqual(MISSIONS[id]['title'],PUBLIC_MISSIONS[id]['title'])
                self.assertGreater(len(MISSIONS[id]['briefing']['opening']),150)
                self.assertGreater(len(MISSIONS[id]['briefing']['hacker']),65)
                self.assertGreater(len(MISSIONS[id]['briefing']['defender']),65)
                self.assertNotEqual(MISSIONS[id]['briefing']['hacker'], MISSIONS[id]['briefing']['defender'])
                self.assertNotEqual(MISSIONS[id]['attack_title'], MISSIONS[id]['defend_title'])
                self.assertEqual(len(MISSIONS[id]['defense']),10)
                self.assertEqual(len(set(MISSIONS[id]['defense'])),10)
                self.assertEqual(len(FIELD_OPERATIONS[id]),2)
                self.assertEqual(len(FRONTIER_FIELDS[id]),2)
                self.assertEqual(len(WORLD_RULES[id]['choices']),2)
                self.assertEqual(set(story['beats']),{(1,2),(1,5),(2,2),(2,5)})
                self.assertNotEqual(story['win'],story['lose'])
                all_prompts=set(MISSIONS[id]['commands'] + MISSIONS[id]['defense'] + [MISSIONS[id]['crisis_phrase']])
                all_prompts.update(c['phrase'] for c in WORLD_RULES[id]['choices'].values())
                self.assertEqual(all_prompts,set(STEP_DESCRIPTIONS[id]))
                for prompt, explanation in STEP_DESCRIPTIONS[id].items():
                    self.assertGreaterEqual(len(explanation),58,(id,prompt))

    def test_exposure_and_rescue_are_not_interchanged_in_ending(self):
        endings={id: s['outro'].casefold() for id,s in STORIES.items()}
        self.assertIn('tram',endings['clockfall'])
        self.assertIn('child',endings['nightmarket'])
        self.assertIn('eggs',endings['emberwing'])
        self.assertIn('scholar',endings['deepvault'])
        self.assertIn('aurora',endings['aurora_arc'])
        self.assertIn('name',endings['inkbound'])

if __name__ == '__main__': unittest.main()
