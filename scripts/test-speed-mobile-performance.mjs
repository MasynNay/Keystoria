import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 // Include short touch landscape and equally short mouse desktop, whose
 // widths match but whose mobile keyboard/rendering needs differ.
 for(const {width,height,mobile} of [
  {width:320,height:844,mobile:true},{width:390,height:844,mobile:true},
  {width:844,height:390,mobile:true},{width:844,height:390,mobile:false},
  {width:320,height:844,mobile:false},
  {width:1440,height:844,mobile:false},
 ]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count()&&await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="speed-open"]').first().click();
  const view=page.locator('#speed-letters');
  const input=page.locator('#speed-input');
  const reference=await view.evaluate(el=>el.dataset.fullReference||el.textContent);
  assert.ok(reference.length>2000,'scoring reference must retain all 700 words');
  const initial=await view.locator('.type-char').count();
  const compact=mobile||width<=760;
  if(compact) assert.ok(initial<=220,'compact/zoom DOM must be bounded: '+initial+' at '+width+'x'+height);
  else assert.equal(initial,reference.length,'wide desktop must preserve full passage');
  assert.equal(await view.getAttribute('data-accuracy'),'100');
  assert.equal(await page.locator('.mobile-speed-cue').isVisible(),compact,
   'cue visibility and render-window mode must agree at '+width+'x'+height);

  // A single input event after a substantial typing burst still positions the
  // cursor correctly; the reference never shortens as the visual window moves.
  await input.fill(reference.slice(0,330));
  assert.equal(await input.inputValue(),reference.slice(0,330));
  assert.equal(await view.getAttribute('data-accuracy'),'100');
  assert.equal(await view.locator('.type-char.incorrect').count(),0);
  assert.equal(await view.locator('.type-char.current').count(),1);
  if(compact){
   assert.ok(await view.locator('.type-char').count()<=220,'must not grow DOM after 330 chars');
   assert.equal(await page.locator('#speed-mobile-first').textContent(),reference[330]===' '?'␣':reference[330]);
  }

  // Correctly recover after deleting far back across a shifted visual window.
  await input.fill(reference.slice(0,25));
  assert.equal(await view.getAttribute('data-accuracy'),'100');
  assert.equal(await view.locator('.type-char.current').count(),1);
  if(compact)assert.ok(await view.locator('.type-char').count()<=220,'backspace must not expand DOM');

  // Deliberate wrong character must still score as an error.
  await input.fill(reference.slice(0,40)+'!');
  assert.ok(Number(await view.getAttribute('data-accuracy'))<100);
  await input.fill(reference.slice(0,620));
  assert.equal(await view.getAttribute('data-accuracy'),'100');
  if(compact)assert.ok(await view.locator('.type-char').count()<=220,'must stay bounded after 620 chars');

  // The browser can finish and score the entire original stream, not only
  // the visible 220 characters.
  await input.fill(reference);
  await page.locator('#speed-results-heading').waitFor();
  assert.match(await page.locator('.speed-result-hero').innerText(),/100%/);
  assert.equal(await page.locator('.speed-results[role="status"]').count(),1);
  await ctx.close();
 }
 assert.deepEqual(errors,[],'Speed Lab must not throw during long phone sessions');
 console.log('PASS: mobile DOM bounded to 220 characters, backspace and 700-word full-score integrity across phone/desktop viewports');
}finally{await browser.close();}
