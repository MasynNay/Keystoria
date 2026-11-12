## [Unreleased] — Lyric Lab video match resilience (issue #2)

- Bound local Python video resolution requests and JSON parsing; guide manual YouTube linking on timeout and failure.
- Avoid starting a stale featured-song fallback search after a newer selection is made.
- Add cancellation, timeout, malformed-response, stale-search, and blocked-player regression tests.
- This work remains unreleased until all CI checks and Pages deployment pass.

## [Feature milestone] — Lyric Lab provider recovery Phase 1 — 2026-11-11 (America/Denver)

- Apply a bounded deadline to LRCLIB searches and response decoding while propagating user cancellation.
- Explain rate limiting, failed responses and corrupt payloads; preserve original offline demo availability.
- In the GitHub Pages edition, avoid attempting local-only automatic video matching and explain the manual YouTube link workflow.
- Add unit coverage and real-browser provider failure scenarios; include provider unit tests in the Pages release gate.
- Shipped via [PR #16](https://github.com/MasynNay/Keystoria/pull/16), passing [Lyric recovery CI](https://github.com/MasynNay/Keystoria/actions/runs/43139756405), [mobile CI](https://github.com/MasynNay/Keystoria/actions/runs/43139756452), [themes CI](https://github.com/MasynNay/Keystoria/actions/runs/43139756412), and [successful Pages browser gate and deployment](https://github.com/MasynNay/Keystoria/actions/runs/43139905211). More media-provider error cases remain planned under issue #2.

## [Feature milestone] — Speed Lab workplace vocabulary — 2026-11-11 (America/Denver)

- Prepare six professional practice categories: legal services, education, municipal government, healthcare administration, finance, and hospitality.
- Curate generic, non-sensitive practice words without confidential client, student, patient, or account data.
- Group the selector into core and workplace drills while retaining the existing Numpad, Everyday, Technology, and Story modes.
- Add unit coverage for vocabulary variety, category selection, original WPM history, and mobile/desktop browser regressions.
- Shipped through [PR #14](https://github.com/MasynNay/Keystoria/pull/14) after passing [Vocabulary CI including keyboard selection](https://github.com/MasynNay/Keystoria/actions/runs/43137092706), [Numpad](https://github.com/MasynNay/Keystoria/actions/runs/43136886444), [Mobile](https://github.com/MasynNay/Keystoria/actions/runs/43136886383), and [Theme](https://github.com/MasynNay/Keystoria/actions/runs/43136886350) regressions, followed by [successful Pages deployment](https://github.com/MasynNay/Keystoria/actions/runs/43137227461). Publication date does not imply all code was authored that day.

## [0.26.0] — Mobile-first typing Phase 1 — 2026-11-11 (America/Denver)

- Show the current Speed Lab characters, Lyric Lab word, and Field Academy command directly above their native text inputs on narrow screens.
- Add touch-accessible Space/Next, Submit Word, Skip Line, Restart, Play/Pause, and Academy Check/Next controls without altering desktop keyboard shortcuts.
- Reposition the focused typing unit when the phone's visual viewport changes, preserving the real system keyboard; provide safe-area spacing and compact secondary panels.
- Maintain the existing typing/accuracy calculation and disable browser autocorrect for the Academy's exact commands.
- Add browser regression tests for 320px and 390px screens, prompt/input visibility, touch progression, and desktop compatibility. Real iOS and Android software keyboard behavior still requires device verification.
- Shipped through [PR #12](https://github.com/MasynNay/Keystoria/pull/12), with passing [Mobile](https://github.com/MasynNay/Keystoria/actions/runs/43135604935), [Numpad](https://github.com/MasynNay/Keystoria/actions/runs/43135604906), and [15-theme](https://github.com/MasynNay/Keystoria/actions/runs/43135604933) CI; [GitHub Pages deployment 43135800239](https://github.com/MasynNay/Keystoria/actions/runs/43135800239) succeeded.
- Maintain the corrected numeric net/raw CPM display in both local and browser editions. Physical iPhone and Android virtual-keyboard behavior remains unverified and tracked in [issue #11](https://github.com/MasynNay/Keystoria/issues/11).

## [Feature milestone] — Speed Lab Numpad — 2026-11-09 (America/Denver)

- Add dedicated Numpad practice with timed numeric sequences, digit filtering, optional group separation using Space or Numpad Enter, local results, and numeric CPM scoring.
- Correct completion screens to display real CPM values rather than WPM values under CPM labels.
- Implemented in [PR #8](https://github.com/MasynNay/Keystoria/pull/8), [passed automated Numpad CI](https://github.com/MasynNay/Keystoria/actions/runs/42661101795), and [deployed successfully through GitHub Pages](https://github.com/MasynNay/Keystoria/actions/runs/42661319306). Implementation was prepared before the scheduled release date; this records the verified publication date, not a claim of authorship on that date.

## [0.25.1] — Smoother Lyric Typing — 2026-11-08

- Make all lyric punctuation optional in the default relaxed typing mode, including straight/curly apostrophes and parentheses.
- Preserve the original lyric text while skipping punctuation in next-letter feedback, word matching, and score accuracy.
- Count typed letters rather than skipped punctuation toward relaxed-mode WPM.
- Keep the existing opt-in strict punctuation mode for players who prefer exact punctuation and case.
- Clarify the in-game typing hint and add unit regressions plus GitHub Pages CI checks.

## [0.25.0] — Personalize Your World — 2026-11-08

- Add **15 user-selectable visual palettes** in the Settings dialog, with live swatch previews and immediate application.
- Persist the choice in the existing browser preference store without discarding larger-type, high-contrast, or reduced-motion settings.
- Keep a player's appearance independent of mission selection and apply the same palette options in the public browser edition and the locally hosted game.
- Coordinate background, panel, border, text, and accent colors across the homepage, Lyric Lab, Speed Lab, Field Academy, and story controls.
- Add a responsive, keyboard-accessible 15-choice Settings grid and an accurate screenshot for the README.
- Add Node preference tests and a Chromium regression that exercises every palette, persistence, mission selection, mobile layout, and all three browser practice modes.
- References: [Theme documentation](../docs/THEMES.md) · [Passing theme validation](https://github.com/MasynNay/Keystoria/actions/runs/42540558364).

## [0.23.0] — Live Lyric Keys — 2026-11-07

- Lyric Lab highlights the expected letter *within* the existing yellow active word and flashes that character; it uses the same green/red character status language as the campaign and Speed Lab.
- Add an always-visible NEXT KEY hint during a lyric word (or SPACE when complete); preserve original lyric punctuation, apostrophes, and accents with relaxed/strict matching.
- Redraw character feedback on every input event, not only when a word is submitted. Reset the input/caret when seeking or jumping to a different line.
- Support reduced-motion preferences; add 7 pure JS unit tests and real Chromium desktop/mobile regression assertions.
- Existing music lookup, YouTube playback, mission campaign, and skip controls are unchanged.

## 0.24.0 — Keystoria: Every Key Opens a World

- New project name, vector mark and favicon, menu identity, homepage introduction and Lyric Lab attribution.
- A polished independent `portfolio/` static presentation for GitHub Pages / Cloudflare Pages.
- Existing progress and saved music links remain compatible with their original storage keys.
- Maintains the v0.23 blinking next-letter indicator and all 24 story missions.
- See `RELEASE_NOTES_v024.md` and `docs/DEV_JOURNAL_V024.md`.

## [0.22.0] — The Frontier Update — 2026-11-07

- Six new original, complete co-op/solo story missions: Clockfall, The Dream Market, Emberwing Refuge, The Drowned Archive, Aurora Arc and Inkbound Kingdom. Each has 11 hacker objectives, 10 defender phrases, 2 field interventions, a tactical choice, role swap, crisis, ending and story dialogue.
- Six new palette/icon systems and story-camera-only SVG animated environments, server-confirmed step-driven scenes, storyboards and consequences; 24 missions total.
- Best-effort no-key YouTube video-ID discovery via documented Invidious/Piped metadata indexes in parallel with MusicBrainz; official YouTube Data API remains available with a server-side key. Video and audio still play only through YouTube's official iframe. No files downloaded; no guarantee of provider uptime, correct sync or embed availability.
- Targeted tests for frontier story structure, art stages, source matching, invalid IDs, covers, live edits, error fallback and concurrency; clean archive smoke checks.

## [0.21.0] — Automatic Music Matching — 2026-11-07

- Automatically attempt a verified YouTube recording match when the player selects a non-featured lyrics result. No per-song MP3 file or URL is required when the lookup succeeds.
- Use public MusicBrainz recording-to-YouTube links without credentials; follow a directly related music-video recording if linked. Respect a 1.1-second interval between MusicBrainz requests and cache results.
- Add optional server-side YouTube Data API search, filtered to embeddable public videos. Check title, artist, length and unsupported versions, and cache successful match IDs in the browser. The key never leaves the server.
- Normalize LRCLIB display titles such as “Artist - Song (Official Video)” so searches target the actual recording.
- Keep manual YouTube linking when no reliable match is found. Avoid false claims of video availability and retain video-sync calibration.
- Add offline provider/metadata tests and Chromium tests for successful auto-match, saved associations, video controls, and fallback.

## [0.20.0] — Music That Moves — 2026-11-07

- Render licensed-source YouTube video thumbnail URLs for linked tracks, with unique locally generated vector covers for all songs as an offline/default fallback. Avoid copying album art from external music stores.
- Add one-key full lyric-line skip (Enter) and explicit Skip Line button. Keep Space for word submission; skip reduces accuracy and awards no credit. Detect foreign-script lines and show relevant instruction.
- Show YouTube-current lyric and typing target as separate panels to avoid misleading synchronization. Use player `getCurrentTime()` as the sole master clock and update the line-progress meter each tick.
- Add line-specific SYNC calibration against video playback position, stored per song and video; offset ±0.25s and reset; duration mismatch warnings for different edits.
- Added pure JS tests and Playwright/Chromium browser checks for art, skipped-line scores, foreign-script words, calibration, persisted settings, video/typing line independence, and mobile layout.

## [0.19.0] — Play It Your Way — 2026-11-07

- Default homepage to a compact three-operation mission gallery with accessible expand/collapse to all 18 and a visible current selection.
- Add playback-rate controls to Lyric Lab (0.5×–2× when supported). Use the YouTube IFrame Player API for real playback speed and current-time synchronization; the original offline beat uses rate-adjusted tempo.
- Fix confusing silent search results: unmatched LRCLIB tracks now explicitly offer an official YouTube search and an in-app URL linking form, with strict URL validation and a remembered video ID. This is no-file music playback but not automatic arbitrary YouTube discovery, which requires an authorized search provider.
- Add Node tests for video URL parsing, rate selection and collapsed gallery, plus Chromium tests for URL linking, saved associations, speed controls, mobile overflow and all 18 expansion. Preserve the 18-mission engine and existing modes.

# Changelog

## [0.18.0] — Rhythm & Color — 2026-11-07

- Assign eighteen distinct, consistent color palettes to the campaign cards and large mission symbols, correcting six new missions that inherited Station Zero blue.
- Add a new separate Lyric Lab music-typing practice mode, reached from the homepage, with twelve featured YouTube video identifiers and LRCLIB on-demand synchronized lyric search.
- Embed the video using the official YouTube IFrame Player API; never download tracks or bundle copyrighted lyrics. A non-featured search without a known matched video runs lyric timing practice rather than claiming an automatic song-video match.
- Score WPM, accuracy and streaks; highlight word-level typed progress, sync to video time, optionally pause when eight words behind, adjust offset, jump to a line, and loop a difficult line without inflating the score. Save minimal local-only result metadata.
- Include an offline original practice text plus a lightweight electronic beat so the mode has a functioning test without a network connection.
- Add `docs/LYRIC_LAB.md` for external service requirements, rights limitations, testing, and honest release boundaries; expand regression tests and a Chromium DOM interaction suite.


## [0.17.0] — Parallel Worlds — 2026-11-07

- Add six original chapters, bringing the campaign to eighteen: Mirrorfall, Four Winds, Dawnforge, The Glass Trials, Wildbond, and The Last Stardoor. Each has two roles, eleven objectives, defenses, plot reversals, world hazards, shared tactics, field choices and an ending.
- Add six dedicated scene compositions, character dialogue scripts, environmental animations and uniform mission crests. The Mirrorfall scenery inverts and restores at story milestones without rotating input controls.
- Extend active-phrase animation with portal, elemental, creature and mythical-forge actuators, rather than using generic terminal icons.
- Synchronize stage and defender threat context with illustrations and reveal decoded clue text character-by-character when appropriate. The post-action popup remains removed.
- Audit every mission throughline, repair premature narrative beats and correct inaccurate closing scenes for several prior chapters. Document role-by-role intent in `docs/STORY_AUDIT.md`.
- Render the current target phrase on initial page paint, rather than displaying an `INITIALIZING...` placeholder while first snapshot processing completes.
- Expand Python/JS regression and offline Chromium visual checks to all eighteen worlds, including the inverted-gravity story steps.


## [0.16.0] — Story Sync — 2026-11-06

- Remove the animated story-window word popup after completed actions.
- Add objective-aware cinematic HUD overlays so scenes visually decode signals, confirm routes, and reflect the current story beat.
- Replace several stick-figure style silhouettes with fuller illustrated operators in the action stage and scene depth layers.
- Add a light-pulse completion effect so progress still feels responsive without covering the artwork with more text.

## [0.15.0] — Living Stories — 2026-11-06

- Make Single Player with ECHO the first and primary homepage option; retain Two Player immediately beside it.
- Introduce a responsive, dismissible welcome dialog whenever players enter the main page. It describes the game, intended audience, solo/duo cooperation, Speed Lab, and Field Academy.
- Create `scene-action-stage.js`: twelve distinct animated foreground rigs and action-specific visual cues for each story. Players see equipment, characters, rescues, machines, and environmental changes operate as they type.
- Separate hacker typing progress from defender threat-intercept progress; visual completion never bypasses server-owned objectives.
- Show a short, nonblocking story-consequence card when a mission objective advances; retain the two-column cockpit.
- Stop rerendering the complete SVG when only ambient pressure changes. This preserves continuity of looping animations and reduces unnecessary DOM churn.
- Add a v0.15 responsive visual check, plus frontend unit tests for the first-player default, introduction, twelve action rigs, and role-specific visuals.
- Preserve the ten-second countdown, explicit Play gate, ECHO, multiplayer, twelve campaign endings, Academy, and Speed Lab.


## [0.14.0] — Story Camera & Manual Launch — 2026-11-06

- Add a manual, synchronized Play gate after the ten-second orientation countdown. No threat, clock or ECHO tick begins until all human players opt in; solo requires one click.
- Add `scene-vistas.js`: twelve distinct environmental animation sets with characters, scenery, vehicles and equipment, local to the existing in-game scene viewport.
- Standardize all twelve mission symbols and full-size card artwork under one vector identity system; preserve unique per-world pictograms and colors.
- Keep the story/typing cockpit, Academy, Speed Lab, and original mission content unchanged.
- Add server and browser regression coverage for the new launch flow and artwork, with preserved completion routes and reconnect behavior.

## [0.13.0] — Story Motion & Identity — 2026-11-06

- Add a separate choreographed SVG action layer for each of twelve story worlds. Scene actors and interventions react to server-confirmed story progress, danger state, and corrected typing prefixes. The application layout, mission logic, Academy, and Speed Lab remain intact.
- Draw twelve individually authored SVG mission icons, reuse them consistently on mission cards and the selected-operation lobby, and replace mismatched cover placeholders, including Carnival 13’s incorrect aircraft graphic.
- Extend deployment to ten seconds after both players confirm Ready. The number counts visibly from ten to one, with the actual mission premise and player role available to read. Timers, AI actions, and threats stay frozen through the full interval.
- Add browser-independent visual render fixtures, a reproducible Chromium layout check, icon uniqueness and scene-state regression tests, and updated playtest documentation.
- Release tests: 65 Python + 49 JavaScript; separately inspected Chromium scene layouts and mobile overflow. Full live two-player browser play remains unverified.

---

## v0.12.0 — Story Window Update

- Kept existing menus, cockpit placement, Speed Lab and Academy unchanged.
- Enhanced the animated mission camera with layered story-specific scenery,
  responsive physical props, weather, character silhouettes and live signals.
- Added Whiteout, Ashfall and Carnival 13 with distinct character-driven
  betrayal plots, eleven actions, two field interventions, and tested endings.
- Added thirty-three authored action explanations for the new chapters.
- Added tests for every mission's scene progression, visual context and live
  scene + typing layout, retaining the previous completion matrix.
- Preserved solo, duo, randomized OS lessons and after-action story reels.


This file records user-facing releases. Experiments and test fixtures are not product releases.

## [0.11.0] — The Storyboard Update — 2026-11-06

### Living stories
- Build nine authored animated storyboards with 11 contextual action shots and 12 narrative states per mission; named-character dialogue and specific visual props change when the server confirms each story command.
- React to correct typing within a shot using CSS/SVG progress: power, map routes, doors, medicine and vehicles change while characters are entered. Incorrect letters cannot advance the animation or mission progress.
- Add a controllable 12-scene After Action Story Reel on the results screen without changing game authority or score.
- Add Abyss Nine, Neon Heist and Red Horizon as fully integrated operations with their own briefings, five-plus-six objective paths, defensive tasks, world pressure, tactical choices, field interventions and endings.
- Eliminate repeated normal defender targets within one deck pass; reshuffle only after the deck is exhausted. Retain unique authored hacker objectives and rematch cleanup.
- Write practical, mission-specific purpose descriptions for all new defensive actions.

### Quality and limitations
- Keep game rules in Python and all story SVG/dialogue code in focused browser modules. Preserve solo/duo, Academy, and Speed Lab without new external assets.
- Verify nine-mission completion on all difficulties with both modes and both tactical choices; browser-test every animated mission, typed-progress reactions and the 12-frame story reel. Run 65 Python plus 43 JavaScript regression checks.
- The shots are illustrated local SVG/CSS animations, not downloadable full-motion movies; two-human cross-device play remains a manual acceptance gate.

---

## v0.10.0 — The Cockpit Update

- Restructured the game view so the live illustrated scene and the typing console remain side by side on desktop and typical laptop displays. Command explanations, a per-character target, and the input are all visible together.
- Moved the detailed mission briefing, squad statistics, activity feed, environment pressure and extraction path underneath the live cockpit. All details remain part of the document, with a return-to-live action.
- Extended the server-controlled deployment to six seconds: a preparation interval followed by 3–2–1. Neither mission time nor enemy actions run during preparation.
- Added explicit role and typing instructions to deployment, and a persistent YOUR TURN TO TYPE prompt in the game.
- Removed game-entry input auto-scrolling that previously hid the mission scene. Input is focused without moving the viewport.
- Added browser layout checks for all six games, a smaller laptop screen and mobile overflow, plus countdown and time-freeze regression coverage. Academy and Speed Lab remain unchanged.

## [0.9.0] — The Intervention Update — 2026-11-06

### Gameplay
- Give each of the six worlds two optional in-world control choices in each act: 24 authored interventions, one selectable per act. Both solo and duo can use them. Effects change timer, integrity and world pressure on the server; duplicate or invalid clicks are rejected.
- Show a prominent emergency action button only after unlocking the field console. A click brings its accessible choice buttons into view; no automatic scrolling is added to Academy or Speed Lab.
- Keep each confirmed intervention's result visible through the role swap, in the story chronicle and on the final result screen. Add live pressure telemetry inside the illustrated mission view and world-specific animated effects. Respect reduced motion.
- Add an explicit Reshuffle & Start Over action to the three randomized Academy courses.

### Tests and engineering
- Separate authoritative decision content (`field_operations.py`), browser control rendering (`field-controls.js`) and decorative world effects (`scene-effects.js`). The client supplies only an action ID, never gameplay values.
- Test all 24 choices' exact effects and repeat-click rejection, previous-act history, rematch cleanup, and 24 additional complete win routes using both interventions.
- Exercise two real WebSocket clients selecting the same world operation and rejecting a duplicate; run Chromium interactive control checks across six worlds and check mobile layout width.
- Preserve the existing completion matrix, Speed Lab behavior and earlier game features.

### Limitations
- Scenes use local SVG and CSS animation, not cinematic video or a fully simulated physical environment. Choice consequences are real but remain within the existing short mission structure. Full human two-device acceptance testing and game-fun evaluation remain open.

## [0.8.0] — The Extraction Update — 2026-11-06

### Verified mission completion
- Fix ticker-driven terminal transitions: broadcast `won`/`lost` snapshots even when a room changes phase during a timer tick, then stop idle room broadcasts after delivery.
- Make the result screen scroll to the top and show a prominent, scenario-specific final illustration, an explicit win/loss banner, the reason for termination, and completed-objective count.
- Verify all six missions across all three difficulties, both solo/duo modes, and both tactical choices: **72 full win routes**, with real timed ECHO behavior in solo mode.
- Verify every mission rematches and wins again in both modes (12 additional scenarios), and every world presents a timer-driven loss with a readable reason in both modes (12 more scenarios).
- Add two live HTTP/WebSocket delivery tests: a duo countdown-to-timeout sends the final snapshot to both humans; an AI's final action sends an explicit Patient Zero victory to its human partner. Both return to the lobby via rematch.

### Training and presentation
- Shuffle all 14 commands at the start of each Linux, PowerShell and macOS Academy course and again on replay. Keep original command references, explanations and simulated outputs aligned.
- Add live in-scene completion percentages, progress bars, subtle surveillance/scene animations and final victory/failure artwork for every mission.
- Ensure result-screen animations obey reduced-motion settings; keep Speed Lab's fixed-horizontal, upward-scrolling passage and mission-only input auto-scrolling.

### Engineering and limitations
- Add a dedicated deterministic completion matrix, terminal-delivery integration tests, JavaScript visual/randomizer regressions and six-world interactive Chromium verification.
- Separate v0.8 visual styling into its own stylesheet. Update static asset versions, interface version, README, test documentation and Mac installation guidance.
- Automated coverage confirms reachable success/failure states and server delivery, but a full two-human playthrough over public internet infrastructure is still a manual release gate.

## [0.7.0] — The Moving World Update — 2026-11-06

### Fixes
- Stop Academy and Speed Lab from retaining the home page's scroll position. Enter at page top; keep reference reading position stable.
- Remove automatic `scrollIntoView` from non-mission typing controls; retain it for the active story input and urgent in-mission choices.
- Replace Speed Lab fixed cards with a continuous multi-line passage: no horizontal movement or replacement cards, only vertical advancement at full-line boundaries.
- Update character feedback by changing classes on existing spans, avoiding per-key layout rebuilds while keeping typo/Backspace feedback.

### Stories and visuals
- Add 72 scene beats across six operations: opening state plus 11 progression milestones per world.
- Add custom inline SVG illustrations for space station, haunted house, quarantine lab, murder caseboard, emergency radio station and runaway train.
- React to confirmed progress and danger without sending extra gameplay messages or changing server authority.
- Distinct train and broken-bridge visuals for Last Stop; additional missions use their own scene direction and visuals.

### Engineering
- Separate narrative data, illustrations and rendering into `scene-narratives.js`, `scene-illustrations.js` and `mission-scenes.js`.
- Introduce `speed-flow.js`, remove obsolete `speed-pages.js` and update CI and focused regression coverage.
- Keep server HTTP health metadata in sync with release version.

### Limitations
- Illustrated scenes do not yet create new interactive objective types, character dialogue, boss mechanics or branching story decisions. Human two-device play and visual polish still need field testing.

## [0.6.0] — The Signal & Story Update — 2026-11-06

### Experience
- Fixed Academy two-step Enter workflow: first validates, second advances. Current command is read-only after success so the input retains keyboard focus.
- Made all 42 course reference entries selectable. Each command now includes detailed practical use, benefit, caution, and example output in a persistent right-side reference view.
- Kept mission How to Play open across high-frequency server snapshots; close only on explicit dismissal or phase transition.
- Highlighted required tactical/accusation choices with a pulsing red panel, clear selection prompt, and one-time scroll/focus behavior. Reduced-motion mode uses a static high-contrast border.
- Replaced Speed Lab's per-character sliding text window with fixed word cards. They change only on word boundaries, with shorter pages on mobile.
- Added two new operations, *Dead Air* (flood evacuation, radio interference) and *Last Stop* (runaway passenger train, overspeed), each with two acts, unique roles, actions, threats, plans, crises, visuals, and endings.
- Displayed current story developments in gameplay and added an after-action chronicle of actual mission milestones and tactical consequences.

### Engineering
- New scenario content isolated in `server/new_missions.py`; common authoritative rules remain in the existing engine.
- New standalone educational metadata module (`command-guides.js`) and pure word-card paging helpers (`speed-pages.js`).
- New visual interaction styles isolated in `web/styles/v06.css`.
- Added unit and Chromium interaction regressions for new worlds, fixed page positioning, keyboard flow, persistent modal, and choice prompts.
- Server health endpoint updated to `0.6.0`; all v0.5 features preserved.

## [0.5.0] — The Typing Update — 2026-11-06

### Added
- Shared character-level typing renderer for story objectives, defender responses, Academy commands and Speed Lab. Correct characters are green, incorrect and extra characters are red, with a current-character caret.
- Per-action descriptions for every one of the **133** possible narrative and defense prompts across four missions.
- Authored five/six-step narrative sequences so story actions proceed in a coherent order; hostile attacks remain variable.
- Mission viewport auto-focus and scrolling on gameplay entry, without scrolling on each real-time snapshot.
- Standalone Speed Lab with four timed durations (15, 30, 60, 120 seconds), three word banks, live WPM/accuracy, personal results and 25-run bounded history.
- Independent speed controller with one timer per session and cleanup on restart, completion or exit; optional Ctrl + Enter restart and blocked paste.
- Python tests verifying action-description coverage and ordered story paths; JavaScript tests for correctness rendering, escaping, speed scoring and history.
- Desktop/mobile interactive Chromium checks for live key coloring, Backspace, timed end of session, result persistence, objective descriptions and viewport positioning.

### Changed
- Split new typing and Speed Lab CSS into dedicated stylesheet modules; kept the original game stylesheet stable.
- Updated cache-busting version tags, `/health` version, README, architecture, playtest checklist and continuous integration checks.
- The results screen now updates its top metrics to match the finished speed test.

### Verification note
- Headless Chromium successfully tested the actual frontend with simulated multiplayer WebSocket snapshots and the local Speed Lab engine. Live server HTTP/WebSocket integration tests are separate. Chromium navigation to a localhost server is prohibited in this environment, so a full browser-to-server human multiplayer playthrough is not claimed.

## [0.4.0] — The Orientation Update — 2026-11-06

### Added

- Cinematic, scenario-specific mission briefings with story premise, separate hacker/defender objectives, survival stakes, and a later chapter recap.
- Two-operator Ready checks and synchronized deployment countdown. The game clock and threats stay frozen during onboarding; solo ECHO auto-readies.
- Persistent in-mission objective instructions and a replayable How to Play guide.
- **The Last Alibi**: a fourth playable noir mystery with authored hotel murder narrative, evidence collection, a persistent clue board, suspects, penalties for false accusations, a final culprit deduction, and ending debrief.
- **Field Academy**: three standalone self-paced courses with 14 Linux Bash, 14 Windows PowerShell, and 14 macOS Terminal commands (42 total). Each example has a purpose, safety context, and a browsable reference guide.
- Lessons never execute shell commands. Every correct entry displays a clearly marked, authored example of its terminal output. Completion is tracked locally and the full command guide can be reopened.
- Offline interactive Chromium flow tests that drive real lesson input and the actual app controller against deterministic engine snapshots.
- Story, Academy and mystery UI at desktop/mobile widths, plus updated playtest and architecture documentation.

### Changed

- Results screen now renders typed statistics and earned achievements without referencing uninitialized variables.
- Rematches reset mission-specific briefing, deduction and clue state.
- Server `/health` version updated to `0.4.0`.
- CI now runs all Python and JavaScript test suites, including onboarding and lessons.

### Verification and limits

- Engine/API and browser unit suites cover briefing readiness, timer behavior, new story, mystery wrong/correct accusation and AI path, all 42 command records, and reconnect/rematch transitions.
- Interactive Chromium checks validate the complete Linux lesson and simulated-network mission click-through. Layout tests render five screen types at desktop/mobile sizes.
- Complete human-to-human browser and public internet deployment have **not** been validated; online room data remains volatile.

## [0.3.0] — The Fracture Update — 2026-11-06

### Added

- World-specific survival meters with separate fail conditions: reactor heat, dread, and barricade strength.
- Cooperative tactical fork in Phase 1. Hacker chooses one of two authored plans; defender executes it by typing a special phrase. Plans alter world pressure, integrity, time, or future threat speed.
- Danger thresholds that speed up hostile encounters when a world's resource is in jeopardy.
- Operator field record: recent runs, extractions, highest score, estimated WPM, accuracy and six local milestones. Last 24 records are retained per browser.
- Optional larger command type, stronger interface contrast and reduced motion, persisted locally.
- Dedicated scenario resource monitor and tactical-choice interface at desktop and mobile sizes.
- Scenario/encounter invariants, full-win paths, fallback timers and session-recovery regression tests. Added protocol-level two-client tactical relay test.
- Architecture notes, a structured playtest plan and offline Chromium visual-layout checks.

### Changed

- Shared clock pause now also suspends threat deadlines, AI scheduling and transition animation to avoid reconnect unfairness.
- Completed rooms stop receiving idle periodic result broadcasts. Browser socket reconnection uses capped backoff.
- Audio nodes disconnect after cues end. In-game target highlighting is refreshed only when its input or target changes.
- Room host ownership is repaired if all players leave a lobby and another operator joins.
- Origin validation includes the connecting port. Health endpoint reports `0.3.0`.

### Limitations

- Room state remains in memory; the server is single-process.
- No authentication, cross-device account sync or permanent public scores.
- Static browser layouts have been rendered in Chromium; automated live browser navigation was restricted in the build environment. Live WebSocket integration tests passed, but complete two-person manual playtesting is still recommended.

## [0.2.0] — The Signal Update — 2026-11-06

- Cadet, Standard and Overdrive difficulty presets.
- Shared two-person Signal Pulse emergency ability and fixed squad signals.
- Final-phase critical incident, rematches, mission storytelling, improved timers and reconnect behavior.
- Split browser UI into view, helper and mission modules.

## [0.1.0] — First Transmission — 2026-11-06

- Three authored missions, two-person WebSocket rooms, solo ECHO mode.
- Asymmetric typing, timed enemies, automatic role swap, scoring and extraction screens.
- Responsive frontend, synthesized sound, launch scripts and automated engine checks.
