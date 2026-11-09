# Keystoria development roadmap

**Last reviewed:** November 8, 2026  
**Status:** Actively maintained portfolio project; upcoming items are planned work, **not completed features**.  
**Play the browser edition:** https://keystoria.masynnay.com/play/  
**Tracked work:** https://github.com/MasynNay/Keystoria/issues

Keystoria is an evolving typing game collection with 24 authored story adventures, Lyric Lab, Speed Lab, and Field Academy. Mobile-first gameplay is a near-term priority based on direct feedback, separate from desktop accessibility and planned content features. This roadmap records why the next changes matter, how we will verify them, and which features have already been delivered. Priorities may change after testing or feedback; the roadmap is not a promise of dates.

## Shipped and verifiable

| Milestone | Status | Evidence |
| --- | --- | --- |
| Keystoria v0.24 rebrand and organized source | **Shipped** | [Repository reorganization and Pages workflow](https://github.com/MasynNay/Keystoria/commit/fabf803523c8bd95269e5ea9660aba9e12a7675a) |
| GitHub Pages portfolio and custom-domain workflow | **Shipped** | [GitHub Actions deployment history](https://github.com/MasynNay/Keystoria/actions/workflows/pages.yml) |
| Browser-accessible Keystoria interface for Lyric Lab, Speed Lab, and Field Academy | **Shipped** | [Browser edition, logo refresh, and links](https://github.com/MasynNay/Keystoria/commit/9b4362c448fdb3b87befc61738ec2a85f6011a0a) |
| 15 persistent visual themes across browser and local app | **Shipped (v0.25)** | [Theme documentation](THEMES.md) and [automated end-to-end checks](https://github.com/MasynNay/Keystoria/actions/runs/42540558364) |
| 24 story campaigns with room-based cooperative play | **Available locally** | [Python game server](../app/server/app.py) and [local launch instructions](../README.md#get-started); **not** publicly hosted |

Shipped refers to code merged and/or a GitHub Pages deployment—not a claim that every device, browser, or third-party media provider has been verified.

## Now — mobile usability and dependable gameplay

### 1. Mobile-first gameplay redesign (high priority)
**Tracking:** [Issue #11 — Comfortable typing with the phone keyboard](https://github.com/MasynNay/Keystoria/issues/11)  
**Why:** A responsive layout is not enough for a typing game: the phone's software keyboard can obscure the prompt, steal much of the screen, and make controls difficult to reach.  
**Status:** **In progress** in [draft PR #12](https://github.com/MasynNay/Keystoria/pull/12), with [passing Chromium mobile regression tests](https://github.com/MasynNay/Keystoria/actions/runs/42551764690); **not shipped**. Real iOS/Android keyboard checks remain, and release follows the scheduled numpad PR #8.  
**First fixes:** Keep the active word and input visible together above the virtual keyboard; preserve focus as words advance; offer large touch-accessible submit, skip, and pause buttons; collapse secondary information while typing; avoid scroll jumps and hidden controls as the keyboard opens/closes.  
**Follow-up:** Evaluate an optional one-word or short-phrase mobile presentation for Lyric Lab and Speed Lab, including numeric practice. Keep existing desktop gameplay intact.  
**Exit criteria:** Lyric Lab, Speed Lab, and Field Academy can be completed without a physical keyboard; verify real iOS Safari and Android Chrome software keyboards in addition to automated narrow-viewport tests. Test portrait, landscape, safe areas, 15 themes, assistive technology, and timing/scoring behavior. Do not claim native-keyboard compatibility from browser-emulation screenshots alone.

### 2. Browser practice regression testing
**Tracking:** [Issue #1 — Headless browser testing in CI](https://github.com/MasynNay/Keystoria/issues/1)  
**Why:** The portfolio opens the real practice UI. A deployment should fail if key buttons, typing inputs, or required routes break.  
**Status:** **Partially implemented** through feature-specific Chromium and screenshot workflows; the requested comprehensive release gate is not complete.  
**Exit criteria:** Automated tests verify homepage-to-app navigation, Speed Lab typing, Lyric Lab offline demo and next-letter cue, and Field Academy command submission at desktop/mobile widths. CI prevents a broken release.

### 3. Lyric Lab reliability and graceful offline behavior
**Tracking:** [Issue #2 — Provider failures and recovery](https://github.com/MasynNay/Keystoria/issues/2)  
**Why:** Timed lyrics and optional video rely on external providers.  
**Status:** **Planned** for full failure-path coverage.  
**Exit criteria:** Clear loading, timeout, empty-result, blocked-media and rate-limit states; stale requests do not replace newer searches; built-in demo remains usable; meaningful automated fallback tests.

### 4. Speed Lab numpad number-entry challenge
**Tracking:** [Issue #6 — Numpad typing game](https://github.com/MasynNay/Keystoria/issues/6) · [Draft PR #8](https://github.com/MasynNay/Keystoria/pull/8)  
**Why:** Number entry is a distinct skill in finance, administration, and data-entry jobs.  
**Status:** **In development**, with an independently scheduled release review; not yet publicly shipped.  
**Exit criteria:** Timed digit drills, correct numeric speed/accuracy units, optional separators, local history, accessible desktop/mobile interaction, and verified CI before publication.

### 5. Industry-specific Speed Lab vocabulary
**Tracking:** [Issue #7 — Professional vocabulary packs](https://github.com/MasynNay/Keystoria/issues/7)  
**Why:** People in legal services, education, government, healthcare, finance, hospitality, and IT should practice words relevant to their work.  
**Status:** **Planned**.  
**Exit criteria:** Curated, non-sensitive vocabulary packs, clear category controls, reliable generation, and accurate score/history labels without real client, patient, or student data.

## Next — accessibility and architecture

### 6. Keyboard-first accessibility review
**Tracking:** [Issue #3 — Accessibility audit](https://github.com/MasynNay/Keystoria/issues/3)  
**Why:** Players should be able to navigate the desktop experience without a mouse or motion-heavy effects. Mobile-specific ergonomics are tracked separately in issue #11.  
**Exit criteria:** Focus, announcements, contrast, keyboard navigation, and reduced-motion support pass a documented checklist across all available themes.

### 7. Secure public story-mode feasibility study
**Tracking:** [Issue #4 — Co-op hosting architecture](https://github.com/MasynNay/Keystoria/issues/4)  
**Why:** GitHub Pages cannot host a persistent Python/WebSocket backend, and public co-op rooms require security and operational work.  
**Exit criteria:** Document hosting costs, WSS/TLS, rate limits, room expiration, reconnect behavior, single-worker constraints, and monitoring. Run a small proof of concept first. **No public co-op launch is committed.**

## Later — meaningful long-term progression

### 8. Personal practice goals and useful insights
**Tracking:** [Issue #5 — Practice goals and progression](https://github.com/MasynNay/Keystoria/issues/5)  
**Why:** Useful learning feedback goes beyond a streak or score.  
**Status:** **Concept**.  
**Exit criteria:** Design local-first trends, realistic goals, privacy/export/reset controls, and actionable insights, and validate before shipping.

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
