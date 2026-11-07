import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS } from '../web/ui/missions.js';
import { MISSION_ICON_IDS, missionIcon } from '../web/ui/mission-icons.js';
import { renderSceneDirector } from '../web/ui/scene-director.js';
import { renderSceneSVG } from '../web/ui/scene-illustrations.js';
import { DEPLOYMENT_SECONDS, deploymentDisplay } from '../web/ui/deployment.js';

const ids = Object.keys(MISSIONS);
const state = mission => ({mission,fieldOps:{history:[]},ambient:30,worldWarning:false,crisisActive:false});

test('all twelve missions have explicitly authored, nonduplicated illustrated icons', () => {
  assert.equal(ids.length,24);
  assert.deepEqual([...MISSION_ICON_IDS].sort(),[...ids].sort());
  const contents = ids.map(id => {
    const svg=missionIcon(id);
    assert.match(svg,new RegExp(`data-mission-mark="${id}"`));
    assert.match(svg,/<svg/);
    assert.match(svg,/<\/svg>/);
    assert.ok(svg.length>200);
    return svg.replace(/data-mission-mark="[^"]+"/, 'data-mission-mark=""');
  });
  assert.equal(new Set(contents).size,24,'No icon may copy another mission symbol');
});

test('all twelve animated story directors follow confirmed objectives', () => {
  for (const mission of ids) {
    const variants = new Set();
    for (const step of [0,3,6,10]) {
      const svg = renderSceneDirector(state(mission), step, false);
      assert.match(svg,/<g class="story-director"/);
      assert.match(svg,new RegExp(`data-director-world="${mission}"`));
      assert.match(svg,new RegExp(`data-beat="${step}"`));
      assert.match(svg,/director-/);
      const whole = renderSceneSVG(state(mission),step,false);
      assert.match(whole,/story-director/);
      assert.match(whole,/cinematic-closeup/);
      variants.add(svg);
    }
    assert.ok(variants.size>=3,`${mission}: plot must materially evolve`);
    assert.notEqual(renderSceneDirector(state(mission),4,true),renderSceneDirector(state(mission),4,false),`${mission}: danger has a distinct state`);
  }
});

test('story animation cannot alter the server-owned game state', () => {
  for(const mission of ids){
    const room=state(mission);
    room.stage=1;room.progress=0;
    const before=JSON.stringify(room);
    renderSceneDirector(room,7,false);
    renderSceneSVG(room,7,true);
    assert.equal(JSON.stringify(room),before);
  }
});

test('ten-second launch preserves time for story and an explicit last three seconds',()=>{
  assert.equal(DEPLOYMENT_SECONDS,10);
  for(let remaining=10;remaining>0;remaining--){
    assert.equal(deploymentDisplay(remaining).label,String(remaining));
  }
  assert.match(deploymentDisplay(8).instruction,/READ THE STORY/);
  assert.match(deploymentDisplay(5).instruction,/HANDS READY/);
  assert.match(deploymentDisplay(2).instruction,/TYPE WHEN/);
});
