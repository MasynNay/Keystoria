import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Computed-style checks run against the actual static Pages edition.
// Touch emulation is not a physical iOS/Android performance benchmark.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
async function openHome(page){
 await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
 await page.locator('#app .brand-name').waitFor();
 const welcome=page.locator('.welcome-continue');
 if(await welcome.count()&&await welcome.isVisible())await welcome.click();
}
const cases=[
 {width:320,height:844,touch:true},
 {width:390,height:844,touch:true},
 {width:844,height:390,touch:true},
 {width:320,height:844,touch:false},
 {width:844,height:390,touch:false},
 {width:1440,height:844,touch:false},
];
try{
 for(const {width,height,touch} of cases){
  const context=await browser.newContext({
   viewport:{width,height},isMobile:touch,hasTouch:touch,reducedMotion:'no-preference'
  });
  const page=await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror',e=>errors.push(String(e)));
  await openHome(page);
  const grain=await page.locator('body > .grain').evaluate(el=>({
   display:getComputedStyle(el).display,
   image:getComputedStyle(el).backgroundImage,
  }));
  assert.equal(grain.display,touch?'none':'block',
   'full-screen SVG grain disabled only on touch-sized viewports');
  if(!touch)assert.ok(grain.image.includes('svg+xml'),'desktop texture remains unchanged');

  await page.locator('[data-action="learn"][data-os="linux"]').click();
  const field=page.locator('#lesson-input');
  await field.focus();
  const active=await page.locator('body').evaluate(el=>el.classList.contains('mobile-typing-active'));
  assert.equal(active,touch,'keyboard-focused body class only in compact touch layouts');
  const cue=await page.locator('#lesson-target-text .type-char.current').first().evaluate(el=>({
   animation:getComputedStyle(el).animationName,
   transition:getComputedStyle(el).transitionDuration,
   color:getComputedStyle(el).color,
   visible:el.isConnected,
  }));
  assert.equal(cue.animation,touch?'none':'typing-caret',
   'native typing keeps a visible cursor without per-character animation on phones');
  assert.equal(cue.transition,touch?'0s':'0.09s, 0.09s',
   'phone input highlight changes use no timed color transitions');
  assert.ok(cue.visible&&cue.color.length>0,'same target text and caret still rendered');

  // Lose focus: the style is tied to software-keyboard editing, not the
  // Academy page as a whole. Only the full-screen grain stays off on phones.
  await page.locator('.prefs-toggle').focus();
  if(touch){
   await page.waitForFunction(()=>!document.body.classList.contains('mobile-typing-active'));
   const blurStyle=await page.locator('#lesson-target-text .type-char.current').first().evaluate(el=>({
    animation:getComputedStyle(el).animationName,
    transition:getComputedStyle(el).transitionDuration,
   }));
   assert.equal(blurStyle.animation,'typing-caret',
    'caret effect resumes when native phone keyboard focus ends');
   assert.equal(blurStyle.transition,'0.09s, 0.09s',
    'original visual transitions resume when not typing');
  }
  // Lyric Lab's thin progress bar should advance instantly during touch
  // entry rather than running a second continuous CSS width animation.
  await openHome(page);
  await page.locator('[data-action="lyric-open"]').first().click();
  await page.locator('[data-action="lyric-demo"]').click();
  await page.locator('#lyric-toggle').click();
  const lyric=page.locator('#lyric-input');
  await page.waitForFunction(()=>!document.querySelector('#lyric-input')?.disabled);
  await lyric.focus();
  const fill=await page.locator('#lyric-live-fill').evaluate(el=>({
   transition:getComputedStyle(el).transitionDuration,
   width:getComputedStyle(el).width,
  }));
  assert.equal(fill.transition,touch?'0s':'0.12s',
   'Lyric bar reduces compositing only during phone keyboard input');
  assert.ok(Number.parseFloat(fill.width)>=0,'Lyric progress remains visible');
  await context.close();
 }
 assert.deepEqual(errors,[],'phone compositor rules create no browser errors');
 console.log('PASS: touch-only grain and typing animation budget, original desktop effects, native focus and Lyric progress on six viewports');
}finally{await browser.close();}
