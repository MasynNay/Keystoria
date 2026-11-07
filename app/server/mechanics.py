"""Scenario rules and tactical choices.

The engine owns *when* these rules run. This module owns *what* changes for
an orbital emergency, a haunting, or a containment breach. Keeping scenario
math declarative makes balance changes reviewable and independently testable.
"""

from __future__ import annotations

WORLD_RULES = {
    "station": {
        "meter": "REACTOR HEAT", "direction": "high", "initial": 18,
        "hack": 7, "defend": -12, "breach": 19, "pulse": -12,
        "warning": 67, "warning_text": "COOLANT STRAIN / THREATS ACCELERATING",
        "failure": "Reactor temperature exceeded safe limits.",
        "intro": "The reactor is warming with every mainframe intrusion. Defending vents excess heat.",
        "encounter": "COOLANT JUNCTION", "encounter_intro": "The cooling manifold is failing. Choose a recovery plan; your defender must execute it.",
        "choices": {
            "vent": {"label": "VENT THE PLASMA", "description": "Dump heat quickly; sacrifice 9 seconds.",
                     "phrase": "open the plasma exhaust valves", "effects": {"meter": -43, "seconds": -9}},
            "shields": {"label": "REWIRE THE SHIELDS", "description": "Reduce heat and restore integrity; sacrifice 15 seconds.",
                        "phrase": "reroute the shielding circuits", "effects": {"meter": -26, "integrity": 12, "seconds": -15}},
        },
    },
    "hollow": {
        "meter": "DREAD", "direction": "high", "initial": 17,
        "hack": 7, "defend": -11, "breach": 18, "pulse": -14,
        "warning": 65, "warning_text": "THE DARKNESS IS CLOSING IN",
        "failure": "The house consumed the last of your courage.",
        "intro": "Each ritual awakens the house. Banishing a spirit holds the dread at bay.",
        "encounter": "THE BLACKENED CHAPEL", "encounter_intro": "The chapel has two exits, but both require a ritual. Choose one for your partner to perform.",
        "choices": {
            "lantern": {"label": "LIGHT THE WARDS", "description": "Push back the darkness; sacrifice 10 seconds.",
                        "phrase": "ignite the chapel lanterns", "effects": {"meter": -45, "seconds": -10}},
            "sigil": {"label": "READ THE FORBIDDEN SIGIL", "description": "Dispel more dread, but lose 12 integrity.",
                      "phrase": "recite the forbidden sigil", "effects": {"meter": -67, "integrity": -12}},
        },
    },
    "outbreak": {
        "meter": "BARRICADE", "direction": "low", "initial": 84,
        "hack": -3, "defend": 5, "breach": -23, "pulse": 12,
        "warning": 34, "warning_text": "BARRICADE FAILING / SWARM APPROACHING",
        "failure": "The infected breached the final barricade.",
        "intro": "Every research step draws more infected. Your defender must keep the barricade standing.",
        "encounter": "THE TRIAGE LOCK", "encounter_intro": "The infected are converging on the lab. Choose a containment plan for your defender.",
        "choices": {
            "reinforce": {"label": "REINFORCE ENTRY", "description": "Restore 38 barricade points; sacrifice 10 seconds.",
                          "phrase": "weld the triage blast doors", "effects": {"meter": 38, "seconds": -10}},
            "sedate": {"label": "RELEASE THE SEDATIVE", "description": "Restore some barricade and integrity; slow upcoming threats.",
                       "phrase": "vent sedative into the hallway", "effects": {"meter": 18, "integrity": 8, "threat_bonus": 3}},
        },
    },
    "casefile": {
        "meter": "SUSPICION", "direction": "high", "initial": 14,
        "hack": 6, "defend": -11, "breach": 18, "pulse": -14,
        "warning": 65, "warning_text": "THE COVER-UP IS WORKING / EVIDENCE AT RISK",
        "failure": "The case was compromised before you could prove it.",
        "intro": "Each lead alerts the killer. Protecting witnesses and evidence lowers suspicion.",
        "encounter": "THE MISSING FIVE MINUTES",
        "encounter_intro": "The night manager has offered two ways to recover the missing camera footage. Choose a plan for your partner to carry out.",
        "choices": {
            "backup": {"label": "RECOVER THE CAMERA BACKUP", "description": "Recover the original video and reduce suspicion; costs 10 seconds.",
                       "phrase": "recover the security archive", "effects": {"meter": -43, "seconds": -10}},
            "witness": {"label": "PROTECT THE NIGHT PORTER", "description": "Secure the witness and restore integrity; costs 14 seconds.",
                        "phrase": "escort the porter to safety", "effects": {"meter": -24, "integrity": 14, "seconds": -14}},
        },
    },
}


