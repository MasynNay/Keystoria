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
  // A modal must isolate the background from screen readers, focus calls,
  // pointer interaction and the browser's natural Tab order. The skip link
  // and the browser-edition portfolio link are OUTSIDE #app.
  assert.equal(await page.locator('main#app-main').evaluate(el=>el.inert),true,
   'welcome modal makes underlying main inert');
  assert.equal(await page.locator('.skip-link').evaluate(el=>el.inert),true,
   'welcome modal makes external skip navigation inert');
  assert.equal(await page.locator('.browser-edition-note').evaluate(el=>el.inert),true,
   'welcome modal makes browser edition portfolio navigation inert');
  assert.deepEqual(await page.locator('#app > :not(.modal-backdrop)').evaluateAll(
   nodes=>nodes.map(el=>el.inert)),[true,true],
   'header and main are excluded from interaction while welcome is open');
  await page.locator('.skip-link').evaluate(el=>el.focus());
  assert.equal(await page.locator('.welcome-continue').evaluate(el=>document.activeElement===el),true,
   'programmatic focus cannot escape an open dialog through the skip link');
  await page.locator('main#app-main').evaluate(el=>el.focus());
  assert.equal(await page.locator('.welcome-continue').evaluate(el=>document.activeElement===el),true,
   'underlying main cannot steal focus from an open dialog');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('close-modal')),true,'Tab wraps to dialog close control');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('welcome-continue')),true,'Shift+Tab wraps to last dialog action');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.modal-backdrop').count(),0,'Escape closes welcome dialog');
  assert.equal(await page.locator('main#app-main').evaluate(el=>el.inert),false,
   'closing welcome restores the main landmark');
  assert.equal(await page.locator('.skip-link').evaluate(el=>el.inert),false,
   'closing welcome restores external skip navigation');
  assert.equal(await page.locator('.browser-edition-note').evaluate(el=>el.inert),false,
   'closing welcome restores the portfolio link');
  const settings=page.locator('.prefs-toggle').first();
  await settings.focus();await page.keyboard.press('Enter');
  await page.locator('.settings-modal').waitFor();
  assert.equal(await page.locator('main#app-main').evaluate(el=>el.inert),true,
   'settings modal isolates the main app');
  assert.equal(await page.locator('.skip-link').evaluate(el=>el.inert),true,
   'settings modal isolates skip navigation');
  assert.equal(await page.locator('.browser-edition-note').evaluate(el=>el.inert),true,
   'settings modal isolates browser-edition navigation');
  await page.waitForFunction(()=>document.activeElement?.classList.contains('close-modal'));
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent.trim()),'DONE','reverse Tab wraps inside the settings dialog');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('close-modal')),true,'Tab wraps to settings close control');
  await page.locator('.theme-choice[data-theme-id="aurora"]').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.theme-choice[data-theme-id="aurora"]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#theme-selection-status').innerText(),/Aurora/i);
  assert.equal(await page.locator('main#app-main').evaluate(el=>el.inert),true,
   'theme changes within a dialog never reactivate underlying content');
  // Every preference must update without detaching the button or closing the
  // dialog. Rebuilding it used to discard keyboard focus and scroll position.
  const optionClasses={largerType:'larger-type',highContrast:'high-contrast',reducedMotion:'reduce-motion'};
  for(const [key,bodyClass] of Object.entries(optionClasses)){
    const option=page.locator('[data-action="setting"][data-setting="'+key+'"]');
    await option.focus();
    await option.evaluate(el=>{
      window.__optionBefore=el;
      window.__settingsBefore=el.closest('.settings-modal');
      // A long settings dialog is scrollable on small screens.
      if(window.__settingsBefore.scrollHeight>window.__settingsBefore.clientHeight)
        window.__settingsBefore.scrollTop=40;
    });
    const scrollBefore=await page.locator('.settings-modal').evaluate(el=>el.scrollTop);
    await page.keyboard.press('Enter');
    assert.equal(await option.getAttribute('aria-pressed'),'true',key+' is activated with Enter');
    assert.equal(await option.evaluate(el=>el===window.__optionBefore),true,key+' retains its original DOM node');
    assert.equal(await option.evaluate(el=>document.activeElement===el),true,key+' retains keyboard focus');
    assert.equal(await page.locator('.settings-modal').evaluate(el=>el===window.__settingsBefore),true,key+' keeps the modal mounted');
    assert.equal(await option.locator('.setting-switch').evaluate(el=>el.classList.contains('on')),true,key+' updates the visible switch');
    assert.equal(await page.locator('body').evaluate((el,cls)=>el.classList.contains(cls),bodyClass),true,key+' applies the preference immediately');
    if(scrollBefore>0)assert.ok(await page.locator('.settings-modal').evaluate(el=>el.scrollTop)>0,key+' keeps settings scrolled');
    assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem('panic.preferences.v1'))[k],key),true,key+' is saved');
  }
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.settings-modal').count(),0);
  assert.equal(await page.locator('main#app-main').evaluate(el=>el.inert),false,
   'closing settings restores main content');
  assert.equal(await page.locator('.skip-link').evaluate(el=>el.inert),false,
   'closing settings restores the skip link');
  assert.equal(await page.locator('.browser-edition-note').evaluate(el=>el.inert),false,
   'closing settings restores portfolio navigation');
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset?.action),'settings','focus returns to opener');
  // Reopened dialogs must isolate the same background, without leaving a
  // stale inert flag on the app after the second dismissal.
  await page.locator('.prefs-toggle').first().click();
  await page.locator('.settings-modal').waitFor();
  assert.equal(await page.locator('main#app-main').evaluate(el=>el.inert),true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('main#app-main').evaluate(el=>el.inert),false);
  await context.close();
 }
 assert.deepEqual(errors,[],'no uncaught errors during modal keyboard interaction');
 console.log('PASS: modal focus cycling, theme switching and in-place accessibility preferences at mobile/desktop widths.');
}finally{await browser.close();}
