# Keystoria editorial and presentation QA

**Reviewed:** November 7, 2026  
**Scope:** Portfolio website, browser practice edition, project documentation, README, screenshot gallery, and GitHub language display.

## Changes completed

- Standardized capitalization and punctuation across the homepage, navigation, buttons, mode descriptions, README, and deployment documentation.
- Replaced inaccurate “AI partner” language with **ECHO, an automated teammate**.
- Clarified that **Lyric Lab, Speed Lab, and Field Academy run in the public browser edition**, while all 24 story missions and private co-op rooms require the local Python/WebSocket server.
- Updated the Browser Edition welcome guide to describe the **three actually playable modes**, rather than presenting server-only story and co-op modes as playable online.
- Cleaned up the browser status, entry labels, and back navigation.
- Aligned the portfolio hero image and updated its aspect ratio to match the actual current screenshot.
- Improved small-screen roadmap link wrapping and footer spacing.
- Corrected the README architecture diagram to distinguish GitHub Pages from the full local game.
- Preserved the Makefile and macOS launcher while excluding these tiny helpers from GitHub Linguist's language statistics using `.gitattributes`.
- Kept the README screenshots tied to the current Keystoria UI. The Chromium capture workflow checks layout overflow and refreshes its images.

## Validation evidence

- [GitHub Pages workflow — successful publication](https://github.com/MasynNay/Keystoria/actions/runs/42423119256)
- [Chromium screenshots — successful desktop and mobile capture](https://github.com/MasynNay/Keystoria/actions/runs/42423119309)
- [Source and rendered README](https://github.com/MasynNay/Keystoria#screenshots)
- [GitHub Issues and roadmap](https://github.com/MasynNay/Keystoria/issues)

The screenshot workflow opens the real static browser edition in headless Chromium, enters Lyric Lab, Speed Lab, and Field Academy, checks for JavaScript errors and viewport overflow on supported capture sizes, and commits refreshed images. The deployment workflow verifies required files and checks JavaScript syntax before publishing.

## Limits and future checks

- The above tests do not prove identical rendering in every browser, including Firefox and Safari. Cross-browser visual review remains useful.
- Hosted story-mode multiplayer is not available through GitHub Pages.
- External lyrics and video providers may block, fail, or vary by region. Media-rights evaluation remains necessary for broader releases.
- GitHub recalculates repository language percentages asynchronously; changing `.gitattributes` may not update the display immediately.
- Follow [the project roadmap](ROADMAP.md) for broader regression and accessibility coverage.

This record documents a verified editorial/presentation milestone, not a claim that the application is bug-free.
