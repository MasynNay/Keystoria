# Keystoria development roadmap

**Last reviewed:** November 7, 2026  
**Status:** Actively maintained portfolio project; upcoming items are planned work, **not completed features**.  
**Play the browser edition:** https://keystoria.masynnay.com/play/  
**Tracked work:** https://github.com/MasynNay/Keystoria/issues

Keystoria is an evolving typing game collection with 24 authored story adventures, Lyric Lab, Speed Lab, and Field Academy. This roadmap records why the next changes matter, how we will verify them, and which features have already been delivered. Priorities may change after testing or feedback; the roadmap is not a promise of dates.

## Shipped and verifiable

| Milestone | Status | Evidence |
| --- | --- | --- |
| Keystoria v0.24 rebrand and organized source | **Shipped** | [Repository reorganization and Pages workflow](https://github.com/MasynNay/Keystoria/commit/fabf803523c8bd95269e5ea9660aba9e12a7675a) |
| GitHub Pages portfolio and custom-domain workflow | **Shipped** | [GitHub Actions deployment history](https://github.com/MasynNay/Keystoria/actions/workflows/pages.yml) |
| Browser-accessible Keystoria interface for Lyric Lab, Speed Lab, and Field Academy | **Shipped** | [Browser edition, logo refresh, and links](https://github.com/MasynNay/Keystoria/commit/9b4362c448fdb3b87befc61738ec2a85f6011a0a) |
| 24 story campaigns with room-based cooperative play | **Available locally** | [Python game server](../app/server/app.py) and [local launch instructions](../README.md#get-started); **not** publicly hosted |

Shipped refers to code merged and/or a GitHub Pages deployment—not a claim that every device, browser, or third-party media provider has been verified.

## Now — quality and predictable behavior

### 1. Browser practice regression testing
**Tracking:** [Issue #1 — Headless browser testing in CI](https://github.com/MasynNay/Keystoria/issues/1)  
**Why:** The portfolio opens the real practice UI. A deployment should fail if key buttons, typing inputs, or required routes break.  
**Exit criteria:** Automated Chromium tests verify homepage-to-app navigation, Speed Lab typing, Lyric Lab local demo and next-letter cue, and Field Academy command submission at desktop/mobile widths. CI blocks broken releases.

### 2. Lyric Lab reliability and graceful offline behavior
**Tracking:** [Issue #2 — Provider failures and recovery](https://github.com/MasynNay/Keystoria/issues/2)  
**Why:** Lyrics and optional media depend on external APIs; graceful failure is part of a credible product.  
**Exit criteria:** Loading, timeout, empty-result, and rate-limit states are clear; stale responses do not replace recent searches; the built-in demo remains usable; failure paths are covered by tests.

## Next — accessibility and architecture

### 3. Keyboard-first accessibility review
**Tracking:** [Issue #3 — Accessibility audit](https://github.com/MasynNay/Keystoria/issues/3)  
**Why:** Players should be able to navigate a typing game without a mouse or motion-heavy effects.  
**Exit criteria:** Focus, announcements, contrast, mobile interaction, and reduced-motion support pass a documented checklist.

### 4. Secure public story-mode feasibility study
**Tracking:** [Issue #4 — Co-op hosting architecture](https://github.com/MasynNay/Keystoria/issues/4)  
**Why:** GitHub Pages cannot host a persistent Python/WebSocket backend, and public rooms require safety and operational work.  
**Exit criteria:** Document hosting costs, WSS/TLS setup, rate limits, room expiration, reconnect behavior, single-worker constraints, and operational monitoring. Run a small proof of concept before deciding whether to launch. **No public co-op release is committed.**

## Later — meaningful long-term progression

### 5. Personal practice goals and useful insights
**Tracking:** [Issue #5 — Practice goals and progression](https://github.com/MasynNay/Keystoria/issues/5)  
**Why:** Learning should provide more than a streak or a number.  
**Exit criteria:** A tested design for local-first practice trends, clear goals, privacy/export/reset behavior, and actionable feedback. This is a concept until scoped and implemented.

## How this roadmap stays honest

- **Planned** means scoped as an issue, with no claim that implementation has started.
- **In progress** should be used only when there is verifiable implementation work or a linked pull request.
- **Shipped** requires merged changes and a passing relevant validation/deployment check.
- GitHub Issues are the work tracker. Close issues with linked commits or test evidence rather than silently changing the document.
- Update this file and the portfolio roadmap after meaningful milestones. Review priorities as usage and feedback change; avoid imaginary completion percentages or arbitrary deadlines.
- Releases should clearly distinguish the browser practice edition from the Python-hosted cooperative game.
- Any music-provider or external media integration must be evaluated for functionality **and** usage rights before broader public deployment.

## Feedback and development trail

Use [GitHub Issues](https://github.com/MasynNay/Keystoria/issues) for reproducible problems and proposals. Project history lives in [CHANGELOG](../app/CHANGELOG.md), [development journal](../app/docs/DEV_JOURNAL_V024.md), and the [development checkpoint](../app/CONTINUE_HERE.md). These files make it possible to resume work from the last verified milestone.
