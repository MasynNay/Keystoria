/** Storage and preference tests run without a browser or network. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readHistory, readCareer, recordResult, summarizeHistory, MILESTONES } from '../web/ui/progression.js';
import { loadPreferences, savePreferences, applyPreferences } from '../web/ui/preferences.js';

function storage() {
  const store = new Map();
  return {
    getItem(key) { return store.get(key) ?? null; },
    setItem(key, value) { store.set(key, String(value)); },
  };
}
function result(runId, overrides = {}) {
  return {
    runId, phase: 'won', viewerId: 'p1', mission: 'station', difficulty: 'standard',
    finalGrade: 'A', finalScore: 2600, pulsesUsed: 1, solo: false,
    players: [{ id: 'p1', bestStreak: 5, mistakes: 0 }],
    typing: [{ id: 'p1', accuracy: 100, wpm: 62 }], ...overrides,
  };
}

test('saving an operation is idempotent across render and refresh', () => {
  const local = storage();
  recordResult(result('abc'), local);
  recordResult(result('abc'), local);
  assert.equal(readHistory(local).length, 1);
  assert.deepEqual(summarizeHistory(readHistory(local), local), { runs: 1, wins: 1, best: 2600, unlocked: 3 });
});

test('records are bounded and older runs are discarded', () => {
  const local = storage();
  for (let i = 0; i < 29; i++) recordResult(result(`run-${i}`), local);
  const history = readHistory(local);
  assert.equal(history.length, 24);
  assert.equal(history[0].runId, 'run-28');
  assert.equal(history.at(-1).runId, 'run-5');
  assert.equal(readCareer(local).runs, 29);
  assert.equal(summarizeHistory(history, local).runs, 29);
});

test('unlock rules work across missions and difficulties', () => {
  const local = storage();
  recordResult(result('a', { mission: 'hollow' }), local);
  recordResult(result('b', { mission: 'station', difficulty: 'overdrive' }), local);
  recordResult(result('c', { mission: 'outbreak' }), local);
  assert.equal(MILESTONES.filter(b => b.unlocked(readCareer(local))).length, 5);
});

test('corrupt or unavailable storage gracefully falls back to empty progression', () => {
  const local = storage();
  local.setItem('panic.history.v1', '{garbage');
  assert.deepEqual(readHistory(local), []);
  assert.deepEqual(readHistory({ getItem() { throw new Error('denied'); } }), []);
});

test('accessibility settings are validated and independently applied', () => {
  const local = storage();
  assert.deepEqual(loadPreferences(local), { largerType: false, highContrast: false, reducedMotion: false });
  savePreferences({ largerType: true, highContrast: true, untrusted: 'x' }, local);
  const saved = loadPreferences(local);
  assert.equal(saved.largerType, true);
  assert.equal(saved.reducedMotion, false);
  assert.equal('untrusted' in saved, false);
  const classes = new Map();
  applyPreferences(saved, { classList: { toggle(key, value) { classes.set(key, value); } } });
  assert.equal(classes.get('larger-type'), true);
  assert.equal(classes.get('reduce-motion'), false);
});
