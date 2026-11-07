"""Optional, authoritative in-scene interventions for every scenario.

Each mission offers one meaningful field decision in each act. These controls
are separate from the mandatory tactical encounter; a squad can finish without
using them. The choices are deliberately limited to once per act so reconnects
or rapid clicks cannot farm time, integrity, or a lower risk meter.
"""

from __future__ import annotations

FIELD_OPERATIONS = {
    "station": (
        {"heading": "HANGAR CONTROL", "context": "Your escape ship is trapped. Choose how the crew buys room to reach the launch corridor.", "options": (
            {"id": "coolant", "label": "OPEN COOLANT BYPASS", "benefit": "Lower reactor heat, but spend precious evacuation time.", "effects": {"meter": -25, "seconds": -9}, "outcome": "Coolant floods the hangar circuit. Red warning lights fade and the docking bay stabilizes."},
            {"id": "shuttle", "label": "POWER THE SHUTTLE", "benefit": "Reinforce crew integrity while the cooling system takes extra strain.", "effects": {"integrity": 14, "meter": 11}, "outcome": "The shuttle cabin powers on. Crew life support returns, but the reactor runs hotter."},
        )},
        {"heading": "FINAL LAUNCH SYSTEMS", "context": "The engines are primed. Decide which protection is worth sacrificing before extraction.", "options": (
            {"id": "vent", "label": "EMERGENCY HEAT VENT", "benefit": "Drop reactor heat sharply; lose 12 seconds of launch time.", "effects": {"meter": -35, "seconds": -12}, "outcome": "The station vents glowing plasma. A safe departure window opens, but it is short."},
            {"id": "beacon", "label": "BOOST RESCUE BEACON", "benefit": "Gain 12 seconds to finish launch, but lose 8 integrity to the signal surge.", "effects": {"seconds": 12, "integrity": -8}, "outcome": "The rescue beacon punches through the static. Allied ships confirm your position."},
        )},
    ),
    "hollow": (
        {"heading": "ENTRANCE HALL", "context": "The house answers every sound. Choose how to keep the corridor open.", "options": (
            {"id": "lamps", "label": "LIGHT THE WARD LAMPS", "benefit": "Push dread back at the cost of 9 seconds.", "effects": {"meter": -27, "seconds": -9}, "outcome": "One lamp ignites, then another. The long hallway lights up and the shadows retreat."},
            {"id": "mirror", "label": "BREAK THE CURSED MIRROR", "benefit": "Protect the team, but the broken seal raises dread.", "effects": {"integrity": 15, "meter": 12}, "outcome": "The mirror fractures. A pursuing spirit vanishes, but the house begins to shake."},
        )},
        {"heading": "CELLAR RITUAL", "context": "Something is rising below the floorboards. What will you risk to complete the ward?", "options": (
            {"id": "circle", "label": "REINFORCE THE CIRCLE", "benefit": "Reduce dread while the ritual takes 10 more seconds.", "effects": {"meter": -31, "seconds": -10}, "outcome": "A ring of candlelight forms around the doorway. The thing in the cellar cannot cross it."},
            {"id": "chant", "label": "CALL THE WARDEN", "benefit": "Recover 11 integrity; risk a surge of supernatural dread.", "effects": {"integrity": 11, "meter": 10}, "outcome": "A distant voice answers the chant. Your squad is protected, but the house knows your names."},
        )},
    ),
    "outbreak": (
        {"heading": "TRIAGE ENTRY", "context": "Infected are at the outer door. Decide where to use your last emergency resources.", "options": (
            {"id": "seal", "label": "SEAL THE TRIAGE DOOR", "benefit": "Rebuild the barricade at the expense of 9 seconds.", "effects": {"meter": 28, "seconds": -9}, "outcome": "Steel shutters slam down. The infected hit the new barrier instead of the lab glass."},
            {"id": "medkit", "label": "TREAT THE RESEARCHER", "benefit": "Restore 17 integrity, but leave the barricade 9 points weaker.", "effects": {"integrity": 17, "meter": -9}, "outcome": "The researcher stands again and rejoins the team. The triage door buckles under another blow."},
        )},
        {"heading": "ANTIDOTE DELIVERY", "context": "The cure is almost ready. Protect the last delivery line before the infected breach the room.", "options": (
            {"id": "foam", "label": "FLOOD WITH SEALING FOAM", "benefit": "Restore 35 barricade points, but spend 12 seconds.", "effects": {"meter": 35, "seconds": -12}, "outcome": "Foam fills the cracks around the blast door. The lab gains a few final minutes of safety."},
            {"id": "airlift", "label": "CALL THE MEDEVAC CREW", "benefit": "Gain 12 seconds for extraction; the backup systems take 9 damage.", "effects": {"seconds": 12, "integrity": -9}, "outcome": "A helicopter responds on the roof frequency. The team now has a route for the completed cure."},
        )},
    ),
    "casefile": (
        {"heading": "HOTEL SECURITY ROOM", "context": "Someone is deleting evidence while you investigate. Choose how to preserve the lead.", "options": (
            {"id": "mirror", "label": "MIRROR THE CAMERA DRIVE", "benefit": "Cut suspicion, but consume 9 seconds imaging the recording.", "effects": {"meter": -27, "seconds": -9}, "outcome": "A second camera archive appears on the caseboard. The killer can no longer erase every copy."},
            {"id": "lock", "label": "LOCK DOWN THE ARCHIVE", "benefit": "Restore 15 integrity, but alert the suspect and raise suspicion.", "effects": {"integrity": 15, "meter": 11}, "outcome": "The archive door locks. Security reaches the records room just as a shadow leaves the hall."},
        )},
        {"heading": "WITNESS PROTECTION", "context": "You are closing in. Make a final choice before you name the killer.", "options": (
            {"id": "safehouse", "label": "MOVE THE KEY WITNESS", "benefit": "Drop suspicion by 31, at a cost of 11 seconds.", "effects": {"meter": -31, "seconds": -11}, "outcome": "The porter vanishes into protective custody. The final testimony is safe."},
            {"id": "warrant", "label": "ISSUE AN URGENT WARRANT", "benefit": "Gain 13 seconds to assemble the case, but strain the team's integrity.", "effects": {"seconds": 13, "integrity": -10}, "outcome": "The judge authorizes a search. Officers close off the service exits before the suspect can flee."},
        )},
    ),
    "dead_air": (
        {"heading": "TRANSMITTER ROOM", "context": "The city hears static. Choose how to stabilize the last emergency radio signal.", "options": (
            {"id": "filter", "label": "FILTER THE JAMMER", "benefit": "Clear interference, but spend 9 seconds tuning the frequency.", "effects": {"meter": -29, "seconds": -9}, "outcome": "The static dissolves. A shelter on the south bank finally answers the radio."},
            {"id": "battery", "label": "REROUTE BACKUP POWER", "benefit": "Restore 16 integrity, but the stronger signal attracts interference.", "effects": {"integrity": 16, "meter": 11}, "outcome": "The generator catches. Transmitter lights surge green as the hostile signal grows louder."},
        )},
        {"heading": "CITYWIDE EVACUATION", "context": "Families are waiting for the final route. Select the best broadcast strategy.", "options": (
            {"id": "relay", "label": "USE THE MOUNTAIN REPEATER", "benefit": "Clear major interference; spend 12 seconds switching transmitters.", "effects": {"meter": -35, "seconds": -12}, "outcome": "A second tower lights up in the hills. Rescue instructions reach beyond the flooded valley."},
            {"id": "volunteers", "label": "DISPATCH RADIO VOLUNTEERS", "benefit": "Gain 13 seconds to finish the route; lose 8 integrity from overloading the tower.", "effects": {"seconds": 13, "integrity": -8}, "outcome": "Volunteers answer from rooftops across the city. Word of the evacuation spreads."},
        )},
    ),
    "last_stop": (
        {"heading": "TRAIN CAB", "context": "The throttle is stuck. The broken bridge is getting closer. Choose an emergency measure.", "options": (
            {"id": "brake", "label": "CHARGE RESERVE AIR BRAKES", "benefit": "Reduce speed, but consume 9 seconds reaching full pressure.", "effects": {"meter": -28, "seconds": -9}, "outcome": "Air whistles through the brake lines. The train stops accelerating for a moment."},
            {"id": "clear", "label": "CLEAR THE PASSENGER AISLES", "benefit": "Restore 16 integrity, but sacrifice speed control while crew prepare.", "effects": {"integrity": 16, "meter": 12}, "outcome": "The conductor clears the aisles and braces passengers. The train continues to gain speed."},
        )},
        {"heading": "FINAL APPROACH", "context": "Raven Bridge is visible ahead. Decide what the engineer should do before the final stop.", "options": (
            {"id": "drag", "label": "DEPLOY TRACK DRAG BRAKES", "benefit": "Cut speed by 36, but spend 11 critical seconds.", "effects": {"meter": -36, "seconds": -11}, "outcome": "Sparks erupt beneath the carriage. The train slows enough for the conductor to breathe."},
            {"id": "warn", "label": "SIGNAL THE REAR CARRIAGES", "benefit": "Gain 12 seconds to stabilize the train; the damaged controller loses 9 integrity.", "effects": {"seconds": 12, "integrity": -9}, "outcome": "Every carriage acknowledges the emergency order. The crew prepares for one final hard stop."},
        )},
    ),
}


from .chapter_missions import CHAPTER_FIELDS
FIELD_OPERATIONS.update(CHAPTER_FIELDS)
from .betrayal_missions import NEW_FIELDS
FIELD_OPERATIONS.update(NEW_FIELDS)


from .legend_missions import LEGEND_FIELDS
FIELD_OPERATIONS.update(LEGEND_FIELDS)

def public_operations(mission: str, stage: int) -> dict:
    """Return copy-safe option descriptions but no internal balancing math."""
    operation = FIELD_OPERATIONS[mission][stage - 1]
    return {
        "heading": operation["heading"],
        "context": operation["context"],
        "options": [{"id": option["id"], "label": option["label"], "benefit": option["benefit"]}
                    for option in operation["options"]],
    }

from .frontier_missions import FRONTIER_FIELDS
FIELD_OPERATIONS.update(FRONTIER_FIELDS)
