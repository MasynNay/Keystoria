"""Authoritative, in-memory room and mission state machine.

No networking is imported here, which makes progression, role swaps and score
calculation independently testable. All time is monotonic and injectable.
"""

from __future__ import annotations

import random
import secrets
import time
from dataclasses import dataclass, field
from typing import Callable

from .content import MISSIONS, PUBLIC_MISSIONS
from .field_operations import FIELD_OPERATIONS, public_operations
from .mechanics import WORLD_RULES, is_failure, public_world, risk_level
from .objectives import STORY_PATHS, step_description

ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
MAX_ROOM_AGE = 45 * 60
STALE_ROOM_AGE = 15 * 60
RECONNECT_GRACE = 90
MISSION_SECONDS = 210
STAGE_GOALS = (5, 6)

# Tunable presets live with the simulation, never in client-provided math.
DIFFICULTIES = {
    "story": {"label": "Cadet", "seconds": 270, "threat_scale": 1.35, "damage": 11, "mistake": 1},
    "standard": {"label": "Standard", "seconds": 210, "threat_scale": 1.0, "damage": 17, "mistake": 2},
    "overdrive": {"label": "Overdrive", "seconds": 165, "threat_scale": 0.75, "damage": 23, "mistake": 3},
}
SYNC_COST = 4
PING_MESSAGES = {
    "help": "REQUESTING SUPPORT",
    "steady": "HOLD STEADY",
    "ready": "READY FOR THE SWITCH",
}



def normalized(value: str) -> str:
    """Normalize only case and accidental spacing, not semantic content."""
    return " ".join(value.lower().split())


@dataclass
class Player:
    id: str
    token: str
    name: str
    is_bot: bool = False
    connected: bool = True
    score: int = 0
    correct: int = 0
    mistakes: int = 0
    streak: int = 0
    best_streak: int = 0
    submitted_chars: int = 0
    successful_chars: int = 0
    last_submission: float = 0.0
    disconnected_at: float | None = None
    last_ping: float = -100.0


@dataclass
class Room:
    code: str
    mission: str
    host_id: str
    players: list[Player]
    created: float
    touched: float
    difficulty: str = "standard"
    rng: random.Random = field(default_factory=random.Random)
    phase: str = "lobby"
    stage: int = 1
    progress: int = 0
    stability: int = 100
    remaining: float = MISSION_SECONDS
    last_tick: float = 0.0
    paused_since: float | None = None
    switch_until: float = 0.0
    countdown_until: float = 0.0
    briefing_ready: set[str] = field(default_factory=set)
    launch_ready: set[str] = field(default_factory=set)
    discoveries: list[str] = field(default_factory=list)
    accusation_active: bool = False
    accusation_triggered: bool = False
    accusation_verdict: str = ""
    accusation_attempts: int = 0
    accusation_cooldown_until: float = 0.0
    target_seq: int = 0
    hack_target: dict | None = None
    threat_target: dict | None = None
    threat_bag: list[str] = field(default_factory=list)
    last_normal_threat: str = ""
    threat_due: float = 0.0
    next_threat_at: float = 0.0
    next_bot_at: float = 0.0
    logs: list[dict] = field(default_factory=list)
    final_score: int = 0
    final_grade: str = ""
    finish_reason: str = ""
    sync_charge: int = 0
    sync_contributors: set[str] = field(default_factory=set)
    pulses_used: int = 0
    threat_total: float = 13.0
    crisis_active: bool = False
    crisis_triggered: bool = False
    ambient: int = 0
    tactic_active: bool = False
    tactic_triggered: bool = False
    tactic_choice: str | None = None
    threat_bonus: float = 0.0
    run_id: str = ""
    story_moment: str = ""
    story_recap: list[str] = field(default_factory=list)
    field_actions: dict[int, str] = field(default_factory=dict)
    field_history: list[dict] = field(default_factory=list)

    def story_event(self, message: str) -> None:
        """Record a bounded narrative consequence for the end-of-run chronicle."""
        self.story_moment = message
        self.story_recap.append(message)
        del self.story_recap[:-14]
        self.event(message, "good")

    def player(self, player_id: str) -> Player | None:
        return next((p for p in self.players if p.id == player_id), None)

    def role_for(self, player_id: str) -> str:
        index = next((i for i, p in enumerate(self.players) if p.id == player_id), -1)
        if index == -1:
            return "spectator"
        return "hacker" if index == (0 if self.stage == 1 else 1) else "defender"

    @property
    def is_solo(self) -> bool:
        return any(player.is_bot for player in self.players)

    def event(self, message: str, kind: str = "info") -> None:
        self.logs.insert(0, {"message": message, "kind": kind, "id": secrets.token_hex(4)})
        del self.logs[7:]


class GameError(Exception):
    """An expected user-facing action error (not a server fault)."""


