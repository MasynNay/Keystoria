import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Story mode is normally server-owned. Exercise its actual page-level
// keyboard manager with a minimal local Story DOM fixture; this never
// connects to a WebSocket server or simulates a physical OS keyboard.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const {width,height,touch} of [
  {width:390,height:844,touch:true},
  {width:844,height:390,touch:true},
  {width:1440,height:844,touch:false},
 ]){
  const context=await browser.newContext({
   viewport:{width,height},isMobile:touch,hasTouch:touch,reducedMotion:'no-preference',
  });
  try{
   const page=await context.newPage();
   page.setDefaultTimeout(12000);
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
   await page.locator('#app .brand-name').waitFor();
   const welcome=page.locator('.welcome-continue');
   if(await welcome.count()&&await welcome.isVisible())await welcome.click();
   await page.evaluate(()=>{
    const host=document.createElement('section');
    host.id='story-keyboard-fixture';
    host.innerHTML=`<div class="mission-input-pane">
      <div class="command-card">
       <div id="target-text" class="target-text typing-feedback">
        <span class="type-char current">H</span><span class="type-char pending">E</span>
       </div>
      </div>
      <label for="task-input">Mission command</label>
      <div class="typing-input-wrap"><input id="task-input" type="text" autocomplete="off"></div>
    </div>`;
    document.getElementById('app').append(host);
   });
   const field=page.locator('#task-input');
   await field.focus();
   const active=await page.evaluate(()=>document.body.classList.contains('mobile-typing-active'));
   assert.equal(active,touch,'Story native keyboard state matches mobile breakpoint');
   const bounds=await page.evaluate(async()=>{
    const {mobileFocusBounds}=await import('./assets/ui/mobile-typing.js?v=0.50.1');
    const input=document.getElementById('task-input');
    const target=document.getElementById('target-text');
    return {bounds:mobileFocusBounds(input),
      target:target.getBoundingClientRect().toJSON(),
      input:input.getBoundingClientRect().toJSON()};
   });
   assert.ok(bounds.bounds.top<=bounds.target.top&&bounds.bounds.bottom>=bounds.input.bottom,
    'Story viewport bounds include both visible target and native input');
   await field.type('HELLO');
   assert.equal(await field.inputValue(),'HELLO');
   assert.equal(await field.evaluate(el=>document.activeElement===el),true);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await page.evaluate(()=>{
    const field=document.getElementById('task-input');
    const target=document.getElementById('target-text');
    field.getBoundingClientRect=()=>({top:1180,bottom:1230,width:280,height:50});
    target.getBoundingClientRect=()=>({top:1100,bottom:1150,width:280,height:50});
    window.__storyViewportScrolls=[];
    window.scrollBy=arg=>window.__storyViewportScrolls.push(arg);
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
   });
   if(touch){
    await page.waitForFunction(()=>window.__storyViewportScrolls?.length===1);
    const report=await page.evaluate(()=>({
     moves:window.__storyViewportScrolls,
     focused:document.activeElement===document.getElementById('task-input'),
     value:document.getElementById('task-input').value,
    }));
    assert.equal(report.moves.length,1,'resize burst schedules one keyboard correction');
    assert.equal(report.moves[0].behavior,'instant');
    assert.ok(report.moves[0].top>0,'keyboard correction scrolls Story input into view');
    assert.equal(report.focused,true,'keyboard correction never steals native input focus');
    assert.equal(report.value,'HELLO','viewport change retains draft');
   }else{
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
    assert.equal(await page.evaluate(()=>window.__storyViewportScrolls?.length),0,
      'wide desktop Story input must not trigger mobile keyboard correction');
   }
   await page.locator('.prefs-toggle').focus();
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
   assert.equal(await page.evaluate(()=>document.body.classList.contains('mobile-typing-active')),false,
    'Story mobile keyboard state clears when the player leaves input');
   await page.evaluate(()=>{
    window.__storyViewportScrolls=[];
    window.dispatchEvent(new Event('resize'));
   });
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
   assert.equal(await page.evaluate(()=>window.__storyViewportScrolls?.length),0,
    'blurred Story field cannot trigger stale keyboard scrolling');
   console.log('PASS Story keyboard focus/bounds/resize at '+width+'x'+height+(touch?' touch':' desktop'));
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[],'Story keyboard fixture has no uncaught page errors');
 console.log('PASS: Story mobile input keyboard recovery includes command cue and never steals focus');
}finally{await browser.close();}
