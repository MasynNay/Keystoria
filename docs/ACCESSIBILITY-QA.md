# Accessibility QA and device validation

Keystoria is a typing-based portfolio application. This document distinguishes **automated evidence** from human testing that remains necessary.

## Optional mobile Word Focus — validation in progress

The new opt-in Speed Lab Word Focus presentation is intended to show only the current word or number group beside the real native input on touch layouts while keeping the original full passage available by toggle. It follows the textarea caret when repairing earlier words, shows pending Space explicitly, and distinguishes wrong characters with a wavy underline, not color alone. The source/reference, session timer, scoring, storage, soft-keyboard settings and existing polite spoken target remain unchanged.

Unit tests cover source character status, Space boundary and prior-caret corrections; dedicated Playwright browser checks cover phone portrait, touch landscape, narrow mouse desktop and wide desktop, persistent opt-in, input focus and score preservation. Passing automation does not constitute physical iOS/Android, VoiceOver/TalkBack or NVDA evaluation. This feature must pass release CI and Pages deployment before it is called shipped.

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
