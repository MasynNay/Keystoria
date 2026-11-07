# Lyric Lab — Playback, lyrics and rights

## Product and data flow

Lyric Lab is a separate local-browser practice mode, not a change to the campaign engine.

1. The homepage displays twelve preselected track titles/artists paired with known YouTube video IDs; **no music or copyrighted lyrics are included** in the repository.
2. Choosing a track sends a CORS request from the browser to the public [LRCLIB API](https://lrclib.net/docs) and retrieves its `syncedLyrics` on demand. The client includes a `Lrclib-Client` identification header, makes user-triggered requests, supports abort, and displays rate limits and errors.
3. The client uses the [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) to play the original video *in a fully visible iframe*; it does not download the audiovisual work, extract audio, mask controls, play in the background or redirect an iframe stream.
4. The game's timestamped lyric text is rendered separately, with words highlighted as the player types. The video `getCurrentTime` determines the active musical position; the user can adjust offset for a long music-video introduction or timing drift.
5. WPM, correct/attempted words, streaks, and accuracy are calculated locally. Only limited result metadata (track title/artist, WPM and score) may be saved to browser localStorage; lyrics/audio are **not** persisted or uploaded to the PANIC PROTOCOL server.
6. On non-featured searches LRCLIB can supply timed lyrics but cannot supply a verified YouTube video ID. The player now presents **FIND ON YOUTUBE** (official YouTube search in a separate tab) and **CONNECT VIDEO** (paste a video URL, no uploads). A strict parser accepts only YouTube watch/short/live/embed URLs or youtu.be links. The browser saves only the chosen video ID against the lyric track ID in localStorage for next time. Without a linked video the mode clearly labels silent timed-lyrics practice.
7. Song artwork: the twelve featured tracks and any explicitly linked songs use YouTube-hosted thumbnails when available; every song also gets an original procedural illustration as a fallback. No third-party album art is scraped, packaged or hosted.
8. The **PLAYING NOW** display follows the video clock, while **YOUR TURN** follows player progress. Press Enter (or the skip button) to skip the remaining lyric words in a difficult line, without receiving points and with skipped words included in the accuracy denominator. Space submits the current typed word. A visible SYNC button on each line calibrates timing for that line against the video position; saved per LRCLIB track and video ID, with 0.25-second fine adjustments and reset. Different recorded edits can still need manual alignment.
9. Playback-rate buttons choose from the official IFrame player's `getAvailablePlaybackRates()`; `setPlaybackRate()` changes the video, while lyric progress uses `getCurrentTime()`, preserving synchronization at 0.5×–2× where supported. The original offline beat and virtual playback clock also change rate. WPM uses elapsed wall-clock time, not media time. Not every YouTube video supports every rate.
10. For offline testing the original demo `Signals Through The Night` uses text written for PANIC PROTOCOL and a synthesized electronic beat via Web Audio, without remote resources.

## What SongTyping publicly describes

Its [FAQ](https://www.songtyping.com/faq) describes a synced embedded YouTube video, lyrics from Genius and YouTube captions, auto-pause when the user falls eight words behind, timed seek, jumping between lines, WPM, and accuracy. Its [Terms](https://www.songtyping.com/terms) additionally mention LRCLIB as a source. Its [DMCA policy](https://www.songtyping.com/dmca) explicitly states that *source attribution does not itself grant permission*. This project does not copy SongTyping's implementation, visual identity, data, website, or paywall behavior.

## Publishing/rights considerations

- Lyrics and recordings generally have separate rightsholders. **Using an API with no key requirement is not the same as receiving a reproduction/license grant for its lyrics.** Lyrics retrieved from LRCLIB are third-party data; the app has no ownership or sublicense to the texts. This is a technical demonstration, not legal advice or proof of commercial clearance.
- YouTube's [API policies](https://developers.google.com/youtube/terms/developer-policies) govern the embedded player. Respect embed restrictions, user controls, display size, ads, attribution and playback integrity. User-facing catch-up assist is optional; review service policies before public deployment.
- If distributing this as a business or commercial site, obtain appropriate lyrics permissions or connect an explicitly licensed lyrics provider; document attribution, takedown handling and territorial restrictions. Do not copy SongTyping's material or bypass its restrictions.
- Some YouTube videos are region-restricted or disallow embedding. LRCLIB may not have synchronized lyrics for a chosen recording. The app handles these cases as errors rather than downloading/rehosting content.
- This environment cannot access live third-party services, so automated tests mock LRCLIB/YouTube transport. Verify a selection of real featured songs on the user's machine with internet access before claiming a production-grade public catalog.

## Manual verification

`node --test tests/test_v018.mjs tests/test_v019.mjs tests/test_v020.mjs`

`PYTHONPATH=tests:. python tests/browser_v019.py && PYTHONPATH=tests:. python tests/browser_v020.py`

The browser test runs real UI click/type events but *stubs remote transport* because network access is blocked in CI. Test live video/lyrics manually on Mac or a deployed HTTPS origin.

## v0.21 Automatic video matching

- Selecting a non-featured LRCLIB result calls the local `GET /api/music/resolve?title=&artist=&duration=` endpoint. The backend returns a video ID **only** when it finds a plausible song/artist/recording match.
- Keyless option: public MusicBrainz recording relationships to YouTube. MusicBrainz coverage is uneven and catalog links may not embed or may be unavailable. No YouTube pages are scraped. Requests are throttled to roughly one per second and cached.
- Enhanced option: with `YOUTUBE_API_KEY` configured in the **server's environment**, the official YouTube Data API searches embeddable public videos and verifies duration and candidate titles. Defaults and quotas can change; consult Google's docs. The key is not transmitted to web clients.
- Matching is best effort. Without a key, not all songs will be linked; even with a key, no provider can guarantee every title has a correct playable video. On failure, timed-lyrics practice remains functional and the user can still connect a YouTube link.
- Lyrics and copyrighted video content remain third-party works. Playback uses the official embedded player; obtaining metadata is not a copyright license.

## v0.22 keyless video discovery

On selecting a searched lyric result, the local backend now tries documented public
Invidious and Piped search metadata services alongside MusicBrainz, without asking
users to upload audio files or video links. Search is bounded by strict timeouts;
artist/title, recording version and approximate duration are checked before
assigning a YouTube video ID to the official embed. These community services are
not stable contracts, do not grant usage rights, and cannot verify embed permission.
No song can be guaranteed to auto-connect. The optional official YouTube Data API
with a server key is the recommended higher-coverage route. Manual link and
calibration controls remain as fallbacks.

## v0.23 Live next-letter cue

During word entry, the yellow highlight remains on the current word. Each original character is rendered with a correct, incorrect, or pending state and the next required character flashes on the word itself. A small NEXT KEY label echoes the expected key; after a complete word it shows SPACE. Commas and sentence punctuation remain printed but are ignored for cursor alignment when strict punctuation is off. Accented Latin letters are aligned to their typing-equivalent basic letters in relaxed mode. In strict mode, literal case and punctuation must match. The cue respects prefers-reduced-motion and the app's reduced-motion setting. The prompt updates on live keyboard input, SPACE submission, ENTER skip, seek, restart, and strict-mode change.

Test with `node --test --test-concurrency=1 tests/test_lyric_word_feedback.mjs` and `PYTHONPATH=.:tests python tests/browser_lyric_cursor_v023.py`.
