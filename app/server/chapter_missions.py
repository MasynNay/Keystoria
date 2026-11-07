"""Three self-contained, fictional chapters added to the cooperative campaign.

Only authored story data and balance values belong here. The same server-owned
state machine governs these chapters and all existing missions.
"""

CHAPTERS = {
    "abyss": {
        "title": "ABYSS NINE", "subtitle": "The ocean wants the crew back.",
        "location": "TRENCH STATION // 3,400 METERS BELOW SEA LEVEL",
        "story": "The research submersible Pelican Nine has lost propulsion below a collapsing deep-sea platform. Find its crew and raise it before the hull fails.",
        "attack_title": "RESCUE THE SUBMERSIBLE", "defend_title": "HOLD THE HULL",
        "attack_action": "EXECUTE RESCUE", "defend_action": "STABILIZE PRESSURE",
        "goal": "Bring Pelican Nine and its crew to the surface",
        "threats": ["PRESSURE SPIKE", "HULL FRACTURE", "CABLE SNAP", "SONAR GHOST", "BALLAST FAILURE", "DEPTH ALARM", "ROGUE CURRENT"],
        "commands": [],
        "defense": ["brace the pressure hatch", "isolate the leaking valve", "stabilize the ballast tanks", "repair the sonar relay", "seal the crew compartment", "reinforce the tether cable", "counter the trench current", "close the intake vents", "protect the oxygen manifold", "restore the emergency lights", "clear the flooding alarm", "hold the ascent line"],
        "log": ["A child's recording is still playing over the distress channel.", "The tether is straining against the trench wall.", "Sonar shows a new crack along the laboratory platform."],
        "beats": {(1, 2): "The oxygen beacon blinks. Pelican Nine has three survivors on board.", (1, 4): "The cabin lights flicker inside the submarine. Its crew can see your rescue light.", (2, 2): "The tether takes the strain and the sub lifts free of the seabed.", (2, 5): "Sunlight appears through the upper water. The hull needs one last ascent command."},
        "crisis_name": "CATASTROPHIC LEAK", "crisis_phrase": "seal the emergency bulkhead", "crisis_intro": "A bulkhead cracks under pressure. The ascent is locked until your partner seals the leak.",
        "switch": "THE RESCUE CABLE SNAPS", "win": "PELICAN NINE RESCUED", "lose": "THE TRENCH CLAIMS THE CREW",
    },
    "neon": {
        "title": "NEON HEIST", "subtitle": "The truth is behind the laser grid.",
        "location": "THE AURORA ARCHIVE // 02:17",
        "story": "A corrupt corporation has stolen the only proof of a city's poisoned water supply. Infiltrate its midnight archive, retrieve the files, and transmit them before the security grid seals.",
        "attack_title": "RECOVER THE ARCHIVE", "defend_title": "DISARM THE SECURITY GRID",
        "attack_action": "EXECUTE INFILTRATION", "defend_action": "DEFUSE ALARM",
        "goal": "Release the evidence to the public",
        "threats": ["LASER SWEEP", "CAMERA TRACK", "ALARM TRIP", "SECURITY DRONE", "LOCKDOWN", "PATROL BOT", "TRACE ROUTINE"],
        "commands": [],
        "defense": ["spoof the camera loop", "disable the laser emitter", "jam the security drone", "mask the infrared trail", "reroute the guard patrol", "isolate the alarm panel", "hide the access signature", "secure the service elevator", "block the trace routine", "unlock the escape ladder", "silence the motion sensor", "shield the data transfer"],
        "log": ["The security director is arriving early.", "A maintenance robot stops outside the archive.", "A red beam sweeps across the empty gallery."],
        "beats": {(1, 2): "A camera freezes on an empty hallway. You're invisible—for now.", (1, 4): "The archive vault door opens onto rows of evidence drives.", (2, 2): "The stolen water reports are real. Someone tried to erase the contamination warnings.", (2, 5): "The public uplink is live. Every second keeps the truth within reach."},
        "crisis_name": "VAULT LOCKDOWN", "crisis_phrase": "disable the vault laser array", "crisis_intro": "The archive is sealing itself. The data transfer is suspended until the laser grid is disabled.",
        "switch": "THE SECURITY GRID ACTIVATES", "win": "THE TRUTH GOES PUBLIC", "lose": "THE ARCHIVE IS SEALED",
    },
    "red_horizon": {
        "title": "RED HORIZON", "subtitle": "One habitat. One impossible storm.",
        "location": "ARES COLONY // MARS SOL 209",
        "story": "A global dust storm has buried the Mars colony's solar array. Six settlers are running out of oxygen. Restore their greenhouse and transmit an emergency orbit rendezvous.",
        "attack_title": "RESTORE THE HABITAT", "defend_title": "PROTECT LIFE SUPPORT",
        "attack_action": "RUN HABITAT SEQUENCE", "defend_action": "CONTROL THE STORM",
        "goal": "Save all six settlers and call the orbital rescue ship",
        "threats": ["OXYGEN LEAK", "DUST SURGE", "PRESSURE LOSS", "POWER DROP", "SOLAR FAILURE", "AIRLOCK JAM", "SEAL WARNING"],
        "commands": [],
        "defense": ["seal the outer airlock", "clear the intake filters", "protect the solar cabling", "brace the habitat window", "restart the oxygen pump", "stabilize the greenhouse dome", "isolate the pressure leak", "shield the comms antenna", "remove dust from panels", "activate reserve heating", "close the storm shutters", "secure the landing beacon"],
        "log": ["A botanist reports the seedlings are dying.", "Dust is hammering the colony windows.", "Mission control cannot hear the habitat's emergency signal."],
        "beats": {(1, 2): "The oxygen pump coughs back to life. Six life signs return to the screen.", (1, 4): "A single green leaf unfolds beneath the warming lamps.", (2, 2): "The colony lights come back on across the red desert.", (2, 5): "A ship appears above the storm. Only the final docking signal remains."},
        "crisis_name": "HABITAT DEPRESSURIZATION", "crisis_phrase": "lock the pressure compartment", "crisis_intro": "A pressure seal fails. Your partner must stabilize the habitat before the rescue signal can be transmitted.",
        "switch": "THE GREENHOUSE ROOF FRACTURES", "win": "COLONY SURVIVORS EXTRACTED", "lose": "ARES COLONY FALLS SILENT",
    },
}

