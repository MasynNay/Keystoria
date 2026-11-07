"""Mission-specific language and worldbuilding.

Missions share a tested game engine while changing the fiction, objectives, and
vocabulary. Phrase banks are authored here rather than scattered through UI code.
"""

MISSIONS = {
    "station": {
        "title": "STATION ZERO",
        "subtitle": "The station is falling out of orbit.",
        "location": "ORBITAL RELAY // 07",
        "story": "An unknown fleet has breached the station. Crack the evacuation uplink while your partner holds the corridor.",
        "attack_title": "HACK THE MAINFRAME",
        "defend_title": "HOLD THE CORRIDOR",
        "attack_action": "INJECT COMMAND",
        "defend_action": "NEUTRALIZE THREAT",
        "goal": "Open the escape uplink",
        "threats": ["DRONE", "SENTRY", "INTERCEPTOR", "HUNTER", "WAR MACHINE", "ASSAULT UNIT", "WATCHER"],
        "commands": [
            "override access", "decrypt signal", "reroute power", "unlock airlock",
            "disable firewall", "bypass security", "restore uplink", "purge system",
            "initiate reboot", "authorize escape", "transmit beacon", "open blast doors",
            "enable shields", "release docking clamps", "confirm launch sequence",
            "recover navigation", "sync emergency channel", "expose hidden port",
        ],
        "defense": [
            "target locked", "return fire", "evasive action", "shield burst",
            "disable drone", "clear the deck", "intercept signal", "hold your ground",
            "pulse cannon", "emergency countermeasure", "suppress fire", "jam frequencies",
            "defend the uplink", "power surge", "protect the terminal",
        ],
        "log": [
            "Enemy signatures detected on the lower deck.",
            "A distress call is looping through the station.",
            "Auxiliary power is holding. For now.",
            "Unidentified vessels are closing in.",
        ],
        "beats": {
            (1, 2): "Access tunnels open. Footsteps echo beyond the blast doors.",
            (1, 4): "Uplink found. Emergency power is almost gone.",
            (2, 2): "Escape craft online. The mainframe is fighting back.",
            (2, 5): "Docking clamps releasing. One final command remains.",
        },
        "crisis_name": "REACTOR MELTDOWN",
        "crisis_phrase": "stabilize reactor core",
        "crisis_intro": "REACTOR MELTDOWN. Mainframe locked until your partner stabilizes the core.",
        "switch": "REASSIGNING STATIONS",
        "win": "EXTRACTION SUCCESSFUL",
        "lose": "STATION LOST",
    },
    "hollow": {
        "title": "THE HOLLOW HOUSE",
        "subtitle": "The house knows you're here.",
        "location": "BLACKTHORN ESTATE // 03:13",
        "story": "The doors have sealed. Decipher the hidden ritual while your partner keeps the things in the dark away.",
        "attack_title": "BREAK THE CURSE",
        "defend_title": "BANISH THE SHADOWS",
        "attack_action": "RECITE INCANTATION",
        "defend_action": "WARD OFF ENTITY",
        "goal": "Unseal the front door",
        "threats": ["WHISPER", "SHADOW", "THE WATCHER", "WRAITH", "POLTERGEIST", "APPARITION", "THE HOLLOW ONE"],
        "commands": [
            "light the candles", "turn the key", "break the seal", "read the diary",
            "trace the sigil", "uncover the truth", "name the spirit", "unlock the cellar",
            "follow the footsteps", "break the mirror", "lift the curse", "open the iron gate",
            "speak the old words", "reveal the passage", "restore the circle", "release the trapped soul",
        ],
        "defense": [
            "stay in the light", "do not look back", "close your eyes", "keep the door shut",
            "salt the doorway", "hold the lantern", "banish the shadow", "the mirror lies",
            "do not answer", "hide from the watcher", "light drives it back", "protect the circle",
        ],
        "log": [
            "A door just slammed upstairs.",
            "You can hear footsteps in the empty hallway.",
            "There is breathing on the other side of the wall.",
            "The candles are burning blue.",
        ],
        "beats": {
            (1, 2): "The diary names everyone who vanished here.",
            (1, 4): "The door handle turns from the other side.",
            (2, 2): "The ritual circle begins to fracture.",
            (2, 5): "Daylight leaks through the keyhole. Finish the incantation.",
        },
        "crisis_name": "THE HOLLOW ONE",
        "crisis_phrase": "speak the true name",
        "crisis_intro": "THE HOLLOW ONE HAS ARRIVED. The ritual cannot continue until the entity is banished.",
        "switch": "THE LIGHTS GO OUT",
        "win": "THE CURSE IS BROKEN",
        "lose": "THE HOUSE KEEPS YOU",
    },
    "outbreak": {
        "title": "PATIENT ZERO",
        "subtitle": "Containment has already failed.",
        "location": "QUARANTINE SECTOR // B-12",
        "story": "An infected swarm is overrunning the lab. One of you unlocks the cure; the other guards the barricade.",
        "attack_title": "SYNTHESIZE THE CURE",
        "defend_title": "DEFEND THE BARRICADE",
        "attack_action": "EXECUTE SEQUENCE",
        "defend_action": "STOP THE INFECTED",
        "goal": "Release the antidote",
        "threats": ["RUNNER", "INFECTED", "STALKER", "BRUTE", "HOWLER", "SWARM", "MUTANT"],
        "commands": [
            "isolate sample", "scan pathogen", "unlock cold storage", "sequence the genome",
            "prepare antidote", "sterilize chamber", "analyze infection", "mix neutralizing agent",
            "activate centrifuge", "restore lab power", "release the serum", "enable air filtration",
            "decrypt medical files", "confirm dosage", "initiate dispersal", "seal the quarantine",
        ],
        "defense": [
            "reinforce the door", "hold the line", "close the shutters", "clear the hallway",
            "protect the lab", "fallback position", "seal the breach", "stay together",
            "block the entrance", "cover the stairs", "lock the gate", "check the perimeter",
        ],
        "log": [
            "Contamination readings are rising.",
            "Movement detected in the ventilation shaft.",
            "An emergency broadcast has gone silent.",
            "The quarantine door is taking damage.",
        ],
        "beats": {
            (1, 2): "Sample integrity confirmed. Infection spreads through the vents.",
            (1, 4): "Antibody candidate isolated. Quarantine alarms are escalating.",
            (2, 2): "Air filtration restored. The last dose is nearly ready.",
            (2, 5): "Dispersal system armed. One command to save the sector.",
        },
        "crisis_name": "QUARANTINE COLLAPSE",
        "crisis_phrase": "seal the final bulkhead",
        "crisis_intro": "QUARANTINE COLLAPSE. Research halted until the final bulkhead is sealed.",
        "switch": "BARRICADE BREACHED",
        "win": "ANTIDOTE DEPLOYED",
        "lose": "CONTAINMENT FAILED",
    },
    "casefile": {
        "title": "THE LAST ALIBI",
        "subtitle": "One victim. Four suspects. A disappearing trail.",
        "location": "ASHCROFT HOTEL // 00:47",
        "story": "At 12:47 a.m., conservator Elian Voss is found dead in the locked archive. Security footage is vanishing as a powerful suspect covers their tracks. Rebuild the evidence before the files are destroyed.",
        "attack_title": "RECONSTRUCT THE CASE",
        "defend_title": "PROTECT THE EVIDENCE",
        "attack_action": "EXAMINE RECORD",
        "defend_action": "SECURE THE LEAD",
        "goal": "Identify the killer and preserve proof",
        "threats": ["TAMPER ALERT", "CAMERA WIPE", "FALSE ALIBI", "ACCESS OVERRIDE", "MISSING WITNESS", "FILE PURGE"],
        "commands": [
            "review the security footage", "verify the victim timeline", "inspect the archive lock",
            "cross reference key records", "interview the night porter", "recover deleted messages",
            "examine the antique bell", "compare the fingerprints", "trace the payment records",
            "search the restoration ledger", "reconstruct the final call", "identify the forged signature",
            "preserve the witness statement", "decrypt the archive backup", "expose the hidden alibi",
            "compile the case report", "secure the original evidence", "name the responsible party",
        ],
        "defense": [
            "preserve camera footage", "lock the evidence vault", "protect the witness", "back up the case files",
            "isolate the archive network", "stop the file purge", "verify chain of custody",
            "seal the interview room", "flag a forged timestamp", "secure the phone records",
            "block unauthorized access", "restore the access logs", "halt the shredder", "protect the crime scene",
        ],
        "log": [
            "The corridor camera skips exactly five minutes.",
            "A second key was checked out but never returned.",
            "The curator has requested all records be sealed.",
            "A witness has just changed their statement.",
        ],
        "beats": {
            (1, 2): "The archive door was opened after the victim arrived. Someone had a duplicate key.",
            (1, 4): "A security camera was manually disabled. The timeline doesn't add up.",
            (2, 2): "A restored voicemail mentions a bell, a key, and a painting that never existed.",
            (2, 5): "The final signature matches the curator. Preserve the evidence before it disappears.",
        },
        "discoveries": {
            (1, 1): "ARCHIVE ENTRY: The door opened at 00:18 with a staff master key.",
            (1, 3): "MISSING MINUTES: Five minutes of footage were deleted at 00:22.",
            (1, 5): "KEY LOG: A duplicate was checked out to the curator's office.",
            (2, 2): "VOICEMAIL: Voss says the gallery's centerpiece is a forgery.",
            (2, 4): "PAYMENT LEDGER: A secret transfer links curator Mara Vale to the fake canvas.",
            (2, 5): "FORGED SIGNATURE: The restored ledger bears the curator's unique archival seal.",
            (2, 6): "CASE CLOSED: Mara Vale falsified the records and killed Voss to hide the forgery.",
        },
        "suspects": [
            {"id": "vale", "name": "MARA VALE", "role": "Museum curator", "detail": "Controlled the painting restoration budget."},
            {"id": "pierce", "name": "DANIEL PIERCE", "role": "Night porter", "detail": "Held a temporary service access badge."},
            {"id": "bell", "name": "GRETA BELL", "role": "Hotel director", "detail": "Had a dispute with the victim."},
            {"id": "cross", "name": "JULIAN CROSS", "role": "Private collector", "detail": "Was seen near the archive that evening."},
        ],
        "culprit": "vale",
        "crisis_name": "EVIDENCE PURGE",
        "crisis_phrase": "restore the original archive backup",
        "crisis_intro": "THE EVIDENCE IS BEING ERASED. Your partner must restore the archive backup before the case can proceed.",
        "switch": "YOUR COVER IS BLOWN",
        "win": "THE TRUTH SURVIVES",
        "lose": "THE TRAIL GOES COLD",
    },
}

