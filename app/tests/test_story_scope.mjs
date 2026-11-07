import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS } from '../web/ui/missions.js';
import { STORYBOARDS } from '../web/ui/cinematic-storyboards.js';
import { SCENE_BEATS } from '../web/ui/scene-narratives.js';
import { renderSceneSVG } from '../web/ui/scene-illustrations.js';
import { renderSceneDepth } from '../web/ui/scene-depth.js';

const keys=Object.keys(MISSIONS);
const base={fieldOps:{history:[]},ambient:10,worldWarning:false,crisisActive:false};

test('all twelve worlds have a complete scene and authored progression',()=>{
  assert.equal(keys.length,24);
  for (const mission of keys){
    assert.equal(STORYBOARDS[mission].dialogue.length,11,mission);
    assert.equal(SCENE_BEATS[mission].length,12,mission);
    for(let step=0; step<11; step++) {
      const svg=renderSceneSVG({...base,mission},step,false);
      assert.match(svg,/story-depth/,mission);
      assert.match(svg,/cinematic-closeup/,mission);
      assert.match(svg,/<svg/,mission);
      assert.ok(renderSceneDepth({mission},step).length>200,mission);
    }
  }
});

test('story camera gives real-world visual distinctions to the new chapters',()=>{
  const defs=[['whiteout',/polar-station/],['ashfall',/ashfall-bus/],['carnival',/carnival-wheel/]];
  for (const [mission,pattern] of defs){
    assert.match(renderSceneSVG({...base,mission},6,false),pattern);
  }
});
