# Development checkpoints (append only)

## 2026-11-07 — v0.18 design and implementation

- Inspected SongTyping published FAQ, Terms, DMCA; verified YouTube IFrame Player API and LRCLIB public timed lyric API documentation. Noted that attribution alone does not establish lyric permission.
- Identified all six new story cards accidentally inherited the Station Zero blue cover fallback in `missionArt`. Authored new art palettes for all 18; tied cover symbol, icon, genre, hover border to a unique mission-specific CSS palette.
- Added standalone Lyric Lab with 12 known video IDs, direct public LRCLIB timed lyrics search, in-browser synchronized lyric typing, scores, catch-up pause, offset, seek, line loop and original local practice beat. Integrated homepage entry and navigation; story gameplay remains server owned.
- Python engine regression: 72 passed. JavaScript regression: 72 passed using `--test-concurrency=1`. Browser v0.18 mocked-transport interaction: 18 mission color checks, song catalog, offline demo scoring, fake YouTube player, mobile. No live third-party network verification possible in sandbox.
