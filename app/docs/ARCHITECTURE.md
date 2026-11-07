# Architecture & extension guide

## Product boundaries

PANIC PROTOCOL is a single-process real-time game, a separate local command-learning module, and a standalone solo typing test. The two modes deliberately share a visual design but not execution authority: cooperative missions use a server-side room state machine; Academy lessons are offline, declarative educational data with no shell access.

| Layer | Responsibility | Explicitly not responsible for |
| --- | --- | --- |
| `server/new_missions.py`, `server/chapter_missions.py` | Self-contained authored campaign extensions without altering engine logic | Session or network state |
| `server/content.py` | Mission briefings, story beats, objectives, suspect data and clues | Network transport or damage calculations |
| `server/objectives.py` | All authored action explanations and five/six-step mission paths | Networking or UI decisions |
| `server/mechanics.py` | Per-world pressure, warning thresholds and tactical consequences | UI, timers or room ownership |
| `server/field_operations.py` | Authoritative data for 36 field-option consequences and narrative outcomes | Browser rendering and socket handling |
| `server/game.py` | Room lifecycle, phase transitions, roles, timers, command validation, deductions, score | HTML or WebSockets |
| `server/app.py` | HTTP and WebSocket connection/session management, message validation and ticker | Mission rules or rendering |
| `web/app.js` | Browser socket and view flow, event delegation, focus and input | Authoritative game decisions |
| `web/ui/field-controls.js` | Act controls, one-action status, progress history rendering | Game authority |
| `web/ui/scene-vistas.js` | Per-mission animated panoramic foreground, stage-specific actors and atmosphere | Gameplay state mutation |
| `web/ui/mission-icons.js` | Twelve unique motifs in an identical circular badge system | Third-party image dependencies |
| `web/ui/scene-effects.js` | World-specific local SVG effects linked to confirmed choices | Game state mutation |
| `web/ui/cinematic-storyboards.js` | Per-chapter shot lists, matching focus props and dialogue | Mission decisions or timers |
| `web/ui/cinematic-cuts.js` | Reactive animated close-ups and typed-prefix feedback | Mission completion authority |
| `web/ui/story-reel.js` | Read-only navigation through the result screen's narrative frames | Mutating scores or server state |
| `web/ui/views.js` | Lobby, briefing, countdown, missions, debrief and mystery views | Network operations |
| `web/ui/lessons.js` | Curated examples, command matching and local completion markers | Shell execution or filesystem writes |
| `web/ui/command-guides.js` | Educational use cases, benefits, cautions for all 42 course entries | OS execution or privileged operations |
| `web/ui/training-view.js` | Terminal simulation and learning reference UI | Running any OS commands |
| `web/ui/typing-feedback.js` | Pure character-level comparison, highlighting and caret | Key capture or server score |
| `web/ui/speed-engine.js` | Independent word banks, metric scoring and bounded local records | Network access or DOM |
| `web/ui/speed-controller.js` | Solo test lifecycle, single interval timer, focus and cleanup | Story room state |
| `web/ui/speed-flow.js` | Incremental character styling and vertical viewport motion | Remote game state |
| `web/ui/speed-view.js` | Solo practice UI and result display | Timing and score computation |
| `web/styles/typing.css`, `web/styles/speed.css`, `web/styles/v06.css` | Self-contained presentation extensions | Data or behavior |
| `web/ui/lesson-output.js` | Curated simulated results for commands | Invoking the OS shell |
| `web/ui/progression.js` | Bounded recent results and achievements | Cross-user profiles |
| `web/ui/preferences.js` | Local accessibility preferences | Changing server difficulty |

## State machine

```text
Room created / joined
  → lobby
  → briefing        host starts, no mission clock or threats
  → countdown       both operators ready (ECHO auto-ready), synchronized
  → armed           countdown is finished; each human independently presses Play
  → playing / Phase 1
      → optional field intervention   either human chooses once per act
      → tactical choice      hacker chooses, defender executes
      → playing
  → switching       automatic after five hacker objectives
  → playing / Phase 2
      → optional field intervention   either human chooses once per act
      → critical incident    defender resolves
      → (The Last Alibi only) accusation, then final evidence sequence
  → won / lost      case evidence, score and chapter ending
  → rematch         returns to lobby; all round-specific state reset
```

