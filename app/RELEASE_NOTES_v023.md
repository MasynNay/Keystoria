# PANIC PROTOCOL v0.23 — Live Lyric Keys

**Derived from:** v0.22, 24-mission Frontier Update. All existing modes remain in place.

### New

- Lyric Lab now animates the next expected character inside the yellow-highlighted word, as in the other typing modes.
- Correct and incorrect characters are green and red while you type. A compact NEXT KEY hint reflects the next key, SPACE when the word is complete, or BACKSPACE when the input extends beyond the target.
- Punctuation and accented letters align correctly with the existing relaxed word-matching rules; strict punctuation stays literal.
- The cue respects reduced-motion options and resets correctly on word submit, skip, jump, seek, restart, and mode changes.

### Validation

- Python: **93 tests passed**.
- JavaScript: **93 tests passed**.
- Real Chromium Lyric Lab interactive regression: **passed desktop and mobile**.
- Local HTTP smoke: `/health` reports version 0.23.0; index and new JS/CSS serve HTTP 200.
- Live YouTube and LRCLIB provider availability remains unverified in this network-limited build environment.

### Launch

macOS: extract, open `panic-protocol/`, and run `PORT=8096 bash run_mac.command`. In the browser use **ENTER LYRIC LAB → PLAY ORIGINAL DEMO** to verify the new typing cursor without a remote song.

### Portfolio publication

A static GitHub Pages page can **showcase** the project and screenshots, but **cannot run** its Python multiplayer server or `/api/music/resolve` song matching endpoint. Host the complete app on a server with WebSocket support for the fully playable experience. See `docs/PORTFOLIO_DEPLOYMENT.md`.
