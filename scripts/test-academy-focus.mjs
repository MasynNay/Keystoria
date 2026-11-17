import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Keyboard and touch/desktop focus continuity across complete Academy courses.
// The randomized order is read from the actual game; no test-only lesson data.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try {
 for(const {width,height,phone} of [
  {width:390,height:844,phone:true},
  {width:844,height:390,phone:true},
  {width:320,height:844,phone:false},
  {width:1440,height:844,phone:false},
 ]){
  const ctx=await browser.newContext({
   viewport:{width,height},isMobile:phone,hasTouch:phone,reducedMotion:'reduce'
  });
  const page=await ctx.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count()&&await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="learn"][data-os="linux"]').click();
  const input=page.locator('#lesson-input');
  const cue=page.locator('#academy-step-announcement');
  assert.equal(await input.getAttribute('aria-describedby'),'lesson-target-text training-feedback');
  assert.equal(await cue.getAttribute('role'),'status');
  assert.equal(await cue.getAttribute('aria-live'),'polite');
  assert.equal(await cue.getAttribute('aria-atomic'),'true');
  const inputNode=phone?await input.evaluate(el=>{window.__academyOriginal=el;return el.isConnected;}):null;
  if(phone)assert.equal(inputNode,true);
  assert.equal(await input.evaluate(el=>document.activeElement===el),true,
   'opening Academy focuses the native typing field at '+width+'x'+height);
  let total=0;
  for(let i=0;i<20;i++){
   const steps=await page.locator('.terminal-bar').innerText();
   const m=steps.match(/STEP\s+(\d+)\s*\/\s*(\d+)/);
   assert.ok(m,'a numbered active step is displayed: '+steps);
   total=Number(m[2]);
   assert.equal(Number(m[1]),i+1,'step count must advance exactly once');
   const target=(await page.locator('#lesson-target-text').textContent()).trim();
   assert.ok(target.length>0,'command is available to keyboard and screen-reader users');
   await input.fill(target);
   if(i===0){
    // Clicking CHECK replaces the activated button with a NEXT button.
    // Focus must follow that new action rather than falling back to the body.
    const selector=phone
     ?'.academy-mobile-entry .mobile-entry-actions [data-action="training-submit"]'
     :'.terminal-inner > .training-buttons [data-action="training-submit"]';
    const check=page.locator(selector);
    await check.focus();
    await check.click();
    assert.match(await page.locator('#training-feedback').innerText(),/COMMAND RECOGNIZED/);
    assert.equal(await page.evaluate(()=>document.activeElement?.dataset.action),'training-next',
     'button activation must focus visible NEXT action at '+width+'x'+height);
    const next=page.locator(phone
     ?'.academy-mobile-entry .mobile-entry-actions [data-action="training-next"]'
     :'.terminal-inner > .training-buttons [data-action="training-next"]');
    await next.click();
   }else{
    // Physical Enter submits and, on second press, advances without
    // detaching focus from the real native input.
    await input.press('Enter');
    assert.match(await page.locator('#training-feedback').innerText(),/COMMAND RECOGNIZED/);
    assert.equal(await input.evaluate(el=>document.activeElement===el),true,
     'accepted command retains keyboard focus at step '+(i+1));
    await input.press('Enter');
   }
   if(i===total-1)break;
   assert.equal(await input.evaluate(el=>document.activeElement===el),true,
    'new command receives keyboard focus after advancing at step '+(i+2));
   assert.equal(await input.inputValue(),'','new command begins with clean input');
   assert.equal(await input.getAttribute('readonly'),null,'next step must be editable');
   const upcoming=(await page.locator('#lesson-target-text').textContent()).trim();
   assert.equal(await cue.textContent(),
    'Step '+(i+2)+' of '+total+'. Type: '+upcoming,
    'polite step cue reflects the next command exactly once');
   if(phone)assert.equal(await input.evaluate(el=>document.querySelector('#lesson-input')===window.__academyOriginal),true,
    'the native phone input remains the same DOM node');
  }
  assert.ok(total>1&&total<=20,'all lesson commands completed in finite number of steps');
  const complete=page.locator('#academy-complete-heading');
  assert.equal(await complete.textContent(),'MISSION ACCOMPLISHED.');
  assert.equal(await complete.getAttribute('tabindex'),'-1','completion heading receives managed focus but is not in Tab order');
  assert.equal(await complete.evaluate(el=>document.activeElement===el),true,
   'finishing the course focuses the result heading, not a removed input');
  assert.equal(await page.locator('#lesson-input').count(),0,'finished lesson has no stale typing input');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.action),'training-restart',
   'Tab from completion heading reaches replay lesson');
  await ctx.close();
 }
 assert.deepEqual(errors,[],'no uncaught runtime errors');
 console.log('PASS: Academy keyboard/button focus, persistent mobile input, step announcements and course completion');
}finally{await browser.close();}
