import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { MISSIONS } from '../web/ui/missions.js';
import { SCENE_BEATS } from '../web/ui/scene-narratives.js';
import { STORYBOARDS } from '../web/ui/cinematic-storyboards.js';
import { MISSION_ICON_IDS, missionIcon } from '../web/ui/mission-icons.js';
import { renderSceneSVG } from '../web/ui/scene-illustrations.js';
import { renderLegendScene } from '../web/ui/scene-legends.js';
import { roleStoryShot,missionScene } from '../web/ui/mission-scenes.js';
import { partialDecode,decodeRevealText,renderCinematicCut } from '../web/ui/cinematic-cuts.js';
import { renderActionStage } from '../web/ui/scene-action-stage.js';

const newWorlds=['mirrorfall','four_winds','dawnforge','glass_trials','wildbond','stardoor'];
const sample=(mission,step=0,role='hacker',text='decode the distress recording')=>({
  mission,role,stage:step<5?1:2,progress:step<5?step:step-5,fieldOps:{history:[]},
  ambient:23,worldWarning:false,crisisActive:false,world:{label:'THREAT'},
  target:{id:`${mission}:${step}`,text,explanation:'Recover the hidden message and guide the missing people to safety.'},
  objectivesComplete:step,objectivesTotal:11,overallProgress:Math.round(step*100/11),
});

test('all eighteen missions have a complete illustrated campaign identity',()=>{
  assert.equal(Object.keys(MISSIONS).length,24);
  assert.deepEqual([...MISSION_ICON_IDS].sort(),Object.keys(MISSIONS).sort());
  const uniqueMarks=new Set();
  for(const id of Object.keys(MISSIONS)){
    assert.equal(SCENE_BEATS[id].length,12,id);
    assert.equal(STORYBOARDS[id].focus.length,11,id);
    assert.equal(STORYBOARDS[id].dialogue.length,11,id);
    uniqueMarks.add(missionIcon(id).replace(`data-mission-mark="${id}"`,'data-mission-mark=""'));
  }
  assert.equal(uniqueMarks.size,24);
});

test('new worlds are different backdrops with different action objects at every stage',()=>{
  for(const id of newWorlds){
    const stages=[];
    for(const step of [0,4,5,7,10]){
      const scene=renderSceneSVG(sample(id,step),step,false);
      assert.match(scene,new RegExp(`scene-world-${id}`),id);
      assert.match(scene,new RegExp(`data-legend-world="${id}"`),id);
      assert.match(scene,new RegExp(`data-action-world="${id}"`),id);
      assert.match(scene,/cinematic-closeup/,id);
      assert.match(scene,/story-director/,id);
      assert.match(scene,/story-vista/,id);
      stages.push(scene);
    }
    assert.equal(new Set(stages).size,5,id);
  }
  const worlds=newWorlds.map(id=>renderLegendScene(sample(id),0,false));
  assert.equal(new Set(worlds).size,6);
});

test('Mirrorfall inverts only its story scenery and later restores it',()=>{
  const before=renderLegendScene(sample('mirrorfall',4),4,false);
  const invert=renderLegendScene(sample('mirrorfall',5),5,false);
  const during=renderLegendScene(sample('mirrorfall',8),8,false);
  const restore=renderLegendScene(sample('mirrorfall',10),10,false);
  assert.doesNotMatch(before,/legend-inverted/);
  assert.match(invert,/legend-inverted/);
  assert.match(invert,/data-mirror-step="5"/);
  assert.match(during,/legend-inverted/);
  assert.match(restore,/legend-restored/);
  assert.match(restore,/data-mirror-step="10"/);
  const css=readFileSync(new URL('../web/styles/v017.css',import.meta.url),'utf8');
  assert.match(css,/legend-cross/);
  assert.match(css,/legend-return/);
  assert.match(css,/transform:rotate\(180deg\)/);
  assert.match(css,/prefers-reduced-motion/);
});

test('decoded evidence reveals characters only as correct typing advances',()=>{
  assert.equal(partialDecode('UVWXYZ','ABCDEF',0),'UVWXYZ');
  assert.equal(partialDecode('UVWXYZ','ABCDEF',.5),'ABCXYZ');
  assert.equal(partialDecode('UVWXYZ','ABCDEF',1),'ABCDEF');
  assert.equal(partialDecode('UVWXYZ','ABCDEF',.1),'UVWXYZ');
  assert.match(decodeRevealText('mirrorfall'),/SCHOOL/);
  assert.match(decodeRevealText('glass_trials'),/SPONSOR/);
  const hud=renderCinematicCut(sample('mirrorfall',2),2);
  assert.match(hud,/shot-story-message/);
  assert.match(hud,/data-decoded=/);
});

test('the story camera reflects hacker progress and the defender live threat independently',()=>{
  const hacker=sample('mirrorfall',3,'hacker','open the service elevator');
  const defender=sample('mirrorfall',3,'defender','hold the street anchor');
  const defenderShot=roleStoryShot(defender,3);
  const hackerShot=roleStoryShot(hacker,3);
  assert.match(defenderShot.dialogue,/Defender:/);
  assert.notEqual(defenderShot.dialogue,hackerShot.dialogue);
  assert.match(missionScene(defender),/DEFENSE \/ LIVE COUNTERMEASURE/);
  assert.match(renderActionStage(defender,3),/action-defense-layer/);
  assert.match(renderActionStage(hacker,3),/act-access/);
  assert.doesNotMatch(missionScene(hacker),/id="cinema-impact"/);
});

test('visual renderers remain read-only and do not change the scenario outcome',()=>{
  for(const id of newWorlds){
    const room=sample(id,9);
    const before=JSON.stringify(room);
    renderSceneSVG(room,9,true);
    renderActionStage(room,9);
    assert.equal(JSON.stringify(room),before,id);
  }
});

test('active objective verbs select matching physical visuals rather than unrelated props',()=>{
  const checks=[
    ['dead_air','decode the emergency message','decode','act-message-panel'],
    ['last_stop','bring the train to a stop','vehicle','act-vehicle'],
    ['four_winds','release the rain over terravale','elemental','act-elemental'],
    ['dawnforge','turn the celestial gears','forge','act-forge'],
    ['wildbond','heal the injured skyfox','creature','act-creature'],
    ['wildbond','restore the root channels','creature','act-creature'],
    ['stardoor','reweave the six realm bridges','portal','act-portal'],
    ['mirrorfall','cross into the reflected city','portal','act-portal'],
    ['glass_trials','decode the sponsor channel','decode','act-message-panel'],
    ['station','override access','access','act-access'],
  ];
  for(const [mission,text,kind,visual] of checks){
    const room=sample(mission,3,'hacker',text);
    const art=renderActionStage(room,3);
    assert.match(art,new RegExp(`data-action-mode="${kind}"`),text);
    assert.match(art,new RegExp(`class="${visual}"`),text);
  }
});

test('corrected final narrative frames describe actual completed outcomes',()=>{
  const outcomes={
    last_stop:/stop/i,
    outbreak:/cure/i,
    casefile:/evidence/i,
    dead_air:/city|route/i,
    carnival:/eighteen|riders/i,
    mirrorfall:/sealed/i,
    whiteout:/survivors/i,
  };
  for(const [mission,pattern] of Object.entries(outcomes)){
    assert.match(SCENE_BEATS[mission][11][0],pattern,mission);
    assert.equal(SCENE_BEATS[mission].length,12);
  }
});