from .new_missions import EXTRA_MISSIONS, EXTRA_BRIEFINGS
MISSIONS.update(EXTRA_MISSIONS)
from .chapter_missions import CHAPTERS, CHAPTER_BRIEFINGS
MISSIONS.update(CHAPTERS)
from .betrayal_missions import NEW_MISSIONS, NEW_BRIEFINGS
MISSIONS.update(NEW_MISSIONS)

# The opening briefing is narrative content, never a source of executable input.
# Each role has a motivation, a specific job, and an explicit failure condition.
BRIEFINGS = {
    "station": {
        "chapter": "01 / THE LAST TRANSMISSION",
        "opening": "The orbital station is breaking apart. A hostile fleet has cut the escape uplink and boarding drones are forcing their way through the access decks. You have one attempt to launch the rescue beacon before the reactor loses containment.",
        "hacker": "Restore the evacuation uplink by typing the command sequences shown on your terminal. Each success brings the rescue craft closer to launch.",
        "defender": "Intercept incoming drones by typing the countermeasure before its impact timer reaches zero. Each intercepted attack helps vent reactor heat.",
        "stakes": "If integrity reaches zero, reactor heat reaches 100, or the clock expires, everyone is lost.",
        "stageObjectives": ["Find and authenticate the evacuation uplink", "Release the docking clamps and transmit the rescue beacon"],
        "outro": "The rescue beacon pierces the blackout. For the first time in hours, a ship answers.",
    },
    "hollow": {
        "chapter": "01 / THE HOUSE THAT LISTENS",
        "opening": "You and your partner entered Blackthorn Estate searching for a missing family. The door locked itself behind you, and the portraits began to whisper your names. A diary describes a ritual that can break the curse, but every incantation awakens something worse.",
        "hacker": "Reconstruct the ritual by typing the phrases on your terminal. Finish both stages to unlock the estate's front door.",
        "defender": "Keep the spirits away by typing protective wards before the attack timer expires. Each successful ward lowers dread.",
        "stakes": "If integrity collapses, dread reaches 100, or time runs out, the house keeps you.",
        "stageObjectives": ["Find the ritual in the family's diary", "Complete the binding and unseal the front door"],
        "outro": "The house goes quiet. The front door opens to a dawn nobody thought they would see.",
    },
    "outbreak": {
        "chapter": "01 / NO SAFE ROOMS LEFT BEHIND",
        "opening": "The quarantine alarm has been sounding for six hours. You're the last two researchers inside Sector B-12. The infected are at the barricade, but the cold-storage samples contain everything needed to synthesize an antidote.",
        "hacker": "Recover samples and complete the antidote sequence by typing each research prompt. The final stage disperses the cure.",
        "defender": "Hold the barricade by typing countermeasures before threats breach. Successful defenses reinforce the doors.",
        "stakes": "If integrity reaches zero, the barricade falls to zero, or the timer expires, containment is lost.",
        "stageObjectives": ["Recover a viable sample and synthesize the antidote", "Arm the dispersal system and release the cure"],
        "outro": "The antidote moves through the ventilation system. Beyond the glass, the infected begin to fall still.",
    },
    "casefile": {
        "chapter": "CASE 04 / THE LOCKED ARCHIVE",
        "opening": "Ashcroft Hotel, 12:47 a.m. Art conservator Elian Voss has been murdered in the locked archive. Four people had access, and someone is erasing the camera records. You're investigators working against an active cover-up. Find the truth before the trail goes cold.",
        "hacker": "Rebuild the timeline by typing evidence-gathering prompts. Each discovery adds an authentic clue to your caseboard. In the final stage, identify the culprit.",
        "defender": "Preserve logs, witnesses, and physical evidence by typing protection prompts before tampering succeeds. Successful defenses lower suspicion.",
        "stakes": "If integrity runs out, suspicion reaches 100, or the clock expires, the evidence is buried forever.",
        "stageObjectives": ["Establish the timeline and reveal the duplicate master key", "Reconstruct the motive and preserve the final accusation"],
        "outro": "The preserved records expose curator Mara Vale's forgery and the murder she committed to conceal it. The evidence will stand in court.",
    },
}

