import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeSpeedActivity} from '../web/ui/speed-insights.js';

const now=new Date(2026,10,22,18,15);
const onDay=(offset,hour=12)=>new Date(2026,10,22-offset,hour).toISOString();
const record=at=>({pack:'everyday',seconds:30,wpm:40,accuracy:96,at});

test('seven device-local calendar days are oldest to newest, inclusive of today',()=>{
 const rows=[
  record(onDay(0)),record(onDay(0,16)),record(onDay(1)),
  record(onDay(3)),record(onDay(6)),record(onDay(7)),
  record(onDay(-1)),record(onDay(0,23)),
  {pack:'numpad',seconds:30,wpm:12,cpm:60,at:onDay(6)},
 ];
 const summary=summarizeSpeedActivity(rows,now);
 assert.equal(summary.days.length,7);
 assert.deepEqual(summary.days.map(d=>d.key),[
  '2026-11-16','2026-11-17','2026-11-18','2026-11-19',
  '2026-11-20','2026-11-21','2026-11-22'
 ]);
 assert.deepEqual(summary.days.map(d=>d.count),[2,0,1,0,0,1,2]);
 assert.equal(summary.activeDays,4);
 assert.equal(summary.savedRuns,6);
 assert.equal(summary.undated,2,'future timestamps are not counted as practiced');
 assert.equal(summary.capped,false);
});

test('activity is honest about legacy undated runs, malformed data and retained limits',()=>{
 const legacy=Array.from({length:26},()=>({pack:'everyday',seconds:30,wpm:25}));
 legacy[0].at=onDay(0);
 legacy[24].at=onDay(2);
 legacy[25].at=onDay(1); // beyond saved 25-row cap: must not count
 const summary=summarizeSpeedActivity(legacy,now);
 assert.equal(summary.savedRuns,2);
 assert.equal(summary.activeDays,2);
 assert.equal(summary.undated,23);
 assert.equal(summary.capped,true);
 assert.deepEqual(summarizeSpeedActivity([],now).days.map(d=>d.count),Array(7).fill(0));
 assert.equal(summarizeSpeedActivity(null,now).savedRuns,0);
 assert.equal(summarizeSpeedActivity([{at:'not-a-date'},null],now).undated,2);
});

test('activity does not claim lifetime streaks or compare assisted, exact or numpad speeds',()=>{
 const rows=[
  {pack:'numpad',wpm:8,cpm:40,practiceMode:'standard-exact',at:onDay(0)},
  {pack:'everyday',wpm:180,practiceMode:'mobile-assisted',at:onDay(0)},
  {pack:'everyday',wpm:33,practiceMode:'mobile-exact',at:onDay(2)},
 ];
 const s=summarizeSpeedActivity(rows,now);
 assert.equal(s.savedRuns,3,'all saved categories contribute equally to activity only');
 assert.equal(s.activeDays,2);
 assert.equal('streak' in s,false);
 assert.equal('best' in s,false);
 assert.equal('accuracy' in s,false);
});
