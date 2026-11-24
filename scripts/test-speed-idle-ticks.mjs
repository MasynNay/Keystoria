import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// This catches timer-only work, not real-device FPS/input latency.
// 250ms clock updates should not repeatedly read the native selection
// or update a text prompt when the player has not typed anything new.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
  for(const variant of [
    {width:390,height:844,touch:true,pack:'everyday'},
    {width:1440,height:844,touch:false,pack:'numpad'},
  ]){
    const context=await browser.newContext({
      viewport:{width:variant.width,height:variant.height},
      isMobile:variant.touch,hasTouch:variant.touch,
    });
    try{
      const page=await context.newPage();
      page.setDefaultTimeout(12000);
      page.on('pageerror',error=>errors.push(String(error)));
      await page.goto('http://127.0.0.1:8765/play/',{waitUntil:'domcontentloaded'});
      await page.locator('#app .brand-name').waitFor();
      const welcome=page.locator('.welcome-continue');
      if(await welcome.count()&&await welcome.isVisible())await welcome.click();
      await page.locator('[data-action="speed-open"]').first().click();
      if(variant.pack==='numpad')
        await page.locator('[data-action="speed-pack"][data-pack="numpad"]').click();

      const input=page.locator('#speed-input');
      const letters=page.locator('#speed-letters');
      const reference=await letters.evaluate(el=>el.dataset.fullReference||el.textContent);
      assert.ok(reference.length>1000,'unabridged 700-word passage is intact');
      await input.fill(reference.slice(0,48));
      assert.equal(await letters.getAttribute('data-accuracy'),'100');
      // The first input starts the stopwatch at approximately t=0; the
      // first timer-driven nonzero rate appears on the following 250ms tick.
      await page.waitForFunction(()=>Number(document.getElementById('speed-wpm')?.textContent)>0);
      const initialSpeed=Number(await page.locator('#speed-wpm').textContent());
      assert.ok(initialSpeed>0,'initial live speed updates on input');

      // Allow any pending selection/scroll animation from the input to finish,
      // then instrument only the textarea selection getter during idle ticks.
      await page.waitForTimeout(140);
      const idle=await page.evaluate(async()=>{
        const field=document.getElementById('speed-input');
        const proto=HTMLTextAreaElement.prototype;
        const original=Object.getOwnPropertyDescriptor(proto,'selectionStart');
        if(!original?.configurable||!original.get)throw new Error('Cannot instrument selectionStart');
        let reads=0;
        const pauseButtons=[...document.querySelectorAll('[data-action="speed-pause"]')];
        if(pauseButtons.length<2)throw new Error('Both pause controls must exist');
        let disabledMutations=0;
        const mutations=new MutationObserver(records=>{
          disabledMutations+=records.filter(record=>record.attributeName==='disabled').length;
        });
        for(const button of pauseButtons)mutations.observe(button,{attributes:true,attributeFilter:['disabled']});
        Object.defineProperty(proto,'selectionStart',{
          configurable:true,enumerable:original.enumerable,
          get(){if(this===field)reads++;return original.get.call(this);},
          set(value){return original.set?.call(this,value);},
        });
        try{
          await new Promise(resolve=>setTimeout(resolve,1450));
          mutations.takeRecords().forEach(record=>{
            if(record.attributeName==='disabled')disabledMutations++;
          });
          return {
            reads,disabledMutations,pauseEnabled:pauseButtons.every(button=>!button.disabled),
            remaining:Number(document.getElementById('speed-time').textContent),
            speed:Number(document.getElementById('speed-wpm').textContent),
            accuracy:document.getElementById('speed-accuracy').textContent,
            focused:document.activeElement===field,
          };
        }finally{
          mutations.disconnect();
          Object.defineProperty(proto,'selectionStart',original);
        }
      });
      assert.equal(idle.reads,0,'unchanged timer ticks must not re-read the typing selection');
      assert.equal(idle.disabledMutations,0,
        'running 250ms timer ticks must not rewrite unchanged pause disabled attributes');
      assert.equal(idle.pauseEnabled,true,'pause controls remain usable throughout a running session');
      assert.ok(idle.remaining<30,'wall-clock display continues to tick');
      assert.ok(idle.speed>0 && idle.speed<initialSpeed,
        'speed must still decrease with elapsed time even when the text is unchanged');
      assert.equal(idle.accuracy,'100%','cached accuracy is still displayed');
      assert.equal(idle.focused,true,'native typing field keeps focus during idle ticks');

      // Numpad strips punctuation, so insert a different valid digit there.
      const wrong=variant.pack==='numpad'?(reference[11]==='5'?'6':'5'):'!';
      await input.fill(reference.slice(0,11)+wrong);
      assert.ok(Number(await letters.getAttribute('data-accuracy'))<100,
        'wrong edits invalidate the cached score');
      await input.fill(reference.slice(0,70));
      assert.equal(await letters.getAttribute('data-accuracy'),'100',
        'corrected text restores full accuracy');
      assert.equal(await letters.locator('.type-char.current').count(),1,
        'caret follows corrected text');
      assert.equal(await input.inputValue(),reference.slice(0,70),
        'native field retains all typed text');
      const progress=await page.locator('#speed-progress').textContent();
      assert.match(progress,variant.pack==='numpad'?/digits typed/:/70 characters typed/,
        'progress responds to edits, not to idle timer polling');
    }finally{await context.close();}
  }
  assert.deepEqual(errors,[],'no uncaught errors during the idle-tick regression');
  console.log('PASS: idle ticks update time and WPM without re-reading native caret; mobile/desktop edits still score correctly');
}finally{await browser.close();}