CHAPTER_PATHS = {
    "abyss": (("locate the distress beacon", "decode the sonar return", "restore the floodlights", "identify the trapped crew", "deploy the rescue tether"),
              ("release the ballast locks", "power the ascent winch", "stabilize the cabin pressure", "clear the ascent corridor", "raise the rescue submersible", "surface with the survivors")),
    "neon": (("survey the camera network", "loop the west corridor feed", "open the maintenance hatch", "bypass the archive lock", "identify the evidence drive"),
             ("decrypt the contamination records", "copy the original reports", "open the rooftop uplink", "route the files to the press", "erase the pursuit trace", "publish the evidence archive")),
    "red_horizon": (("inspect the oxygen monitors", "restart the habitat pumps", "locate the buried solar array", "restore the greenhouse heaters", "recover the rescue coordinates"),
                    ("unseal the battery reserve", "reconnect the solar grid", "stabilize the air recycler", "guide the rescue shuttle", "align the docking antenna", "transmit the final landing signal")),
}

CHAPTER_BRIEFINGS = {
    "abyss": {"chapter":"CHAPTER 07 / ECHOES FROM BELOW", "opening":"At 03:44 the ocean-floor platform went dark. Three researchers in Pelican Nine survived, but the sub is trapped in a collapsed trench. A strange tapping is coming through the sonar. You have one rescue tether and only minutes before the pressure breaks the hull.", "hacker":"You are the rescue controller. Locate Pelican Nine, connect the cable, release its ballast and guide the survivors to the surface.", "defender":"You are the hull engineer. Type each urgent countermeasure before its impact timer expires. Every successful defense protects the submarine's remaining structure.", "stakes":"If hull stress reaches 100, integrity fails, or the clock expires, the trapped crew is lost.", "stageObjectives":["Find the crew and attach a functioning rescue tether", "Lift Pelican Nine through the collapsing trench and surface alive"], "outro":"At last, Pelican Nine breaks the surface at dawn. The three survivors emerge into the rescue vessel's lights, blinking in the first sunlight they have seen in days."},
    "neon": {"chapter":"08 / THE FILE THAT CHANGES EVERYTHING", "opening":"The city believes its water is safe. You know the opposite: Aurora Industries is hiding reports of deadly contamination. Tonight a whistleblower sends you a key to the corporate archive. Infiltrate its vault and make the original reports impossible to bury.", "hacker":"You are the infiltration specialist. Follow the trail from the service entrance to the evidence drive, then transmit authenticated files to independent journalists.", "defender":"You are the systems operator. Block security sweeps, drones and trace attempts before they identify your team.", "stakes":"If security alert reaches 100, integrity fails, or the clock runs out, the evidence is locked away.", "stageObjectives":["Enter the archive without triggering the security shutdown", "Recover proof of contamination and make it public"], "outro":"The upload completes. Hundreds of phones light up as the documents reach reporters. Outside, the city wakes up to the truth."},
    "red_horizon": {"chapter":"CHAPTER 09 / THE LAST GREEN LEAF", "opening":"Mars, Sol 209. A dust storm has blocked every solar panel at Ares Colony. Six settlers have sealed themselves inside the greenhouse, where oxygen is dropping and the last plants are dying. A rescue shuttle waits above the clouds, unable to land without a beacon.", "hacker":"You are the habitat engineer. Restore power, revive the greenhouse, and guide the orbital rescue shuttle to a safe approach.", "defender":"You are the life-support operator. Keep seals, filters and oxygen lines intact while the storm batters the colony.", "stakes":"If oxygen debt reaches 100, integrity fails, or the clock expires, the colony falls silent.", "stageObjectives":["Restore breathing air and recover coordinates for orbital help", "Bring power online and guide the shuttle through the storm"], "outro":"At long last, the shuttle's lights cut through the red cloud. All six settlers climb aboard. Below them, one greenhouse lamp remains glowing in the storm."},
}

