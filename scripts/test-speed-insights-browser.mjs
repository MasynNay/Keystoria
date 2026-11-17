import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try {
 for(const width of [390,1440]){
  const mobile=width<800;
  const context=await browser.newContext({viewport:{width,height:844},isMobile:mobile,hasTouch:mobile,acceptDownloads:true});
  const page=await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count()&&await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="speed-open"]').first().click();
  const insight=page.locator('#speed-practice-insights');
  const input=page.locator('#speed-input');
  assert.equal(await insight.getAttribute('data-matches'),'0','new visitors have no comparable progress yet');
  assert.match(await insight.innerText(),/Finish a run/);
  await page.evaluate(()=>{
    window.__speedInputNode=document.getElementById('speed-input');
    window.__compassBefore=document.getElementById('speed-practice-insights');
    window.__goal90Before=document.querySelector('[data-action="speed-goal"][data-goal="90"]');
    window.__statusBefore=document.querySelector('.speed-insight-tip');
    window.__pickerBefore=document.getElementById('speed-import-file');
    window.__clearBefore=document.querySelector('[data-action="speed-clear"]');
  });
  assert.equal(await insight.locator('.speed-insight-tip').getAttribute('aria-live'),'polite');
  assert.equal(await insight.locator('.speed-insight-tip').getAttribute('aria-atomic'),'true');
  await input.fill('a');
  await page.locator('[data-action="speed-goal"][data-goal="90"]').click();
  assert.equal(await input.inputValue(),'a','goal change must not clear an active session');
  assert.equal(await page.evaluate(()=>document.getElementById('speed-input')===window.__speedInputNode),true,'goal change must not replace focused input');
  assert.equal(await insight.locator('[data-goal="90"]').getAttribute('aria-pressed'),'true');
  assert.deepEqual(await page.evaluate(()=>({
    panel:document.getElementById('speed-practice-insights')===window.__compassBefore,
    goalButton:document.querySelector('[data-action="speed-goal"][data-goal="90"]')===window.__goal90Before,
    liveStatus:document.querySelector('.speed-insight-tip')===window.__statusBefore,
    filePicker:document.getElementById('speed-import-file')===window.__pickerBefore,
    clearButton:document.querySelector('[data-action="speed-clear"]')===window.__clearBefore,
    focused:document.activeElement===window.__goal90Before,
  })),{panel:true,goalButton:true,liveStatus:true,filePicker:true,clearButton:true,focused:true},
   'updating a practice goal must preserve all focusable controls and the live region');
  assert.match(await insight.locator('.speed-insight-tip').innerText(),/Accuracy goal 90%:/);
  const reference=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
  await input.fill(reference);
  await page.locator('#speed-results-heading').waitFor();
  assert.equal(await insight.getAttribute('data-matches'),'1','saved run appears as a comparable insight');
  assert.match(await insight.innerText(),/AVERAGE ACCURACY/);

  const oneRun=insight.locator('.speed-insight-trail li');
  assert.equal(await oneRun.count(),1,'first comparable run appears in the progress trail');
  assert.match(await oneRun.first().innerText(),/WPM/);
  assert.equal(await insight.locator('.speed-insight-trend').count(),1);

  // Exercise the ordinary on-device saved-record path. The trail is bounded
  // and chronologically ordered without detaching the practice textarea.
  await page.locator('[data-action="speed-restart"]').click();
  await page.evaluate((mode)=>{
    localStorage.setItem('panic.speed.results.v1',JSON.stringify([
      {pack:'everyday',seconds:30,practiceMode:mode,wpm:50,accuracy:97},
      {pack:'everyday',seconds:30,practiceMode:mode,wpm:40,accuracy:96},
      {pack:'everyday',seconds:30,practiceMode:mode,wpm:30,accuracy:95},
      {pack:'everyday',seconds:30,practiceMode:mode,wpm:20,accuracy:90},
      {pack:'everyday',seconds:30,practiceMode:mode,wpm:10,accuracy:99},
      {pack:'numpad',seconds:30,practiceMode:'standard-exact',wpm:900,cpm:900,accuracy:100},
    ]));
    window.__speedInputNode=document.getElementById('speed-input');
  },mobile?'mobile-assisted':'standard-exact');
  await page.locator('[data-action="speed-goal"][data-goal="95"]').click();
  assert.equal(await insight.getAttribute('data-matches'),'5');
  assert.deepEqual((await insight.locator('.speed-insight-bar-label').allTextContents()).map(x=>x.trim()),[
    '10 WPM','20 WPM','30 WPM','40 WPM','50 WPM'
  ]);
  assert.match(await insight.locator('.speed-insight-trend').innerText(),/\+10 WPM/);
  assert.match(await insight.locator('.speed-insight-trend').innerText(),/3 consecutive runs/);
  assert.equal(await page.evaluate(()=>document.getElementById('speed-input')===window.__speedInputNode),true,
   'changing the goal preserves the original practice textarea');
  await page.locator('[data-action="speed-goal"][data-goal="98"]').click();
  assert.match(await insight.locator('.speed-insight-trend').innerText(),/0 consecutive runs/,
   'streak recalculates when accuracy goal increases');
  assert.match(await insight.locator('.speed-insight-tip').innerText(),/Accuracy goal 98%:/,
   'a goal change updates the existing polite screen-reader announcement');
  assert.equal(await insight.locator('.speed-insight-trail li').count(),5,'a long history uses at most five bars');
  const horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(horizontalOverflow<=2,'progress trail must not cause horizontal overflow: '+horizontalOverflow);

  // Export is an intentional user gesture; verify the file is valid JSON,
  // without making network requests or sending the saved record elsewhere.
  const [download]=await Promise.all([
   page.waitForEvent('download'),
   page.locator('[data-action="speed-export"]').click(),
  ]);
  assert.equal(download.suggestedFilename(),'keystoria-speed-results.json');
  const exportData=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(exportData.format,'keystoria.speed.history');
  assert.equal(exportData.records.length,6);
  assert.equal(exportData.records[0].pack,'everyday');

  // Clearing needs explicit confirmation; cancelling must retain the score.
  await page.evaluate(()=>{
    window.__compassBeforeClear=document.getElementById('speed-practice-insights');
    window.__statusBeforeClear=document.querySelector('.speed-insight-tip');
    window.__clearBeforeClear=document.querySelector('[data-action="speed-clear"]');
    window.__pickerBeforeClear=document.getElementById('speed-import-file');
  });
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('[data-action="speed-clear"]').click();
  assert.equal(await insight.getAttribute('data-matches'),'5');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('[data-action="speed-clear"]').click();
  assert.equal(await insight.getAttribute('data-matches'),'0');
  assert.equal(await insight.locator('.speed-insight-trail').count(),0,'clearing removes the stale trend');
  assert.deepEqual(await page.evaluate(()=>({
    panel:document.getElementById('speed-practice-insights')===window.__compassBeforeClear,
    liveStatus:document.querySelector('.speed-insight-tip')===window.__statusBeforeClear,
    clear:document.querySelector('[data-action="speed-clear"]')===window.__clearBeforeClear,
    picker:document.getElementById('speed-import-file')===window.__pickerBeforeClear,
    focused:document.activeElement===window.__clearBeforeClear,
  })),{panel:true,liveStatus:true,clear:true,picker:true,focused:true},
   'clearing history changes summary in place and preserves the focusable clear control');
  assert.equal(await page.evaluate(()=>document.getElementById('speed-practice-insights')===window.__compassBefore),false,
   'a completed run and restart legitimately remount the session view');
  assert.equal(await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1')),null);
  assert.equal(await page.locator('#speed-history-panel .speed-empty').count(),1);

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcomeAgain=page.locator('.welcome-continue');
  if(await welcomeAgain.count()&&await welcomeAgain.isVisible())await welcomeAgain.click();
  await page.locator('[data-action="speed-open"]').first().click();
  assert.equal(await page.locator('[data-action="speed-goal"][data-goal="98"]').getAttribute('aria-pressed'),'true','accuracy goal persists independently of result history');
  assert.equal(await page.locator('#speed-practice-insights').getAttribute('data-matches'),'0');
  await context.close();
 }
 assert.deepEqual(errors,[],'practice progress browser actions must be error-free');
 console.log('PASS: private practice insights, accuracy goal, JSON export, confirmed clear, and active typing continuity on phone/desktop viewports');
}finally{await browser.close();}
