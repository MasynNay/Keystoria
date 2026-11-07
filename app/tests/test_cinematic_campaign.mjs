import test from 'node:test';
import assert from 'node:assert/strict';
import { STORYBOARDS, currentShot } from '../web/ui/cinematic-storyboards.js';
import { SCENE_BEATS } from '../web/ui/scene-narratives.js';
import { MISSIONS } from '../web/ui/missions.js';
import { renderCinematicCut } from '../web/ui/cinematic-cuts.js';
import { renderSceneSVG } from '../web/ui/scene-illustrations.js';

const ids = Object.keys(MISSIONS);

test('nine chapters have eleven directed shots with actual character dialogue', () => {
  assert.equal(ids.length,24);
  for (const id of ids) {
    const script = STORYBOARDS[id];
    assert.ok(script,`missing ${id}`);
    assert.equal(script.focus.length,11,id);
    assert.equal(script.dialogue.length,11,id);
    assert.equal(SCENE_BEATS[id].length,12,id);
    assert.ok(new Set(script.dialogue).size >= 10,id);
    for(let i=0;i<11;i++) {
      assert.ok(script.dialogue[i].includes(':'),`${id} beat ${i} should have a speaking character`);
      const shot = currentShot({mission:id},i);
      assert.equal(shot.focus,script.focus[i]);
    }
  }
});

test('all shots show an animated prop with current action progress', () => {
  for (const mission of ids) {
    for (let step=0;step<11;step++) {
      const snapshot={mission,fieldOps:{history:[]},ambient:22,worldWarning:false,crisisActive:false};
      const clip = renderCinematicCut(snapshot,step);
      assert.match(clip,/cinematic-closeup/);
      assert.match(clip,/shot-completion-fill/);
      assert.match(clip,/CLOSEUP/);
      assert.match(renderSceneSVG(snapshot,step,false),new RegExp(`scene-world-${mission}`));
    }
  }
});
