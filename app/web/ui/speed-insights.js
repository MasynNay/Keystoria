/** Local-first Speed Lab progress summary. No network calls or user accounts.
 * Comparisons are restricted to matching pack, duration and input mode;
 * native phone-assisted results are never mixed with exact typing.
 */
import { readSpeedHistory, PACKS, DURATIONS } from './speed-engine.js';
export const ACCURACY_GOALS = Object.freeze([90, 95, 98]);
const GOAL_KEY = 'keystoria.speed.accuracyGoal.v1';
const RESULTS_KEY = 'panic.speed.results.v1';

export function practiceMode(session = {}) {
  if (session.practiceMode) return session.practiceMode;
  return session.phoneLayout
    ? (session.keyboardAssistedEver || session.keyboardAssisted ? 'mobile-assisted' : 'mobile-exact')
    : 'standard-exact';
}

export function readAccuracyGoal(storage = globalThis.localStorage) {
  try {
    const value = Number(storage?.getItem(GOAL_KEY));
    return ACCURACY_GOALS.includes(value) ? value : 95;
  } catch { return 95; }
}
export function saveAccuracyGoal(value, storage = globalThis.localStorage) {
  const goal = Number(value);
  if (!ACCURACY_GOALS.includes(goal)) return false;
  try { storage.setItem(GOAL_KEY, String(goal)); return true; }
  catch { return false; }
}

export function summarizeSpeedPractice(history, session, goal = 95) {
  const mode = practiceMode(session), numpad = session.pack === 'numpad';
  const metric = numpad ? 'CPM' : 'WPM';
  const speed = run => Number(numpad ? run.cpm : run.wpm);
  const matching = (Array.isArray(history) ? history : [])
    .filter(run => run && run.pack === session.pack
      && Number(run.seconds) === Number(session.seconds)
      && practiceMode(run) === mode
      && Number.isFinite(speed(run)) && speed(run) >= 0
      && Number.isFinite(Number(run.accuracy))
      && Number(run.accuracy) >= 0 && Number(run.accuracy) <= 100)
    .slice(0, 5);
  if (!matching.length) return {
    count:0, metric, best:null, average:null, averageAccuracy:null,
    message:'Finish a run in this category, duration and input mode to start tracking progress.'
  };
  const scores = matching.map(speed);
  const avg = Math.round(scores.reduce((a,b) => a+b,0) / scores.length);
  const avgAccuracy = Math.round(matching.reduce((a,r) => a + Number(r.accuracy),0) / matching.length);
  const safeGoal = ACCURACY_GOALS.includes(Number(goal)) ? Number(goal) : 95;
  let message;
  if(avgAccuracy < safeGoal){
    message = 'Focus on accuracy before speed. Slow down slightly, then repeat this drill.';
  } else if(matching.length < 3){
    message = 'Accuracy goal reached. Complete a few more comparable runs to reveal a trend.';
  } else if(scores[0] > scores[scores.length - 1]){
    message = 'Your latest speed is above the oldest comparable run. Keep the rhythm going.';
  } else {
    message = 'Accuracy is on target. Repeat this drill steadily before increasing pace.';
  }
  return {
    count:matching.length, metric,
    best:Math.max(...scores), average:avg, averageAccuracy:avgAccuracy,
    message,
  };
}

export function exportSpeedResults(history = readSpeedHistory(), now = new Date()) {
  return {
    format:'keystoria.speed.history',
    version:1,
    exportedAt:now.toISOString(),
    maxStoredResults:25,
    records:history,
  };
}

export function clearSpeedResults(storage = globalThis.localStorage) {
  try { storage.removeItem(RESULTS_KEY); return true; }
  catch { return false; }
}


// Restore data is external input, even when it was exported by this site.
// Validate the entire file before presenting the destructive replace prompt.
export const SPEED_IMPORT_MAX_BYTES = 128 * 1024;
const IMPORT_MODES = new Set(['mobile-assisted', 'mobile-exact', 'standard-exact']);
const IMPORT_NUMERIC_LIMITS = Object.freeze({
  wpm:5000, rawWpm:5000, cpm:30000, rawCpm:30000,
  accuracy:100, correct:50000, incorrect:50000,
  characters:50000, keystrokes:50000,
});

function validImportedRun(run) {
  if (!run || typeof run !== 'object' || Array.isArray(run)) return false;
  if (!Object.hasOwn(PACKS, run.pack) || !DURATIONS.includes(run.seconds)) return false;
  if (!Number.isFinite(run.wpm) || run.wpm < 0 || run.wpm > 5000) return false;
  if (!Number.isFinite(run.accuracy) || run.accuracy < 0 || run.accuracy > 100) return false;
  if (run.pack === 'numpad' && (!Number.isFinite(run.cpm) || run.cpm < 0 || run.cpm > 30000)) return false;
  for (const [name,maximum] of Object.entries(IMPORT_NUMERIC_LIMITS)) {
    if (!Object.hasOwn(run,name)) continue;
    const value=run[name];
    if (!Number.isFinite(value) || value < 0 || value > maximum) return false;
    if (['correct','incorrect','characters','keystrokes'].includes(name) && !Number.isInteger(value)) return false;
  }
  if (run.practiceMode !== undefined && !IMPORT_MODES.has(run.practiceMode)) return false;
  if (run.keyboardAssisted !== undefined && typeof run.keyboardAssisted !== 'boolean') return false;
  if (run.at !== undefined && (typeof run.at !== 'string' || run.at.length > 40 || !Number.isFinite(Date.parse(run.at)))) return false;
  return true;
}

export function parseSpeedHistoryExport(json) {
  if (typeof json !== 'string' || json.length > SPEED_IMPORT_MAX_BYTES) {
    throw new Error('Import file exceeds the 128 KB safety limit.');
  }
  let payload;
  try { payload=JSON.parse(json); }
  catch { throw new Error('That file is not valid JSON.'); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)
      || payload.format !== 'keystoria.speed.history' || payload.version !== 1
      || !Array.isArray(payload.records)) {
    throw new Error('Use a Keystoria Speed Lab version 1 JSON export.');
  }
  if (payload.records.length > 25) throw new Error('The export exceeds the 25-result history limit.');
  const clean=[];
  for (const run of payload.records) {
    if (!validImportedRun(run)) throw new Error('The export includes an invalid Speed Lab result.');
    const record={pack:run.pack,seconds:run.seconds,wpm:run.wpm,accuracy:run.accuracy};
    for (const name of Object.keys(IMPORT_NUMERIC_LIMITS)) {
      if (name==='wpm' || name==='accuracy') continue;
      if (Object.hasOwn(run,name)) record[name]=run[name];
    }
    for (const name of ['practiceMode','keyboardAssisted','at']) {
      if (Object.hasOwn(run,name)) record[name]=run[name];
    }
    clean.push(record);
  }
  return clean;
}

export function restoreSpeedHistory(records, storage = globalThis.localStorage) {
  if (!Array.isArray(records) || records.length > 25 || records.some(run => !validImportedRun(run))) return false;
  try { storage.setItem(RESULTS_KEY,JSON.stringify(records)); return true; }
  catch { return false; }
}
