"""YouTube video-ID discovery for Lyric Lab.

Uses official YouTube Data API with a server YOUTUBE_API_KEY. Without a key,
tries documented public metadata indexes and MusicBrainz recording URLs.
No media is downloaded; playback uses the official YouTube iframe.
Discovery is best-effort and public proxy availability is not guaranteed.
"""
from __future__ import annotations

import asyncio
import os
import re
import time
import unicodedata
from urllib.parse import urlparse, parse_qs

import aiohttp

YOUTUBE_SEARCH = 'https://www.googleapis.com/youtube/v3/search'
YOUTUBE_VIDEOS = 'https://www.googleapis.com/youtube/v3/videos'
MUSICBRAINZ = 'https://musicbrainz.org/ws/2'
USER_AGENT = 'PanicProtocolLyricLab/0.22 (https://github.com/MasynNay; local game)' 
BAD_VARIANTS = ('live', 'cover', 'remix', 'instrumental', 'karaoke', 'reaction', 'nightcore', 'slowed', 'sped up', '8d audio', 'tribute', 'tutorial', 'fan made', 'acoustic', 'demo', 'performance', 'interview')
VALID_ID = re.compile(r'^[a-zA-Z0-9_-]{11}$')
# Public, documented search proxies: metadata discovery ONLY; all playback stays
# inside YouTube's official iframe. These hosts may be offline at any moment.
INVIDIOUS_INSTANCES = (
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
)
PIPED_INSTANCES = (
    'https://pipedapi.kavin.rocks',
)



def normalize(text: str) -> str:
    folded = unicodedata.normalize('NFKD', str(text or '')).casefold()
    folded = ''.join(c for c in folded if not unicodedata.combining(c))
    return ' '.join(re.findall(r'[^\W_]+', folded, re.UNICODE))


def song_query_title(track: str, artist: str) -> str:
    """LRCLIB may store 'Artist - Title (Official Video)' as its track title."""
    title = str(track or '').strip()
    artist = str(artist or '').strip()
    if artist:
        title = re.sub(r'^'+re.escape(artist)+r'\s*[-–—:]\s*', '', title, flags=re.I)
    # Presentation labels are not the actual recording version.
    title = re.sub(r'\s*[\[(]\s*(?:official\s+)?(?:music\s+video|video|audio|lyric\s+video|lyrics?|visualizer)\s*[\])]\s*$', '', title, flags=re.I)
    return title.strip() or str(track or '').strip()


def clean_title(text: str) -> str:
    """Don't remove 'live' from a song whose actual title is 'Live Forever'."""
    text = re.sub(r'\([^)]{0,45}\)|\[[^]]{0,45}\]', ' ', str(text or ''))
    return normalize(text)


def youtube_id(url: str) -> str | None:
    """Only extract IDs from trusted YouTube hosts; never fetch supplied URLs."""
    try:
        parsed = urlparse(str(url))
        if parsed.scheme != 'https': return None
        host = (parsed.hostname or '').lower()
        if host in ('youtu.be', 'www.youtu.be'):
            candidate = parsed.path.strip('/').split('/')[0]
        elif host in ('youtube.com', 'www.youtube.com', 'music.youtube.com', 'm.youtube.com'):
            if parsed.path == '/watch': candidate = parse_qs(parsed.query).get('v', [''])[0]
            elif parsed.path.startswith(('/embed/', '/shorts/', '/live/')): candidate = parsed.path.split('/')[2]
            else: return None
        else: return None
        return candidate if VALID_ID.fullmatch(candidate) else None
    except (ValueError, IndexError, TypeError): return None


def duration_ok(expected: int, actual: int | float) -> bool:
    if not expected or not actual: return True
    return abs(float(expected) - float(actual)) <= max(18, min(32, expected * .12))


