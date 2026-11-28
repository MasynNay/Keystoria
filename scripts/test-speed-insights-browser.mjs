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
  const week=insight.locator('.speed-week-activity');
  assert.equal(await week.getAttribute('data-active-days'),'0');
  assert.equal(await week.getAttribute('data-saved-runs'),'0');
  assert.equal(await week.locator('li').count(),7,'activity always contains seven local days');
  assert.match(await week.innerText(),/newest 25 saved results/i);
  assert.match(await insight.innerText(),/Finish a run/);
  assert.match(await insight.locator('.speed-insight-next strong').innerText(),/Complete your first timed run/,
   'new players get a useful first-run suggestion without inventing a prior score');
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
  const review=page.locator('#speed-key-review');
  assert.equal(await review.getAttribute('data-error-count'),'0');
  assert.match(await review.innerText(),/No mistakes remain/);
  assert.equal(await review.locator('li').count(),0);
  assert.equal(await page.locator('[data-action="speed-targeted"]').count(),0,'perfect run has no invented focus keys');
  assert.equal(await week.getAttribute('data-active-days'),'1','a finished run counts once today');
  assert.equal(await week.getAttribute('data-saved-runs'),'1');
  assert.equal(await week.locator('li').last().getAttribute('data-runs'),'1');
  assert.match(await insight.innerText(),/RECENT AVERAGE ACCURACY/);
  assert.match(await insight.locator('.speed-insight-qualified').innerText(),/BEST AT 90%/);
  assert.match(await insight.locator('.speed-insight-qualified strong').innerText(),/\d+ WPM/,
    'a fully accurate run creates an accuracy-qualified best');

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
      {pack:'everyday',seconds:30,practiceMode:mode,wpm:88,accuracy:96},
      {pack:'numpad',seconds:30,practiceMode:'standard-exact',wpm:900,cpm:900,accuracy:100},
    ].map((run,i)=>{
      const today=new Date();
      const offset=[0,0,1,3,6,8,6][i];
      // Today may be before noon in CI. A future noon timestamp must
      // correctly be ignored by the app, so use the actual current time.
      const date=offset===0?today:new Date(today.getFullYear(),today.getMonth(),
       today.getDate()-offset,12);
      return {...run,at:date.toISOString()};
    })));
    window.__speedInputNode=document.getElementById('speed-input');
  },mobile?'mobile-assisted':'standard-exact');
  await page.locator('[data-action="speed-goal"][data-goal="95"]').click();
  assert.equal(await insight.getAttribute('data-matches'),'5');
  assert.equal(await week.getAttribute('data-active-days'),'4',
    'all saved Speed Lab modes count toward device-local activity');
  assert.equal(await week.getAttribute('data-saved-runs'),'6',
    'the dated run from eight days ago is outside the rolling seven days');
  assert.deepEqual(await week.locator('li').evaluateAll(items=>
    items.map(item=>Number(item.dataset.runs))),[2,0,0,1,0,1,2]);
  assert.match(await week.innerText(),/not a speed comparison/i);
  assert.deepEqual((await insight.locator('.speed-insight-bar-label').allTextContents()).map(x=>x.trim()),[
    '10 WPM','20 WPM','30 WPM','40 WPM','50 WPM'
  ]);
  assert.match(await insight.locator('.speed-insight-trend').innerText(),/\+10 WPM/);
  assert.match(await insight.locator('.speed-insight-stats').innerText(),/BEST IN LAST 5/);
  assert.match(await insight.locator('.speed-insight-qualified strong').innerText(),/88 WPM/,
    'qualified best includes older saved results, not just the trend');
  assert.match(await insight.locator('.speed-insight-qualified').innerText(),/6 comparable saved runs/);
  assert.match(await insight.locator('.speed-insight-next strong').innerText(),/Try 52 WPM at 95%\+ accuracy/,
   'next target follows latest matching run (50 WPM), not an older qualified best (88 WPM)');
  assert.match(await insight.locator('.speed-insight-next p').innerText(),/not a record to beat/);
  assert.match(await insight.locator('.speed-insight-trend').innerText(),/3 consecutive runs/);
  assert.equal(await page.evaluate(()=>document.getElementById('speed-input')===window.__speedInputNode),true,
   'changing the goal preserves the original practice textarea');
  await page.locator('[data-action="speed-goal"][data-goal="98"]').click();
  assert.match(await insight.locator('.speed-insight-trend').innerText(),/0 consecutive runs/,
   'streak recalculates when accuracy goal increases');
  assert.match(await insight.locator('.speed-insight-qualified strong').innerText(),/10 WPM/,
    'raising the goal recalculates the qualified best without modifying history');
  assert.match(await insight.locator('.speed-insight-next strong').innerText(),/Reach 98%\+ accuracy/,
   'latest saved run below new accuracy goal switches suggestion from speed to precision');
  assert.match(await insight.locator('.speed-insight-tip').innerText(),/Next session: Reach 98%\+ accuracy/,
   'existing polite live status announces an updated target after a goal change');
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
  assert.equal(exportData.records.length,7);
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
  assert.equal(await week.getAttribute('data-active-days'),'0',
    'clearing saved records removes activity in place');
  assert.equal(await week.getAttribute('data-saved-runs'),'0');
  assert.deepEqual(await week.locator('li').evaluateAll(items=>
    items.map(item=>Number(item.dataset.runs))),Array(7).fill(0));
  assert.match(await insight.locator('.speed-insight-qualified').innerText(),/No matching saved run reached this goal/);
  assert.match(await insight.locator('.speed-insight-next strong').innerText(),/Complete your first timed run/,
   'clearing local records resets the next-session suggestion');
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
  assert.match(await page.locator('.speed-insight-next strong').innerText(),/Complete your first timed run/,
   'no stored results after reload means no invented progress target');
  // Older exports may have the keyboardAssisted flag but no practiceMode.
  // Recent results and the Compass must agree about their assisted status.
  await page.evaluate(()=>{
    localStorage.setItem('panic.speed.results.v1',JSON.stringify([
      {pack:'everyday',seconds:30,wpm:31,accuracy:96,keyboardAssisted:true},
      {pack:'everyday',seconds:30,wpm:37,accuracy:97,practiceMode:'mobile-assisted'},
      {pack:'everyday',seconds:30,wpm:44,accuracy:98,practiceMode:'mobile-exact'},
      {pack:'everyday',seconds:30,wpm:51,accuracy:99,practiceMode:'standard-exact'},
    ]));
  });
  // Compact phone layouts and desktop both render a Restart control.
  // Target the currently visible button rather than an ambiguous pair.
  await page.locator('[data-action="speed-restart"]:visible').first().click();
  const labels=await page.locator('#speed-history-panel .speed-history > div b').allTextContents();
  assert.equal(labels.length,4);
  for(const [index,expected] of ['PHONE ASSISTED','PHONE ASSISTED','PHONE EXACT','DESKTOP EXACT'].entries())
    assert.match(labels[index],new RegExp(expected),
      'saved result '+index+' must have a faithful mode label');
  assert.equal(await page.locator('#speed-practice-insights').getAttribute('data-matches'),mobile?'2':'1',
    'legacy assisted and exact sessions must not cross-contaminate comparison scopes');
  assert.equal(await page.locator('#speed-input').inputValue(),'',
    'mode label refresh must not change the new typing field');
  // Test remaining mistakes in text and numeric drills, without persisting
  // any detailed key breakdown, native draft, or target passage.
  for(const pack of ['everyday','numpad']){
   if(pack==='numpad')await page.locator('[data-action="speed-pack"][data-pack="numpad"]').click();
   assert.equal(await review.count(),0,'no recap during active typing');
   const full=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
   // Pick a repeated character rather than relying on the random first word.
   const candidates=[...new Set(full.match(pack==='numpad'?/[0-9]/g:/[A-Za-z]/g))];
   const key=candidates.find(ch=>full.split(ch).length>=3);
   assert.ok(key,'the long drill contains a repeated target character');
   const positions=[];for(let i=0;i<full.length;i++)if(full[i]===key)positions.push(i);
   assert.ok(positions.length>=2);
   const draft=full.split('');
   const wrong=pack==='numpad'?(key==='9'?'8':'9'):'!';
   draft[positions[0]]=wrong;draft[positions[1]]=wrong;
   draft[full.indexOf(' ')]=pack==='numpad'?'7':'!';
   await page.locator('#speed-input').fill(draft.join(''));
   await page.locator('#speed-results-heading').waitFor();
   assert.equal(await review.getAttribute('data-error-count'),'3');
   const rows=await review.locator('li').evaluateAll(items=>items.map(el=>({key:el.dataset.key,text:el.textContent})));
   assert.equal(rows.length,2);
   assert.equal(rows[0].key,key);
   assert.match(rows[0].text,new RegExp('2 of '+positions.length+' positions missed'));
   assert.equal(rows[1].key,' ');
   assert.match(rows[1].text,/Space/);
   assert.match(await review.innerText(),/Corrected mistakes and untyped characters are not counted/);
   assert.match(await review.innerText(),/not saved or exported/);
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('panic.speed.results.v1')||'[]'));
   assert.ok(saved.length>0);
   assert.equal(saved[0].incorrect,3);
   assert.equal(saved[0].keyReview,undefined);
   assert.equal(saved[0].reference,undefined);
   assert.equal(saved[0].typed,undefined);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=2);

   // Start the follow-up using the completed review, then exercise actual
   // targeted typing, unchanged scoring, private history, retry and exit.
   const storageBefore=await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1'));
   await page.locator('[data-action="speed-targeted"]').click();
   const banner=page.locator('#speed-targeted-banner');
   assert.match(await banner.innerText(),/TARGETED PRACTICE · NOT SAVED/);
   assert.match(await banner.innerText(),/Space/);
   assert.equal(await review.count(),0);
   const focusReference=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
   const tokens=focusReference.split(' ');
   assert.ok(tokens.length>=100);
   assert.ok(tokens.every((word,i)=>i%2===0?word.includes(key):word.length<= (pack==='numpad'?3:4)),
    'alternating focus keys and short space tokens appear in the generated passage');
   assert.equal(await page.locator('#speed-input').getAttribute('inputmode'),pack==='numpad'?'numeric':'text');
   await page.locator('#speed-input').fill(focusReference);
   await page.locator('#speed-results-heading').waitFor();
   assert.match(await page.locator('.speed-assist-result-label').innerText(),/TARGETED PRACTICE \(NOT SAVED\)/);
   assert.equal(await page.locator('#speed-accuracy').innerText(),'100%');
   assert.equal(await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1')),storageBefore,
    'even a perfect targeted drill never alters regular score history');
   assert.equal(await page.locator('[data-action="speed-targeted"]').count(),0);
   assert.equal(await page.locator('[data-action="speed-guided"]').count(),0);
   const comparison=page.locator('#speed-focus-comparison');
   assert.equal(await comparison.getAttribute('data-comparison'),'first');
   assert.equal(await comparison.locator('li').count(),2);
   assert.ok((await comparison.locator('li strong').allTextContents()).every(x=>x==='100%'));
   await page.locator('[data-action="speed-restart"]').first().click();
   assert.equal(await banner.count(),1,'Test Again keeps targeted drill mode');
   assert.equal(await review.count(),0);
   assert.equal(await comparison.count(),0,'comparison is absent while typing');
   const repeat=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
   await page.locator('#speed-input').fill(repeat.split('').map(ch=>ch===key?wrong:ch).join(''));
   await page.locator('#speed-results-heading').waitFor();
   assert.equal(await comparison.getAttribute('data-comparison'),'matched');
   const keyRows=await comparison.locator('li').evaluateAll(items=>items.map(el=>({
    key:el.dataset.key,rate:el.querySelector('strong').textContent,delta:el.querySelector('[data-delta]')?.dataset.delta
   })));
   assert.deepEqual(keyRows,[{key,rate:'0%',delta:'-100'},{key:' ',rate:'100%',delta:'0'}]);
   assert.equal(await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1')),storageBefore);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=2);
   // Retry again; improvement is relative to the last attempt, not a saved best.
   await page.locator('[data-action="speed-restart"]').first().click();
   const recovery=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
   await page.locator('#speed-input').fill(recovery);
   await page.locator('#speed-results-heading').waitFor();
   assert.equal(await comparison.getAttribute('data-comparison'),'matched');
   assert.equal(await comparison.locator('[data-delta="100"]').count(),1);
   await page.locator('[data-action="speed-duration"][data-seconds="15"]').click();
   assert.equal(await banner.count(),1,'duration changes keep focused mode');
   const shorter=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
   await page.locator('#speed-input').fill(shorter);
   await page.locator('#speed-results-heading').waitFor();
   assert.equal(await comparison.getAttribute('data-comparison'),'first','duration change resets the comparison');
   await page.locator('[data-action="speed-regular"]').click();
   assert.equal(await banner.count(),0,'explicit return restores regular drills');
   assert.equal(await page.locator('#speed-time').innerText(),'15');
   assert.equal(await page.locator('#speed-input').inputValue(),'');
   assert.equal(await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1')),storageBefore);
   await page.locator('[data-action="speed-duration"][data-seconds="30"]').click();
   // Opt into a guided routine after an ordinary missed-key result.
   const regular=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
   const focusKey=regular.match(pack==='numpad'?/[0-9]/:/[A-Za-z]/)[0];
   const wrongKey=pack==='numpad'?(focusKey==='9'?'8':'9'):'!';
   await page.locator('#speed-input').fill(regular.split('').map(ch=>ch===focusKey?wrongKey:ch).join(''));
   await page.locator('#speed-results-heading').waitFor();
   const savedBeforeRoutine=await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1'));
   await page.locator('[data-action="speed-guided"]').click();
   const routine=page.locator('#speed-focus-routine');
   assert.equal(await routine.getAttribute('data-streak'),'0');
   assert.equal(await routine.getAttribute('data-routine-status'),'ready');
   assert.match(await routine.innerText(),/Goal: 98% or higher/);
   await page.locator('[data-action="speed-goal"][data-goal="90"]').click();
   assert.match(await routine.innerText(),/Goal: 98% or higher/,'goal changes do not silently alter an active routine');
   await page.locator('[data-action="speed-goal"][data-goal="98"]').click();
   const attempt=async(correct)=>{
    const passage=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
    await page.locator('#speed-input').fill(correct?passage:passage.split('').map(ch=>ch===focusKey?wrongKey:ch).join(''));
    await page.locator('#speed-results-heading').waitFor();
   };
   await attempt(true);
   assert.equal(await routine.getAttribute('data-streak'),'1');
   assert.equal(await routine.getAttribute('data-routine-status'),'qualified');
   await page.locator('[data-action="speed-restart"]').first().click();
   await attempt(false);
   assert.equal(await routine.getAttribute('data-streak'),'0');
   assert.equal(await routine.getAttribute('data-routine-status'),'below-goal');
   for(const expected of ['1','2']){
    await page.locator('[data-action="speed-restart"]').first().click();
    await attempt(true);
    assert.equal(await routine.getAttribute('data-streak'),expected);
   }
   assert.equal(await routine.getAttribute('data-routine-status'),'complete');
   assert.match(await routine.innerText(),/ROUTINE COMPLETE/);
   assert.equal(await routine.locator('progress').getAttribute('value'),'2');
   assert.equal(await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1')),savedBeforeRoutine);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=2);
   await page.locator('[data-action="speed-duration"][data-seconds="15"]').click();
   assert.equal(await routine.count(),0,'duration change ends the guided routine');
   assert.equal(await banner.count(),1,'targeted free practice remains available');
   await page.locator('[data-action="speed-regular"]').click();
   assert.equal(await banner.count(),0);
   assert.equal(await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1')),savedBeforeRoutine);
   await page.locator('[data-action="speed-duration"][data-seconds="30"]').click();
  }
  await context.close();
 }
 assert.deepEqual(errors,[],'practice progress browser actions must be error-free');
 console.log('PASS: private practice insights, accuracy goal, JSON export, confirmed clear, and active typing continuity on phone/desktop viewports');
}finally{await browser.close();}
