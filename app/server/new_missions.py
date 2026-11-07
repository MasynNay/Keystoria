"""Two additional authored operations, kept apart from the original campaign.

Each operation owns its plot, exact typing sequence, consequences, and scenario
pressure rules. The shared GameEngine decides what is allowed and when.
"""

EXTRA_MISSIONS = {
    "dead_air": {
        "title": "DEAD AIR", "subtitle": "The city has gone silent.",
        "location": "BELLWETHER CITY // BROADCAST TOWER 09",
        "story": "A storm has destroyed the emergency phone network. Hundreds of residents are trapped in a flooded district. Restore the city's last radio transmitter while saboteurs jam the frequency.",
        "attack_title": "RESTORE THE BROADCAST", "defend_title": "FIGHT THE JAMMERS",
        "attack_action": "BROADCAST COMMAND", "defend_action": "CLEAR INTERFERENCE",
        "goal": "Broadcast safe evacuation routes before the river crests",
        "threats": ["JAMMING BURST", "SPOOFED WEATHER ALERT", "SIGNAL HIJACK", "POWER SPIKE", "TOWER INTRUSION", "DEAD FREQUENCY"],
        "commands": [
            "inspect the transmitter", "restore backup batteries", "recover the city map",
            "identify flooded streets", "establish an emergency channel", "authorize the public warning",
            "align the antenna array", "locate the shelter network", "verify evacuation corridors",
            "patch the repeater station", "broadcast the rescue route",
        ],
        "defense": [
            "filter the false signal", "isolate the jammer", "protect the power feed",
            "block the rogue transmitter", "verify the broadcast source", "clear the static burst",
            "lock the control room", "shield the antenna relays",
        ],
        "log": [
            "Rescue crews report floodwater entering the lower district.",
            "A caller whispers that an apartment block has lost power.",
            "The last functioning ambulance radio is breaking up.",
            "Dispatch reports people gathering on a flooded overpass.",
        ],
        "beats": {
            (1, 2): "Backup power hums to life. The tower is operational, but the rescue map is still corrupted.",
            (1, 4): "The map reveals an underpass already underwater. Do not send people that way.",
            (2, 2): "The antenna catches a rescue helicopter. It needs a safe route before its fuel runs out.",
            (2, 5): "An apartment rooftop responds to your test tone. Families are listening. Send the route now.",
        },
        "crisis_name": "LIGHTNING STRIKE", "crisis_phrase": "ground the antenna mast",
        "crisis_intro": "LIGHTNING STRIKE. The tower safety breaker has tripped. Your defender must ground the mast before transmission resumes.",
        "switch": "THE CONTROL ROOM FLOODS", "win": "THE CITY HEARD YOU", "lose": "THE SIGNAL IS LOST",
    },
    "last_stop": {
        "title": "LAST STOP", "subtitle": "Next station: a collapsed bridge.",
        "location": "NIGHT SERVICE 718 // MOUNTAIN PASS",
        "story": "An overnight train carrying 180 passengers has lost its brake network after a signal-system attack. The next bridge has washed out. Restore braking while your partner blocks malicious track commands.",
        "attack_title": "RECLAIM TRAIN CONTROL", "defend_title": "HOLD THE SIGNAL LINE",
        "attack_action": "CONTROL COMMAND", "defend_action": "INTERCEPT OVERRIDE",
        "goal": "Stop the train before the destroyed Raven Bridge",
        "threats": ["FALSE GREEN SIGNAL", "THROTTLE OVERRIDE", "BRAKE SPOOF", "TRACK SWITCH ATTACK", "SIGNAL COLLISION", "REMOTE ACCESS"],
        "commands": [
            "inspect the brake controller", "isolate the compromised link", "contact the rear carriage",
            "restore auxiliary traction", "unlock manual brake access", "prepare emergency braking",
            "confirm passenger safety", "verify the track gradient", "disconnect automatic throttle",
            "engage the backup brakes", "bring the train to a stop",
        ],
        "defense": [
            "reject the false signal", "block the throttle override", "protect the brake controller",
            "secure the switch network", "warn the rear carriages", "clear the signal fault",
            "hold the override lock", "isolate the rogue console",
        ],
        "log": [
            "A passenger reports sparks beneath the rear carriage.",
            "The bridge monitoring station has gone offline.",
            "A conductor confirms all emergency exits are clear.",
            "The speed display is rising even though the throttle is closed.",
        ],
        "beats": {
            (1, 2): "The hostile signal is isolated, but the brake computer still won't accept a stop command.",
            (1, 4): "The rear carriage confirms 180 passengers. The washed-out bridge is getting closer.",
            (2, 2): "Passengers brace against the seats. Brake pressure is returning in stages.",
            (2, 5): "The backup brakes grip the rails. One final command stands between you and the ravine.",
        },
        "crisis_name": "TRACK OVERRIDE", "crisis_phrase": "cut the rogue track command",
        "crisis_intro": "TRACK OVERRIDE. A remote signal is forcing the throttle open. Your defender must sever the malicious command before the brakes will engage.",
        "switch": "CONTROL CABIN BLACKOUT", "win": "TRAIN 718 IS SAFE", "lose": "THE TRAIN NEVER STOPS",
    },
}

