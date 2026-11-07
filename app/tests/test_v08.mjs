/** The Academy course randomizer and visual extraction presentation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, randomizedCourseOrder, activeCommandIndex } from '../web/ui/lessons.js';
import { trainingTemplate } from '../web/ui/training-view.js';
import { renderSceneSVG } from '../web/ui/scene-illustrations.js';
import { missionScene } from '../web/ui/mission-scenes.js';
import { safe } from '../web/ui/helpers.js';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key,value) => storage.set(key,String(value)),
};
const {createViews}=await import('../web/ui/views.js');

test('every OS course shuffles all fourteen unique commands, without reference corruption', () => {
  for (const os of Object.keys(LESSONS)) {
    const order = randomizedCourseOrder(os, () => 0);
    assert.equal(order.length,14);
    assert.equal(new Set(order).size,14);
    assert.deepEqual([...order].sort((a,b)=>a-b),Array.from({length:14},(_,i)=>i));
    assert.notDeepEqual(order, Array.from({length:14},(_,i)=>i));
    const state = {os, order, index:0, completed:false, answered:false, draft:'', errors:0, review:false};
    const expected = LESSONS[os].commands[activeCommandIndex(state)];
    const html=trainingTemplate(state, () => '<header></header>');
    assert.ok(html.includes(safe(expected.title)));
    assert.match(html,/YOUR NEXT COMMAND/);
    assert.match(html, /RANDOMIZED PRACTICE ORDER/);
    assert.equal((html.match(/class="glossary-line/g)||[]).length,14);
  }
});

test('replays get different command order with independent random streams', () => {
  for (const os of Object.keys(LESSONS)) {
    const first = randomizedCourseOrder(os, () => 0.001);
    const second = randomizedCourseOrder(os, () => 0.99);
    assert.notDeepEqual(first, second);
  }
});

test('all six missions have local SVG final illustrations and progress readouts', () => {
  for (const mission of ['station','hollow','outbreak','casefile','dead_air','last_stop']) {
    const r={mission,stage:2,progress:5,objectivesComplete:10,objectivesTotal:11,overallProgress:91,worldWarning:false,crisisActive:false};
    assert.match(renderSceneSVG(r,11,false), new RegExp(`scene-world-${mission}`));
    const ui = missionScene(r);
    assert.match(ui,/aria-valuenow="91"/);
    assert.match(ui,/91%/);
    assert.match(ui,/EXTRACTION TELEMETRY/);
  }
});

test('all six result screens are explicit about victory, failure, and solo or duo outcomes', () => {
  const {resultsTemplate} = createViews({online:true,selectedMission:'station'});
  const missionInfos = {
    station:['STATION ZERO','Station safe'],hollow:['THE HOLLOW HOUSE','Curse lifted'],
    outbreak:['PATIENT ZERO','Cure delivered'],casefile:['THE LAST ALIBI','Verdict reached'],
    dead_air:['DEAD AIR','Signal restored'],last_stop:['LAST STOP','Train stopped'],
  };
  for (const [mission,[title,outcome]] of Object.entries(missionInfos)) {
    for (const phase of ['won','lost']) {
      const room = {
        mission,phase,missionInfo:{title,win:outcome,lose:'Failure',briefing:{outro:'Everyone is safe.',stakes:'People were in danger.'}},
        players:[{id:'1',name:'PLAYER',bot:false,score:200,correct:2,mistakes:0,bestStreak:2}],
        viewerId:'1',hostId:'1',typing:[{id:'1',accuracy:100,wpm:60}],
        discovered:[],storyRecap:[],finalGrade:phase==='won'?'S':'F',
        finalScore:phase==='won'?999:0,remaining:40,stability:phase==='won'?99:0,
        objectivesComplete:phase==='won'?11:5,objectivesTotal:11,overallProgress:phase==='won'?100:45,
        difficultyLabel:'Cadet',pulsesUsed:0,ambient:25,world:{label:'PRESSURE'},solo:true,
        finishReason:phase==='won'?'All objectives completed.':'The mission clock ran out.',
        stage:phase==='won'?2:1,progress:phase==='won'?6:5,
        runId:`test-${mission}-${phase}`,
      };
      const result=resultsTemplate(room);
      assert.match(result,/WHY THIS MISSION ENDED/);
      assert.match(result,/SOLO WITH ECHO/);
      assert.match(result,/result-cinema/);
      assert.match(result,phase==='won'?/OPERATION SUCCESSFUL/:/OPERATION FAILED/);
      assert.match(result,phase==='won'?/100% SECURED/:/45% SECURED/);
    }
  }
});
