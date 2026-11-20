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
  page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(12000);
  await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count()&&await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="speed-open"]').first().click();
  const prompt=page.locator('#speed-letters'),input=page.locator('#speed-input');
  const fileInput=page.locator('#speed-import-file');
  const panel=page.locator('#speed-practice-insights');
  assert.equal(await page.locator('[data-action="speed-import"]').count(),1,'restore control must exist');
  await input.fill('ke');
  await page.evaluate(()=>{
    window.__typingNode=document.getElementById('speed-input');
    window.__compassBefore=document.getElementById('speed-practice-insights');
    window.__compassStatusBefore=document.querySelector('.speed-insight-tip');
    window.__filePickerBefore=document.getElementById('speed-import-file');
    window.__importBefore=document.querySelector('[data-action="speed-import"]');
    window.__clearBefore=document.querySelector('[data-action="speed-clear"]');
  });
  const mode=mobile?'mobile-assisted':'standard-exact';
  const records=[
   {pack:'everyday',seconds:30,wpm:42,rawWpm:48,accuracy:96,
    correct:420,incorrect:17,characters:437,keystrokes:440,
    practiceMode:mode,keyboardAssisted:mobile,at:'2026-11-16T18:20:00.000Z',
    injectedHTML:'<script>alert("bad")</script>'},
   {pack:'everyday',seconds:30,wpm:500,accuracy:100,
    practiceMode:mobile?'mobile-exact':'mobile-assisted'},
   {pack:'numpad',seconds:30,wpm:15,cpm:145,accuracy:99,practiceMode:'standard-exact'},
  ];
  const fixture=JSON.stringify({format:'keystoria.speed.history',version:1,exportedAt:'2026-11-16T18:25:00.000Z',records,maxStoredResults:25});
  const select=async(text,name='keystoria-speed-results.json')=>fileInput.setInputFiles({
    name,mimeType:'application/json',buffer:Buffer.from(text)
  });

  // Files with invalid JSON and wrong schema never prompt for overwrite.
  await select('{not-json');
  await page.locator('#toast-layer').getByText(/not valid JSON/).waitFor();
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.action),'speed-import',
    'invalid file restores focus to the visible Restore Export button');
  assert.equal(await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1')),null);
  await select(JSON.stringify({format:'other',version:1,records}));
  await page.locator('#toast-layer').getByText(/Use a Keystoria Speed Lab/).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1')),null);
  await select(' '.repeat(131073));
  await page.locator('#toast-layer').getByText(/128 KB safety limit/).waitFor();

  // The file picker must enforce bytes, not JavaScript UTF-16 length.
  const unicodeOversize=JSON.stringify({
    format:'keystoria.speed.history',version:1,records,padding:'é'.repeat(70000)
  });
  assert.ok(unicodeOversize.length<131072);
  assert.ok(Buffer.byteLength(unicodeOversize,'utf8')>131072);
  await select(unicodeOversize);
  await page.locator('#toast-layer').getByText(/128 KB safety limit/).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1')),null);

  const cancelled=page.waitForEvent('dialog');
  const cancelUpload=select(fixture);
  const cancelDialog=await cancelled;
  assert.match(cancelDialog.message(),/Replace 0 saved/);
  await cancelDialog.dismiss();
  await cancelUpload;
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.action),'speed-import',
    'cancelled replacement restores focus to the visible restore button');
  assert.equal(await page.evaluate(()=>localStorage.getItem('panic.speed.results.v1')),null);

  const accepted=page.waitForEvent('dialog');
  const acceptUpload=select(fixture);
  const dialog=await accepted;
  assert.match(dialog.message(),/with 3 from this export/);
  await dialog.accept();
  await acceptUpload;
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('panic.speed.results.v1')||'[]').length===3);
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.action),'speed-import',
    'successful restore preserves keyboard navigation after rebuilding the panel');
  assert.equal(await panel.getAttribute('data-matches'),'1','mode-specific comparisons remain isolated');
  assert.deepEqual(await page.evaluate(()=>({
    panel:document.getElementById('speed-practice-insights')===window.__compassBefore,
    status:document.querySelector('.speed-insight-tip')===window.__compassStatusBefore,
    filePicker:document.getElementById('speed-import-file')===window.__filePickerBefore,
    importButton:document.querySelector('[data-action="speed-import"]')===window.__importBefore,
    clearButton:document.querySelector('[data-action="speed-clear"]')===window.__clearBefore,
  })),{panel:true,status:true,filePicker:true,importButton:true,clearButton:true},
   'restoring results must not reconstruct existing Practice Compass controls or live region');
  assert.equal(await input.inputValue(),'ke','restoring must not erase active typing');
  assert.equal(await page.evaluate(()=>document.getElementById('speed-input')===window.__typingNode),true,'restoring must not replace the input');
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('panic.speed.results.v1')));
  assert.equal(restored.length,3);
  assert.equal(restored[0].injectedHTML,undefined,'unexpected imported fields must be removed');
  assert.equal(restored[2].cpm,145);

  const [download]=await Promise.all([
   page.waitForEvent('download'),
   page.locator('[data-action="speed-export"]').click(),
  ]);
  const exported=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(exported.records.length,3);
  assert.equal(exported.records[0].injectedHTML,undefined);
  assert.equal(exported.format,'keystoria.speed.history');

  // Invalid replacements must leave existing data unchanged.
  await select(JSON.stringify({...exported,version:99}));
  await page.locator('#toast-layer').getByText(/Use a Keystoria Speed Lab/).waitFor();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('panic.speed.results.v1')).length),3);
  // The change event starts an async file reader. Seeing the toast is not proof
  // its finally-block has restored focus; wait for that work to finish before
  // moving focus to Clear, or a late restore can steal the next key press.
  await page.waitForFunction(()=>document.activeElement?.dataset.action==='speed-import');

  // Clearing history rebuilds the panel. Drive Enter on the actual control,
  // not the page-wide keyboard: pending focus restoration from a file picker
  // can otherwise redirect Enter and intermittently time out this release gate.
  const clearButton=page.locator('[data-action="speed-clear"]');
  await clearButton.focus();
  assert.equal(await clearButton.evaluate(el=>document.activeElement===el),true,
    'Clear Saved Results must be focusable before keyboard activation');
  const clearing=page.waitForEvent('dialog');
  const clearAction=clearButton.press('Enter');
  const clearDialog=await clearing;
  assert.match(clearDialog.message(),/Clear all saved Speed Lab results/);
  await clearDialog.accept();
  await clearAction;
  await page.waitForFunction(()=>localStorage.getItem('panic.speed.results.v1')===null);
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.action),'speed-clear',
    'clear action keeps focus on the original button');
  assert.equal(await page.evaluate(()=>document.activeElement===window.__clearBefore),true,
    'clear history does not replace its focused control');
  assert.equal(await page.evaluate(()=>document.querySelector('.speed-insight-tip')===window.__compassStatusBefore),true,
    'clear history updates the original screen-reader status');
  assert.equal(await input.inputValue(),'ke','clearing records must preserve ongoing typing');
  await context.close();
 }
 assert.deepEqual(errors,[],'file import must not cause unhandled browser errors');
 console.log('PASS: versioned Speed Lab history roundtrip, malicious field sanitization, invalid-file rejection, cancel/confirm, and typing continuity');
} finally { await browser.close(); }
