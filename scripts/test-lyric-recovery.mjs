import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[],backendCalls=[];
const words='[00:00.00] Orbit all the way home\n[00:04.00] Send a clear signal tonight\n[00:08.00] Count the stars above us';
try{
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<800,hasTouch:width<800,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.setDefaultTimeout(8000);
  page.on('pageerror',err=>errors.push(String(err)));
  page.on('request',request=>{if(request.url().includes('/api/music/resolve'))backendCalls.push(request.url());});
  await page.route('https://lrclib.net/api/search**',route=>{
   const term=new URL(route.request().url()).searchParams.get('q');
   if(term==='unavailable')return route.fulfill({status:429,headers:{'Retry-After':'3'},body:'{}'});
   return route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify([{id:424242,trackName:'Orbit Practice',artistName:'QA Example',duration:28,syncedLyrics:words}]),
   });
  });
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count() && await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="lyric-open"]').first().click();
  await page.locator('#lyric-search-input').fill('unavailable');
  await page.locator('#lyric-search-form button[type="submit"]').click();
  await page.locator('.lyric-browse-notice').waitFor();
  assert.match(await page.locator('.lyric-browse-notice').innerText(),/rate-limited/i);
  assert.equal(await page.locator('[data-action="lyric-demo"]').count(),1,'original demo must remain available after a provider failure');
  await page.locator('[data-action="lyric-demo"]').click();
  await page.locator('#lyric-input').waitFor();
  await page.locator('[data-action="lyric-back"]').first().click();
  await page.locator('#lyric-search-input').fill('Orbit Practice');
  await page.locator('#lyric-search-form button[type="submit"]').click();
  await page.locator('[data-action="lyric-result"]').first().waitFor();
  await page.locator('[data-action="lyric-result"]').first().click();
  await page.locator('#lyric-video-status').waitFor();
  assert.match(await page.locator('#lyric-video-status').innerText(),/automatic video matching needs the local server/i);
  assert.match(await page.locator('.lyric-song-heading').innerText(),/Orbit Practice/);
  await page.locator('[data-action="lyric-silent"]').click();
  assert.equal(await page.locator('#lyric-input').isEnabled(),true,'no-video song should immediately support silent practice');
  assert.match(await page.locator('#lyric-video-status').innerText(),/without (?:a )?video/i);
  await ctx.close();
 }
 assert.deepEqual(backendCalls,[],'static edition must never request its nonexistent video matching API');
 assert.deepEqual(errors,[],'provider failures must not crash the browser UI');
 console.log('PASS: rate-limit recovery, offline demo, manual-video fallback and desktop/mobile.');
}finally{await browser.close();}