CHAPTER_DESCRIPTIONS = {
    "abyss": {
        "locate the distress beacon":"Find the submersible's emergency pulse in the sonar noise so rescue crews know where to send the cable.",
        "decode the sonar return":"Read the reflected sonar pattern to locate obstacles and confirm the crew is trapped but alive.",
        "restore the floodlights":"Illuminate the collapsed platform so the rescue tether can reach the hull safely.",
        "identify the trapped crew":"Confirm each survivor's life sign, helping rescue crews prioritize the cabin containing people.",
        "deploy the rescue tether":"Lower the heavy rescue cable and anchor it to Pelican Nine so it can be lifted from the trench.",
        "release the ballast locks":"Free the jammed ballast controls so the submarine becomes light enough to raise.",
        "power the ascent winch":"Activate the winch that pulls the rescue tether toward the surface.",
        "stabilize the cabin pressure":"Equalize pressure in the occupied cabin to prevent the hull from failing during ascent.",
        "clear the ascent corridor":"Check the path above Pelican Nine so its tether does not strike collapsing debris.",
        "raise the rescue submersible":"Lift the vessel out of the trench and bring the survivors toward safety.",
        "surface with the survivors":"Bring the rescue submarine through the final meters of water and hand the crew to the recovery ship.",
    },
    "neon": {
        "survey the camera network":"Reveal which security cameras protect the archive and locate a route with fewer patrols.",
        "loop the west corridor feed":"Replay an empty hall to hide your approach from the security operations team.",
        "open the maintenance hatch":"Enter the building through the service shaft instead of its watched front entrance.",
        "bypass the archive lock":"Open the vault without triggering its automatic emergency closure.",
        "identify the evidence drive":"Find the untouched reports proving the company concealed water contamination.",
        "decrypt the contamination records":"Unlock the whistleblower's evidence so the original measurements can be independently reviewed.",
        "copy the original reports":"Preserve exact copies of the measurements so deleting the archive cannot erase the truth.",
        "open the rooftop uplink":"Establish a transmission point outside the company's controlled network.",
        "route the files to the press":"Send the evidence directly to journalists who can verify and publish it.",
        "erase the pursuit trace":"Remove the archive's active tracking marker from the outbound transmission.",
        "publish the evidence archive":"Complete the authenticated public release so the city knows its water is unsafe.",
    },
    "red_horizon": {
        "inspect the oxygen monitors":"Measure the habitat's remaining breathable air so you know how quickly the six settlers must be rescued.",
        "restart the habitat pumps":"Bring the oxygen circulation system back online to keep survivors conscious.",
        "locate the buried solar array":"Find the storm-covered panels needed to restore sustainable power to the colony.",
        "restore the greenhouse heaters":"Warm the plants and settlers so the greenhouse can survive the Martian night.",
        "recover the rescue coordinates":"Retrieve the landing site data the orbiting shuttle needs to find the colony through dust.",
        "unseal the battery reserve":"Open the emergency battery bank to power the colony while the main solar grid recovers.",
        "reconnect the solar grid":"Restore electricity from the cleared panels to critical life-support systems.",
        "stabilize the air recycler":"Clean the habitat air and keep oxygen levels safe until help arrives.",
        "guide the rescue shuttle":"Transmit safe approach corrections so the shuttle avoids dangerous terrain.",
        "align the docking antenna":"Aim the radio guidance array at the rescue ship through the moving dust storm.",
        "transmit the final landing signal":"Send the verified beacon that allows the shuttle to land and evacuate all six settlers.",
    },
}

