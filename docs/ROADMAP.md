## Optional on-device phone responsiveness check — November 22, 2026

**Under release verification; physical phone diagnosis remains open.** Instead of inferring the cause of reported lag from desktop Chromium emulation, Keystoria now offers an explicit **START 10-SECOND CHECK** button in Settings. A small temporary panel stays above the existing practice screen while the player types or scrolls, recording only frame scheduling gaps, input-event counts for Keystoria typing controls, approximate input-to-next-animation-frame delay, and Long Task API data when supported. The original typing inputs, modes, themes, scores, playback and storage are unchanged.

The report is visible only on the player's device. It is never automatically uploaded or persisted. Typed text, song URLs, scores and personal records are never read; a shareable report includes browser user agent and viewport size, with both disclosed next to the opt-in control. Copy requires an additional explicit click; when clipboard access is blocked, the on-screen text remains selectable. Closing discards the report. Timeouts, manual stop and background/page-exit cleanup disconnect observers and event handlers. Results are *diagnostic proxies*, not a claim of measured end-to-end responsiveness or a production performance fix.

Node and Playwright tests cover missing browser Long Task support, percentile calculations, privacy, explicit opt-in, stable native textareas, phone/desktop capture, stop/restart and report close. **Still required:** Use this new check on the actual affected phone; note whether delay is on the home screen, typing, scrolling or video, and record the device/browser. Keep [mobile lag issue #82](https://github.com/MasynNay/Keystoria/issues/82) open until measured phone behavior is understood and addressed.

## Speed Lab clock-only tick optimization — November 22, 2026

**Pending CI and physical-device verification.** Speed Lab's 250ms timer previously re-ran full-passage character scoring and refreshed the visual/spoken caret guidance even when the typing text was unchanged. This adds avoidable main-thread work as a passage grows, particularly while a software keyboard is open.

The controller now caches correct-character and numpad-digit counts for the current session/text. New edits, deletions, corrections and IME commits invalidate the snapshot; timer-only ticks recalculate time-dependent WPM/CPM from those counts without re-scanning typed text. The passage, native textarea, next-key cues, score labels, pause policy, input help and finished scoring remain unchanged. Selection-only changes still use their existing direct guidance handler.

A new Playwright regression checks native selection access during idle timer ticks, live time/speed updates, edits that change accuracy, and caret preservation across phone and desktop test contexts. This is a deterministic Chromium correctness regression, **not proof of better physical-phone latency**. Keep [real-phone lag issue #82](https://github.com/MasynNay/Keystoria/issues/82) open until an affected device is retested.

## Compact phone rendering budget — November 22, 2026

**Pending release and physical-device verification.** The full-screen `.grain` overlay draws SVG fractal noise using `feTurbulence` above the entire page. Its fixed filtered layer can add GPU/compositor work while mobile users scroll and type. The new stylesheet omits only this low-opacity texture on touch-sized screens, preserving themes, controls, lessons, score feedback, and the original desktop design (including narrow desktop zoom).

When a compact phone's native typing field has focus, character highlights no longer animate their color/background transitions or caret blinking, and Lyric Lab's progress bar updates without an extra width animation. Correct/incorrect/current states and timing information still change immediately. The existing effects return on blur; hardware-keyboard desktop animations remain unchanged. This is a paint/animation-budget optimization, not a gameplay rewrite.

A new Playwright test checks computed styles across six touch/desktop viewport and pointer combinations, focus/blur restoration, and Lyric Lab progress behavior. It runs alongside the full mobile, accessibility and browser release gates. **No real-device frame-time improvement is claimed** until the affected phone is measured; [mobile lag issue #82](https://github.com/MasynNay/Keystoria/issues/82) remains open.

## Mobile manual-scroll and keyboard-recovery performance — November 22, 2026

**Release verification pending.** The browser previously treated every `visualViewport.scroll` event like a keyboard resize, scheduling a main-thread focus-bounds measurement and scrolling the document back to the currently focused typing field. On phones this could fight an intentional swipe down to view reference material or actions, and create repeated layout and scroll events while typing. The viewport helper now **ignores ordinary pan/scroll events when viewport dimensions are unchanged**, while continuing to correct on focus, actual resize/rotation, BFCache return and document foregrounding. It still detects unusual mobile-browser geometry changes reported only as visual-viewport scroll events (width or height differs).

The phone/touch landscape/desktop browser regression now exercises a burst of scroll-only events while the native practice input remains focused and asserts **zero forced bounds reads and zero automatic scroll corrections**, plus an isolated scroll-only keyboard-size change if the Chromium test supports overriding its viewport dimensions. Existing tests verify focus recovery, instant keyboard corrections and no detached inputs. This is synthetic Chromium coverage, not a measurement on the user's physical phone; [issue #82](https://github.com/MasynNay/Keystoria/issues/82) remains open until real-device verification.

## Mobile input DOM stability — November 22, 2026

**Release candidate (physical-phone verification still required):** Field Academy and co-op story character feedback previously rebuilt the full character-span tree on every typed letter, including while a phone's native keyboard was active. The shared feedback painter now mounts the prompt once per reference/scoring mode and updates only changed character classes, extra keystrokes and the end caret. It preserves the public pure-render markup, exact/case-relaxed scoring, Unicode code points, and typed text. Changing the command, scoring mode, or replacing the view forces a fresh mount.

Lyric Lab now rebuilds its surrounding seven-row lyric navigation and nonactive word spans only on actual lyric-line/word transitions. Individual keystrokes repaint the active word instead of replacing the entire line and its focusable JUMP/SYNC buttons. Unchanged status and meter DOM updates remain guarded.

A new Playwright gate asserts rendering equivalence with the original pure feedback renderer across Unicode, mistakes, overtyping and deletion; prompt/target node identity across successive Academy edits; and stable Lyric Lab line navigation and native text input on 390px touch and 1440px desktop. It runs alongside the existing mobile keyboard, viewport, completion, co-op and security regressions. These are software-level mitigations, **not a claim that lag is gone on the reported physical phone**. Keep [mobile regression issue #82](https://github.com/MasynNay/Keystoria/issues/82) open pending an actual device and mode-specific performance trace.

## Mobile performance regression response — November 22, 2026

**Release blocker reported by a player:** Phone usage has become unacceptably slow and laggy again. The browser implementation contained two sources of avoidable main-thread churn. In compact Speed Lab, every text input caused synchronous computed-style and bounding-rectangle reads immediately after DOM character-class writes, forcing layout while the phone's native keyboard was entering text. The renderer now updates the visible caret synchronously but batches caret-scroll geometry into one animation frame; stale pending frames are cancelled when exercises change. In Lyric Lab, its 180 ms timer rewrote score text nodes even when the score was unchanged; these writes are now conditional. No scoring, assistance labels, lesson progress, word content, timers, accessibility descriptions, or static hosting behavior were intentionally changed.

The new Chromium checks simulate rapid mobile input and verify **zero synchronous passage-layout reads during input**, with bounded deferred scroll measurements. They also count paused Lyric Lab score mutations across several timer ticks. Existing 320/390px phone, short landscape, desktop reflow, 700-word accuracy, native input/caret, and provider tests remain gates. **This automated regression coverage is not proof of a fix on the affected physical phone**; repeat typing tests on actual iOS/Android hardware and ask the player which screen and browser remain essential.

## Field Academy checkpoint privacy reset — November 22, 2026

**Under release verification:** The Academy library now offers **CLEAR UNFINISHED COURSE PROGRESS** only when one or more resumable courses exist. A confirmation explains that the action clears the three courses' local checkpoints, **not** earned course-completion badges or typed drafts (which are never stored). Cancel leaves progress untouched. A successful clear returns focus to the Academy heading; the reset button disappears, and courses offer OPEN TERMINAL again. Node tests cover bulk erase, retained badges and blocked storage; browser phone/landscape/reflow/desktop tests cover cancel, confirmation, saved-draft privacy, focus, and unchanged completion badges. This does not imply physical-device or screen-reader certification.

## Field Academy resume checkpoints — November 21, 2026

**New local-only feature under release verification:** Each of the three Field Academy courses can resume at its last completed command step after navigating away or reloading the page. The current randomized command order, step index, Check/Next status, and mistake tally are saved in a small versioned browser-local checkpoint. Draft commands and private keystrokes are **never** saved. Course cards distinguish **CONTINUE COURSE** from **OPEN TERMINAL**, and a completed course clears its checkpoint while retaining the existing completed badge. Reshuffling resets just that course's saved order. Invalid or stale checkpoints fail closed to a fresh course; storage errors must not interrupt typing. Node and Chromium phone/touch-landscape/reflow/desktop checks cover reload, focus, privacy, completion and schema safety. Real iOS/Android and assistive-technology validation remains open.

# Keystoria development roadmap

**Last reviewed:** November 18, 2026  
**Status:** Actively maintained portfolio project; upcoming items are planned work, **not completed features**.  
**Play the browser edition:** https://keystoria.masynnay.com/play/  
**Tracked work:** https://github.com/MasynNay/Keystoria/issues

Keystoria is an evolving typing game collection with 24 authored story adventures, Lyric Lab, Speed Lab, and Field Academy. Mobile-first gameplay is a near-term priority based on direct feedback, separate from desktop accessibility and planned content features. This roadmap records why the next changes matter, how we will verify them, and which features have already been delivered. Priorities may change after testing or feedback; the roadmap is not a promise of dates.

## Latest local co-op security release (#4)

[PR #55](https://github.com/MasynNay/Keystoria/pull/55) corrected the direct Python server's bind address to **127.0.0.1 by default**, with explicit `HOST` required for LAN access. The Docker host-port example is loopback-only and the new real aiohttp WebSocket security gate exercises origin, oversized-frame, and message rate controls. [Production Pages deployment 44429880937](https://github.com/MasynNay/Keystoria/actions/runs/44429880937) and [post-merge server-security run 44429880931](https://github.com/MasynNay/Keystoria/actions/runs/44429880931) both succeeded. No public co-op service was deployed.

## Released connection and room quotas (#4)

[PR #56](https://github.com/MasynNay/Keystoria/pull/56) introduced **32 global / 8 per TCP peer** active WebSocket limits and a **4 creations per peer / 60-second** rolling window. This covers idle connections and preserves join/reconnect access, with 256 bounded in-memory peer windows. The actual TCP peer is used, not spoofable forwarded headers. [Post-merge security tests](https://github.com/MasynNay/Keystoria/actions/runs/44431538862) and [Pages publishing](https://github.com/MasynNay/Keystoria/actions/runs/44431538834) passed. No remote hosting was enabled.

## Released reconnect identity handoff (#4)

[PR #57](https://github.com/MasynNay/Keystoria/pull/57) rotated private reconnect passes, rejected replayed/malformed/wrong-room credentials, transferred ownership before closing the displaced socket, and blocked old socket actions. [Post-merge security CI](https://github.com/MasynNay/Keystoria/actions/runs/44438586739) and [Pages publishing](https://github.com/MasynNay/Keystoria/actions/runs/44438586712) passed. No login system, hosted co-op service or public authentication was added.

## Released concurrent room isolation and lost-welcome verification (#4)

[PR #58](https://github.com/MasynNay/Keystoria/pull/58) restricted private room snapshots to enrolled player objects, suppressed broadcasts for retired rooms and tested two simultaneous rooms against cross-room actions and token access. Lost reconnect welcome messages fail closed: start a new local room, never reuse a spent token. [Post-merge security CI](https://github.com/MasynNay/Keystoria/actions/runs/44441236587) and [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/44441236620) passed.

## Released expired room socket cleanup (#4)

[PR #59](https://github.com/MasynNay/Keystoria/pull/59) sends a room-expired notice and closes WebSockets whose in-memory rooms have expired, releasing connection slots while preserving other rooms and idle sockets. [Post-merge Python security tests](https://github.com/MasynNay/Keystoria/actions/runs/44448828662) and [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/44448828821) passed. Local-only, not publicly hosted.

## Released join/reconnect probing limits (#4)

[PR #60](https://github.com/MasynNay/Keystoria/pull/60) added a 12-request rolling-minute quota per observed TCP peer across failed and valid join/reconnect attempts, without changing existing player controls. [Security CI](https://github.com/MasynNay/Keystoria/actions/runs/44457856372) and [Pages publishing](https://github.com/MasynNay/Keystoria/actions/runs/44457856448) passed.

## Current local-client recovery experience (#4)

When a room expires or a reconnect pass is invalid, replace transient error toasts with a persistent, screen-reader-accessible panel that offers creating a new room or joining a new invite. Clear unusable cached credentials; do not retry stale passes. On a temporary room-access cooldown, preserve the pass, avoid repeated automatic guesses and offer an explicit retry once permitted. Include pure tests in the server-security and Pages CI gates. The static Pages practice edition remains unchanged; no public multiplayer is being enabled. Keep #4 open.

## Latest verified release — mobile Word Focus (November 18, 2026)

[PR #53](https://github.com/MasynNay/Keystoria/pull/53) introduced optional Word Focus for compact touch Speed Lab while keeping the full passage default. It preserves native input focus, earlier-caret corrections, pending Space and Numpad group tracking, full WPM/CPM scoring and existing phone keyboard-assistance labels. Six PR checks and [production GitHub Pages run 44351316321](https://github.com/MasynNay/Keystoria/actions/runs/44351316321) passed, along with post-merge Mobile/Theme/Screenshot checks. Actual iOS/Android and screen-reader verification remain open in #3/#11.

## Released Practice Compass qualified best (#5)

Practice Compass's recent-five trend should not be presented as a lifetime personal best. The next change labels this scope explicitly and adds the best matching speed recorded at or above the selected accuracy goal, computed over at most 25 locally saved results. Category, duration, exact/assisted input mode and Numpad CPM remain isolated; adjusting the 90/95/98% goal updates the best without rewriting any scores, changing the export format or adding cloud storage. Unit and mobile/desktop browser checks cover older saved records, changes to goal thresholds, clearing/export, input focus and history scope. [PR #54](https://github.com/MasynNay/Keystoria/pull/54) merged at `60a12e4` after five green pull-request workflows, and [production Pages run 44361406725](https://github.com/MasynNay/Keystoria/actions/runs/44361406725) completed successfully. The pilot remains open for user feedback. Actual user feedback is still required before closing progression issue #5.

## Practice Compass next-session guidance under verification (#5)

The next Practice Compass iteration proposes a gentle, **optional next-session target** derived only from the newest saved comparable session. If its accuracy falls below the selected 90/95/98% goal, the suggestion prioritizes accuracy instead of speed. If accuracy meets the goal, it recommends just 2 additional WPM (or 5 CPM for Numpad), not an unreachable historical best. First-time and max-range cases have explicit fallbacks. Suggestions update on goal changes, restore and clear without replacing the active typing field or changing result-history/export schemas. Phone-assisted/exact sessions, categories and durations remain isolated. Automated unit and browser tests must pass before this can be called released; physical iOS/Android and real-user feedback remain outstanding.

## Priority fix: Speed Lab mobile lag (reported November 11, 2026 Mountain Time)

**User-reported release blocker:** Speed Lab was effectively unusable due to lag when typing on a phone. This is tracked in [issue #11](https://github.com/MasynNay/Keystoria/issues/11). The mobile renderer previously mounted individual spans for all ~700 words and repeatedly measured layout during 100ms timer refreshes. A 220-character mobile rendering window and lower-frequency clock **shipped in [PR #23](https://github.com/MasynNay/Keystoria/pull/23)**; [Mobile QA](https://github.com/MasynNay/Keystoria/actions/runs/43148033242) and [production Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43148220125) passed. The new regression tests cover DOM bounds, cursor progression, backspace and score retention. Desktop retains full-passage rendering. **The user subsequently confirmed mobile Speed Lab was much better.** Native phone keyboard predictions and full iOS/Android experience still need device verification; issue #11 remains open.

## Mobile keyboard assistance follow-up (November 11, 2026)

**User feedback:** The mobile Speed Lab performance fix in PR #23 substantially improved responsiveness, but the native phone keyboard had no predictions or autocorrect, making typing frustrating. The underlying Speed Lab textarea explicitly disabled `spellcheck`, `autocorrect` and `autocomplete`.

**Shipped:** Default-on **Keyboard Help** for phone word drills, with native spelling/autocorrect requests, a one-tap Exact Typing opt-out, and distinct Assisted score labels. [PR #24](https://github.com/MasynNay/Keystoria/pull/24) passed [mobile browser QA](https://github.com/MasynNay/Keystoria/actions/runs/43149820811) and the [production Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43150052557). The user confirmed prior mobile lag was **much better**, but has not yet verified this new keyboard help on the physical phone. Device-native suggestions remain dependent on system keyboard preferences. Numpad and desktop stay exact.

**Important:** Browsers cannot force a disabled predictive keyboard or guarantee how keyboard vendors display suggestions. The game's toggle only requests native support. Keep [mobile issue #11](https://github.com/MasynNay/Keystoria/issues/11) open until real iOS Safari and Android Chrome testing.

## Practice Compass pilot — local-first progression (#5)

**Shipped in [PR #27](https://github.com/MasynNay/Keystoria/pull/27)** with [passing Mobile QA](https://github.com/MasynNay/Keystoria/actions/runs/43981317208) and [successful gated Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43981861050): category/duration/input-mode-matched Speed Lab insights, last-five comparable run summary, adjustable on-device accuracy goal (90/95/98%), actionable accuracy-first feedback, and one-click JSON export/confirmed deletion for the existing bounded 25-result history. Assisted phone runs, exact desktop runs and Numpad CPM are not compared as the same metric.

Automated unit tests cover filters, storage failures, Numpad and history deletion; Playwright at phone and desktop widths covers actual controls, persistence, downloading, confirmed deletion and preservation of an active typing input. This is a **pilot**, not the completed long-term progression system; actual usability feedback and phone testing are still needed. See [issue #5](https://github.com/MasynNay/Keystoria/issues/5).

## Speed Lab portable history restoration (November 16, 2026)

**Shipped in [PR #28](https://github.com/MasynNay/Keystoria/pull/28)** with six passing PR checks and [successful production Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43984376330): **RESTORE EXPORT** lets an exported JSON file be loaded on another device without accounts or cloud synchronization. It accepts only the versioned Keystoria Speed Lab export format, validates up to 25 records and their scoring types, strips unsupported fields, rejects malformed or oversized files, and asks before replacing any local history. Accuracy-goal preferences and active typing are preserved. The mobile/desktop browser release tests cover invalid data, canceled and confirmed replacement, export round trips and metric isolation.

This remains part of open [progression issue #5](https://github.com/MasynNay/Keystoria/issues/5). Manual export/restore is shipped; automatic multi-device syncing, the complete progression system, and physical phone-file-picker verification are **not**.

## Latest verified release checkpoint — November 18, 2026

- [PR #50](https://github.com/MasynNay/Keystoria/pull/50) synchronized the visual next-key and spoken word/Numpad group cues with the native typing caret during corrections. [Production Pages run 44234682503](https://github.com/MasynNay/Keystoria/actions/runs/44234682503) passed on the first attempt after five green PR checks; post-merge mobile, theme and screenshot workflows also passed.
- **Current engineering focus:** Lyric Lab completion should transition from disabled input to an explicitly focused result heading, a readable score recap and replay/song-selection controls. Add original offline demo browser tests at phone, touch landscape, narrow desktop and wide desktop sizes. Keep real mobile keyboard and screen-reader verification open.
  
## Previous verified release checkpoint — November 17, 2026

- [PR #49](https://github.com/MasynNay/Keystoria/pull/49) fixed focus continuity for keyboard-triggered Speed Lab category/duration changes; [production Pages run 44230747978](https://github.com/MasynNay/Keystoria/actions/runs/44230747978) passed after all five pull-request checks. Post-merge mobile, theme and screenshot workflows also passed.
- [PR #48](https://github.com/MasynNay/Keystoria/pull/48) aligned Speed Lab with the 15 themes and added 4.5:1 computed flat-surface contrast checks at desktop and touch widths. Its first post-merge Pages browser gate exposed an intermittent category-focus test timeout; that identical build deployed after a successful retry. PR #49 targeted the plausible focus race and strengthened regression coverage.
- [PR #47](https://github.com/MasynNay/Keystoria/pull/47) added persistent screen-reader word/Numpad group targets; [PR #46](https://github.com/MasynNay/Keystoria/pull/46) kept Practice Compass controls and live announcements mounted; [PR #45](https://github.com/MasynNay/Keystoria/pull/45) added Back Word editing. These releases improved correction and keyboard access without changing the game's local-only data policy.

**Current next implementation:** Synchronize the visual next-character prompt and spoken target to the native input caret when correcting earlier words or digit groups. Verify unchanged scoring, native input identity, and browser DOM bounds before publishing. Physical devices and screen-reader announcements remain manual QA prerequisites for closing [#3](https://github.com/MasynNay/Keystoria/issues/3) and [#11](https://github.com/MasynNay/Keystoria/issues/11).

## Next session — prioritized execution plan

The current release is **stable enough to pause**. At the November 16, 2026 checkpoint, [PR #25](https://github.com/MasynNay/Keystoria/pull/25), [PR #26](https://github.com/MasynNay/Keystoria/pull/26) [PR #27](https://github.com/MasynNay/Keystoria/pull/27), and [PR #28](https://github.com/MasynNay/Keystoria/pull/28) are merged; [Pages run 43984376330](https://github.com/MasynNay/Keystoria/actions/runs/43984376330) passed browser regression and deployment for manual restore. Detailed resume instructions live in [app/CONTINUE_HERE.md](../app/CONTINUE_HERE.md).

| Order | Workstream | Next verifiable deliverable | What must remain unclaimed |
| --- | --- | --- | --- |
| **1 · Next hands-on pass** | [#11 Mobile software keyboards](https://github.com/MasynNay/Keystoria/issues/11) | Actual iPhone Safari and Android Chrome keyboard-open/closed notes for Lyric, Speed and Academy; focused fixes backed by mobile regression tests | Emulation is not physical iOS/Android evidence |
| **2 · Next engineering pass** | [#3 Accessibility](https://github.com/MasynNay/Keystoria/issues/3) | Rendered-state contrast and zoom audit, screen-reader observations, and regression fixes beyond shipped skip links, focus, motion and palette checks | Palette color tests are not full WCAG conformance |
| **3 · Security gates before hosting** | [#4 Co-op hosting](https://github.com/MasynNay/Keystoria/issues/4) | Review the [merged hosting proposal](COOP-HOSTING-DECISION.md), validate code-level origin/room/resource controls and prototype only in isolation after design review | The document is a proposal, not a tested public service or security audit |
| **4 · Feedback and refinement** | [#5 Practice progression](https://github.com/MasynNay/Keystoria/issues/5) | Test the shipped Practice Compass with users, refine insights and consider optional longer-term trends | Pilot shipped; full progression suite and real user feedback still outstanding |

**Release definition:** a task is not shipped until code merges to `main`, relevant tests pass and GitHub Pages deployment succeeds where applicable. End each working session with zero unintended open PRs, updated issue states, and a durable handoff. Pause new features once a stable deployment is reached; do not manufacture a release merely to show activity.

## Shipped and verifiable

| Milestone | Status | Evidence |
| --- | --- | --- |
| Keystoria v0.24 rebrand and organized source | **Shipped** | [Repository reorganization and Pages workflow](https://github.com/MasynNay/Keystoria/commit/fabf803523c8bd95269e5ea9660aba9e12a7675a) |
| GitHub Pages portfolio and custom-domain workflow | **Shipped** | [GitHub Actions deployment history](https://github.com/MasynNay/Keystoria/actions/workflows/pages.yml) |
| Browser-accessible Keystoria interface for Lyric Lab, Speed Lab, and Field Academy | **Shipped** | [Browser edition, logo refresh, and links](https://github.com/MasynNay/Keystoria/commit/9b4362c448fdb3b87befc61738ec2a85f6011a0a) |
| 15 persistent visual themes across browser and local app | **Shipped (v0.25)** | [Theme documentation](THEMES.md) and [automated end-to-end checks](https://github.com/MasynNay/Keystoria/actions/runs/42540558364) |
| Speed Lab Numpad challenge with CPM scoring | **Shipped (November 9, 2026)** | [Merge commit](https://github.com/MasynNay/Keystoria/commit/92e8bda120e7520f0a9ac8556e5660d9add27b86), [passed numpad CI](https://github.com/MasynNay/Keystoria/actions/runs/42661101795), and [successful Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/42661319306) |
| Manual JSON restore of exported Speed Lab results | **Shipped (November 16, 2026)** | [PR #28](https://github.com/MasynNay/Keystoria/pull/28), [passing Mobile QA](https://github.com/MasynNay/Keystoria/actions/runs/43983904922), [production Pages](https://github.com/MasynNay/Keystoria/actions/runs/43984376330); manual portability, not automatic sync |
| Practice Compass local-first progress pilot | **Shipped (November 16, 2026)** | [PR #27](https://github.com/MasynNay/Keystoria/pull/27), [passing Mobile QA](https://github.com/MasynNay/Keystoria/actions/runs/43981317208), [successful Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43981861050); feedback and further progression remain open |
| Co-op hosting safety proposal and keyboard reflow regression | **Merged planning / automated checks (November 16, 2026)** | [PR #25](https://github.com/MasynNay/Keystoria/pull/25), [PR #26](https://github.com/MasynNay/Keystoria/pull/26); not a public hosted service or completed accessibility audit |
| Mobile practice Phase 1 (Speed, Lyric, Academy) | **Shipped in browser edition (November 11, 2026 Mountain Time)** | [PR #12](https://github.com/MasynNay/Keystoria/pull/12), [Numpad QA](https://github.com/MasynNay/Keystoria/actions/runs/43135604906), [Mobile QA](https://github.com/MasynNay/Keystoria/actions/runs/43135604935), [Themes QA](https://github.com/MasynNay/Keystoria/actions/runs/43135604933), and [successful Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43135800239). **Real iOS/Android keyboard QA remains outstanding.** |
| Six workplace Speed Lab vocabulary categories | **Shipped (November 11, 2026 Mountain Time)** | [PR #14](https://github.com/MasynNay/Keystoria/pull/14), [passing vocabulary and keyboard CI](https://github.com/MasynNay/Keystoria/actions/runs/43137092706), [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43137227461) |
| Browser gameplay regression gate before Pages deployment | **Shipped (November 11, 2026 Mountain Time)** | [PR #15](https://github.com/MasynNay/Keystoria/pull/15), [passing production browser gate and Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43138914794) |
| Lyric Lab provider recovery Phase 1 | **Shipped (November 11, 2026 Mountain Time)** | [PR #16](https://github.com/MasynNay/Keystoria/pull/16), [successful provider CI](https://github.com/MasynNay/Keystoria/actions/runs/43139756405), and [gated production deployment](https://github.com/MasynNay/Keystoria/actions/runs/43139905211) |
| Fail-closed Pages negative controls | **Shipped (2026-11-11 (America/Denver))** | [PR #17](https://github.com/MasynNay/Keystoria/pull/17), [CI](https://github.com/MasynNay/Keystoria/actions/runs/43140934977), [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43141092745) |
| Lyric Lab video matcher and stale-result recovery | **Shipped (2026-11-11 (America/Denver))** | [PR #18](https://github.com/MasynNay/Keystoria/pull/18), [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43141952768) |
| Keyboard dialog focus and return | **Shipped (2026-11-11 (America/Denver))** | [PR #19](https://github.com/MasynNay/Keystoria/pull/19), [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43142670372) |
| Silent lyric practice on blocked or absent video | **Shipped (2026-11-11 (America/Denver))** | [PR #20](https://github.com/MasynNay/Keystoria/pull/20), [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43143498175) |
| Speed Lab mobile performance hotfix: bounded display and reduced redraws | **Shipped (November 11, 2026 Mountain Time)** | [PR #23](https://github.com/MasynNay/Keystoria/pull/23), [Mobile QA](https://github.com/MasynNay/Keystoria/actions/runs/43148033242), [Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43148220125) · **real-phone verification pending** |
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
