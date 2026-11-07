# v0.17 story continuity, animated worlds and two-role playtest

1. On the homepage, compare **all twenty-four** different cover marks, colors and titles. Solo with ECHO must still be the first option.
2. Read a mission's two-role briefing and complete the ten-second preflight. Leave the **Play Mission** gate untouched: the clock and ECHO must remain frozen. In Duo, both humans must confirm Play.
3. Try **Mirrorfall** first. After five objective completions the physical town must flip upside down, **but the typing controls and HUD must not**. Find the children, expose the director, guide families to the return lift and watch the town reorient before the final seal.
4. Try **Four Winds** (elemental canals and guardians), **Dawnforge** (sun gears), **The Glass Trials** (dangerous arena screens), **Wildbond** (creatures and tree roots), and **The Last Stardoor** (story portals and recovered memories). The illustrated action should reflect the **current phrase**, not a generic illustration of the next scene.
5. In a decoding step, type half the correct phrase. The pictured message must reveal only a partial string; backspace and errors must not incorrectly grant more of it. Completing the action advances only after the server accepts it. There must be no giant popup of celebratory words covering the camera.
6. Swap roles. The Defender must see the live threat and protective intercept rather than the Hacker's completed action. Repeat in Solo and Duo. Check both perspectives in **all 24 missions** using [the story audit](STORY_AUDIT.md).
7. Reach a victory and failure, try Rematch, test reduced motion, keyboard focus, responsive mobile widths, Academy shuffle and Speed Lab's uninterrupted word stream.

Automated checks: `make test`, then `PYTHONPATH=. python tests/browser_v017.py` for visual fixtures (requires Playwright/Chromium). The latter uses actual engine state for initial shots and carefully projected state for later visual frames; it does not replace live user playtesting.

---

# v0.14 focused playtest

1. Open a solo mission and read the two-role briefing. Confirm Ready. Count down from ten. At zero, **do not click Play** for at least a minute: mission time, integrity and threat state must remain unchanged.
2. Click **Play Mission**. The game should open with the visual scene and typing field visible side by side. Confirm typed characters turn green/red and the artwork reacts to correct prefixes only.
3. Test a duo room in two separate browsers. After countdown, click Play on only one browser. The second should still show Play. The first should show a waiting state. Only after the second click should both screens start together.
4. Disconnect a duo player while on the Play screen. Check that a stale player cannot start the round; reconnect and complete the launch.
5. Compare all twelve mission cover cards: same stroke/framing, unique pictograms and different colors.
6. In every mission, verify that the scene still fits next to the input, that the new environment animation remains inside the camera, and that typing/control options remain accessible at desktop and mobile sizes.
7. Confirm Academy lessons still randomize, Speed Lab retains stationary horizontal word placement with vertical scrolling, and all mission endings and rematches remain reachable.

Automated fixtures use real engine snapshots and local HTML, not full human networking. The two-client WebSocket launch test checks synchronization; human pacing, audio and subjective visual quality remain manual tests.

---

# v0.13 — Story Motion & Identity acceptance checks

Start with **Dead Air** in Solo Mode. Read the briefing and confirm Ready. Watch the countdown show the complete ten-to-one sequence; verify the story premise is readable and no mission time or attack begins before GO. During the first objective, the cockpit should display both the animated radio environment and typing input without scrolling on a typical laptop.

Test each of the **twelve missions** and compare the unique visual action: Station Zero has moving spacecraft and orbital activity; Hollow House has ghost/ritual effects; Patient Zero has lab equipment and medical readouts; The Last Alibi has moving evidence connections; Dead Air has flood and rescue signaling; Last Stop has moving train mechanics; Abyss Nine has a diver and rescue tether; Neon Heist has security lasers; Red Horizon has a rover and greenhouse; Whiteout has a snow rescue vehicle; Ashfall has fire and evacuation traffic; Carnival 13 has its wheel and rescue lift. Each mission selection card must have its **own identifiable mark** (no inherited airplane graphic on Carnival 13).

Check animation **during a corrected typing prefix**, and make sure errors or deleted letters do not finish the server objective. Finish an action and verify the scene changes based on confirmed progress. Enable Reduce Motion: informational scene elements must remain visible even when movement is disabled.

Run one complete route for each world in Solo Mode, and ideally Duo Mode on two separate devices. Verify the role swap, tactical choice, final scene, unambiguous ending, rematch, and After Action Story Reel. The automated completion matrix proves server-side reachability; it cannot judge whether the animations are entertaining or readable in a real session.