from .new_missions import EXTRA_RULES
WORLD_RULES.update(EXTRA_RULES)
from .chapter_missions import CHAPTER_RULES
WORLD_RULES.update(CHAPTER_RULES)
from .betrayal_missions import NEW_RULES
WORLD_RULES.update(NEW_RULES)

# Successful tactical orders change the plot as well as the pressure meter.

from .legend_missions import LEGEND_RULES
WORLD_RULES.update(LEGEND_RULES)

TACTIC_OUTCOMES = {
    "station": {
        "vent": "Plasma floods out of the exhaust. Reactor heat drops sharply, but your escape window is shorter.",
        "shields": "Shields reroute around the coolant leak. The station steadies, buying the crew a safer launch.",
    },
    "hollow": {
        "lantern": "Chapel lanterns ignite one by one. The darkness retreats from the eastern door.",
        "sigil": "The forbidden symbol glows. The shadow flees, but the ritual burns into your team's remaining strength.",
    },
    "outbreak": {
        "reinforce": "The triage doors weld shut with a metallic crash. The infected lose their fastest approach.",
        "sedate": "Sedative gas hisses into the corridor. The next infected wave slows and the researchers catch their breath.",
    },
    "casefile": {
        "backup": "The missing five minutes of video are restored. Someone deliberately opened the archive with a duplicate key.",
        "witness": "The night porter reaches protection and agrees to testify. The killer has lost a crucial opportunity to silence him.",
    },
    "dead_air": {
        "narrowband": "The radio signal snaps into focus. For the first time tonight, a shelter answers your test broadcast.",
        "relay": "The mountain transmitter comes alive. Evacuation instructions can now reach neighborhoods beyond the flooded valley.",
    },
    "last_stop": {
        "hydraulic": "Hydraulic pressure surges through the brake lines. Train 718 finally begins to decelerate.",
        "magnetic": "The magnetic brake array bites into the rails, slowing the train without further damaging the control network.",
    },
}
for mission, options in TACTIC_OUTCOMES.items():
    for choice, message in options.items():
        WORLD_RULES[mission]["choices"][choice]["outcome"] = message

def risk_level(mission: str, value: int) -> bool:
    """Whether the scenario has crossed its mechanical danger threshold."""
    rule = WORLD_RULES[mission]
    return value >= rule["warning"] if rule["direction"] == "high" else value <= rule["warning"]


def is_failure(mission: str, value: int) -> bool:
    rule = WORLD_RULES[mission]
    return value >= 100 if rule["direction"] == "high" else value <= 0


def public_world(mission: str) -> dict:
    """Only expose decision labels and effects, never unrevealed typing phrases."""
    rule = WORLD_RULES[mission]
    return {
        "label": rule["meter"], "direction": rule["direction"],
        "warningText": rule["warning_text"], "intro": rule["intro"],
        "encounter": rule["encounter"], "encounterIntro": rule["encounter_intro"],
        "choices": [{"id": key, "label": item["label"], "description": item["description"]}
                    for key, item in rule["choices"].items()],
    }

from .frontier_missions import FRONTIER_RULES
WORLD_RULES.update(FRONTIER_RULES)
