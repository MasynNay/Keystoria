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

## Shipped local-network safeguard (not public-hosting approval)

The CLI Python entrypoint previously bound `0.0.0.0` by default, exposing rooms on all reachable interfaces whenever the process ran. [PR #55](https://github.com/MasynNay/Keystoria/pull/55) switched its default to `127.0.0.1`; LAN sessions require an intentional `HOST=0.0.0.0` or interface-specific override. Its post-merge [Python security checks](https://github.com/MasynNay/Keystoria/actions/runs/44429880931) and [Pages release](https://github.com/MasynNay/Keystoria/actions/runs/44429880937) passed. The Docker image intentionally retains an internal wildcard listener because the **Docker host publish address** controls external reachability; document and test loopback-only host port mapping. This avoids surprise network exposure on ordinary Mac, Windows and Linux installs, but it does not authenticate LAN users or make reverse-proxy/public hosting safe.

Python CI exercises the default/opt-in bind selection, same-origin and rejected-origin WebSocket handshakes, and bounded frames/message rate without contacting external services. A separate follow-up under development adds simultaneous connection and room-creation quotas, verified against both the TCP peer and live room protocol. Keep issue #4 open for authentication, stronger host/proxy checks, WSS, infrastructure isolation and an independent security review. No hosted co-op demo is being deployed.

## In-progress connection and room-creation limits (not yet released)

The next safety pass caps the single worker at **32 active WebSocket connections globally** and **8 per TCP peer**, including clients that upgrade but never create or join a room. Acquire slots before the asynchronous upgrade and release them on normal close, errors or shutdown. Creation attempts are limited to **4 per peer per 60 seconds** (rolling window); joining and reconnecting remain available. The in-memory tracking table is capped at 256 peer windows and expired windows are pruned. No IP, room code or keystroke is persisted by the limiter.

The identity comes from the socket's peer address, **not** `X-Forwarded-For` or any client-supplied proxy header. That means clients behind a reverse proxy share its limits, and it is *not* appropriate to treat these limits as sufficient for internet exposure. No new authentication, cross-worker coordination or hosted backend is introduced. Run direct aiohttp tests for 429 upgrades, cleanup after close, rejected room bursts, continued join/reconnect and failed header spoofing. A successful CI run proves only these scoped paths.

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
