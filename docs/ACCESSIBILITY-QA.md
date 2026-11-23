## Opt-in phone responsiveness check — November 22, 2026

Settings now exposes a keyboard-accessible 10-second local responsiveness check for reported mobile lag. The status panel is a separate labelled region with a polite status message, a manual Stop button, a read-only selectable report, Copy, and Close. It does not modify active typing inputs or persist typed content. It does collect browser signature and viewport dimensions only for the player to review/share explicitly. Browsers lacking Long Task API support label the metric as unavailable rather than zero. Its frame and input-to-next-frame samples are diagnostic approximations and not a measured INP score. Browser unit/Playwright checks cover the UI; focus, VoiceOver/TalkBack, overlay obstruction under a physical software keyboard and user comprehension still require human device QA.

## Mobile compositing and native keyboard animations — November 22, 2026

On compact coarse-pointer touch layouts the full-screen SVG `feTurbulence` grain overlay is omitted to reduce viewport-wide filtered painting. When a native practice input has focus, character feedback and lyric progress do not animate; correct/incorrect/active cues, typed input, keyboard predictions, scoring, and focus behavior remain visible and available. Desktop effects and blur restoration are preserved. New `scripts/test-mobile-compositor.mjs` checks computed visual behavior across touch portrait/landscape and narrow/wide pointer-fine desktop; it does not simulate physical iOS/Android GPU latency. Real-device testing and screen-reader review remain outstanding under #82 and #3.

## Uninterrupted manual scrolling during phone practice — November 22, 2026

Previously `visualViewport.scroll` always re-centered a focused input, even when the player intentionally scrolled the reference area while keeping the phone keyboard open. The mobile event handler now skips scroll-only events that do not change the visual viewport's dimensions. Focus, keyboard resizing, orientation, foreground recovery and true geometry changes still trigger controlled placement. Playwright verifies the native field remains focused after twelve rapid visual-viewport scroll events with no scrolling or bounding-box reads. Physical iOS Safari and Android Chrome verification remains outstanding.

## Stable typing UI nodes — November 22, 2026

Shared character feedback is updated in place during typing rather than rebuilding full target spans. Lyric Lab preserves its line navigation controls while a word is edited, re-rendering those controls only when the song/typing line changes. New synthetic phone and desktop Playwright tests verify stable DOM identity, identical character feedback (including Unicode and extra input), and retained native fields; live regions retain their prior behavior. This remains insufficient to certify physical iOS Safari or Android Chrome keyboard performance or screen-reader usability.

## Mobile typing responsiveness: geometry and unchanged-score work — November 22, 2026

Compact Speed Lab typing now updates cursor highlight without synchronous forced-layout reads in the native input event; its geometry-driven scrolling is coalesced to animation frames. Lyric Lab's periodic status renderer avoids DOM writes for text that did not change, reducing unnecessary style and assistive-technology updates. Tests cover immediate caret correctness and deferred scroll positioning alongside score integrity. These are Chromium-emulated checks only, not physical iOS Safari / Android Chrome latency measurements. Real-device confirmation remains open.

## Academy reset focus and privacy — November 22, 2026

The new conditional **Clear Unfinished Course Progress** button uses a native confirmation prompt; cancelling keeps saved steps and focusable controls, while confirming removes only local resumable checkpoints. Because its activating button disappears, the Academy heading receives programmatic focus (visible outline), avoiding loss of keyboard context. The existing completed-course badges remain intact. Playwright covers 390px touch, touch landscape, 320px desktop reflow and 1440px desktop; it does not replace real VoiceOver, TalkBack, NVDA, iPhone Safari or Android Chrome verification.

# Accessibility QA and device validation

## Lyric Lab first-word readiness

The lyric stage's spoken **Current word** description is present in the initial rendered HTML for each selected song, including the original offline demo. Previously the label was empty until an animation-frame `mount()` callback repainted the stage. Depending on browser scheduling, a keyboard or screen-reader user could reach an input whose referenced current word was not yet populated. The normal lyric clock and word-boundary updates continue to use the same mounted live region; no extra per-keystroke announcements or changes to scoring, music providers or stored records.

