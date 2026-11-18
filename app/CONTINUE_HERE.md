# Keystoria — current development handoff

**Checkpoint:** November 18, 2026 (America/Denver) — verified production through PR #50; Lyric Lab finish-state accessibility next.  
**Repository:** [MasynNay/Keystoria](https://github.com/MasynNay/Keystoria)  
**Website:** https://keystoria.masynnay.com/  
**Playable static browser edition:** https://keystoria.masynnay.com/play/  
**Current work tracker:** [docs/ROADMAP.md](../docs/ROADMAP.md) and [open issues](https://github.com/MasynNay/Keystoria/issues)

## Latest shipped work — Speed Lab caret corrections (November 18, 2026)

[PR #50](https://github.com/MasynNay/Keystoria/pull/50) merged at `640a9be`; [production Pages run 44234682503](https://github.com/MasynNay/Keystoria/actions/runs/44234682503) succeeded. All five PR checks and all four post-merge checks (Pages, Mobile Typing, Themes, README screenshots) passed. Both the mobile next-character cue and spoken word/Numpad group cue now follow the real textarea caret, not merely the end of input, while preserving native typing and score accuracy.

**Next implementation:** Lyric Lab needs a fully navigable end-of-song state: a focused result heading, concise score recap and nearby replay/choose-song actions. Add a deterministic offline demo browser test covering typing and final-line skip, phone/desktop focus, replay and re-enabled controls. This is work toward [accessibility issue #3](https://github.com/MasynNay/Keystoria/issues/3), not physical iOS/Android or screen-reader certification.

## Latest verified release — keyboard navigation and phone typing (November 17, 2026)

[PR #49](https://github.com/MasynNay/Keystoria/pull/49) repaired keyboard focus after selecting Speed Lab categories/durations with Enter or Space, retained pointer-to-input focus, and cancelled stale asynchronous focus requests. [Production Pages run 44230747978](https://github.com/MasynNay/Keystoria/actions/runs/44230747978) succeeded. Post-merge Mobile Typing run 44230747889, Themes run 44230747922 and screenshot run 44230747910 all succeeded. There are no unintended open PRs at this checkpoint.

Earlier [PR #48](https://github.com/MasynNay/Keystoria/pull/48) aligned Speed Lab gameplay text with all 15 themes and added rendered color-pair checks at phone and desktop sizes. [PR #47](https://github.com/MasynNay/Keystoria/pull/47) added screen-reader word/group cues. [PR #46](https://github.com/MasynNay/Keystoria/pull/46) preserved the Practice Compass live region and focus during accuracy-goal/history updates. [PR #45](https://github.com/MasynNay/Keystoria/pull/45) added native, caret-aware Back Word correction.

**Next engineering task:** Keep both the visible next-character cue and screen-reader target aligned with native caret movement during earlier-word/number-group corrections (unit tests plus Chromium mobile/desktop), then release only after green CI and Pages deployment. This remains an accessibility/mobile improvement, not proof of actual hardware-keyboard or screen-reader compatibility. Issues #3 and #11 stay open for physical iOS/Android and assistive-technology verification.

## Earlier shipped milestone — Practice Compass portable results (November 16, 2026)

The versioned **RESTORE EXPORT** flow shipped via [PR #28](https://github.com/MasynNay/Keystoria/pull/28) and [successful gated Pages deployment 43984376330](https://github.com/MasynNay/Keystoria/actions/runs/43984376330). It validates and sanitizes a maximum of 25 Speed Lab records from a JSON export (128 KB cap), confirms before overwriting history, preserves accuracy goals and typing focus, and has mobile/desktop browser regression tests. It is manual data portability, **not account sync**. Keep [issue #5](https://github.com/MasynNay/Keystoria/issues/5) open for user feedback and broader progression; physical phone picker behavior is not yet verified.

## Current November 16, 2026 milestone

**Published feature:** [Practice Compass in PR #27](https://github.com/MasynNay/Keystoria/pull/27), passing [Mobile QA](https://github.com/MasynNay/Keystoria/actions/runs/43981317208) and [gated GitHub Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43981861050). Speed Lab offers local-only comparable session insights, accuracy goals, JSON export and confirmed history deletion, without replacing the native typing field. No remote storage was introduced; local history stays capped at 25.

**Other merged work:** [PR #26](https://github.com/MasynNay/Keystoria/pull/26) adds keyboard input at narrow desktop widths, and [PR #25](https://github.com/MasynNay/Keystoria/pull/25) proposes local-only co-op hosting and security gates in [COOP-HOSTING-DECISION.md](../docs/COOP-HOSTING-DECISION.md). Neither certifies real device accessibility nor hosts multiplayer.

**Next priorities:** Verify phone native keyboard prediction strip and full virtual-keyboard usability in [issue #11](https://github.com/MasynNay/Keystoria/issues/11); complete screen-reader and real zoom checks [#3](https://github.com/MasynNay/Keystoria/issues/3); obtain real feedback before expanding Practice Compass [#5](https://github.com/MasynNay/Keystoria/issues/5); review co-op threat model and security design before any public proof [#4](https://github.com/MasynNay/Keystoria/issues/4). All remain open. Keep the release honest: passing Chromium is not real iOS/Android QA.

## Previous Speed Lab mobile fixes — November 11, 2026

The user reported that Speed Lab was **unusable due to mobile lag**. [PR #23](https://github.com/MasynNay/Keystoria/pull/23) was merged, and [production GitHub Pages run 43148220125](https://github.com/MasynNay/Keystoria/actions/runs/43148220125) passed. A mobile-sized DOM window now renders no more than 220 characters from the full 700-word exercise, clock-only updates avoid redundant text/layout work, and the timer updates at 250ms. Full reference/scoring and desktop behavior are preserved; the new long-session browser QA passed.

**Subsequent user feedback:** The user confirmed the Speed Lab lag was **much better**. The remaining open question is whether native keyboard predictions actually appear and typing stays usable during longer sessions. Do not substitute Chromium emulation for device testing.

## Mobile keyboard usability follow-up

After [PR #23](https://github.com/MasynNay/Keystoria/pull/23), the user confirmed mobile Speed Lab performance was **much better**, but the native keyboard lacked suggestions and autocorrect. New native keyboard assist work enables those device features for phone word drills by default, with an exact-typing toggle and clearly separated score labels. This follow-up shipped in [PR #24](https://github.com/MasynNay/Keystoria/pull/24), passed six PR test suites, and [production Pages deployment 43150052557](https://github.com/MasynNay/Keystoria/actions/runs/43150052557) succeeded. **Real mobile keyboards are still not testable via Chromium automation.** Check the actual phone's keyboard settings and test the feature on iOS/Android, and keep issue #11 open.

## Practice Compass development history (now shipped)

A lightweight Practice Compass pilot was shipped in [PR #27](https://github.com/MasynNay/Keystoria/pull/27), with production Pages deployment verified. It offers progress summaries only for comparable Speed Lab records (same category/duration/input mode), an on-device 90/95/98% accuracy goal, manual JSON export and confirmation-protected local history deletion. Storage remains capped at 25. Do not close issue #5 until real user feedback is obtained.

## Historical November 11 checkpoint (preserved for provenance)

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