class GameEngine:
    def __init__(self, clock: Callable[[], float] = time.monotonic):
        self.clock = clock
        self.rooms: dict[str, Room] = {}

    def _new_id(self) -> str:
        return secrets.token_urlsafe(12)

    def create(self, name: str, mission: str = "station", solo: bool = False) -> tuple[Room, Player]:
        if mission not in MISSIONS:
            raise GameError("Unknown mission.")
        if len(self.rooms) >= 1000:
            raise GameError("The game is at capacity. Try again shortly.")
        code = "".join(secrets.choice(ROOM_ALPHABET) for _ in range(6))
        while code in self.rooms:
            code = "".join(secrets.choice(ROOM_ALPHABET) for _ in range(6))
        now = self.clock()
        owner = Player(self._new_id(), self._new_id(), self._clean_name(name))
        players = [owner]
        if solo:
            players.append(Player(self._new_id(), self._new_id(), "ECHO / AI", True))
        room = Room(code, mission, owner.id, players, now, now, rng=random.Random(secrets.randbits(64)))
        self.rooms[code] = room
        room.event("Squad link initialized. Awaiting mission start.")
        return room, owner

    @staticmethod
    def _clean_name(name: str) -> str:
        clean = " ".join(str(name).strip().split())[:18]
        if not clean:
            raise GameError("Enter a callsign first.")
        if any(ord(char) < 32 for char in clean):
            raise GameError("Callsign contains invalid characters.")
        return clean

    def join(self, code: str, name: str) -> tuple[Room, Player]:
        room = self.rooms.get(str(code).upper().strip())
        if not room:
            raise GameError("Room not found. Check the six-character code.")
        if room.phase != "lobby":
            raise GameError("This mission has already started.")
        if len(room.players) >= 2:
            raise GameError("This room already has two operators.")
        player = Player(self._new_id(), self._new_id(), self._clean_name(name))
        if not room.players:
            room.host_id = player.id  # Repair a lobby whose original host departed.
        room.players.append(player)
        room.touched = self.clock()
        room.event(f"{player.name} has joined the squad.", "good")
        return room, player

    def reconnect(self, code: str, token: str) -> tuple[Room, Player]:
        room = self.rooms.get(str(code).upper().strip())
        if not room:
            raise GameError("This room has expired. Start a new mission.")
        player = next((p for p in room.players if p.token == token and not p.is_bot), None)
        if not player:
            raise GameError("Your reconnect pass is no longer valid.")
        player.connected = True
        player.disconnected_at = None
        room.touched = self.clock()
        if room.paused_since is not None and all(p.connected for p in room.players):
            pause = self.clock() - room.paused_since
            # The countdown and all scheduled actions must freeze together.
            if room.threat_target:
                room.threat_due += pause
            if room.next_threat_at:
                room.next_threat_at += pause
            if room.next_bot_at:
                room.next_bot_at += pause
            if room.phase == "switching":
                room.switch_until += pause
            if room.phase == "countdown":
                room.countdown_until += pause
            room.paused_since = None
            room.last_tick = self.clock()
            room.event("Squad connection restored.", "good")
        return room, player

    def disconnect(self, room: Room, player: Player) -> None:
        player.connected = False
        player.disconnected_at = self.clock()
        room.touched = self.clock()
        if room.phase in ("playing", "switching", "countdown", "armed") and room.paused_since is None:
            room.paused_since = self.clock()
            room.event(f"{player.name} lost connection. Mission paused.", "warning")

    def change_mission(self, room: Room, player: Player, mission: str) -> None:
        if room.phase != "lobby" or player.id != room.host_id:
            raise GameError("Only the host can change missions before launch.")
        if mission not in MISSIONS:
            raise GameError("Unknown mission.")
        room.mission = mission
        room.touched = self.clock()
        room.event(f"New operation selected: {MISSIONS[mission]['title']}.")

    def change_difficulty(self, room: Room, player: Player, difficulty: str) -> None:
        """Only the host can choose a difficulty, and only before launch."""
        if room.phase != "lobby" or player.id != room.host_id:
            raise GameError("Only the host can change difficulty before launch.")
        if difficulty not in DIFFICULTIES:
            raise GameError("Unknown difficulty.")
        room.difficulty = difficulty
        room.touched = self.clock()
        room.event(f"Difficulty set to {DIFFICULTIES[difficulty]['label']}.")

    def rematch(self, room: Room, player: Player) -> None:
        """Return an established squad to its lobby without recycling identity tokens."""
        if player.id != room.host_id:
            raise GameError("Only the host can request a rematch.")
        if room.phase not in ("won", "lost"):
            raise GameError("Finish the mission before requesting a rematch.")
        now = self.clock()
        room.phase = "lobby"
        room.stage = 1
        room.progress = 0
        room.stability = 100
        room.remaining = DIFFICULTIES[room.difficulty]["seconds"]
        room.last_tick = now
        room.paused_since = None
        room.switch_until = 0
        room.countdown_until = 0
        room.briefing_ready.clear()
        room.launch_ready.clear()
        room.discoveries.clear()
        room.story_moment = ""
        room.story_recap.clear()
        room.field_actions.clear()
        room.field_history.clear()
        room.accusation_active = room.accusation_triggered = False
        room.accusation_verdict = ""
        room.accusation_attempts = 0
        room.accusation_cooldown_until = 0
        room.hack_target = room.threat_target = None
        room.threat_bag.clear()
        room.last_normal_threat = ""
        room.next_threat_at = room.next_bot_at = 0
        room.target_seq = 0
        room.sync_charge = room.pulses_used = 0
        room.sync_contributors.clear()
        room.crisis_active = room.crisis_triggered = False
        room.tactic_active = room.tactic_triggered = False
        room.tactic_choice = None
        room.ambient = WORLD_RULES[room.mission]["initial"]
        room.threat_bonus = 0
        room.run_id = ""
        room.final_score = 0
        room.final_grade = ""
        room.finish_reason = ""
        room.logs.clear()
        room.touched = now
        for teammate in room.players:
            teammate.score = teammate.correct = teammate.mistakes = 0
            teammate.streak = teammate.best_streak = teammate.submitted_chars = 0
            teammate.last_submission = 0.0
            teammate.successful_chars = 0
            teammate.last_ping = -100.0
        room.event("Squad regrouped. Ready for another operation.", "good")

    def ping(self, room: Room, player: Player, code: str) -> None:
        """Allow fixed squad signals, without carrying arbitrary user chat text."""
        if room.phase not in ("playing", "switching") or room.paused_since is not None:
            raise GameError("Squad signals are available during active missions.")
        if code not in PING_MESSAGES:
            raise GameError("Unknown squad signal.")
        now = self.clock()
        if now - player.last_ping < 5:
            raise GameError("Squad signal cooling down.")
        player.last_ping = now
        room.touched = now
        room.event(f"{player.name} / {PING_MESSAGES[code]}", "signal")

    def pulse(self, room: Room, player: Player) -> None:
        """A shared rescue action which requires contributions from both roles."""
        if room.phase != "playing" or room.paused_since is not None:
            raise GameError("Signal pulse is only available during active gameplay.")
        if room.sync_charge < SYNC_COST or room.sync_contributors != {p.id for p in room.players}:
            raise GameError("Both operators must contribute to charge the signal pulse.")
        room.sync_charge = 0
        room.sync_contributors.clear()
        room.pulses_used += 1
        room.stability = min(100, room.stability + 6)
        self._change_ambient(room, WORLD_RULES[room.mission]["pulse"])
        if room.threat_target:
            room.threat_due += 4
            room.threat_total += 4
        room.touched = self.clock()
        room.event(f"{player.name} activated SIGNAL PULSE. Integrity restored.", "good")

    def operate_field(self, room: Room, player: Player, action: str) -> None:
        """Apply one in-world intervention per act. Both operators share it.

        The rules and effects live on the server. Browser clients can only
        request an action ID from the current act's predeclared options.
        """
        if room.phase != "playing" or room.paused_since is not None:
            raise GameError("Field controls are only available during active gameplay.")
        if player.is_bot or room.player(player.id) is not player:
            raise GameError("Only a connected human operator can use field controls.")
        if room.progress < 1:
            raise GameError("Complete one objective in this act to unlock field controls.")
        if room.stage in room.field_actions:
            raise GameError("Your squad already committed its field action for this act.")
        choices = FIELD_OPERATIONS[room.mission][room.stage - 1]["options"]
        option = next((item for item in choices if item["id"] == action), None)
        if option is None:
            raise GameError("Unknown field operation.")
        effects = option["effects"]
        room.field_actions[room.stage] = option["id"]
        room.remaining = max(0, min(DIFFICULTIES[room.difficulty]["seconds"] + 30,
                                    room.remaining + effects.get("seconds", 0)))
        room.stability = max(0, min(100, room.stability + effects.get("integrity", 0)))
        room.field_history.append({"stage": room.stage, "label": option["label"],
                                   "outcome": option["outcome"], "operator": player.name})
        room.story_event(f"{player.name} / {option['outcome']}")
        self._change_ambient(room, effects.get("meter", 0))
        room.touched = self.clock()
        if room.phase == "playing" and (room.remaining <= 0 or room.stability <= 0):
            self._finish(room, False)

    def _charge_sync(self, room: Room, player_id: str) -> None:
        room.sync_contributors.add(player_id)
        room.sync_charge = min(SYNC_COST, room.sync_charge + 1)

    def start(self, room: Room, player: Player) -> None:
        """Open the mission briefing; gameplay begins only after both operators ready up."""
        if player.id != room.host_id:
            raise GameError("Only the host can launch the mission.")
        if room.phase != "lobby":
            raise GameError("The mission is already underway.")
        if len(room.players) != 2 or not all(p.connected for p in room.players):
            raise GameError("You need two connected operators to launch.")
        now = self.clock()
        room.phase = "briefing"
        room.stage = 1
        room.progress = 0
        room.stability = 100
        room.remaining = DIFFICULTIES[room.difficulty]["seconds"]
        room.sync_charge = room.pulses_used = 0
        room.sync_contributors.clear()
        room.crisis_active = room.crisis_triggered = False
        room.tactic_active = room.tactic_triggered = False
        room.tactic_choice = None
        room.ambient = WORLD_RULES[room.mission]["initial"]
        room.threat_bonus = 0
        room.run_id = secrets.token_hex(8)
        room.finish_reason = ""
        room.last_tick = now
        room.countdown_until = 0
        room.briefing_ready = {p.id for p in room.players if p.is_bot}
        room.launch_ready = {p.id for p in room.players if p.is_bot}
        room.discoveries.clear()
        room.story_moment = ""
        room.story_recap.clear()
        room.field_actions.clear()
        room.field_history.clear()
        room.accusation_active = room.accusation_triggered = False
        room.accusation_verdict = ""
        room.accusation_attempts = 0
        room.accusation_cooldown_until = 0
        room.hack_target = room.threat_target = None
        room.threat_due = room.next_threat_at = room.next_bot_at = 0
        room.threat_bag.clear()
        room.last_normal_threat = ""
        room.touched = now
        room.event("Operation briefing received. Read your assignments and confirm readiness.")

    def ready(self, room: Room, player: Player) -> None:
        """A deliberate ready check prevents either teammate from being surprised by launch."""
        if room.phase != "briefing":
            raise GameError("Your squad is not at the mission briefing.")
        if not player.connected or player.is_bot:
            raise GameError("Operator unavailable.")
        room.briefing_ready.add(player.id)
        room.touched = self.clock()
        if room.briefing_ready == {p.id for p in room.players} and all(p.connected for p in room.players):
            room.phase = "countdown"
            room.countdown_until = self.clock() + 10.0
            room.event("All operators confirmed. Review your mission. Ten-second countdown begins; the clock remains paused.", "good")
        else:
            room.event(f"{player.name} confirmed readiness. Awaiting partner.", "signal")

    def launch(self, room: Room, player: Player) -> None:
        """A second, explicit start gate after the countdown.

        Each human opts in independently.  ECHO is pre-confirmed, allowing a
        solo game to launch with one click.  Threats and time are dormant until
        the final operator confirms; duplicate launch messages are harmless.
        """
        if room.phase != "armed":
            raise GameError("Finish the countdown before pressing Play.")
        if not player.connected or player.is_bot:
            raise GameError("Operator unavailable.")
        if room.paused_since is not None or not all(p.connected for p in room.players):
            raise GameError("Wait for your partner to reconnect.")
        room.launch_ready.add(player.id)
        room.touched = self.clock()
        if room.launch_ready == {p.id for p in room.players}:
            self._go_live(room, self.clock())
        else:
            room.event(f"{player.name} is ready to play. Awaiting partner confirmation.", "signal")

    def _go_live(self, room: Room, now: float) -> None:
        """No threats, bot actions or mission time are consumed during briefing/countdown."""
        room.phase = "playing"
        room.countdown_until = 0
        room.last_tick = now
        room.event("OPERATION LIVE. Execute your assignment.", "warning")
        room.event(WORLD_RULES[room.mission]["intro"])
        room.event(room.rng.choice(MISSIONS[room.mission]["log"]))
        self._new_hack(room)
        self._new_threat(room, now)
        room.next_bot_at = now + 5

    def _discover(self, room: Room) -> None:
        """Narrative clues become permanent run evidence, not just transient feed rows."""
        clue = MISSIONS[room.mission].get("discoveries", {}).get((room.stage, room.progress))
        if clue and clue not in room.discoveries:
            room.discoveries.append(clue)
            room.event(f"NEW EVIDENCE / {clue}", "good")

    def _begin_accusation(self, room: Room) -> None:
        """The mystery ends with a decision based on collected clues, not another phrase."""
        room.accusation_active = room.accusation_triggered = True
        room.hack_target = None
        room.event("FINAL DEDUCTION. Reconstruct the motive and accuse one suspect.", "warning")

    def accuse(self, room: Room, player: Player, suspect: str) -> None:
        """Only the investigator may accuse; a wrong guess has a tangible cost."""
        if room.phase != "playing" or room.paused_since is not None or not room.accusation_active:
            raise GameError("There is no active accusation to resolve.")
        if room.role_for(player.id) != "hacker":
            raise GameError("Only the investigator can issue the final accusation.")
        if self.clock() < room.accusation_cooldown_until:
            raise GameError("Review the evidence before making another accusation.")
        suspects = MISSIONS["casefile"]["suspects"]
        if suspect not in {s["id"] for s in suspects}:
            raise GameError("Choose one of the listed suspects.")
        room.accusation_attempts += 1
        room.touched = self.clock()
        if suspect == MISSIONS["casefile"]["culprit"]:
            room.accusation_active = False
            room.accusation_verdict = next(s["name"] for s in suspects if s["id"] == suspect)
            room.event("DEDUCTION CONFIRMED. The key, forged painting, and hidden payments all connect.", "good")
            self._new_hack(room)
            return
        room.accusation_cooldown_until = self.clock() + 2.0
        room.stability = max(0, room.stability - 10)
        room.event("Alibi unbroken. Your accusation tipped off the killer. Integrity -10.", "warning")
        self._change_ambient(room, 12)
        if room.stability == 0:
            self._finish(room, False)

    def _change_ambient(self, room: Room, amount: int) -> None:
        """Update the world's second failure condition after an action resolves."""
        before = risk_level(room.mission, room.ambient)
        room.ambient = max(0, min(100, room.ambient + amount))
        if is_failure(room.mission, room.ambient):
            room.event(WORLD_RULES[room.mission]["failure"], "warning")
            self._finish(room, False, WORLD_RULES[room.mission]["failure"])
        elif risk_level(room.mission, room.ambient) and not before:
            room.event(WORLD_RULES[room.mission]["warning_text"], "warning")

    def _begin_tactic(self, room: Room) -> None:
        """At the first midpoint the hacker proposes a plan the defender executes."""
        room.tactic_active = room.tactic_triggered = True
        room.tactic_choice = None
        room.hack_target = None
        room.event(WORLD_RULES[room.mission]["encounter_intro"], "warning")

    def choose_tactic(self, room: Room, player: Player, choice: str) -> None:
        if room.phase != "playing" or room.paused_since is not None:
            raise GameError("Cannot choose a plan outside an active mission.")
        if not room.tactic_active or room.tactic_choice is not None:
            raise GameError("There is no tactical decision to make.")
        if room.role_for(player.id) != "hacker":
            raise GameError("The current hacker must choose the plan.")
        rule = WORLD_RULES[room.mission]
        if choice not in rule["choices"]:
            raise GameError("Unknown tactical plan.")
        room.tactic_choice = choice
        room.event(f"{player.name} chose {rule['choices'][choice]['label']}. Defender, execute it!", "signal")
        self._new_threat(room, self.clock())
        room.touched = self.clock()

    def _finish_tactic(self, room: Room, success: bool) -> None:
        choice = room.tactic_choice
        if choice is None:
            return
        room.tactic_active = False
        room.tactic_choice = None
        if success:
            effects = WORLD_RULES[room.mission]["choices"][choice]["effects"]
            room.remaining = max(0, room.remaining + effects.get("seconds", 0))
            room.stability = max(0, min(100, room.stability + effects.get("integrity", 0)))
            room.threat_bonus += effects.get("threat_bonus", 0)
            self._change_ambient(room, effects.get("meter", 0))
            room.story_event(WORLD_RULES[room.mission]["choices"][choice]["outcome"])
        else:
            room.stability = max(0, room.stability - 8)
            room.event("Tactical maneuver failed. Emergency bypass used. Integrity -8.", "warning")
        if room.phase != "playing":
            return
        if room.remaining == 0 or room.stability == 0:
            self._finish(room, False)
        else:
            self._new_hack(room)

    def _new_hack(self, room: Room) -> None:
        room.target_seq += 1
        # A curated step order gives each command a narrative consequence.
        # Incoming threats remain randomized, preserving replayability.
        text = STORY_PATHS[room.mission][room.stage - 1][room.progress]
        room.hack_target = {
            "id": f"H{room.target_seq}",
            "text": text,
            "explanation": step_description(room.mission, text),
        }

    def _new_threat(self, room: Room, now: float) -> None:
        room.target_seq += 1
        content = MISSIONS[room.mission]
        previous = room.threat_target["text"] if room.threat_target else None
        # Draw regular defenses from a shuffled deck. Every phrase appears once
        # before any repeats, avoiding the "same jammer three times" problem.
        # Special tactical/crisis prompts do not consume regular cards.
        if not room.threat_bag:
            room.threat_bag = list(content["defense"])
            room.rng.shuffle(room.threat_bag)
            if len(room.threat_bag) > 1 and room.threat_bag[-1] == room.last_normal_threat:
                room.threat_bag[0], room.threat_bag[-1] = room.threat_bag[-1], room.threat_bag[0]
        defender = next(p for p in room.players if room.role_for(p.id) == "defender")
        preset = DIFFICULTIES[room.difficulty]
        duration = max(5.5, (13 - (room.stage - 1) * 1.7 - min(defender.streak, 8) * 0.35 + room.threat_bonus) * preset["threat_scale"])
        if risk_level(room.mission, room.ambient):
            duration *= .84  # A failing world mechanic makes defense more demanding.
        if room.crisis_active or (room.tactic_active and room.tactic_choice):
            duration = max(11, 18 * preset["threat_scale"])
        tactic = (room.tactic_active and room.tactic_choice is not None)
        plan = WORLD_RULES[room.mission]["choices"].get(room.tactic_choice) if tactic else None
        phrase = (plan["phrase"] if plan else content["crisis_phrase"]
                  if room.crisis_active else room.threat_bag.pop())
        if not room.crisis_active and not plan:
            room.last_normal_threat = phrase
        room.threat_target = {
            "id": f"D{room.target_seq}",
            "text": phrase,
            "explanation": step_description(room.mission, phrase),
            "name": WORLD_RULES[room.mission]["encounter"] if plan else content["crisis_name"] if room.crisis_active else room.rng.choice(content["threats"]),
            "critical": room.crisis_active or bool(plan),
        }
        room.threat_total = duration
        room.threat_due = now + duration
        room.next_threat_at = 0.0

    def submit(self, room: Room, player: Player, target_id: str, value: str) -> bool:
        now = self.clock()
        if room.phase != "playing" or room.paused_since is not None:
            raise GameError("The mission is not accepting commands right now.")
        if player.is_bot or not player.connected:
            raise GameError("Operator unavailable.")
        role = room.role_for(player.id)
        target = room.hack_target if role == "hacker" else room.threat_target
        if not target or target["id"] != target_id:
            return False  # A delayed packet for a completed/expired target.
        if now - player.last_submission < 0.14:
            return False  # Basic spam protection; never penalize network duplicates.
        player.last_submission = now
        value = str(value)[:100]
        player.submitted_chars += len(value)
        if normalized(value) != normalized(target["text"]):
            player.mistakes += 1
            player.streak = 0
            penalty = DIFFICULTIES[room.difficulty]["mistake"]
            room.stability = max(0, room.stability - penalty)
            room.event(f"{player.name}: command rejected. Integrity -{penalty}.", "warning")
            if room.stability == 0:
                self._finish(room, False)
            return False

        player.correct += 1
        player.successful_chars += len(target["text"])
        player.streak += 1
        player.best_streak = max(player.streak, player.best_streak)
        multiplier = min(2, 1 + player.streak * 0.1)
        gain = round((125 if role == "hacker" else 100) * multiplier)
        player.score += gain
        self._charge_sync(room, player.id)
        if role == "hacker":
            self._change_ambient(room, WORLD_RULES[room.mission]["hack"])
            if room.phase != "playing":
                return True
            room.progress += 1
            self._discover(room)
            room.event(f"{player.name}: sequence {room.progress}/{STAGE_GOALS[room.stage - 1]} accepted.", "good")
            beat = MISSIONS[room.mission]["beats"].get((room.stage, room.progress))
            if beat:
                room.story_event(beat)
            if room.progress >= STAGE_GOALS[room.stage - 1]:
                if room.stage == 1:
                    self._begin_swap(room, now)
                else:
                    self._finish(room, True)
            else:
                if room.stage == 1 and room.progress == 3 and not room.tactic_triggered:
                    self._begin_tactic(room)
                elif room.stage == 2 and room.progress == 3 and not room.crisis_triggered:
                    self._start_crisis(room, now)
                elif room.mission == "casefile" and room.stage == 2 and room.progress == 5 and not room.accusation_triggered:
                    self._begin_accusation(room)
                else:
                    self._new_hack(room)
        else:
            room.event(f"{player.name}: {target['name']} neutralized.", "good")
            room.threat_target = None
            room.next_threat_at = now + 1.0
            if room.tactic_active and room.tactic_choice:
                self._finish_tactic(room, True)
            elif room.crisis_active:
                self._end_crisis(room, now)
            else:
                self._change_ambient(room, WORLD_RULES[room.mission]["defend"])
        room.touched = now
        return True

    def _start_crisis(self, room: Room, now: float) -> None:
        """One authored climax per run: the defender must release the hacker."""
        room.crisis_triggered = room.crisis_active = True
        room.hack_target = None
        room.story_event(MISSIONS[room.mission]["crisis_intro"])
        self._new_threat(room, now)

    def _end_crisis(self, room: Room, now: float) -> None:
        room.crisis_active = False
        self._new_hack(room)
        room.story_event("Critical incident cleared. Your partner has reopened the final objective.")

    def _begin_swap(self, room: Room, now: float) -> None:
        room.phase = "switching"
        room.switch_until = now + 4.3
        room.hack_target = None
        room.threat_target = None
        room.event("CRITICAL EVENT. Operators, switch stations NOW.", "warning")

    def _finish(self, room: Room, won: bool, reason: str = "") -> None:
        if room.phase in ("won", "lost"):
            return
        room.phase = "won" if won else "lost"
        room.finish_reason = reason or (
            "Both operators completed the rescue objectives and survived the final phase."
            if won else
            "Team integrity reached zero." if room.stability == 0 else
            "The mission clock ran out." if room.remaining <= 0 else
            "The operation could not be completed."
        )
        room.paused_since = None
        base = sum(p.score for p in room.players)
        room.final_score = base + (round(room.stability * 9 + room.remaining * 7) if won else 0)
        if won and room.stability >= 80:
            room.final_grade = "S"
        elif won and room.stability >= 55:
            room.final_grade = "A"
        elif won:
            room.final_grade = "B"
        else:
            room.final_grade = "F"
        room.event(MISSIONS[room.mission]["win" if won else "lose"], "good" if won else "warning")
        room.event(room.finish_reason, "good" if won else "warning")

    def tick(self, room: Room) -> None:
        now = self.clock()
        if room.phase == "lobby":
            # Reclaim a disconnected lobby slot after a short reconnect window.
            departed = [p for p in room.players if not p.connected and not p.is_bot
                        and p.disconnected_at is not None and now - p.disconnected_at > 30]
            for p in departed:
                room.players.remove(p)
                room.event(f"{p.name} left the squad. Their slot is open.", "warning")
                if room.host_id == p.id and room.players:
                    room.host_id = room.players[0].id
        if room.phase == "countdown":
            if room.paused_since is not None:
                if now - room.paused_since > RECONNECT_GRACE:
                    self._finish(room, False)
                    room.event("Connection timeout. Mission abandoned.", "warning")
                return
            if now >= room.countdown_until:
                room.phase = "armed"
                room.countdown_until = 0.0
                room.event("Preparation complete. Press PLAY when you are ready. The mission clock is still paused.", "good")
            return
        if room.phase == "armed":
            if room.paused_since is not None and now - room.paused_since > RECONNECT_GRACE:
                self._finish(room, False, "Connection timeout while waiting to launch.")
            return
        if room.phase == "playing":
            if room.paused_since is not None:
                if now - room.paused_since > RECONNECT_GRACE:
                    self._finish(room, False)
                    room.event("Connection timeout. Mission abandoned.", "warning")
                return
            elapsed = max(0, now - room.last_tick)
            room.last_tick = now
            room.remaining = max(0.0, room.remaining - elapsed)
            if room.remaining <= 0:
                self._finish(room, False, "The mission clock expired before the final objective was completed.")
                return
            if room.threat_target and now >= room.threat_due:
                damage = DIFFICULTIES[room.difficulty]["damage"] + (11 if room.crisis_active else 0)
                room.stability = max(0, room.stability - damage)
                self._change_ambient(room, WORLD_RULES[room.mission]["breach"])
                room.event(f"{room.threat_target['name']} breached your defenses! Integrity -{damage}.", "warning")
                room.threat_target = None
                room.next_threat_at = now + 1.1
                if room.tactic_active and room.tactic_choice:
                    self._finish_tactic(room, False)
                elif room.crisis_active:
                    self._end_crisis(room, now)
                if room.phase != "playing" or room.stability == 0:
                    self._finish(room, False)
                    return
            if room.threat_target is None and room.next_threat_at and now >= room.next_threat_at:
                self._new_threat(room, now)
            if room.is_solo and now >= room.next_bot_at:
                self._bot_action(room, now)
        elif room.phase == "switching" and room.paused_since is not None:
            if now - room.paused_since > RECONNECT_GRACE:
                self._finish(room, False)
                room.event("Connection timeout. Mission abandoned.", "warning")
            return
        elif room.phase == "switching" and now >= room.switch_until:
            room.stage = 2
            room.progress = 0
            room.story_moment = ""
            room.phase = "playing"
            room.last_tick = now
            room.event("ROLES REVERSED. Final phase initiated.", "good")
            room.event(room.rng.choice(MISSIONS[room.mission]["log"]))
            self._new_hack(room)
            self._new_threat(room, now)
            room.next_bot_at = now + 7.0

    def _bot_action(self, room: Room, now: float) -> None:
        bot = next(p for p in room.players if p.is_bot)
        if room.role_for(bot.id) == "defender":
            if room.threat_target:
                bot.correct += 1
                bot.successful_chars += len(room.threat_target["text"])
                bot.streak += 1
                bot.best_streak = max(bot.best_streak, bot.streak)
                bot.score += 100
                self._charge_sync(room, bot.id)
                room.event("ECHO / AI: hostile target suppressed.", "good")
                room.threat_target = None
                room.next_threat_at = now + 1
                if room.tactic_active and room.tactic_choice:
                    self._finish_tactic(room, True)
                elif room.crisis_active:
                    self._end_crisis(room, now)
                else:
                    self._change_ambient(room, WORLD_RULES[room.mission]["defend"])
            room.next_bot_at = now + room.rng.uniform(5.1, 7.2)
        else:
            if room.accusation_active:
                # Solo partners solve the mystery automatically after a short delay.
                self.accuse(room, bot, MISSIONS["casefile"]["culprit"])
                room.event("ECHO / AI: motive and suspect confirmed. Final evidence ready.", "good")
                room.next_bot_at = now + 6.0
                return
            if room.hack_target:
                bot.correct += 1
                bot.successful_chars += len(room.hack_target["text"])
                bot.streak += 1
                bot.best_streak = max(bot.best_streak, bot.streak)
                bot.score += 125
                self._charge_sync(room, bot.id)
                self._change_ambient(room, WORLD_RULES[room.mission]["hack"])
                if room.phase != "playing":
                    return
                room.progress += 1
                self._discover(room)
                room.event(f"ECHO / AI: sequence {room.progress}/{STAGE_GOALS[1]} accepted.", "good")
                beat = MISSIONS[room.mission]["beats"].get((room.stage, room.progress))
                if beat:
                    room.story_event(beat)
                if room.progress >= STAGE_GOALS[1]:
                    self._finish(room, True)
                elif room.stage == 2 and room.progress == 3 and not room.crisis_triggered:
                    self._start_crisis(room, now)
                elif room.mission == "casefile" and room.stage == 2 and room.progress == 5 and not room.accusation_triggered:
                    self._begin_accusation(room)
                else:
                    self._new_hack(room)
            room.next_bot_at = now + room.rng.uniform(8.0, 10.0)

    def view(self, room: Room, viewer: Player) -> dict:
        now = self.clock()
        role = room.role_for(viewer.id)
        target = room.hack_target if role == "hacker" else room.threat_target
        teammate = next((p for p in room.players if p.id != viewer.id), None)
        threat_secs = max(0, room.threat_due - now) if room.threat_target else 0
        return {
            "code": room.code,
            "mission": room.mission,
            "difficulty": room.difficulty,
            "difficultyLabel": DIFFICULTIES[room.difficulty]["label"],
            "mistakePenalty": DIFFICULTIES[room.difficulty]["mistake"],
            "missionInfo": {
                **PUBLIC_MISSIONS[room.mission],
                "briefing": {
                    **PUBLIC_MISSIONS[room.mission]["briefing"],
                    # The mystery's resolution should not spoil the briefing.
                    "outro": (PUBLIC_MISSIONS[room.mission]["briefing"]["outro"]
                              if room.phase == "won" else ""),
                },
            },
            "hostId": room.host_id,
            "viewerId": viewer.id,
            "phase": room.phase,
            "stage": room.stage,
            "stageGoal": STAGE_GOALS[room.stage - 1],
            "progress": room.progress,
            "stability": room.stability,
            "remaining": round(room.remaining, 1),
            "paused": room.paused_since is not None,
            "switchSeconds": round(max(0, room.switch_until - now), 1),
            "countdownSeconds": round(max(0, room.countdown_until - now), 1),
            "readyPlayers": sorted(room.briefing_ready),
            "launchReadyPlayers": sorted(room.launch_ready),
            "discovered": list(room.discoveries),
            "storyMoment": room.story_moment,
            "storyRecap": (list(room.story_recap) if room.phase in ("won", "lost") else []),
            "accusationActive": room.accusation_active,
            "accusationAttempts": room.accusation_attempts,
            "accusationVerdict": room.accusation_verdict,
            "suspects": (list(MISSIONS["casefile"]["suspects"])
                         if room.accusation_active and room.mission == "casefile" else []),
            "currentObjective": (
                "Identify the killer. Examine your evidence and accuse a suspect." if room.accusation_active else
                "Hold position until your teammate completes the tactical order." if room.tactic_active else
                "Protect the terminal until the critical incident is cleared." if room.crisis_active else
                MISSIONS[room.mission]["briefing"]["stageObjectives"][room.stage - 1]
            ),
            "role": role,
            "target": dict(target) if target else None,
            "threatSeconds": round(threat_secs, 1),
            "threatTotal": room.threat_total,
            "crisisActive": room.crisis_active,
            "crisisName": MISSIONS[room.mission]["crisis_name"],
            "syncCharge": room.sync_charge,
            "syncReady": room.sync_charge == SYNC_COST and room.sync_contributors == {p.id for p in room.players},
            "syncContributors": len(room.sync_contributors),
            "pulsesUsed": room.pulses_used,
            "threatName": room.threat_target["name"] if room.threat_target else None,
            "players": [{
                "id": p.id, "name": p.name, "bot": p.is_bot,
                "connected": p.connected, "score": p.score, "correct": p.correct,
                "mistakes": p.mistakes, "streak": p.streak, "bestStreak": p.best_streak,
                "role": room.role_for(p.id),
            } for p in room.players],
            "teammateRole": room.role_for(teammate.id) if teammate else None,
            "logs": room.logs[:],
            "finalScore": room.final_score,
            "finalGrade": room.final_grade,
            "finishReason": room.finish_reason,
            "overallProgress": round((min(room.progress, STAGE_GOALS[room.stage-1]) + (0 if room.stage == 1 else STAGE_GOALS[0])) / sum(STAGE_GOALS) * 100),
            "objectivesComplete": min(room.progress, STAGE_GOALS[room.stage-1]) + (0 if room.stage == 1 else STAGE_GOALS[0]),
            "objectivesTotal": sum(STAGE_GOALS),
            "solo": room.is_solo,
            "runId": room.run_id,
            "ambient": room.ambient,
            "world": public_world(room.mission),
            "worldWarning": risk_level(room.mission, room.ambient),
            "fieldOps": {
                **public_operations(room.mission, room.stage),
                "unlocked": room.progress >= 1,
                "used": room.stage in room.field_actions,
                "selected": room.field_actions.get(room.stage),
                "available": room.phase == "playing" and room.paused_since is None
                            and room.progress >= 1 and room.stage not in room.field_actions,
                "history": list(room.field_history),
            },

            "tacticActive": room.tactic_active,
            "tacticChoice": room.tactic_choice,
            "tacticOptions": public_world(room.mission)["choices"] if room.tactic_active and room.tactic_choice is None else [],
            "typing": [{"id": p.id, "accuracy": round(p.correct / max(1, p.correct + p.mistakes) * 100),
                        "wpm": round((p.successful_chars / 5) / max(1 / 60, (DIFFICULTIES[room.difficulty]["seconds"] - room.remaining) / 60))}
                       for p in room.players],
        }

    def cleanup(self) -> int:
        now = self.clock()
        doomed = [code for code, room in self.rooms.items()
                  if now - room.created > MAX_ROOM_AGE or
                  (not any(p.connected and not p.is_bot for p in room.players)
                   and now - room.touched > STALE_ROOM_AGE)]
        for code in doomed:
            del self.rooms[code]
        return len(doomed)
