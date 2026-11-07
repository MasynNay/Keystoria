"""Campaign coverage for the nine storybooks and non-repeating defense deck."""
import unittest

from server.content import MISSIONS
from server.game import GameEngine
from server.mechanics import WORLD_RULES
from server.objectives import STORY_PATHS, STEP_DESCRIPTIONS
from server.field_operations import FIELD_OPERATIONS


class FixedClock:
    def __init__(self): self.now = 250.0
    def __call__(self): return self.now
    def step(self, value): self.now += value


class CinematicCampaignTests(unittest.TestCase):
    def test_nine_authored_chapters_have_unique_steps_and_balanced_systems(self):
        self.assertEqual(24, len(MISSIONS))
        for mission, info in MISSIONS.items():
            with self.subTest(mission=mission):
                steps = list(STORY_PATHS[mission][0] + STORY_PATHS[mission][1])
                self.assertEqual(11, len(steps))
                self.assertEqual(11, len(set(steps)), "Story should never repeat a main action")
                self.assertEqual(2, len(FIELD_OPERATIONS[mission]))
                self.assertEqual(2, len(WORLD_RULES[mission]['choices']))
                self.assertGreaterEqual(len(info['defense']), 8)
                for phrase in steps + info['defense'] + [info['crisis_phrase']]:
                    self.assertGreater(len(STEP_DESCRIPTIONS[mission][phrase]), 28)

    def test_defense_uses_full_shuffle_deck_before_repeating(self):
        # Force a new routine target repeatedly without relying on real-time
        # attacks. Special crisis and tactical actions must not consume the deck.
        for mission, info in MISSIONS.items():
            with self.subTest(mission=mission):
                clock=FixedClock(); game=GameEngine(clock)
                room,host=game.create('OP',mission,solo=True)
                game.start(room,host);game.ready(room,host)
                clock.step(10.1);game.tick(room);game.launch(room,host)
                seen=[room.threat_target["text"]]  # Live launch dealt the first card.
                count=len(info['defense'])
                for i in range(count):
                    game._new_threat(room,clock())
                    seen.append(room.threat_target['text'])
                self.assertEqual(len(set(seen[:count])),count)
                self.assertNotEqual(seen[count-1],seen[count])
                self.assertIn(seen[count],set(seen[:count]))
                game._finish(room, True)
                game.rematch(room,host)
                self.assertEqual([],room.threat_bag)
                self.assertEqual('',room.last_normal_threat)

    def test_all_nine_briefings_describe_real_consequences(self):
        for mission, content in MISSIONS.items():
            with self.subTest(mission=mission):
                b=content['briefing']
                for key in ('opening','hacker','defender','stakes','outro'):
                    self.assertGreater(len(b[key]), 75)
                self.assertNotEqual(b['stageObjectives'][0],b['stageObjectives'][1])


if __name__ == '__main__': unittest.main()
