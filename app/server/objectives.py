"""Authored mission steps and player-facing consequences.

The engine selects steps by story position. Descriptions explain the tangible
benefit of an action, rather than repeating the target as a vague instruction.
Enemy responses stay unpredictable; narrative progression does not.
"""

from __future__ import annotations

STORY_PATHS = {
    "station": (
        ("override access", "decrypt signal", "reroute power", "restore uplink", "enable shields"),
        ("recover navigation", "unlock airlock", "release docking clamps", "authorize escape", "transmit beacon", "confirm launch sequence"),
    ),
    "hollow": (
        ("light the candles", "read the diary", "trace the sigil", "name the spirit", "restore the circle"),
        ("unlock the cellar", "reveal the passage", "speak the old words", "release the trapped soul", "lift the curse", "open the iron gate"),
    ),
    "outbreak": (
        ("isolate sample", "scan pathogen", "sequence the genome", "analyze infection", "prepare antidote"),
        ("restore lab power", "activate centrifuge", "mix neutralizing agent", "confirm dosage", "enable air filtration", "initiate dispersal"),
    ),
    "casefile": (
        ("review the security footage", "verify the victim timeline", "inspect the archive lock", "cross reference key records", "recover deleted messages"),
        ("interview the night porter", "trace the payment records", "reconstruct the final call", "identify the forged signature", "compile the case report", "secure the original evidence"),
    ),
}

