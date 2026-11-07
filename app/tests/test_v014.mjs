import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS } from '../web/ui/missions.js';
import { missionIcon } from '../web/ui/mission-icons.js';
import { renderStoryVista } from '../web/ui/scene-vistas.js';
import { renderSceneSVG } from '../web/ui/scene-illustrations.js';
globalThis.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
const {createViews}=await import('../web/ui/views.js');

const ids=Object.keys(MISSIONS);
const room=(mission,step)=>({mission,stage:step<5?1:2,progress:step<5?step:step-5,worldWarning:false,crisisActive:false,fieldOps:{history:[]},ambient:22});
const views=createViews({online:true,selectedMission:'station',nickname:'NOVA',preferences:{},modal:null});

test('all twelve mission icons share identical framing and geometry but retain unique pictograms',()=>{
 const symbols=ids.map(id=>missionIcon(id));
 assert.equal(symbols.length,24);
 for(const svg of symbols){assert.match(svg,/viewBox="0 0 80 80"/);assert.match(svg,/mission-mark-art/);assert.match(svg,/<circle cx="40" cy="40" r="36"/);}
 assert.equal(new Set(symbols.map(s=>s.replace(/data-mission-mark="[^"]+"/,'data-mission-mark=""'))).size,24);
 const home=views.homeTemplate();
 assert.equal((home.match(/mission-crest-art/g)||[]).length,24);
 assert.equal((home.match(/mission-cover-mark/g)||[]).length,24);
});

test('all twelve environmental animations have a unique local set and state changes',()=>{
 const idsSeen=[];
 for(const mission of ids){
   const results=[0,4,9].map(step=>renderStoryVista(room(mission,step),step,false));
   for(const svg of results){
     assert.match(svg, new RegExp(`data-world-vista="${mission}"`));
     assert.match(svg,/v-typed-route|v-pulse|v-approach|v-hover|v-rotor|v-typed-gate|v-trace|v-scanner/);
     assert.match(svg,/clip-path="url\(#v-clip\)"/);
   }
   assert.notEqual(results[0],results[2]);
   assert.notEqual(renderStoryVista(room(mission,5),5,true),results[0]);
   const composed=renderSceneSVG(room(mission,7),7,false);
   assert.match(composed,/story-vista/);
   idsSeen.push(results[0].split('data-world-vista="')[1].split('"')[0]);
 }
 assert.equal(new Set(idsSeen).size,24);
});

test('countdown turns into an actual Play button and never renders a typing field',()=>{
 const state={mission:'dead_air',phase:'armed',countdownSeconds:0,paused:false,role:'hacker',viewerId:'human',launchReadyPlayers:['bot'],players:[{id:'human',name:'Nova'},{id:'bot',name:'ECHO'}],missionInfo:{briefing:{opening:'Intro',hacker:'Solve the emergency',defender:'Protect the transmitter',stageObjectives:['Restore broadcast']} }};
 const html=views.countdownTemplate(state);
 assert.match(html,/data-action="launch"/);
 assert.match(html,/PLAY MISSION/);
 assert.doesNotMatch(html,/id="task-input"/);
 const ready=views.countdownTemplate({...state,launchReadyPlayers:['human','bot']});
 assert.match(ready,/WAITING FOR PARTNER/);
 assert.match(ready,/disabled/);
});
