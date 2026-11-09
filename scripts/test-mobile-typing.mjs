import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const base='http://127.0.0.1:8765/play/';
async function launch(width){
 const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<800,hasTouch:width<800,reducedMotion:'reduce'});
 const page=await ctx.newPage(); page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.locator('#app .brand-name').waitFor();
 if(await page.locator('.welcome-continue').isVisible())await page.locator('.welcome-continue').click();
 return {page,ctx};
}
async function homeFromModal(page){
 if(await page.locator('.welcome-continue').count() && await page.locator('.welcome-continue').isVisible())await page.locator('.welcome-continue').click();
}
try{
 for(const width of [320,390,1440]){
  const {page,ctx}=await launch(width);
  const isPhone=width<800;
  await page.locator('[data-action="speed-open"]').first().click();
  await page.locator('#speed-input').waitFor();
  assert.equal(await page.locator('.mobile-speed-cue').isVisible(),isPhone,'speed cue visible only on phones');
  const input=page.locator('#speed-input');
  await input.focus();
  if(isPhone)assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('mobile-typing-active')),true);
  const next=await page.locator('#speed-mobile-first').textContent();
  assert.ok(next?.length===1 || next==='␣','a next character must be visible');
  await input.fill('abc');
  if(isPhone){
   assert.ok((await page.locator('#speed-mobile-first').textContent())!==null);
   await page.locator('.speed-mobile-entry [data-action="speed-space"]').click();
   assert.equal(await input.inputValue(),'abc ','space control must add exactly one space');
   await page.locator('.speed-mobile-entry [data-action="speed-restart"]').click();
   assert.equal(await page.locator('#speed-input').inputValue(),'');
  } else {
   assert.equal(await page.locator('.mobile-entry-actions').first().isVisible(),false);
  }
  await page.locator('[data-action="speed-home"]').first().click();
  await homeFromModal(page);
  await page.locator('[data-action="lyric-open"]').first().click();
  await page.locator('[data-action="lyric-demo"]').click();
  await page.locator('#lyric-input').waitFor();
  assert.equal(await page.locator('.mobile-lyric-word').isVisible(),isPhone);
  if(isPhone){
   await page.locator('[data-action="lyric-mobile-toggle"]').click();
   await page.locator('#lyric-input').fill('Signals');
   await page.locator('[data-action="lyric-mobile-submit"]').click();
   assert.equal(await page.locator('#lyric-input').inputValue(),'');
   assert.ok((await page.locator('#lyric-progress').innerText()).startsWith('1/'));
   await page.locator('.lyric-mobile-entry [data-action="lyric-skip"]').click();
   assert.ok(Number((await page.locator('#lyric-progress').innerText()).split('/')[0])>1);
  }else{
   await page.locator('#lyric-input').evaluate(el=>el.focus());
  }
  await page.locator('[data-action="lyric-back"]').first().click();
  await page.locator('[data-action="lyric-home"]').first().click();
  await homeFromModal(page);
  await page.locator('[data-action="learn"][data-os="linux"]').click();
  await page.locator('#lesson-input').waitFor();
  assert.equal(await page.locator('.mobile-academy-target').isVisible(),isPhone);
  const target=await page.locator('#lesson-target-text').textContent();
  assert.equal(await page.locator('#lesson-mobile-target').textContent(),target);
  await page.locator('#lesson-input').fill(target);
  if(isPhone)await page.locator('.academy-mobile-entry [data-action="training-submit"]').click();
  else await page.locator('[data-action="training-submit"]').first().click();
  assert.match(await page.locator('#training-feedback').innerText(),/COMMAND RECOGNIZED/);
  if(isPhone){
   await page.locator('.academy-mobile-entry [data-action="training-next"]').click();
   assert.ok((await page.locator('.terminal-bar').innerText()).includes('STEP 02'));
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,'no horizontal overflow at width '+width+': '+overflow);
  await ctx.close();
 }
 assert.deepEqual(errors,[],'no JavaScript errors during mobile/desktop practice');
 console.log('PASS: Speed/Lyric/Academy mobile input, next-key feedback, touch actions, and desktop compatibility');
}finally{await browser.close();}
