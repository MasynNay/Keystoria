import test from 'node:test';
import assert from 'node:assert/strict';
import {
  practiceMode, readAccuracyGoal, saveAccuracyGoal,
  summarizeSpeedPractice, exportSpeedResults, clearSpeedResults
} from '../web/ui/speed-insights.js';

const storage=()=>({
  values:new Map(),
  getItem(key){return this.values.has(key)?this.values.get(key):null;},
  setItem(key,value){this.values.set(key,String(value));},
  removeItem(key){this.values.delete(key);}
});

test('practice goals persist locally and reject invalid values',()=>{
 const s=storage();
 assert.equal(readAccuracyGoal(s),95);
 assert.equal(saveAccuracyGoal(90,s),true);
 assert.equal(readAccuracyGoal(s),90);
 assert.equal(saveAccuracyGoal(42,s),false);
 assert.equal(readAccuracyGoal(s),90);
 s.setItem('keystoria.speed.accuracyGoal.v1','not a goal');
 assert.equal(readAccuracyGoal(s),95);
 assert.equal(saveAccuracyGoal(98,{setItem(){throw Error('blocked')}}),false);
 assert.equal(readAccuracyGoal({getItem(){throw Error('blocked')}}),95);
});

test('only same category, duration and input mode are compared',()=>{
 const s={pack:'everyday',seconds:30,phoneLayout:true,keyboardAssistedEver:true};
 const rows=[
  {pack:'everyday',seconds:30,practiceMode:'mobile-assisted',wpm:30,accuracy:97},
  {pack:'everyday',seconds:30,practiceMode:'mobile-exact',wpm:300,accuracy:100},
  {pack:'everyday',seconds:60,practiceMode:'mobile-assisted',wpm:200,accuracy:100},
  {pack:'technology',seconds:30,practiceMode:'mobile-assisted',wpm:400,accuracy:100},
  {pack:'everyday',seconds:30,practiceMode:'mobile-assisted',wpm:20,accuracy:91}
 ];
 const summary=summarizeSpeedPractice(rows,s,95);
 assert.equal(practiceMode(s),'mobile-assisted');
 assert.equal(summary.count,2);
 assert.equal(summary.best,30);
 assert.equal(summary.average,25);
 assert.equal(summary.averageAccuracy,94);
 assert.match(summary.message,/Focus on accuracy/);
 assert.equal(summarizeSpeedPractice(rows,{...s,keyboardAssistedEver:false},95).best,300);
 assert.equal(summarizeSpeedPractice(rows,{pack:'legal',seconds:30},95).count,0);
});

test('Numpad insight uses CPM, discards malformed records and keeps time scopes',()=>{
 const summary=summarizeSpeedPractice([
  {pack:'numpad',seconds:30,wpm:999,cpm:88,accuracy:99},
  {pack:'numpad',seconds:30,wpm:999,cpm:-20,accuracy:99},
  {pack:'numpad',seconds:30,wpm:999,cpm:83,accuracy:98},
  {pack:'numpad',seconds:30,wpm:999,cpm:40,accuracy:101}
 ],{pack:'numpad',seconds:30},95);
 assert.equal(summary.metric,'CPM');
 assert.equal(summary.best,88);
 assert.equal(summary.count,2);
 assert.equal(summary.average,86);
});

test('export contains only bounded saved records; clearing does not clear goals',()=>{
 const s=storage();
 const results=[{pack:'everyday',seconds:30,wpm:20,accuracy:94,at:'2026-11-16T18:00:00Z'}];
 s.setItem('panic.speed.results.v1',JSON.stringify(results));
 saveAccuracyGoal(98,s);
 const payload=exportSpeedResults(results,new Date('2026-11-16T18:00:00Z'));
 assert.equal(payload.format,'keystoria.speed.history');
 assert.equal(payload.records.length,1);
 assert.equal(payload.maxStoredResults,25);
 assert.equal(payload.exportedAt,'2026-11-16T18:00:00.000Z');
 assert.equal(clearSpeedResults(s),true);
 assert.equal(s.getItem('panic.speed.results.v1'),null);
 assert.equal(readAccuracyGoal(s),98);
 assert.equal(clearSpeedResults({removeItem(){throw Error('blocked')}}),false);
});


test('recent trail compares only five matching runs in chronological display order',()=>{
 const s={pack:'everyday',seconds:30,phoneLayout:true,keyboardAssistedEver:true};
 const records=[
  {pack:'everyday',seconds:30,practiceMode:'mobile-assisted',wpm:53,accuracy:97},
  {pack:'everyday',seconds:30,practiceMode:'mobile-exact',wpm:480,accuracy:100},
  {pack:'everyday',seconds:30,practiceMode:'mobile-assisted',wpm:47,accuracy:96},
  {pack:'numpad',seconds:30,practiceMode:'standard-exact',wpm:999,cpm:999,accuracy:100},
  {pack:'everyday',seconds:30,practiceMode:'mobile-assisted',wpm:45,accuracy:95},
  {pack:'everyday',seconds:30,practiceMode:'mobile-assisted',wpm:40,accuracy:90},
  {pack:'everyday',seconds:30,practiceMode:'mobile-assisted',wpm:38,accuracy:98},
  {pack:'everyday',seconds:30,practiceMode:'mobile-assisted',wpm:22,accuracy:99}
 ];
 const summary=summarizeSpeedPractice(records,s,95);
 assert.equal(summary.count,5);
 assert.equal(summary.paceChange,6);
 assert.equal(summary.goalStreak,3);
 assert.deepEqual(summary.recent.map(run=>run.speed),[38,40,45,47,53]);
 assert.deepEqual(summary.recent.map(run=>run.metGoal),[true,false,true,true,true]);
 assert.equal(summarizeSpeedPractice(records,s,98).goalStreak,0,'changing goal recomputes streak without changing scores');
 assert.equal(summarizeSpeedPractice(records,s,90).goalStreak,5,'goal streak is bounded by last five comparable runs');
 assert.equal(summarizeSpeedPractice(records,{...s,keyboardAssistedEver:false},95).count,1,'assisted and exact remain separate');
});

test('trail handles empty, single, identical, malformed and numpad runs',()=>{
 const s={pack:'everyday',seconds:30};
 const empty=summarizeSpeedPractice([],s);
 assert.deepEqual(empty.recent,[]);
 assert.equal(empty.paceChange,null);
 assert.equal(empty.goalStreak,0);
 const one=summarizeSpeedPractice([{pack:'everyday',seconds:30,practiceMode:'standard-exact',wpm:35,accuracy:96}],s);
 assert.equal(one.paceChange,null);
 assert.equal(one.goalStreak,1);
 const same=summarizeSpeedPractice([
  {pack:'everyday',seconds:30,practiceMode:'standard-exact',wpm:35,accuracy:96},
  {pack:'everyday',seconds:30,practiceMode:'standard-exact',wpm:35,accuracy:95},
  {pack:'everyday',seconds:30,practiceMode:'standard-exact',wpm:999999,accuracy:100},
 ],s);
 assert.equal(same.paceChange,0);
 assert.equal(same.count,2,'absurd tampered data is not visualized');
 const numpad=summarizeSpeedPractice([
  {pack:'numpad',seconds:15,wpm:9,cpm:120,accuracy:98},
  {pack:'numpad',seconds:15,wpm:100,cpm:105,accuracy:97},
 ],{pack:'numpad',seconds:15},95);
 assert.equal(numpad.metric,'CPM');
 assert.equal(numpad.paceChange,15);
 assert.deepEqual(numpad.recent.map(r=>r.speed),[105,120]);
});