Readiness is set per operator and validated server-side. The monotonic mission clock begins only on entering `playing`. Countdown, story briefing and the manual `armed` launch gate consume no battle time. Both connected humans must press Play; ECHO auto-confirms. If a participant disconnects during play, the mission clock, threat clock, ECHO actions, and transitions pause during the reconnect window.

## Communication & authority

`GET /health` supplies server status. `GET /` serves the static frontend. `/ws` accepts single JSON messages: `create`, `join`, `reconnect`, `set_mission`, `difficulty`, `start`, `ready`, `launch`, `submit`, `tactic`, `accuse`, `ping`, `pulse`, `field_action`, and `rematch`. Responses include session `welcome`, personalized `snapshot`, and `error`.

A field action identifies only a declared option for the current act; time, integrity and hazard changes are applied on the server, and one successful choice per act is recorded in the final debrief. No client-supplied resource numbers are accepted.

Story commands advance through an authored path in `server/objectives.py` (five then six steps), while defensive threats remain randomly selected. Every possible target contains a spoiler-safe explanatory sentence supplied by the server.

A command must provide the current server-issued target ID and correctly normalized phrase. The engine verifies permission, phase, player, timing, and target identity before awarding progress. Duplicate or expired submissions are ignored. Hacker and defender receive individualized targets. `accuse` is accepted only while a deduction is active and only from the investigator; wrong accusations apply penalties and an enforced cooldown. Content and suspects are authored in `content.py`, not supplied by the browser.

The murder mystery deliberately reveals clues as progression occurs. The killer's resolution is withheld from ordinary briefing snapshots and becomes public in the winning debrief. The solo automated player follows the same state machine, including readiness and case deduction, rather than operating a separate game loop.

## Realtime scheduling

An injectable monotonic clock makes countdown, expiry, and reconnection tests deterministic. A shared application ticker runs every 250 ms: live rooms receive state updates, waiting rooms get lower-frequency updates, and completed rooms avoid idle result broadcasts. Important authored story events are stored in a bounded in-memory chronicle and exposed in the result snapshot. In-memory room state has expiration rules; local browser history is capped at 24. Client connection retries back off rather than hammering the server. Audio resources disconnect after playback.

This is a stable basis for local demos and a single-server prototype. It is **not** a distributed or publicly secure architecture. Production hosting should add authentication, robust abuse controls, server metrics, persistent room/user state, reconnection token hygiene, deterministic action idempotence, and real load testing before attempting horizontal scaling.

## Working on the project

1. For a new mission, author narrative, objectives, threats, crisis, briefing and any story clues in `server/content.py`.
2. Define scenario pressure and two tactical choices in `server/mechanics.py`.
3. Extend `server/game.py` only if the new mission needs a *genuinely new* state transition (for example, the deduction in The Last Alibi).
4. Add matching card metadata and CSS tokens in `web/ui/missions.js` and `web/styles.css`.
5. Test both solo and two-person paths, each tactical branch, role swap, failure, expiry, rematch and reconnect. Use representative Chromium visual fixtures for layouts.

A new mission should introduce an actual choice or consequence, not merely change the words typed. The two additional worlds in `server/new_missions.py` illustrate self-contained extensions and the outcome narratives attached to each tactical plan. New educational lessons are declarative data entries under `web/ui/lessons.js`; they should never use `eval`, spawn shells, or depend on unsanitized user input.

## Known limits

The game state is not durable across server restarts; rooms are single-process. Local lesson completion and career progression are not portable across browsers. Estimated WPM includes mission idle time and is not a clinical typing measurement. No complete human-to-human browser session, comprehensive accessibility audit, chaos test, or production load test has been performed. See `PLAYTEST.md` for the release gate.

## Typing feedback and solo mode

Mission commands, threat responses, Academy examples and Speed Lab all use the pure `web/ui/typing-feedback.js` renderer for green/correct, red/incorrect, extra keystrokes and the active caret. Rendering escapes all user characters. The mission input updates this on `input`; server acceptance still requires the current target ID. Academy feedback is advisory and its own command validator remains authoritative for simulated lesson completion.

