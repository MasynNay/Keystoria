import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// The cinematic SVG is a local presentation only. Simulate story progress
// without a co-op server to ensure repeated incorrect keys do not churn DOM.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const variant of [
   {width:390,height:844,touch:true},
   {width:1440,height:844,touch:false},
 ]){
  const context=await browser.newContext({viewport:{width:variant.width,height:variant.height},
    isMobile:variant.touch,hasTouch:variant.touch});
  try{
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
   const actual=await page.evaluate(async()=>{
    const {setCinematicTypingProgress}=await import('./assets/ui/cinematic-cuts.js?v=0.1.1');
    const host=document.createElement('section');
    host.innerHTML=`<svg><rect id="shot-completion-fill" width="0" height="3"></rect></svg>
      <div class="cinematic-closeup">
       <span class="shot-story-message" data-encoded="ABCDEFGH" data-decoded="RESCUED!">???</span>
      </div>
      <div id="cinema-art"></div>
      <span id="cinema-action-status"></span>`;
    document.body.append(host);
    const room={role:'hacker',target:{text:'HELLO WORLD'}};
    const field=host.querySelector('#shot-completion-fill');
    const message=host.querySelector('.shot-story-message');
    const status=host.querySelector('#cinema-action-status');
    const camera=host.querySelector('#cinema-art');
    setCinematicTypingProgress(room,'HELLO');
    const initialWidth=field.getAttribute('width');
    const initialMessage=message.textContent;
    const initialStatus=status.textContent;
    const statusTextNode=status.firstChild;
    const messageTextNode=message.firstChild;
    const observer=new MutationObserver(()=>{});
    observer.observe(host,{attributes:true,characterData:true,childList:true,subtree:true});
    for(let n=0;n<25;n++){
     // Everything after the wrong separator keeps the same correct prefix.
     setCinematicTypingProgress(room,'HELLO!'+String(n));
    }
    const staleMutations=observer.takeRecords().length;
    setCinematicTypingProgress(room,'HELLO ');
    const forwardMutations=observer.takeRecords().length;
    const forwarded={
     width:field.getAttribute('width'),
     status:status.textContent,
     message:message.textContent,
     stableStatusNode:status.firstChild===statusTextNode,
     stableMessageNode:message.firstChild===messageTextNode,
    };
    room.role='defender';
    setCinematicTypingProgress(room,'HELLO ');
    const defense={
     typing:camera.style.getPropertyValue('--typing-progress'),
     defense:camera.style.getPropertyValue('--defense-progress'),
     status:status.textContent,
     textNodeStable:status.firstChild===statusTextNode,
    };
    observer.takeRecords();
    for(let n=0;n<25;n++)setCinematicTypingProgress(room,'HELLO x'+String(n));
    const defenseIdleMutations=observer.takeRecords().length;
    observer.disconnect();
    host.remove();
    return {initialWidth,initialMessage,initialStatus,staleMutations,
      forwardMutations,forwarded,defense,defenseIdleMutations};
   });
   assert.ok(Number(actual.initialWidth)>0,'correct prefix advances cinematic progress');
   assert.match(actual.initialStatus,/ACTION IN PROGRESS/);
   assert.equal(actual.staleMutations,0,
    'wrong-key repeats at unchanged progress must not rewrite SVG, text or style');
   assert.ok(actual.forwardMutations>0,'new correct prefix updates the scene');
   assert.ok(Number(actual.forwarded.width)>Number(actual.initialWidth));
   assert.ok(actual.forwarded.stableStatusNode,'status text node survives correct typing');
   assert.ok(actual.forwarded.stableMessageNode,'decoded story text node survives correct typing');
   assert.notEqual(actual.forwarded.status,actual.initialStatus);
   assert.equal(actual.defense.typing,'0','defender progress never affects the hacker actuator');
   assert.ok(Number(actual.defense.defense)>0);
   assert.match(actual.defense.status,/DEFENSE INTERCEPT/);
   assert.ok(actual.defense.textNodeStable,'role changes retain the status text node');
   assert.equal(actual.defenseIdleMutations,0,
    'repeated invalid defender input must not churn the scene');
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[],'cinematic progress never throws in touch or desktop contexts');
 console.log('PASS: Story cinematic progress avoids redundant SVG/style/text mutations on phone and desktop, preserving text nodes and defender/hacker semantics');
}finally{await browser.close();}
