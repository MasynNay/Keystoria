"""Mission 19-24 story contracts and the best-effort no-key video path."""
from __future__ import annotations
import asyncio
import unittest
from unittest import mock
from server.content import MISSIONS, BRIEFINGS
from server.field_operations import FIELD_OPERATIONS
from server.frontier_missions import STORIES
from server.mechanics import WORLD_RULES
from server.objectives import STORY_PATHS, STEP_DESCRIPTIONS
from server.video_match import VideoResolver


class FrontierStoryTests(unittest.TestCase):
    def test_six_new_missions_have_authored_dual_operator_arcs(self):
        self.assertEqual(len(MISSIONS), 24)
        self.assertEqual(len(STORIES), 6)
        for mission, authoring in STORIES.items():
            with self.subTest(mission=mission):
                spec=MISSIONS[mission]
                acts=STORY_PATHS[mission]
                self.assertEqual(tuple(map(len,acts)), (5,6))
                self.assertEqual(len(set(spec['commands'])),11)
                self.assertEqual([*acts[0],*acts[1]],spec['commands'])
                self.assertEqual(len(spec['defense']),10)
                self.assertTrue(set(spec['defense']).isdisjoint(spec['commands']))
                self.assertTrue(set(spec['defense']).isdisjoint({spec['crisis_phrase']}))
                self.assertEqual(len(spec['beats']),4)
                self.assertEqual(len(FIELD_OPERATIONS[mission]),2)
                self.assertEqual(len(WORLD_RULES[mission]['choices']),2)
                self.assertEqual(len(BRIEFINGS[mission]['stageObjectives']),2)
                self.assertNotEqual(BRIEFINGS[mission]['hacker'],BRIEFINGS[mission]['defender'])
                for action in [*spec['commands'],*spec['defense'],spec['crisis_phrase']]:
                    self.assertGreaterEqual(len(STEP_DESCRIPTIONS[mission][action]),58)
                self.assertNotIn('copy',spec['goal'].lower())


class PublicMetadataSearchTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.matcher=VideoResolver(client=None)

    async def test_invidious_accepts_only_matching_studio_recording(self):
        good='AbCdEf12345'
        rows=[
            {'type':'video','videoId':'LiVeX123456','title':'Harry Styles - Kiwi LIVE 2019', 'author':'Harry Styles', 'lengthSeconds':183},
            {'type':'video','videoId':'FAKEx123456','title':'Harry Styles - Kiwi (Official Cover)', 'author':'Other artist', 'lengthSeconds':183},
            {'type':'video','videoId':good,'title':'Harry Styles - Kiwi (Official Video)', 'author':'Harry Styles', 'lengthSeconds':184},
            {'type':'video','videoId':'LONGx123456','title':'Harry Styles - Kiwi (Official Video)', 'author':'Harry Styles', 'lengthSeconds':421},
        ]
        self.matcher._community_get = mock.AsyncMock(return_value=rows)
        result=await self.matcher._community_lookup('Kiwi','Harry Styles',183)
        self.assertEqual(result['videoId'],good)
        self.assertEqual(result['source'],'invidious')
        self.assertGreaterEqual(result['confidence'],.86)

    async def test_piped_relative_watch_link_validates_video_id(self):
        rows={'items':[{'type':'stream','url':'/watch?v=AbCdEf12345','title':'Harry Styles - Kiwi (Official Video)','uploaderName':'Harry Styles','duration':183},
                       {'type':'stream','url':'/watch?v=BAD','title':'Harry Styles - Kiwi', 'uploaderName':'Harry Styles','duration':183}]}
        self.assertEqual(self.matcher._community_candidates(rows,'piped')[0][0], 'AbCdEf12345')
        self.assertEqual(len(self.matcher._community_candidates(rows,'piped')),1)

    async def test_failed_indexes_fall_back_cleanly(self):
        self.matcher._community_lookup=mock.AsyncMock(side_effect=OSError('public index down'))
        self.matcher._musicbrainz_lookup=mock.AsyncMock(return_value=None)
        result=await self.matcher.resolve('Kiwi','Harry Styles',183)
        self.assertIsNone(result['videoId'])
        self.assertIn('manually',result['reason'])

    async def test_parallel_lookup_uses_fast_metadata_success(self):
        async def slow(*args):
            await asyncio.sleep(.08)
            return None
        async def quick(*args):
            await asyncio.sleep(.01)
            return {'videoId':'AbCdEf12345','source':'invidious','confidence':.95}
        self.matcher._musicbrainz_lookup=slow
        self.matcher._community_lookup=quick
        got=await self.matcher.resolve('Kiwi','Harry Styles',183)
        self.assertEqual(got['videoId'],'AbCdEf12345')
        got2=await self.matcher.resolve('Kiwi','Harry Styles',183)
        self.assertEqual(got,got2)

if __name__ == '__main__': unittest.main()
