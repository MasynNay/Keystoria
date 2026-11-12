import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const width of [320,390,1440]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width<800,hasTouch:width<800,reducedMotion:'reduce'});
  const page=await context.newPage();page.setDefaultTimeout(8000);
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  assert.equal(await page.locator('.welcome-modal[role="dialog"][aria-modal="true"]').count(),1);
  await page.locator('.welcome-continue').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('close-modal')),true,'Tab wraps to dialog close control');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('welcome-continue')),true,'Shift+Tab wraps to last dialog action');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.modal-backdrop').count(),0,'Escape closes welcome dialog');
  const settings=page.locator('.prefs-toggle').first();
  await settings.focus();await page.keyboard.press('Enter');
  await page.locator('.settings-modal').waitFor();
  await page.waitForFunction(()=>document.activeElement?.classList.contains('close-modal'));
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent.trim()),'DONE','reverse Tab wraps inside the settings dialog');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('close-modal')),true,'Tab wraps to settings close control');
  await page.locator('.theme-choice[data-theme-id="aurora"]').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.theme-choice[data-theme-id="aurora"]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#theme-selection-status').innerText(),/Aurora/i);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.settings-modal').count(),0);
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset?.action),'settings','focus returns to opener');
  await context.close();
 }
 assert.deepEqual(errors,[],'no uncaught errors during modal keyboard interaction');
 console.log('PASS: modal focus cycling, focus restoration, keyboard theme activation and mobile/desktop widths.');
}finally{await browser.close();}
