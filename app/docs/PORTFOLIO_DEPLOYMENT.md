# Publishing Keystoria in a portfolio

## Ready-made static portfolio showcase

The `portfolio/` directory is a standalone static showcase. Deploy that directory to GitHub Pages, Cloudflare Pages or another static host. It deliberately does **not** pretend to run co-op missions without a backend. Edit its content before publishing to add your own GitHub repository and separately hosted playable URL when available.

## A static portfolio page versus a playable deployment

A **static showcase page** (GitHub Pages, static Cloudflare Pages, etc.) can introduce the project with screenshots, the technology stack, source link, and demo recording. It cannot run the Python multiplayer engine or WebSocket rooms.

To host the **fully playable game**, deploy the complete `keystoria/` directory to a service capable of running one persistent Python process:

```bash
python -m pip install -r requirements.txt
PORT=8080 python -m server.app
```

Configure HTTPS and reverse-proxy WebSocket upgrades for `/ws`, and forward `/api/music/resolve` and `/assets/` to that same server. Because rooms are in memory, keep **a single worker**; multi-worker load balancing is not supported. See `docs/ARCHITECTURE.md` and `docs/PLAYTEST.md` for additional details. Automatic video matching is best-effort and may need third-party services or an optional server-side YouTube API key.

For a public portfolio, consider linking a static presentation page to the playable server. The self-contained original Lyric Lab demo does not require network music or an API key, but the **entire existing app is not a self-contained GitHub Pages app**. Do not claim that uploading only `web/` enables the co-op story campaign.

## Release checklist

1. Use this v0.24 source package, including the `server/`, `web/`, `tests/` and `docs/` directories.
2. Run the regression checks in `CONTINUE_HERE.md` and manually test original demo typing in your browser.
3. Verify a solo mission, a two-person room over HTTPS/WebSockets, and a small selection of real LRCLIB/YouTube searches from the deployment location.
4. Include the Lyric Lab screenshots in the portfolio page and link to the source repository and complete app's live origin if you host the server.
5. Review `docs/LYRIC_LAB.md` for music/lyrics rights considerations before making the experience public.

This document is a deployment guide, **not a claim that a live site has already been published**.
