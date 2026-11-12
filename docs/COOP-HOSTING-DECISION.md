# Co-op story hosting: security and operating decision (draft)

**Date:** 2026-11-12  
**Tracking:** [Issue #4](https://github.com/MasynNay/Keystoria/issues/4)  
**Decision status:** Proposal only; no public server or production multiplayer launch is authorized.

## Decision

Keep the 24 authored cooperative story missions **local-server only** for now. Continue offering the static GitHub Pages edition for Lyric Lab, Speed Lab, and Field Academy. Do not route arbitrary public traffic to the existing Python WebSocket game server or a home machine.

A public cooperative demo is worth reconsidering only after the safeguards and test gates below are implemented. This avoids turning a static, low-maintenance portfolio into an always-on abuse and privacy liability before there is evidence of demand.

## Options considered

| Option | Benefits | Costs and risks | Decision |
| --- | --- | --- | --- |
| Local-only Python server | No exposed public room service; current story features remain available | Installation required; no remote shared-room discovery | **Keep** |
| Controlled, time-limited demo | Can demonstrate shared rooms with bounded exposure | Requires isolated deployment, quotas, monitoring, cleanup and incident response | **Research later** |
| Public persistent multiplayer | Accessible to anyone at any time | Highest operational cost, denial-of-service exposure, moderation and data-handling burden | **Not approved** |

## Minimum threat model before any public trial

1. **Network isolation:** Dedicated unprivileged service/container, no privileged mounts, host network or access to LAN devices. HTTPS/WSS behind a reverse proxy; no direct public Python debug server.
2. **Origin and authentication:** Explicit browser Origin allowlist on the WebSocket handshake, validated host/forwarded headers, unpredictable short-lived room join tokens, and no assumption that CORS protects WebSockets. Do not place secrets in repository files or client bundles.
3. **Resource limits:** Maximum active rooms, participants per room, message size, messages per second, room creation rate, idle duration and absolute room lifetime. Bound CPU, memory, connections and process restart behavior. Reject oversized and malformed frames before expensive parsing.
4. **Room isolation:** Server-authoritative room membership and progression. Prevent guessing another room's state or joining by sequential IDs. Test concurrent rooms, disconnect/reconnect and duplicate submissions. Define behavior across process restarts; in-memory rooms are not durable.
5. **Privacy and content:** No permanent chat/keystroke history by default. Minimize access logs and define retention. Avoid publishing participant names or room codes. Document whether user-generated text is accepted and how it is constrained.
6. **Operations:** Explicit service owner, alerts for crash loops and abnormal connection counts, rollback procedure, dependency/security patch cadence, backups only for configuration, and an immediate kill switch. Prefer a limited public test window over an unattended 24/7 service.

## Acceptance tests for a future proof of concept

- Automated unauthorized-origin, missing/expired token, wrong-room, oversized-frame, message-flood and room-limit tests fail closed.
- Two isolated rooms can play simultaneously without leaking state; reconnect and disconnect cleanup work under load.
- Room TTL and idle expiry free resources, including after client crashes; no persistent user input remains.
- WSS works behind the intended proxy; plain HTTP/WS public access is rejected or redirected appropriately.
- Document measured memory/CPU and connection ceilings, hosting cost, alert/rollback procedure and threat-model review before exposing any endpoint.
- Independent security review and a human go/no-go decision precede deployment.

## Open questions

- Is a co-op browser demo actually requested by users, or is a recorded walkthrough sufficient?
- What is the acceptable monthly spend and who handles abuse reports and outages?
- Does the current server support multiple workers, or must all room state stay in one process?
- What data must survive restarts, if any?

**Verification boundary:** This is an architecture and risk decision, not implementation or security certification. No live hosting, load testing, mobile-device testing or CI results are claimed here.