def rank_video(track: str, artist: str, video_title: str, channel: str, duration: int, actual_duration: int) -> float:
    """Conservative semantic gate: never silently attach an obvious cover or live edit."""
    wanted, performer = clean_title(track), normalize(artist)
    raw_title = normalize(video_title)
    cleaned = clean_title(video_title)
    if not wanted or not performer: return 0.0
    words = wanted.split()
    if not all(word in cleaned.split() for word in words): return 0.0
    channel_norm = normalize(channel)
    # A video by the wrong artist is not an acceptable automatic match.
    artist_words = [w for w in performer.split() if len(w)>1]
    if not artist_words or not (all(w in raw_title.split() for w in artist_words) or all(w in channel_norm.split() for w in artist_words)):
        return 0.0
    # Version tags in either the video title or track title are allowed only if same version was requested.
    target_norm = normalize(track)
    for variant in BAD_VARIANTS:
        if re.search(r'(?<!\w)'+re.escape(variant)+r'(?!\w)', raw_title) and not re.search(r'(?<!\w)'+re.escape(variant)+r'(?!\w)', target_norm):
            return 0.0
    if not duration_ok(duration, actual_duration): return 0.0
    score = .80
    if cleaned.startswith(performer+' '+wanted) or cleaned.startswith(wanted+' '+performer): score += .08
    if performer in channel_norm: score += .06
    if 'official' in raw_title or 'vevo' in channel_norm: score += .04
    if duration and actual_duration:
        diff = abs(duration-actual_duration)
        if diff <= 5: score += .06
        elif diff <= 12: score += .035
        else: score -= .03
    return round(min(score, 1), 3)


def _video_duration(value: str) -> int:
    """ISO 8601 duration from YouTube contentDetails (PT3M16S)."""
    match = re.fullmatch(r'P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', str(value or ''))
    if not match: return 0
    h,m,s = match.groups()
    return int(h or 0)*3600 + int(m or 0)*60 + int(s or 0)


