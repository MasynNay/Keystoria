# PANIC PROTOCOL — Twenty-four-chapter continuity & role audit (v0.22)

This is the current authoring/QA record, **not** a claim that outside players
have approved each story. Every chapter has five Hacker objectives in Act I,
six in Act II, a role swap, random threat responses, one shared tactical order,
a critical incident, optional field decisions, and an ending. The human or
ECHO may be Hacker in either act. Defender actions protect the same scenario
but do not masquerade as completing the Hacker objective.

## Story contract

1. Beat **0** shows the problem at mission start; beat **N** (1–11) is the
   aftermath of Hacker objective **N**. No rescue, reveal, or victory is
   described as completed before that corresponding command succeeds.
2. The dialogue above the scene describes the **next** action. Defender
   dialogue instead explains the current live countermeasure, so it doesn't
   present a different person's hacking task as the Defender's own action.
3. Visuals use the server's confirmed mission step for scene selection and
   the locally correct typed prefix for **cosmetic** animation. An incorrect
   character cannot advance a physical actuator or earn game progress.
4. The final beat names the concrete result. Failure states and no-time-left
   outcomes are supplied by the authoritative server, not the scene renderer.
5. Scene changes never scroll away the typing console or show popup word cards.
   Cinematic dialogue and live progress remain in the reserved cockpit panes.

## Mission-by-mission throughline

| Mission | Hacker's causal arc | Defender's distinct job | Verified final action / outcome |
|---|---|---|---|
| Station Zero | Access → decrypt distress → restore station power/uplink/shields → navigation, airlock, clamps, departure | Stop drones, hostile transmissions and reactor attacks | Confirm launch; rescue craft leaves the station |
| Hollow House | Illuminate the manor → identify ghost and ritual → descend, free soul, lift curse | Keep spirits outside the wards and protect the ritual | Open iron gate; investigators can escape |
| Patient Zero | Identify pathogen → devise antidote → restore laboratory, blend and verify dose | Reinforce quarantine doors, contain attacks, preserve sample | Initiate dispersal; treatment reaches the wards |
| The Last Alibi | Assemble security/key/financial/telephone clues → identify forged signature and preserve evidence | Stop deletion, intimidation, tampering and evidence loss | Secure originals; perpetrator is identified through case evidence |
| Dead Air | Repair transmitter and backup batteries → map flooded streets → authorize warning → verify route and broadcast | Stop jammers and spoofed evacuation orders | Broadcast verified evacuation route; rooftop residents hear it |
| Last Stop | Diagnose fake brake link → regain manual control → coordinate with passengers → cut throttle and brake | Block malicious commands while dispatch keeps the track clear | Bring Train 718 to a stop before broken bridge |
| Abyss Nine | Sonar/crew contact → tether → ballast/winch/pressure/ascent | Protect hull, tether, ballast and rescue vessel during climb | Surface with all three researchers |
| Neon Heist | Enter archive → retrieve contamination proof → decrypt/copy records → upload to reporters | Defend stealth, data integrity and anti-trace countermeasures | Publish independently verified evidence |
| Red Horizon | Recover habitat oxygen/heat/solar coordinates → repair power and guide shuttle | Maintain environmental seals, air, electronics and storm defenses | Final landing signal; shuttle arrives for six survivors |
| Whiteout | Restore heat/radar → verify false rescue route → expose director's cargo betrayal → contact genuine crew | Hold the shelter's doors, heat, signals and beacon against storm/forgeries | Evacuate seven researchers by helicopter |
| Ashfall | Track three buses → discover official route is false → expose dispatch order → open bypass and escort convoy | Protect buses, block road hazards and preserve communications | All three buses enter the safe valley |
| Carnival 13 | Locate eighteen riders → find missing generator → reveal manager's theft → control and brake wheel | Protect brakes, lighting, platform and cabin safety | Lower final family; all eighteen riders safe |
| Mirrorfall | Locate missing street → decode school distress → cross inverted town → discover director's prison and return families | Neutralize gravity surges, false voices and unstable portals | Seal breach after last family crosses to ordinary Larkspur |
| Four Winds | Restore aqueduct/stone/air/fire wards → expose weatherkeeper's engineered drought | Shield civilians on skybridges against elemental hazards | Reunite guardians and release the rain |
| Dawnforge | Translate false prophecy → open temple → reveal oracle deception → restore the imprisoned sun | Stop stone guardians, molten channels and shadow attacks | Release sunlight across the valley |
| The Glass Trials | Trace sponsor broadcast → expose producer's lethal arena rigging → unlock contestant exits and broadcast proof | Disable deadly floor traps and false eliminations while contestants escape | End manipulated broadcast after 12 finalists exit |
| Wildbond | Follow creature tracks → heal skyfox → expose ranger's stolen seeds → free guardians, replant heart tree | Stop snares, collectors and collapsing canopy hazards | Awaken forest guardian, restoring ecosystem |
| The Last Stardoor | Recover realm keys → uncover monarch and friend Bram's memory bargain → release stolen memories and reconnect six worlds | Hold portal structures and shield travelers from sentinels | Close final dark door after inhabitants return |
| Clockfall | Trace reset beacon → recover test evidence → evacuate trapped trams → restore uninterrupted time | Anchor clocks, protect memories, and stop phantom trains during evacuation | Restart Meridian's clock once the last tram safely leaves the loop |
| The Dream Market | Discover stolen names → open vault → return dreams → silence midnight bell | Protect sleepwalkers, ledger, lamps and bridge as the children awaken | Close the market only after all children return home |
| Emberwing Refuge | Track stolen hatchlings → expose forged capture orders → reopen sanctuary and free hatchlings | Defend nesting bridges, breathing channels and wounded dragons | Hatchlings safely returned to repaired mountain roosts |
| The Drowned Archive | Reach flooded archive → protect librarians → recover suppressed records → surface with proof | Hold pressure seals and communication links against decompression | Rescue librarians and preserve the unaltered historical record |
| Aurora Arc | Restore habitat systems → learn aurora is alive → expose extraction orders → release it safely | Shield orbital habitats, magnetic bridges and supply ships | Free living aurora without losing the colony or its power grid |
| Inkbound Kingdom | Recover erased names → expose forged decree → restore citizens and true ending | Block erasing ink and preserve living manuscript through page collapse | All rescued citizens reclaim their stories after escaping blank chapter |

