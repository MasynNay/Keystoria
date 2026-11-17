import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const base='http://127.0.0.1:8765/play/';
async function launch(width){
 const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<800,hasTouch:width<800,reducedMotion:'reduce'});
 const page=await ctx.newPage(); page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.locator('#app .brand-name').waitFor();
 if(await page.locator('.welcome-continue').isVisible())await page.locator('.welcome-continue').click();
 return {page,ctx};
}
async function homeFromModal(page){
 if(await page.locator('.welcome-continue').count() && await page.locator('.welcome-continue').isVisible())await page.locator('.welcome-continue').click();
}
try{
 for(const width of [320,390,1440]){
  const {page,ctx}=await launch(width);
  const isPhone=width<800;
  await page.locator('[data-action="speed-open"]').first().click();
  await page.locator('#speed-input').waitFor();
  assert.equal(await page.locator('.mobile-speed-cue').isVisible(),isPhone,'speed cue visible only on phones');
  const input=page.locator('#speed-input');
  await input.focus();
  if(isPhone){
   assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('mobile-typing-active')),true);
   const bounds=await input.evaluate(async el=>{
    const {mobileFocusBounds}=await import('./assets/ui/mobile-typing.js');
    const focus=mobileFocusBounds(el);
    const cue=el.closest('.mobile-typing-entry').querySelector('.mobile-speed-cue').getBoundingClientRect();
    const full=el.closest('.mobile-typing-entry').getBoundingClientRect();
    return {focus,top:cue.top,fullBottom:full.bottom};
   });
   assert.equal(bounds.focus.top,bounds.top,'Speed Lab keyboard scrolling must include its current prompt');
   assert.ok(bounds.focus.bottom<bounds.fullBottom,'Speed Lab keyboard scrolling must exclude actions below input');
  }
  const next=await page.locator('#speed-mobile-first').textContent();
  assert.ok(next?.length===1 || next==='␣','a next character must be visible');
  await input.fill('abc');
  if(isPhone){
   assert.ok((await page.locator('#speed-mobile-first').textContent())!==null);
   await page.locator('.speed-mobile-entry [data-action="speed-space"]').click();
   assert.equal(await input.inputValue(),'abc ','space control must add exactly one space');
   // A player can correct an earlier separator without losing the suffix or focus.
   await input.evaluate(el=>el.setSelectionRange(1,1));
   await page.locator('.speed-mobile-entry [data-action="speed-space"]').click();
   assert.equal(await input.inputValue(),'a bc ','space control must insert at the caret, not append');
   assert.equal(await input.evaluate(el=>el.selectionStart),2,'caret advances after inserted separator');
   assert.equal(await input.evaluate(el=>document.activeElement===el),true,'touch separator must return typing focus');
   await input.evaluate(el=>el.setSelectionRange(1,3));
   await page.locator('.speed-mobile-entry [data-action="speed-space"]').click();
   assert.equal(await input.inputValue(),'a c ','selected text must be replaced with one separator');
   await page.locator('.speed-mobile-entry [data-action="speed-restart"]').click();
   assert.equal(await page.locator('#speed-input').inputValue(),'');
  } else {
   assert.equal(await page.locator('.mobile-entry-actions').first().isVisible(),false);
  }
  await page.locator('[data-action="speed-pack"][data-pack="numpad"]').click();
  assert.equal(await page.locator('.speed-page').getAttribute('data-speed'),'numpad');
  assert.equal(await page.locator('#speed-input').getAttribute('inputmode'),'numeric');
  const numericReference=await page.locator('#speed-letters').innerText();
  assert.match(numericReference,/^\d{3} \d{4}/);
  await page.locator('#speed-input').fill(numericReference.slice(0,3));
  if(isPhone){
    await page.locator('.speed-mobile-entry [data-action="speed-space"]').click();
    assert.equal(await page.locator('#speed-input').inputValue(),numericReference.slice(0,3)+' ');
    // Numpad phone keyboards often have no Space key. Repair a missing separator.
    const digitsWithoutSpace=numericReference.slice(0,3)+numericReference.slice(4,6);
    await page.locator('#speed-input').fill(digitsWithoutSpace);
    await page.locator('#speed-input').evaluate(el=>el.setSelectionRange(3,3));
    await page.locator('.speed-mobile-entry [data-action="speed-space"]').click();
    assert.equal(await page.locator('#speed-input').inputValue(),numericReference.slice(0,6),'Numpad separator inserted between groups');
    assert.equal(await page.locator('#speed-accuracy').innerText(),'100%','repaired Numpad group scores correctly');
  } else {
    await page.locator('#speed-input').fill(numericReference.slice(0,3)+' ');
  }
  assert.equal(await page.locator('#speed-wpm').locator('xpath=following-sibling::small').innerText(),'CPM');
  await page.locator('[data-action="speed-pack"][data-pack="everyday"]').click();
  await page.locator('[data-action="speed-home"]').first().click();
  await homeFromModal(page);
  await page.locator('[data-action="lyric-open"]').first().click();
  await page.locator('[data-action="lyric-demo"]').click();
  await page.locator('#lyric-input').waitFor();
  assert.equal(await page.locator('.mobile-lyric-word').isVisible(),isPhone);
  if(isPhone){
   const bounds=await page.locator('#lyric-input').evaluate(async el=>{
    const {mobileFocusBounds}=await import('./assets/ui/mobile-typing.js');
    const cue=el.closest('.mobile-typing-entry').querySelector('.mobile-lyric-word').getBoundingClientRect();
    const wrapper=el.closest('.mobile-typing-entry').getBoundingClientRect();
    return {focus:mobileFocusBounds(el),cueTop:cue.top,wrapperBottom:wrapper.bottom};
   });
   assert.equal(bounds.focus.top,bounds.cueTop,'Lyric focus rectangle must include active lyric');
   assert.ok(bounds.focus.bottom<bounds.wrapperBottom,'Lyric touch actions must not displace lyric cue');
  }
  if(isPhone){
   await page.locator('[data-action="lyric-mobile-toggle"]').click();
   await page.locator('#lyric-input').fill('Signals');
   await page.locator('[data-action="lyric-mobile-submit"]').click();
   assert.equal(await page.locator('#lyric-input').inputValue(),'');
   assert.ok((await page.locator('#lyric-progress').innerText()).startsWith('1/'));
   await page.locator('.lyric-mobile-entry [data-action="lyric-skip"]').click();
   assert.ok(Number((await page.locator('#lyric-progress').innerText()).split('/')[0])>1);
  }else{
   await page.locator('#lyric-input').evaluate(el=>el.focus());
  }
  await page.locator('[data-action="lyric-back"]').first().click();
  await page.locator('[data-action="lyric-home"]').first().click();
  await homeFromModal(page);
  await page.locator('[data-action="learn"][data-os="linux"]').click();
  await page.locator('#lesson-input').waitFor();
  assert.equal(await page.locator('.mobile-academy-target').isVisible(),isPhone);
  if(isPhone){
   const bounds=await page.locator('#lesson-input').evaluate(async el=>{
    const {mobileFocusBounds}=await import('./assets/ui/mobile-typing.js');
    const cue=el.closest('.mobile-typing-entry').querySelector('.mobile-academy-target').getBoundingClientRect();
    const wrapper=el.closest('.mobile-typing-entry').getBoundingClientRect();
    return {focus:mobileFocusBounds(el),cueTop:cue.top,wrapperBottom:wrapper.bottom};
   });
   assert.equal(bounds.focus.top,bounds.cueTop,'Academy focus rectangle must include active command');
   assert.ok(bounds.focus.bottom<bounds.wrapperBottom,'Academy controls must not hide command prompt');
  }
  const target=await page.locator('#lesson-target-text').textContent();
  assert.equal(await page.locator('#lesson-mobile-target').textContent(),target);
  await page.locator('#lesson-input').fill(target);
  if(isPhone)await page.evaluate(()=>{window.__academyInput=document.querySelector('#lesson-input');});
  if(isPhone)await page.locator('.academy-mobile-entry [data-action="training-submit"]').click();
  else await page.locator('.terminal-inner > .training-buttons [data-action="training-submit"]').click();
  assert.match(await page.locator('#training-feedback').innerText(),/COMMAND RECOGNIZED/);
  if(isPhone)assert.equal(await page.evaluate(()=>document.querySelector('#lesson-input')===window.__academyInput),true,'Academy must preserve native input after accepted command');
  if(isPhone){
   await page.locator('.academy-mobile-entry [data-action="training-next"]').click();
   assert.ok((await page.locator('.terminal-bar').innerText()).includes('STEP 02'));
   assert.equal(await page.evaluate(()=>document.querySelector('#lesson-input')===window.__academyInput),true,'Academy must preserve native input after advancing');
   assert.equal(await page.locator('#lesson-input').inputValue(),'');
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,'no horizontal overflow at width '+width+': '+overflow);
  await ctx.close();
 }
 assert.deepEqual(errors,[],'no JavaScript errors during mobile/desktop practice');
 console.log('PASS: Speed/Lyric/Academy mobile input, next-key feedback, touch actions, and desktop compatibility');
}finally{await browser.close();}
