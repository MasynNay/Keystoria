/** Training reference integrity and isolation: no command execution is exposed. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, matchesCommand, savedLessons, saveLesson } from '../web/ui/lessons.js';
import { trainingTemplate, trainingLibrary } from '../web/ui/training-view.js';
import { LESSON_OUTPUTS } from '../web/ui/lesson-output.js';

const saved = new Map();
globalThis.localStorage = {
  getItem(key) { return saved.get(key) ?? null; },
  setItem(key, value) { saved.set(key, String(value)); },
};
const header = () => '<header>TEST HEADER</header>';
const session = (os, overrides = {}) => ({
  os, index:0, answered:false, errors:0, completed:false, review:false, errorMessage:'', draft:'', ...overrides,
});

test('three separate courses each teach fourteen real commands with context', () => {
  assert.deepEqual(Object.keys(LESSONS).sort(), ['linux','macos','windows']);
  for (const lesson of Object.values(LESSONS)) {
    assert.equal(lesson.commands.length,14);
    assert.ok(lesson.story.length>60);
    for (const command of lesson.commands) {
      assert.ok(command.text.length>1);
      assert.ok(command.title.length>3);
      assert.ok(command.detail.length>25);
    }
    assert.equal(new Set(lesson.commands.map(c=>c.text)).size,14);
  }
});

test('platform differences are accurate rather than pretending Linux equals macOS', () => {
  assert.ok(LESSONS.macos.commands.some(c=>c.text==='open .'));
  assert.ok(LESSONS.macos.commands.some(c=>c.text==='sw_vers'));
  assert.ok(LESSONS.windows.commands.some(c=>c.text==='Get-Service'));
  assert.ok(LESSONS.windows.commands.some(c=>c.text==='Get-Process'));
  assert.ok(LESSONS.linux.commands.some(c=>c.text==='ps aux'));
  assert.ok(LESSONS.linux.commands.some(c=>c.text==='chmod u+x script.sh'));
});

test('typing preserves meaningful case, ignores only accidental whitespace', () => {
  assert.equal(matchesCommand('  ls   -la  ','ls -la'),true);
  assert.equal(matchesCommand('get-childitem','Get-ChildItem'),false);
  assert.equal(matchesCommand('ls -l','ls -la'),false);
  assert.equal(matchesCommand('rm -rf /','pwd'),false);
});

test('all 42 real commands have clearly fictionalized example output', () => {
  for (const [os, lesson] of Object.entries(LESSONS)) {
    assert.equal(LESSON_OUTPUTS[os].length, lesson.commands.length);
    for (const output of LESSON_OUTPUTS[os]) assert.ok(output.length >= 4);
  }
});

test('training UI makes simulated safety and context unmistakable', () => {
  const page = trainingTemplate(session('windows'),header);
  assert.match(page,/SIMULATED CONSOLE/);
  assert.match(page,/No real shell commands are executed|nothing runs|nothing was executed/i);
  assert.match(page,/WHAT DOES IT DO/);
  assert.match(page,/Get-Location/);
  assert.match(page,/CHECK COMMAND/);
  assert.match(page,/PS C:/);
});

test('correct answer creates visible success state and a manual next step', () => {
  const page = trainingTemplate(session('linux',{answered:true}),header);
  assert.match(page,/COMMAND RECOGNIZED/);
  assert.match(page,/SIMULATED TERMINAL OUTPUT/);
  assert.match(page,/home\/operator/);
  assert.match(page,/NEXT COMMAND/);
  assert.doesNotMatch(page,/CHECK COMMAND ↵/);
});

test('optional full guide and completed guide include all fourteen explanations', () => {
  for (const options of [{review:true},{completed:true,index:13}]) {
    const page=trainingTemplate(session('macos',options),header);
    assert.match(page,/YOUR FIELD MANUAL/);
    assert.match(page,/screencapture -i screenshot.png/);
    assert.match(page,/man open/);
  }
});

test('completion is stored locally and corrupt browser storage is tolerated', () => {
  assert.match(trainingLibrary(),/OPEN TERMINAL/);
  saveLesson('linux');
  assert.equal(savedLessons().linux,true);
  assert.match(trainingLibrary(),/COMPLETED ✓/);
  saved.set('panic.lessons.v1','{not-json');
  assert.deepEqual(savedLessons(),{});
});
