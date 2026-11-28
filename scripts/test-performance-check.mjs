import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {makePerformanceReport,recordSlowKeyboardEvent} from '../site/play/assets/ui/performance-check.js';

// User-activated instrumentation only. Chromium emulation cannot substitute
// for a real iPhone or Android performance reading.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];

// Pure report semantics are deterministic even with no measured frame for a
// mode. An input event count must never masquerade as measured latency.
const reportFixture=makePerformanceReport({
 frameIntervals:0,frameMsTotal:0,slowFrames:0,maxFrameGap:0,
 inputEvents:4,inputFrameDelays:[9,14],
 modes:{'Speed Lab':3,'Lyric Lab':1},
 modeFrameDelays:{'Speed Lab':[9,14],'Lyric Lab':[]},
 scrollEvents:0,scrollFrameDelays:[],visualViewportAvailable:false,
 longTasksSupported:false,
},{elapsedMs:10000,reason:'Completed',width:390,height:844,dpr:2,userAgent:'Test browser'});
assert.match(reportFixture,/Input-to-next-frame by mode — Speed Lab: 2 samples; p95 14 ms; maximum 14 ms/);
assert.match(reportFixture,/Input-to-next-frame by mode — Lyric Lab: 0 samples; p95 Not measured; maximum Not measured/);
assert.ok(!reportFixture.includes('undefined'),'missing optional diagnostic stats never leak into report');

// A browser's Event Timing API only reports thresholded slow events; never
// mistake those for a full interaction histogram or collect typed content.
const slowStats={
 frameIntervals:0,frameMsTotal:0,slowFrames:0,maxFrameGap:0,inputEvents:3,
 inputFrameDelays:[],modes:{'Speed Lab':2,'Lyric Lab':1},modeFrameDelays:{},
 scrollEvents:0,scrollFrameDelays:[],visualViewportAvailable:false,
 longTasksSupported:false,eventTimingSupported:true,slowKeyboardEvents:[]
};
const event=(name,id,duration,processingStart=7)=>({
 name,target:{id,value:'NEVER_SHARE_TYPED_TEXT'},
 duration,startTime:1,processingStart,
});
assert.equal(recordSlowKeyboardEvent(slowStats,event('keydown','speed-input',24,9)),true);
assert.equal(recordSlowKeyboardEvent(slowStats,event('keydown','speed-input',72,16)),true);
assert.equal(recordSlowKeyboardEvent(slowStats,event('beforeinput','lyric-input',40,12)),true);
assert.equal(recordSlowKeyboardEvent(slowStats,event('keydown','speed-input',12)),false,
 'fast keyboard events cannot appear in the thresholded slow-event sample');
assert.equal(recordSlowKeyboardEvent(slowStats,event('click','speed-input',96)),false,
 'pointer events cannot be reported as keyboard processing');
assert.equal(recordSlowKeyboardEvent(slowStats,event('keydown','unknown-private-field',96)),false,
 'the recorder never tracks inputs outside practice');
assert.equal(slowStats.slowKeyboardEvents.length,3);
assert.deepEqual(Object.keys(slowStats.slowKeyboardEvents[0]).sort(),['delay','duration','mode'],
 'timing records must not retain DOM nodes, typed content or interaction IDs');
