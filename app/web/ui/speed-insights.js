/** Local-first Speed Lab progress summary. No network calls or user accounts.
 * Comparisons are restricted to matching pack, duration and input mode;
 * native phone-assisted results are never mixed with exact typing.
 */
import { readSpeedHistory } from './speed-engine.js';
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
