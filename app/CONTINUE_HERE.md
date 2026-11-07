# KEYSTORIA v0.24 — REBRAND CHECKPOINT

The current release is `keystoria/`, copied from verified Panic Protocol v0.23 with the flashing lyric keystroke preserved. Rebranding changed presentation, launch messaging, favicon, metadata, splash/welcome text and documentation. The story engine, song integration, saved scores, localStorage namespaces, missions and WebSocket endpoints are unchanged.

## Checks and continuity

Run `python -m unittest discover -s tests -q` and `node --test --test-concurrency=1 tests/test_*.mjs`. Run `PYTHONPATH=.:tests python tests/browser_lyric_cursor_v023.py` with Chromium and Playwright if installed. Run `PYTHONPATH=.:tests python tests/browser_rebrand_v024.py` for the new branding and portfolio screenshots.

Older project history: `docs/DEV_JOURNAL_V023.md`, `docs/DEV_JOURNAL_V022.md`. The original historic static HTML fixture files are under `docs/legacy-previews` to keep the project root tidy. The current live frontend renders from `web/`.

Keystoria is a proposed brand; basic public web searches were performed, but no trademark clearance or domain ownership was established. Do not claim otherwise.

A static showcase is provided under `portfolio/`. Full gameplay requires a running Python WebSocket server. No public deployment has been completed by this artifact.