Run the randomized Linux, Windows, and macOS Academy lessons and a 60-second Speed Lab test. These modes must retain their existing layouts and keyboard behavior. On a phone-sized browser, verify no sideways page overflow (the story and input may stack vertically).

Automated checks: `make test`. Optional static browser check: `PYTHONPATH=. python tests/browser_v013.py` (requires Node, Playwright, and Chromium). The static browser check uses **real Python engine snapshots** but does not establish a live browser WebSocket connection. Manual two-human play remains the multiplayer acceptance gate.

---

# v0.11 cinematic campaign playtest

Start with **Dead Air on Cadet, solo with ECHO**. Its eleven plot actions should change the animated close-up from an emergency radio to backup power, flood maps, frequency repairs and the evacuation broadcast. Watch the changing character dialogue and the physical shot progress while typing. Enter a wrong letter: the illustration must not gain progress until the prefix is corrected. After finishing, move through all twelve slides in the **After Action Story Reel** using Previous and Next.

Next play the three new operations: **Abyss Nine** (submarine rescue), **Neon Heist** (secure archive evidence), and **Red Horizon** (Mars colony survival). Watch for named characters, action-specific animation and a distinct ending. Replay a mission and confirm that routine defender commands do not repeat immediately, unlike the deliberately authored eleven hacker objectives. Test an emergency intervention and ensure it visibly changes the world gauge, not just the caption.

Repeat the basic route in the six earlier worlds. Verify the six-second preparation countdown, ability to see the live scene and typing field together, role swap, critical incident, final result and rematch. All nine campaigns must remain playable in solo with ECHO or duo via a second browser/device. On each ending, test scene reel boundaries: cannot go before scene 01 or after scene 12.

Also check **Linux, Windows and macOS Academy** for randomized courses and **Speed Lab** for its horizontally fixed, vertically scrolling word field. Both should open at top of their page and not auto-scroll to mission typing. Check reduced-motion mode, narrow mobile layout, and keyboard accessibility of the story reel.

**Automated verification:** `make test`; optional `PYTHONPATH=tests:. python tests/browser_v011.py` with Playwright/Chromium installed. The browser tests use the real frontend with Python-engine state but a simulated browser socket; human network play is a separate acceptance gate.

---

# v0.10 cockpit playtest focus

1. Play **Dead Air** solo with ECHO at 100% browser zoom on a laptop. Read your briefing and press Ready. Confirm the preparation screen says **GET READY TO TYPE**, explains your role, and gives you time before the countdown. The mission timer must remain frozen until 3–2–1 completes.
2. As the game starts, confirm you can see the **illustrated radio tower**, the **next highlighted phrase**, and the **entire typing input** simultaneously without scrolling. A different window size may require the responsive stacked layout.
3. Complete several commands. Confirm the illustrated scene and percentage update while the input remains visible. Try both emergency intervention options across separate runs.
4. Scroll below the live cockpit to verify you still have mission briefing, threat monitor, team stats, event log, world pressure and extraction path. Use **Back to Live Game** to return.
5. Verify **How to Play** remains open despite incoming updates, and that role swap, victory/loss screens, rematches and solo/duo modes still work.
6. Test Academy and Speed Lab: neither should inherit the game screen's forced focus or scrolling. Academy order remains shuffled; Speed Lab's words remain horizontally stationary.

---

# Playtesting v0.9 — The Intervention Update

## First: do your decisions feel consequential?

Start **Last Stop** in Solo Mode with ECHO on Cadet. After your first accepted hacking action, the mission illustration unlocks an **Emergency Action** button. Click it, then choose whether to charge the reserve air brakes or clear passenger aisles. Read the outcome directly underneath the illustration. Confirm the train's pressure meter, scene label, and mission story respond. The control should now say *Action Committed* and refuse another choice in the same act.

Finish five hacker actions to swap roles. Your first field decision must remain visible in the scene history; after the first action of Act II you can make one more decision. Repeat on Patient Zero, Station Zero, The Hollow House, Dead Air and The Last Alibi. Each should have its own wording, scene overlay, tradeoff and debrief entry—not the same generic button.

## Solo, duo and completion

In Solo Mode, verify ECHO continues responding after a field intervention. In Duo Mode, check that both operators see the same applied decision, even when the non-hacker makes it. Complete each of the six missions, reach the **Victory** screen and try Rematch. Incorrect inputs, threats or timeouts should still produce a clear failure result rather than silently ending. The six-world completion matrix is described in [COMPLETION_MATRIX.md](COMPLETION_MATRIX.md).

