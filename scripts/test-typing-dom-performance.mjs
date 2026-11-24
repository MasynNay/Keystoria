import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Performance regression: an input event may change styling but must not
// destroy the full prompt or seven lyric-row button trees on every character.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const width of [390,1440]){
  const phone=width<800;
  const context=await browser.newContext({viewport:{width,height:844},isMobile:phone,hasTouch:phone,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror',error=>errors.push(String(error)));
  const openHome=async()=>{
   await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
   await page.locator('#app .brand-name').waitFor();
   const modal=page.locator('.welcome-continue');
   if(await modal.count()&&await modal.isVisible())await modal.click();
  };
  await openHome();

  // Verify the live renderer has exactly the same visual markup as the pure
  // character renderer through mistakes, edits, Unicode and overtyping.
  const validation=await page.evaluate(async()=>{
   const {paintTypingFeedback,renderTypingFeedback,compareTyping}=
     await import('./assets/ui/typing-feedback.js?v=0.2.0');
   const box=document.createElement('div');
   document.body.append(box);
   const reference='Ab <c> 👩‍💻';
   const steps=['','A','Ab','Ab ','Ab <','Ab <X','Ab <c>',
    'Ab <c> 👩‍💻','Ab <c> 👩‍💻!','A','','Ab <c> 👩‍💻'];
   let first=null,markupMatches=0,stableNodes=0;
   for(const typed of steps){
    const score=paintTypingFeedback(box,reference,typed);
    const pure=document.createElement('div');
    pure.innerHTML=renderTypingFeedback(reference,typed);
    if(box.innerHTML!==pure.innerHTML)throw new Error('Feedback markup differs for '+JSON.stringify(typed));
    if(JSON.stringify(score)!==JSON.stringify(compareTyping(reference,typed)))
     throw new Error('Feedback scores changed');
    const firstNow=box.querySelector('.type-char');
    if(first && firstNow!==first)throw new Error('Target characters detached during normal typing');
    if(first)stableNodes++;
    first=firstNow;
    markupMatches++;
   }
   paintTypingFeedback(box,'Ab','a',{caseSensitive:false});
   const exact=document.createElement('div');
   exact.innerHTML=renderTypingFeedback('Ab','a',{caseSensitive:false});
   if(box.innerHTML!==exact.innerHTML)throw new Error('Case-insensitive output mismatch');
   const changed=box.firstElementChild;
   if(changed===first)throw new Error('Reference change did not reset the prompt');
   box.innerHTML='<em>External replacement</em>';
   paintTypingFeedback(box,'Ab','ab',{caseSensitive:false});
   if(box.firstElementChild===changed || box.querySelector('.type-char.correct')?.textContent!=='A')
    throw new Error('Externally replaced DOM was not rebuilt');
   box.remove();
   return {markupMatches,stableNodes};
  });
  assert.equal(validation.markupMatches,12);
  assert.equal(validation.stableNodes,11);


  // Pure string rendering remains the oracle. Updating a real lyric word
  // must preserve equivalent markup, scores and next-key cues without
  // destroying existing grapheme nodes on every native keyboard input.
  const lyricParity=await page.evaluate(async()=>{
   const {paintLyricWordFeedback,renderLyricWordFeedback}=
     await import('./assets/ui/lyric-word-feedback.js?v=0.53.0');
   const cases=[
    {word:'Signals',strict:false,steps:['','S','Si','Sig','Signals','Signal','']},
    {word:'can’t!',strict:false,steps:['','c','ca','cant','cant!','can','']},
    {word:'Café',strict:true,steps:['','C','Ca','Caf','Café','CafX','']},
    {word:'A<&"',strict:true,steps:['','A','A<','A<&','A<&"','A','']},
    {word:'👩‍💻',strict:true,steps:['','👩‍💻','x','']},
   ];
   let checked=0;
   for(const item of cases){
    const target=document.createElement('div');
    document.body.append(target);
    let first=null;
    for(const value of item.steps){
     const output=paintLyricWordFeedback(target,item.word,value,{strict:item.strict});
     const reference=renderLyricWordFeedback(item.word,value,{strict:item.strict});
     const expected=document.createElement('div');expected.innerHTML=reference.html;
     if(target.innerHTML!==expected.innerHTML)
      throw Error('Lyric markup mismatch for '+JSON.stringify({item,value,actual:target.innerHTML,expected:expected.innerHTML}));
     if(JSON.stringify(output)!==JSON.stringify(reference))
      throw Error('Lyric cue or scoring changed');
     const current=target.querySelector('.type-char');
     if(first&&first!==current)throw Error('Lyric character was remounted on ordinary input');
     first=current;
     checked++;
    }
    target.remove();
   }
   return checked;
  });
  assert.equal(lyricParity,32,'all lyric feedback cases match the pure renderer');

  // Real Academy input on the published site must not lose either prompt
  // tree, mobile word cue or the actual focused HTML input across edits.
  await page.locator('[data-action="learn"][data-os="linux"]').click();
  const academy=page.locator('#lesson-input');
  const academyNodes=await page.evaluate(()=>{
   window.__academyFocusNode=document.getElementById('lesson-input');
   window.__academyFirstChar=document.querySelector('#lesson-target-text .type-char');
   window.__academyMobileFirstChar=document.querySelector('#lesson-mobile-target .type-char');
   return [Boolean(window.__academyFirstChar),Boolean(window.__academyMobileFirstChar)];
  });
  assert.deepEqual(academyNodes,[true,true]);
  for(const value of ['a','ab','abc','ax','']){
   await academy.fill(value);
   const stable=await page.evaluate(()=>({
    field:document.getElementById('lesson-input')===window.__academyFocusNode,
    prompt:document.querySelector('#lesson-target-text .type-char')===window.__academyFirstChar,
    mobile:document.querySelector('#lesson-mobile-target .type-char')===window.__academyMobileFirstChar,
   }));
   assert.deepEqual(stable,{field:true,prompt:true,mobile:true},
    'Academy must reuse both feedback trees and the native field at '+width+'px');
  }

  // Lyric text input must not replace line navigation or nonactive word
  // spans on each letter; this preserves focusable references on slow phones.
  await openHome();
  await page.locator('[data-action="lyric-open"]').first().click();
  await page.locator('[data-action="lyric-demo"]').click();
  // Like a real player, explicitly start the track before attempting input.
  // The disabled field in the paused song preview is deliberate behavior.
  await page.locator('#lyric-toggle').click();
  await page.waitForFunction(()=>!document.getElementById('lyric-input')?.disabled);
  const lyric=page.locator('#lyric-input');
  await lyric.waitFor();
  const nodes=await page.evaluate(()=>{
   window.__lyricRow=document.querySelector('#lyric-lines .lyric-line-row');
   window.__lyricWord=document.querySelector('#lyric-current-line > span');
   window.__lyricFirstChar=document.querySelector('#lyric-current-line .lyric-active-word .type-char');
   window.__lyricMobileFirstChar=document.querySelector('#lyric-mobile-word .type-char');
   window.__lyricNativeInput=document.querySelector('#lyric-input');
   return {row:!!window.__lyricRow,word:!!window.__lyricWord,
    active:!!window.__lyricFirstChar,mobile:!!window.__lyricMobileFirstChar};
  });
  assert.deepEqual(nodes,{row:true,word:true,active:true,mobile:true});
  for(const value of ['a','ab','abz','a','']){
   await lyric.fill(value);
   const stable=await page.evaluate(()=>({
    row:document.querySelector('#lyric-lines .lyric-line-row')===window.__lyricRow,
    word:document.querySelector('#lyric-current-line > span')===window.__lyricWord,
    field:document.getElementById('lyric-input')===window.__lyricNativeInput,
    active:document.querySelector('#lyric-current-line .lyric-active-word .type-char')===window.__lyricFirstChar,
    mobile:document.querySelector('#lyric-mobile-word .type-char')===window.__lyricMobileFirstChar,
   }));
   assert.deepEqual(stable,{row:true,word:true,field:true,active:true,mobile:true},
    'Lyric must retain line navigation, word spans and native input at '+width+'px');
  }
  await context.close();
 }
 assert.deepEqual(errors,[],'no uncaught typing UI errors');
 console.log('PASS: stable Academy/story character feedback and Lyric Lab line nodes on phone/desktop, with Unicode and overtyping parity');
}finally{await browser.close();}
