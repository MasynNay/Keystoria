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

  // A phone's native input event must not synchronously measure layout.
  // Three edits in one task may repaint letters immediately, but scroll
  // geometry should be read once in a following frame, not 3 times mid-input.
  if(compact){
   const probe=await page.evaluate(async()=>{
    const field=document.getElementById('speed-input');
    const letters=document.getElementById('speed-letters');
    const reference=letters.dataset.fullReference;
    const original=Element.prototype.getBoundingClientRect;
    let inInput=false,synchronousReads=0,deferredReads=0;
    Element.prototype.getBoundingClientRect=function(...args){
     if(this===letters||this.parentElement===letters){
      if(inInput)synchronousReads++;else deferredReads++;
     }
     return original.apply(this,args);
    };
    try{
     for(const count of [34,52,79]){
      field.value=reference.slice(0,count);
      field.setSelectionRange(count,count);
      inInput=true;
      field.dispatchEvent(new Event('input',{bubbles:true}));
      inInput=false;
     }
     const typed=field.value;
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
     return {synchronousReads,deferredReads,typed};
    }finally{Element.prototype.getBoundingClientRect=original;}
   });
   assert.equal(probe.synchronousReads,0,
    'compact typing must not synchronously flush layout for each native input');
   assert.ok(probe.deferredReads>=2&&probe.deferredReads<=4,
    'coalesced caret scrolling should measure layout only once or twice per frame');
   assert.equal(probe.typed,reference.slice(0,79),'native input remains correct');
  }

  // A single input event after a substantial typing burst still positions the
  // cursor correctly; the reference never shortens as the visual window moves.
  await input.fill(reference.slice(0,330));
  assert.equal(await input.inputValue(),reference.slice(0,330));
  assert.equal(await view.getAttribute('data-accuracy'),'100');
  assert.equal(await view.locator('.type-char.incorrect').count(),0);
  assert.equal(await view.locator('.type-char.current').count(),1);
  // One appended key near the middle of the 700-word passage must mutate
  // only the immediately affected characters, not repaint all 330 already
  // rendered ones. This is true with either compact or desktop rendering.
  const appending=await page.evaluate(()=>{
   const field=document.getElementById('speed-input');
   const element=document.getElementById('speed-letters');
   const before=field.value;
   const full=element.dataset.fullReference||'';
   const mutations=new MutationObserver(()=>{});
   mutations.observe(element,{attributes:true,attributeFilter:['class'],subtree:true});
   try{
    field.value=full.slice(0,331);
    field.setSelectionRange(331,331);
    field.dispatchEvent(new Event('input',{bubbles:true}));
    const changed=mutations.takeRecords().filter(item=>item.target.classList?.contains('type-char')).length;
    return {changed,value:field.value,accuracy:element.dataset.accuracy};
   }finally{mutations.disconnect();}
  });
  assert.equal(appending.value,reference.slice(0,331));
  assert.equal(appending.accuracy,'100');
  assert.ok(appending.changed<=8,
   'single appended character must cause bounded DOM class mutations: '+appending.changed);
  await input.fill(reference.slice(0,330));
  if(compact){
   assert.ok(await view.locator('.type-char').count()<=220,'must not grow DOM after 330 chars');
   assert.equal(await page.locator('#speed-mobile-first').textContent(),reference[330]===' '?'␣':reference[330]);
  }

  // Moving the caret across a long typed passage should shift the displayed
  // highlight without changing typing, accuracy or the bounded phone DOM.
  await input.evaluate(el=>el.setSelectionRange(0,0));
  await page.waitForFunction(()=>Boolean(document.querySelector('#speed-letters .type-char:first-child.current')));
  assert.equal(await view.getAttribute('data-accuracy'),'100','selection-only move does not rescore');
  assert.equal(await input.inputValue(),reference.slice(0,330),'selection-only move preserves text');
  if(compact)assert.ok(await view.locator('.type-char').count()<=220,'backwards caret keeps DOM bounded');
  await input.evaluate(el=>el.setSelectionRange(330,330));
  await page.waitForFunction(expected=>
    document.querySelector('#speed-letters .type-char.current')?.textContent===expected,reference[330]);
  assert.equal(await view.locator('.type-char.current').count(),1,'passage keeps one highlighted caret');
  if(compact)assert.ok(await view.locator('.type-char').count()<=220,'forward caret keeps DOM bounded');

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
