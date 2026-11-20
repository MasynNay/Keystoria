# Browser CI installation strategy

The browser regression jobs in the Keystoria repository install **Playwright 1.56.0** with Chromium's **headless shell only**:

```bash
npm install --no-save --no-package-lock playwright@1.56.0
npx playwright install --with-deps --only-shell chromium
```

This matches the current Playwright tests, including README screenshot capture, which launch `chromium` with `headless: true`. It skips the separate full headed Chromium download while retaining operating-system dependencies through `--with-deps`. **No checks, test assertions, or release gates are skipped.** The Pages deployment still requires its complete browser-regression job to pass before publishing.

Workflows using the same installation strategy:

- `pages.yml`: full browser regression and gated GitHub Pages deployment
- `mobile-qa.yml`: mobile viewports and touch typing interactions
- `numpad-qa.yml`: numeric practice behavior
- `themes-qa.yml`: all theme combinations
- `vocabulary-qa.yml`: career practice categories
- `lyric-recovery-qa.yml`: song provider recovery
- `server-security-qa.yml`: real local recovery UI tests, plus Python security checks
- `readme-screenshots.yml`: desktop/mobile screenshot capture

If a test begins launching a **headed** browser (`headless:false`), a branded Chrome channel, or non-Chromium engines, install the appropriate browser in that workflow before adding such a test. Headless Chromium checks do not substitute for real Safari/WebKit, mobile OS keyboard, or assistive-technology testing.

Playwright's CI documentation notes that browser-binary caching may cost about as much time as downloading the binaries, so this change does **not** add cross-workflow caches or a new trust boundary. See https://playwright.dev/docs/ci and https://playwright.dev/docs/browsers.

## Verification requirements

PR runs must pass the exact changed-head workflows; merge is blocked if the Pages/browser gate or any other applicable regression fails. After merge, verify the independent GitHub Pages deployment and avoid declaring the change live before it succeeds. Actual savings depend on GitHub runner download speed and should be measured from Actions step timings rather than assumed.
