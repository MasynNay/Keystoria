/** Safe local co-op recovery guidance; never render server-supplied secrets. */

export function describeSessionRecovery(message, { reconnecting = false, hasRoom = false } = {}) {
  const description = typeof message === "string" ? message.toLowerCase() : "";
  if (description.includes("too many room access attempts")) {
    return reconnecting
      ? {
          kind: "cooldown",
          title: "RECONNECT TEMPORARILY LIMITED.",
          detail: "Too many room access attempts came from this connection. Wait up to a minute, then retry your saved session. Your private reconnect pass has NOT been deleted.",
          action: "retry",
          discardSession: false,
        }
      : {
          kind: "cooldown",
          title: "ROOM ACCESS TEMPORARILY LIMITED.",
          detail: "Room joins are temporarily limited for this connection. Wait up to a minute before trying another code. Your saved session has NOT been deleted.",
          action: "join",
          discardSession: false,
        };
  }
  if (reconnecting && description.includes("reconnect pass")) {
    return {
      kind: "invalid",
      title: "YOUR RECONNECT PASS IS NO LONGER VALID.",
      detail: "This pass may already have been used or replaced. It cannot be recovered from a room code. Start a new local room, or join a fresh room created by your teammate.",
      action: "new",
      discardSession: true,
    };
  }
  if ((reconnecting || hasRoom) && description.includes("expired")) {
    return {
      kind: "expired",
      title: "THIS ROOM HAS EXPIRED.",
      detail: "The local server has ended this room. Old room codes and reconnect passes cannot restore its progress. Start a new local room or ask your teammate for a new invite.",
      action: "new",
      discardSession: true,
    };
  }
  return null;
}

export function sessionRecoveryPanel(recovery) {
  if (!recovery) return "";
  const primary = recovery.action === "retry"
    ? '<button type="button" class="btn btn-primary" data-action="recovery-retry">RETRY SAVED SESSION</button>'
    : recovery.action === "join"
      ? '<button type="button" class="btn btn-primary" data-action="recovery-join">OPEN ROOM JOIN</button>'
      : '<button type="button" class="btn btn-primary" data-action="recovery-create">START A NEW ROOM</button><button type="button" class="btn btn-outline" data-action="recovery-join">JOIN A NEW ROOM</button>';
  return `<section class="session-recovery shell" role="alert" aria-labelledby="session-recovery-title" data-recovery-kind="${recovery.kind}">
    <div class="session-recovery-card">
      <span class="session-recovery-eyebrow">LOCAL CO-OP / CONNECTION RECOVERY</span>
      <h2 id="session-recovery-title" tabindex="-1">${recovery.title}</h2>
      <p>${recovery.detail}</p>
      <div class="session-recovery-actions">${primary}</div>
    </div>
  </section>`;
}
