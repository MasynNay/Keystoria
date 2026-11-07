"""Three character-driven chapters for the in-story animation release.

Content and balancing live here; the existing room engine remains authoritative.
Each plot introduces a trusted voice, a reversal, and an earned resolution.
"""

PLOTS = {
    "whiteout": {
        "title": "WHITEOUT", "subtitle": "The rescue call was a lie.",
        "location": "NORTHSTAR RESEARCH BASE // ARCTIC NIGHT",
        "story": "An Arctic research crew is stranded in a whiteout. Their trusted rescue pilot has been transmitting deliberately false coordinates to conceal a stolen climate archive. Recover the flight record, expose the betrayal, and guide a real rescue to the station.",
        "attack_title": "FIND THE REAL RESCUE", "defend_title": "PROTECT THE BASE",
        "attack_action": "EXECUTE RESCUE", "defend_action": "HOLD THE SHELTER",
        "goal": "Expose the false coordinates and bring the research team home",
        "threats": ["FROZEN VENT", "FALSE BEACON", "RADIO SPOOF", "HEAT LOSS", "ANTENNA ICE", "POWER SURGE", "STORM GUST"],
        "path": (
            ("restore the shelter heaters", "recover the weather radar", "contact the rescue pilot", "decode the landing coordinates", "inspect the flight recorder"),
            ("expose the altered flight plan", "locate the missing rescue team", "repair the emergency beacon", "guide the second helicopter", "open the storm shelter", "bring everyone aboard"),
        ),
        "defense": ["clear the frozen vents", "shield the emergency antenna", "reject the false distress call", "restart the fuel pump", "secure the outer hatch", "repair the heater cable", "protect the flight recorder", "clear the ice from the beacon", "hold the storm shutters", "stabilize the generator"],
        "log": ["Snow has buried the south airlock.", "A pilot repeats coordinates that do not match the base map.", "A researcher spots lights far beyond the marked landing zone."],
        "beats": {(1,2):"The radar shows a second aircraft, but the trusted pilot denies its existence.", (1,5):"The recorder proves the first pilot intentionally changed the coordinates.", (2,2):"The abandoned rescue crew answers from a hidden valley.", (2,5):"A real helicopter emerges from the storm. The landing lights are almost visible."},
        "crisis_name": "HEATING FAILURE", "crisis_phrase": "close the emergency heat bypass",
        "crisis_intro": "The station's heat feed freezes. Your defender must isolate it before the final evacuation order can continue.",
        "switch": "THE PILOT BETRAYS YOU", "win": "THE TRUE RESCUE ARRIVES", "lose": "THE BASE DISAPPEARS IN THE STORM",
        "chapter": "CHAPTER 10 / THE FALSE BEACON",
        "opening": "Northstar Base is running out of heat. Rescue pilot Kade says he is five minutes away, but his coordinates place him in open water. Dr. Sera trusts him. Engineer Ro thinks he is lying. The missing research archive may explain why he wants everyone looking in the wrong direction.",
        "hacker": "You are the rescue coordinator. Restore sensors, verify the rescue route, expose the false pilot signal and guide a second aircraft to the shelter.",
        "defender": "You are the shelter engineer. Keep heat, communications, and doors operational while the storm and false distress signals threaten the crew.",
        "stakes": "If exposure reaches 100, integrity fails, or time expires, the shelter cannot keep the researchers alive.",
        "stageObjectives": ["Verify the coordinates and discover why the pilot is lying", "Find the abandoned rescuers and guide a trustworthy extraction"],
        "outro": "Kade's forged signal goes silent. Through the snow, a second helicopter touches down. Sera carries the unaltered research archive aboard with every surviving scientist.",
        "meter": "EXPOSURE", "warning_text": "TEMPERATURE CRITICAL / BASE FREEZING", "failure": "The research team froze before rescue could reach them.",
        "encounter": "THE FALSE COORDINATES", "encounter_intro": "Kade's flight plan routes the aircraft away from the base. Choose how to prove the correct position.",
        "choices": (
            ("radar", "VERIFY THE RADAR", "Cross-check satellite returns; takes 10 seconds but clears exposure.", "cross check the radar coordinates", {"meter":-42,"seconds":-10}, "Independent radar returns expose the pilot's forged route."),
            ("thermal", "FIND THE HEAT SIGNAL", "Locate the stranded rescue crew and recover integrity; costs 14 seconds.", "scan for the rescue crew heat signature", {"meter":-25,"integrity":13,"seconds":-14}, "The missing helicopter's heat signature appears behind the ridge."),
        ),
        "fields": (
            ("SHELTER HEATING", "The base is losing heat. You can buy time or preserve reserve power.",
             (("fuel", "BURN RESERVE FUEL", "Reduce exposure; consumes 9 seconds.", {"meter":-27,"seconds":-9}, "The radiators glow and the researchers remove their gloves."),
              ("insulate", "SEAL THE WINDOW SHUTTERS", "Restore integrity; exposure increases during the repair.", {"integrity":14,"meter":10}, "Steel shutters close over the observation windows as the wind rises."))),
            ("LANDING CLEARANCE", "The true rescue craft needs a clear landing zone.",
             (("flares", "LIGHT THE LANDING FLARES", "Reduce exposure, but costs 12 seconds.", {"meter":-33,"seconds":-12}, "A line of red flares burns through the blizzard."),
              ("relay", "BOOST THE RESCUE RADIO", "Gain 12 seconds, but strain the backup power.", {"seconds":12,"integrity":-9}, "The rescue pilot hears the verified coordinates over the storm."))),
        ),
    },
    "ashfall": {
        "title": "ASHFALL", "subtitle": "The evacuation route was sabotaged.",
        "location": "REDWOOD COUNTY // FIRE COMMAND POST",
        "story": "A wind-driven wildfire surrounds a mountain town. The evacuation chief has redirected civilian buses toward a closed tunnel to protect an illegal development. Recover the true road conditions and lead families to a safe valley.",
        "attack_title": "OPEN THE SAFE ROUTE", "defend_title": "HOLD BACK THE FIRE",
        "attack_action": "COORDINATE EVACUATION", "defend_action": "DEFEND THE CONVOY",
        "goal": "Guide the evacuation convoy out of the wildfire",
        "threats": ["FIRE SPOT", "RADIO BLACKOUT", "ROADBLOCK", "SMOKE SURGE", "POWER LINE", "FALLING TREE", "FALSE ROUTE"],
        "path": (
            ("activate the fire lookout", "locate the school buses", "review the official evacuation map", "check the blocked mountain road", "intercept the chief's private call"),
            ("reveal the forged evacuation order", "plot the old quarry bypass", "open the emergency road gate", "guide the first bus through smoke", "clear the burning roadblock", "deliver the convoy to the valley"),
        ),
        "defense": ["protect the school bus radio", "clear embers from the road", "deploy a firebreak line", "secure the water tanker", "hold the smoke barrier", "reroute the rescue vehicles", "block the false detour order", "clear the fallen power line", "shield the lookout antenna", "warn the last bus driver"],
        "log": ["A bus driver reports children coughing in the smoke.", "The evacuation chief's radio goes silent during a route change.", "Wind throws burning branches across the quarry road."],
        "beats": {(1,2):"The convoy answers from the school parking lot. Children are aboard.", (1,5):"The chief's secret call reveals a deliberate false evacuation route.", (2,2):"An old quarry road offers a way around the burning tunnel.", (2,5):"The final bus reaches the edge of the smoke. The valley is just ahead."},
        "crisis_name": "FIRE FRONT BREAKTHROUGH", "crisis_phrase": "deploy the last water curtain",
        "crisis_intro": "The fire front reaches the convoy. Your defender must deploy the remaining tanker water before the route opens.",
        "switch": "THE CHIEF CUTS THE RADIO", "win": "EVERY BUS MADE IT OUT", "lose": "THE CONVOY IS LOST",
        "chapter": "CHAPTER 11 / THE ROAD THEY HID",
        "opening": "At 18:06 a wildfire traps thirty-two families and three school buses above Redpine Valley. Chief Halden sends the buses toward the mountain tunnel, saying the quarry route is closed. Volunteer dispatcher Ana sees fresh tire tracks on the quarry road. Someone is hiding a way out.",
        "hacker": "You are the evacuation coordinator. Restore the route data, expose the forged order, open the quarry bypass and guide all three buses into the valley.",
        "defender": "You are the fireline operator. Intercept road hazards and communication failures while protecting the convoy from fast-moving flames.",
        "stakes": "If the fire front reaches 100, integrity collapses, or time expires, the buses will be trapped in the burning pass.",
        "stageObjectives": ["Locate the families and uncover the false evacuation order", "Open a real route and guide the final bus through the fireline"],
        "outro": "The third bus rolls into the valley as the hillside ignites behind it. Ana plays the chief's recording over the emergency network. Every passenger is accounted for.",
        "meter": "FIRE FRONT", "warning_text": "FLAMES AT THE CONVOY / EVACUATE NOW", "failure": "The wildfire cut off the evacuation route.",
        "encounter": "THE FORGED EVACUATION", "encounter_intro": "Chief Halden insists the tunnel is safe. Your dispatcher knows the quarry bypass may be open. Choose how to verify the route.",
        "choices": (
            ("camera", "CHECK THE LOOKOUT CAMERA", "Locate clear roads and cut fire pressure; costs 10 seconds.", "verify the lookout road camera", {"meter":-40,"seconds":-10}, "The camera shows the tunnel blocked and the quarry road still clear."),
            ("drivers", "CONTACT THE BUS DRIVERS", "Protect the families and reduce fire pressure; costs 14 seconds.", "connect the bus driver radio loop", {"meter":-25,"integrity":14,"seconds":-14}, "Three drivers confirm their position and agree to ignore the false order."),
        ),
        "fields": (
            ("FIRE LINE", "The fire is advancing on the buses.",
             (("tanker", "DEPLOY THE WATER TANKER", "Reduce fire pressure; costs 9 seconds.", {"meter":-29,"seconds":-9}, "A moving wall of water protects the buses from flying embers."),
              ("medics", "SEND THE MEDIC CREW", "Restore convoy integrity, but fire pressure increases.", {"integrity":15,"meter":10}, "The medics reach the rear bus and help the last passengers board."))),
            ("QUARRY EXIT", "The last bus must pass a burning roadblock.",
             (("dozer", "OPEN A DOZER PATH", "Cut fire pressure; costs 12 seconds.", {"meter":-33,"seconds":-12}, "A bulldozer pulls burning timber away from the narrow road."),
              ("escort", "SEND THE RESCUE ESCORT", "Gain 12 seconds; strain the convoy's remaining equipment.", {"seconds":12,"integrity":-9}, "An engine crew leads the buses into the clear air below the ridge."))),
        ),
    },
    "carnival": {
        "title": "CARNIVAL 13", "subtitle": "The lights went out at the worst possible time.",
        "location": "LUMINA PIER // AFTER HOURS",
        "story": "A seaside carnival locks down with visitors trapped on a stopped Ferris wheel. The park manager has disabled the rescue power after stealing the emergency generator and blaming the night technician. Follow the clues and bring the passengers safely down.",
        "attack_title": "RESCUE THE RIDERS", "defend_title": "HOLD THE RIDES SAFE",
        "attack_action": "RESTORE THE FAIRGROUND", "defend_action": "SECURE THE RIDE",
        "goal": "Rescue the stranded riders before the Ferris wheel's brakes fail",
        "threats": ["BRAKE ALARM", "POWER DIP", "FALSE SAFETY CODE", "RIDE OSCILLATION", "PIER WIND", "REMOTE LOCKOUT", "CABIN PANIC"],
        "path": (
            ("find the trapped riders", "restore the emergency lights", "inspect the ride control booth", "recover the generator key", "play the manager's recording"),
            ("reveal the stolen generator", "unlock the manual ride controls", "stabilize the wheel brakes", "lower the first passenger cabin", "secure the loading platform", "bring the final family down"),
        ),
        "defense": ["hold the wheel brake pressure", "secure the loading gate", "block the false safety code", "stabilize the cabin cables", "clear the emergency walkway", "restore the operator intercom", "isolate the faulty power feed", "protect the control cabinet", "calm the trapped riders", "secure the service ladder"],
        "log": ["Passengers wave their phone lights from the highest cabin.", "A recorded voice orders the technician to leave the ride closed.", "Wind shakes the empty ticket booths along the pier."],
        "beats": {(1,2):"The highest cabin answers your flashing signal. Children are still aboard.", (1,5):"The manager's recording proves the generator was taken deliberately.", (2,2):"The manual control wheel turns. The trapped cabins begin to move.", (2,5):"The final family waits above the boarding platform. One more safe rotation."},
        "crisis_name": "BRAKE FAILURE", "crisis_phrase": "engage the manual brake pawl",
        "crisis_intro": "The wheel's braking system slips. Your defender must secure the manual brake before lowering another cabin.",
        "switch": "THE MANAGER LOCKS THE BOOTH", "win": "THE FINAL CABIN IS SAFE", "lose": "THE WHEEL NEVER STOPS",
        "chapter": "CHAPTER 12 / LIGHTS OUT AT LUMINA",
        "opening": "At closing time, the Ferris wheel freezes with eighteen people suspended above the sea. Manager Wren blames technician Kit for the missing backup generator and locks the control booth. But Kit has a recording that tells a different story. Every minute the brake assembly slips further.",
        "hacker": "You are the ride technician. Find the trapped riders, recover manual controls, expose the manager's lie and bring each cabin to safety.",
        "defender": "You are the safety operator. Intercept brake faults and false lockout commands, hold the boarding platform clear and reassure riders.",
        "stakes": "If wheel instability reaches 100, integrity fails, or time expires, the trapped cabins cannot descend safely.",
        "stageObjectives": ["Restore safe communications and discover where the generator went", "Recover manual control and lower every trapped passenger cabin"],
        "outro": "The final cabin reaches the pier. Families hug beneath the restored carousel lights while Kit hands the manager's recording to the authorities. The wheel finally comes to rest.",
        "meter": "WHEEL INSTABILITY", "warning_text": "BRAKES SLIPPING / CABINS AT RISK", "failure": "The Ferris wheel became too unstable to evacuate.",
        "encounter": "THE MISSING GENERATOR", "encounter_intro": "The manager insists emergency power is lost. Choose how to bypass his lockout before the brakes overheat.",
        "choices": (
            ("manual", "USE MANUAL CONTROL", "Lower instability rapidly; takes 10 seconds to unlock.", "release the manual controller interlock", {"meter":-42,"seconds":-10}, "The handwheel turns and the highest cabin descends a few feet."),
            ("auxiliary", "FIND THE AUXILIARY FEED", "Restore safety systems and reduce instability; costs 14 seconds.", "reconnect the auxiliary ride feed", {"meter":-24,"integrity":13,"seconds":-14}, "The carnival lights flicker and the passenger intercom comes online."),
        ),
        "fields": (
            ("RIDE SAFETY", "The brake assembly is beginning to slip.",
             (("anchors", "SECURE THE WHEEL ANCHORS", "Reduce instability; costs 9 seconds.", {"meter":-28,"seconds":-9}, "Steel supports lock the wheel against the sea wind."),
              ("intercom", "RESTORE THE RIDER INTERCOM", "Improve safety, but the wheel takes more strain.", {"integrity":14,"meter":10}, "Every cabin answers the operator's voice."))),
            ("FINAL CABIN", "One family remains above the platform.",
             (("piston", "POWER THE BRAKE PISTON", "Reduce instability; costs 12 seconds.", {"meter":-34,"seconds":-12}, "The brake piston drives home and the last cabin moves safely."),
              ("crew", "SEND THE PLATFORM CREW", "Gain 12 seconds, but strain the system.", {"seconds":12,"integrity":-9}, "Rescue staff line the platform and guide the family down the steps."))),
        ),
    },
}