`scripts/test-mobile-typing.mjs` now clicks the demo and reads the new spoken cue **in the same JavaScript task, before the requestAnimationFrame mount can run**, at narrow mobile, normal phone, and desktop widths. This targets the intermittent first-word failure seen in the [post-merge Mobile QA run 44804233032](https://github.com/MasynNay/Keystoria/actions/runs/44804233032). It is automated Chromium readiness evidence only, not actual VoiceOver/TalkBack/NVDA or physical phone validation.

## Field Academy command feedback continuity

Field Academy command submissions now keep both the real native typing input and its `role="status"` feedback element mounted during ordinary lesson steps on **desktop, narrow reflow, and touch layouts**. On failed checks, the input exposes `aria-invalid="true"` and the existing polite live status announces the correction guidance. On the first subsequent edit, the invalid state clears and the same status announces retry instructions **once**, not after every key. Successful submissions update that same status node and move focus to the visible Next action when activated from a Check button; typing with Enter retains input focus. Completing the course still replaces the active practice screen with the accessible result heading.

`scripts/test-academy-focus.mjs` checks failed commands, editing and retry, stable input/status node identity, correct Next focus, reshuffling, and full course completion at phone portrait, touch landscape, narrow desktop reflow and desktop. The mobile patch unit tests and existing IME composition tests also run in CI. Browser DOM checks cannot establish actual screen-reader speech or physical phone keyboard behavior, so NVDA, VoiceOver, TalkBack and iOS/Android hands-on testing remain open under issues #3 and #11.

## True modal background isolation

The Welcome, Settings, and other in-app dialogs use `role="dialog"` / `aria-modal` with keyboard Tab cycling and return-focus handling. A dialog is not truly modal unless the underlying app and external navigation stop being focusable and exposed to assistive technology while it is open. Each render now makes all non-dialog `#app` children, the external skip link, and the browser-edition portfolio note **inert** while a dialog is shown; those elements become interactive again immediately after dismissal. The toast live-status region stays available for announcements.

`scripts/test-dialog-keyboard.mjs` exercises blocked programmatic focus on background landmarks, keyboard Tab containment, accessible Settings controls, repeated open/close, inert restoration and opener focus return at phone, tablet and desktop widths. This is Chromium-level automated testing; actual VoiceOver/TalkBack/NVDA and physical device testing remains open under issue #3.


## Player-controlled practice pause in Speed Lab

Speed Lab now offers an explicit **PAUSE** thumb action and **PAUSE PRACTICE** desktop control after the first typed character. Both are disabled until the timer is running, and pausing transfers keyboard focus to **RESUME TYPING** without detaching the native input. The original typed text, selection, and timer are preserved. To keep timed comparisons fair, deliberately paused runs are labeled practice-only and **not saved** to personal records; fresh uninterrupted runs remain comparable. The four thumb controls use two columns instead of forcing a cramped three-across layout.

The existing `scripts/test-speed-interruption.mjs` now checks deliberate pausing on phone portrait, touch landscape, desktop, and Numpad, in addition to hidden-tab and back/forward-cache recovery. Browser automation cannot verify real native keyboard behavior or screen readers; continue physical-device QA in issue #11.

## Background interruption recovery in Speed Lab

**Navigation/BFCache follow-up:** Alongside `visibilitychange`, the browser now handles `pagehide` even when a document has not become hidden yet. A restored back/forward-cache page remains paused, with an explicit resume action and practice-only scoring. Automated Chromium scenarios dispatch persisted pagehide/pageshow events, including duplicate events and saved-record isolation. Actual Safari back navigation and phone app-switch behavior still require physical-device testing.

When Speed Lab is already running and a device locks or a tab goes into the background, the local browser clock suspends instead of silently reaching zero. On return, the existing typed reference, caret, and native input stay mounted and an accessible **Resume Typing** action requires an explicit click. The paused input is read-only, and repeated background/foreground notifications cannot keep adding time to a still-running clock. Interrupted sessions remain visible as practice-only results but do **not** overwrite saved personal bests or mix with Practice Compass history; uninterrupted runs retain the same exported score schema.

`scripts/test-speed-interruption.mjs` simulates browser visibility changes at phone portrait, touch landscape and desktop sizes (including Numpad), checks frozen time and input identity, blocked paused edits, explicit resume focus, history isolation and normal fresh-run saving. This is **Chromium event simulation**, not a physical device lock or mobile OS keyboard test. Continue human iOS Safari and Android Chrome checks in issue #11 and assistive technology review in issue #3.


Keystoria is a typing-based portfolio application. This document distinguishes **automated evidence** from human testing that remains necessary.

## Optional mobile Word Focus — shipped browser QA

The new opt-in Speed Lab Word Focus presentation is intended to show only the current word or number group beside the real native input on touch layouts while keeping the original full passage available by toggle. It follows the textarea caret when repairing earlier words, shows pending Space explicitly, and distinguishes wrong characters with a wavy underline, not color alone. The source/reference, session timer, scoring, storage, soft-keyboard settings and existing polite spoken target remain unchanged.

Unit tests cover source character status, Space boundary and prior-caret corrections; dedicated Playwright browser checks cover phone portrait, touch landscape, narrow mouse desktop and wide desktop, persistent opt-in, input focus and score preservation. Passing automation does not constitute physical iOS/Android, VoiceOver/TalkBack or NVDA evaluation. [PR #53](https://github.com/MasynNay/Keystoria/pull/53) passed six PR suites and [production Pages run 44351316321](https://github.com/MasynNay/Keystoria/actions/runs/44351316321) succeeded. This is browser-tested behavior, not a physical device or assistive-technology certification.

## Lyric Lab completion focus and replay (browser regression)

When the last lyric is submitted, skipped, or a demo finishes, Lyric Lab now moves keyboard focus away from its disabled typing field to a dedicated **Track Complete** result heading. A visible, theme-aware summary names WPM, accuracy, points and skipped words, with **Play Again** and **Choose Another Song** immediately next in the keyboard order. Completed-run Skip, Next Word and Play/Pause controls are disabled rather than remaining silent no-ops. Replay and repositioning the lyric timeline re-enable the appropriate controls without changing the original demo or the score storage format.

`scripts/test-lyric-completion.mjs` exercises the original built-in offline lyric demo at touch portrait, touch landscape, 320px desktop reflow and wide desktop sizes. It tests finishing by skipping the last line, natural word-by-word completion, managed heading focus, the next Tab target, replay, choosing another song and controls restored after replay. It does not download a song, inspect screen-reader speech or certify actual virtual keyboards. Real NVDA, VoiceOver, TalkBack and physical-device observations still remain on issue #3.

## Speed Lab keyboard selector focus continuity

Changing a category or duration rebuilds the Speed Lab controls. A keyboard-activated **Enter** or **Space** selection now restores focus to the equivalent newly rendered button, keeping keyboard navigation predictable, while a pointer tap puts focus directly into the typing field. A previous pending animation-frame focus request is cancelled before every new session/selection and on close, preventing an older session from stealing focus after a quick selection.

`scripts/test-vocabulary-browser.mjs` exercises six pointer-selected workplace categories, successive keyboard selections with both Enter and Space, rapid category changes, duration changes and continuing to type at **390px touch** and **1440px desktop**. It verifies both button selection state and actual keyboard-focus identity after the DOM replacement and after a short frame delay.

The November 17 post-merge Pages gate for PR #48 initially timed out after pressing Enter on a previously rendered category. The identical commit passed that check when retried. This change targets the focus timing race, but a single green CI pass cannot prove the original intermittent failure will never recur. Keep tracking recurrent browser, NVDA/VoiceOver and real-keyboard behavior in issue #3.

## Speed Lab rendered contrast on all 15 themes

The Speed Lab's active typing field and placeholder, score/clock labels, pending character text, prompt headings, drill choices, saved history empty state, and Practice Compass labels now inherit the selected appearance palette rather than fixed old gray/green colors. Both desktop and mobile browser editions use identical gameplay CSS.

`scripts/test-themes.mjs` checks **actual computed foreground and flat opaque background colors** in live Speed Lab DOM for 15 themes on a 390px touch viewport and a 1440px desktop viewport. The sampled text uses a 4.5:1 minimum ratio, including selected and unselected duration buttons. This complements the separate Settings and token-level palette tests.

Scope remains limited to explicitly sampled opaque surfaces. It does **not** certify overlapping translucent layers, gradients, text zoom, motion, screen readers, real phone screens, or full WCAG conformance. Human accessibility evaluation is still tracked in [issue #3](https://github.com/MasynNay/Keystoria/issues/3).

## Speed Lab caret-aware correction guidance

Speed Lab's visible **NEXT CHARACTERS** prompt and hidden polite **Current word / Current number group** status now follow the **native textarea caret**. Players can move backward using the keyboard, mouse, or touch selection handles and receive the actual word/digit-group cue at that editing position, rather than a misleading hint for the end of the typed passage. Completing or correcting a character still uses the existing exact session-length scoring model; moving only the caret never edits the text, rescales scores, or reconstructs the optimized passage renderer.

The controller updates only the small cue and persistent live status on native `select` or `selectionchange` events. Letter-by-letter cursor moves inside the same word do not change the screen-reader text. The status follows the edited group in Numpad mode as well, and both the app and static Pages edition are synchronized. Pure helper tests cover cursor clamps, third-word corrections, Numpad groups and legacy end-of-text defaults; Playwright at phone/desktop sizes checks caret movement, status updates, unchanged input/accuracy, and preserved render nodes.

These browser tests are **not** physical iOS/Android keyboard or VoiceOver/TalkBack/NVDA validation. Screen-reader announcement behavior on real devices remains an open item in [issue #3](https://github.com/MasynNay/Keystoria/issues/3).

## Speed Lab passage-caret correction parity

The main Speed Lab passage now highlights the **same native editing caret** as the compact next-key hint and polite spoken word/Numpad cue. Moving the selection alone does not modify the user's text, score, correctness classes, timer or the native textarea. On phones, the 220-character display window follows long backward/forward correction jumps without growing the DOM. The existing full reference and scoring path remain unchanged.

Browser regressions check the first and middle word, number-group corrections, long backward/forward caret jumps, stable accuracy and native input identity at phone, landscape, narrow desktop and wide desktop sizes. These are automated Chromium simulations, not physical iOS/Android keyboard or screen-reader verification. Issues #3 and #11 remain open.

## Speed Lab spoken target at word boundaries

The Speed Lab input now references the existing instructions, session status and a persistent **Current word** / **Current number group** status using `aria-describedby`. The visually hidden element is present at both desktop and phone sizes, including the static GitHub Pages edition. The displayed reference passage and fast visual letter feedback remain unchanged.

Only a change of the target word or digit group updates the `aria-live="polite"`, `aria-atomic="true"` node. In-progress character edits do **not** repeatedly reannounce the same target. Backspacing over a separator can announce the preceding word again. `app/tests/test_mobile_typing.mjs` covers boundary behavior; `scripts/test-mobile-typing.mjs` checks persistent element identity, mutation frequency and Numpad/word transitions at 320px, 390px and 1440px Chromium sizes; navigation tests confirm the input linkage. This does not establish actual NVDA, VoiceOver, TalkBack or physical mobile keyboard behavior.

## Practice Compass live-update regression

The Speed Lab's accuracy target, local result import and confirmed history deletion must update **the existing** Practice Compass DOM rather than reconstructing its interactive controls. A persistent `role="status"` element with `aria-live="polite"` announces the selected accuracy goal and current guidance. Keeping the live region mounted allows assistive technology to observe text changes; keeping the goal buttons, import picker and Clear control mounted protects keyboard focus, file-picker continuity and scroll position.

`scripts/test-speed-insights-browser.mjs` and `scripts/test-speed-history-restore.mjs` check node identity, live-region semantics and focus retention at simulated 390px touch and 1440px desktop layouts. These checks cannot establish what VoiceOver, NVDA or TalkBack actually announces; assistive-technology and physical-phone checks remain required under [issue #3](https://github.com/MasynNay/Keystoria/issues/3).

## Automated browser checks

From the repository root, install Node 22 and Playwright Chromium using the instructions in [QA.md](QA.md), then run:

```bash
bash scripts/run-browser-qa.sh
```

The `scripts/test-navigation-accessibility.mjs` test exercises 320px, 390px and 1440px browser widths. It verifies a visible-on-focus skip link that moves focus to the current page's main landmark, a keyboard-focused Speed Lab completion announcement, Field Academy status, system reduced-motion settings, user-selected reduced motion, and high-contrast skip-link text. Existing dialog focus cycling is covered by `scripts/test-dialog-keyboard.mjs`.

**Desktop reflow simulations:** At 640px and 320px CSS viewport widths (roughly the space available at 200% and 400% zoom in a 1280px-wide window), automated tests now navigate through **Speed Lab, Lyric Lab and Field Academy** using a mouse/keyboard desktop browser. They check keyboard editing, that each active text field and primary touch/submit action fits horizontally, no page-wide horizontal scrolling, and successful Academy command submission. The Speed Lab checks also distinguish its compact rolling renderer from actual phone keyboard help: a zoom-narrowed *mouse desktop* must still be scored as exact desktop typing, with no inoperative phone-assist control. Phone keyboard help remains available on coarse-pointer touch devices.

These tests model a *reduced CSS viewport*, **not actual 200%/400% browser zoom, text-only scaling, larger system fonts, or physical keyboard/screen-reader tests**. Those manual checks remain open in issue #3.

A separate test checks the 15 palette definitions for at least 4.5:1 text/muted/accent contrast on the background and two panel surfaces, and compares CSS theme tokens with the JavaScript palette. This only validates defined colors, not every rendered element.

The theme browser regression also checks **computed foreground and background colors** on the rendered Settings modal for all 15 themes, including theme choices, selection status, preference titles/help text and the Done button. It requires a 4.5:1 minimum in these sampled opaque, flat-color components. This is more representative than token-only checks, but it does **not** inspect gradients, imagery, alpha-composited overlays, every hover/focus/error state, or actual screen-reader/device behavior.

**Field Academy focus and step transitions:** A dedicated browser test now completes all commands in a randomized Linux course on portrait phone, short touch landscape, narrow mouse desktop, and wide desktop. It checks that keyboard input stays focused when advancing, that the original native phone input remains attached, and that a click on **Check Command** transfers focus to the newly available **Next Command** control instead of the document body. The polite step cue announces a new command only on advancement, and the completed course focuses the success heading so Tab proceeds naturally to **Replay Lesson**. Screen-reader speech ordering and physical soft-keyboard behavior remain manual checks.

**Lyric Lab announced target:** The focused native lyric input is associated with a visually hidden, polite live region containing only the current target word and the responsive submission instructions. The word cue changes on progression, not with each typed character. Browser QA validates initial target exposure and target changes after submitting words in portrait, touch landscape, wide desktop, and 320px/640px reflow. Actual pronunciation, announcement timing, verbosity, and live-region behavior in NVDA, VoiceOver, and TalkBack still need manual testing.

The same checks run in GitHub Pages pull-request CI before deployment. These are *Chromium simulations*, not device or screen-reader certification.

**IME composition safety:** Automated Chromium tests now synthesize `compositionstart`, interim `input` events (including `isComposing`), conversion Enter/keyCode 229 and `compositionend` across Speed Lab, Lyric Lab and Field Academy in touch-phone and desktop layouts. Uncommitted candidate text is excluded from score/timer, live correctness feedback and command submission; finalized text is reconciled. These are event-ordering tests and **do not prove native IME behavior** for Chinese, Japanese, Korean or other input methods on real iOS, Android, Windows or macOS keyboards. Physical testing remains required in issue #11.

## Manual assistive technology checklist (not yet verified)

- **Screen readers:** Test NVDA with Firefox or Chrome, VoiceOver with macOS Safari, VoiceOver with actual iPhone Safari, and TalkBack with actual Android Chrome. Verify controls are announced by name, role, state and instructions.
- **Phone keyboards:** On actual iPhone and Android hardware, test Lyric Lab, Speed Lab and Field Academy with the software keyboard open and closed, portrait/landscape changes, browser toolbar movement, autocorrect, composition/IME and return from another app.
- **Keyboard only:** Starting with no mouse, move through the Play link, skip link, settings modal and three practice modes. Ensure focus is visible, score completion is announced, and Tab cannot get trapped behind dialogs.
- **Motion:** Check that OS Reduce Motion and the in-app Reduce Motion setting stop pulsing text, spinning effects and flashing typing cues, without removing information required to play.
- **Contrast:** Review all 15 themes for normal text, focus outlines, large text and feedback state contrast, including at 200% and 400% text zoom.
- **Outcomes:** Record device/browser version, steps, expected/actual result and screenshots for failures. Add a focused issue rather than treating emulated results as native-device evidence.

**Release boundary:** Automated checks address specific high-impact cases only. They do not establish WCAG conformance, guarantee every assistive-technology combination, or close the physical-device requirements of issue #11.

## Unicode Lyric Lab typing — November 21, 2026

Relaxed Lyric Lab typing now preserves letters, numbers, and language-specific combining marks from non-Latin scripts. The visual caret advances by Unicode grapheme clusters instead of splitting syllables such as Devanagari conjuncts. Cyrillic, Hindi, Korean, Japanese, CJK and Arabic examples are covered by pure tests; a mocked Cyrillic/Hindi/Korean track runs in phone/desktop Chromium. Strict mode still requires exact input, and native IME composition handling remains unchanged. **This is not physical iOS/Android keyboard, IME, font or screen-reader verification**; those checks remain open.

## Script-aware accent matching — November 21, 2026

Following the Unicode lyrics rollout, relaxed Latin accent folding was found to remove meaningful Cyrillic and Greek accent marks too, treating different words such as `ёж`/`еж`, `йога`/`иога`, and `όχι`/`οχι` as equal. Lyric Lab now removes optional combining marks only when they directly follow Latin-script base characters, preserving language-specific spelling distinctions and decomposed Unicode input in other alphabets. Mobile and desktop provider-mock tests check that wrong letters do not earn credit while correctly composed and decomposed Cyrillic input does. Actual platform IME and screen-reader validation is still outstanding.