EXTRA_BRIEFINGS = {
    "dead_air": {
        "chapter": "CASE 05 / THE LAST FREQUENCY",
        "opening": "Bellwether City's river walls have failed. The emergency phone network is silent, and floodwater is climbing toward a neighborhood of occupied apartments. The last radio mast still has power—but someone is filling its channel with false evacuation orders. If you can broadcast a safe route, rescue teams can reach the rooftops before dawn.",
        "hacker": "You are the transmission engineer. Recover the flood map, restore the transmitter, and send evacuation directions. Each successful command makes the message more reliable.",
        "defender": "You are the signal operator. Intercept fake alerts and jamming attacks before their countdown expires. Successful countermeasures reduce radio interference and protect the rescue channel.",
        "stakes": "If interference reaches 100, integrity reaches zero, or time runs out, residents will never receive the correct evacuation route.",
        "stageObjectives": ["Restore radio power and locate a safe evacuation corridor", "Protect the mast and broadcast the route to trapped residents"],
        "outro": "A single reply cuts through the static: 'Bellwether shelter, copy. We're on our way.' The first rescue helicopters descend over the flooded district.",
    },
    "last_stop": {
        "chapter": "CASE 06 / THE BROKEN CROSSING",
        "opening": "02:14 a.m. Train 718 is descending a mountain pass with 180 passengers aboard. A landslide has destroyed the bridge two miles ahead. Remote attackers have disabled the main brake network and are injecting false green signals. The conductor has minutes to stop the train. You have one working maintenance link.",
        "hacker": "You are the train systems engineer. Restore control of the emergency brakes, verify passenger safety, and execute the final stop sequence.",
        "defender": "You are the dispatcher. Block false track signals and throttle overrides before the threat timer expires. Each successful interception slows the train and protects the brake network.",
        "stakes": "If train speed reaches 100, integrity reaches zero, or time expires, Train 718 reaches the destroyed bridge.",
        "stageObjectives": ["Isolate the false signal and reach the manual brake controller", "Restore braking and stop Train 718 before Raven Bridge"],
        "outro": "The wheels scream on the rails. The train shudders, slows, and finally stops in the dark, safely short of the shattered bridge. Every carriage answers the conductor's roll call.",
    },
}

EXTRA_PATHS = {
    "dead_air": (
        ("inspect the transmitter", "restore backup batteries", "recover the city map", "identify flooded streets", "establish an emergency channel"),
        ("authorize the public warning", "align the antenna array", "locate the shelter network", "verify evacuation corridors", "patch the repeater station", "broadcast the rescue route"),
    ),
    "last_stop": (
        ("inspect the brake controller", "isolate the compromised link", "contact the rear carriage", "restore auxiliary traction", "unlock manual brake access"),
        ("prepare emergency braking", "confirm passenger safety", "verify the track gradient", "disconnect automatic throttle", "engage the backup brakes", "bring the train to a stop"),
    ),
}

