# Mission completion verification (v0.17)

This is a reproducible release gate for gameplay completion, not a claim that every possible play style guarantees a win. Timers, incorrect inputs and world hazards are intentionally capable of causing losses.

## Coverage matrix

| Operation | Solo / ECHO | Two humans | Cadet | Standard | Overdrive | Both tactics | Role swap & climax | Rematch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Station Zero | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| The Hollow House | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Patient Zero | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| The Last Alibi | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Dead Air | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Last Stop | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Abyss Nine | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Neon Heist | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Red Horizon | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Whiteout | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Ashfall | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Carnival 13 | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Mirrorfall | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Four Winds | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Dawnforge | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| The Glass Trials | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Wildbond | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| The Last Stardoor | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |

**216 win paths:** 18 missions × 3 difficulty presets × 2 player modes × 2 tactical plans. Each route must use the mission's legal action API, survive the actual timed bot ticker in solo mode, reach the tactical fork, swap roles, clear the crisis, and finish at `phase='won'` with 11/11 objectives and an explicit reason. The murder mystery also requires the correct deduction. The human operator responds at a modest scripted rate instead of using instantaneous stage skips.

**72 additional intervention win paths:** Eighteen worlds × solo/duo × either intervention option. Each path uses the real two-act engine and requires both field actions to be applied, followed by successful tactical resolution, role reversal and a final result. The 72 individual options are separately asserted for exact resource changes, duplicate rejection, and server-owned balancing.

**36 rematch paths:** 18 missions × 2 modes. Every winner must be able to preserve the room and player identities, reset state, launch again, and reach a second win.

**36 loss paths:** 18 missions × 2 modes. Running the clock out must set `phase='lost'`, `finalGrade='F'`, and a visible explanation for both viewers. The room must remain reusable afterward.

**Field-operation network test:** Two real WebSockets observe one shared field decision and verify the duplicate request is denied.

**2 network delivery tests:** A timer-driven defeat is broadcast to both independent WebSocket clients, and a ticker-driven solo AI victory is broadcast to the human client. These target the v0.7 bug where the server stopped broadcasting once a mission phase changed to `won` or `lost` inside the ticker.

**Browser-facing checks:** Offline Chromium layout checks render all eighteen missions from actual game-engine snapshots at desktop size and sample mobile resolutions. The Mirrorfall scene rotates at the crossing and returns before the ending; the keyboard and HUD do not rotate. End-game delivery and completion outcomes have separate engine/WebSocket tests.

## Repeat locally

```bash
python -m unittest discover -s tests -v
node --test tests/test_*.mjs
PYTHONPATH=. CHROMIUM_PATH=/usr/bin/chromium python tests/browser_v017.py  # optional Chromium/Playwright
```

For a simpler command, `make test` runs Python and Node regression tests (it does not install Chromium).

## Remaining release gates

A successful automated route establishes **reachability**, not guaranteed ease. Solo and duo pacing, network interruptions between physical computers, difficulty fairness, cross-browser support, actual motivation and enjoyment still need human verification. Persistent multiplayer state is in-memory and is not designed for multi-worker deployment. Do not claim production service durability or commercial-ready multiplayer based only on this matrix.
