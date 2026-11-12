# Keystoria — current development handoff

**Checkpoint:** November 11, 2026 (America/Denver) — stable stopping point for the night.  
**Repository:** [MasynNay/Keystoria](https://github.com/MasynNay/Keystoria)  
**Website:** https://keystoria.masynnay.com/  
**Playable static browser edition:** https://keystoria.masynnay.com/play/  
**Current work tracker:** [docs/ROADMAP.md](../docs/ROADMAP.md) and [open issues](https://github.com/MasynNay/Keystoria/issues)

## Most recent Speed Lab fix — November 11, 2026

The user reported that Speed Lab was **unusable due to mobile lag**. [PR #23](https://github.com/MasynNay/Keystoria/pull/23) was merged, and [production GitHub Pages run 43148220125](https://github.com/MasynNay/Keystoria/actions/runs/43148220125) passed. A mobile-sized DOM window now renders no more than 220 characters from the full 700-word exercise, clock-only updates avoid redundant text/layout work, and the timer updates at 250ms. Full reference/scoring and desktop behavior are preserved; the new long-session browser QA passed.

**First action when resuming:** Ask the user to retest **Speed Lab** on the same phone and browser, including typing for 30–60 seconds with the software keyboard open. If it remains laggy, investigate input-event duration and visualViewport scroll loops on a real device. **Issue #11 stays open** until actual mobile performance and keyboard behavior are verified. Do not substitute Chromium emulation for device testing.

## Mobile keyboard usability follow-up

After [PR #23](https://github.com/MasynNay/Keystoria/pull/23), the user confirmed mobile Speed Lab performance was **much better**, but the native keyboard lacked suggestions and autocorrect. New native keyboard assist work enables those device features for phone word drills by default, with an exact-typing toggle and clearly separated score labels. This follow-up must pass its new browser tests and Pages CI before it is called shipped. **Real mobile keyboards are still not testable via Chromium automation.** Check the actual phone's keyboard settings and test the feature on iOS/Android, and keep issue #11 open.

## Release state at this checkpoint

- All development PRs from tonight through [#22](https://github.com/MasynNay/Keystoria/pull/22) have been merged into `main`; **no open pull requests** were present at the checkpoint.
- Last verified gated Pages release before this documentation checkpoint: [GitHub Actions run 43146026599](https://github.com/MasynNay/Keystoria/actions/runs/43146026599), conclusion **success** for commit `150333b913b6ea6002b1d351a4e57164549606d6`. The browser regression and deploy jobs both passed.
- The subsequent `main` commit observed at checkpoint, `c0d87da1e3dbd73a54b82661c2ab9c482f090fa4`, only refreshed current README screenshot assets; it did **not** add unpublished application code.
- This handoff documentation update must itself pass the standard Pages release gate; verify the associated workflow before describing this documentation change as deployed. An automated screenshot refresh may advance `main` after deployment.
- Public GitHub Pages supports **Lyric Lab, Speed Lab and Field Academy**. The 24 authored story/co-op missions are **local-server functionality only**, not a public multiplayer service.

## Released work to preserve

- Browser release safety: Playwright gameplay checks, negative controls deliberately breaking the Play link/app loading, and a deploy job gated on passing tests. [Issue #1](https://github.com/MasynNay/Keystoria/issues/1) closed.
- Lyric Lab: bounded provider/video lookup, request cancellation, recovery from unavailable/blocked embeds and a silent practice option that keeps the lyric session. [Issue #2](https://github.com/MasynNay/Keystoria/issues/2) closed.
- Numpad and six workplace categories in Speed Lab, with isolated scoring checks.
- Mobile practice Phase 1 plus keyboard-visible navigation, dialog focus management, score announcements and reduce-motion behavior.
- Fifteen themes with automated foreground/surface contrast and CSS/JavaScript palette parity checks. **This is not a full WCAG or real-device certification.**
- Current documentation and screenshots in README, [changelog](CHANGELOG.md), [browser QA](../docs/QA.md), and [accessibility QA](../docs/ACCESSIBILITY-QA.md).

## Next session: work in this order

1. **Mobile typing and real-device evidence — [#11](https://github.com/MasynNay/Keystoria/issues/11).** Verify iPhone Safari and Android Chrome physical soft-keyboard behavior for all three browser modes. Check keyboard-open target visibility, portrait/landscape, safe areas, autocorrect/IME, focus continuity and touch actions. Browser emulation does not satisfy this acceptance criterion. With no hardware evidence yet, limit autonomous work to bounded, testable ergonomic fixes; keep the issue open.
2. **Finish the accessibility audit — [#3](https://github.com/MasynNay/Keystoria/issues/3).** Test actual NVDA/VoiceOver/TalkBack, visible focus, 200–400% zoom, contrast of *rendered components* across themes, and reduced-motion interactions. Add reproducible failures as regression tests; don't mark the overall audit complete based only on token contrast or Chromium.
3. **Decide on co-op deployment — [#4](https://github.com/MasynNay/Keystoria/issues/4).** Compare local-only, controlled demo and secure hosted backend. Document cost, WebSocket/WSS, origin and abuse controls, room limits/expiration, single-worker state, reconnect semantics and monitoring. **No public service launch** before a tested security design.
4. **Explore useful local practice progress — [#5](https://github.com/MasynNay/Keystoria/issues/5).** Design a bounded private-history dashboard with realistic goals, export/reset and optional suggestions. Get feedback before claiming a shipped feature.

For every next change, work from the fresh `main` SHA, use a feature branch and PR, keep local and `site/play/` editions aligned, run relevant automated checks, merge only on green CI, verify the gated production Pages deployment, and update the roadmap with evidence. Leave completed history intact.

## Repeatable verification

From the repository root, follow [docs/QA.md](../docs/QA.md) for dependencies and run `bash scripts/run-browser-qa.sh`. GitHub [Pages workflow](../.github/workflows/pages.yml) performs the authoritative predeployment browser gate. Treat live custom-domain/browser, software keyboard and external music-provider behaviors as **not independently verified** unless explicitly tested.

## Historic reference

The previous `v0.24` rebrand checkpoint is preserved in [DEV_JOURNAL_V024.md](docs/DEV_JOURNAL_V024.md). Its statements that nothing was publicly deployed are historical, **not** the current release status. Do not rename legacy `panic.*` browser storage keys without an explicit data migration.
