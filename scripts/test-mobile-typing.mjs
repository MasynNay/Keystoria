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
/** Viewport rotation is emulated here; this does not open a real OS keyboard. */
async function checkRotationFocus(page,fieldId,portraitWidth){
 const input=page.locator('#'+fieldId);
 await input.focus();
 assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('mobile-typing-active')),true,
  fieldId+' is active in portrait');
 const before=await input.inputValue();
 // Touch landscape is wider than 760px but shallow; keep thumb controls and
 // the active word/command visible next to the real focused field.
 await page.setViewportSize({width:844,height:390});
 await page.waitForFunction(()=>document.body.classList.contains('mobile-typing-active'));
 const cueSelector={'speed-input':'.mobile-speed-cue','lyric-input':'.mobile-lyric-word',
  'lesson-input':'.mobile-academy-target'}[fieldId];
 assert.equal(await page.locator(cueSelector).isVisible(),true,
  fieldId+' keeps its compact cue visible in touch landscape');
 assert.equal(await input.locator('xpath=ancestor::*[contains(@class,"mobile-typing-entry")]')
   .locator('.mobile-entry-actions').isVisible(),true,
  fieldId+' keeps its thumb actions visible in touch landscape');
 assert.equal(await input.evaluate(el=>document.activeElement===el),true,
  fieldId+' stays focused in landscape');
 const landscapeOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.ok(landscapeOverflow<=2,fieldId+' overflows landscape viewport by '+landscapeOverflow+'px');

 // A taller layout past both breakpoints turns off compact mode. Returning
 // to portrait must recover it even without a fresh focus event.
 await page.setViewportSize({width:844,height:640});
 await page.waitForFunction(()=>!document.body.classList.contains('mobile-typing-active'));
 assert.equal(await page.locator(cueSelector).isVisible(),false,
  fieldId+' hides compact cue on wider tall layouts');
 assert.equal(await input.evaluate(el=>document.activeElement===el),true,
  fieldId+' still owns focus in the wider layout');
 await page.setViewportSize({width:portraitWidth,height:844});
 await page.waitForFunction(()=>document.body.classList.contains('mobile-typing-active'));
 assert.equal(await input.evaluate(el=>document.activeElement===el),true,
  fieldId+' stays focused after returning to portrait');
 assert.equal(await input.inputValue(),before,fieldId+' retains typed content');
 // A keyboard-sized short viewport must not drop the active state either.
 await page.setViewportSize({width:portraitWidth,height:420});
 await page.waitForFunction(()=>document.body.classList.contains('mobile-typing-active'));
 assert.equal(await input.evaluate(el=>document.activeElement===el),true,
  fieldId+' retains focus during a short-height viewport resize');
 await page.setViewportSize({width:portraitWidth,height:844});
}
try{
 for(const width of [320,390,1440]){
  const {page,ctx}=await launch(width);
  const isPhone=width<800;
  await page.locator('[data-action="speed-open"]').first().click();
  await page.locator('#speed-input').waitFor();
  assert.equal(await page.locator('.mobile-speed-cue').isVisible(),isPhone,'speed cue visible only on phones');
  const input=page.locator('#speed-input');
  assert.equal(await input.getAttribute('aria-describedby'),'speed-input-instructions speed-mode speed-screenreader-target',
   'Speed input exposes its typing instructions, timer state and current target');
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
  if(isPhone)await checkRotationFocus(page,'speed-input',width);
  const next=await page.locator('#speed-mobile-first').textContent();
  assert.ok(next?.length===1 || next==='␣','a next character must be visible');
  const spoken=page.locator('#speed-screenreader-target');
  assert.equal(await spoken.getAttribute('role'),'status');
  assert.equal(await spoken.getAttribute('aria-live'),'polite');
  assert.equal(await spoken.getAttribute('aria-atomic'),'true');
  assert.equal(await spoken.evaluate(el=>getComputedStyle(el).clipPath),'inset(50%)',
   'spoken target is clipped visually but available to assistive technologies');
  const wordReference=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
  const [firstWord,secondWord]=wordReference.split(/\s+/);
  assert.ok(firstWord&&secondWord,'Speed Lab exposes at least two drill words');
  assert.equal(await spoken.textContent(),'Current word: '+firstWord);
  await page.evaluate(()=>{
   window.__speedSpokenMutations=0;
   window.__spokenNode=document.querySelector('#speed-screenreader-target');
   window.__speedWordObserver=new MutationObserver(entries=>{window.__speedSpokenMutations+=entries.length});
   window.__speedWordObserver.observe(window.__spokenNode,{characterData:true,childList:true,subtree:true});
  });
  await input.fill(firstWord.slice(0,Math.max(1,firstWord.length-1)));
  await input.fill(firstWord);
  assert.equal(await page.evaluate(()=>window.__speedSpokenMutations),0,
   'per-character typing must not repeatedly announce the same word');
  await input.fill(firstWord+' ');
  assert.equal(await spoken.textContent(),'Current word: '+secondWord,
   'a completed word announces the next target');
  assert.ok(await page.evaluate(()=>window.__speedSpokenMutations)>0,
   'word boundary updates the mounted polite live region');
  assert.equal(await spoken.evaluate(el=>el===window.__spokenNode),true,
   'word transition never remounts the screen-reader status');
  await input.fill(firstWord);
  assert.equal(await spoken.textContent(),'Current word: '+firstWord,
   'backspace across the separator restores the previous target');
  await page.evaluate(()=>window.__speedWordObserver.disconnect());

  // Correct a prior word using the browser's native caret instead of
  // assuming the next edit occurs at the end of the passage.
  const thirdWord=wordReference.trim().split(/\s+/)[2];
  assert.ok(thirdWord,'a third word exists for mid-passage correction');
  const typedThree=firstWord+' '+secondWord+' '+thirdWord.slice(0,1);
  await input.fill(typedThree);
  assert.equal(await spoken.textContent(),'Current word: '+thirdWord);
  const beforeCaretAccuracy=await page.locator('#speed-accuracy').textContent();
  await page.evaluate(()=>{window.__speedLettersNode=document.querySelector('#speed-letters')});
  await input.evaluate(el=>el.setSelectionRange(0,0));
  await page.waitForFunction(expected=>document.querySelector('#speed-screenreader-target')?.textContent===expected,
    'Current word: '+firstWord);
  assert.equal(await page.locator('#speed-mobile-first').textContent(),firstWord[0],
   'next-character cue follows the earlier caret, not the trailing typed text');
  assert.equal(await input.inputValue(),typedThree,'moving the caret does not edit the typed text');
  assert.equal(await page.locator('#speed-accuracy').textContent(),beforeCaretAccuracy,
   'a caret move cannot rescore a timed drill');
  assert.equal(await page.evaluate(()=>document.querySelector('#speed-letters')===window.__speedLettersNode),true,
   'moving the caret keeps the existing fast passage renderer');
  await input.evaluate((el,index)=>el.setSelectionRange(index,index),firstWord.length+1);
  await page.waitForFunction(expected=>document.querySelector('#speed-screenreader-target')?.textContent===expected,
    'Current word: '+secondWord);
  assert.equal(await page.locator('#speed-mobile-first').textContent(),secondWord[0],
   'moving to the middle word updates the visual correction target');
  await input.press('End');
  await page.waitForFunction(expected=>document.querySelector('#speed-screenreader-target')?.textContent===expected,
    'Current word: '+thirdWord);
  assert.equal(await input.evaluate(el=>document.activeElement===el),true,
   'keyboard caret navigation preserves the focused native typing field');
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
   // Tap deletion should preserve native input identity, caret and all text
   // after a middle word. No virtual keyboard or timer restart is requested.
   await page.evaluate(()=>{window.__speedBackWordField=document.querySelector('#speed-input')});
   assert.equal(await page.locator('.speed-mobile-entry [data-action="speed-back-word"]').isVisible(),true);
   await input.fill('alpha beta gamma');
   await input.evaluate(el=>el.setSelectionRange(10,10));
   await page.locator('.speed-mobile-entry [data-action="speed-back-word"]').click();
   assert.equal(await input.inputValue(),'alpha gamma','middle word deletion preserves the suffix');
   assert.equal(await input.evaluate(el=>el.selectionStart),6,'caret remains at deletion point');
   assert.equal(await input.evaluate(el=>document.activeElement===el),true,'Back Word restores focus');
   assert.equal(await input.evaluate(el=>el===window.__speedBackWordField),true,'Back Word does not remount the input');
   await input.fill('alpha beta');
   await page.locator('.speed-mobile-entry [data-action="speed-back-word"]').click();
   assert.equal(await input.inputValue(),'alpha ','end-of-field Back Word removes only the last word');
   await input.evaluate(el=>el.setSelectionRange(0,6));
   await page.locator('.speed-mobile-entry [data-action="speed-back-word"]').click();
   assert.equal(await input.inputValue(),'','selection deletion matches the selection');
   await page.locator('.speed-mobile-entry [data-action="speed-back-word"]').click();
   assert.equal(await input.inputValue(),'','empty Back Word has no effect');
   assert.equal(await input.evaluate(el=>document.activeElement===el),true,'empty Back Word restores focus');
   await page.locator('.speed-mobile-entry [data-action="speed-restart"]').click();
   assert.equal(await page.locator('#speed-input').inputValue(),'');
  } else {
   assert.equal(await page.locator('.speed-mobile-entry [data-action="speed-back-word"]').isVisible(),false,
    'Back Word is a touch-layout action, hidden on desktop');
   assert.equal(await page.locator('.mobile-entry-actions').first().isVisible(),false);
  }
  await page.locator('[data-action="speed-pack"][data-pack="numpad"]').click();
  assert.equal(await page.locator('.speed-page').getAttribute('data-speed'),'numpad');
  assert.equal(await page.locator('#speed-input').getAttribute('inputmode'),'numeric');
  const numericReference=await page.locator('#speed-letters').innerText();
  assert.match(numericReference,/^\d{3} \d{4}/);
  const secondGroup=numericReference.split(/\s+/)[1];
  assert.equal(await page.locator('#speed-screenreader-target').textContent(),
   'Current number group: '+numericReference.slice(0,3),
   'Numpad target uses number-group language');
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
    await page.locator('#speed-input').evaluate(el=>el.setSelectionRange(el.value.length,el.value.length));
    await page.locator('.speed-mobile-entry [data-action="speed-back-word"]').click();
    assert.equal(await page.locator('#speed-input').inputValue(),numericReference.slice(0,4),
      'Back Word deletes the previous digit group without restarting Numpad');
    assert.equal(await page.locator('#speed-input').evaluate(el=>document.activeElement===el),true,
      'Numpad correction retains native typing focus');
  } else {
    await page.locator('#speed-input').fill(numericReference.slice(0,3)+' ');
  }
  assert.equal(await page.locator('#speed-screenreader-target').textContent(),
   'Current number group: '+secondGroup,
   'Numpad announcement advances when a group separator is entered');
  const numpadTypedBefore=await page.locator('#speed-input').inputValue();
  await page.locator('#speed-input').evaluate(el=>el.setSelectionRange(0,0));
  await page.waitForFunction(expected=>document.querySelector('#speed-screenreader-target')?.textContent===expected,
   'Current number group: '+numericReference.slice(0,3));
  assert.equal(await page.locator('#speed-mobile-first').textContent(),numericReference[0],
   'Numpad next-key guidance follows the prior group at the caret');
  await page.locator('#speed-input').press('End');
  await page.waitForFunction(expected=>document.querySelector('#speed-screenreader-target')?.textContent===expected,
   'Current number group: '+secondGroup);
  assert.equal(await page.locator('#speed-input').inputValue(),numpadTypedBefore,
   'Numpad caret navigation cannot alter entered digits');
  assert.equal(await page.locator('#speed-wpm').locator('xpath=following-sibling::small').innerText(),'CPM');
  await page.locator('[data-action="speed-pack"][data-pack="everyday"]').click();
  await page.locator('[data-action="speed-home"]').first().click();
  await homeFromModal(page);
  await page.locator('[data-action="lyric-open"]').first().click();
  await page.locator('[data-action="lyric-demo"]').click();
  await page.locator('#lyric-input').waitFor();
  assert.equal(await page.locator('#lyric-input').getAttribute('aria-describedby'),
   'lyric-screenreader-word lyric-typing-hint',
   'Lyric input exposes its changing word and keyboard instructions');
  const readerWord=page.locator('#lyric-screenreader-word');
  assert.equal(await readerWord.getAttribute('aria-live'),'polite');
  assert.equal(await readerWord.getAttribute('aria-atomic'),'true');
  assert.equal(await readerWord.textContent(),'Current word: Signals');
  assert.equal(await readerWord.evaluate(el=>getComputedStyle(el).clipPath),'inset(50%)',
   'spoken word is visually clipped but remains in the accessibility tree');
  assert.equal(await page.locator('.lyric-enter-compact').isVisible(),isPhone,
   'Enter-to-submit instruction appears only for compact layout');
  assert.equal(await page.locator('.lyric-enter-wide').isVisible(),!isPhone,
   'Enter-to-skip instruction appears only for wide layout');
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
   await checkRotationFocus(page,'lyric-input',width);
   await page.locator('#lyric-input').fill('Signals');
   await page.locator('[data-action="lyric-mobile-submit"]').click();
   assert.equal(await page.locator('#lyric-input').inputValue(),'');
   assert.ok((await page.locator('#lyric-progress').innerText()).startsWith('1/'));
   assert.equal(await readerWord.textContent(),'Current word: through',
    'next target updates without moving focus');
   // Compact touch landscape uses Enter to submit, not to skip the lyric line.
   await page.setViewportSize({width:844,height:390});
   assert.equal(await page.locator('.lyric-enter-compact').isVisible(),true);
   assert.equal(await page.locator('.lyric-enter-wide').isVisible(),false);
   await page.locator('#lyric-input').fill('through');
   await page.locator('#lyric-input').press('Enter');
   assert.ok((await page.locator('#lyric-progress').innerText()).startsWith('2/'),
    'Enter in touch landscape submits the next word');
   assert.equal(await readerWord.textContent(),'Current word: the',
    'touch landscape Enter updates the accessible target');
   await page.setViewportSize({width,height:844});
   await page.locator('.lyric-mobile-entry [data-action="lyric-skip"]').click();
   assert.ok(Number((await page.locator('#lyric-progress').innerText()).split('/')[0])>1);
  }else{
   await page.locator('[data-action="lyric-toggle"]').click();
   await page.waitForFunction(()=>!document.querySelector('#lyric-input')?.disabled);
   await page.locator('#lyric-input').fill('Signals');
   await page.locator('#lyric-input').press('Control+Enter');
   assert.ok((await page.locator('#lyric-progress').innerText()).startsWith('1/'),
    'desktop Ctrl+Enter submits the lyric word');
   assert.equal(await readerWord.textContent(),'Current word: through');
   await page.locator('#lyric-input').press('Enter');
   assert.ok(Number((await page.locator('#lyric-progress').innerText()).split('/')[0])>1,
    'wide desktop Enter skips the remainder of the lyric line');
  }
  await page.locator('[data-action="lyric-back"]').first().click();
  await page.locator('[data-action="lyric-home"]').first().click();
  await homeFromModal(page);
  await page.locator('[data-action="learn"][data-os="linux"]').click();
  await page.locator('#lesson-input').waitFor();
  assert.equal(await page.locator('#lesson-input').getAttribute('aria-describedby'),
   'lesson-target-text training-feedback','Academy input exposes its target command and status');
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
  if(isPhone)await checkRotationFocus(page,'lesson-input',width);
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
  if(!isPhone){
   // A desktop window that happens to be short must not become phone mode.
   await page.setViewportSize({width:844,height:390});
   assert.equal(await page.locator('.mobile-academy-target').isVisible(),false,
    'desktop short window must keep native desktop layout');
   assert.equal(await page.locator('.academy-mobile-entry .mobile-entry-actions').isVisible(),false,
    'desktop short window must not expose phone-only touch actions');
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,'no horizontal overflow at width '+width+': '+overflow);
  await ctx.close();
 }
 assert.deepEqual(errors,[],'no JavaScript errors during mobile/desktop practice');
 console.log('PASS: Speed/Lyric/Academy mobile input, next-key feedback, touch actions, and desktop compatibility');
}finally{await browser.close();}
