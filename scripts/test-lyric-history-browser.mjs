import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Only the original, bundled Keystoria demo is played. No third-party music
// or lyrics are fetched; test history stays in an isolated browser context.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const {width,phone} of [
  {width:320,phone:false},
  {width:390,phone:true},
  {width:1440,phone:false}
 ]){
  const context=await browser.newContext({
   viewport:{width,height:844},isMobile:phone,hasTouch:phone,
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

   const recent=page.locator('.lyric-recent');
   assert.equal(await recent.getAttribute('aria-labelledby'),'lyric-recent-title');
   assert.equal(await recent.locator('ol li').count(),0,'initial local song history is empty');
   assert.match(await recent.innerText(),/Finish a song to see your recent performances/);
   await page.locator('[data-action="lyric-demo"]').click();
   await page.locator('#lyric-seek-slider').evaluate(el=>{
    el.value='60';el.dispatchEvent(new Event('change',{bubbles:true}));
   });
   await page.locator(width<=760
    ?'.lyric-mobile-entry [data-action="lyric-skip"]'
    :'#lyric-skip').click();
   assert.equal(await page.locator('#lyric-finish-panel').isVisible(),true);
   await page.locator('[data-action="lyric-finish-back"]').click();
   assert.equal(await recent.locator('ol li').count(),1,
    'completed demo is shown on return to song library');
   assert.match(await recent.innerText(),/Signals Through The Night/);
   assert.match(await recent.innerText(),/KEYSTORIA/);
   assert.match(await recent.innerText(),/WPM/);
   assert.match(await recent.innerText(),/accuracy/);
   assert.match(await recent.innerText(),/skipped/);
   assert.equal(await recent.locator('time[datetime]').count(),1);
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('panic.lyric.history')||'[]'));
   assert.equal(saved.length,1);
   assert.equal(saved[0].title,'Signals Through The Night');

   // A prior score is persistent, but must never become executable HTML.
   await page.evaluate(()=>{
    const runs=JSON.parse(localStorage.getItem('panic.lyric.history'));
    runs.unshift({
     title:'<img src=x onerror="window.__unsafeHistory=true">',
     artist:'<svg onload="window.__unsafeHistory=true">',
     date:new Date().toISOString(),wpm:42,accuracy:98,points:350,skipped:0
    });
    localStorage.setItem('panic.lyric.history',JSON.stringify(runs));
   });
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#app .brand-name').waitFor();
   const repeatWelcome=page.locator('.welcome-continue');
   if(await repeatWelcome.count()&&await repeatWelcome.isVisible())await repeatWelcome.click();
   await page.locator('[data-action="lyric-open"]').first().click();
   assert.equal(await recent.locator('ol li').count(),2,
    'scores persist across reload without accounts');
   assert.equal(await recent.locator('img,svg').count(),0,
    'stored names are escaped rather than becoming new elements');
   assert.equal(await page.evaluate(()=>window.__unsafeHistory===true),false,
    'no saved metadata executes as JavaScript');
   assert.match(await recent.locator('li').first().innerText(),/<img src=x/);

   const layout=await page.evaluate(()=>{
    const node=document.querySelector('.lyric-recent');
    const rect=node.getBoundingClientRect();
    return {left:rect.left,right:rect.right,doc:document.documentElement.scrollWidth,
     viewport:document.documentElement.clientWidth};
   });
   assert.ok(layout.left>=-1&&layout.right<=layout.viewport+1,
    'Lyric score panel stays inside '+width+'px viewport: '+JSON.stringify(layout));
   assert.ok(layout.doc<=layout.viewport+2,
    'saved history does not cause horizontal page overflow: '+JSON.stringify(layout));
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[],'no uncaught errors in Lyric history');
 console.log('PASS: local Lyric history after completion, reload, escaping and narrow/mobile layouts');
}finally{await browser.close();}
