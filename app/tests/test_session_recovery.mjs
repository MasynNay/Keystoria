import test from 'node:test';
import assert from 'node:assert/strict';
import { describeSessionRecovery, sessionRecoveryPanel } from '../web/ui/session-recovery.js';

test('spent reconnect pass is terminal and does not offer insecure retry', () => {
  const recovery = describeSessionRecovery('Your reconnect pass is no longer valid.', { reconnecting:true });
  assert.equal(recovery.kind,'invalid');
  assert.equal(recovery.discardSession,true);
  assert.equal(recovery.action,'new');
  assert.match(sessionRecoveryPanel(recovery),/START A NEW ROOM/);
  assert.match(sessionRecoveryPanel(recovery),/JOIN A NEW ROOM/);
  assert.doesNotMatch(sessionRecoveryPanel(recovery),/RETRY SAVED SESSION/);
});

test('expired room requires fresh identity both during play and during reconnect', () => {
  for(const context of [{hasRoom:true}, {reconnecting:true}]){
    const recovery=describeSessionRecovery('Room expired. Start a new mission.',context);
    assert.equal(recovery.kind,'expired');
    assert.equal(recovery.discardSession,true);
    assert.match(recovery.detail,/cannot restore/i);
  }
  assert.equal(describeSessionRecovery('Room expired. Start a new mission.'),null,
    'unrelated join errors must not remove a different cached session');
});

test('temporary cooldown retains identity and offers context-aware actions',()=>{
  const message='Too many room access attempts. Try again in a minute.';
  const resume=describeSessionRecovery(message,{reconnecting:true});
  assert.equal(resume.kind,'cooldown');
  assert.equal(resume.discardSession,false);
  assert.equal(resume.action,'retry');
  assert.match(sessionRecoveryPanel(resume),/RETRY SAVED SESSION/);
  const join=describeSessionRecovery(message);
  assert.equal(join.discardSession,false);
  assert.equal(join.action,'join');
  assert.match(sessionRecoveryPanel(join),/OPEN ROOM JOIN/);
  assert.doesNotMatch(sessionRecoveryPanel(join),/RETRY SAVED SESSION/);
});

test('unrelated server errors do not wipe credentials; recovery copy is accessible and fixed',()=>{
  for (const message of [
    'Room not found. Check the six-character code.',
    'Room creation limit reached. Try again in a minute.',
    'An unexpected error occurred. Please try again.',
    'Rate limit exceeded',
    '',
    null,
    'Your reconnect pass is no longer valid.',
  ]) assert.equal(describeSessionRecovery(message),null);
  const panel=sessionRecoveryPanel(describeSessionRecovery('Your reconnect pass is no longer valid.',{reconnecting:true}));
  assert.match(panel,/role="alert"/);
  assert.match(panel,/aria-labelledby="session-recovery-title"/);
  assert.match(panel,/tabindex="-1"/);
  assert.doesNotMatch(panel,/secret-token-value/);
  assert.equal(sessionRecoveryPanel(null),'');
});
