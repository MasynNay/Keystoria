import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Regression scope: keyboard landmarks, score announcements and motion controls.
// Physical mobile keyboards and assistive technology still need human verification.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const origin='http://127.0.0.1:8765/play/?demo=1';
try{
 for(const width of [320,390,1440]){
  const context=await browser.newContext({
   viewport:{width,height:844},isMobile:width<800,hasTouch:width<800,reducedMotion:'reduce'
  });
  const page=await context.newPage();
  page.setDefaultTimeout(8000);
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.locator('#app .brand-name').waitFor();
  await page.locator('main#app-main[tabindex="-1"]').waitFor();
  assert.equal(await page.locator('.skip-link').count(),1,'one skip link per page');
  assert.equal(await page.locator('.skip-link').getAttribute('href'),'#app-main');
  // The skip link is hidden visually until focused, and can move keyboard
  // focus straight into the changing main practice content.
  const hidden=await page.locator('.skip-link').evaluate(el=>el.getBoundingClientRect().bottom<=0);
  assert.equal(hidden,true,'skip link is out of view when unfocused');
  await page.locator('.skip-link').focus();
  const visible=await page.locator('.skip-link').evaluate(el=>el.getBoundingClientRect().top>=0);
  assert.equal(visible,true,'skip link is visible on keyboard focus');
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.activeElement?.id==='app-main');
  const contrast=await page.locator('.skip-link').evaluate(el=>{
   function rgb(s){return (s.match(/[\d.]+/g)||[]).slice(0,3).map(Number);}
   function luminance(s){
    const parts=rgb(s).map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});
    return parts[0]*.2126+parts[1]*.7152+parts[2]*.0722;
   }
   const c=getComputedStyle(el),a=luminance(c.color),b=luminance(c.backgroundColor);
   return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });
  assert.ok(contrast>=7,'skip-link contrast must exceed enhanced text threshold: '+contrast);
  const motion=await page.locator('.live-pulse').evaluate(el=>getComputedStyle(el).animationDuration);
  assert.ok(parseFloat(motion)<.002,'system reduced-motion preference must stop continuous pulsing: '+motion);

  await page.locator('[data-action="speed-open"]').first().click();
  assert.equal(await page.locator('main#app-main').count(),1,'Speed Lab main landmark');
  const text=await page.locator('#speed-letters').evaluate(el=>el.dataset.fullReference||el.textContent);
  assert.ok(text.length>30,'a real timed Speed Lab prompt is available');
  await page.locator('#speed-input').fill(text);
  await page.locator('#speed-results-heading').waitFor();
  await page.waitForFunction(()=>document.activeElement?.id==='speed-results-heading');
  assert.equal(await page.locator('.speed-results[role="status"][aria-live="polite"]').count(),1,'results announced as status');
  await page.locator('[data-action="speed-home"]').first().click();
  const welcome=page.locator('.welcome-continue');
  if(await welcome.count()&&await welcome.isVisible())await welcome.click();
  await page.locator('[data-action="learn"][data-os="linux"]').click();
  assert.equal(await page.locator('main#app-main').count(),1,'Field Academy main landmark');
  assert.equal(await page.locator('#training-feedback[role="status"]').count(),1,'Academy has accessible submission feedback');
  await context.close();
 }

 // Reflow regression: narrow desktop CSS viewports approximate the layout space
 // available at 200% and 400% browser zoom on a 1280px-wide desktop.
 // This does NOT emulate browser text zoom or certify WCAG 1.4.10.
 async function assertReflow(page,selector,mode,width){
  const box=await page.locator(selector).first().evaluate(el=>{
   const r=el.getBoundingClientRect();
   return {left:r.left,right:r.right,width:r.width,
    viewport:document.documentElement.clientWidth,
    documentWidth:document.documentElement.scrollWidth};
  });
  assert.ok(box.width>0&&box.left>=-2&&box.right<=box.viewport+2,
   mode+' control '+selector+' must fit '+width+'px zoom-equivalent view: '+JSON.stringify(box));
  assert.ok(box.documentWidth<=box.viewport+2,
   mode+' must not require horizontal page scrolling at '+width+'px: '+JSON.stringify(box));
 }
 for(const width of [640,320]){
  const context=await browser.newContext({viewport:{width,height:800},isMobile:false,hasTouch:false});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.locator('[data-action="speed-open"]').first().click();
  const input=page.locator('#speed-input');
  await input.focus();
  // Exercise real keyboard input, not only programmatic focus. A narrow
  // desktop viewport must keep the field editable after the first keystroke.
  await page.keyboard.type('a');
  assert.equal(await input.inputValue(),'a',
   'Speed Lab accepts keyboard input at narrow desktop width '+width);
  assert.equal(await input.evaluate(el=>document.activeElement===el),true,
   'Speed Lab input retains keyboard focus at narrow desktop width '+width);
  const bounds=await input.evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,viewport:document.documentElement.clientWidth}));
  assert.ok(bounds.left>=-1&&bounds.right<=bounds.viewport+1,
   'Speed Lab input stays within narrow desktop viewport '+width+': '+JSON.stringify(bounds));
  await assertReflow(page,'#speed-input','Speed Lab',width);
  await assertReflow(page,'.speed-mobile-entry [data-action="speed-space"]','Speed Lab touch separator',width);
  assert.equal(await page.locator('#speed-assist-toggle').isVisible(),false,
   'zoom-narrowed desktop must not present an inoperative phone keyboard toggle');

  // Exercise the playable lyric demo, not just its homepage layout. Word and
  // touch-submit controls must be horizontally reachable without page panning.
  await page.locator('[data-action="speed-home"]').first().click();
  if(await page.locator('.welcome-continue').isVisible())await page.locator('.welcome-continue').click();
  await page.locator('[data-action="lyric-open"]').first().click();
  await page.locator('[data-action="lyric-demo"]').click();
  await page.locator('#lyric-input').waitFor();
  await page.locator('[data-action="lyric-mobile-toggle"]').click();
  await page.waitForFunction(()=>!document.querySelector('#lyric-input')?.disabled);
  const lyric=page.locator('#lyric-input');
  await lyric.focus();
  await page.keyboard.type('S');
  assert.equal(await lyric.inputValue(),'S','Lyric typing remains editable at '+width+'px');
  await assertReflow(page,'#lyric-input','Lyric Lab',width);
  await assertReflow(page,'.lyric-mobile-entry [data-action="lyric-mobile-submit"]','Lyric Lab word submission',width);
  await page.locator('[data-action="lyric-back"]').first().click();
  await page.locator('[data-action="lyric-home"]').first().click();
  if(await page.locator('.welcome-continue').isVisible())await page.locator('.welcome-continue').click();

  // The Academy's command, real input, and submission controls all need to
  // fit at high zoom. Accepting a command must not induce horizontal overflow.
  await page.locator('[data-action="learn"][data-os="linux"]').click();
  const academy=page.locator('#lesson-input');
  await academy.focus();
  await page.keyboard.type('l');
  assert.equal(await academy.inputValue(),'l','Academy typing stays editable at '+width+'px');
  await assertReflow(page,'#lesson-input','Field Academy',width);
  await assertReflow(page,'.academy-mobile-entry [data-action="training-submit"]','Field Academy submission',width);
  const command=await page.locator('#lesson-target-text').textContent();
  await academy.fill(command);
  await page.locator('.academy-mobile-entry [data-action="training-submit"]').click();
  assert.match(await page.locator('#training-feedback').innerText(),/COMMAND RECOGNIZED/);
  await assertReflow(page,'#lesson-input','Field Academy completed command',width);
  await context.close();
 }

 // User-facing Reduce Motion setting must also work when the OS preference is off.
 const context=await browser.newContext({viewport:{width:1440,height:850},reducedMotion:'no-preference'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(origin,{waitUntil:'domcontentloaded'});
 await page.locator('#app .brand-name').waitFor();
 await page.locator('[data-action="settings"]').first().click();
 await page.locator('[data-action="setting"][data-setting="reducedMotion"]').click();
 assert.equal(await page.locator('body.reduce-motion').count(),1,'the in-app setting must enable reduced motion');
 const duration=await page.locator('.live-pulse').evaluate(el=>getComputedStyle(el).animationDuration);
 assert.ok(parseFloat(duration)<.002,'manual Reduce Motion stops the background pulse: '+duration);
 await context.close();
 assert.deepEqual(errors,[],'navigation and preference tests have no unexpected script errors');
 console.log('PASS: skip navigation, Speed Lab score announcement, Academy status, and reduced-motion preferences at mobile/desktop widths');
}finally{await browser.close();}