The Speed Lab has no WebSocket dependency and no new server endpoints. `speed-engine.js` provides deterministic, testable metrics and word generation. `speed-controller.js` owns **one timer per active run**, stopping that interval on restart, completion or exit. The continuous passage mounts one set of character spans per session. Per-key updates alter only character styling; the viewport moves vertically only at line boundaries. There are no word cards or per-character horizontal movement. Scores and a bounded 25-run history live in browser `localStorage`. Timed speed tests are a convenience and portfolio feature, not standardized laboratory metrics; pasted content is blocked for fairer personal comparisons.

On mission phase entry, the browser focuses the typing field and scrolls it into view only once. Snapshot updates do not scroll or steal focus during decisions. Dedicated unit tests validate every mission phrase has an explanation and the visual controller is checked in headless Chromium at desktop and mobile widths.

### Reactive story scenes (v0.7)

`web/ui/mission-scenes.js` contains authored scene narratives and local SVG illustrations. It reads **only confirmed server snapshots** and never mutates mission authority. The mission engine remains responsible for objectives, outcomes, timing and hazards. Scenes can change without adding new network protocol fields.

### Speed Lab viewport (v0.7)

`web/ui/speed-flow.js` mounts the generated passage once per test, then updates existing character CSS classes. The scroll container moves vertically in whole-line increments as the caret approaches the lower edge. No horizontal transforms or per-letter DOM rebuilding are permitted. Lessons and the speed test reset to the top when opened, while story missions intentionally focus and scroll to the active command input.

## v0.13 scene direction and mission identity

- `web/ui/mission-icons.js` defines twelve hand-authored vector marks. Selection cards and lobbies share one exported helper; they do not duplicate SVG geometry.
- `web/ui/scene-director.js` is purely presentational. Its twelve independent renderers are keyed by the same mission ID and confirmed objective index as the existing storyboard. It adds moving physical actors and contextual danger cues inside the existing scene window and result reel. It **does not** mutate game state, change timers, or submit commands.
- `web/styles/v013.css` owns animation keyframes and responsive icon positioning. Reduced-motion preferences override all new motion. The server still owns every score, deadline, target, phase transition, and ending.
- `web/ui/deployment.js` describes the text and number for each moment of the ten-second countdown; `server/game.py` is the authoritative clock. The countdown is held only after the explicit Ready check, and no threat or bot action begins early.
- `tests/test_v013.mjs` verifies icon uniqueness, all twelve story directors, danger differences, immutability of server-provided snapshots, and the ten-to-one countdown. `tests/browser_v013.py` checks rendered application templates from deterministic engine snapshots without simulating an unverified live transport.

## v0.17: eighteen mission story architecture

- `server/legend_missions.py` declares six original chapters and builds their objectives, two-role briefings, defenses, hazards, critical incidents, choices, and field interventions. Server imports register these chapters before exporting public mission metadata. No game engine branch is hardcoded per new title.
- `web/ui/scene-legends.js` renders six distinct illustrated environments. `scene-illustrations.js` composes that art with the original stage-locked storyboard renderer; new story arcs and dialogue are declared in `scene-narratives.js` and `cinematic-storyboards.js`.
- `scene-action-stage.js` chooses physical action visuals from the **actual target phrase**, then uses the command's storyboard focal prop as fallback; it renders differentiable actions for evidence, decoding, mapping, access, life support, mythical machinery, creatures, elemental wards, and portal gates. `cinematic-cuts.js` implements correct-prefix-driven character-by-character decoding for story-relevant messages.
- `mission-scenes.js` re-renders on target changes, even when the mission index remains stable for the Defender, and avoids popup narrative cards over the camera. Storyline dialogue always corresponds to a role and current target. Presentation remains read-only.
- `web/styles/v017.css` introduces world motion and the Mirrorfall gravity reversal entirely inside the story clip. `prefers-reduced-motion` and in-app reduced-motion settings disable the animated transition without hiding the information.
- `tests/test_legend_missions.py`, `tests/test_v017.mjs`, and `tests/browser_v017.py` validate authored world structure, role context, art/decode behavior, and responsive screenshot geometry. The original completion tests iterate the full dictionary of eighteen missions for game-engine victory/loss/replay coverage.
- [Story audit](STORY_AUDIT.md) documents causal milestone ordering, plot continuity repairs and the limitations of automated vs human narrative quality assessment.
