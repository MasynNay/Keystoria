import assert from 'node:assert/strict';
import {chromium} from 'playwright';

/** Simulate an abandoned older search and a blocked YouTube embed. No provider
 * credentials, copyrighted media playback, or network service is required.
 */
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const lyrics='[00:00.00] Never stop the signal\n[00:04.00] Bring the lights home\n[00:08.00] One more hopeful line';
const errors=[];
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width<800,hasTouch:width<800,reducedMotion:'reduce'});
  const page=await context.newPage();page.setDefaultTimeout(8000);
  page.on('pageerror',e=>errors.push(String(e)));
  // Simulate a hosted video's embed-disabled response (YouTube code 150).
  await page.addInitScript(()=>{
   window.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0},Player:class {
    constructor(_id,config){queueMicrotask(()=>config.events.onError({data:150}));}
    destroy(){}
   }};
  });
  let oldRelease;
  const oldSeen=new Promise(resolve=>{
   page.route('https://lrclib.net/api/search**',async route=>{
    const query=new URL(route.request().url()).searchParams.get('q');
    if(query==='slow old'){
     oldRelease=async()=>{try{await route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify([{id:999,trackName:'Old Stale Song',artistName:'Old Artist',duration:30,syncedLyrics:lyrics}])});}catch{}};
     resolve();return; // remain unanswered until the newer featured selection succeeds
    }
    if(query?.toLowerCase().includes('rick astley')){
     return route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify([{id:200,trackName:'Never Gonna Give You Up',artistName:'Rick Astley',duration:30,syncedLyrics:lyrics}])});
    }
    return route.fulfill({status:200,contentType:'application/json',body:'[]'});
   });
  });
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count()&&await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="lyric-open"]').first().click();
  await page.locator('#lyric-search-input').fill('slow old');
  await page.locator('#lyric-search-form button[type="submit"]').click();
  await oldSeen;
  // Selecting a new song must abort the old request and preserve this selection.
  await page.locator('[data-action="lyric-featured"][data-index="0"]').click();
  await page.locator('.lyric-song-heading h1').waitFor();
  assert.match(await page.locator('.lyric-song-heading h1').innerText(),/Never Gonna Give You Up/);
  await page.waitForFunction(()=>document.querySelector('#lyric-video-status')?.textContent?.includes('does not allow embedding'));
  assert.match(await page.locator('#lyric-video-status').innerText(),/change youtube video/i);
  await oldRelease();
  await page.waitForTimeout(80);
  assert.match(await page.locator('.lyric-song-heading h1').innerText(),/Never Gonna Give You Up/,'stale search must never replace current song');
  assert.equal(await page.locator('[data-action="lyric-back"]').count(),1,'user can still return to search');
  await context.close();
 }
 assert.deepEqual(errors,[],'no uncaught UI errors while switching requests');
 console.log('PASS: superseded lyrics, blocked media fallback and new song preserved at mobile/desktop widths');
}finally{await browser.close();}
