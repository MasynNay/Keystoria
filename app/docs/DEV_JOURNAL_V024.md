# Keystoria v0.24 — Brand and portfolio milestone

- Continued from the verified v0.23 Lyric Lab source without replacing the original server, lyric syncing, 24 authored adventures, Speed Lab or Field Academy.
- Chosen name: **Keystoria**. New public tagline: **Every Key Opens a World.**
- Updated main UI branding in `web/ui/helpers.js`, `web/ui/views.js`, `web/ui/lyric-lab-controller.js`, `web/ui/speed-view.js`, page metadata, copy-to-clipboard messaging and `run_mac.command`.
- Replaced favicon and created scalable in-repo `web/keystoria-mark.svg`; added `web/styles/brand.css` after prior theme styles for cautious design changes.
- Updated `/health` version to `0.24.0` and stylesheet cache version to `0.24.0`.
- Added standalone `portfolio/` website with no runtime dependency, four game descriptions, engineering highlights and local-launch explanation.
- Kept `panic.*` browser storage keys for existing players' data. They are an internal compatibility detail, not shown as the public name.
- Moved stale root static fixtures into `docs/legacy-previews/` without deleting them.
- Python unit regression: 93/93 passed. JavaScript unit regression: 93/93 passed after updating assertions to new visible text and cache version.
- Browser smoke: `browser_rebrand_v024.py` passed mobile/desktop including new name and Lyric Lab live cursor. `browser_lyric_cursor_v023.py` passed. `browser_portfolio_v024.py` passed desktop/mobile resource validation and no horizontal overflow.
- Local server `/health` returned `status: ok`, `version: 0.24.0`. Network browser navigation was restricted by this environment, so browser UI tests loaded production modules as data URLs and mocked network transport, as documented in their test sources. No public streaming/YouTube providers or live two-person internet sessions were reverified in this pass.
- Marketing name uniqueness was lightly checked via public web search; older unrelated uses of “Keystoria” exist. Trademark and domain clearance have not been performed.

## Resume

Use `CONTINUE_HERE.md` as the current checkpoint. Main project source under `keystoria/`, with static showcase in `portfolio/`. Do not rename browser storage keys without an explicit migration strategy. A static host can publish `portfolio/`, but not the multiplayer app without Python/WebSocket infrastructure.
