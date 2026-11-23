import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// The bundled original demo is local and does not need network, a YouTube
// account, or playback of copyrighted music.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const inputWrites=async(page,duration)=>page.evaluate(async ms=>{
 const proto=HTMLInputElement.prototype, desc=Object.getOwnPropertyDescriptor(proto,'value');
 if(!desc?.configurable||!desc.get||!desc.set)throw new Error('Cannot instrument input.value');
 let writes=0;
 Object.defineProperty(proto,'value',{
  configurable:true,enumerable:desc.enumerable,
  get(){return desc.get.call(this);},
  set(value){if(this.id==='lyric-seek-slider')writes++;return desc.set.call(this,value);},
 });
 try{
  await new Promise(resolve=>setTimeout(resolve,ms));
  return writes;
 }finally{Object.defineProperty(proto,'value',desc);}
},duration);

try{
 for(const {width,phone,motion} of [
  {width:390,phone:true,motion:'no-preference'},
  {width:1440,phone:false,motion:'reduce'},
 ]){
  const context=await browser.newContext({
   viewport:{width,height:844},isMobile:phone,hasTouch:phone,reducedMotion:motion,
  });
  try{
   const page=await context.newPage();
   page.setDefaultTimeout(12000);
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
   await page.locator('#app .brand-name').waitFor();
   const welcome=page.locator('.welcome-continue');
   if(await welcome.count()&&await welcome.isVisible())await welcome.click();
   await page.locator('[data-action="lyric-open"]').first().click();
   await page.locator('[data-action="lyric-demo"]').click();
   const fill=page.locator('#lyric-live-fill');
   const slider=page.locator('#lyric-seek-slider');
   // At time zero scaleX(0) has a zero visual bounding box, which Playwright
   // correctly calls hidden. Assert DOM attachment, not nonzero visual fill.
   await fill.waitFor({state:'attached'});
   assert.equal(await fill.evaluate(el=>el.style.width),'',
    'the live meter must no longer use a layout-invalidating inline width');
   const initial=await fill.evaluate(el=>{
    const parent=el.parentElement;
    const style=getComputedStyle(el);
    return {transform:el.style.transform,transition:style.transitionProperty,
     parentWidth:parent.clientWidth,boxWidth:el.offsetWidth};
   });
   assert.match(initial.transform,/^scaleX\(0(?:\.0+)?\)$/);
   assert.ok(initial.parentWidth>50,'the meter has a real visible track');
   assert.ok(Math.abs(initial.boxWidth-initial.parentWidth)<=2,
    'the fill keeps a full layout box and scales the image only');
   if(motion==='reduce')assert.equal(initial.transition,'none',
    'reduced-motion disables meter transition');
   else assert.ok(['none','transform'].includes(initial.transition),
    'normal meter transition is composited or suppressed while typing');

   const idleWrites=await inputWrites(page,700);
   assert.equal(idleWrites,0,
    'paused Lyric Lab must not rewrite the native range control 5 times/second');
   const pausedTransform=await fill.evaluate(el=>el.style.transform);
   assert.equal(pausedTransform,initial.transform,'paused progress does not advance');

   await page.locator('[data-action="lyric-toggle"]').click();
   await page.waitForFunction(()=>{
    const fill=document.getElementById('lyric-live-fill');
    return fill&&Number(fill.style.transform.match(/scaleX\(([^)]+)\)/)?.[1])>0.12;
   });
   // A new scale target is written before the 120ms CSS transition finishes.
   // Sample after it settles rather than testing the intermediate first frame.
   await page.waitForTimeout(145);
   const running=await fill.evaluate(el=>({
    transform:el.style.transform,width:el.style.width,
    parentWidth:el.parentElement.clientWidth,boxWidth:el.offsetWidth,
    visibleWidth:el.getBoundingClientRect().width,
   }));
   assert.equal(running.width,'','playing never animates layout width');
   assert.ok(Math.abs(running.boxWidth-running.parentWidth)<=2,
    'the progress bar retains stable layout width during playback');
   assert.ok(running.visibleWidth>0&&running.visibleWidth<running.parentWidth,
    'composited fill should show a partial line, observed: '+JSON.stringify(running));

   const playingWrites=await inputWrites(page,1100);
   assert.ok(playingWrites<=4,
    'half-second seek steps should not write the slider on every 180ms tick: '+playingWrites);
   assert.ok(Number(await slider.inputValue())>=0.5,
    'a playing seek slider continues to track playback');

   await page.locator('[data-action="lyric-toggle"]').click();
   // Scrubbing while focused must not be overridden by the interval.
   await slider.focus();
   await slider.evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}));});
   assert.equal(await slider.inputValue(),'2');
   await page.waitForTimeout(420);
   assert.equal(await slider.inputValue(),'2','native range scrubbing retains focus and position');
   await slider.evaluate(el=>el.dispatchEvent(new Event('change',{bubbles:true})));
   const afterSeek=await fill.evaluate(el=>({
    transform:el.style.transform,width:el.style.width,
   }));
   assert.match(afterSeek.transform,/^scaleX\(0\.5\d*\)$/);
   assert.equal(afterSeek.width,'');
   assert.equal((await page.locator('#lyric-clock').textContent()).slice(0,5),'00:02',
    'seeking still updates the real lyric clock immediately');
   const afterPausedSeek=await inputWrites(page,600);
   assert.equal(afterPausedSeek,0,'repeated paused ticks keep slider idle after seek');
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[],'no uncaught browser errors while playing or scrubbing');
 console.log('PASS: Lyric Lab compositor progress, discrete seek updates, reduced motion and paused mobile/desktop playback');
}finally{await browser.close();}
