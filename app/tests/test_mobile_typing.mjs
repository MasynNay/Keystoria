import test from 'node:test';
import assert from 'node:assert/strict';
import { MOBILE_TYPING_FIELDS, nextSpeedCue, mobileScrollDelta, mobileFocusBounds, patchMobileTraining } from '../web/ui/mobile-typing.js';

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

test('keyboard scroll target keeps prompt and input, not buttons below them',()=>{
 const wrap={top:100,bottom:710,height:610};
 const cue={top:110,bottom:180,height:70};
 const fieldBox={top:224,bottom:276,height:52};
 const field={
  getBoundingClientRect:()=>fieldBox,
  closest:()=>({getBoundingClientRect:()=>wrap,querySelector:()=>({getBoundingClientRect:()=>cue})})
 };
 assert.deepEqual(mobileFocusBounds(field),{top:110,bottom:276});
 assert.equal(mobileScrollDelta(mobileFocusBounds(field),0,340),0,
  'prompt and input already fit: do not scroll solely to expose lower action buttons');
 assert.ok(mobileScrollDelta(wrap,0,340)>200,'old wrapper-based correction would hide the prompt');
 field.closest=()=>({querySelector:()=>({getBoundingClientRect:()=>({top:0,bottom:0,height:0})})});
 assert.deepEqual(mobileFocusBounds(field),fieldBox,'hidden prompt falls back to input');
 field.closest=()=>null;
 assert.deepEqual(mobileFocusBounds(field),fieldBox,'missing wrapper stays safe');
 assert.equal(mobileFocusBounds(null),null);
});
test('tall prompt prioritizes typing input on a short keyboard viewport',()=>{
 const big={top:10,bottom:410,height:400};
 const input={top:440,bottom:500,height:60};
 const field={getBoundingClientRect:()=>input,closest:()=>({querySelector:()=>({getBoundingClientRect:()=>big})})};
 assert.deepEqual(mobileFocusBounds(field),{top:10,bottom:500});
 assert.equal(mobileScrollDelta(mobileFocusBounds(field),0,300),212,
  'a prompt taller than the visual viewport keeps the input visible');
});

test('Academy mobile advancement retains the original focused input node',()=>{
 const original={value:'previous',readOnly:false,disabled:false};
 const fresh={value:'',readOnly:true,disabled:true};
 const old={querySelector(selector){return selector==='#lesson-input'?original:null;}};
 const next={querySelector(selector){return selector==='#lesson-input'?fresh:null;}};
 assert.equal(patchMobileTraining(old,next),true);
 assert.equal(old.querySelector('#lesson-input'),original);
 assert.equal(original.value,'');
 assert.equal(original.readOnly,true);
 assert.equal(original.disabled,true);
});
test('Academy completion does not patch or detach its input',()=>{
 const original={value:'keep',readOnly:false,disabled:false};
 const old={querySelector(selector){return selector==='#lesson-input'?original:null;}};
 const next={querySelector(selector){return selector==='.training-complete'?{}:null;}};
 assert.equal(patchMobileTraining(old,next),false);
 assert.equal(original.value,'keep');
 assert.equal(original.disabled,false);
});
