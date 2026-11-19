import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

// Browser viewport/event simulation is NOT a physical iOS or Android keyboard.
const local=readFileSync(new URL('../app/web/ui/mobile-typing.js',import.meta.url),'utf8');
const pages=readFileSync(new URL('../site/play/assets/ui/mobile-typing.js',import.meta.url),'utf8');
assert.equal(local,pages,'local and Pages mobile viewport helpers must remain identical');

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
async function openMode(page,mode){
 if(mode==='speed'){
  await page.locator('[data-action="speed-open"]').first().click();
  return '#speed-input';
 }
 if(mode==='academy'){
  await page.locator('[data-action="learn"][data-os="linux"]').click();
  return '#lesson-input';
 }
 await page.locator('[data-action="lyric-open"]').first().click();
 await page.locator('[data-action="lyric-demo"]').click();
 await page.locator('#lyric-toggle').click();
 await page.waitForFunction(()=>document.querySelector('#lyric-input')?.disabled===false);
 return '#lyric-input';
}
async function testCase({mode,width,height,phone}){
 const ctx=await browser.newContext({
  viewport:{width,height},isMobile:phone,hasTouch:phone,reducedMotion:'no-preference'
 });
 const page=await ctx.newPage();
 page.setDefaultTimeout(10000);
 page.on('pageerror',error=>errors.push(String(error)));
 try{
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count()&&await welcome.isVisible())await welcome.click();
  const selector=await openMode(page,mode),input=page.locator(selector);
  await input.focus();
  assert.equal(await input.evaluate(el=>document.activeElement===el),true);
  const active=await page.locator('body').evaluate(el=>el.classList.contains('mobile-typing-active'));
  assert.equal(active,phone,'touch layout activates mobile typing mode');

  // Allow an initial focus animation frame to finish before installing an
  // isolated recording scroll method. Simulate a cue/input below a keyboard.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
  await page.evaluate(id=>{
   const field=document.querySelector(id),cue=field.closest('.mobile-typing-entry')
    ?.querySelector('.mobile-speed-cue,.mobile-lyric-word,.mobile-academy-target');
   if(!cue)throw Error('No compact cue for '+id);
   field.getBoundingClientRect=()=>({top:1190,bottom:1240,height:50,width:300});
   cue.getBoundingClientRect=()=>({top:1120,bottom:1170,height:50,width:300});
   window.__keyboardScroll=[];
   window.scrollBy=arg=>window.__keyboardScroll.push(arg);
  },selector);
  await page.evaluate(()=>{
   window.dispatchEvent(new Event('resize'));
   window.dispatchEvent(new Event('resize'));
  });
  if(phone){
   await page.waitForFunction(()=>window.__keyboardScroll.length>0);
   const moves=await page.evaluate(()=>window.__keyboardScroll);
   assert.equal(moves.length,1,'resize bursts must schedule a single correction frame');
   assert.deepEqual(Object.keys(moves[0]).sort(),['behavior','left','top']);
   assert.equal(moves[0].behavior,'instant','keyboard changes must override global smooth CSS scrolling');
   assert.equal(moves[0].left,0);
   assert.ok(Number.isInteger(moves[0].top)&&moves[0].top>0,'out-of-view input should scroll upward immediately');

   // App foregrounding can occur without a visualViewport resize. A visible
   // focused field still deserves a correction without remounting its input.
   for(const [target,type] of [['document','visibilitychange'],['window','pageshow']]){
    await page.evaluate(()=>{window.__keyboardScroll=[];});
    await page.evaluate(([target,type])=>{
     (target==='document'?document:window).dispatchEvent(new Event(type));
    },[target,type]);
    await page.waitForFunction(()=>window.__keyboardScroll.length===1);
    assert.equal(await input.evaluate(el=>document.activeElement===el),true,
     type+' must not steal input focus');
    assert.equal(await page.evaluate(()=>window.__keyboardScroll[0].behavior),'instant');
   }
   // Don't scroll a no-longer-focused field when its former session blurs
   // and a toolbar/button gets focus.
   await page.locator('.prefs-toggle').focus();
   await page.evaluate(()=>{
    window.__keyboardScroll=[];
    window.dispatchEvent(new Event('pageshow'));
    window.dispatchEvent(new Event('resize'));
   });
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
   assert.equal(await page.evaluate(()=>window.__keyboardScroll.length),0,
    'blurred fields must never trigger stale keyboard corrections');
  }else{
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
   assert.equal(await page.evaluate(()=>window.__keyboardScroll.length),0,
    'wide mouse desktop should not scroll due to mobile positioning logic');
  }
  console.log('PASS '+mode+' keyboard viewport / resume at '+width+'x'+height+(phone?' touch':' desktop'));
 }finally{await ctx.close();}
}
try{
 for(const params of [
  {mode:'speed',width:390,height:844,phone:true},
  {mode:'speed',width:844,height:390,phone:true},
  {mode:'academy',width:390,height:844,phone:true},
  {mode:'lyric',width:390,height:844,phone:true},
  {mode:'speed',width:1440,height:844,phone:false},
 ])await testCase(params);
 assert.deepEqual(errors,[],'viewport recovery causes no browser exceptions');
 console.log('PASS: instant mobile keyboard scroll, foreground recheck, and focused-input safety');
}finally{await browser.close();}