## Academy, Speed Lab, accessibility

In each Academy (Linux, PowerShell, macOS), click **Reshuffle & Start Over** and confirm a new prompt order without losing the practical command reference. Press Enter to check, then Enter again to advance. These are simulations only. In Speed Lab, multiple lines of words should remain anchored horizontally and move vertically as you progress. Try a 60-second run. On a narrow window and with Reduced Motion enabled, check controls are operable, highlights are visible, and neither the mission nor training mode scrolls unexpectedly.

## Verification scope

Automated engine and network tests run with `make test`. The optional Chromium test `PYTHONPATH=tests:. python tests/browser_v09.py` uses real game UI and server-generated snapshots, but stubs browser WebSocket delivery because this environment restricts local browser navigation. A separate Python integration test verifies actual two-client WebSocket action delivery. Human two-device play, motivation, browser coverage and production load remain manual release gates.

---

# Playtesting v0.8 — The Extraction Update

## First priority: can you finish every operation?

Use **Solo Mode / Play with ECHO** first and Cadet difficulty. Complete the briefing, tactical choice, role swap and final crisis. The game must end on a **mission complete** screen with 11/11 objectives, the correct world illustration, a readable explanation, and the option to rematch. Repeat with Patient Zero, The Hollow House, Station Zero, The Last Alibi, Dead Air and Last Stop. The casefile operation adds a suspect deduction. Check that ECHO handles it when assigned investigator after the swap.

Once solo is comfortable, create a two-human room, have each player confirm the briefing and complete a run together. After each mission, both players must see the **same** victory or failure status. Test Cadet first; use Standard and Overdrive to compare pacing. A game that times out or loses integrity must show a defeat screen with a clear reason, never silently freeze. Use the rematch button and finish a second run.

## Academy and Speed Lab

Open Linux, Windows PowerShell and macOS Academy. Confirm the sequence is different between attempts, and command explanations/output are still the right ones. Check Enter once to validate and again to continue. Click the sidebar to review commands without losing the current prompt. These exercises must never execute shell commands. In Speed Lab, characters should stay fixed horizontally and advance vertically while typing; all 15/30/60/120-second durations should finish with visible scores.

## Visuals and accessibility

During a story mission, the illustrated scene, action counter and completion percentage must update after accepted hacker actions. The scene's urgency should respond to danger. Mission results should appear at the **top of the page** even if the game was scrolled to its typing field. Test with reduced motion, large text and a narrow mobile window. Images are SVG/CSS, not gameplay videos.

## Evidence and limitations

See [COMPLETION_MATRIX.md](COMPLETION_MATRIX.md) for automated coverage. The Python integration tests use the actual server and WebSockets. Browser interaction runs Chromium with the real frontend and engine-authored state but a simulated socket transport because this test environment blocks normal local browser navigation. Human play, accessibility auditing, internet latency and real-world balancing are still outstanding.

---

## v0.7 priorities: scroll and living missions

1. Open **Linux**, **Windows** and **macOS** from the home page at different scroll depths. Each course must start at the **top**, not focused down at the input. Review old commands and ensure clicking a reference does not move the viewport.
2. Open **Speed Lab** from the home-page promotion. It must start at the top. Confirm the prompt shows several lines of words. Begin typing until the caret reaches the lower lines; the words should move **upward only**, never sideways or disappear as a word card.
3. In Speed Lab, type a wrong letter and correct it with Backspace. A later word's horizontal coordinate should remain fixed. Check all four durations and three word banks.
4. Play **Last Stop** solo. Look at the live illustrated train scene before typing, then confirm the illustration and description change **after** each confirmed mission objective. You should see the train approach the broken bridge and the braking state change during Phase 2.
5. Play another world (for example, The Last Alibi). It should show its own illustrated evidence board, not a recycled train picture. Check warning states and transitions after role swap.
6. Check that **only** missions auto-scroll to the active input. The Academy and Speed Lab must not jump to the typing field on launch or after switching their settings.

## Automated checks

Run `make test` for the Python engine and JavaScript checks. The browser-specific interactive tests are `python tests/browser_v07.py` and `python tests/browser_v07_mobile.py` (Playwright/Chromium required). The former executes real view/controller code with simulated WebSocket snapshots; the latter exercises the actual scrolling component at 390px. Neither claims a full two-browser live-server playthrough.

