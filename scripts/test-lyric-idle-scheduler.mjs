import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Check the controller's *actual timer lifecycle* in the bundled original
// Lyric Lab demo. No YouTube, provider service or copyrighted music required.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try {
 for(const {width,phone} of [
  {width:390,phone:true},
  {width:1440,phone:false},
 ]) {
  const context=await browser.newContext({
   viewport:{width,height:844},isMobile:phone,hasTouch:phone,reducedMotion:'reduce',
  });
  try {
   const page=await context.newPage();
   page.setDefaultTimeout(12000);
   page.on('pageerror',error=>errors.push(String(error)));
   await page.addInitScript(()=>{
    const set=window.setInterval,clear=window.clearInterval;
    const records=[];
    window.__lyricTickRecords=records;
    window.setInterval=function(callback,delay,...args){
     if(typeof callback!=='function'||callback.name!=='tick')
      return set.call(this,callback,delay,...args);
     const record={delay,calls:0,cleared:false};
     const handler=(...values)=>{record.calls++;return callback(...values);};
     const id=set.call(this,handler,delay,...args);
     record.id=id;records.push(record);
     return id;
    };
    window.clearInterval=function(id){
     for(const record of records)
      if(record.id===id)record.cleared=true;
     return clear.call(this,id);
    };
   });
   const intervals=()=>page.evaluate(()=>
    window.__lyricTickRecords.filter(record=>!record.cleared)
     .map(({delay,calls})=>({delay,calls})));
   await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
   await page.locator('#app .brand-name').waitFor();
   const welcome=page.locator('.welcome-continue');
   if(await welcome.count()&&await welcome.isVisible())await welcome.click();
   assert.deepEqual(await intervals(),[],'no Lyric Lab timer on home screen');

   await page.locator('[data-action="lyric-open"]').first().click();
   await page.locator('[data-action="lyric-demo"]').click();
   assert.deepEqual((await intervals()).map(v=>v.delay),[1000],
    'paused offline demo polls at reduced idle cadence');
   assert.equal(await page.locator('#lyric-clock').textContent(),'00:00 / 01:08');
   const start=page.locator('[data-action="lyric-toggle"]');
   await start.click();
   assert.deepEqual((await intervals()).map(v=>v.delay),[180],
    'playing demo immediately restores precise lyric playback ticks');
   await page.waitForFunction(()=>
    Number(document.getElementById('lyric-seek-slider')?.value)>=.5);
   const timeBeforePause=Number(await page.locator('#lyric-seek-slider').inputValue());
   assert.ok(timeBeforePause>=.5,'playing demo still advances the seek slider');

   await start.click();
   assert.deepEqual((await intervals()).map(v=>v.delay),[1000],
    'paused local audio goes back to idle cadence without duplicate timers');
   const pausedClock=await page.locator('#lyric-clock').textContent();
   await page.waitForTimeout(280);
   assert.equal(await page.locator('#lyric-clock').textContent(),pausedClock,
    'pause does not advance the media clock');
   const input=page.locator('#lyric-input');
   await input.fill('Signals');
   assert.equal(await input.inputValue(),'Signals',
    'the original native practice field stays editable when paused');

   await start.click();
   assert.deepEqual((await intervals()).map(v=>v.delay),[180],
    'resuming playback restores timely lyric synchronization');
   await page.waitForFunction(previous=>
    Number(document.getElementById('lyric-seek-slider')?.value)>previous,
    timeBeforePause);
   await start.click();
   assert.deepEqual((await intervals()).map(v=>v.delay),[1000]);

   // A paused seek must repaint right away, independently of the idle clock.
   await page.locator('#lyric-seek-slider').evaluate(el=>{
    el.value='60';el.dispatchEvent(new Event('change',{bubbles:true}));
   });
   assert.match(await page.locator('#lyric-clock').textContent(),/^01:00 \/ 01:08$/,
    'manual seek updates the displayed clock synchronously while paused');
   const compact=width<=760;
   await page.locator(compact
    ?'.lyric-mobile-entry [data-action="lyric-skip"]'
    :'#lyric-skip').click();
   assert.equal(await page.locator('#lyric-finish-panel').isVisible(),true,
    'final lyric skip still displays the accessible results panel');
   assert.deepEqual(await intervals(),[],
    'no 180ms or 1000ms ticker runs behind completed song results');
   await page.waitForTimeout(250);
   assert.deepEqual(await intervals(),[],'finished results stay timer-free');

   await page.locator('#lyric-finish-panel [data-action="lyric-retry"]').click();
   assert.deepEqual((await intervals()).map(v=>v.delay),[1000],
    'replay resets to the original paused idle cadence, with one timer');
   assert.equal(await input.inputValue(),'','replay clears typed draft');
   assert.equal(await input.isEnabled(),true,'replay leaves native field enabled');
   await start.click();
   assert.deepEqual((await intervals()).map(v=>v.delay),[180],
    'replayed track can start at the full timing cadence');
   await page.locator('[data-action="lyric-back"]').click();
   assert.deepEqual(await intervals(),[],'exit removes all lyric tickers');
  } finally { await context.close(); }
 }
 assert.deepEqual(errors,[],'Lyric Lab must not throw when clocks change cadence');
 console.log('PASS: idle 1000ms, active 180ms, pause/resume, seek, completed stop, replay and cleanup on touch/desktop');
} finally { await browser.close(); }
