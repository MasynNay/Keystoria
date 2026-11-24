import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Release guard for synchronous layout reads DURING a native typing event.
// This deliberately counts DOM geometry requests, not wall-clock durations:
// headless Chromium is not an iOS/Android latency benchmark.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];

async function openHome(page){
 await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
 await page.locator('#app .brand-name').waitFor();
 const welcome=page.locator('.welcome-continue');
 if(await welcome.count()&&await welcome.isVisible())await welcome.click();
}
async function openMode(page,mode){
 if(mode==='speed'){
  await page.locator('[data-action="speed-open"]').first().click();
  const view=page.locator('#speed-letters');
  const text=await view.evaluate(el=>el.dataset.fullReference||el.textContent);
  return {selector:'#speed-input',text:text.slice(0,9)};
 }
 if(mode==='academy'){
  await page.locator('[data-action="learn"][data-os="linux"]').click();
  return {selector:'#lesson-input',text:'abc'};
 }
 await page.locator('[data-action="lyric-open"]').first().click();
 await page.locator('[data-action="lyric-demo"]').click();
 await page.locator('#lyric-toggle').click();
 await page.waitForFunction(()=>!document.getElementById('lyric-input')?.disabled);
 return {selector:'#lyric-input',text:'abz'};
}

async function instrument(page,selector){
 return page.evaluate(selector=>{
  const field=document.querySelector(selector);
  if(!field)throw new Error('Missing native practice input: '+selector);
  const element=Element.prototype, html=HTMLElement.prototype;
  const bounds=element.getBoundingClientRect,rects=element.getClientRects;
  const getters=[];
  let inInput=false,geometry=0,events=0;
  element.getBoundingClientRect=function(...args){
   if(inInput)geometry++;
   return bounds.apply(this,args);
  };
  element.getClientRects=function(...args){
   if(inInput)geometry++;
   return rects.apply(this,args);
  };
  try{
   for(const property of ['offsetWidth','offsetHeight','clientWidth','clientHeight']){
    const owner=property.startsWith('offset')?html:element;
     const descriptor=Object.getOwnPropertyDescriptor(owner,property);
    if(!descriptor?.configurable||!descriptor.get)throw Error('Cannot instrument '+property);
    Object.defineProperty(owner,property,{
     configurable:true,enumerable:descriptor.enumerable,
     get(){if(inInput)geometry++;return descriptor.get.call(this);},
     ...(descriptor.set?{set(value){return descriptor.set.call(this,value);}}:{})
    });
    getters.push([owner,property,descriptor]);
   }
  }catch(error){
   element.getBoundingClientRect=bounds;
   element.getClientRects=rects;
   for(const [owner,property,descriptor] of getters)Object.defineProperty(owner,property,descriptor);
   throw error;
  }
  const begin=event=>{
   if(event.target===field){events++;inInput=true;}
  };
  const end=event=>{if(event.target===field)inInput=false;};
  document.addEventListener('input',begin,true);
  document.addEventListener('input',end,false);
  // This is an instrumented test page, not a persistent application hook.
  window.__layoutInputProbe={
   finish(){
    inInput=false;
    document.removeEventListener('input',begin,true);
    document.removeEventListener('input',end,false);
    element.getBoundingClientRect=bounds;
    element.getClientRects=rects;
    for(const [owner,property,descriptor] of getters)Object.defineProperty(owner,property,descriptor);
    delete window.__layoutInputProbe;
    return {geometry,events,value:field.value,focused:document.activeElement===field,
      attached:field.isConnected};
   }
  };
  return true;
 },selector);
}

try{
 for(const {width,height,touch} of [
  {width:390,height:844,touch:true},
  {width:844,height:390,touch:true},
  {width:1440,height:844,touch:false},
 ]){
  const context=await browser.newContext({
   viewport:{width,height},isMobile:touch,hasTouch:touch,reducedMotion:'reduce'
  });
  try{
   const page=await context.newPage();
   page.setDefaultTimeout(12000);
   page.on('pageerror',error=>errors.push(String(error)));
   for(const mode of ['speed','academy','lyric']){
    await openHome(page);
    const {selector,text}=await openMode(page,mode);
    const field=page.locator(selector);
    await field.focus();
    assert.equal(await field.evaluate(el=>document.activeElement===el),true,
      mode+' must focus the native input');
    await instrument(page,selector);
    // Real Chromium keyboard events, not synthetic input dispatches, pass
    // through the actual application's delegated native input handlers.
    await page.keyboard.type(text,{delay:8});
    const sample=await page.evaluate(()=>window.__layoutInputProbe.finish());
    assert.equal(sample.events,text.length,
      'one native input event per typed ASCII key in '+mode);
    assert.equal(sample.value,text,
      'instrumentation must preserve user-typed text in '+mode);
    assert.ok(sample.attached&&sample.focused,
      'no field remount or keyboard focus loss in '+mode);
    if(touch)assert.equal(sample.geometry,0,
      mode+' must not synchronously measure layout inside phone input handlers');
    // The wide desktop Speed Lab intentionally synchronously positions its
    // full passage; it is NOT subject to the phone-only zero-read budget.
    console.log('PASS '+mode+' '+width+'x'+height+
      (touch?' touch':' desktop')+' input events='+sample.events+
      ' synchronous geometry reads='+sample.geometry);
   }
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[],'native typing/viewport probes must not throw');
 console.log('PASS: native phone typing remains synchronous-layout-free in Speed Lab, Field Academy and Lyric Lab; desktop typing intact');
}finally{await browser.close();}
