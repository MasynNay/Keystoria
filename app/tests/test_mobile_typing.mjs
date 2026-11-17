import test from 'node:test';
import assert from 'node:assert/strict';
import { MOBILE_TYPING_FIELDS, nextSpeedCue, mobileScrollDelta, mobileFocusBounds, patchMobileTraining, previousWordRange, speedSpokenTarget } from '../web/ui/mobile-typing.js';

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

test('Back Word deletes prior token while preserving suffix, grouping and selections',()=>{
 assert.deepEqual(previousWordRange('alpha beta',10),{start:6,end:10});
 assert.deepEqual(previousWordRange('alpha beta ',11),{start:6,end:11});
 assert.deepEqual(previousWordRange('alpha beta gamma',10),{start:6,end:11},
  'delete a middle word and its following separator to avoid duplicate spaces');
 assert.deepEqual(previousWordRange('alpha beta gamma',8),{start:6,end:8},
  'an in-word caret removes only text before the caret');
 assert.deepEqual(previousWordRange('123 4567 890',8),{start:4,end:9},
  'number-pad groups are treated as words');
 assert.deepEqual(previousWordRange('alpha beta',6,10),{start:6,end:10},
  'a selection is deleted exactly rather than expanding to a full word');
 assert.deepEqual(previousWordRange('alpha beta',10,6),{start:6,end:10},
  'backward selections are normalized');
 assert.deepEqual(previousWordRange('alpha beta',0),{start:0,end:0},
  'start-of-field is a no-op');
 assert.deepEqual(previousWordRange('',0),{start:0,end:0});
 assert.deepEqual(previousWordRange('word',100),{start:0,end:4},
  'out-of-range caret positions cannot delete past the field');
});

test('Speed Lab spoken target follows whole words without announcing each character',()=>{
 assert.equal(speedSpokenTarget('alpha beta',''),'Current word: alpha');
 assert.equal(speedSpokenTarget('alpha beta','a'),'Current word: alpha');
 assert.equal(speedSpokenTarget('alpha beta','alph'),'Current word: alpha');
 assert.equal(speedSpokenTarget('alpha beta','alpha'),'Current word: alpha');
 assert.equal(speedSpokenTarget('alpha beta','alpha '),'Current word: beta');
 assert.equal(speedSpokenTarget('alpha beta','alpha b'),'Current word: beta');
 assert.equal(speedSpokenTarget('alpha beta','alpha'),'Current word: alpha',
  'backspacing across a word boundary returns to the preceding target');
 assert.equal(speedSpokenTarget('alpha beta','alpha beta'),'Passage complete');
 assert.equal(speedSpokenTarget('alpha   beta','alpha '),'Current word: beta',
  'repeated spaces do not create blank announcements');
 assert.equal(speedSpokenTarget('hello, world!','hello, '),'Current word: world!',
  'spoken targets keep punctuation in the displayed drill');
 assert.equal(speedSpokenTarget('', ''),'Passage complete');
});

test('Speed Lab Numpad spoken target uses independent digit-group language',()=>{
 const reference='123 4567 890';
 assert.equal(speedSpokenTarget(reference,'',true),'Current number group: 123');
 assert.equal(speedSpokenTarget(reference,'12',true),'Current number group: 123');
 assert.equal(speedSpokenTarget(reference,'123 ',true),'Current number group: 4567');
 assert.equal(speedSpokenTarget(reference,'123 4567 ',true),'Current number group: 890');
 assert.equal(speedSpokenTarget(reference,reference,true),'Passage complete');
});
