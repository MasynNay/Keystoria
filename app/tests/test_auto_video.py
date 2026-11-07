"""Offline matching/security tests. No real YouTube API quota is consumed."""
import asyncio
import unittest
from unittest.mock import AsyncMock

from server.video_match import (
    VideoResolver, normalize, youtube_id, duration_ok, rank_video, _video_duration, song_query_title,
    YOUTUBE_SEARCH, YOUTUBE_VIDEOS, MUSICBRAINZ,
)


class MatchHelpersTests(unittest.TestCase):
    def test_youtube_link_validation(self):
        assert youtube_id('https://www.youtube.com/watch?v=dQw4w9WgXcQ') == 'dQw4w9WgXcQ'
        assert youtube_id('https://youtu.be/dQw4w9WgXcQ') == 'dQw4w9WgXcQ'
        for bad in ('https://www.youtube.com.evil.example/watch?v=dQw4w9WgXcQ', 'http://youtu.be/dQw4w9WgXcQ', 'javascript:alert(1)', 'https://youtube.com/watch?v=x'):
            self.assertIsNone(youtube_id(bad), bad)

    def test_rank_gates_avoid_obvious_wrong_versions(self):
        self.assertGreaterEqual(rank_video('Kiwi', 'Harry Styles', 'Harry Styles - Kiwi (Official Video)', 'HarryStylesVEVO', 183, 185), .88)
        self.assertEqual(rank_video('Kiwi', 'Harry Styles', 'Kiwi (Live Concert)', 'HarryStylesVEVO', 183, 185), 0)
        self.assertEqual(rank_video('Kiwi', 'Harry Styles', 'Kiwi (Official Cover)', 'A Fan', 183, 185), 0)
        self.assertEqual(rank_video('Kiwi', 'Harry Styles', 'Taylor Swift - Kiwi', 'Taylor Swift', 183, 185), 0)
        self.assertEqual(rank_video('Kiwi', 'Harry Styles', 'Harry Styles - Kiwi', 'HarryStylesVEVO', 183, 358), 0)
        self.assertEqual(rank_video('Falling', 'Harry Styles', 'Harry Styles - Falling Karaoke', 'HarryStylesVEVO', 240, 239), 0)
        self.assertGreaterEqual(rank_video('Falling', 'Harry Styles', 'Harry Styles - Falling (Official Video)', 'HarryStylesVEVO', 236, 242), .83)
        self.assertGreater(rank_video('Je te laisserai des mots', 'Patrick Watson', 'Patrick Watson - Je te laisserai des mots', 'Patrick Watson', 161, 162), .83)

    def test_metadata_titles_are_matched_to_recordings(self):
        self.assertEqual(song_query_title('Harry Styles - Falling (Official Video)','Harry Styles'), 'Falling')
        self.assertEqual(song_query_title('Kiwi (Audio)','Harry Styles'), 'Kiwi')
        self.assertEqual(song_query_title('Falling (Live)','Harry Styles'), 'Falling (Live)')
        self.assertEqual(song_query_title('Come On Eileen','Dexys Midnight Runners'), 'Come On Eileen')

    def test_video_durations_and_unicode(self):
        self.assertEqual(_video_duration('PT3M24S'), 204)
        self.assertEqual(_video_duration('PT1H2M4S'), 3724)
        self.assertEqual(_video_duration(''), 0)
        self.assertTrue(duration_ok(183, 190))
        self.assertFalse(duration_ok(183, 260))
        self.assertEqual(normalize('Beyoncé'), 'beyonce')


class ProviderTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.resolver = VideoResolver(client=None, api_key='fake-key')

    async def test_official_youtube_search_filters_unsupported_edits(self):
        vid1, vid2 = 'abcDEF12345', 'xyzXYZ78901'
        async def get_json(url, params):
            if url == YOUTUBE_SEARCH:
                return {'items': [
                    {'id': {'videoId': vid1}, 'snippet': {'title': 'Harry Styles - Kiwi (Live)', 'channelTitle': 'HarryStylesVEVO'}},
                    {'id': {'videoId': vid2}, 'snippet': {'title': 'Harry Styles - Kiwi (Official Video)', 'channelTitle': 'HarryStylesVEVO'}},
                ]}
            if url == YOUTUBE_VIDEOS:
                return {'items': [
                    {'id': vid1, 'status': {'embeddable': True, 'privacyStatus': 'public'}, 'contentDetails': {'duration': 'PT3M2S'}},
                    {'id': vid2, 'status': {'embeddable': True, 'privacyStatus': 'public'}, 'contentDetails': {'duration': 'PT3M4S'}},
                ]}
            raise AssertionError(url)
        self.resolver._json = get_json
        result = await self.resolver._youtube_lookup('Kiwi', 'Harry Styles', 183)
        self.assertEqual(result['videoId'], vid2)
        self.assertEqual(result['source'], 'youtube')

    async def test_restricted_embedding_is_not_selected(self):
        async def fake_json(url, params):
            if url == YOUTUBE_SEARCH:
                return {'items':[{'id':{'videoId':'abcDEF12345'},'snippet':{'title':'Harry Styles - Kiwi Official Video','channelTitle':'Harry Styles'}}]}
            return {'items':[{'id':'abcDEF12345','status':{'embeddable':False,'privacyStatus':'public'},'contentDetails':{'duration':'PT3M03S'}}]}
        self.resolver._json = fake_json
        self.assertIsNone(await self.resolver._youtube_lookup('Kiwi','Harry Styles',183))

    async def test_musicbrainz_uses_existing_artist_recording_relationship(self):
        async def mb(url, params):
            if url == MUSICBRAINZ+'/recording':
                return {'recordings':[{'id':'e7027a4b-c9f3-4f02-9adc-7d9c2e2e2b13','title':'Kiwi','score':100,'length':183000,'artist-credit':[{'name':'Harry Styles'}]}]}
            return {'relations':[{'target-type':'url','type':'streaming','url':{'resource':'https://www.youtube.com/watch?v=abcDEF12345'}}]}
        self.resolver._mb_json = mb
        result = await self.resolver._musicbrainz_lookup('Kiwi','Harry Styles',183)
        self.assertEqual(result['videoId'],'abcDEF12345')
        self.assertEqual(result['source'],'musicbrainz')

    async def test_musicbrainz_can_follow_music_video_recording_relationship(self):
        async def mb(url, params):
            if url == MUSICBRAINZ+'/recording':
                return {'recordings':[{'id':'e7027a4b-c9f3-4f02-9adc-7d9c2e2e2b13','title':'Kiwi','score':100,'length':183000,'artist-credit':[{'name':'Harry Styles'}]}]}
            if url.endswith('e7027a4b-c9f3-4f02-9adc-7d9c2e2e2b13'):
                return {'relations':[{'target-type':'recording','type':'music video','recording':{'id':'a7027a4b-c9f3-4f02-9adc-7d9c2e2e2b13'}}]}
            return {'relations':[{'target-type':'url','type':'streaming','url':{'resource':'https://youtu.be/abcDEF12345'}}]}
        self.resolver._mb_json = mb
        result = await self.resolver._musicbrainz_lookup('Kiwi','Harry Styles',183)
        self.assertEqual(result['videoId'],'abcDEF12345')

    async def test_cache_and_shared_pending_reduce_api_calls(self):
        self.resolver.api_key = ''
        calls = 0
        async def source(*args):
            nonlocal calls
            calls += 1
            await asyncio.sleep(.01)
            return {'videoId':'abcDEF12345','source':'musicbrainz'}
        self.resolver._resolve_uncached = source
        a,b = await asyncio.gather(self.resolver.resolve('Kiwi','Harry Styles',183),self.resolver.resolve('Kiwi','Harry Styles',183))
        c = await self.resolver.resolve('Kiwi','Harry Styles',183)
        self.assertEqual(calls,1)
        self.assertEqual(a,b)
        self.assertEqual(b,c)
        self.assertEqual(self.resolver.pending,{})


if __name__ == '__main__': unittest.main()
