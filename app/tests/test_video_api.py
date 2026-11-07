"""HTTP endpoint keeps the provider token server-side and validates request inputs."""
import unittest
from unittest.mock import AsyncMock
from aiohttp.test_utils import TestClient, TestServer
from server.app import create_app, VIDEO_RESOLVER_KEY


class VideoApiTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.server = TestServer(create_app())
        self.client = TestClient(self.server)
        await self.client.start_server()
        self.resolver = self.server.app[VIDEO_RESOLVER_KEY]
        self.resolver.resolve = AsyncMock(return_value={'videoId':'abcDEF12345','source':'youtube','confidence':.95})

    async def asyncTearDown(self):
        await self.client.close()

    async def test_valid_song_only_returns_verified_metadata(self):
        response = await self.client.get('/api/music/resolve', params={'title':'Kiwi', 'artist':'Harry Styles', 'duration':183})
        self.assertEqual(response.status, 200)
        data = await response.json()
        self.assertEqual(data['videoId'], 'abcDEF12345')
        self.assertNotIn('key', data)
        self.resolver.resolve.assert_awaited_once_with('Kiwi','Harry Styles',183)

    async def test_rejects_bad_input(self):
        for params in ({'title':'','artist':'Harry Styles'}, {'title':'Kiwi','artist':'Harry Styles','duration':'999999'}, {'title':'Kiwi','artist':'Harry Styles','duration':'nan'}, {'title':'X'*200,'artist':'Harry Styles'}):
            response=await self.client.get('/api/music/resolve', params=params)
            self.assertEqual(response.status,400,params)

if __name__=='__main__': unittest.main()