BRIEFINGS.update(EXTRA_BRIEFINGS)
BRIEFINGS.update(CHAPTER_BRIEFINGS)
BRIEFINGS.update(NEW_BRIEFINGS)


from .legend_missions import LEGEND_MISSIONS, LEGEND_BRIEFINGS
MISSIONS.update(LEGEND_MISSIONS)
BRIEFINGS.update(LEGEND_BRIEFINGS)

for key, briefing in BRIEFINGS.items():
    MISSIONS[key]["briefing"] = briefing

PUBLIC_MISSIONS = {
    key: {k: value[k] for k in (
        "title", "subtitle", "location", "story", "attack_title", "defend_title", "goal", "switch", "win", "lose"
    )}
    for key, value in MISSIONS.items()
}

# Briefings are public; both players need to understand the whole mission.
for key, briefing in BRIEFINGS.items():
    PUBLIC_MISSIONS[key]["briefing"] = briefing

from .frontier_missions import FRONTIER_MISSIONS, FRONTIER_BRIEFINGS
MISSIONS.update(FRONTIER_MISSIONS)
BRIEFINGS.update(FRONTIER_BRIEFINGS)
for key, briefing in FRONTIER_BRIEFINGS.items():
    MISSIONS[key]["briefing"] = briefing
    PUBLIC_MISSIONS[key] = {name: MISSIONS[key][name] for name in ("title", "subtitle", "location", "story", "attack_title", "defend_title", "goal", "switch", "win", "lose")}
    PUBLIC_MISSIONS[key]["briefing"] = briefing
