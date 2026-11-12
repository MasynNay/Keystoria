# Keystoria browser release checks

Run these tests from the root of the Keystoria repository. They test the **actual GitHub Pages source in `site/`**, not a separate mock application.

## Local prerequisites

Node.js 22 or later and Python 3 are required for this test workflow. Install the browser test dependency:

```bash
npm install --no-save --no-package-lock playwright@1.56.0
npx playwright install chromium
```

## Repeatable QA command (Linux / macOS)

```bash
bash scripts/run-browser-qa.sh
```

The script launches a local HTTP server on 127.0.0.1:8765 and shuts down only its own server process when finished. It runs the production smoke test, deliberate failure controls, vocabulary checks, and Lyric Lab recovery checks. A failure returns a nonzero exit status. Do not run a second HTTP service on the same port.

For Windows, launch `python -m http.server 8765 --bind 127.0.0.1 --directory site` in one terminal, then run these commands from the repository root in another:

```powershell
node scripts/test-release-browser.mjs
node scripts/test-release-negative.mjs
node scripts/test-vocabulary-browser.mjs
node scripts/test-lyric-recovery.mjs
```

## What the negative controls prove

The negative-control runner makes two isolated **HTTP response mutations** inside Playwright only:

1. A portfolio homepage whose primary Play link is deliberately broken.
2. A `/play/` HTML document that intentionally references a missing application script.

Each must make the **same release smoke test** exit unsuccessfully for a specific, expected assertion. A failure for an unrelated reason does not count as a successful negative control. Neither fixture writes to `site/` or GitHub.

The Pages workflow requires passing positive and negative controls before deployment, and PR checks always skip publishing. This does **not** substitute for testing actual iOS Safari, Android Chrome, accessibility, or external media licensing.
