import test from 'node:test';
import assert from 'node:assert/strict';
import { MOBILE_TYPING_FIELDS, nextSpeedCue, mobileScrollDelta } from '../web/ui/mobile-typing.js';

test('every practice input is tracked for keyboard visibility',()=>{
 assert.deepEqual([...MOBILE_TYPING_FIELDS],['speed-input','lyric-input','lesson-input']);
});
test('mobile speed cue follows the exact character, preserving spaces',()=>{
 const a=nextSpeedCue('cat dog','ca');
 assert.equal(a.next,'t');
 assert.equal(a.rest,' dog');
 assert.equal(a.remaining,5);
 const b=nextSpeedCue('cat dog','cat');
 assert.equal(b.next,' ');
 assert.equal(b.rest,'dog');
 assert.equal(nextSpeedCue('abc','abc').next,'');
 assert.equal(nextSpeedCue('abc','abc').remaining,0);
 assert.equal(nextSpeedCue('abc','longer').next,'');
});
test('keyboard viewport scroll correction only moves when necessary',()=>{
 assert.equal(mobileScrollDelta({top:60,bottom:300},0,620),0);
 assert.equal(mobileScrollDelta({top:400,bottom:700},0,600),112);
 assert.equal(mobileScrollDelta({top:0,bottom:100},20,600),-32);
 assert.equal(mobileScrollDelta({top:0,bottom:800},0,300),512);
 assert.equal(mobileScrollDelta({top:200,bottom:300},0,0),0);
});
