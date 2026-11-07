import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS } from '../web/ui/lessons.js';
import { COMMAND_GUIDES } from '../web/ui/command-guides.js';
import { trainingTemplate } from '../web/ui/training-view.js';
import { MISSIONS } from '../web/ui/missions.js';

const header=()=>'<header>TEST</header>';
const state = { os:'linux', index:2, answered:false, draft:'cd ', errors:0, completed:false, review:false,errorMessage:'',referenceIndex:0 };

test('all 42 Academy commands have real-world guidance, benefits, and cautions',()=>{
  for (const [os,course] of Object.entries(LESSONS)) {
    assert.equal(COMMAND_GUIDES[os].length,course.commands.length);
    for (const entry of COMMAND_GUIDES[os]) {
      assert.ok(entry.use.length>55);
      assert.ok(entry.benefit.length>55);
      assert.ok(entry.caution.length>48);
    }
  }
});

test('the Academy reference selection does not replace the active exercise',()=>{
  const html = trainingTemplate(state,header);
  assert.match(html,/STEP 03 \/ 14/);
  assert.match(html,/id="lesson-target-text"/);
  assert.match(html,/CURRENT/);
  assert.match(html,/PS C:|operator@academy/);
  assert.match(html,/SELECTED COMMAND 01/);
  assert.match(html,/REAL-WORLD EXAMPLE/);
  assert.match(html,/data-index="13"/);
  assert.equal((html.match(/data-action="training-reference"/g) || []).length,14);
  assert.match(html,/value="cd "/);
});

test('completed courses keep clickable references and display the final guide',()=>{
  const html=trainingTemplate({...state,completed:true,answered:true,index:13,referenceIndex:3},header);
  assert.match(html,/MISSION ACCOMPLISHED/);
  assert.match(html,/SELECTED COMMAND 04/);
  assert.equal((html.match(/data-action="training-reference"/g) || []).length,14);
  assert.equal((html.match(/<article>/g)||[]).length,14);
});

test('new operations have metadata and distinct selectable identities',()=>{
  assert.equal(Object.keys(MISSIONS).length,24);
  assert.match(MISSIONS.dead_air.sub,/flooded city/);
  assert.match(MISSIONS.last_stop.sub,/180 passengers/);
});
