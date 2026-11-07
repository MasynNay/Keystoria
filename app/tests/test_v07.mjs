import test from 'node:test';
import assert from 'node:assert/strict';
import { missionScene, sceneStory, sceneStep } from '../web/ui/mission-scenes.js';
import { MISSIONS } from '../web/ui/missions.js';
import { speedTemplate } from '../web/ui/speed-view.js';
import { createWordStream } from '../web/ui/speed-engine.js';

const snapshot=(mission,progress=0,stage=1)=>({
  mission,stage,progress,worldWarning:false,crisisActive:false,
});

test('every mission has a genuine illustration and all twelve authored scenes',()=>{
  for(const mission of Object.keys(MISSIONS)){
    const captions=new Set();
    for(let frame=0;frame<12;frame++){
      const room=snapshot(mission,frame<5?frame:frame-5,frame<5?1:2);
      assert.equal(sceneStep(room),frame);
      const [title,description]=sceneStory(room);
      assert.ok(title.length>11,`${mission} has an empty scene title`);
      assert.ok(description.length>55,`${mission} lacks narrative context for scene ${frame}`);
      captions.add(title);
      const html=missionScene(room);
      assert.match(html,/<svg[^>]*viewBox="0 0 780 260"/);
      assert.match(html,/<\/svg>/);
      assert.match(html,/class="cinema-art"/);
      assert.match(html, /cinema-progress-track/);
    }
    assert.equal(captions.size,12,`${mission} repeats a scene title`);
  }
});

test('scene changes are driven by server-confirmed progress and show danger explicitly',()=>{
  const initial=missionScene(snapshot('last_stop'));
  assert.match(initial,/NO BRAKES/);
  assert.match(initial,/BRIDGE DESTROYED/);
  const later=missionScene({...snapshot('last_stop',5,2),worldWarning:true});
  assert.match(later,/THE WHEELS FINALLY BITE/);
  assert.match(later,/DANGER \/\/ ACT NOW/);
  assert.notEqual(initial,later);
});

test('Speed Lab uses one continuous passage instead of pages or word cards',()=>{
  const session={pack:'technology',seconds:60,reference:createWordStream('technology',700,()=>.4),
    typed:'',startedAt:null,status:'idle',keystrokes:0,result:null};
  globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
  const output=speedTemplate(session,()=>'');
  assert.match(output,/CONTINUOUS PASSAGE/);
  assert.match(output,/speed-letters/);
  assert.doesNotMatch(output,/WORD CARD/);
  assert.doesNotMatch(output,/id="speed-page"/);
});
