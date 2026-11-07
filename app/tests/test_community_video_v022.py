"""No-key video discovery is safe and survives unavailable public indexes."""
import unittest
from server.video_match import VideoResolver

class CommunityVideoTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.resolver=VideoResolver(client=None)

    async def test_piped_relative_watch_link_parses_without_any_external_fetch(self):
        payload={'items':[
            {'type':'stream','url':'/watch?v=abcDEF12345','title':'Harry Styles - Kiwi (Official Video)', 'uploaderName':'Harry Styles', 'duration':183},
            {'type':'stream','url':'/watch?v=not-an-id','title':'Fake','uploaderName':'Harry Styles','duration':183},
            {'type':'stream','url':'https://evil.example/watch?v=abcDEF12345','title':'Evil','uploaderName':'Harry Styles','duration':183},
        ]}
        got=self.resolver._community_candidates(payload,'piped')
        self.assertEqual(len(got),1)
        self.assertEqual(got[0][0],'abcDEF12345')

    async def test_invidious_search_skips_bad_versions_and_picks_correct_artist(self):
        calls=[]
        async def metadata(url,params):
            calls.append(url)
            return [
                {'type':'video','videoId':'abcDEF12345','title':'Harry Styles - Kiwi (Live)', 'author':'Harry Styles','lengthSeconds':183},
                {'type':'video','videoId':'zzzXYZ78901','title':'Harry Styles - Kiwi (Official Video)', 'author':'Harry Styles VEVO','lengthSeconds':184},
                {'type':'video','videoId':'qqqXYZ78901','title':'Kiwi - Somebody Else (Official Video)', 'author':'Other','lengthSeconds':183},
            ]
        self.resolver._community_get=metadata
        matched=await self.resolver._community_lookup('Kiwi','Harry Styles',183)
        self.assertEqual(matched['videoId'],'zzzXYZ78901')
        self.assertEqual(matched['source'],'invidious')
        self.assertEqual(len(calls),1)

    async def test_no_key_search_falls_back_to_musicbrainz(self):
        async def unavailable(*args): return None
        async def mb(*args): return {'videoId':'abcDEF12345','source':'musicbrainz'}
        self.resolver._community_lookup=unavailable
        self.resolver._musicbrainz_lookup=mb
        self.assertEqual((await self.resolver.resolve('Kiwi','Harry Styles',183))['source'],'musicbrainz')

if __name__ == '__main__': unittest.main()
