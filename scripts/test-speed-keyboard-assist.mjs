import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Browser API checks only. Native OS suggestion-strip rendering is not
// emulated by Chromium and still requires actual Safari/Android phone QA.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try {
 for(const width of [320,390,1440]){
  const mobile=width<=760;
  const ctx=await browser.newContext({viewport:{width,height:844},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count()&&await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="speed-open"]').first().click();
  const field=page.locator('#speed-input');
  const toggle=page.locator('#speed-assist-toggle');
  const props=async()=>field.evaluate(el=>({spellcheck:el.spellcheck,autocorrect:el.getAttribute('autocorrect'),autocomplete:el.getAttribute('autocomplete'),autocapitalize:el.getAttribute('autocapitalize')}));
  if(mobile){
   assert.equal(await toggle.isVisible(),true,'mobile assist switch must be visible');
   assert.equal(await toggle.getAttribute('aria-pressed'),'true','phone assistance defaults on');
   assert.deepEqual(await props(),{spellcheck:true,autocorrect:'on',autocomplete:'on',autocapitalize:'off'});
   await field.fill('test');
   await field.evaluate(el=>{window.__originalSpeedField=el;});
   await toggle.click();
   assert.equal(await field.inputValue(),'test','toggling keyboard help must not discard typing');
   assert.equal(await page.evaluate(()=>document.querySelector('#speed-input')===window.__originalSpeedField),true,'input node must be retained');
   assert.equal(await toggle.getAttribute('aria-pressed'),'false');
   assert.deepEqual(await props(),{spellcheck:false,autocorrect:'off',autocomplete:'off',autocapitalize:'off'});
   assert.match(await page.locator('#speed-assist-detail').innerText(),/Exact typing/);
   await page.locator('[data-action="speed-restart"]').first().click();
   assert.equal(await toggle.getAttribute('aria-pressed'),'false','off preference survives restart');
   await page.locator('[data-action="speed-pack"][data-pack="numpad"]').click();
   assert.equal(await toggle.count(),0,'Numpad remains precision-only');
   assert.deepEqual(await props(),{spellcheck:false,autocorrect:'off',autocomplete:'off',autocapitalize:'off'});
   assert.equal(await field.getAttribute('inputmode'),'numeric');
   await page.locator('[data-action="speed-pack"][data-pack="everyday"]').click();
   assert.equal(await toggle.getAttribute('aria-pressed'),'false','off preference survives switching categories');
   await toggle.click();
   assert.equal(await toggle.getAttribute('aria-pressed'),'true');
   assert.equal(await field.getAttribute('autocorrect'),'on');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#app .brand-name').waitFor();
   const maybeWelcome=page.locator('.welcome-continue');
   if(await maybeWelcome.count()&&await maybeWelcome.isVisible())await maybeWelcome.click();
   await page.locator('[data-action="speed-open"]').first().click();
   assert.equal(await toggle.getAttribute('aria-pressed'),'true','native assist preference survives a page refresh');
  }else{
   assert.equal(await toggle.isVisible(),false,'desktop must not show phone assistance');
   assert.deepEqual(await props(),{spellcheck:false,autocorrect:'off',autocomplete:'off',autocapitalize:'off'});
  }

  const full=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
  await field.fill(full);
  await page.locator('#speed-results-heading').waitFor();
  if(mobile){
   assert.match(await page.locator('.speed-assist-result-label').innerText(),/MOBILE ASSISTED/);
   assert.match(await page.locator('.speed-history').innerText(),/ASSISTED/);
   const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('panic.speed.results.v1')||'[]'));
   assert.equal(history[0].keyboardAssisted,true);
   assert.equal(history[0].practiceMode,'mobile-assisted');
   await page.locator('[data-action="speed-restart"]').first().click();
   await page.locator('#speed-assist-toggle').click();
   await page.locator('[data-action="speed-restart"]').first().click();
   assert.equal(await page.locator('#speed-assist-toggle').getAttribute('aria-pressed'),'false');
   const exact=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
   await page.locator('#speed-input').fill(exact);
   await page.locator('#speed-results-heading').waitFor();
   assert.match(await page.locator('.speed-assist-result-label').innerText(),/EXACT TYPING/);
   const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('panic.speed.results.v1')||'[]'));
   assert.equal(records[0].keyboardAssisted,false);
   assert.equal(records[0].practiceMode,'mobile-exact');
   assert.equal(records[1].keyboardAssisted,true);
  }else{
   assert.match(await page.locator('.speed-assist-result-label').innerText(),/EXACT TYPING/);
   const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('panic.speed.results.v1')||'[]'));
   assert.equal(records[0].practiceMode,'standard-exact');
  }
  await ctx.close();
 }
 assert.deepEqual(errors,[],'keyboard assist changes must not cause script exceptions');
 console.log('PASS: native phone keyboard help defaults on, precision opt-out persists, Numpad/desktop remain exact, and scores are separated');
}finally{await browser.close();}
