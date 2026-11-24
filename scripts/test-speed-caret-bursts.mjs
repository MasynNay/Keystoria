import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// A physical phone may dispatch input, select and selectionchange for one
// keystroke. Confirm duplicate selection events do not re-read Speed Lab cues
// and that edits and deliberate caret moves still update accurately.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try {
 for(const variant of [
  {width:320,height:844,mobile:true,pack:'everyday'},
  {width:390,height:844,mobile:true,pack:'numpad'},
  {width:1440,height:844,mobile:false,pack:'everyday'},
 ]) {
  const ctx=await browser.newContext({
   viewport:{width:variant.width,height:variant.height},
   isMobile:variant.mobile,hasTouch:variant.mobile,
  });
  try {
   const page=await ctx.newPage();
   page.setDefaultTimeout(15000);
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
   await page.locator('#app .brand-name').waitFor();
   const welcome=page.locator('.welcome-continue');
   if(await welcome.count()&&await welcome.isVisible())await welcome.click();
   await page.locator('[data-action="speed-open"]').first().click();
   if(variant.pack==='numpad')
    await page.locator('[data-action="speed-pack"][data-pack="numpad"]').click();
   const field=page.locator('#speed-input');
   const flow=page.locator('#speed-letters');
   const reference=await flow.evaluate(el=>el.dataset.fullReference||el.textContent);
   assert.ok(reference.length>1000,'original full reference is available');

   const clean=reference.slice(0,110);
   await field.fill(clean);
   assert.equal(await flow.getAttribute('data-accuracy'),'100');
   assert.equal((await page.locator('#speed-accuracy').textContent()).trim(),'100%');

   const burst=await page.evaluate(()=>{
    const field=document.getElementById('speed-input');
    const desc=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');
    if(!desc?.configurable||!desc.get||!desc.set)
     throw new Error('Node.prototype.textContent not instrumentable');
    let cueReads=0,spokenReads=0;
    Object.defineProperty(Node.prototype,'textContent',{
     configurable:true,enumerable:desc.enumerable,
     get(){
      if(this.id==='speed-mobile-first'||this.id==='speed-mobile-rest')cueReads++;
      if(this.id==='speed-screenreader-target')spokenReads++;
      return desc.get.call(this);
     },
     set(value){return desc.set.call(this,value);}
    });
    try {
     for(let i=0;i<35;i++){
      field.dispatchEvent(new Event('select',{bubbles:true}));
      document.dispatchEvent(new Event('selectionchange'));
     }
     return {cueReads,spokenReads,fieldValue:field.value};
    }finally{Object.defineProperty(Node.prototype,'textContent',desc);}
   });
   assert.equal(burst.cueReads,0,
    'unchanged repeated select events must not rerun visual cue computation');
   assert.equal(burst.spokenReads,0,
    'unchanged selection changes must not reevaluate spoken cue');
   assert.equal(burst.fieldValue,clean,'repeated selection events preserve native text');

   // Change the editable caret without touching the text. The visual and
   // screen-reader target must follow the real selection, not the old end.
   await field.evaluate(el=>{
    el.setSelectionRange(3,3);
    el.dispatchEvent(new Event('select',{bubbles:true}));
   });
   assert.equal(await page.locator('#speed-mobile-first').textContent(),
    reference[3]===' '?'␣':reference[3]);
   assert.equal(await flow.getAttribute('data-accuracy'),'100',
    'caret-only movement never changes accuracy');
   assert.equal(await field.inputValue(),clean);

   // Correct a wrong character in the middle; the single controller score
   // must match both the live label and the full reference renderer.
   const idx=variant.pack==='numpad'
    ?[...clean].findIndex(ch=>ch>='0'&&ch<='9')
    :15;
   assert.ok(idx>=0);
   const replacement=variant.pack==='numpad'
    ?clean[idx]==='5'?'6':'5'
    :clean[idx]==='!'?'?':'!';
   const broken=clean.slice(0,idx)+replacement+clean.slice(idx+1);
   await field.fill(broken);
   const expectedAccuracy=Math.round((broken.length-1)/broken.length*100);
   assert.equal(await flow.getAttribute('data-accuracy'),String(expectedAccuracy));
   assert.equal((await page.locator('#speed-accuracy').textContent()).trim(),
    expectedAccuracy+'%','live score and renderer agree');
   await field.fill(clean);
   assert.equal(await flow.getAttribute('data-accuracy'),'100',
    'fixing earlier edits restores a perfect score');

   // Word Focus changes the presentation with the text/caret unchanged;
   // that change must invalidate the guidance cache.
   if(variant.mobile&&variant.pack==='everyday'){
    const toggle=page.locator('#speed-focus-toggle');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-pressed'),'true');
    assert.ok((await page.locator('#speed-focus-word').textContent()).length>0);

    // A genuine phone input must keep the visible Word Focus spans mounted
    // while the player edits the same word. Crossing the Space boundary
    // remounts only the new word, without detaching the native textarea.
    // Randomized Everyday streams can start with "a", "I" or "it".
    // Select the first actual >=3-character word, not a lucky first roll.
    const words=reference.split(' ');
    const focusIndex=words.findIndex(word=>word.length>=3);
    assert.ok(focusIndex>=0,'stream contains a complete practice word');
    const wordStart=words.slice(0,focusIndex).reduce((n,word)=>n+word.length+1,0);
    const wordEnd=wordStart+words[focusIndex].length;
    await field.fill(reference.slice(0,wordStart+1));
    await page.evaluate(()=>{
     window.__speedWordFirstChar=document.querySelector('#speed-focus-word .speed-focus-char');
     window.__speedNativeField=document.getElementById('speed-input');
    });
    await field.fill(reference.slice(0,wordStart+2));
    assert.deepEqual(await page.evaluate(()=>({
     character:document.querySelector('#speed-focus-word .speed-focus-char')===window.__speedWordFirstChar,
     field:document.getElementById('speed-input')===window.__speedNativeField,
    })),{character:true,field:true},'same-word typing retains native input and visual glyphs');
    const editedWordTransition=reference.slice(0,wordEnd+2);
    await field.fill(editedWordTransition);
    assert.equal(await page.evaluate(()=>
     document.querySelector('#speed-focus-word .speed-focus-char')===window.__speedWordFirstChar),false,
     'advancing to the next word mounts the new target');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-pressed'),'false');
    assert.equal(await field.inputValue(),editedWordTransition,
     'Word Focus toggle preserves the text actually edited during the test');
   }
  }finally{await ctx.close();}
 }
 // Pure focus projection must remain unchanged for corrections, caret
 // movement, a pending separator, Word Focus transitions and external markup.
 const parity=await (async()=>{
  const ctx=await browser.newContext();
  try{
   const page=await ctx.newPage();
   await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
   return await page.evaluate(async()=>{
    const {speedFocusWord,paintSpeedFocusWord}=
     await import('./assets/ui/mobile-typing.js?v=0.50.0');
    const box=document.createElement('div');
    document.body.append(box);
    const reference='signal carried onward';
    const typedValues=['','s','si','sig','sign','signal','signal ','signal c'];
    let first=null,retained=0,transitions=0;
    for(const typed of typedValues){
     const focus=speedFocusWord(reference,typed,typed.length);
     paintSpeedFocusWord(box,focus);
     const expected=document.createElement('div');
     for(const ch of focus.characters){
      const span=document.createElement('span');
      span.className='speed-focus-char '+ch.state+(ch.current?' current':'');
      span.textContent=ch.letter;
      expected.append(span);
     }
     if(box.innerHTML!==expected.innerHTML)
      throw new Error('Word Focus renderer differs at '+JSON.stringify(typed));
     if(first && typed.length<=6){
      if(first!==box.firstElementChild)
       throw new Error('ordinary same-word edit remounted character nodes');
      retained++;
     }
     if(first && typed.length>6 && first!==box.firstElementChild)transitions++;
     if(!first)first=box.firstElementChild;
    }
    box.replaceChildren(document.createElement('em'));
    paintSpeedFocusWord(box,speedFocusWord(reference,'s',1));
    if(!box.firstElementChild?.classList.contains('speed-focus-char'))
     throw new Error('external DOM replacement not recovered');
    paintSpeedFocusWord(box,{characters:[]});
    if(box.textContent!=='COMPLETE')throw new Error('completion view lost');
    const done=box.firstElementChild;
    paintSpeedFocusWord(box,{characters:[]});
    if(box.firstElementChild!==done)throw new Error('completion unnecessarily remounted');
    box.remove();
    return {retained,transitions};
   });
  }finally{await ctx.close();}
 })();
 assert.deepEqual(parity,{retained:5,transitions:2});
 assert.deepEqual(errors,[],'no uncaught errors during selection bursts');
 console.log('PASS: duplicate selection events do no cue work, earlier caret corrections/accuracy and mobile Word Focus preserved');
}finally{await browser.close();}
