import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:850}});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  if(await page.locator('.welcome-continue').isVisible())await page.locator('.welcome-continue').click();
  await page.locator('[data-action="speed-open"]').first().click();
  await page.locator('#speed-input').waitFor();
  for(const pack of ['numpad','numpad-amounts','numpad-codes']){
    await page.locator('[data-action="speed-pack"][data-pack="'+pack+'"]').click();
    assert.equal(await page.locator('.speed-page').getAttribute('data-numeric'),'true');
    assert.equal(await page.locator('#speed-wpm').locator('xpath=following-sibling::small').innerText(),'DPM');
    const displayed=await page.locator('#speed-letters').innerText();
    assert.ok(/[0-9]/.test(displayed));
    const input=page.locator('#speed-input');
    await input.fill('123 45');
    assert.equal(await input.inputValue(),'123 45');
    await page.locator('[data-action="speed-restart"]').first().click();
    assert.equal(await page.locator('#speed-input').inputValue(),'');
  }
  await page.locator('[data-action="speed-pack"][data-pack="everyday"]').click();
  assert.equal(await page.locator('.speed-page').getAttribute('data-numeric'),'false');
  assert.equal(await page.locator('#speed-wpm').locator('xpath=following-sibling::small').innerText(),'WPM');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,'Unexpected viewport overflow at '+width+': '+overflow);
  await page.close();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: numeric packs, digit metrics, restart, classic typing and mobile layout');
}finally{await browser.close();}