# Playtesting v0.7 — The Moving World Update

This guide prioritizes what a new player actually understands, not just whether the game engine increments a score.

## Regression priority: character correctness and focus

1. Begin Station Zero in solo mode. When the countdown ends, verify the page scrolls the keyboard input into view without manual scrolling.
2. Type a correct prefix and confirm each entered character turns green. Type a deliberate mistake and confirm it turns red immediately. Backspace and correct it; the red indicator must disappear.
3. Confirm the line above the mission phrase explains *why* the specific action helps your character. During Station Zero Phase 2, *Release docking clamps* should explain that the mechanical arms prevent departure.
4. After the role swap, type a defensive response and confirm the same green/red/caret system works. Check when a tactic/crisis changes the target and when the input is briefly disabled.
5. In Linux, Windows and macOS Academy, correct and incorrect characters should be highlighted during typing. The field should remain editable after a wrong Enter until you fix it.
6. Use larger text, high contrast and reduced motion modes to check that highlighting remains readable.

## Speed Lab — solo practice

1. From the home screen, select **Speed Lab**. Choose 30 seconds and Everyday. There should be no timer until your first keystroke.
2. Check live character colors, Backspace corrections, and a visible caret. Watch WPM, raw WPM and accuracy change; they should not change while idle.
3. Try a 60-second Technology test and a 120-second Story Mode test. Verify the prompt keeps advancing without losing your place and remains responsive over time.
4. At 00:00 the session should stop, show the correct finished numbers and save its result under Personal Records. Restart or select another word bank without a stale timer continuing.
5. Verify Ctrl + Enter restarts. Ensure pasting into the test field is blocked. Confirm records persist after refreshing the browser and stop accumulating beyond 25 entries.
6. Repeat on a narrow screen (390px); there should be no horizontal scroll.

## Solo: your first 10 minutes

1. From home, select **Station Zero → Try Solo Demo** and choose **Cadet** in the lobby.
2. Click **Launch Mission**. Confirm you see **the narrative briefing** rather than a live typing prompt. Read what happened, why the hacker is needed, what the defender protects, and how to lose.
3. Leave the briefing open. The game clock and reactor meter must not change. Click **I'm Ready**; ECHO should already be ready.
4. Watch the visible deployment countdown. No objective input should be accessible until the countdown ends.
5. Type the hacker's highlighted objective phrase. Check the **Current Objective** description and sequence progress. Open **How to Play** during the mission; confirm you can reread both jobs.
6. After the third objective, choose one tactical approach. Watch ECHO execute it before hacking resumes. Finish objective five and review the role-swap explanation.
7. As defender, type the timed hostile phrases while ECHO hacks. Clear the final crisis when it appears. Review the outcome, score and milestones.
8. Try a rematch to verify that progression, role, timing, ready state and reactor heat all reset. Increasing difficulty should change the clock and threat pressure, not the briefing content.

## Solo: murder mystery

1. Choose **The Last Alibi → Try Solo Demo**.
2. Read the hotel murder briefing; identify each person's objective.
3. Watch the evidence board fill as your investigation advances. Its content must persist across the role swap and appear in the final debrief.
4. After the second-phase investigation reaches its final deduction, inspect the suspects and pick someone based on the clues. A wrong guess should cost integrity and briefly prevent re-guessing; it must not permanently halt the mission.
5. Correctly accuse the culprit and finish the final evidence sequence. Repeat with ECHO as the investigator, which should resolve the accusation on its own.

## Field Academy

1. On the home page, scroll to **Field Academy** and choose **Linux Bash**.
2. Read the purpose and explanation beside the faux terminal. Try a wrong command; it should explain the mismatch but keep you on the same step.
3. Enter the shown command exactly and press Enter. It should confirm success, display a clearly labeled **simulated terminal output**, and reveal a **Next Command** button.
4. Before completing the course, open **View Full Guide**; all 14 commands and explanations should become visible.
5. Finish the 14th step. The completion view should include the full manual and be saved to this browser. Reopen the course to confirm its completion marker, then choose Replay.
6. Repeat the key checks with **Windows PowerShell** and **macOS Terminal**. Ensure the UI never attempts to run commands or touches any actual shell.

## Two-person check

