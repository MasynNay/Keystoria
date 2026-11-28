import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const packs=['legal','education','government','healthcare','finance','hospitality'];
const errors=[];
try {
 for(const width of [390,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<800,hasTouch:width<800,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count() && await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="speed-open"]').first().click();
  await page.locator('#speed-input').waitFor();
  assert.equal(await page.locator('.speed-pack-section').count(),3);
  assert.equal(await page.locator('[data-action="speed-pack"]').count(),16);
  for(const id of packs) {
   const choice=page.locator('[data-action="speed-pack"][data-pack="'+id+'"]');
   await choice.click();
   assert.equal(await choice.getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#speed-input').evaluate(el=>document.activeElement===el),true,
    'pointer selection returns focus to typing without a delayed jump');
   assert.equal(await page.locator('.speed-page').getAttribute('data-speed'),id);
   assert.ok((await page.locator('.speed-bottom aside p').first().textContent()).length>15);
   assert.ok((await page.locator('#speed-letters').innerText()).trim().length>20);
   const input=page.locator('#speed-input');
   await input.fill('per');
   assert.equal(await input.inputValue(),'per');
   assert.match(await page.locator('#speed-wpm').locator('xpath=following-sibling::small').innerText(),/^WPM$/);
  }
  // Complete all keyboard challenges through the existing native input,
  // including symbols which must render as literal characters, not markup.
  const keyboardPacks=['home-row','top-row','bottom-row','shift-keys','symbols','mixed-numbers'];
  for(const id of keyboardPacks){
   const choice=page.locator('[data-action="speed-pack"][data-pack="'+id+'"]');
   await choice.click();
   assert.equal(await choice.getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('.speed-page').getAttribute('data-speed'),id);
   assert.equal(await page.locator('#speed-input').getAttribute('inputmode'),'text');
   const passage=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
   const tokens=passage.split(' ');
   assert.equal(tokens.length,700);
   if(id==='home-row')assert.ok(tokens.every(token=>/^[asdfghjkl]+$/.test(token)));
   if(id==='top-row')assert.ok(tokens.every(token=>/^[qwertyuiop]+$/.test(token)));
   if(id==='bottom-row')assert.ok(tokens.every(token=>/^[zxcvbnm]+$/.test(token)));
   const expected=passage[0], wrong=expected==='!'?'?':'!';
   await page.locator('#speed-input').fill(wrong+passage.slice(1));
   await page.locator('#speed-results-heading').waitFor();
   assert.equal(await page.locator('#speed-key-review').getAttribute('data-error-count'),'1');
   assert.equal(await page.locator('#speed-key-review li').first().getAttribute('data-key'),expected);
   assert.match(await page.locator('#speed-wpm').locator('xpath=following-sibling::small').innerText(),/^WPM$/);
   const history=await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1'));
   await page.locator('[data-action="speed-targeted"]').click();
   const focused=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
   assert.ok(focused.split(' ').every(token=>token.includes(expected)));
   await page.locator('#speed-input').fill(focused);
   await page.locator('#speed-results-heading').waitFor();
   assert.equal(await page.locator('#speed-accuracy').innerText(),'100%');
   assert.equal(await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1')),history);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2);
  }
  // A keyboard activation rebuilds the practice controls. Keep the freshly
  // rendered choice focused so rapid Enter/Space cannot race an earlier
  // requestAnimationFrame that steals focus for the native typing field.
  for(const [id,key] of [['legal','Enter'],['education','Space'],['government','Enter']]){
   const keyboardChoice=page.locator('[data-action="speed-pack"][data-pack="'+id+'"]');
   await keyboardChoice.focus();
   await keyboardChoice.press(key);
   await page.waitForFunction(({pack})=>
     document.querySelector('.speed-page')?.getAttribute('data-speed')===pack
     && document.querySelector('[data-action="speed-pack"][data-pack="'+pack+'"]')?.getAttribute('aria-pressed')==='true',
     {pack:id});
   assert.equal(await keyboardChoice.evaluate(el=>document.activeElement===el),true,
     key+' must preserve focus on the NEW category button '+id);
   await page.waitForTimeout(60);
   assert.equal(await keyboardChoice.evaluate(el=>document.activeElement===el),true,
     'late focus callbacks cannot steal focus from '+id);
  }
  // Duration controls share this keyboard workflow; retain focus even when
  // switching from an active timed typing session.
  for(const [seconds,key] of [[60,'Enter'],[15,'Space']]){
   const duration=page.locator('[data-action="speed-duration"][data-seconds="'+seconds+'"]');
   await duration.focus();
   await duration.press(key);
   assert.equal(await duration.getAttribute('aria-pressed'),'true',key+' selects '+seconds+'s');
   assert.equal(await duration.evaluate(el=>document.activeElement===el),true,
     'keyboard duration changes must keep the new control focused');
  }
  await page.locator('#speed-input').fill('typing');
  assert.equal(await page.locator('#speed-input').inputValue(),'typing',
    'keyboard selector navigation must not damage subsequent text input');
  await page.locator('[data-action="speed-pack"][data-pack="numpad"]').click();
  assert.equal(await page.locator('.speed-page').getAttribute('data-speed'),'numpad');
  assert.equal(await page.locator('#speed-input').getAttribute('inputmode'),'numeric');
  assert.equal(await page.locator('#speed-wpm').locator('xpath=following-sibling::small').innerText(),'CPM');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,'no horizontal overflow at width '+width+': '+overflow);
  await ctx.close();
 }
 assert.deepEqual(errors,[],'no runtime errors in career category selection');
 console.log('PASS: Six workplace and six keyboard categories, targeted practice, scoring, responsive grouping, and Numpad compatibility');
} finally {
 await browser.close();
}