# Each entry answers two questions: what happens, and why it helps you survive,
# escape, solve the case or secure the objective. No executable shell commands.
STEP_DESCRIPTIONS = {
    "station": {
        "override access": "Take control of the locked maintenance console so you can reach the systems controlling your escape route.",
        "decrypt signal": "Decode the scrambled distress frequency so your crew can contact rescuers outside the station.",
        "reroute power": "Move electricity from damaged decks to the escape systems, keeping your launch equipment alive.",
        "unlock airlock": "Open the sealed passage to your escape craft so nobody is trapped behind the bulkhead.",
        "disable firewall": "Remove the hostile digital barrier so your commands can reach the navigation network.",
        "bypass security": "Work around the lockdown without waiting for station security to authorize your evacuation.",
        "restore uplink": "Bring the long-range communications link back online so rescue ships can receive your coordinates.",
        "purge system": "Remove hostile code that could seize your launch controls during evacuation.",
        "initiate reboot": "Restart the damaged controller so the escape console responds to your final launch commands.",
        "authorize escape": "Sign the evacuation request so station safety locks allow the escape craft to depart.",
        "transmit beacon": "Broadcast your live position to nearby rescuers, giving your crew a route to safety.",
        "open blast doors": "Clear a protected corridor to the docking bay while preventing the enemy from sealing it again.",
        "enable shields": "Raise the defensive barrier around the station to buy your crew time against incoming fire.",
        "release docking clamps": "Unfasten the mechanical arms holding your escape craft to the station. Without this, your ship cannot launch, no matter how ready its engines are.",
        "confirm launch sequence": "Complete the final launch checks and commit to departure before the reactor fails.",
        "recover navigation": "Restore the ship's route guidance so you can fly clear of debris and reach the rescue corridor.",
        "sync emergency channel": "Connect your crew's emergency radio to the rescue frequency so you can coordinate extraction.",
        "expose hidden port": "Find the maintenance entry point that lets you reach station systems behind the lockdown.",
        "target locked": "Acquire the attacking drone before it fires so your partner can continue working uninterrupted.",
        "return fire": "Drive back the approaching hostile unit and prevent its next strike against your systems.",
        "evasive action": "Move out of the threat's line of fire to preserve your crew's integrity.",
        "shield burst": "Trigger a short defensive surge to absorb the attack before it reaches your terminal.",
        "disable drone": "Interrupt the drone's control link so it stops attacking your escape route.",
        "clear the deck": "Push enemy units away from the access corridor and keep the path to the docking bay open.",
        "intercept signal": "Block an enemy transmission before it can disrupt your evacuation uplink.",
        "hold your ground": "Keep the defensive position secure while your partner finishes a critical system command.",
        "pulse cannon": "Stun nearby attackers with a powered burst to buy precious seconds.",
        "emergency countermeasure": "Activate the emergency defense system to prevent an imminent hull breach.",
        "suppress fire": "Prevent hostile units from aiming at the console while your team restores the ship.",
        "jam frequencies": "Scramble the enemy's coordination channel to reduce incoming attacks.",
        "defend the uplink": "Protect the only working rescue signal so the crew is not stranded without contact.",
        "power surge": "Discharge stored energy at nearby enemies to interrupt their approach.",
        "protect the terminal": "Stop intruders from damaging the computer carrying out your escape sequence.",
        "stabilize reactor core": "Stop the reactor from melting down so the hacker can regain access and finish evacuation.",
        "open the plasma exhaust valves": "Vent the overheating plasma, reducing reactor heat at the cost of precious mission time.",
        "reroute the shielding circuits": "Move power into emergency shielding to cool the system and restore your squad's integrity.",
    },
    "hollow": {
        "light the candles": "Illuminate the ritual chamber so your team can read its symbols and keep the darkness at bay.",
        "turn the key": "Unlock the old mechanism blocking the next room and reveal another part of the house.",
        "break the seal": "Weaken the ward that is trapping your crew inside the estate.",
        "read the diary": "Discover the family's account of the haunting and identify which ritual can open the exit.",
        "trace the sigil": "Recreate the protective symbol so the spirits cannot interrupt your next step.",
        "uncover the truth": "Reveal what bound the missing family to the estate and how you can free them.",
        "name the spirit": "Identify the entity controlling the house; its true name makes the binding ritual possible.",
        "unlock the cellar": "Open the cellar where the missing pages of the ritual are hidden.",
        "follow the footsteps": "Track the apparition's path to find a hidden route through the locked rooms.",
        "break the mirror": "Destroy the surface the spirits are using to watch and mislead your team.",
        "lift the curse": "Undo the binding that keeps every door sealed, bringing your team close to escape.",
        "open the iron gate": "Unseal the estate's final exit so your crew can leave the grounds before dawn.",
        "speak the old words": "Recite the recovered incantation to weaken the house's control over the doors.",
        "reveal the passage": "Expose a concealed corridor and avoid the spirit-filled main hallway.",
        "restore the circle": "Repair the protective ritual circle so your partner can hold back the haunting.",
        "release the trapped soul": "Free the spirit sustaining the curse, weakening the house before the final escape.",
        "stay in the light": "Keep the apparition outside the illuminated perimeter and prevent a direct attack.",
        "do not look back": "Resist the spirit's lure and avoid being pulled away from the safe route.",
        "close your eyes": "Break the ghost's hypnotic influence before it can take control of you.",
        "keep the door shut": "Hold the entryway while your partner completes the next part of the ritual.",
        "salt the doorway": "Draw a protective boundary that spirits cannot cross to reach your team.",
        "hold the lantern": "Keep a safe pocket of light around the investigators as the house darkens.",
        "banish the shadow": "Drive the pursuing entity back into the dark before it breaks your defenses.",
        "the mirror lies": "Reject a false image planted to divert you from the real escape route.",
        "do not answer": "Ignore the spirit's imitation of a familiar voice and prevent it from drawing you out.",
        "hide from the watcher": "Conceal your position long enough for your partner to finish the incantation.",
        "light drives it back": "Brighten the protective ward to force the entity away from your safe room.",
        "protect the circle": "Keep the ritual boundary intact so the curse can actually be lifted.",
        "speak the true name": "Compel the Hollow One to retreat, reopening the ritual your partner needs to escape.",
        "ignite the chapel lanterns": "Illuminate both exits of the chapel and reduce the dread surrounding your crew.",
        "recite the forbidden sigil": "Force the darkness back with a powerful ritual, accepting the toll it takes on the team.",
    },
    "outbreak": {
        "isolate sample": "Separate a clean specimen from contaminated material so the cure starts with reliable data.",
        "scan pathogen": "Measure the infection's structure to learn which treatment might stop its spread.",
        "unlock cold storage": "Retrieve the preserved specimens needed for a working antidote.",
        "sequence the genome": "Read the pathogen's genetic code to locate its weakness and design a treatment.",
        "prepare antidote": "Assemble the first treatment formula so the lab can test a cure instead of just containing symptoms.",
        "sterilize chamber": "Remove contaminants that could ruin your treatment or infect the remaining researchers.",
        "analyze infection": "Compare results from infected samples to confirm the antidote targets the real threat.",
        "mix neutralizing agent": "Combine the active ingredients that can deactivate the infection in patients.",
        "activate centrifuge": "Separate the treatment components so the effective ingredient can be safely collected.",
        "restore lab power": "Bring critical research equipment back online before the backup batteries die.",
        "release the serum": "Move the prepared dose into the delivery system where it can be administered.",
        "enable air filtration": "Prepare the airflow system to distribute treatment without spreading airborne contaminants.",
        "decrypt medical files": "Recover the earlier research notes needed to avoid repeating failed experiments.",
        "confirm dosage": "Verify the treatment strength before distribution so you do not harm survivors.",
        "initiate dispersal": "Release the finished antidote through the safe delivery system to save the quarantined sector.",
        "seal the quarantine": "Keep infected individuals contained while the antidote takes effect.",
        "reinforce the door": "Strengthen the entrance before another infected surge can reach your lab.",
        "hold the line": "Maintain the defensive perimeter and protect the scientist preparing the antidote.",
        "close the shutters": "Block exposed windows and stop the infected from surrounding the team.",
        "clear the hallway": "Push approaching infected away from the laboratory entrance.",
        "protect the lab": "Keep the research equipment intact so the cure can be completed.",
        "fallback position": "Retreat to the stronger barrier without leaving your partner exposed.",
        "seal the breach": "Close a damaged access point before infected can reach your workspace.",
        "stay together": "Prevent your team from being separated during the incoming swarm.",
        "block the entrance": "Fortify the main approach and buy the scientist more research time.",
        "cover the stairs": "Stop infected from reaching the upper-level treatment room.",
        "lock the gate": "Secure the perimeter gate to slow the next infected wave and keep the researchers safe.",
        "check the perimeter": "Spot weak barricade points before the swarm exploits them.",
        "seal the final bulkhead": "Close the last breached wall, reopening the research terminal before the lab is overrun.",
        "weld the triage blast doors": "Reinforce the main barrier and restore a large amount of barricade strength.",
        "vent sedative into the hallway": "Slow the infected advance and recover precious integrity for the remaining researchers.",
    },
    "casefile": {
        "review the security footage": "Locate the victim's final recorded movements and establish when someone entered the archive.",
        "verify the victim timeline": "Cross-check the victim's last known whereabouts to uncover gaps in every suspect's alibi.",
        "inspect the archive lock": "Look for signs of duplicate-key access and determine who could enter the supposedly locked room.",
        "cross reference key records": "Compare the access ledger against staff duties to narrow the list of people who could unlock the archive.",
        "interview the night porter": "Question the employee who worked that shift to verify the timeline without relying solely on camera footage.",
        "recover deleted messages": "Restore erased communications that may reveal what the victim discovered before being killed.",
        "examine the antique bell": "Inspect a strange object mentioned in testimony for evidence overlooked at the scene.",
        "compare the fingerprints": "Check whether prints on the archive items match anyone with authorized access.",
        "trace the payment records": "Follow unusual money transfers to uncover a motive hidden behind the crime.",
        "search the restoration ledger": "Read conservation records to see whether a valuable painting was switched or forged.",
        "reconstruct the final call": "Restore the victim's last conversation to identify what they knew and whom they feared.",
        "identify the forged signature": "Compare handwriting and seals to connect evidence tampering to a specific person.",
        "preserve the witness statement": "Store a verified copy so later intimidation cannot erase the witness's account.",
        "decrypt the archive backup": "Open a protected duplicate of the records before the cover-up destroys the originals.",
        "expose the hidden alibi": "Reveal the contradiction between a suspect's claim and the surviving evidence.",
        "compile the case report": "Bring the timeline, motive, and records into one coherent accusation supported by proof.",
        "secure the original evidence": "Protect the physical records so the final accusation stands after investigators leave.",
        "name the responsible party": "Use the assembled evidence to identify the person behind the murder.",
        "preserve camera footage": "Prevent deletion of the video needed to verify the victim's final movements.",
        "lock the evidence vault": "Block unauthorized access so no one can remove the physical proof.",
        "protect the witness": "Keep a witness safe from intimidation while the investigator checks their story.",
        "back up the case files": "Make a second copy of evidence before an attacker can wipe the original.",
        "isolate the archive network": "Cut off the intruder's remote access to the case database.",
        "stop the file purge": "Interrupt an active deletion attempt before it destroys the investigation.",
        "verify chain of custody": "Ensure every piece of evidence is documented and admissible in the final case.",
        "seal the interview room": "Secure private testimony against an intruder who wants to disrupt questioning.",
        "flag a forged timestamp": "Mark manipulated camera metadata so the false alibi cannot mislead the investigation.",
        "secure the phone records": "Protect the victim's call history from tampering or deletion.",
        "block unauthorized access": "Reject an attempt to enter the case archive without an investigator's clearance.",
        "restore the access logs": "Recover who entered the archive even if the attacker erased the live system.",
        "halt the shredder": "Stop the destruction of documents that could link a suspect to the forgery.",
        "protect the crime scene": "Preserve the physical clues before anyone can rearrange or remove them.",
        "restore the original archive backup": "Retrieve the untampered evidence before the cover-up can erase the murder's paper trail.",
        "recover the security archive": "Restore the missing camera footage and lower suspicion surrounding your investigation.",
        "escort the porter to safety": "Protect the key witness from threats, preserving testimony and team integrity.",
    },
}


