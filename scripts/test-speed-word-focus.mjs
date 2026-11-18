import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Browser simulation, not a native iOS/Android software-keyboard test.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const {width,height,touch} of [
  {width:390,height:844,touch:true},
  {width:844,height:390,touch:true},
  {width:320,height:844,touch:false},
  {width:1440,height:844,touch:false},
 ]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch});
  const page=await ctx.newPage();page.setDefaultTimeout(12000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count()&&await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="speed-open"]').first().click();
  const input=page.locator('#speed-input'),toggle=page.locator('#speed-focus-toggle');
  assert.equal(await toggle.isVisible(),touch,'Word Focus is a touch-only control');
  assert.equal(await toggle.getAttribute('aria-pressed'),'false','full passage remains the default');
  if(touch){
   const reference=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
   const [first,second]=reference.split(' ');
   await input.fill(first.slice(0,2));
   await page.evaluate(()=>window.__originalWordFocusField=document.getElementById('speed-input'));
   const accuracy=await page.locator('#speed-accuracy').textContent();
   await toggle.click();
   assert.equal(await toggle.getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('.speed-page').getAttribute('data-word-focus'),'true');
   assert.equal(await page.locator('.speed-prompt-wrap').isVisible(),false);
   assert.equal(await page.locator('#speed-focus-word').isVisible(),true);
   assert.equal(await page.locator('#speed-focus-word .speed-focus-char').count(),first.length);
   assert.equal(await page.locator('#speed-accuracy').textContent(),accuracy);
   assert.equal(await input.inputValue(),first.slice(0,2));
   assert.equal(await page.evaluate(()=>document.getElementById('speed-input')===window.__originalWordFocusField),true);
   assert.equal(await input.evaluate(el=>document.activeElement===el),true,'toggle returns focus to native input');
   await input.fill(first);
   assert.equal(await page.locator('#speed-focus-word .speed-focus-char.current').textContent(),'␣',
     'space remains the highlighted target until typed');
   await input.fill(first+' ');
   await page.waitForFunction(word=>document.querySelector('#speed-focus-word')?.textContent===word,second);
   assert.equal(await page.locator('#speed-focus-word .speed-focus-char.current').textContent(),second[0]);
   const wrong=second[0]==='z'?'x':'z';
   await input.fill(first+' '+wrong);
   assert.equal(await page.locator('#speed-focus-word .speed-focus-char.incorrect').count(),1,
     'incorrect letters have non-color feedback');
   const before=await page.locator('#speed-accuracy').textContent();
   await input.evaluate(el=>el.setSelectionRange(0,0));
   await page.waitForFunction(word=>document.querySelector('#speed-focus-word')?.textContent===word,first);
   assert.equal(await page.locator('#speed-accuracy').textContent(),before,'caret-only move does not rescore');
   assert.equal(await input.inputValue(),first+' '+wrong);
   await toggle.click();
   assert.equal(await page.locator('.speed-prompt-wrap').isVisible(),true);
   assert.equal(await input.evaluate(el=>document.activeElement===el),true);
   assert.equal(await input.inputValue(),first+' '+wrong,'full-passage switch retains typing');
   await toggle.click();
   await page.locator('[data-action="speed-restart"]').first().click();
   assert.equal(await toggle.getAttribute('aria-pressed'),'true','focus setting survives restart');
   await page.locator('[data-action="speed-pack"][data-pack="numpad"]').click();
   assert.equal(await toggle.getAttribute('aria-pressed'),'true','Numpad also supports Word Focus');
   const numbers=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
   await page.locator('#speed-input').fill(numbers.slice(0,2));
   assert.equal(await page.locator('#speed-focus-word').textContent(),numbers.split(' ')[0]);
   assert.equal(await page.locator('#speed-input').getAttribute('inputmode'),'numeric');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#app .brand-name').waitFor();
   const w=page.locator('.welcome-continue');
   if(await w.count()&&await w.isVisible())await w.click();
   await page.locator('[data-action="speed-open"]').first().click();
   assert.equal(await toggle.getAttribute('aria-pressed'),'true','preference persists on this device');
   const full=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
   await page.locator('#speed-input').fill(full);
   await page.locator('#speed-results-heading').waitFor();
   assert.match(await page.locator('.speed-result-hero').innerText(),/100%/,
     'optional presentation does not shorten the reference or change scoring');
  }else{
   assert.equal(await page.locator('.speed-prompt-wrap').isVisible(),true,'desktop retains its full passage');
  }
  assert.deepEqual(errors,[],'Word Focus cannot introduce browser exceptions');
  await ctx.close();
 }
 // A tablet can open in the normal wide view, then rotate to a compact
 // touch landscape without restarting. The newly visible switch must work.
 {
  const ctx=await browser.newContext({viewport:{width:844,height:640},isMobile:true,hasTouch:true});
  const page=await ctx.newPage();
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count()&&await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="speed-open"]').first().click();
  assert.equal(await page.locator('#speed-focus-toggle').isVisible(),false,'wide touch layout keeps the full passage');
  const input=page.locator('#speed-input');
  await input.fill('ab');
  await page.setViewportSize({width:844,height:390});
  await page.locator('#speed-focus-toggle').waitFor({state:'visible'});
  await page.locator('#speed-focus-toggle').click();
  assert.equal(await page.locator('#speed-focus-toggle').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.speed-prompt-wrap').isVisible(),false);
  assert.equal(await input.inputValue(),'ab','rotation and focus view retain the same input');
  await page.setViewportSize({width:844,height:640});
  await page.waitForFunction(()=>document.querySelector('.speed-prompt-wrap')?.getBoundingClientRect().height>0);
  assert.equal(await input.inputValue(),'ab','returning to wide layout keeps typing');
  await ctx.close();
 }
 console.log('PASS: touch Word Focus, native input, separator, score, corrections, Numpad, persistence and desktop isolation');
}finally{await browser.close();}
