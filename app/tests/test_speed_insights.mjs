import test from 'node:test';
import assert from 'node:assert/strict';
import {
  practiceMode, readAccuracyGoal, saveAccuracyGoal,
  summarizeSpeedPractice, exportSpeedResults, clearSpeedResults, reviewSpeedKeys, createFocusedSpeedDrill, summarizeFocusedAttempt, compareFocusedAttempts, sameFocusScope, createFocusRoutine, advanceFocusRoutine, FOCUS_ROUTINE_ATTEMPTS, normalizeFocusPlan, focusPlanFromSession, readFocusPlan, saveFocusPlan, clearFocusPlan, SAVED_FOCUS_PLAN_KEY, GUIDED_ACTIVITY_KEY, readGuidedActivity, enableGuidedActivity, clearGuidedActivity, recordGuidedCompletion, summarizeGuidedActivity, recommendDailyPractice, summarizeTrainingMilestones, ACCURACY_LADDER, createAccuracyLadder, retryAccuracyLadder, nextAccuracyLadder, evaluateAccuracyLadder, SURVIVAL_WAVES, createSurvival, restartSurvival, nextSurvival, evaluateSurvival, CIRCUIT_TIERS, createAdaptiveCircuit, evaluateAdaptiveCircuit, nextAdaptiveCircuit, restartAdaptiveCircuit
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

test('end-of-run key review counts final positional mistakes only',()=>{
 assert.deepEqual(reviewSpeedKeys('aab a','xay z'),{
  attempted:5,mistakes:3,
  keys:[{key:'a',attempts:3,mistakes:2},{key:'b',attempts:1,mistakes:1}],otherMistakes:0,
 });
 assert.deepEqual(reviewSpeedKeys('abcde','aX'),{
  attempted:2,mistakes:1,keys:[{key:'b',attempts:1,mistakes:1}],otherMistakes:0,
 },'untyped targets never count as failures');
 assert.deepEqual(reviewSpeedKeys('abc','abc'),{attempted:3,mistakes:0,keys:[],otherMistakes:0});
 assert.deepEqual(reviewSpeedKeys('abc',''),{attempted:0,mistakes:0,keys:[],otherMistakes:0});
 assert.equal(reviewSpeedKeys('abc','abcXYZ').attempted,3);
});

test('review is bounded, deterministic, case-sensitive and Numpad-aware',()=>{
 const capped=reviewSpeedKeys('abcde f','!!!!!!!');
 assert.equal(capped.mistakes,7);
 assert.equal(capped.keys.length,5);
 assert.deepEqual(capped.keys.map(x=>x.key),[' ','a','b','c','d']);
 assert.equal(capped.otherMistakes,2);
 assert.deepEqual(reviewSpeedKeys('aaabb','xaazb').keys.map(x=>x.key),['b','a'],'higher error rate breaks a tie');
 assert.deepEqual(reviewSpeedKeys('aA','AA').keys,[{key:'a',attempts:1,mistakes:1}]);
 assert.deepEqual(reviewSpeedKeys('12 12','92 10',{numpad:true}),{
  attempted:5,mistakes:2,keys:[{key:'1',attempts:2,mistakes:1},{key:'2',attempts:2,mistakes:1}],otherMistakes:0,
 });
 assert.deepEqual(reviewSpeedKeys('éa','za'),{attempted:2,mistakes:1,keys:[],otherMistakes:1});
});

test('focused follow-up uses existing words, alternating target keys and short space drills',()=>{
 const drill=createFocusedSpeedDrill('everyday',['t','a',' '],12,()=>0);
 assert.deepEqual(drill.keys,['t','a',' ']);
 const words=drill.reference.split(' ');
 assert.equal(words.length,12);
 for(let i=0;i<words.length;i++){
  if(i%3===2)assert.ok(words[i].length<=4);
  else assert.ok(words[i].includes(drill.keys[i%3]));
 }
 const punctuation=createFocusedSpeedDrill('atmosphere',['.',','],6,()=>0);
 assert.ok(punctuation.reference.split(' ').every((word,i)=>word.endsWith(punctuation.keys[i%2])));
 assert.equal(createFocusedSpeedDrill('everyday',['<','%','7']),null);
 assert.equal(createFocusedSpeedDrill('__proto__',['a']),null);
 assert.equal(createFocusedSpeedDrill('everyday',null),null);
 assert.deepEqual(createFocusedSpeedDrill('everyday',['a','a','t'],4,()=>1).keys,['a','t']);
 assert.equal(createFocusedSpeedDrill('everyday',['t'],10000,()=>NaN).reference.split(' ').length,700);
});

test('targeted Numpad drills keep valid digits and separators, including Space-only practice',()=>{
 const drill=createFocusedSpeedDrill('numpad',['8','1',' '],12,()=>0);
 const groups=drill.reference.split(' ');
 assert.deepEqual(drill.keys,['8','1',' ']);
 assert.equal(groups.length,12);
 for(let i=0;i<groups.length;i++){
  assert.match(groups[i],/^[0-9]{3,6}$/);
  if(i%3===2)assert.equal(groups[i].length,3);
  else assert.ok(groups[i].includes(drill.keys[i%3]));
 }
 assert.equal(createFocusedSpeedDrill('numpad',['x','<']),null);
 assert.ok(createFocusedSpeedDrill('numpad',[' '],8,()=>0.5).reference.split(' ').every(group=>group.length===3));
});

const focusedSession=(reference,typed,overrides={})=>({
 pack:'everyday',seconds:30,targetKeys:['a',' '],reference,typed,
 result:{practiceMode:'standard-exact'},...overrides
});

test('focused summaries count only submitted target positions, preserve case and omit text',()=>{
 const attempt=summarizeFocusedAttempt(focusedSession('a A a t','x A a'));
 assert.deepEqual(attempt.rows,[{key:'a',attempted:2,correct:1},{key:' ',attempted:2,correct:2}]);
 assert.equal(attempt.reference,undefined);
 assert.equal(attempt.typed,undefined);
 assert.equal(summarizeFocusedAttempt(focusedSession('a','a',{targetKeys:[]})),null);
 const first=compareFocusedAttempts(attempt,null);
 assert.equal(first.reason,'first');
 assert.equal(first.rows[0].rate,50);
 assert.equal(first.rows[0].delta,null);
 const empty=summarizeFocusedAttempt(focusedSession('a a',''));
 assert.equal(compareFocusedAttempts(empty,attempt).rows[0].rate,null);
});

test('focused retry comparison uses each target denominator and rejects tiny samples',()=>{
 const before=summarizeFocusedAttempt(focusedSession('a a a a a a','x x x a a a'));
 const after=summarizeFocusedAttempt(focusedSession('a a a a a a','a a a a a a'));
 const compared=compareFocusedAttempts(after,before);
 assert.equal(compared.reason,'matched');
 assert.deepEqual(compared.rows.map(x=>[x.key,x.rate,x.priorRate,x.delta]),[['a',100,50,50],[' ',100,100,0]]);
 assert.equal(compareFocusedAttempts(before,after).rows[0].delta,-50);
 const short=summarizeFocusedAttempt(focusedSession('a a a','a a'));
 assert.equal(compareFocusedAttempts(short,before).rows[0].delta,null);
 assert.equal(compareFocusedAttempts(after,short).rows[0].delta,null);
 assert.equal(compareFocusedAttempts(after,before).rows[0].prior.attempted,6);
});

test('focused comparison cannot cross scope, keyboard mode, interruption or key order',()=>{
 const prior=summarizeFocusedAttempt(focusedSession('a a a a a a','x a a a a a'));
 const summary=overrides=>summarizeFocusedAttempt(focusedSession('a a a a a a','a a a a a a',overrides));
 for(const overrides of [{seconds:15},{pack:'technology'},{targetKeys:[' ','a']},{targetKeys:['a']}]){
  assert.equal(sameFocusScope(summary(overrides),prior),false);
  assert.equal(compareFocusedAttempts(summary(overrides),prior).reason,'scope');
  assert.ok(compareFocusedAttempts(summary(overrides),prior).rows.every(r=>r.delta===null));
 }
 const mode=summary({result:{practiceMode:'mobile-assisted'}});
 assert.equal(compareFocusedAttempts(mode,prior).reason,'keyboard');
 assert.equal(compareFocusedAttempts(summary({interrupted:true}),prior).reason,'interrupted');
 assert.equal(compareFocusedAttempts(summary({}),summary({interrupted:true})).reason,'scope');
 const numpad=summary({pack:'numpad',targetKeys:['1',' '],reference:'1 1 1 1 1 1',typed:'1 1 9 1 1 1'});
 assert.equal(numpad.rows[0].correct,5);
 assert.equal(numpad.rows[0].attempted,6);
});

test('guided accuracy routine requires two consecutive qualifying attempts in the same keyboard mode',()=>{
 const attempt=(correct=6,attempted=6,overrides={})=>({
  rows:[{key:'a',correct,attempted},{key:' ',correct:6,attempted:6}],
  mode:'standard-exact',interrupted:false,...overrides
 });
 const initial=createFocusRoutine(95);
 assert.deepEqual(initial,{goal:95,streak:0,mode:null,status:'ready'});
 const first=advanceFocusRoutine(initial,attempt());
 assert.equal(first.streak,1);
 assert.equal(first.status,'qualified');
 assert.equal(advanceFocusRoutine(first,attempt(5)).streak,0);
 assert.equal(advanceFocusRoutine(first,attempt(5)).status,'below-goal');
 const second=advanceFocusRoutine(first,attempt());
 assert.equal(second.streak,FOCUS_ROUTINE_ATTEMPTS);
 assert.equal(second.status,'complete');
 assert.deepEqual(advanceFocusRoutine(second,attempt(0)),second,'completed routine remains completed');
 assert.equal(initial.streak,0,'updates do not mutate previous state');
 const modeChange=advanceFocusRoutine(first,attempt(6,6,{mode:'mobile-assisted'}));
 assert.equal(modeChange.streak,1,'switching mode cannot count as second qualifying attempt');
 assert.equal(modeChange.mode,'mobile-assisted');
 assert.equal(advanceFocusRoutine(modeChange,attempt(6,6,{mode:'mobile-assisted'})).status,'complete');
 assert.equal(advanceFocusRoutine(first,attempt(4,4)).status,'insufficient');
 assert.equal(advanceFocusRoutine(first,attempt(4,4)).streak,0);
 const interrupted=advanceFocusRoutine(first,attempt(0,6,{interrupted:true}));
 assert.equal(interrupted.status,'interrupted');
 assert.equal(interrupted.streak,1);
 assert.equal(advanceFocusRoutine(interrupted,attempt()).status,'complete');
});

test('routine uses the exact selected goal, requires every key, and never persists results',()=>{
 assert.equal(createFocusRoutine(20).goal,95);
 const r=createFocusRoutine(98);
 const almost={mode:'standard-exact',rows:[{key:'a',correct:97,attempted:99},{key:' ',correct:99,attempted:99}]};
 assert.equal(Math.round(97/99*100),98,'rounded display can reach 98 despite falling short of exact goal');
 assert.equal(advanceFocusRoutine(r,almost).status,'below-goal');
 assert.equal(advanceFocusRoutine(createFocusRoutine(95),almost).status,'qualified');
 assert.equal(advanceFocusRoutine(r,{...almost,rows:[]}).status,'insufficient');
 assert.deepEqual(Object.keys(advanceFocusRoutine(r,almost)).sort(),['goal','mode','status','streak']);
 assert.equal(advanceFocusRoutine(null,almost),null);
});

test('saved focus plan is opt-in configuration only and is independent of result history',()=>{
 const s=storage(), plan={pack:'everyday',seconds:30,goal:98,keys:['a',' ']};
 assert.equal(readFocusPlan(s),null);
 assert.equal(saveFocusPlan({...plan,reference:'private',typed:'draft',streak:2,at:'date'},s),true);
 assert.deepEqual(readFocusPlan(s),plan);
 assert.deepEqual(JSON.parse(s.getItem(SAVED_FOCUS_PLAN_KEY)),plan);
 s.setItem('panic.speed.results.v1','[]');
 assert.equal(clearSpeedResults(s),true);
 assert.deepEqual(readFocusPlan(s),plan);
 assert.equal(saveFocusPlan({pack:'numpad',seconds:15,goal:95,keys:['7',' ']},s),true);
 assert.equal(readFocusPlan(s).pack,'numpad');
 assert.equal(clearFocusPlan(s),true);
 assert.equal(readFocusPlan(s),null);
});

test('saved focus plans reject malformed, oversized, unsupported or out-of-scope configuration',()=>{
 const s=storage(), plan={pack:'everyday',seconds:30,goal:98,keys:['a',' ']};
 for(const invalid of [null,[],{...plan,pack:'__proto__'},{...plan,keys:[]},{...plan,keys:['a','a']},{...plan,keys:['<']},{...plan,keys:['a','b','c','d','e','f']},{...plan,seconds:17},{...plan,goal:99},{...plan,goal:'98'},{...plan,pack:'numpad'}]){
  assert.equal(normalizeFocusPlan(invalid),null);
  assert.equal(saveFocusPlan(invalid,s),false);
 }
 for(const value of ['bad JSON','x'.repeat(513),JSON.stringify({...plan,keys:['<']})]){
  s.setItem(SAVED_FOCUS_PLAN_KEY,value);
  assert.equal(readFocusPlan(s),null);
 }
 const denied={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
 assert.equal(readFocusPlan(denied),null);
 assert.equal(saveFocusPlan(plan,denied),false);
 assert.equal(clearFocusPlan(denied),false);
 assert.deepEqual(normalizeFocusPlan({pack:'atmosphere',seconds:60,goal:90,keys:['.',',']}),{pack:'atmosphere',seconds:60,goal:90,keys:['.',',']});
});

test('plan candidates use the completed focus scope and fixed routine goal, not a draft',()=>{
 const base={status:'complete',pack:'everyday',seconds:30,keyReview:{keys:[{key:'a',attempted:20,mistakes:2}]}};
 assert.deepEqual(focusPlanFromSession(base,90),{pack:'everyday',seconds:30,goal:90,keys:['a']});
 assert.deepEqual(focusPlanFromSession({...base,targetKeys:['t',' '],focusRoutine:{goal:98}},90),{pack:'everyday',seconds:30,goal:98,keys:['t',' ']});
 assert.equal(focusPlanFromSession({...base,status:'running'},90),null);
 assert.equal(focusPlanFromSession({...base,keyReview:{keys:[]}},90),null);
});

test('guided activity is opt-in, counts completion transitions only, and clears independently',()=>{
 const s=storage(), now=new Date(2026,10,27,12), before={status:'qualified'}, after={status:'complete'};
 assert.equal(recordGuidedCompletion(before,after,s,now),false);
 assert.equal(s.getItem(GUIDED_ACTIVITY_KEY),null);
 assert.equal(enableGuidedActivity(s,now),true);
 assert.equal(recordGuidedCompletion(before,after,s,now),true);
 assert.equal(recordGuidedCompletion(after,after,s,now),false);
 assert.equal(recordGuidedCompletion(null,after,s,now),false);
 assert.equal(recordGuidedCompletion(before,before,s,now),false);
 assert.equal(enableGuidedActivity(s,now),true);
 assert.deepEqual(readGuidedActivity(s,now),{enabled:true,days:{'2026-11-27':1}});
 assert.equal(summarizeGuidedActivity(readGuidedActivity(s,now),now).today,1);
 s.setItem(SAVED_FOCUS_PLAN_KEY,'plan');
 s.setItem('panic.speed.results.v1','[]');
 assert.equal(clearGuidedActivity(s),true);
 assert.equal(s.getItem(SAVED_FOCUS_PLAN_KEY),'plan');
 assert.equal(s.getItem('panic.speed.results.v1'),'[]');
 assert.equal(readGuidedActivity(s,now),null);
});
test('guided activity bounds calendar data and ignores invalid counts and future days',()=>{
 const s=storage(), now=new Date(2026,10,27,12);
 s.setItem(GUIDED_ACTIVITY_KEY,JSON.stringify({enabled:true,days:{
  '2026-10-28':3,'2026-10-29':2,'2026-11-26':1,'2026-11-27':999,
  '2026-11-28':7,'2026-11-25':-2,'2026-11-24':'5','2026-11-23':1000},typed:'private'}));
 const summary=summarizeGuidedActivity(readGuidedActivity(s,now),now);
 assert.equal(summary.days.length,30);
 assert.equal(summary.days[0].key,'2026-10-29');
 assert.equal(summary.total,1002);
 assert.equal(summary.activeDays,3);
 assert.equal(recordGuidedCompletion({status:'qualified'},{status:'complete'},s,now),true);
 assert.deepEqual(JSON.parse(s.getItem(GUIDED_ACTIVITY_KEY)),{enabled:true,days:{'2026-10-29':2,'2026-11-26':1,'2026-11-27':999}});
 s.setItem(GUIDED_ACTIVITY_KEY,'x'.repeat(4097));
 assert.equal(readGuidedActivity(s,now),null);
 const denied={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
 assert.equal(readGuidedActivity(denied,now),null);
 assert.equal(enableGuidedActivity(denied,now),false);
 assert.equal(clearGuidedActivity(denied),false);
});

test('daily practice prefers completed activity, ongoing routines, saved plans, then missed keys and regular practice',()=>{
 const now=new Date(2026,10,27,12), plan={pack:'numpad',seconds:15,goal:98,keys:['7',' ']};
 const session={pack:'technology',seconds:60,status:'complete',keyReview:{keys:[{key:'t'}]}};
 const activity={enabled:true,days:{'2026-11-27':2}};
 assert.deepEqual(recommendDailyPractice(session,plan,activity,now),{kind:'done-today',today:2});
 assert.equal(recommendDailyPractice({...session,focusRoutine:{status:'complete'}},plan,null,now).kind,'done-session');
 assert.equal(recommendDailyPractice({...session,focusRoutine:{status:'qualified'}},plan,null,now).kind,'continue');
 assert.deepEqual(recommendDailyPractice(session,plan,null,now),{kind:'saved',plan});
 assert.deepEqual(recommendDailyPractice(session,null,null,now),{kind:'review',keys:['t'],pack:'technology',seconds:60});
 assert.deepEqual(recommendDailyPractice({...session,status:'idle'},null,null,now),{kind:'regular',pack:'technology',seconds:60});
 assert.deepEqual(recommendDailyPractice(null,{...plan,keys:['<']},null,now),{kind:'regular',pack:'everyday',seconds:30});
 assert.equal(recommendDailyPractice(session,plan,activity,new Date(2026,10,28,12)).kind,'saved','previous calendar day does not satisfy today');
 assert.equal(recommendDailyPractice(session,plan,{enabled:false,days:activity.days},now).kind,'saved','disabled tracking cannot infer today was completed');
});

test('milestones are rolling, optional, distinct from skill ratings, and do not require consecutive days',()=>{
 const now=new Date(2026,10,27,12);
 const data={enabled:true,days:{'2026-11-27':3,'2026-11-24':1,'2026-11-19':1,'2026-11-15':2,'2026-10-29':1,'2026-10-28':99,'2026-11-28':99}};
 const summary=summarizeTrainingMilestones(data,now);
 assert.equal(summary.reached,3);
 assert.deepEqual(summary.milestones.map(({id,reached})=>[id,reached]),[
  ['first-routine',true],['three-days',true],['five-routines',true],['seven-days',false],['ten-routines',false],['fourteen-days',false]
 ]);
 assert.deepEqual(summary.recent,{routines:4,activeDays:2,from:'2026-11-21',through:'2026-11-27'});
 assert.deepEqual(summary.previous,{routines:3,activeDays:2,from:'2026-11-14',through:'2026-11-20'});
 assert.equal(summarizeTrainingMilestones(null,now),null);
 assert.equal(summarizeTrainingMilestones({enabled:false,days:data.days},now),null);
 assert.equal(summarizeTrainingMilestones({enabled:true,days:{}},now).reached,0);
 assert.equal(summarizeTrainingMilestones(data,new Date(2027,0,1,12)).reached,0,'old activity leaves the rolling window');
 assert.equal(data.days['2026-10-28'],99,'derived summary does not mutate input');
});
test('milestone windows are seven local calendar days across year and month boundaries',()=>{
 const now=new Date(2027,0,3,12);
 const summary=summarizeTrainingMilestones({enabled:true,days:{'2026-12-21':2,'2026-12-27':3,'2026-12-28':4,'2027-01-03':1}},now);
 assert.deepEqual(summary.recent,{routines:5,activeDays:2,from:'2026-12-28',through:'2027-01-03'});
 assert.deepEqual(summary.previous,{routines:5,activeDays:2,from:'2026-12-21',through:'2026-12-27'});
 assert.equal(summary.milestones.find(m=>m.id==='ten-routines').reached,true);
});

test('accuracy ladder requires three explicit qualifying rounds, exact fractions and sufficient positions',()=>{
 let ladder=createAccuracyLadder();
 assert.equal(nextAccuracyLadder(ladder),null);
 assert.equal(evaluateAccuracyLadder(ladder,{correct:19,characters:19}).status,'insufficient');
 assert.equal(evaluateAccuracyLadder(ladder,{correct:17,characters:20}).status,'below-goal');
 assert.equal(evaluateAccuracyLadder(ladder,{correct:20,characters:20},true).status,'interrupted');
 ladder=evaluateAccuracyLadder(ladder,{correct:18,characters:20});
 assert.deepEqual(ladder,{stage:0,status:'passed'});
 ladder=nextAccuracyLadder(ladder);
 assert.deepEqual(ladder,{stage:1,status:'ready'});
 assert.equal(evaluateAccuracyLadder(ladder,{correct:37,characters:39}).status,'insufficient');
 const failure=evaluateAccuracyLadder(ladder,{correct:37,characters:40});
 assert.deepEqual(retryAccuracyLadder(failure),{stage:1,status:'ready'});
 ladder=nextAccuracyLadder(evaluateAccuracyLadder(ladder,{correct:38,characters:40}));
 assert.deepEqual(ladder,{stage:2,status:'ready'});
 assert.equal(evaluateAccuracyLadder(ladder,{correct:97,characters:99,accuracy:98}).status,'below-goal');
 ladder=evaluateAccuracyLadder(ladder,{correct:98,characters:100});
 assert.deepEqual(ladder,{stage:2,status:'complete'});
 assert.equal(nextAccuracyLadder(ladder),null);
 assert.deepEqual(retryAccuracyLadder(ladder),createAccuracyLadder());
 assert.deepEqual(ACCURACY_LADDER.map(s=>s.seconds),[15,30,60]);
 assert.equal(focusPlanFromSession({status:'complete',accuracyLadder:ladder,pack:'everyday',seconds:60,keyReview:{keys:[{key:'a'}]}},95),null);
});

test('survival shares five final mistakes across complete timed waves',()=>{
 let run=createSurvival();
 assert.equal(nextSurvival(run),null);
 assert.equal(evaluateSurvival(run,{correct:9,characters:9},10).status,'timeout');
 assert.deepEqual(evaluateSurvival(run,{correct:0,characters:10},10,true),{wave:0,remaining:5,status:'interrupted'});
 assert.deepEqual(restartSurvival(evaluateSurvival(run,{correct:0,characters:10},10,true)),run);
 assert.deepEqual(evaluateSurvival(run,{correct:4,characters:10},10),{wave:0,remaining:0,status:'depleted'});
 run=evaluateSurvival(run,{correct:7,characters:10},10);
 assert.deepEqual(run,{wave:0,remaining:2,status:'passed'});
 assert.deepEqual(restartSurvival(run),createSurvival());
 run=nextSurvival(run);
 run=evaluateSurvival(run,{correct:8,characters:10},10);
 assert.deepEqual(run,{wave:1,remaining:0,status:'passed'});
 for(let wave=2;wave<5;wave++){
  run=nextSurvival(run);
  assert.equal(run.wave,wave);
  assert.equal(evaluateSurvival(run,{correct:9,characters:10},10).status,'depleted');
  run=evaluateSurvival(run,{correct:10,characters:10},10);
 }
 assert.deepEqual(run,{wave:4,remaining:0,status:'complete'});
 assert.equal(nextSurvival(run),null);
 assert.deepEqual(restartSurvival(run),createSurvival());
 assert.deepEqual(SURVIVAL_WAVES,[8,12,16,20,24]);
 assert.equal(focusPlanFromSession({status:'complete',survival:run,pack:'everyday',seconds:30,keyReview:{keys:[{key:'a'}]}},95),null);
});

test('adaptive circuit adjusts exact difficulty, clamps extremes, and counts five non-interrupted rounds',()=>{
 let run=createAdaptiveCircuit();
 assert.equal(run.tier,1);
 assert.equal(createAdaptiveCircuit(99).tier,1);
 assert.equal(nextAdaptiveCircuit(run),null);
 let paused=evaluateAdaptiveCircuit(run,{correct:10,characters:10},10,true);
 assert.equal(paused.status,'interrupted');
 assert.deepEqual(restartAdaptiveCircuit(paused),run);
 assert.equal(paused.results.length,0);
 run=evaluateAdaptiveCircuit(run,{correct:98,characters:100},100);
 assert.equal(run.results.at(-1).nextTier,2);
 run=nextAdaptiveCircuit(run);
 run=evaluateAdaptiveCircuit(run,{correct:97,characters:99},99);
 assert.equal(run.results.at(-1).nextTier,2,'rounded 98 is below exact 98%');
 run=nextAdaptiveCircuit(run);
 run=evaluateAdaptiveCircuit(run,{correct:9,characters:9},10);
 assert.equal(run.results.at(-1).nextTier,1,'unfinished passage eases difficulty even if accurate');
 run=nextAdaptiveCircuit(run);
 run=evaluateAdaptiveCircuit(run,{correct:89,characters:100},100);
 assert.equal(run.results.at(-1).nextTier,0);
 run=nextAdaptiveCircuit(run);
 run=evaluateAdaptiveCircuit(run,{correct:0,characters:0},10);
 assert.equal(run.results.at(-1).nextTier,0);
 assert.equal(run.status,'complete');
 assert.equal(run.results.length,5);
 assert.equal(nextAdaptiveCircuit(run),null);
 assert.deepEqual(restartAdaptiveCircuit(run),createAdaptiveCircuit());
 assert.equal(evaluateAdaptiveCircuit(createAdaptiveCircuit(4),{correct:20,characters:20},20).results[0].nextTier,4);
 assert.deepEqual(CIRCUIT_TIERS,[6,10,14,18,22]);
 assert.equal(focusPlanFromSession({status:'complete',adaptiveCircuit:run,pack:'everyday',seconds:30,keyReview:{keys:[{key:'a'}]}},95),null);
});
