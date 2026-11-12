# Keystoria development roadmap

**Last reviewed:** November 11, 2026  
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
| Speed Lab Numpad challenge with CPM scoring | **Shipped (November 9, 2026)** | [Merge commit](https://github.com/MasynNay/Keystoria/commit/92e8bda120e7520f0a9ac8556e5660d9add27b86), [passed numpad CI](https://github.com/MasynNay/Keystoria/actions/runs/42661101795), and [successful Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/42661319306) |
| Mobile practice Phase 1 (Speed, Lyric, Academy) | **Shipped in browser edition (November 11, 2026 Mountain Time)** | [PR #12](https://github.com/MasynNay/Keystoria/pull/12), [Numpad QA](https://github.com/MasynNay/Keystoria/actions/runs/43135604906), [Mobile QA](https://github.com/MasynNay/Keystoria/actions/runs/43135604935), [Themes QA](https://github.com/MasynNay/Keystoria/actions/runs/43135604933), and [successful Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43135800239). **Real iOS/Android keyboard QA remains outstanding.** |
| Six workplace Speed Lab vocabulary categories | **Shipped (November 11, 2026 Mountain Time)** | [PR #14](https://github.com/MasynNay/Keystoria/pull/14), [passing vocabulary and keyboard CI](https://github.com/MasynNay/Keystoria/actions/runs/43137092706), [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43137227461) |
| Browser gameplay regression gate before Pages deployment | **Shipped (November 11, 2026 Mountain Time)** | [PR #15](https://github.com/MasynNay/Keystoria/pull/15), [passing production browser gate and Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43138914794) |
| Lyric Lab provider recovery Phase 1 | **Shipped (November 11, 2026 Mountain Time)** | [PR #16](https://github.com/MasynNay/Keystoria/pull/16), [successful provider CI](https://github.com/MasynNay/Keystoria/actions/runs/43139756405), and [gated production deployment](https://github.com/MasynNay/Keystoria/actions/runs/43139905211) |
| Fail-closed Pages negative controls | **Shipped (2026-11-11 (America/Denver))** | [PR #17](https://github.com/MasynNay/Keystoria/pull/17), [CI](https://github.com/MasynNay/Keystoria/actions/runs/43140934977), [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43141092745) |
| Lyric Lab video matcher and stale-result recovery | **Shipped (2026-11-11 (America/Denver))** | [PR #18](https://github.com/MasynNay/Keystoria/pull/18), [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43141952768) |
| Keyboard dialog focus and return | **Shipped (2026-11-11 (America/Denver))** | [PR #19](https://github.com/MasynNay/Keystoria/pull/19), [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43142670372) |
| Silent lyric practice on blocked or absent video | **Shipped (2026-11-11 (America/Denver))** | [PR #20](https://github.com/MasynNay/Keystoria/pull/20), [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43143498175) |
| Keyboard skip navigation, focusable Speed Lab results, and reduced-motion checks | **Shipped (November 11, 2026 Mountain Time)** | [PR #21](https://github.com/MasynNay/Keystoria/pull/21), [successful Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43145095301) |
| 15-theme palette contrast regression guard | **Shipped (November 11, 2026 Mountain Time)** | [PR #22](https://github.com/MasynNay/Keystoria/pull/22), [Theme CI](https://github.com/MasynNay/Keystoria/actions/runs/43145545877), and [successful Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43145696865) |
| 24 story campaigns with room-based cooperative play | **Available locally** | [Python game server](../app/server/app.py) and [local launch instructions](../README.md#get-started); **not** publicly hosted |

Shipped refers to code merged and/or a GitHub Pages deployment—not a claim that every device, browser, or third-party media provider has been verified.

## Now — mobile usability and dependable gameplay

### 1. Mobile-first gameplay redesign (high priority)
**Tracking:** [Issue #11 — Comfortable typing with the phone keyboard](https://github.com/MasynNay/Keystoria/issues/11)  
**Why:** A responsive layout is not enough for a typing game: the phone's software keyboard can obscure the prompt, steal much of the screen, and make controls difficult to reach.  
**Status:** **Phase 1 shipped** through [merged PR #12](https://github.com/MasynNay/Keystoria/pull/12) after passing [mobile](https://github.com/MasynNay/Keystoria/actions/runs/43135604935), [numpad](https://github.com/MasynNay/Keystoria/actions/runs/43135604906), and [theme](https://github.com/MasynNay/Keystoria/actions/runs/43135604933) QA. [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43135800239) succeeded. **Issue #11 remains open:** real iPhone Safari and Android Chrome software-keyboard QA, landscape, assistive technology and subsequent refinements have not been verified.  
**Phase 1 delivered:** Input-adjacent cues, touch actions, viewport-aware scrolling, and Academy focus continuity. Verify these on actual mobile browsers before treating every phone-keyboard case as solved.  
**Follow-up:** Evaluate an optional one-word or short-phrase mobile presentation for Lyric Lab and Speed Lab, including numeric practice. Keep existing desktop gameplay intact.  
**Exit criteria:** Lyric Lab, Speed Lab, and Field Academy can be completed without a physical keyboard; verify real iOS Safari and Android Chrome software keyboards in addition to automated narrow-viewport tests. Test portrait, landscape, safe areas, 15 themes, assistive technology, and timing/scoring behavior. Do not claim native-keyboard compatibility from browser-emulation screenshots alone.

### 2. Browser practice regression testing
**Tracking:** [Issue #1 — Headless browser testing in CI](https://github.com/MasynNay/Keystoria/issues/1)  
**Why:** The portfolio opens the real practice UI. A deployment should fail if key buttons, typing inputs, or required routes break.  
**Status:** **Completed and [issue #1 closed](https://github.com/MasynNay/Keystoria/issues/1)**. PR #15 established predeployment gameplay checks, and [PR #17](https://github.com/MasynNay/Keystoria/pull/17) proved they fail when a critical link or app script is deliberately broken. [Production Pages deployment passed](https://github.com/MasynNay/Keystoria/actions/runs/43141092745). Repeatable local QA is documented in [QA.md](QA.md).  
**Exit criteria:** Automated tests verify homepage-to-app navigation, Speed Lab typing, Lyric Lab offline demo and next-letter cue, and Field Academy command submission at desktop/mobile widths. CI prevents a broken release.

### 3. Lyric Lab reliability and graceful offline behavior
**Tracking:** [Issue #2 — Provider failures and recovery](https://github.com/MasynNay/Keystoria/issues/2)  
**Why:** Timed lyrics and optional video rely on external providers.  
**Status:** **Completed and [issue #2 closed](https://github.com/MasynNay/Keystoria/issues/2)**. PRs [#16](https://github.com/MasynNay/Keystoria/pull/16), [#18](https://github.com/MasynNay/Keystoria/pull/18), and [#20](https://github.com/MasynNay/Keystoria/pull/20) handle provider timeout/rate limits, stale selection, bounded local video resolution, and one-click silent fallback for blocked or missing videos. [The final Pages deployment passed](https://github.com/MasynNay/Keystoria/actions/runs/43143498175). Provider availability and music licensing are not guaranteed.  
**Exit criteria:** Clear loading, timeout, empty-result, blocked-media and rate-limit states; stale requests do not replace newer searches; built-in demo remains usable; meaningful automated fallback tests.

## Next — accessibility and architecture

### Keyboard-first accessibility review
**Tracking:** [Issue #3 — Accessibility audit](https://github.com/MasynNay/Keystoria/issues/3)  
**Why:** Players should be able to navigate the desktop experience without a mouse or motion-heavy effects. Mobile-specific ergonomics are tracked separately in issue #11.  
**Status:** **Multiple accessibility phases shipped**: dialog Tab cycling and focus return in [PR #19](https://github.com/MasynNay/Keystoria/pull/19); skip links, changing-screen main landmarks, announced Speed Lab results and reduced-motion regression coverage in [PR #21](https://github.com/MasynNay/Keystoria/pull/21); and AA-level palette-token contrast checks for all 15 themes in [PR #22](https://github.com/MasynNay/Keystoria/pull/22). [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43145696865) succeeded. See [accessibility QA checklist](ACCESSIBILITY-QA.md). **Issue #3 remains open** for actual screen-reader testing, visual contrast of composited screens, text zoom and other manual checks.  
**Exit criteria:** Focus, announcements, contrast, keyboard navigation, and reduced-motion support pass a documented checklist across all available themes.

### Secure public story-mode feasibility study
**Tracking:** [Issue #4 — Co-op hosting architecture](https://github.com/MasynNay/Keystoria/issues/4)  
**Why:** GitHub Pages cannot host a persistent Python/WebSocket backend, and public co-op rooms require security and operational work.  
**Exit criteria:** Document hosting costs, WSS/TLS, rate limits, room expiration, reconnect behavior, single-worker constraints, and monitoring. Run a small proof of concept first. **No public co-op launch is committed.**

## Later — meaningful long-term progression

### Personal practice goals and useful insights
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
