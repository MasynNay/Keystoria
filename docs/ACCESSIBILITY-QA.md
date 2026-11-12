# Accessibility QA and device validation

Keystoria is a typing-based portfolio application. This document distinguishes **automated evidence** from human testing that remains necessary.

## Automated browser checks

From the repository root, install Node 22 and Playwright Chromium using the instructions in [QA.md](QA.md), then run:

```bash
bash scripts/run-browser-qa.sh
```

The `scripts/test-navigation-accessibility.mjs` test exercises 320px, 390px and 1440px browser widths. It verifies a visible-on-focus skip link that moves focus to the current page's main landmark, a keyboard-focused Speed Lab completion announcement, Field Academy status, system reduced-motion settings, user-selected reduced motion, and high-contrast skip-link text. Existing dialog focus cycling is covered by `scripts/test-dialog-keyboard.mjs`.

A separate test checks the 15 palette definitions for at least 4.5:1 text/muted/accent contrast on the background and two panel surfaces, and compares CSS theme tokens with the JavaScript palette. This only validates defined colors, not every rendered element.

The same checks run in GitHub Pages pull-request CI before deployment. These are *Chromium simulations*, not device or screen-reader certification.

## Manual assistive technology checklist (not yet verified)

- **Screen readers:** Test NVDA with Firefox or Chrome, VoiceOver with macOS Safari, VoiceOver with actual iPhone Safari, and TalkBack with actual Android Chrome. Verify controls are announced by name, role, state and instructions.
- **Phone keyboards:** On actual iPhone and Android hardware, test Lyric Lab, Speed Lab and Field Academy with the software keyboard open and closed, portrait/landscape changes, browser toolbar movement, autocorrect, composition/IME and return from another app.
- **Keyboard only:** Starting with no mouse, move through the Play link, skip link, settings modal and three practice modes. Ensure focus is visible, score completion is announced, and Tab cannot get trapped behind dialogs.
- **Motion:** Check that OS Reduce Motion and the in-app Reduce Motion setting stop pulsing text, spinning effects and flashing typing cues, without removing information required to play.
- **Contrast:** Review all 15 themes for normal text, focus outlines, large text and feedback state contrast, including at 200% and 400% text zoom.
- **Outcomes:** Record device/browser version, steps, expected/actual result and screenshots for failures. Add a focused issue rather than treating emulated results as native-device evidence.

**Release boundary:** Automated checks address specific high-impact cases only. They do not establish WCAG conformance, guarantee every assistive-technology combination, or close the physical-device requirements of issue #11.
