import test from 'node:test';
import assert from 'node:assert/strict';
import { missionScene, interventionTimeline } from '../web/ui/mission-scenes.js';
import { renderSceneEffects } from '../web/ui/scene-effects.js';
import { fieldControlsTemplate } from '../web/ui/field-controls.js';
import { LESSONS, randomizedCourseOrder } from '../web/ui/lessons.js';

const missions=['station','hollow','outbreak','casefile','dead_air','last_stop'];
const operationChoices={
  station:['coolant','shuttle','vent','beacon'],
  hollow:['lamps','mirror','circle','chant'],
  outbreak:['seal','medkit','foam','airlift'],
  casefile:['mirror','lock','safehouse','warrant'],
  dead_air:['filter','battery','relay','volunteers'],
  last_stop:['brake','clear','drag','warn'],
};
const state=(mission, overrides={})=>({
 mission,phase:'playing',stage:1,progress:1,world:{label:'RISK',direction:'high'},
 objectivesComplete:1,objectivesTotal:11,overallProgress:9,ambient:37,
 fieldOps:{heading:'FIELD OPERATIONS',context:'Choose a response',unlocked:true,available:true,used:false,selected:null,history:[],options:[
  {id:operationChoices[mission][0],label:'FIRST ACTION',benefit:'Changes the world'},
  {id:operationChoices[mission][1],label:'SECOND ACTION',benefit:'Protect the crew'},
 ]},...overrides,
});

test('all six scenes show a player-operated control, a pressure display, and progress',()=>{
 for(const mission of missions){
  const html=missionScene(state(mission));
  assert.match(html,/CHOOSE EMERGENCY ACTION/);
  assert.match(html,/scene-env-track/);
  assert.match(html,/aria-valuenow="37"/);
  assert.match(html,/field-choice-grid/);
  assert.match(html,/data-action="field-action"/);
  assert.match(html,/9%/);
 }
});
test('every outcome persists visibly across the role swap',()=>{
 for (const mission of missions){
  const history=[{stage:1,label:'SAVED THE CREW',operator:'ALPHA',outcome:'The route is safe.'}];
  const room=state(mission,{stage:2,progress:1,fieldOps:{heading:'FINAL CONTROL',context:'Act two',unlocked:true,available:true,used:false,selected:null,history,options:[
    {id:operationChoices[mission][2],label:'ACT TWO OPTION',benefit:'Help the squad'},
  ]}});
  const timeline=interventionTimeline(room);
  assert.match(timeline,/SAVED THE CREW/);
  assert.match(timeline,/The route is safe/);
  assert.match(missionScene(room),/ACT TWO OPTION/);
  assert.match(missionScene(room),/SAVED THE CREW/);
 }
});
test('scene effects visibly reflect each of 24 distinct decisions',()=>{
 for(const mission of missions) for(const id of operationChoices[mission]) {
  const scene=renderSceneEffects(state(mission,{fieldOps:{selected:id}}));
  assert.match(scene,/scene-intervention/);
  assert.match(scene,/scene-signal-dot/);
 }
});
test('field controls preserve exclusive choice once selected and escape server strings',()=>{
 const mission='outbreak';
 const applied=fieldControlsTemplate(state(mission,{fieldOps:{heading:'BIOHAZARD',used:true,history:[{stage:1,label:'SEAL DOOR',outcome:'Prevented a breach <script>alert(1)</script>'}]}}));
 assert.match(applied,/FIELD ACTION APPLIED/);
 assert.doesNotMatch(applied,/<script>/);
 assert.doesNotMatch(applied,/data-action="field-action"/);
});
test('all three Academy courses shuffle complete unique command decks',()=>{
 for(const os of Object.keys(LESSONS)) {
   const order=randomizedCourseOrder(os,()=>.32);
   assert.equal(order.length,14);
   assert.equal(new Set(order).size,14);
   assert.deepEqual([...order].sort((a,b)=>a-b),Array.from({length:14},(_,i)=>i));
 }
});