const timedReport=makePerformanceReport(slowStats,{
 elapsedMs:10000,reason:'Completed',width:390,height:844,dpr:2,userAgent:'Test browser'
});
assert.match(timedReport,/Slow keyboard Event Timing \(≥16 ms, thresholded\): 3 observations/);
assert.match(timedReport,/Slow keyboard event timing by mode — Speed Lab: 2 samples; duration p95 72 ms; maximum 72 ms; input delay p95 15 ms/);
assert.match(timedReport,/Slow keyboard event timing by mode — Lyric Lab: 1 samples; duration p95 40 ms; maximum 40 ms; input delay p95 11 ms/);
assert.ok(!timedReport.includes('NEVER_SHARE_TYPED_TEXT'),'event timing reports never include typed values');
assert.match(reportFixture,/Slow keyboard Event Timing \(≥16 ms, thresholded\): Not exposed by this browser/);
const capStats={slowKeyboardEvents:[]};
for(let i=0;i<700;i++)recordSlowKeyboardEvent(capStats,event('keydown','lesson-input',32));
assert.equal(capStats.slowKeyboardEvents.length,600,'event timing stores only a bounded number of numeric observations');
try{
 for(const item of [{width:320,touch:true},{width:390,touch:true},{width:1440,touch:false}]){
  const context=await browser.newContext({
   viewport:{width:item.width,height:844},isMobile:item.touch,hasTouch:item.touch
  });
  try{
   const page=await context.newPage();
   page.setDefaultTimeout(15000);
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
   await page.locator('#app .brand-name').waitFor();
   const welcome=page.locator('.welcome-continue');
   if(await welcome.count()&&await welcome.isVisible())await welcome.click();
   await page.locator('[data-action="speed-open"]').first().click();
   const input=page.locator('#speed-input');
   const originalInput=await input.evaluate(el=>(window.__savedNativeField=el,true));
   assert.ok(originalInput);
   const nav=page.locator('[data-action="settings"]').first();
   await nav.click();
   const start=page.locator('[data-action="perf-start"]');
   await start.waitFor();
   assert.match(await start.locator('xpath=..').textContent(),/No typed words, scroll positions, scores or media details/);
   assert.equal(await page.locator('#keystoria-perf-check').count(),0,
    'no background diagnostic before the user explicitly starts it');
   await start.click();
   assert.equal(await page.locator('.modal-backdrop').count(),0,
    'start returns the user to the practice screen');
   const check=page.locator('#keystoria-perf-check');
   await check.waitFor();
   const report=check.locator('.perf-check-report');
   assert.equal(await report.isVisible(),false,'report hidden during recording');
   assert.equal(await input.evaluate(el=>document.activeElement===el),true,
    'starting check returns keyboard focus to the editable practice field');
   const geometry=await page.evaluate(()=>{
     const badge=document.getElementById('keystoria-perf-check');
     const field=document.getElementById('speed-input');
     const a=badge.getBoundingClientRect(),b=field.getBoundingClientRect();
     const overlap=a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
     return {compact:badge.classList.contains('is-recording'),
       width:a.width,height:a.height,overlap,
       x:a.right,y:a.top,screenWidth:innerWidth};
   });
   assert.equal(geometry.compact,true,'running check uses compact mode');
   assert.ok(geometry.width<=220 && geometry.height<=90,
     'badge must remain small at '+item.width+'px: '+JSON.stringify(geometry));
   assert.ok(geometry.x<=geometry.screenWidth+1 && geometry.y>=0,
     'badge stays within the visible viewport');
   assert.equal(geometry.overlap,false,'badge must not cover Speed Lab input');

   await input.fill('NEVER_SHARE_TYPED_TEXT');
   // Simulate a second practice mode in the same opt-in interval. We only
   // dispatch input events; no field text or game score should be sampled.
   await page.evaluate(()=>{
    const alternate=document.createElement('textarea');
    alternate.id='lyric-input';
    document.body.append(alternate);
    alternate.dispatchEvent(new Event('input',{bubbles:true}));
    alternate.remove();
   });
   // The opt-in report distinguishes scroll scheduling and keyboard-driven
   // viewport changes from typed-input latency. Dispatching only generic
   // scroll/resize events deliberately reveals no coordinates or content.
   const viewportSupported=await page.evaluate(()=>{
     window.dispatchEvent(new Event('scroll'));
     window.dispatchEvent(new Event('scroll'));
     if(window.visualViewport)window.visualViewport.dispatchEvent(new Event('resize'));
     return !!window.visualViewport;
   });
   await page.waitForTimeout(400);
   const value=await input.inputValue();
   assert.equal(value,'NEVER_SHARE_TYPED_TEXT');
   await check.locator('[data-perf-action="stop"]').click();
   assert.equal(await report.isVisible(),true,'results visible after user stops');
   assert.equal(await check.evaluate(el=>el.classList.contains('is-recording')),false,
     'the full report expands only after the check stops');
   const output=await report.inputValue();
   assert.match(output,/Practice input events: [1-9]/);
   assert.match(output,/Speed Lab: [1-9]/);
   assert.match(output,/Lyric Lab: [1-9]/);
   assert.match(output,/Input-to-next-frame by mode — Speed Lab: [1-9][0-9]* samples; p95 [0-9]+ ms; maximum [0-9]+ ms/);
   assert.match(output,/Input-to-next-frame by mode — Lyric Lab: [1-9][0-9]* samples; p95 [0-9]+ ms; maximum [0-9]+ ms/);
   assert.match(output,/Browser:/);
   assert.match(output,/Input-to-next-frame/);
   assert.match(output,/Scroll events \(including scripted\): [1-9]/);
   assert.match(output,/Scroll-to-next-frame samples: [1-9]/);
   assert.match(output,/Scroll-to-next-frame p95: [0-9]+ ms/);
   assert.match(output,/Slow keyboard Event Timing \(≥16 ms, thresholded\): (?:Not exposed by this browser|[0-9]+ observations)/);
   assert.match(output,/Visual viewport resize events: /);
   assert.match(output,viewportSupported
     ? /Visual viewport resize events: [1-9]/
     : /Visual viewport resize events: Not exposed by this browser/);
   assert.match(output,/Slow frame gaps/);
   assert.match(output,/collected locally after an explicit click/);
   assert.ok(!output.includes('NEVER_SHARE_TYPED_TEXT'),
    'the report must never contain the actual text entered by the player');
   assert.ok(!/scroll position|scroll target|pointer coordinates/i.test(output),
    'the report must not include scroll positions or event targets');
   assert.equal(await input.evaluate(el=>el===window.__savedNativeField),true,
    'instrumentation never detaches or replaces the native input');
   assert.equal(await check.locator('[data-perf-action="copy"]').isVisible(),true);
   await check.locator('[data-perf-action="close"]').click();
   assert.equal(await check.count(),0,'the local report is discarded on close');

   // Start a second time without a reload; it must not create duplicate
   // recorders or leave behind an old report.
   await nav.click();
   await start.click();
   assert.equal(await page.locator('#keystoria-perf-check').count(),1);
   assert.equal(await input.evaluate(el=>document.activeElement===el),true,
     'restarting the diagnostic also restores practice focus');
   await page.locator('[data-perf-action="stop"]').click();
   const restarted=await page.locator('.perf-check-report').inputValue();
   assert.match(restarted,/Mode input counts: No practice input detected/,
    'restarting resets per-mode event counts and samples');
   assert.ok(!restarted.includes('Input-to-next-frame by mode —'),
    'raw per-mode timings must not survive into a new report');
   await page.locator('[data-perf-action="close"]').click();
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[],'no uncaught browser errors');
 console.log('PASS: private opt-in phone/desktop performance check, native field identity, report and cleanup');
}finally{await browser.close();}
