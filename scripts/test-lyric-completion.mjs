import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

// The two controllers intentionally differ in online video matching. Keep
// the shared completion/focus/replay section identical without requiring the
// provider-specific code to match byte-for-byte.
const appCode=readFileSync(new URL('../app/web/ui/lyric-lab-controller.js',import.meta.url),'utf8');
const browserCode=readFileSync(new URL('../site/play/assets/ui/lyric-lab-controller.js',import.meta.url),'utf8');
const completionSection=source=>{
 const start=source.indexOf(' function updateFinishedState(');
 const end=source.indexOf(' function seek(',start);
 assert.ok(start>=0 && end>start,'Lyric Lab completion section is present');
 return source.slice(start,end);
};
assert.equal(completionSection(appCode),completionSection(browserCode),
 'local and Pages editions must implement identical completion/focus/replay behavior');
for(const source of [appCode,browserCode]){
 assert.ok(source.includes('id="lyric-finish-panel"'),'both editions render the same finish panel');
 assert.ok(source.includes('id="lyric-finish-heading"'),'both editions label the same focus destination');
}

// Exercise the original, locally bundled lyric demo only. Do not rely on
// third-party lyrics, YouTube, network timing or the user's keyboard settings.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
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
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count()&&await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="lyric-open"]').first().click();
  await page.locator('[data-action="lyric-demo"]').click();
  const input=page.locator('#lyric-input');
  const panel=page.locator('#lyric-finish-panel');
  const heading=page.locator('#lyric-finish-heading');
  const replay=panel.locator('[data-action="lyric-retry"]');
  const chooseSong=panel.locator('[data-action="lyric-finish-back"]');
  assert.equal(await panel.isVisible(),false,'no completion panel before the song is finished');
  assert.equal(await heading.getAttribute('tabindex'),'-1');

  // Jump to the final line without test-only access to controller internals.
  const lastLine=page.locator('#lyric-seek-slider');
  const seekLastLine=()=>lastLine.evaluate(el=>{
   el.value='60';
   el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await seekLastLine();
  assert.equal(await page.locator('#lyric-screenreader-word').textContent(),'Current word: There');
  // Finishing by skipping the final line must not leave keyboard focus on a
  // removed button, and cannot leave no-op controls in the Tab order.
  const skip=page.locator(phone?'.lyric-mobile-entry [data-action="lyric-skip"]':'#lyric-skip');
  await skip.click();
  assert.equal(await panel.isVisible(),true,'final-line skip reveals the completion panel');
  assert.equal(await heading.textContent(),'TRACK COMPLETE.');
  assert.equal(await heading.evaluate(el=>document.activeElement===el),true,
   'finished song moves focus to a real result heading at '+width+'x'+height);
  assert.match(await page.locator('#lyric-finish-summary').innerText(),
   /WPM.*accuracy.*points.*skipped words/i);
  assert.match(await page.locator('#lyric-video-status').innerText(),/Complete!/);
  assert.equal(await input.isDisabled(),true,'completed song disables the old typing field');
  for(const selector of [
   '[data-action="lyric-mobile-submit"]','[data-action="lyric-skip"]',
   '[data-action="lyric-mobile-toggle"]','[data-action="lyric-toggle"]'
  ]){
   for(const control of await page.locator(selector).all())
    assert.equal(await control.isDisabled(),true,selector+' is disabled on completion');
  }
  assert.equal(await replay.isVisible(),true);
  assert.equal(await chooseSong.isVisible(),true);
  await page.keyboard.press('Tab');
  assert.equal(await replay.evaluate(el=>document.activeElement===el),true,
   'Tab from completion heading reaches Play Again, not an inactive typing action');
  await page.keyboard.press('Enter');
  assert.equal(await panel.isVisible(),false,'replay hides the completed-song panel');
  assert.equal(await input.isDisabled(),false,'replay restores native typing');
  assert.equal(await input.evaluate(el=>document.activeElement===el),true,
   'replay restores typing focus for a real keyboard');
  assert.equal(await page.locator('#lyric-progress').textContent().then(x=>x.startsWith('0/')),true);
  assert.equal(await page.locator('#lyric-toggle').isDisabled(),false,
   'replay re-enables playback controls');

  // Complete the last lyric naturally by entering every word. The test
  // checks that both Enter paths finish cleanly with zero skipped words.
  await seekLastLine();
  await page.locator('#lyric-toggle').click();
  await page.waitForFunction(()=>!document.querySelector('#lyric-input')?.disabled);
  let finalWordCount=0;
  for(let i=0;i<12;i++){
   if(await panel.isVisible())break;
   const spoken=await page.locator('#lyric-screenreader-word').textContent();
   assert.match(spoken,/^Current word: /,'there is another word to type');
   const word=spoken.replace(/^Current word: /,'');
   assert.ok(word.length>0);
   await input.fill(word);
   await input.press(phone?'Enter':'Control+Enter');
   finalWordCount++;
  }
  assert.ok(finalWordCount>=4 && finalWordCount<=12,'finished the final line by typing '+finalWordCount+' words');
  assert.equal(await panel.isVisible(),true,'last submitted word reveals the completion panel');
  const progress=await page.locator('#lyric-progress').textContent();
  const [done,total]=progress.split('/').map(Number);
  assert.equal(done,total,'typing completion consumed the full lyric track');
  assert.match(await page.locator('#lyric-finish-summary').innerText(),/0 skipped words/);
  assert.equal(await heading.evaluate(el=>document.activeElement===el),true,
   'natural typing completion focuses result heading too');

  // The second action must be useful: choose-song goes to the library.
  await chooseSong.click();
  assert.equal(await page.locator('#lyric-input').count(),0);
  assert.equal(await page.locator('[data-action="lyric-demo"]').count(),1);
  await ctx.close();
 }
 assert.deepEqual(errors,[],'no uncaught browser errors during song completion');
 console.log('PASS: Lyric Lab original demo completion, focus, accessible summary, replay and choose-song on phone/desktop');
}finally{
 await browser.close();
}
