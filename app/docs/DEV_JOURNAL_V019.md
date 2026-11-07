# v0.19 development journal (append-only)

2026-11-07 — Started from v0.18 verified source. Root cause of silent searched tracks: `searchTimedLyrics()` only populates `videoId` via `featuredFor`, leaving other tracks without YouTube player. Do not use unofficial YouTube scraping or promise auto-video matching without a licensed search provider. Design official YouTube URL association workflow with no files, optional verified open data discovery. Home default compact preview; rate-aware demo and IFrame API.

2026-11-07 — Implemented collapsed mission gallery and local-only state. Added official YouTube URL parser, YouTube search link and link form, persisted video ID per LRCLIB track. Added 0.5×–2× speed controls using YouTube-supported rates, and rate-aware offline beat/clock. Verified `node --check`, 72 Python tests, old v0.18 JavaScript tests, four new v0.19 JS tests, and Chromium v0.19 test including linked video and saved association. Screenshot manually inspected for layout.

2026-11-07 — Full `make test` output reports 72 Python tests OK and 76 Node tests passed, zero failures. Browser v0.19 verifies compact gallery, video association, supported playback rates and mobile. Third-party live YouTube audio was not verified due to restricted network; no promise of universal automatic song-to-video matching.

2026-11-07 — Release candidate staged with no screenshot PNGs, caches or virtual environments; two compressed JPG previews retained. Fresh extraction passed 4 new Node tests and server health/version and asset endpoint checks. Mac TAR.GZ selected because the user successfully downloaded that format when ZIP links repeatedly failed.
