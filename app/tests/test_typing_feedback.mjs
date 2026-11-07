import test from 'node:test';
import assert from 'node:assert/strict';
import { compareTyping, renderTypingFeedback } from '../web/ui/typing-feedback.js';
import { createWordStream, DURATIONS, PACKS, scoreSpeedRun, readSpeedHistory, saveSpeedResult } from '../web/ui/speed-engine.js';

const storage = () => {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,String(v)) };
};

test('all modes share the same correct, incorrect and current character states', () => {
  const html = renderTypingFeedback('release docking clamps', 'releaxe');
  assert.match(html,/type-char correct/);
  assert.match(html,/type-char incorrect/);
  assert.match(html,/type-char pending current/);
  assert.equal(compareTyping('release docking clamps','releaxe').incorrect,1);
});

test('case sensitivity is selectable for fiction and real command examples', () => {
  assert.equal(compareTyping('Get-Process','get-process').incorrect,2);
  assert.equal(compareTyping('Get-Process','get-process',{caseSensitive:false}).incorrect,0);
});

test('extra typed characters appear as errors instead of being silently dropped', () => {
  assert.match(renderTypingFeedback('pwd','pwd!'), /type-char extra/);
  assert.equal(compareTyping('pwd','pwd!').complete,false);
  assert.equal(compareTyping('pwd','pwd').complete,true);
});

test('highlighted text is escaped at the HTML boundary', () => {
  const html=renderTypingFeedback('<hello&>', '<hel');
  assert.ok(html.includes('&lt;') && html.includes('&amp;'));
  assert.equal(html.includes('<hello'),false);
});

test('durations and banks have usable high-volume word streams', () => {
  assert.deepEqual(DURATIONS,[15,30,60,120]);
  assert.deepEqual(Object.keys(PACKS),['everyday','technology','atmosphere']);
  for(const name of Object.keys(PACKS)) {
    const output = createWordStream(name,700,()=>0.41);
    assert.equal(output.split(' ').length,700);
    assert.ok(output.length>2300);
  }
});

test('speed metrics count correct chars, not merely total input', () => {
  const ref='hello world';
  assert.deepEqual(scoreSpeedRun(ref, 'hello xorld', 60),{
    wpm:2,rawWpm:2,accuracy:91,correct:10,incorrect:1,characters:11,keystrokes:0,
  });
});

test('local speed history is bounded and invalid data is handled', () => {
  const store=storage();
  for(let i=0;i<50;i++) saveSpeedResult({wpm:i,seconds:30,accuracy:95},store);
  assert.equal(readSpeedHistory(store).length,25);
  assert.equal(readSpeedHistory(store)[0].wpm,49);
  store.setItem('panic.speed.results.v1','invalid json');
  assert.deepEqual(readSpeedHistory(store),[]);
});
