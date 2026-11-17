import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Synthetic DOM composition events validate Keystoria's event ordering,
// not the native candidate UI of physical Japanese/Chinese/Korean keyboards.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const origin='http://127.0.0.1:8765/play/';
async function start(page,selector,partial) {
 return page.locator(selector).evaluate((field,interim)=>{
  field.focus();
  field.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:''}));
  field.value=interim;
  field.dispatchEvent(new InputEvent('input',{
   bubbles:true,inputType:'insertCompositionText',data:interim,isComposing:true
  }));
  const activeEnter=new KeyboardEvent('keydown',{
   bubbles:true,cancelable:true,key:'Enter',code:'Enter',isComposing:true
  });
  field.dispatchEvent(activeEnter);
  const legacyEnter=new KeyboardEvent('keydown',{
   bubbles:true,cancelable:true,key:'Enter',code:'Enter',keyCode:229
  });
  field.dispatchEvent(legacyEnter);
  return {interim:field.value,activePrevented:activeEnter.defaultPrevented,
   legacyPrevented:legacyEnter.defaultPrevented,legacyCode:legacyEnter.keyCode};
 },partial);
}
async function commit(page,selector,committed){
 await page.locator(selector).evaluate((field,value)=>{
  field.value=value;
  field.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:value}));
 },committed);
}
async function dismissWelcome(page){
 const welcome=page.locator('.welcome-continue');
 if(await welcome.count()&&await welcome.isVisible())await welcome.click();
}
try{
 for(const width of [390,1440]){
  const phone=width<800;
  const ctx=await browser.newContext({
   viewport:{width,height:844},isMobile:phone,hasTouch:phone,reducedMotion:'reduce'
  });
  const page=await ctx.newPage();page.setDefaultTimeout(10000);
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  await dismissWelcome(page);

  // Speed Lab: the visible IME candidate text cannot start the timer, alter
  // accuracy or trigger Ctrl+Enter restart before it is committed.
  await page.locator('[data-action="speed-open"]').first().click();
  const passage=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
  const speedDraft=passage.slice(0,3);
  assert.match(await page.locator('#speed-mode').innerText(),/TIMER STARTS WHEN YOU TYPE/);
  const speedComposition=await start(page,'#speed-input',speedDraft);
  assert.equal(speedComposition.activePrevented,false,'IME Enter may complete conversion natively');
  assert.equal(speedComposition.legacyCode,229,'legacy IME Enter event carries keyCode 229');
  assert.equal(speedComposition.legacyPrevented,false,'legacy conversion Enter is not intercepted');
  assert.match(await page.locator('#speed-mode').innerText(),/TIMER STARTS WHEN YOU TYPE/,
   'unfinished IME input must not start Speed Lab timer');
  assert.match(await page.locator('#speed-progress').innerText(),/0 characters typed/,
   'unfinished IME input must not increment scored progress');
  await commit(page,'#speed-input',speedDraft);
  await page.waitForFunction(()=>document.querySelector('#speed-mode')?.textContent==='SESSION LIVE');
  assert.equal(await page.locator('#speed-input').inputValue(),speedDraft);
  assert.match(await page.locator('#speed-progress').innerText(),/3 characters typed/);
  await page.locator('[data-action="speed-home"]').first().click();
  await dismissWelcome(page);

  // Lyric Lab: candidate letters must not trigger red error feedback, submit
  // the word, skip the lyric line or rewrite the current-word announcement.
  await page.locator('[data-action="lyric-open"]').first().click();
  await page.locator('[data-action="lyric-demo"]').click();
  if(phone)await page.locator('[data-action="lyric-mobile-toggle"]').click();
  else await page.locator('[data-action="lyric-toggle"]').click();
  await page.waitForFunction(()=>!document.querySelector('#lyric-input')?.disabled);
  const beforeLyrics=await page.locator('#lyric-current-line').innerHTML();
  const targetBefore=await page.locator('#lyric-screenreader-word').textContent();
  const lyricComposition=await start(page,'#lyric-input','Sig');
  assert.equal(lyricComposition.activePrevented,false);
  assert.equal(lyricComposition.legacyPrevented,false);
  assert.equal(await page.locator('#lyric-current-line').innerHTML(),beforeLyrics,
   'unfinished IME draft leaves rendered word feedback unchanged');
  assert.equal(await page.locator('#lyric-screenreader-word').textContent(),targetBefore,
   'IME candidates must not cause extra current-word announcements');
  assert.ok((await page.locator('#lyric-progress').innerText()).startsWith('0/'),
   'composition Enter must not submit or skip the lyric');
  await commit(page,'#lyric-input','Signals');
  await page.waitForFunction(before=>
   document.querySelector('#lyric-current-line')?.innerHTML!==before,beforeLyrics);
  assert.notEqual(await page.locator('#lyric-current-line').innerHTML(),beforeLyrics,
   'after commitment Lyric Lab displays ordinary partial/complete word feedback');
  if(phone)await page.locator('#lyric-input').press('Enter');
  else await page.locator('#lyric-input').press('Control+Enter');
  assert.ok((await page.locator('#lyric-progress').innerText()).startsWith('1/'),
   'ordinary Enter/Ctrl+Enter works after composition is committed');
  assert.equal(await page.locator('#lyric-screenreader-word').textContent(),'Current word: through');
  await page.locator('[data-action="lyric-back"]').first().click();
  await page.locator('[data-action="lyric-home"]').first().click();
  await dismissWelcome(page);

  // Field Academy: a candidate string must not change the live command
  // feedback or advance the lesson, but a committed valid command still works.
  await page.locator('[data-action="learn"][data-os="linux"]').click();
  const target=await page.locator('#lesson-target-text').textContent();
  const beforeCommand=await page.locator('#lesson-target-text').innerHTML();
  const beforeStatus=await page.locator('#training-feedback').innerText();
  const lessonComposition=await start(page,'#lesson-input',target.slice(0,2));
  assert.equal(lessonComposition.activePrevented,false);
  assert.equal(lessonComposition.legacyPrevented,false);
  assert.equal(await page.locator('#lesson-target-text').innerHTML(),beforeCommand,
   'unfinished IME draft must not repaint Academy correctness markers');
  assert.equal(await page.locator('#training-feedback').innerText(),beforeStatus,
   'IME conversion Enter must not submit an incomplete Academy command');
  await commit(page,'#lesson-input',target);
  await page.waitForFunction(before=>
   document.querySelector('#lesson-target-text')?.innerHTML!==before,beforeCommand);
  await page.locator('#lesson-input').press('Enter');
  assert.match(await page.locator('#training-feedback').innerText(),/COMMAND RECOGNIZED/,
   'committed command remains valid and Enter submits after compositionend');
  await ctx.close();
 }
 assert.deepEqual(errors,[],'no practice errors during IME conversion');
 console.log('PASS: composition candidates do not score/submit; committed input works in Speed, Lyric, Academy on phone and desktop');
}finally{await browser.close();}