EXTRA_RULES = {
    "dead_air": {
        "meter": "RADIO INTERFERENCE", "direction": "high", "initial": 20,
        "hack": 7, "defend": -13, "breach": 20, "pulse": -16,
        "warning": 64, "warning_text": "SIGNAL CRITICAL / THE CITY CANNOT HEAR YOU",
        "failure": "The rescue broadcast was drowned out by interference.",
        "intro": "Every broadcast attracts more jamming. Your defender must keep the emergency frequency clear.",
        "encounter": "THE JAMMED FREQUENCY",
        "encounter_intro": "False evacuation orders are reaching the city. Choose how to regain the real emergency channel; your defender will execute the plan.",
        "choices": {
            "narrowband": {"label":"NARROW THE FREQUENCY", "description":"Dodge the jammer, sharply reduce interference, lose 10 seconds.", "phrase":"retune the narrowband filter", "effects":{"meter":-43,"seconds":-10}},
            "relay": {"label":"USE THE MOUNTAIN RELAY", "description":"Reach a remote antenna and restore integrity; costs 13 seconds.", "phrase":"switch to the mountain repeater", "effects":{"meter":-27,"integrity":14,"seconds":-13}},
        },
    },
    "last_stop": {
        "meter": "RUNAWAY SPEED", "direction": "high", "initial": 24,
        "hack": 7, "defend": -13, "breach": 21, "pulse": -15,
        "warning": 66, "warning_text": "OVERSPEED / RAVEN BRIDGE APPROACHING",
        "failure": "Train 718 reached the broken crossing at dangerous speed.",
        "intro": "The train accelerates whenever you fight the compromised controller. Defenders cut rogue commands to reduce speed.",
        "encounter": "THE BRAKE DECISION",
        "encounter_intro": "The emergency braking circuit is unstable. Choose a plan that your dispatcher can execute before the next curve.",
        "choices": {
            "hydraulic": {"label":"CHARGE HYDRAULIC BRAKES", "description":"Reduce runaway speed rapidly at the cost of 11 seconds.", "phrase":"prime the hydraulic brake circuit", "effects":{"meter":-46,"seconds":-11}},
            "magnetic": {"label":"ENGAGE MAGNETIC BRAKES", "description":"Reduce speed while reinforcing the controller; costs 15 seconds.", "phrase":"enable the magnetic brake array", "effects":{"meter":-29,"integrity":15,"seconds":-15}},
        },
    },
}

