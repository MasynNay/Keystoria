import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport,reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="speed-open"]').first().click();
  await page.locator('[data-action="speed-pack"][data-pack="numpad"]').click();
  assert.equal(await page.locator('[data-action="speed-pack"][data-pack="numpad"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.speed-page').getAttribute('data-speed'),'numpad');
  const reference=await page.locator('#speed-letters').innerText();
  assert.match(reference,/^\d{3} \d{4}/);
  await page.locator('#speed-input').fill(reference.slice(0,3)+'X');
  assert.equal(await page.locator('#speed-input').inputValue(),reference.slice(0,3));
  await page.locator('#speed-input').fill(reference.slice(0,3)+' ');
  assert.equal(await page.locator('#speed-input').inputValue(),reference.slice(0,3)+' ');
  assert.equal(await page.locator('#speed-accuracy').innerText(),'100%');
  assert.ok((await page.locator('#speed-wpm').innerText()).match(/^\d+$/));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,'Numpad layout overflows '+viewport.width+'px by '+overflow+'px');
  // The mobile layout adds its own Restart button; target the one visible in this viewport.
  await page.locator('[data-action="speed-restart"]:visible').first().click();
  assert.equal(await page.locator('#speed-input').inputValue(),'');
  await page.locator('[data-action="speed-pack"][data-pack="technology"]').click();
  assert.equal(await page.locator('.speed-page').getAttribute('data-speed'),'technology');
  await page.close();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: Numpad UI, numeric entry, restart, existing word packs, desktop/mobile.');
}finally{await browser.close();}
