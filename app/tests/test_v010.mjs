import test from 'node:test';
import assert from 'node:assert/strict';
import { DEPLOYMENT_SECONDS, deploymentDisplay } from '../web/ui/deployment.js';

test('ten-second deployment gives the user a readable mission briefing', () => {
  assert.equal(DEPLOYMENT_SECONDS, 10);
  for (const seconds of [10, 9, 8, 7]) {
    const display=deploymentDisplay(seconds);
    assert.equal(display.label,String(seconds));
    assert.equal(display.preparing,true);
    assert.match(display.instruction,/READ THE STORY/);
  }
  for (const seconds of [6, 5, 4]) {
    const display=deploymentDisplay(seconds);
    assert.equal(display.label,String(seconds));
    assert.equal(display.preparing,true);
    assert.match(display.instruction,/HANDS READY/);
  }
});

test('three-to-one final countdown stays frozen until gameplay begins', () => {
  assert.equal(deploymentDisplay(3).label, '3');
  assert.equal(deploymentDisplay(2).label, '2');
  assert.equal(deploymentDisplay(1).label, '1');
  assert.equal(deploymentDisplay(0).label, 'GO');
  assert.equal(deploymentDisplay(2.1).label,'3');
  assert.match(deploymentDisplay(2).instruction, /TYPE WHEN THE MISSION APPEARS/);
});
