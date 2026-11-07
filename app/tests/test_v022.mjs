import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MISSIONS } from '../web/ui/missions.js';
import { MISSION_COLORS } from '../web/ui/mission-colors.js';
import { MISSION_ICON_IDS,missionIcon } from '../web/ui/mission-icons.js';
import { SCENE_BEATS } from '../web/ui/scene-narratives.js';
import { STORYBOARDS } from '../web/ui/cinematic-storyboards.js';
import { FRONTIER_WORLD_IDS,renderFrontierScene } from '../web/ui/scene-frontier.js';
import { renderSceneSVG } from '../web/ui/scene-illustrations.js';
import { missionScene,roleStoryShot } from '../web/ui/mission-scenes.js';
const NEW=['clockfall','nightmarket','emberwing','deepvault','aurora_arc','inkbound'];
const make=(mission,step=0,role='hacker')=>({mission,role,stage:step<5?1:2,progress:step<5?step:step-5,fieldOps:{history:[]},ambient:19,worldWarning:false,crisisActive:false,world:{label:'DANGER'},target:{id:`${mission}:${step}`,text:'trace the protected escape route',explanation:'Recover the missing people and protect the team before the next hazard.'},objectivesComplete:step,objectivesTotal:11,overallProgress:Math.round(step*100/11)});
test('24 chapters include six new independent covers, palettes, narrative beats and dialogue',()=>{
 assert.equal(Object.keys(MISSIONS).length,24);
 assert.equal(Object.keys(MISSION_COLORS).length,24);
 assert.equal(new Set(Object.values(MISSION_COLORS).map(x=>x[0])).size,24);
 assert.deepEqual([...FRONTIER_WORLD_IDS].sort(),[...NEW].sort());
 assert.deepEqual([...MISSION_ICON_IDS].sort(),Object.keys(MISSIONS).sort());
 const arts=[];
 for(const mission of NEW){
   assert.ok(MISSIONS[mission].name && MISSIONS[mission].sub && MISSIONS[mission].quote,mission);
   assert.equal(SCENE_BEATS[mission].length,12,mission);
   assert.equal(STORYBOARDS[mission].dialogue.length,11,mission);
   assert.equal(STORYBOARDS[mission].focus.length,11,mission);
   assert.match(missionIcon(mission),new RegExp('data-mission-mark="'+mission+'"'));
   arts.push(renderFrontierScene(make(mission),0,false));
 }
 assert.equal(new Set(arts).size,6);
});
test('all six environments show meaningful confirmed story milestones, remain isolated in scene, and handle danger',()=>{
 for(const mission of NEW){
   const different=[];
   for(const step of [0,4,5,8,10]){
     const room=make(mission,step);
     const copy=JSON.stringify(room);
     const svg=renderSceneSVG(room,step,true);
     assert.match(svg,new RegExp(`data-frontier-world="${mission}"`),mission);
     assert.match(svg,new RegExp(`data-frontier-step="${step}"`),mission);
     assert.match(svg,/frontier-danger/,mission);
     assert.match(svg,/cinematic-closeup/,mission);
     assert.match(svg,/action-stage/,mission);
     assert.equal(JSON.stringify(room),copy,'renderer must not alter the authoritative story');
     different.push(svg);
   }
   assert.equal(new Set(different).size,5,mission);
   assert.match(missionScene(make(mission,5,'defender')), /DEFENSE \/ LIVE COUNTERMEASURE/);
   assert.notEqual(roleStoryShot(make(mission,5,'defender'),5).dialogue,roleStoryShot(make(mission,5,'hacker'),5).dialogue);
 }
});
test('v0.22 includes motion reduced-motion support and accurate cache version',()=>{
 const css=readFileSync(new URL('../web/styles/v022.css', import.meta.url),'utf8');
 const html=readFileSync(new URL('../web/index.html', import.meta.url),'utf8');
 assert.match(css,/prefers-reduced-motion:reduce/);
 for(const name of ['frontier-time-hand','frontier-dragon','frontier-aurora-band','frontier-bubbles'])assert.match(css,new RegExp(name));
 assert.match(html,/v022\.css\?v=0\.24\.0/);
});
