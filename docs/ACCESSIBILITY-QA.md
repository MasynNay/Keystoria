# Accessibility QA and device validation

Keystoria is a typing-based portfolio application. This document distinguishes **automated evidence** from human testing that remains necessary.

## Automated browser checks

From the repository root, install Node 22 and Playwright Chromium using the instructions in [QA.md](QA.md), then run:

```bash
bash scripts/run-browser-qa.sh
```

The `scripts/test-navigation-accessibility.mjs` test exercises 320px, 390px and 1440px browser widths. It verifies a visible-on-focus skip link that moves focus to the current page's main landmark, a keyboard-focused Speed Lab completion announcement, Field Academy status, system reduced-motion settings, user-selected reduced motion, and high-contrast skip-link text. Existing dialog focus cycling is covered by `scripts/test-dialog-keyboard.mjs`.

**Desktop reflow simulations:** At 640px and 320px CSS viewport widths (roughly the space available at 200% and 400% zoom in a 1280px-wide window), automated tests now navigate through **Speed Lab, Lyric Lab and Field Academy** using a mouse/keyboard desktop browser. They check keyboard editing, that each active text field and primary touch/submit action fits horizontally, no page-wide horizontal scrolling, and successful Academy command submission. The Speed Lab checks also distinguish its compact rolling renderer from actual phone keyboard help: a zoom-narrowed *mouse desktop* must still be scored as exact desktop typing, with no inoperative phone-assist control. Phone keyboard help remains available on coarse-pointer touch devices.

These tests model a *reduced CSS viewport*, **not actual 200%/400% browser zoom, text-only scaling, larger system fonts, or physical keyboard/screen-reader tests**. Those manual checks remain open in issue #3.

A separate test checks the 15 palette definitions for at least 4.5:1 text/muted/accent contrast on the background and two panel surfaces, and compares CSS theme tokens with the JavaScript palette. This only validates defined colors, not every rendered element.

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
