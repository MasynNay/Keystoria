# Keystoria browser edition (v0.24.1)

The GitHub Pages portfolio at `/` now links to `/play/` with the original Keystoria app interface. It reuses the JavaScript gameplay controllers and styles copied from `app/web`.

**Available without the Python server:** Lyric Lab (including original local demo, lyric search via LRCLIB, and featured embedded YouTube videos subject to external availability), Speed Lab, Field Academy, settings, and the story-mission gallery as a preview.

**Server required:** All 24 story campaigns, cooperative rooms, and matchmaking. The Python `aiohttp`/WebSocket server in `app/` remains the source of truth and is unchanged. No mock server or simulated fake story play is shipped.

**Provider limitation:** The original `/api/music/resolve` endpoint cannot operate on static Pages. Unmatched videos can be connected manually through the existing YouTube link field, while known featured video IDs remain available.

**Published layout:** GitHub Actions uploads only `site/`. The app copy under `site/play/assets/` is explicitly adapted for GitHub Pages; it never repeatedly tries to connect to an unavailable WebSocket server.

**Rebrand:** The key+book icon has been replaced with a clean illuminated K portal mark across the portfolio, playable browser version, and local app branding assets.

**Validation:** Desktop and mobile offline Chromium smoke checks exercised the real Speed Lab typing input, Lyric Lab original demo/next-key indicator, Field Academy command input, initial modal, and status labels. Live external API and hosted DNS checks are separate.