def step_description(mission: str, phrase: str) -> str:
    """An explicit, spoiler-safe explanation for each possible typing target."""
    return STEP_DESCRIPTIONS[mission][phrase]


from .new_missions import EXTRA_PATHS, EXTRA_DESCRIPTIONS
STORY_PATHS.update(EXTRA_PATHS)
STEP_DESCRIPTIONS.update(EXTRA_DESCRIPTIONS)

from .chapter_missions import CHAPTER_PATHS, CHAPTER_DESCRIPTIONS
STORY_PATHS.update(CHAPTER_PATHS)
STEP_DESCRIPTIONS.update(CHAPTER_DESCRIPTIONS)
from .betrayal_missions import NEW_PATHS, NEW_DESCRIPTIONS
STORY_PATHS.update(NEW_PATHS)
STEP_DESCRIPTIONS.update(NEW_DESCRIPTIONS)

from .legend_missions import LEGEND_PATHS, LEGEND_DESCRIPTIONS
STORY_PATHS.update(LEGEND_PATHS)
STEP_DESCRIPTIONS.update(LEGEND_DESCRIPTIONS)

from .frontier_missions import FRONTIER_PATHS, FRONTIER_DESCRIPTIONS
STORY_PATHS.update(FRONTIER_PATHS)
STEP_DESCRIPTIONS.update(FRONTIER_DESCRIPTIONS)