# Defensive tasks have their own concrete stakes, just like the 99 story beats.
# An operator should understand the machinery or person being protected, not
# merely be told to repeat the phrase shown on the keyboard.
DEFENSE_EXPLANATIONS = {
    "abyss": (
        "Support the weakened hatch against ocean pressure so it cannot burst into the occupied cabin.",
        "Cut off the damaged water line before flooding reaches the research crew.",
        "Balance the submarine's tanks to prevent a sudden uncontrolled dive.",
        "Recover the lost sonar readings so the rescue crew can navigate around falling debris.",
        "Keep the survivors' chamber dry while the external pressure continues rising.",
        "Reinforce the only cable capable of lifting Pelican Nine off the ocean floor.",
        "Adjust the stabilizers against the trench current before the sub strikes the canyon wall.",
        "Shut the flooded intake ducts to protect the life support machinery.",
        "Keep oxygen flowing to all three survivors while the rescue tether is being attached.",
        "Bring back the cabin's emergency lights so trapped researchers can see the escape hatch.",
        "Reset the flood warning only after isolating the dangerous leak; keep the bridge alarms reliable.",
        "Hold the extraction line under tension so the rising sub cannot slide back toward the trench.",
    ),
    "neon": (
        "Feed harmless hallway footage to security so the team is not identified entering the archive.",
        "Shut down the active laser beam before an approaching teammate crosses its path.",
        "Break the patrol drone's lock on the intruders before it can summon armed security.",
        "Conceal the heat trail that infrared scanners use to track your escape route.",
        "Send the patrol away from the service corridor while the team reaches the evidence vault.",
        "Disconnect the local alarm circuit without triggering the tower-wide lockdown.",
        "Hide the team's entry record so security cannot identify which vault door was opened.",
        "Keep the service lift from being locked between floors with the evidence still inside.",
        "Interrupt the tracking software before it pinpoints the public evidence upload.",
        "Open the emergency ladder so your team has a real way out when the alarm sounds.",
        "Disable the motion detector that would expose the team in the darkened gallery.",
        "Protect the outgoing document packets so the original contamination report arrives intact.",
    ),
    "red_horizon": (
        "Close the outer airlock before the Martian storm pulls breathable air from the habitat.",
        "Remove dust from the oxygen intake so the six settlers can keep breathing.",
        "Protect the exposed power cables so the repaired solar array can reach life support.",
        "Reinforce the cracked observation window before pressure tears it from the colony wall.",
        "Restart the stalled air pump before carbon dioxide builds up in the occupied greenhouse.",
        "Support the damaged dome so its last living plants and the settlers remain sheltered.",
        "Close the breached pressure circuit and stop precious air escaping into the storm.",
        "Shield the exposed communications dish so the rescue shuttle can still receive coordinates.",
        "Clear the solar cells so they begin supplying the heat and electricity the habitat needs.",
        "Activate the last backup heater to keep the settlers from freezing through the night.",
        "Close the shutters against flying rock and grit that could punch through the habitat shell.",
        "Keep the landing beacon powered and visible so the shuttle can find the colony through dust.",
    ),
}

