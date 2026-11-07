# v0.22 engineering journal (append-only)

2026-11-07: Recovered partially finished v0.22 source. Confirmed all 24 missions registered in server and frontend, six new original story scripts, defense decks, field choices, scene art, colors and cinematic dialogue. Verified Python 83/83 initial before expanding tests. Found transient short objective note, now satisfies minimum.

2026-11-07: Expanded Python regressions for six role-specific stories, outcomes, authorized commands and all description coverage. Added provider metadata tests: Invidious artist/version mismatch rejection, Piped relative video URLs and fallback to MusicBrainz. Parsed only the video ID; did not fetch user-controlled URLs. Added JS checks for six unique covers/scenes, milestone graphics, dialogue, reduced-motion, and read-only renderers.

2026-11-07: Full Python suite passed 93/93. Full JS runner timed out on its first monolithic attempt without reporting assertion failures; rerunning in two bounded batches passed 41/41 + 45/45 = 86/86. Browser v0.17 24-screen visual test passed desktop/mobile with Mirrorfall inversion. Browser v0.21 auto-match mock interaction passed. External community/YouTube providers cannot be validated live in sandbox.

2026-11-07: Prepared portable release with source/tests/docs/launcher. Next milestone: fresh-extraction regression and HTTP smoke test, then hand off Mac TAR.GZ link. Avoid claiming guaranteed match rates or perfect real-world two-human playtesting.
