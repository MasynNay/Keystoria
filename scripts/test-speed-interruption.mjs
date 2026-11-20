import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

// Production browser code, not a fake controller. Browser visibility events
// are simulated: actual iOS/Android app switching still needs device QA.
const localController=readFileSync(new URL('../app/web/ui/speed-controller.js',import.meta.url),'utf8');
const browserController=readFileSync(new URL('../site/play/assets/ui/speed-controller.js',import.meta.url),'utf8');
assert.equal(localController,browserController,'shared Speed Lab timer must match across editions');
// The views intentionally have local-vs-hosted navigation wording, so check
// the interruption surface rather than comparing their complete source.
for(const filename of ['../app/web/ui/speed-view.js','../site/play/assets/ui/speed-view.js']){
 const view=readFileSync(new URL(filename,import.meta.url),'utf8');
 for(const marker of ['id="speed-pause-banner"','data-action="speed-resume"',
  'INTERRUPTED PRACTICE (NOT SAVED)','practice-only and was not added to personal records']){
  assert.ok(view.includes(marker),filename+' lacks shared pause UI: '+marker);
 }
}
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
async function scenario({width,height,phone,numpad}){
 const ctx=await browser.newContext({viewport:{width,height},isMobile:phone,hasTouch:phone});
 const page=await ctx.newPage();
 page.setDefaultTimeout(10000);
 page.on('pageerror',error=>errors.push(String(error)));
 try{
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count()&&await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="speed-open"]').first().click();
  if(numpad)await page.locator('[data-action="speed-pack"][data-pack="numpad"]').click();
  const input=page.locator('#speed-input'),banner=page.locator('#speed-pause-banner');
  const mode=page.locator('#speed-mode');
  const reference=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
  assert.ok(reference.length>500,'full scoring reference exists');
  assert.equal(await banner.isVisible(),false,'do not show pause before interruption');
  await page.evaluate(()=>{
   window.__testHidden=false;
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__testHidden});
   window.__visibilityForTest=(hidden)=>{
    window.__testHidden=hidden;
    document.dispatchEvent(new Event('visibilitychange'));
   };
  });
  await page.evaluate(()=>window.__visibilityForTest(true));
  assert.equal(await banner.isVisible(),false,'idle warmup does not pause on background');
  await page.evaluate(()=>window.__visibilityForTest(false));
  const typed=reference.slice(0,12);
  await input.fill(typed);
  assert.equal(await mode.textContent(),'SESSION LIVE');
  await page.evaluate(()=>window.__visibilityForTest(true));
  assert.equal(await banner.isVisible(),true,'running drill pauses on background');
  assert.equal(await mode.textContent(),'PAUSED · RESUME TO CONTINUE');
  assert.equal(await input.getAttribute('readonly'),'',
   'paused input is kept mounted but cannot be edited');
  const clock=await page.locator('#speed-time').textContent();
  await page.waitForTimeout(400);
  assert.equal(await page.locator('#speed-time').textContent(),clock,
   'background time cannot reduce the remaining clock');
  assert.equal(await input.inputValue(),typed);
  await input.evaluate(el=>{
   el.value='tampered during pause';
   el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await input.inputValue(),typed,'paused run cannot accept new characters');
  await banner.locator('[data-action="speed-resume"]').evaluate(el=>el.click());
  assert.equal(await banner.isVisible(),true,'hidden tab cannot resume its own clock');
  await page.evaluate(()=>window.__visibilityForTest(false));
  assert.equal(await banner.isVisible(),true,'foregrounding requires an explicit user decision');
  assert.equal(await mode.textContent(),'PAUSED · RESUME TO CONTINUE');
  await banner.locator('[data-action="speed-resume"]').click();
  assert.equal(await banner.isVisible(),false);
  assert.equal(await mode.textContent(),'SESSION LIVE');
  assert.equal(await input.getAttribute('readonly'),null,'input is editable after resume');
  assert.equal(await input.inputValue(),typed);
  assert.equal(await input.evaluate(el=>document.activeElement===el),true,
   'Resume brings focus back to the original typing field');
  await input.fill(reference);
  await page.locator('#speed-results-heading').waitFor();
  assert.match(await page.locator('.speed-assist-result-label').innerText(),/INTERRUPTED PRACTICE \(NOT SAVED\)/);
  assert.match(await page.locator('.speed-results > p').last().innerText(),/practice-only.*not added to personal records/i);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('panic.speed.results.v1')||'[]').length),0,
   'interrupted score must not enter personal bests or history');
  await page.locator('[data-action="speed-restart"]').first().click();
  assert.equal(await page.locator('#speed-pause-banner').isVisible(),false);
  assert.equal(await page.locator('#speed-time').textContent(),'30');
  const fresh=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
  await page.locator('#speed-input').fill(fresh);
  await page.locator('#speed-results-heading').waitFor();
  assert.doesNotMatch(await page.locator('.speed-assist-result-label').innerText(),/INTERRUPTED/);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('panic.speed.results.v1')||'[]'));
  assert.equal(saved.length,1,'uninterrupted sessions still save normally');
  assert.equal(saved[0].interrupted,undefined,'exported result schema remains unchanged');

  // A page restored from the back/forward cache may never become "hidden"
  // before pagehide fires. Simulate persisted navigation without reloading
  // and insist that the existing timed run stops and requires user action.
  await page.locator('[data-action="speed-restart"]').first().click();
  const restoredReference=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
  const restoredStart=restoredReference.slice(0,18);
  await page.locator('#speed-input').fill(restoredStart);
  assert.equal(await page.locator('#speed-mode').textContent(),'SESSION LIVE');
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  assert.equal(await page.locator('#speed-pause-banner').isVisible(),true,
   'pagehide pauses even when the document.hidden signal has not fired');
  assert.equal(await page.locator('#speed-input').inputValue(),restoredStart);
  assert.equal(await page.locator('#speed-input').getAttribute('readonly'),'');
  await page.evaluate(()=>{
   window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
   window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
  });
  assert.equal(await page.locator('#speed-pause-banner').isVisible(),true,
   'duplicate navigation events cannot auto-resume a suspended session');
  await page.locator('#speed-pause-banner [data-action="speed-resume"]').click();
  assert.equal(await page.locator('#speed-pause-banner').isVisible(),false);
  assert.equal(await page.locator('#speed-input').inputValue(),restoredStart);
  await page.locator('#speed-input').fill(restoredReference);
  await page.locator('#speed-results-heading').waitFor();
  assert.match(await page.locator('.speed-assist-result-label').innerText(),/INTERRUPTED PRACTICE/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('panic.speed.results.v1')||'[]').length),1,
   'BFCache-interrupted practice cannot replace the one comparable saved run');

  // A player may also pause deliberately to answer a question or step
  // away from the keyboard. Such runs must never alter comparable records.
  await page.locator('[data-action="speed-restart"]').first().click();
  const manualRef=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
  const pauseActions=page.locator('[data-action="speed-pause"]');
  assert.equal(await pauseActions.count(),2,'thumb and desktop pause controls use the same action');
  assert.deepEqual(await pauseActions.evaluateAll(nodes=>nodes.map(n=>n.disabled)),[true,true],
   'pause cannot be activated before the timer starts');
  const manualInput=page.locator('#speed-input');
  await manualInput.fill(manualRef.slice(0,22));
  const livePause=page.locator('[data-action="speed-pause"]:visible').first();
  assert.equal(await livePause.isEnabled(),true,'running drill enables the visible Pause action');
  await livePause.click();
  assert.equal(await page.locator('#speed-pause-banner').isVisible(),true);
  assert.equal(await page.locator('#speed-mode').textContent(),'PAUSED · RESUME TO CONTINUE');
  assert.equal(await manualInput.getAttribute('readonly'),'');
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.action),'speed-resume',
   'manual pause hands keyboard focus to the Resume action');
  assert.deepEqual(await pauseActions.evaluateAll(nodes=>nodes.map(n=>n.disabled)),[true,true],
   'both Pause actions disable while already paused');
  const pausedValue=await manualInput.inputValue();
  const pausedClock=await page.locator('#speed-time').textContent();
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#speed-time').textContent(),pausedClock,
   'manual pause also stops elapsed clock time');
  await manualInput.evaluate(el=>{
   el.value='unwanted edit';
   el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await manualInput.inputValue(),pausedValue,
   'a manually paused run cannot accept synthetic input');
  await page.locator('#speed-pause-banner [data-action="speed-resume"]').click();
  assert.equal(await page.locator('#speed-pause-banner').isVisible(),false);
  assert.equal(await manualInput.inputValue(),pausedValue);
  assert.equal(await manualInput.evaluate(el=>document.activeElement===el),true,
   'Resume returns to the original native input');
  assert.equal(await livePause.isEnabled(),true);
  await manualInput.fill(manualRef);
  await page.locator('#speed-results-heading').waitFor();
  assert.match(await page.locator('.speed-assist-result-label').innerText(),/INTERRUPTED PRACTICE/);
  assert.match(await page.locator('.speed-results > p').last().innerText(),/practice-only.*not added to personal records/i);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('panic.speed.results.v1')||'[]').length),1,
   'manual pauses cannot change comparable history');
  await page.evaluate(()=>window.__visibilityForTest(true));
  assert.equal(await page.locator('#speed-pause-banner').count(),0,'finished result must not pause');
  console.log('PASS speed interruption '+width+'x'+height+(numpad?' numpad':phone?' touch':' desktop'));
 }finally{await ctx.close();}
}
try{
 for(const spec of [
  {width:390,height:844,phone:true,numpad:false},
  {width:844,height:390,phone:true,numpad:false},
  {width:1440,height:844,phone:false,numpad:false},
  {width:390,height:844,phone:true,numpad:true},
 ])await scenario(spec);
 assert.deepEqual(errors,[],'no browser errors in pause/resume flows');
 console.log('PASS: background suspension and non-comparable results across layouts');
}finally{await browser.close();}