NEW_MISSIONS = {}
NEW_BRIEFINGS = {}
NEW_PATHS = {}
NEW_DESCRIPTIONS = {}
NEW_RULES = {}
NEW_FIELDS = {}

for key, story in PLOTS.items():
    acts = story["path"]
    NEW_PATHS[key] = acts
    NEW_MISSIONS[key] = {
        item: story[item] for item in (
            "title", "subtitle", "location", "story", "attack_title", "defend_title",
            "attack_action", "defend_action", "goal", "threats", "defense", "log", "beats",
            "crisis_name", "crisis_phrase", "crisis_intro", "switch", "win", "lose"
        )
    }
    NEW_MISSIONS[key]["commands"] = [cmd for act in acts for cmd in act]
    NEW_BRIEFINGS[key] = {item: story[item] for item in ("chapter", "opening", "hacker", "defender", "stakes", "stageObjectives", "outro")}
    NEW_DESCRIPTIONS[key] = {
        cmd: f"{cmd.capitalize()} to progress the {story['goal'].lower()}. This action changes the rescue team's immediate situation and opens the next step of the operation."
        for cmd in NEW_MISSIONS[key]["commands"]
    }
    NEW_DESCRIPTIONS[key].update({
        phrase: f"{phrase.capitalize()} before the threat reaches the crew. This keeps the {story['meter'].lower()} under control while your partner advances the story."
        for phrase in story["defense"]
    })
    NEW_DESCRIPTIONS[key][story["crisis_phrase"]] = story["crisis_intro"] + " This emergency must be resolved before the mission can finish."
    choices = {}
    for ident, label, description, phrase, effects, outcome in story["choices"]:
        choices[ident] = {"label":label,"description":description,"phrase":phrase,"effects":effects,"outcome":outcome}
        NEW_DESCRIPTIONS[key][phrase] = description + " " + outcome
    NEW_RULES[key] = {
        "meter":story["meter"],"direction":"high","initial":19,"hack":6,"defend":-13,
        "breach":19,"pulse":-13,"warning":67,"warning_text":story["warning_text"],
        "failure":story["failure"],"intro":story["stakes"],
        "encounter":story["encounter"],"encounter_intro":story["encounter_intro"],"choices":choices,
    }
    fields = []
    for heading, context, options in story["fields"]:
        fields.append({
            "heading":heading,"context":context,
            "options":tuple({"id":i,"label":l,"benefit":b,"effects":e,"outcome":o} for i,l,b,e,o in options),
        })
    NEW_FIELDS[key] = tuple(fields)

