import test from 'node:test';
import assert from 'node:assert/strict';
import {
 parseSpeedHistoryExport, restoreSpeedHistory, SPEED_IMPORT_MAX_BYTES,
 exportSpeedResults, readAccuracyGoal, saveAccuracyGoal,
 summarizeSpeedPractice
} from '../web/ui/speed-insights.js';
import { readSpeedHistory } from '../web/ui/speed-engine.js';

const storage=()=>({
 values:new Map(),
 getItem(k){return this.values.has(k)?this.values.get(k):null;},
 setItem(k,v){this.values.set(k,String(v));},
 removeItem(k){this.values.delete(k);}
});
const example=(override={})=>({
 pack:'everyday',seconds:30,wpm:42,rawWpm:45,accuracy:96,
 correct:420,incorrect:18,characters:438,keystrokes:442,
 practiceMode:'mobile-assisted',keyboardAssisted:true,
 at:'2026-11-16T23:00:00.000Z',
 ...override,
});
const payload=(runs=[example()],extras={})=>JSON.stringify({
 format:'keystoria.speed.history',version:1,exportedAt:'2026-11-16T23:10:00.000Z',
 maxStoredResults:25,records:runs,...extras
});

test('export v1 roundtrips validated records and strips untrusted keys',()=>{
 const safe=parseSpeedHistoryExport(payload([example({
  surprise:'<img src=x onerror=alert(1)>',
  userEnteredHTML:'<script>alert(1)</script>'
 })]));
 assert.equal(safe.length,1);
 assert.equal(safe[0].surprise,undefined);
 assert.equal(safe[0].userEnteredHTML,undefined);
 assert.equal(safe[0].keyboardAssisted,true);
 assert.equal(safe[0].practiceMode,'mobile-assisted');
 const s=storage();
 saveAccuracyGoal(98,s);
 assert.equal(restoreSpeedHistory(safe,s),true);
 assert.equal(readAccuracyGoal(s),98,'accuracy goal must be retained');
 assert.equal(readSpeedHistory(s)[0].wpm,42);
 const exported=exportSpeedResults(readSpeedHistory(s),new Date('2026-11-16T23:20:00.000Z'));
 assert.deepEqual(parseSpeedHistoryExport(JSON.stringify(exported)),safe);
});

test('reject invalid JSON, wrong product/version and more than 25 records',()=>{
 for(const text of [
  '{broken',
  '[]',
  JSON.stringify({format:'other',version:1,records:[]}),
  payload([],{version:2}),
  payload(Array(26).fill(example())),
  ' '.repeat(SPEED_IMPORT_MAX_BYTES+1),
 ])assert.throws(()=>parseSpeedHistoryExport(text),Error);
});

test('reject invalid pack, duration, scoring, numeric mode, dates and row shapes',()=>{
 for(const row of [
  example({pack:'made-up'}),
  example({seconds:17}),
  example({wpm:'900'}),
  example({wpm:NaN}),
  example({accuracy:101}),
  example({practiceMode:'bogus'}),
  example({keyboardAssisted:'yes'}),
  example({at:'not-a-date'}),
  example({rawWpm:-1}),
  example({correct:1.5}),
  {pack:'numpad',seconds:30,wpm:30,accuracy:100},
  example({pack:'numpad',cpm:-3}),
  null,
  [],
 ])assert.throws(()=>parseSpeedHistoryExport(payload([row])),Error);
});

test('restore failure preserves the existing records',()=>{
 const s=storage();s.setItem('panic.speed.results.v1',JSON.stringify([example()]));
 const before=s.getItem('panic.speed.results.v1');
 assert.equal(restoreSpeedHistory([example({pack:'invalid'})],s),false);
 assert.equal(s.getItem('panic.speed.results.v1'),before);
 assert.equal(restoreSpeedHistory([example()],{setItem(){throw Error('read-only')}}),false);
 assert.equal(s.getItem('panic.speed.results.v1'),before);
});

test('restored Numpad and native assistance remain isolated in progress comparisons',()=>{
 const records=parseSpeedHistoryExport(payload([
  example(),
  example({practiceMode:'mobile-exact',keyboardAssisted:false,wpm:100}),
  {pack:'numpad',seconds:30,wpm:15,accuracy:99,cpm:145,practiceMode:'standard-exact'}
 ]));
 assert.equal(summarizeSpeedPractice(records,{pack:'everyday',seconds:30,phoneLayout:true,keyboardAssistedEver:true}).count,1);
 assert.equal(summarizeSpeedPractice(records,{pack:'everyday',seconds:30,phoneLayout:true,keyboardAssistedEver:false}).best,100);
 assert.equal(summarizeSpeedPractice(records,{pack:'numpad',seconds:30}).best,145);
});
