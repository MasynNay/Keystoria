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
   // Shared native keyboard handler has a 180ms blur grace period.
   await page.waitForFunction(()=>!document.body.classList.contains('mobile-typing-active'));
   assert.equal(await page.evaluate(()=>document.body.classList.contains('mobile-typing-active')),false,
    'Story mobile keyboard state clears when the player leaves input');
   await page.evaluate(()=>{
    window.__storyViewportScrolls=[];
    window.dispatchEvent(new Event('resize'));
   });
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
   assert.equal(await page.evaluate(()=>window.__storyViewportScrolls?.length),0,
    'blurred Story field cannot trigger stale keyboard scrolling');
   // Story's actual delegated input/keydown handlers must treat IME text
   // conversion as a single commit. This runs against the mounted app shell,
   // without inventing an unauthorized multiplayer room or fake socket.
   const ime=await page.evaluate(async()=>{
    const field=document.getElementById('task-input');
    const target=document.getElementById('target-text');
    field.focus();
    target.textContent='UNCOMMITTED SENTINEL';
    field.value='';
    field.dispatchEvent(new CompositionEvent('compositionstart',{
      bubbles:true,data:'候'
    }));
    field.value='候';
    field.dispatchEvent(new InputEvent('input',{
      bubbles:true,isComposing:true,inputType:'insertCompositionText',data:'候'
    }));
    const afterNative=target.textContent;
    // Some mobile browsers emit an unflagged input before compositionend.
    field.value='候補';
    field.dispatchEvent(new InputEvent('input',{
      bubbles:true,isComposing:false,inputType:'insertCompositionText',data:'補'
    }));
    const afterUnflagged=target.textContent;
    const composingEnter=new KeyboardEvent('keydown',{
      bubbles:true,cancelable:true,key:'Enter',isComposing:true
    });
    field.dispatchEvent(composingEnter);
    const legacyEnter=new KeyboardEvent('keydown',{
      bubbles:true,cancelable:true,key:'Enter'
    });
    Object.defineProperty(legacyEnter,'keyCode',{configurable:true,value:229});
    field.dispatchEvent(legacyEnter);
    const afterEnters=target.textContent;
    field.dispatchEvent(new CompositionEvent('compositionend',{
      bubbles:true,data:'候補'
    }));
    await new Promise(resolve=>queueMicrotask(resolve));
    const committed=target.textContent;
    const normalEnter=new KeyboardEvent('keydown',{
      bubbles:true,cancelable:true,key:'Enter'
    });
    field.dispatchEvent(normalEnter);
    return {
      afterNative,afterUnflagged,afterEnters,
      composingEnterBlocked:composingEnter.defaultPrevented,
      legacyEnterBlocked:legacyEnter.defaultPrevented,
      normalEnterBlocked:normalEnter.defaultPrevented,
      committed,keptValue:field.value,
      focused:document.activeElement===field,
      connected:field.isConnected
    };
   });
   assert.equal(ime.afterNative,'UNCOMMITTED SENTINEL',
     'uncommitted Story IME input must not repaint the command target');
   assert.equal(ime.afterUnflagged,'UNCOMMITTED SENTINEL',
     'unflagged native input during composition must remain guarded');
   assert.equal(ime.afterEnters,'UNCOMMITTED SENTINEL',
     'IME Enter/legacy keyCode 229 must not validate the draft');
   assert.equal(ime.composingEnterBlocked,false,
     'IME Enter must be free for the OS candidate picker');
   assert.equal(ime.legacyEnterBlocked,false,
     'legacy keyCode 229 must not intercept conversion');
   assert.equal(ime.normalEnterBlocked,true,
     'ordinary Enter after commit must retain Story submit semantics');
   assert.equal(ime.committed,'SCANNING FOR SIGNAL...',
     'compositionend must reconcile the committed Story draft exactly once');
   assert.equal(ime.keptValue,'候補');
   assert.equal(ime.focused&&ime.connected,true,
     'IME commit preserves native input identity and keyboard focus');
   console.log('PASS Story keyboard and IME composition at '+width+'x'+height+(touch?' touch':' desktop'));
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[],'Story keyboard fixture has no uncaught page errors');
 console.log('PASS: Story viewport recovery, native focus, and safe IME composition/Enter handling');
}finally{await browser.close();}
