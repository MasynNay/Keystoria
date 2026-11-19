"""Bound socket upgrades and room-creation attempts for the local-only server.

These are best-effort single-process limits, not public-hosting authorization.
The caller must use the TCP transport peer, never a forwarded client header.
"""

from __future__ import annotations

import time
from collections import deque
from typing import Callable

MAX_OPEN_SOCKETS = 32
MAX_SOCKETS_PER_PEER = 8
MAX_CREATES_PER_PEER = 4
CREATE_WINDOW_SECONDS = 60.0
MAX_TRACKED_CREATE_PEERS = 256
MAX_ROOM_ACCESS_ATTEMPTS_PER_PEER = 12
ROOM_ACCESS_WINDOW_SECONDS = 60.0
MAX_TRACKED_ACCESS_PEERS = 256


class SocketLimits:
    """Application-owned limiter. No sessions, room codes, or IPs persisted."""

    def __init__(self, clock: Callable[[], float] = time.monotonic):
        self.clock = clock
        self.active: dict[object, str] = {}
        self.peer_active: dict[str, int] = {}
        self.creates: dict[str, deque[float]] = {}
        self.room_access: dict[str, deque[float]] = {}

    def acquire(self, ws: object, peer: str) -> bool:
        """Reserve before awaiting WebSocket prepare to avoid upgrade races."""
        if not peer or ws in self.active:
            return False
        if len(self.active) >= MAX_OPEN_SOCKETS:
            return False
        if self.peer_active.get(peer, 0) >= MAX_SOCKETS_PER_PEER:
            return False
        self.active[ws] = peer
        self.peer_active[peer] = self.peer_active.get(peer, 0) + 1
        return True

    def release(self, ws: object) -> None:
        """Idempotently free the slot even for pre-room or aborted clients."""
        peer = self.active.pop(ws, None)
        if peer is None:
            return
        count = self.peer_active[peer] - 1
        if count:
            self.peer_active[peer] = count
        else:
            del self.peer_active[peer]

    def prune(self) -> None:
        now = self.clock()
        for windows, lifetime in (
            (self.creates, CREATE_WINDOW_SECONDS),
            (self.room_access, ROOM_ACCESS_WINDOW_SECONDS),
        ):
            for peer, stamps in list(windows.items()):
                while stamps and now - stamps[0] >= lifetime:
                    stamps.popleft()
                if not stamps:
                    del windows[peer]

    def allow_create(self, peer: str) -> bool:
        """Count creation ATTEMPTS so malformed requests cannot evade quotas.

        A rejected attempt once the window is full does not extend the window.
        Join and reconnect are not subject to this creation-specific quota.
        """
        if not peer:
            return False
        self.prune()
        if peer not in self.creates and len(self.creates) >= MAX_TRACKED_CREATE_PEERS:
            return False
        stamps = self.creates.setdefault(peer, deque())
        if len(stamps) >= MAX_CREATES_PER_PEER:
            return False
        stamps.append(self.clock())
        return True

    def allow_room_access(self, peer: str) -> bool:
        """Throttle pre-room JOIN and RECONNECT requests across socket restarts.

        Both valid and invalid attempts count, so guesses cannot bypass the
        cap by changing codes, tokens or sockets. No room codes/tokens are
        stored; the TCP peer is the only key. Rejected attempts do not extend
        the rolling window, and already joined players are unaffected.
        """
        if not peer:
            return False
        self.prune()
        if peer not in self.room_access and len(self.room_access) >= MAX_TRACKED_ACCESS_PEERS:
            return False
        stamps = self.room_access.setdefault(peer, deque())
        if len(stamps) >= MAX_ROOM_ACCESS_ATTEMPTS_PER_PEER:
            return False
        stamps.append(self.clock())
        return True