for key, chapter in CHAPTERS.items():
    chapter["commands"] = [phrase for act in CHAPTER_PATHS[key] for phrase in act]
    # Positional pairing keeps the complete defense deck independently shuffled
    # without losing the description for any phrase.
    for phrase, explanation in zip(chapter["defense"], DEFENSE_EXPLANATIONS[key]):
        CHAPTER_DESCRIPTIONS[key][phrase] = explanation
    CHAPTER_DESCRIPTIONS[key][chapter["crisis_phrase"]] = (
        f"The {chapter['crisis_name'].lower()} prevents your teammate from completing the rescue. "
        f"Clear this immediate danger so the final mission objective can proceed."
    )

CHAPTER_RULES = {
    "abyss": {"meter":"HULL STRESS", "direction":"high", "initial":22, "hack":6, "defend":-13, "breach":19, "pulse":-13, "warning":66, "warning_text":"HULL CRACKS / PRESSURE RISING", "failure":"The deep-sea hull failed under pressure.", "intro":"Every rescue command strains the damaged hull. Defensive engineering keeps the crew alive.", "encounter":"THE TETHER DECISION", "encounter_intro":"The rescue cable is overloading. Choose a recovery plan for the hull engineer.", "choices":{
        "slack":{"label":"RELEASE CABLE SLACK", "description":"Reduce hull stress and lose 10 seconds.", "phrase":"release the tension winch", "effects":{"meter":-40,"seconds":-10}, "outcome":"The tether relaxes. Pelican Nine stops groaning against the sea floor."},
        "brace":{"label":"BRACE THE HULL", "description":"Reduce stress and restore integrity; costs 13 seconds.", "phrase":"brace the forward pressure ring", "effects":{"meter":-24,"integrity":12,"seconds":-13}, "outcome":"Supports lock around the forward hatch and the metal finally holds."},
    }},
    "neon": {"meter":"SECURITY ALERT", "direction":"high", "initial":14, "hack":7, "defend":-12, "breach":19, "pulse":-13, "warning":66, "warning_text":"ARCHIVE LOCKDOWN IS NEAR", "failure":"Security sealed the evidence archive.", "intro":"Each intrusion raises security alert. Your defender can disguise the team before the next sweep.", "encounter":"THE LASER CORRIDOR", "encounter_intro":"The evidence drive is across an active laser corridor. Choose how to cross it.", "choices":{
        "mirror":{"label":"REFLECT THE LASER GRID", "description":"Lower alert quickly; costs 11 seconds.", "phrase":"redirect the laser sensors", "effects":{"meter":-43,"seconds":-11}, "outcome":"The laser grid projects an empty corridor while your team crosses unseen."},
        "spoof":{"label":"SPOOF THE GUARD BADGES", "description":"Lower alert and restore integrity; costs 15 seconds.", "phrase":"clone the maintenance credentials", "effects":{"meter":-27,"integrity":13,"seconds":-15}, "outcome":"The archive recognizes your team as maintenance and unlocks the route."},
    }},
    "red_horizon": {"meter":"OXYGEN DEBT", "direction":"high", "initial":20, "hack":6, "defend":-12, "breach":21, "pulse":-14, "warning":65, "warning_text":"OXYGEN CRITICAL / SIX LIVES AT RISK", "failure":"The Mars habitat exhausted its breathable air.", "intro":"Every repair uses more air and power. Your defender keeps the habitat sealed.", "encounter":"THE GREENHOUSE LEAK", "encounter_intro":"The greenhouse's transparent dome is leaking. Choose how to restore breathable air.", "choices":{
        "seal":{"label":"SEAL THE GLASS DOME", "description":"Reduce oxygen debt rapidly; costs 10 seconds.", "phrase":"patch the greenhouse panels", "effects":{"meter":-44,"seconds":-10}, "outcome":"A sealant web closes the fractures. The colony can breathe again."},
        "purge":{"label":"PURGE THE DUST FILTERS", "description":"Reduce oxygen debt and restore integrity; costs 14 seconds.", "phrase":"flush the emergency air filters", "effects":{"meter":-26,"integrity":14,"seconds":-14}, "outcome":"Dust clears from the intake and fresh air reaches the six survivors."},
    }},
}

