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

test('accuracy-qualified personal best searches all 25 saved runs, not only recent five',()=>{
 const session={pack:'everyday',seconds:30,practiceMode:'standard-exact'};
 const rows=Array.from({length:27},(_,i)=>({
  pack:'everyday',seconds:30,practiceMode:'standard-exact',wpm:40+i,accuracy:90
 }));
 rows[19].wpm=125;rows[19].accuracy=96;
 rows[26].wpm=400;rows[26].accuracy=100;
 const pulse=summarizeSpeedPractice(rows,session,95);
 assert.equal(pulse.count,5);
 assert.equal(pulse.matchingCount,25);
 assert.equal(pulse.best,44,'last-five best remains distinct');
 assert.equal(pulse.goalQualifiedBest,125,'a valid older record qualifies');
 assert.equal(pulse.goalQualifiedCount,1,'past the 25-result cap is excluded');
 assert.equal(summarizeSpeedPractice(rows,session,98).goalQualifiedBest,null);
 const easier=summarizeSpeedPractice(rows,session,90);
 assert.equal(easier.goalQualifiedCount,25);
 assert.equal(easier.goalQualifiedBest,125);
 const empty=summarizeSpeedPractice([],session);
 assert.equal(empty.goalQualifiedBest,null);
 assert.equal(empty.goalQualifiedCount,0);
 assert.equal(empty.matchingCount,0);
});

test('qualified best isolates Numpad CPM, accuracy, duration and input mode',()=>{
 const rows=[
  {pack:'numpad',seconds:30,practiceMode:'standard-exact',wpm:900,cpm:152,accuracy:97},
  {pack:'numpad',seconds:30,practiceMode:'standard-exact',wpm:800,cpm:220,accuracy:91},
  {pack:'numpad',seconds:60,practiceMode:'standard-exact',wpm:800,cpm:500,accuracy:100},
  {pack:'everyday',seconds:30,practiceMode:'standard-exact',wpm:500,cpm:500,accuracy:100},
  {pack:'numpad',seconds:30,practiceMode:'mobile-assisted',wpm:999,cpm:999,accuracy:100},
  {pack:'numpad',seconds:30,practiceMode:'standard-exact',wpm:999,cpm:999999,accuracy:100}
 ];
 const s={pack:'numpad',seconds:30};
 const pulse=summarizeSpeedPractice(rows,s,95);
 assert.equal(pulse.metric,'CPM');
 assert.equal(pulse.count,2);
 assert.equal(pulse.goalQualifiedBest,152);
 assert.equal(pulse.goalQualifiedCount,1);
 assert.equal(summarizeSpeedPractice(rows,s,98).goalQualifiedBest,null);
});


test('next practice session prioritizes accuracy before suggesting a small speed increase',()=>{
 const s={pack:'everyday',seconds:30,practiceMode:'standard-exact'};
 const empty=summarizeSpeedPractice([],s);
 assert.deepEqual(empty.nextTarget,{kind:'start',speed:null});
 const rows=[
  {pack:'everyday',seconds:30,practiceMode:'standard-exact',wpm:42,accuracy:93},
  {pack:'everyday',seconds:30,practiceMode:'standard-exact',wpm:38,accuracy:97},
 ];
 assert.deepEqual(summarizeSpeedPractice(rows,s,95).nextTarget,{kind:'accuracy',speed:null},
  'the newest missed goal means recover accuracy, not chase an old record');
 assert.deepEqual(summarizeSpeedPractice(rows,s,90).nextTarget,{kind:'pace',speed:44},
  'a lower selected goal immediately makes the same newest run qualifying');
 assert.deepEqual(summarizeSpeedPractice([{...rows[0],accuracy:96}],s,95).nextTarget,{kind:'pace',speed:44});
 assert.deepEqual(summarizeSpeedPractice([{...rows[0],accuracy:99,wpm:4999}],s,95).nextTarget,
  {kind:'maintain',speed:4999},'never propose a next target beyond the accepted score limit');
});

test('next suggestion isolates practice mode, duration, pack and Numpad CPM',()=>{
 const s={pack:'numpad',seconds:30,practiceMode:'mobile-exact'};
 const rows=[
  {pack:'numpad',seconds:30,practiceMode:'mobile-assisted',cpm:800,wpm:100,accuracy:100},
  {pack:'numpad',seconds:60,practiceMode:'mobile-exact',cpm:600,wpm:100,accuracy:100},
  {pack:'everyday',seconds:30,practiceMode:'mobile-exact',cpm:500,wpm:100,accuracy:100},
  {pack:'numpad',seconds:30,practiceMode:'mobile-exact',cpm:132,wpm:26,accuracy:97},
  {pack:'numpad',seconds:30,practiceMode:'mobile-exact',cpm:119,wpm:24,accuracy:99}
 ];
 const pulse=summarizeSpeedPractice(rows,s,95);
 assert.equal(pulse.matchingCount,2);
 assert.equal(pulse.metric,'CPM');
 assert.deepEqual(pulse.nextTarget,{kind:'pace',speed:137},'Numpad uses latest qualified CPM plus five');
 assert.deepEqual(summarizeSpeedPractice(rows,s,98).nextTarget,{kind:'accuracy',speed:null},
  'raising accuracy goal recalculates immediately without rewriting saved records');
 assert.deepEqual(summarizeSpeedPractice(rows,{...s,practiceMode:'standard-exact'},95).nextTarget,
  {kind:'start',speed:null},'unrelated input modes cannot manufacture personal recommendations');
 assert.deepEqual(summarizeSpeedPractice(rows,{...s,seconds:15},95).nextTarget,
  {kind:'start',speed:null});
});

test('legacy phone-assisted results never become desktop exact comparisons',()=>{
 const legacy={pack:'everyday',seconds:30,wpm:31,accuracy:96,keyboardAssisted:true};
 const mobile={pack:'everyday',seconds:30,wpm:37,accuracy:97,practiceMode:'mobile-assisted'};
 const phoneExact={pack:'everyday',seconds:30,wpm:44,accuracy:98,practiceMode:'mobile-exact'};
 const desktop={pack:'everyday',seconds:30,wpm:51,accuracy:99,practiceMode:'standard-exact'};
 assert.equal(practiceMode(legacy),'mobile-assisted','legacy persisted flag must define mode');
 assert.equal(practiceMode({keyboardAssistedEver:true}),'mobile-assisted');
 assert.equal(practiceMode({phoneLayout:true,keyboardAssisted:false}),'mobile-exact');
 assert.equal(practiceMode({keyboardAssisted:true,practiceMode:'mobile-exact'}),'mobile-exact',
   'explicit modern practice mode wins over legacy flags');
 assert.equal(practiceMode({}),'standard-exact');
 const rows=[legacy,mobile,phoneExact,desktop];
 const assisted=summarizeSpeedPractice(rows,{pack:'everyday',seconds:30,phoneLayout:true,keyboardAssistedEver:true},95);
 assert.equal(assisted.count,2,'both tagged and untagged assisted runs are comparable');
 assert.equal(assisted.best,37);
 assert.equal(assisted.goalQualifiedCount,2);
 const desktopSummary=summarizeSpeedPractice(rows,{pack:'everyday',seconds:30},95);
 assert.equal(desktopSummary.count,1,'legacy assisted run must not inflate desktop history');
 assert.equal(desktopSummary.best,51);
 const exactPhone=summarizeSpeedPractice(rows,{pack:'everyday',seconds:30,phoneLayout:true,keyboardAssisted:false},95);
 assert.equal(exactPhone.count,1,'mobile exact and assisted scores remain distinct');
 assert.equal(exactPhone.best,44);
});