1. Create a room on one device and join by code on another. Each should see a different role, appropriate role explanation, and the same story.
2. Start the mission. With only one person ready, **both should remain in briefing** without a ticking timer. Once both are ready, they should see the same deployment countdown.
3. Complete a tactical encounter. The hacker chooses; only the defender receives the countermeasure phrase. The hacker stays blocked until it resolves or fails.
4. Confirm role swap after command five, and that only the defender can clear the final threat.
5. Disconnect a teammate in the middle of play, then reconnect before the 90-second limit. Check that the timer and threat time have not advanced during pause.
6. Use rematch and ensure both players return to the ready flow with fresh stats and objectives.

## Visual and accessibility review

Check mission cards, briefing, countdown, mystery clue board, accusation board, training terminal and results at desktop and narrow mobile widths. Test display preferences (larger type, high contrast, reduced motion), sound mute, keyboard use and screenreader labeling. Many typing tasks are designed for a physical keyboard.

## Automated test commands

```bash
python -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/test_*.mjs
python tests/visual_layout.py
python tests/browser_offline.py
python tests/browser_speed.py
```

The last two commands require Playwright and Chromium. `visual_layout.py` renders five templates at both desktop and mobile widths. `browser_offline.py` runs the application controller and real DOM but mocks its WebSocket transport with actual engine snapshots; it does not verify a browser's connection to the live local server.

For optional end-to-end browser/host networking, start a server and execute:

```bash
PORT=8765 python -m server.app
# Separately:
PANIC_TEST_URL=http://127.0.0.1:8765 python tests/browser_smoke.py
```

Some automated environments prohibit Chromium navigation to localhost; **a blocked browser connection is not a game failure or a passed live-browser test**. The server's live HTTP/WebSocket integration tests do not share that restriction.

## Reporting bugs

Include the version, world, difficulty, solo or co-op, OS/browser, expected behavior, and actual behavior. Useful balance feedback includes whether the briefing is readable and skippable, whether the objectives make narrative sense, whether ECHO is too passive, whether the defender has enough agency, and whether the mystery's evidence supports its solution.

## v0.6 regression focus

1. Academy: On any OS, type a command and press Enter. Verify correct/incorrect colors remain visible, successful submission shows simulated output, then pressing Enter **again** advances to the next step.
2. Academy sidebar: Click a completed command, then an upcoming command. The explanation changes; the active exercise and its partially typed value do not. Finish a course and verify that the same reference remains accessible.
3. Speed Lab: Start a 60-second test and watch the reference text as you type at least five characters. The letters should remain in exactly the same positions. The card changes only after the last word on the card has been entered.
4. Story guide: Start a solo mission. Open **How to Play** and leave it open for 10 seconds. It must not close on incoming updates.
5. Tactical decision: Type three hacker steps. The decision panel must pulse red and say **PICK AN OPTION TO CONTINUE**. Click an option; the pulse must stop, then ECHO should execute the plan.
6. New campaigns: Complete *Dead Air* and *Last Stop* once on Cadet, then replay with alternate tactical choices. Watch scenario pressure, role swap, final incident, and the end-of-mission chronicle.
7. Reduced motion: Turn it on in Settings. All choice prompts must remain clearly marked without pulsing.

### Still not claimed as fully verified

The automated Python WebSocket tests cover two connected clients and all six game worlds. The Chromium frontend tests run production browser modules with injected state snapshots but simulate their socket transport. We have not completed a two-human public-hosted browser playthrough, a full accessibility audit, or extended 24-hour load testing.


## Lyric Lab (v0.18)

1. From homepage open Lyric Lab, verify featured albums show different colors.
2. Start **Original demo** offline, press START, type each word + Space, and check score/streak behavior. Verify incorrect words cannot advance; test Backspace and strict mode.
3. Toggle line loop. The same line should repeat without increasing recorded score. Turn the loop off.
4. With internet, select a featured song. Verify LRCLIB provides synchronized lyrics and YouTube allows iframe playback. If either provider blocks access, verify the visible error; do not assume all videos are embeddable.
5. Adjust lyric offset until the highlighted line follows the performance. Rewind and select a lyric line to seek. Toggle catch-up assist and ensure typing is possible while the player is paused for lag.
6. Search for a song not in the featured list; verify timed practice remains usable without pretending there is a matching YouTube video.
7. Leave to the homepage and verify welcome returns. Re-enter campaign, Speed Lab, and Academy to check they were not modified.
8. Test mobile layout at 390px and desktop at 1440px, especially the YouTube iframe size, typing field, overflow, and focus.
9. For a public release, verify YouTube API policy, video embed restrictions, LRCLIB API terms, and the right to display each song lyric. No guarantee of blanket licensing is made.