for mission, rule in CHAPTER_RULES.items():
    for choice in rule["choices"].values():
        CHAPTER_DESCRIPTIONS[mission][choice["phrase"]] = choice["description"] + " " + choice["outcome"]

CHAPTER_FIELDS = {
    "abyss": (
        {"heading":"RESCUE PLATFORM", "context":"The sub is pinned below collapsing rock. Choose how to keep its crew breathing.", "options":(
            {"id":"oxygen","label":"SEND EMERGENCY OXYGEN","benefit":"Restore 16 integrity; pressure rises a little.","effects":{"integrity":16,"meter":9},"outcome":"An oxygen line snaps into place. Three breath monitors steady."},
            {"id":"silt","label":"CLEAR THE TRENCH SILT","benefit":"Lower hull stress at a cost of 9 seconds.","effects":{"meter":-28,"seconds":-9},"outcome":"Propeller wash clears the rescue cable from a cloud of silt."},
        )},
        {"heading":"FINAL ASCENT", "context":"The sub begins to rise. Protect the hull on its way up.", "options":(
            {"id":"decompress","label":"CONTROL DECOMPRESSION","benefit":"Reduce hull stress; costs 11 seconds.","effects":{"meter":-33,"seconds":-11},"outcome":"Pressure equalizes and the rescue cabin stops creaking."},
            {"id":"tow","label":"ENGAGE BACKUP TOW","benefit":"Gain 12 seconds, strain integrity by 8.","effects":{"seconds":12,"integrity":-8},"outcome":"A second cable grabs the sub. The rescue vessel pulls harder toward daylight."},
        )},
    ),
    "neon": (
        {"heading":"CAMERA CONTROL", "context":"The alarm grid is searching for intruders.", "options":(
            {"id":"blind","label":"BLIND THE CAMERAS","benefit":"Reduce alert; costs 9 seconds.","effects":{"meter":-29,"seconds":-9},"outcome":"Every corridor camera displays an empty hallway."},
            {"id":"badge","label":"FALSIFY ACCESS BADGES","benefit":"Restore integrity but raise alarm by 10.","effects":{"integrity":16,"meter":10},"outcome":"The guards wave your crew into the archive. Their consoles quietly flag an anomaly."},
        )},
        {"heading":"PUBLIC UPLINK", "context":"Security is sweeping the building. Get the evidence out.", "options":(
            {"id":"dark","label":"CUT THE ARCHIVE LIGHTS","benefit":"Lower alert and spend 12 seconds.","effects":{"meter":-34,"seconds":-12},"outcome":"The tower falls dark. Only the upload status remains illuminated."},
            {"id":"decoy","label":"DEPLOY A DECOY SIGNAL","benefit":"Gain 13 seconds, lose 9 integrity.","effects":{"seconds":13,"integrity":-9},"outcome":"The patrol drones pursue a false transmission across the skyline."},
        )},
    ),
    "red_horizon": (
        {"heading":"GREENHOUSE SURVIVAL", "context":"The settlers are cold and the air is thinning.", "options":(
            {"id":"heater","label":"BOOST THERMAL BLANKETS","benefit":"Restore 15 integrity; oxygen debt rises.","effects":{"integrity":15,"meter":10},"outcome":"Warmth returns to the settlers while the battery runs harder."},
            {"id":"scrubber","label":"PURGE CARBON FILTERS","benefit":"Lower oxygen debt; costs 9 seconds.","effects":{"meter":-28,"seconds":-9},"outcome":"The air recycler clears, and breath monitors turn green."},
        )},
        {"heading":"ORBITAL EXTRACTION", "context":"A rescue shuttle is passing above the storm.", "options":(
            {"id":"antenna","label":"BOOST DOCKING BEACON","benefit":"Lower oxygen debt; costs 12 seconds.","effects":{"meter":-31,"seconds":-12},"outcome":"The docking beam pierces the dust and finds the waiting shuttle."},
            {"id":"reserve","label":"BURN EMERGENCY RESERVES","benefit":"Gain 12 seconds; lose 9 integrity.","effects":{"seconds":12,"integrity":-9},"outcome":"The final generator kicks in. The landing lights turn on."},
        )},
    ),
}