## Corrections in the v0.17 review

- Station Zero: evacuation, clamps and beacon cannot be shown as completed
  before their authored objective.
- Patient Zero: the final beat now reports actual **dispersal**, rather than
  another instruction to release the antidote.
- The Last Alibi: the final beat confirms the original evidence is **secured**.
- Dead Air: the last visual now shows the city **receiving** the route, instead
  of prompting to transmit an already completed broadcast.
- Last Stop: final scene explicitly depicts the train **stopped**.
- Neon Heist: corrected a misplaced mention of a *carnival* in the city reveal.
- Whiteout: aligned the closing evacuation vehicle with the helicopter plot.
- Ashfall: all three buses remain accounted for; the next-action dialogue does
  not claim the forgery was withdrawn before the evidence is revealed.
- Carnival 13: clarified multi-cabin evacuation and moved “all riders safe”
  dialogue to after the final cabin descends.
- Mirrorfall: the school bus's survivors are not declared safe before found;
  collapsing the false city does not trap the last family in the return lift.
- Dawnforge / Last Stardoor: betrayal clues and resolutions appear only after
  relevant objectives, rather than leaking a completed pact too soon.
- All 24 stories: gameplay's foreground command actuator now selects visible
  environmental equipment from the **literal active target**, not generic
  character art attached to an unrelated storyboard focus.

## Verification and remaining risks

Automated completion exercises the twenty-four stories in Solo and Duo, all three
presets, both tactical approaches, rematches and failure outcomes; WebSocket
integration separately verifies two humans receive synchronized state and the
manual Play gate. Browser fixtures use game-engine-generated snapshots, and
also project known later story steps for camera-only tests. This is **not**
proof of professional narrative editing, independent user comprehension,
frame-by-frame animation polish, production load behavior, or a two-device
human playthrough. The illustrations remain layered SVG/CSS rather than
prerendered AAA-quality character animation.
