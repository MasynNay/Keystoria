import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS } from '../web/ui/missions.js';
import { renderActionStage } from '../web/ui/scene-action-stage.js';
import { renderSceneSVG } from '../web/ui/scene-illustrations.js';
import { missionScene } from '../web/ui/mission-scenes.js';


globalThis.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
const {createViews}=await import('../web/ui/views.js');
const state={online:true,selectedMission:'dead_air',nickname:'TEST',preferences:{},modal:null};
const views=createViews(state);
const snapshot=(mission,step=0)=>({
 mission,stage:step<5?1:2,progress:step<5?step:step-5,worldWarning:false,
 crisisActive:false,fieldOps:{history:[]},ambient:25,world:{label:'PRESSURE'},
 overallProgress:Math.round(step/11*100),objectivesComplete:step,objectivesTotal:11,
 role:'hacker',target:{id:'test',text:'test typing task'},missionInfo:{briefing:{}}
});

test('homepage puts single-player first and offers a readable welcome guide',()=>{
 const home=views.homeTemplate();
 const solo=home.indexOf('data-action="solo"');
 const duo=home.indexOf('data-action="create"');
 assert.ok(solo>0 && solo<duo);
 state.modal='welcome';
 const modal=views.modalTemplate();
 for(const phrase of ['WELCOME / KEYSTORIA','SINGLE PLAYER','TWO PLAYER CO-OP','SPEED LAB + ACADEMY','LET\'S PLAY'])assert.ok(modal.includes(phrase),phrase);
 assert.match(modal,/aria-modal="true"/);
 assert.match(modal,/data-action="close-modal"/);
});

test('all twelve story stages contain unique action artwork at multiple narrative beats',()=>{
 const ids=Object.keys(MISSIONS);
 assert.equal(ids.length,24);
 const firstShots=[];
 for(const id of ids){
  const first=renderActionStage(snapshot(id),0);
  const ending=renderActionStage(snapshot(id,10),10);
  assert.match(first,new RegExp(`data-action-world="${id}"`));
  assert.match(first,/action-world-props/);
  assert.notEqual(first,ending);
  const scene=renderSceneSVG(snapshot(id,4),4,false);
  assert.match(scene,/action-stage/);
  assert.match(scene,/cinematic-closeup/);
  const html=missionScene(snapshot(id));
  assert.doesNotMatch(html,/id="cinema-impact"/);
  assert.match(html,/scene-camera-glow/);
  firstShots.push(first);
 }
 assert.equal(new Set(firstShots).size,ids.length);
});

test('typing-driven progress is visual only, without bypassing server mission authority',()=>{
 const stage=renderActionStage(snapshot('dead_air'),3);
 assert.match(stage,/act-route/);
 assert.doesNotMatch(stage,/data-action="submit"/);
 assert.doesNotMatch(stage,/on(click|input|keydown)\s*=/i);
});

test('defender sees a separate animated intercept barrier instead of hacker hardware progress',()=>{
 const scene=renderActionStage({...snapshot('last_stop',2),role:'defender'},2);
 assert.match(scene,/data-operator-role="defender"/);
 assert.match(scene,/action-defense-layer/);
 assert.match(scene,/INTERCEPT THE THREAT/);
 const hacker=renderActionStage({...snapshot('last_stop',2),role:'hacker'},2);
 assert.match(hacker,/data-operator-role="hacker"/);
 assert.notEqual(scene,hacker);
});

test('different objectives in one mission receive different animated focus cues',()=>{
 const first=renderActionStage(snapshot('dead_air',0),0);
 const later=renderActionStage(snapshot('dead_air',3),3);
 assert.match(first,/data-action-focus="radio"/);
 assert.match(later,/data-action-focus="flood"/);
 assert.notEqual(first,later);
});
