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
    body:JSON.stringify(term==='Unicode Practice'
     ? [{id:525252,trackName:'Unicode Practice',artistName:'QA Example',duration:28,
        syncedLyrics:'[00:00.00] Привет мир\n[00:04.00] नमस्ते दुनिया\n[00:08.00] 안녕 세계\n[00:12.00] ёж йога'}]
     : [{id:424242,trackName:'Orbit Practice',artistName:'QA Example',duration:28,syncedLyrics:words}]),
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
  // While paused, the 180ms lyric timer has no new score to report. Rewriting
  // five unchanged score nodes every tick still wakes mobile accessibility
  // and style engines. Observe actual DOM changes across several timer ticks.
  const unchangedScoreMutations=await page.evaluate(async()=>{
   const ids=['lyric-wpm','lyric-accuracy','lyric-streak','lyric-skipped','lyric-progress'];
   const nodes=ids.map(id=>document.getElementById(id));
   if(nodes.some(node=>!node))throw new Error('Lyric scoreboard node missing');
   let mutations=0;
   const observer=new MutationObserver(records=>{mutations+=records.length;});
   nodes.forEach(node=>observer.observe(node,{childList:true,characterData:true,subtree:true}));
   await new Promise(resolve=>setTimeout(resolve,700));
   observer.disconnect();
   return mutations;
  });
  assert.equal(unchangedScoreMutations,0,
   'the paused Lyric Lab must not churn unchanged scoreboard text');
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
  // A public provider can supply non-Latin lyrics. The game should accept
  // typed words, show a real next-key cue and never force a skipped line.
  await page.locator('[data-action="lyric-back"]').first().click();
  await page.locator('#lyric-search-input').fill('Unicode Practice');
  await page.locator('#lyric-search-form button[type="submit"]').click();
  await page.locator('[data-action="lyric-result"]').first().waitFor();
  await page.locator('[data-action="lyric-result"]').first().click();
  await page.locator('[data-action="lyric-silent"]').click();
  const typed=page.locator('#lyric-input');
  assert.equal(await page.locator('#lyric-screenreader-word').textContent(),'Current word: Привет');
  assert.match(await page.locator('#lyric-next-keystroke').textContent(),/NEXT KEY\s+П/);
  assert.match(await page.locator('#lyric-hint-message').textContent(),/Type using the lyric/);
  for(const [answer,next] of [
   ['Привет','мир'],
   ['мир','नमस्ते'],
   ['नमस्ते','दुनिया'],
   ['दुनिया','안녕'],
   ['안녕','세계'],
   ['세계','ёж'],
  ]) {
   await typed.fill(answer);
   await typed.press('Space');
   assert.equal(await page.locator('#lyric-screenreader-word').textContent(),
    'Current word: '+next,'Unicode word '+answer+' is accepted');
  }
  // Latin-style folding must not accept a different Cyrillic character:
  // ё is not е and й is not и. Decomposed native IME input remains valid.
  assert.match(await page.locator('#lyric-next-keystroke').textContent(),/NEXT KEY\s+Ё/);
  await typed.fill('еж');
  await typed.press('Space');
  assert.equal(await page.locator('#lyric-screenreader-word').textContent(),'Current word: ёж',
   'plain е must not earn credit for ё');
  await typed.fill('е\u0308ж');
  await typed.press('Space');
  assert.equal(await page.locator('#lyric-screenreader-word').textContent(),'Current word: йога',
   'decomposed Cyrillic ё must be accepted');
  await typed.fill('иога');
  await typed.press('Space');
  assert.equal(await page.locator('#lyric-screenreader-word').textContent(),'Current word: йога',
   'plain и must not earn credit for й');
  await typed.fill('и\u0306ога');
  await typed.press('Space');
  await page.locator('#lyric-finish-heading').waitFor();
  assert.equal(await page.locator('#lyric-finish-heading').count(),1,
   'decomposed й must correctly complete the last lyric word');
  await ctx.close();
 }
 assert.deepEqual(backendCalls,[],'static edition must never request its nonexistent video matching API');
 assert.deepEqual(errors,[],'provider failures must not crash the browser UI');
 console.log('PASS: rate-limit recovery, offline demo, manual-video fallback and desktop/mobile.');
}finally{await browser.close();}
