# Development log — PANIC PROTOCOL 0.20

## 2026-11-07 — What changed

User tested v0.19 on macOS and requested visible song artwork; Enter skip for Japanese, Korean or otherwise untypeable lyrics; and tighter synchronization across YouTube uploads.

**Artwork**: Linked/featured music videos now use the public YouTube video thumbnail URL as a CSS image, backed by locally generated distinctive vector poster art. Other LRCLIB tracks get unique procedural covers based on their title and artist. We deliberately do not scrape album artwork, extract audio, or bundle third-party copyrighted recordings/lyrics. When offline, thumbnail backgrounds fail gracefully and generated art is still visible.

**Typing**: Space submits the current word; Enter skips the remaining words in the current lyric line; visible button is accessible on mouse/touch. A held Enter key won't skip repeatedly. Attempts and skipped words are tracked separately. Skipped words advance progress but lower accuracy and never grant correct words, streak or WPM credit. Practice loop skips are non-scoring.

**Sync**: Video `getCurrentTime()` is authoritative while a linked YouTube player is loading, paused, or running. Separate PLAYING NOW display shows the line at the media position; YOUR TURN continues showing the player's typing position. A new SYNC button next to each lyric line adjusts the offset to the video timestamp at the moment it is pressed. Offsets are localStorage-scoped to the LRCLIB record ID and chosen video ID and can be incremented by 0.25 seconds or reset. Distinct video/lyric track lengths trigger an explanatory warning. Actual media/lyrics can still diverge with different cuts or covers, and third-party providers cannot be live-tested in offline CI.

## Verified tests

- `python -m unittest discover -s tests -v` — **72 tests passed**.
- `node --test --test-concurrency=4 tests/test_*.mjs` — **82 tests passed**.
- `python tests/browser_v019.py` — previous compact gallery, song linking, speed and mobile checks passed.
- `python tests/browser_v020.py` — actual Chromium UI verified art, scored skip, non-Latin recovery, video-to-lyric position and saved offset, and mobile overflow; remote transport mocked.
- `node --test tests/test_v020.mjs` — deterministic cover artwork, safety, skip scoring, multilingual script detection and timing math passed.

## Delivery / recovery

The user repeatedly had a broken ZIP download in ChatGPT but successfully downloaded a `.tar.gz` archive. Package this release as a lightweight `PANIC-Protocol-v020-MAC.tar.gz` with `panic-protocol/` top-level folder. Keep this journal and CONTINUE_HERE.md in the archive for further revisions after an input-stream error.