# Specific cause and effect for every main story command. This text appears
# beside the typing target, so players understand the action before entering it.
ACTION_EXPLANATIONS = {
    'whiteout': [
        'Bring the shelter radiators back online. The researchers are losing feeling in their hands, and this is their only source of heat.',
        'Pull a fresh radar sweep through the snow to check whether the approaching aircraft is actually near the base.',
        'Establish a direct voice channel with the pilot, rather than trusting the repeating recorded position report.',
        'Compare the supposed landing coordinates with the observatory map. They lead away from the actual station.',
        'Play back the flight data that the director tried to hide. It reveals an unauthorized change to the route.',
        'Prove the broadcast coordinates were deliberately altered so the crew stops trusting the fake rescue plan.',
        'Find the stranded second rescue crew by triangulating its remaining heat and radio traces.',
        'Repair the real emergency beacon that the saboteur disconnected, opening a route for independent rescuers.',
        'Guide the second helicopter past the ice ridge and into the narrow approach corridor.',
        'Open the shelter doors only after the genuine helicopter has landed safely on the ice.',
        'Guide every scientist into the rescue helicopter and complete the evacuation before the base loses heat.',
    ],
    'ashfall': [
        'Activate the mountain lookout so the rescue crew can see how quickly the fire is reaching the town.',
        'Find the school buses by radio signal and determine where the children are waiting in the smoke.',
        'Load the official map and compare its evacuation route against live fire reports, before sending the buses anywhere.',
        'Check the mountain tunnel and discover whether its listed evacuation status is genuine or falsified.',
        'Recover the chief’s private radio call and learn why the evacuation instructions changed after the fire advanced.',
        'Reveal the forged evacuation order so the bus drivers do not follow the deliberately unsafe route.',
        'Find an alternative along the old quarry road, away from the burning tunnel and the fire front.',
        'Unlock the emergency gate blocking the quarry road, creating an escape path for the trapped buses.',
        'Transmit the correct turn-by-turn route to the leading driver while smoke limits visibility.',
        'Coordinate the bulldozer and water crew to remove flaming timber from the last stretch of road.',
        'Check that every bus and its passengers reached the valley, rather than declaring victory after the first vehicle.',
    ],
    'carnival': [
        'Scan the stopped wheel cabin by cabin to locate all eighteen trapped riders before beginning the rescue.',
        'Turn on emergency lighting so riders can see the platform and rescuers can inspect the brake assembly.',
        'Inspect the locked control booth to learn whether the failure came from the ride or the missing power supply.',
        'Recover the generator access key and identify who removed it before the ride stopped.',
        'Play the manager’s private recording, which contradicts his claim that the technician caused the outage.',
        'Expose the stolen backup generator so the rescue team can bypass the manager’s false safety lockout.',
        'Unlock the manual ride controller and begin moving the wheel without relying on the stolen generator.',
        'Stabilize the mechanical brakes before lowering another cabin; each safe rotation depends on this step.',
        'Move the first cabin to the loading platform and help its riders onto solid ground.',
        'Secure the boarding platform to protect rescuers and passengers as the final cabin descends.',
        'Bring the last family down, verify that all riders are accounted for, and stop the wheel safely.',
    ],
}
for chapter, notes in ACTION_EXPLANATIONS.items():
    assert len(notes) == 11, chapter
    phrases = [phrase for act in NEW_PATHS[chapter] for phrase in act]
    NEW_DESCRIPTIONS[chapter].update(zip(phrases, notes))
