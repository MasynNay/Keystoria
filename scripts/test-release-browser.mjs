/** Public-release smoke test.
 * Uses the actual portfolio and static browser game, not source mocks.
 * Run with: python3 -m http.server 8765 --bind 127.0.0.1 --directory site
 * Then: node scripts/test-release-browser.mjs
 */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base='http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const socketUrls=[];

async function playAt(width){
 const mobile=width<800;
 const context=await browser.newContext({
  viewport:{width,height:844},isMobile:mobile,hasTouch:mobile,
  reducedMotion:'reduce',
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(String(error)));
 page.on('websocket',socket=>socketUrls.push(socket.url()));
 page.on('request',request=>{
  if(/\/ws(?:\?|$)/.test(new URL(request.url()).pathname))socketUrls.push(request.url());
 });
 try{
  // A real visitor must be able to move from the public portfolio to /play/.
  const response=await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200,'portfolio homepage must exist');
  assert.ok((await page.locator('#hero-heading').innerText()).includes('OPENS A WORLD'));
  await page.locator('.hero-buttons a.primary[href="play/"]').click();
  await page.waitForURL(/\/play\/$/);
  assert.equal(await page.locator('meta[name="keystoria-browser-edition"]').getAttribute('content'),'true');
  assert.match(await page.locator('.browser-edition-note').innerText(),/Story missions and co-op rooms require the local Python server/);
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count() && await welcome.isVisible())await welcome.click();

  // Some browser releases hide the local story button altogether. If it is
  // offered, it must show the local-only explanation rather than connect /ws.
  const localStory=page.locator('[data-action="solo"]');
  if(await localStory.count()){
   await localStory.first().click();
   assert.match(await page.locator('#toast-layer').innerText(),/need the Python game server/i);
  }

  // Speed Lab must start timing, survive category switches, and label CPM.
  await page.locator('[data-action="speed-open"]').first().click();
  await page.locator('#speed-input').waitFor();
  await page.locator('#speed-input').fill('test');
  assert.equal(await page.locator('#speed-mode').innerText(),'SESSION LIVE');
  const legal=page.locator('[data-action="speed-pack"][data-pack="legal"]');
  await legal.click();
  assert.equal(await legal.getAttribute('aria-pressed'),'true');
  await page.locator('#speed-input').fill('case');
  assert.equal(await page.locator('#speed-input').inputValue(),'case');
  await page.locator('[data-action="speed-pack"][data-pack="numpad"]').click();
  assert.equal(await page.locator('#speed-input').getAttribute('inputmode'),'numeric');
  assert.equal(await page.locator('#speed-wpm').locator('xpath=following-sibling::small').innerText(),'CPM');
  await page.locator('[data-action="speed-home"]').first().click();

  // The original built-in lyric demo must work without any media service.
  await page.locator('[data-action="lyric-open"]').first().click();
  await page.locator('[data-action="lyric-demo"]').click();
  await page.locator('#lyric-input').waitFor();
  await page.locator('#lyric-next-keystroke').waitFor();
  await page.locator('#lyric-input').fill('Sig');
  assert.equal(await page.locator('#lyric-input').inputValue(),'Sig');
  assert.ok((await page.locator('#lyric-next-keystroke').innerText()).length>0,'next-key cue should render');
  await page.locator('[data-action="lyric-back"]').first().click();
  await page.locator('[data-action="lyric-home"]').first().click();

  // An actual Academy command must be checked through its working UI.
  await page.locator('[data-action="learn"][data-os="linux"]').click();
  await page.locator('#lesson-input').waitFor();
  const command=(await page.locator('#lesson-target-text').textContent()).trim();
  assert.ok(command.length>0);
  await page.locator('#lesson-input').fill(command);
  const submit=mobile
    ?'.academy-mobile-entry [data-action="training-submit"]'
    :'.terminal-inner > .training-buttons [data-action="training-submit"]';
  await page.locator(submit).click();
  assert.match(await page.locator('#training-feedback').innerText(),/COMMAND RECOGNIZED/);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,'horizontal overflow at '+width+'px: '+overflow);
 }finally{
  await context.close();
 }
}

try {
 for(const width of [390,1440])await playAt(width);
 assert.deepEqual(errors,[],'all three browser practice modes must be free of uncaught errors');
 assert.deepEqual(socketUrls,[],'the Pages edition must never open the local story WebSocket');
 console.log('PASS: portfolio navigation, no hosted co-op, Speed/Numpad, original Lyric demo, Academy and mobile/desktop layout');
}finally{
 await browser.close();
}
