import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// User-activated instrumentation only. Chromium emulation cannot substitute
// for a real iPhone or Android performance reading.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const item of [{width:390,touch:true},{width:1440,touch:false}]){
  const context=await browser.newContext({
   viewport:{width:item.width,height:844},isMobile:item.touch,hasTouch:item.touch
  });
  try{
   const page=await context.newPage();
   page.setDefaultTimeout(15000);
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
   await page.locator('#app .brand-name').waitFor();
   const welcome=page.locator('.welcome-continue');
   if(await welcome.count()&&await welcome.isVisible())await welcome.click();
   await page.locator('[data-action="speed-open"]').first().click();
   const input=page.locator('#speed-input');
   const originalInput=await input.evaluate(el=>(window.__savedNativeField=el,true));
   assert.ok(originalInput);
   const nav=page.locator('[data-action="settings"]').first();
   await nav.click();
   const start=page.locator('[data-action="perf-start"]');
   await start.waitFor();
   assert.match(await start.locator('xpath=..').textContent(),/No typed words, scores or media details/);
   assert.equal(await page.locator('#keystoria-perf-check').count(),0,
    'no background diagnostic before the user explicitly starts it');
   await start.click();
   assert.equal(await page.locator('.modal-backdrop').count(),0,
    'start returns the user to the practice screen');
   const check=page.locator('#keystoria-perf-check');
   await check.waitFor();
   const report=check.locator('.perf-check-report');
   assert.equal(await report.isVisible(),false,'report hidden during recording');
   await input.focus();
   await input.fill('NEVER_SHARE_TYPED_TEXT');
   await page.waitForTimeout(400);
   const value=await input.inputValue();
   assert.equal(value,'NEVER_SHARE_TYPED_TEXT');
   await check.locator('[data-perf-action="stop"]').click();
   assert.equal(await report.isVisible(),true,'results visible after user stops');
   const output=await report.inputValue();
   assert.match(output,/Practice input events: [1-9]/);
   assert.match(output,/Speed Lab: [1-9]/);
   assert.match(output,/Browser:/);
   assert.match(output,/Input-to-next-frame/);
   assert.match(output,/Slow frame gaps/);
   assert.match(output,/collected locally after an explicit click/);
   assert.ok(!output.includes('NEVER_SHARE_TYPED_TEXT'),
    'the report must never contain the actual text entered by the player');
   assert.equal(await input.evaluate(el=>el===window.__savedNativeField),true,
    'instrumentation never detaches or replaces the native input');
   assert.equal(await check.locator('[data-perf-action="copy"]').isVisible(),true);
   await check.locator('[data-perf-action="close"]').click();
   assert.equal(await check.count(),0,'the local report is discarded on close');

   // Start a second time without a reload; it must not create duplicate
   // recorders or leave behind an old report.
   await nav.click();
   await start.click();
   assert.equal(await page.locator('#keystoria-perf-check').count(),1);
   await page.locator('[data-perf-action="stop"]').click();
   await page.locator('[data-perf-action="close"]').click();
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[],'no uncaught browser errors');
 console.log('PASS: private opt-in phone/desktop performance check, native field identity, report and cleanup');
}finally{await browser.close();}