EXTRA_DESCRIPTIONS = {
    "dead_air": {
        "inspect the transmitter": "Diagnose the last functioning radio tower so you know which hardware can still deliver the evacuation warning.",
        "restore backup batteries": "Bring emergency battery power online; without it the tower goes silent when the damaged city grid fails.",
        "recover the city map": "Retrieve the emergency street map so you can keep residents away from flooded bridges and inaccessible roads.",
        "identify flooded streets": "Mark submerged intersections and blocked underpasses before telling families which path leads to safety.",
        "establish an emergency channel": "Reserve a clean radio frequency so the public warning does not get lost in normal chatter and hostile static.",
        "authorize the public warning": "Approve the evacuation message so first responders can broadcast a consistent instruction across the city.",
        "align the antenna array": "Aim the surviving antenna toward the flooded district where phones have failed and emergency receivers still work.",
        "locate the shelter network": "Find which schools and relief stations are open so evacuees receive destinations that can actually accept them.",
        "verify evacuation corridors": "Compare the proposed routes with updated flood readings before putting vulnerable residents in more danger.",
        "patch the repeater station": "Restore the mountain repeater to carry your message across hills and into homes beyond the damaged city mast.",
        "broadcast the rescue route": "Send the verified evacuation route over the emergency channel so trapped families know where rescue crews will arrive.",
        "filter the false signal": "Reject a forged broadcast before it sends frightened residents toward a flooded evacuation corridor.",
        "isolate the jammer": "Pinpoint hostile radio interference and keep the rescue frequency clear enough to be understood.",
        "protect the power feed": "Prevent an electrical surge from shutting down the tower while evacuation instructions are being assembled.",
        "block the rogue transmitter": "Stop an unauthorized transmitter from impersonating the city's official emergency service.",
        "verify the broadcast source": "Authenticate the dispatch channel so families hear genuine rescue instructions rather than a malicious imitation.",
        "clear the static burst": "Remove a sudden burst of interference and recover a readable signal before another message is lost.",
        "lock the control room": "Keep saboteurs away from the main transmitter rack while the engineer repairs the final broadcast system.",
        "shield the antenna relays": "Protect the fragile antenna wiring so the warning can reach neighborhoods behind the mountains.",
        "ground the antenna mast": "Safely divert lightning current away from the transmitter and let the evacuation broadcast resume.",
        "retune the narrowband filter": "Restrict the broadcast channel to bypass the jammer and make the warning understandable across the flooded district.",
        "switch to the mountain repeater": "Route the warning through a distant relay that hostile transmitters cannot easily reach.",
    },
    "last_stop": {
        "inspect the brake controller": "Read the brake controller's state to learn why the train is still accelerating toward the destroyed bridge.",
        "isolate the compromised link": "Disconnect the attacker-controlled signal path so false commands cannot keep overriding the driver.",
        "contact the rear carriage": "Reach the conductor and confirm the rear passengers are ready to brace for an emergency stop.",
        "restore auxiliary traction": "Recover the backup power system needed to regain control of the train's safety equipment.",
        "unlock manual brake access": "Release the lock preventing the engineer from operating the emergency brake circuit.",
        "prepare emergency braking": "Prime backup braking hardware so it can safely begin slowing all carriages instead of locking individual wheels.",
        "confirm passenger safety": "Confirm the conductor has cleared aisles and warned passengers before a forceful emergency stop.",
        "verify the track gradient": "Calculate the downhill slope to avoid underestimating the force needed to stop before Raven Bridge.",
        "disconnect automatic throttle": "Remove the malicious automatic acceleration command before the braking circuit engages.",
        "engage the backup brakes": "Apply the redundant braking system and begin shedding speed on the final downhill stretch.",
        "bring the train to a stop": "Complete the emergency brake sequence so all 180 passengers halt safely short of the destroyed bridge.",
        "reject the false signal": "Ignore a forged green track signal that would falsely tell the engineer the crossing is safe.",
        "block the throttle override": "Prevent remote attackers from accelerating the train while the engineer prepares the backup brakes.",
        "protect the brake controller": "Keep the compromised controller isolated so a hostile command cannot undo the emergency stop.",
        "secure the switch network": "Lock down the track switch channel so sabotage cannot route the train onto a more dangerous line.",
        "warn the rear carriages": "Relay the emergency stop warning to conductors so passengers can brace for sudden deceleration.",
        "clear the signal fault": "Remove corrupted signaling data before the engineer relies on its readings to control braking.",
        "hold the override lock": "Keep the attacker from regaining the train's throttle while backup brakes take effect.",
        "isolate the rogue console": "Disconnect an unauthorized control station that is injecting instructions into the train network.",
        "cut the rogue track command": "Stop a hostile override that forces the train to accelerate, unlocking the final braking attempt.",
        "prime the hydraulic brake circuit": "Charge the hydraulic system and sharply reduce speed before the train reaches the washed-out crossing.",
        "enable the magnetic brake array": "Engage the secondary magnetic brakes to shed speed while reducing strain on the damaged control circuit.",
    },
}
