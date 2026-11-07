/** Local-only progression, retained independently of active room state. */
const HISTORY_KEY = "panic.history.v1";
const CAREER_KEY = "panic.career.v1";
const HISTORY_LIMIT = 24;
const WORLDS = ["station", "hollow", "outbreak"];

export function readHistory(storage = globalThis.localStorage) {
  try {
    const entries = JSON.parse(storage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(entries)
      ? entries.filter(entry => entry && typeof entry.runId === "string").slice(0, HISTORY_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function fromHistory(history) {
  const wins = history.filter(run => run.won);
  return {
    runs: history.length, wins: wins.length,
    best: history.reduce((max, run) => Math.max(max, run.score || 0), 0),
    worlds: [...new Set(wins.map(run => run.mission).filter(id => WORLDS.includes(id)))],
    overdriveWin: wins.some(run => run.difficulty === "overdrive"),
    cleanWin: wins.some(run => run.mistakes === 0),
    pulseUsed: history.some(run => run.pulses > 0),
  };
}

export function readCareer(storage = globalThis.localStorage) {
  const fallback = fromHistory(readHistory(storage));
  try {
    const value = JSON.parse(storage.getItem(CAREER_KEY) || "null");
    if (!value || !Number.isSafeInteger(value.runs) || value.runs < 0) return fallback;
    return {
      runs: value.runs,
      wins: Number.isSafeInteger(value.wins) ? Math.max(0, value.wins) : 0,
      best: Number.isFinite(value.best) ? Math.max(0, value.best) : 0,
      worlds: Array.isArray(value.worlds) ? value.worlds.filter(id => WORLDS.includes(id)) : [],
      overdriveWin: value.overdriveWin === true,
      cleanWin: value.cleanWin === true,
      pulseUsed: value.pulseUsed === true,
    };
  } catch {
    return fallback;
  }
}

export function recordResult(room, storage = globalThis.localStorage) {
  const history = readHistory(storage);
  if (!["won", "lost"].includes(room.phase) || !room.runId) return history;
  if (history.some(entry => entry.runId === room.runId)) return history;

  const self = room.players.find(player => player.id === room.viewerId);
  const typing = room.typing?.find(stat => stat.id === room.viewerId);
  const record = {
    runId: room.runId, mission: room.mission, difficulty: room.difficulty,
    won: room.phase === "won", grade: room.finalGrade,
    score: room.finalScore, accuracy: typing?.accuracy ?? 0,
    wpm: typing?.wpm ?? 0, streak: self?.bestStreak ?? 0,
    mistakes: self?.mistakes ?? 0, pulses: room.pulsesUsed ?? 0,
    solo: Boolean(room.solo), timestamp: Date.now(),
  };
  const career = readCareer(storage);
  const updated = {
    runs: career.runs + 1,
    wins: career.wins + (record.won ? 1 : 0),
    best: Math.max(career.best, record.score),
    worlds: [...new Set([...career.worlds, ...(record.won ? [record.mission] : [])])],
    overdriveWin: career.overdriveWin || (record.won && record.difficulty === "overdrive"),
    cleanWin: career.cleanWin || (record.won && record.mistakes === 0),
    pulseUsed: career.pulseUsed || record.pulses > 0,
  };
  const recent = [record, ...history].slice(0, HISTORY_LIMIT);
  try {
    // Both records are small, bounded or scalar and require no storage service.
    storage.setItem(CAREER_KEY, JSON.stringify(updated));
    storage.setItem(HISTORY_KEY, JSON.stringify(recent));
  } catch { /* Private-browsing storage may be unavailable. */ }
  return recent;
}

export const MILESTONES = [
  { id: "first", title: "FIRST EXTRACTION", detail: "Survive your first operation.", unlocked: career => career.wins > 0 },
  { id: "all-worlds", title: "TRIPLE THREAT", detail: "Win in all three worlds.", unlocked: career => career.worlds.length === 3 },
  { id: "hard", title: "NO WAY BACK", detail: "Win on Overdrive.", unlocked: career => career.overdriveWin },
  { id: "clean", title: "STEADY HANDS", detail: "Win without a wrong command.", unlocked: career => career.cleanWin },
  { id: "sync", title: "TWO OF A KIND", detail: "Finish a run with a Signal Pulse.", unlocked: career => career.pulseUsed },
  { id: "veteran", title: "VETERAN OPERATOR", detail: "Finish ten operations.", unlocked: career => career.runs >= 10 },
];

export function summarizeHistory(history, storage = globalThis.localStorage) {
  const career = readCareer(storage);
  return {
    runs: career.runs,
    wins: career.wins,
    best: career.best,
    unlocked: MILESTONES.filter(badge => badge.unlocked(career)).length,
  };
}