class VideoResolver:
    def __init__(self, client: aiohttp.ClientSession, api_key: str = ''):
        self.client = client
        self.api_key = api_key.strip()
        self.cache: dict[tuple, tuple[float, dict]] = {}
        self.pending: dict[tuple, asyncio.Task] = {}
        self._mb_lock = asyncio.Lock()
        self._mb_last = 0.0

    async def resolve(self, track: str, artist: str, duration: int) -> dict:
        title, performer = str(track or '').strip()[:120], str(artist or '').strip()[:120]
        duration = max(0, min(int(duration or 0), 1500))
        title = song_query_title(title, performer)
        if not title or not performer or len(title) < 2:
            return {'videoId': None, 'source': 'none', 'reason': 'Missing song title or artist.'}
        key = (normalize(title), normalize(performer), duration//5)
        existing = self.cache.get(key)
        if existing and existing[0] > time.monotonic(): return existing[1]
        if key in self.pending: return await self.pending[key]
        # Limit the number of live requests and prevent one slow provider from blocking the game loop.
        task = asyncio.create_task(self._resolve_uncached(title, performer, duration))
        self.pending[key] = task
        try:
            answer = await task
            # Bound memory for a long-running local server.
            if len(self.cache) >= 500: self.cache.pop(next(iter(self.cache)), None)
            self.cache[key] = (time.monotonic()+(86400*15 if answer.get('videoId') else 1800), answer)
            return answer
        finally:
            if self.pending.get(key) is task: self.pending.pop(key, None)

    async def _json(self, url: str, params: dict) -> dict:
        async with self.client.get(url, params=params, headers={'User-Agent': USER_AGENT}) as response:
            if response.status != 200: return {}
            result = await response.json(content_type=None)
            return result if isinstance(result, dict) else {}

    async def _resolve_uncached(self, title: str, artist: str, duration: int) -> dict:
        if self.api_key:
            try:
                found = await asyncio.wait_for(self._youtube_lookup(title, artist, duration), timeout=7)
                if found: return found
            except (asyncio.TimeoutError, aiohttp.ClientError, ValueError): pass
        # Query keyless metadata sources in parallel. Three unavailable public
        # services must not add up to a long wait when a player picks a song.
        # Successful metadata finds are never treated as proof of embed rights.
        jobs = (
            asyncio.create_task(self._community_lookup(title, artist, duration)),
            asyncio.create_task(self._musicbrainz_lookup(title, artist, duration)),
        )
        try:
            completed, waiting = await asyncio.wait(jobs, timeout=7)
            for job in waiting: job.cancel()
            if waiting: await asyncio.gather(*waiting, return_exceptions=True)
            results = []
            for job in completed:
                try:
                    found = job.result()
                    if found: results.append(found)
                except (asyncio.TimeoutError, aiohttp.ClientError, ValueError, TypeError, OSError):
                    continue
            if results:
                return max(results, key=lambda r: (r.get('confidence') or 0, r.get('source') == 'youtube'))
        finally:
            for job in jobs:
                if not job.done(): job.cancel()
        return {'videoId': None, 'source': 'none', 'reason': 'No reliable YouTube recording was found. Public indexes may be unavailable; you can still connect a video manually.'}


    async def _community_get(self, url: str, params: dict):
        # The URL is selected exclusively from hard-coded HTTPS allowlists above,
        # never from a user's request. Only JSON metadata is handled.
        async with self.client.get(url, params=params, headers={'User-Agent': USER_AGENT},
                                   timeout=aiohttp.ClientTimeout(total=3.0), allow_redirects=False) as response:
            if response.status != 200: return None
            return await response.json(content_type=None)

    @staticmethod
    def _community_candidates(payload, provider: str):
        """Parse only recognized video entries and reject invalid IDs/durations."""
        if provider == 'piped':
            items = payload.get('items', []) if isinstance(payload, dict) else []
        else:
            items = payload if isinstance(payload, list) else []
        if not isinstance(items, list): return []
        candidates = []
        for item in items[:15]:
            if not isinstance(item, dict) or item.get('type') not in ('video','stream'): continue
            video_id = str(item.get('videoId') or '')
            if not VALID_ID.fullmatch(video_id):
                link = str(item.get('url') or '')
                video_id = youtube_id(link) or ''
                # Piped and Invidious return relative /watch?v= URLs. Never
                # fetch that URL; extract a validated 11-character ID only.
                if not video_id and link.startswith('/watch?'):
                    video_id = parse_qs(urlparse(link).query).get('v', [''])[0]
            if not VALID_ID.fullmatch(video_id): continue
            seconds = item.get('lengthSeconds') if provider == 'invidious' else item.get('duration')
            try: seconds = int(seconds)
            except (TypeError,ValueError): continue
            if seconds <= 0 or seconds > 1500 or item.get('liveNow') is True or item.get('isShort') is True: continue
            title = str(item.get('title') or '')[:180]
            artist = str(item.get('author') or item.get('uploaderName') or '')[:120]
            candidates.append((video_id,title,artist,seconds))
        return candidates

    async def _community_lookup(self, title: str, artist: str, duration: int) -> dict | None:
        query = f'{artist} {title} official audio'
        # Attempt at most three publicly documented endpoints. A 3 second
        # per-request deadline and 7 second total cap prevent blocked searches
        # from stalling the music interface indefinitely.
        targets = [
            ('invidious', f'{base}/api/v1/search', {'q':query,'type':'video'}) for base in INVIDIOUS_INSTANCES
        ] + [
            ('piped', f'{base}/search', {'q':query,'filter':'videos'}) for base in PIPED_INSTANCES
        ]
        best = None
        for provider,url,params in targets:
            try:
                body = await asyncio.wait_for(self._community_get(url,params),timeout=3.2)
            except (asyncio.TimeoutError,aiohttp.ClientError,ValueError,TypeError,OSError):
                continue
            for video_id,video_title,channel,seconds in self._community_candidates(body,provider):
                confidence=rank_video(title,artist,video_title,channel,duration,seconds)
                if confidence < .86: continue
                candidate={'videoId':video_id,'source':provider,'confidence':confidence,
                           'videoDuration':seconds,'videoTitle':video_title}
                if best is None or confidence > best['confidence']: best=candidate
            if best and best['confidence'] >= .94: break
        return best

    async def _youtube_lookup(self, track: str, artist: str, duration: int) -> dict | None:
        search = await self._json(YOUTUBE_SEARCH, {
            'part': 'snippet', 'q': f'{artist} {track} official music video',
            'type': 'video', 'videoEmbeddable': 'true', 'videoSyndicated': 'true',
            'maxResults': '8', 'key': self.api_key,
        })
        items = [item for item in search.get('items', []) if isinstance(item, dict) and VALID_ID.fullmatch(str(item.get('id', {}).get('videoId', '')))]
        if not items: return None
        ids = ','.join(item['id']['videoId'] for item in items)
        details = await self._json(YOUTUBE_VIDEOS, {'part': 'contentDetails,status', 'id': ids, 'key': self.api_key})
        by_id = {item.get('id'): item for item in details.get('items', []) if isinstance(item, dict)}
        best = None
        for item in items:
            video_id = item['id']['videoId']
            detail = by_id.get(video_id, {})
            status = detail.get('status', {})
            if status.get('embeddable') is not True or status.get('privacyStatus') != 'public': continue
            seconds = _video_duration(detail.get('contentDetails', {}).get('duration', ''))
            if seconds <= 0 or seconds > 1500: continue
            snippet = item.get('snippet', {})
            confidence = rank_video(track, artist, snippet.get('title',''), snippet.get('channelTitle',''), duration, seconds)
            if confidence < .83: continue
            candidate = {'videoId': video_id, 'source': 'youtube', 'confidence': confidence,
                         'videoDuration': seconds, 'videoTitle': str(snippet.get('title',''))[:180]}
            if best is None or confidence > best['confidence']: best = candidate
        return best

    async def _mb_json(self, url: str, params: dict) -> dict:
        async with self._mb_lock:
            wait = max(0, 1.1-(time.monotonic()-self._mb_last)) if self._mb_last else 0
            if wait: await asyncio.sleep(wait)
            self._mb_last = time.monotonic()
            return await self._json(url, params)

    async def _musicbrainz_lookup(self, track: str, artist: str, duration: int) -> dict | None:
        # Fuzzy lookup is intentionally restricted to the exact artist/title to avoid wrong recordings.
        safe_track = re.sub(r'["\\]', '', track)
        safe_artist = re.sub(r'["\\]', '', artist)
        records = await self._mb_json(MUSICBRAINZ+'/recording', {
            'query': f'recording:"{safe_track}" AND artist:"{safe_artist}"',
            'fmt': 'json', 'limit': '5',
        })
        matches=[]
        for recording in records.get('recordings', [])[:5]:
            if not isinstance(recording, dict): continue
            if clean_title(recording.get('title')) != clean_title(track): continue
            credits = ' '.join(a.get('name','') for a in recording.get('artist-credit',[]) if isinstance(a, dict))
            if normalize(artist) not in normalize(credits): continue
            if int(recording.get('score', 0)) < 85: continue
            rec_length = int(recording.get('length') or 0)//1000
            if not duration_ok(duration, rec_length): continue
            matches.append(recording)
        for recording in matches[:2]:
            recording_id = recording.get('id','')
            if not re.fullmatch(r'[a-fA-F0-9-]{36}', str(recording_id)): continue
            entry = await self._mb_json(f'{MUSICBRAINZ}/recording/{recording_id}', {'inc':'url-rels+recording-rels','fmt':'json'})
            for relation in entry.get('relations', []):
                if not isinstance(relation,dict) or relation.get('target-type') != 'url': continue
                video_id = youtube_id(relation.get('url', {}).get('resource', ''))
                if video_id and (relation.get('type') in ('streaming', 'music video', 'video', 'free streaming', 'stream for free')):
                    return {'videoId': video_id, 'source': 'musicbrainz', 'confidence': .84,
                            'videoTitle': recording.get('title',''), 'videoDuration': None}
            # Some artists link a studio recording to a separate "music video" recording.
            # Follow at most one verified relation; do not crawl arbitrary catalog URLs.
            for relation in entry.get('relations', []):
                if not isinstance(relation, dict) or relation.get('type') != 'music video' or relation.get('target-type') != 'recording':
                    continue
                video_recording = relation.get('recording') or {}
                related_id = str(video_recording.get('id', ''))
                if not re.fullmatch(r'[a-fA-F0-9-]{36}', related_id): continue
                child = await self._mb_json(f'{MUSICBRAINZ}/recording/{related_id}', {'inc':'url-rels','fmt':'json'})
                for link in child.get('relations', []):
                    if not isinstance(link, dict) or link.get('target-type') != 'url': continue
                    video_id = youtube_id(link.get('url', {}).get('resource', ''))
                    if video_id and link.get('type') in ('streaming', 'music video', 'video', 'free streaming', 'stream for free'):
                        return {'videoId': video_id, 'source': 'musicbrainz', 'confidence': .84,
                                'videoTitle': recording.get('title',''), 'videoDuration': None}
                break
        return None
