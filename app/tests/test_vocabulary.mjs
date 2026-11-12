import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKS, createWordStream, scoreSpeedRun, readSpeedHistory, saveSpeedResult } from '../web/ui/speed-engine.js';
import { speedTemplate } from '../web/ui/speed-view.js';

const careerPacks=['legal','education','government','healthcare','finance','hospitality'];
globalThis.localStorage={getItem(){return null},setItem(){}};

test('Six professional vocabulary packs extend, not replace, core Speed Lab',()=>{
 assert.deepEqual(Object.keys(PACKS).filter(id=>PACKS[id].professional),careerPacks);
 for(const id of ['everyday','technology','numpad','atmosphere'])assert.ok(PACKS[id]);
 assert.equal(PACKS.numpad.words.length,0);
});

for(const id of careerPacks){
 test(id+' uses varied, non-sensitive, single-word practice tokens',()=>{
  const pack=PACKS[id];
  assert.ok(pack.professional);
  assert.ok(pack.description.length>15);
  assert.ok(pack.words.length>=55,'at least 55 curated terms');
  assert.ok(new Set(pack.words).size>=55,'avoid repetitive drills');
  assert.ok(pack.words.every(word=>/^[a-z]+$/.test(word)),'no numbers, emails, names or punctuation');
  const stream=createWordStream(id,16,()=>0.5);
  assert.equal(stream.split(' ').length,16);
  assert.ok(stream.split(' ').every(word=>pack.words.includes(word)));
  assert.equal(createWordStream(id,3,()=>0),Array(3).fill(pack.words[0]).join(' '));
  assert.equal(createWordStream(id,1,()=>0.999),pack.words.at(-1));
 });
}

test('Grouped categories are keyboard-accessible and retain selected state',()=>{
 const session={pack:'government',seconds:30,status:'idle',reference:'permit council',typed:'',startedAt:null,keystrokes:0,result:null};
 const html=speedTemplate(session,()=>'<header>Test</header>');
 assert.match(html,/CORE DRILLS/);
 assert.match(html,/WORKPLACE DRILLS/);
 assert.match(html,/role="group" aria-label="Workplace practice categories"/);
 for(const id of careerPacks)assert.match(html,new RegExp('data-pack="'+id+'"'));
 assert.match(html,/data-pack="government"[^>]*aria-pressed="true"/);
 assert.match(html,/data-pack="numpad"/);
});

test('Workplace scoring and local saved history use the original WPM path',()=>{
 const storage={data:null,getItem(){return this.data},setItem(key,value){this.data=value}};
 const result=scoreSpeedRun('permit review','permit review',30,13);
 assert.equal(result.accuracy,100);
 assert.equal(result.wpm,5);
 saveSpeedResult({...result,pack:'government',seconds:30},storage);
 const history=readSpeedHistory(storage);
 assert.equal(history.length,1);
 assert.equal(history[0].pack,'government');
 assert.equal(history[0].wpm,result.wpm);
 const html=speedTemplate({pack:'government',seconds:30,status:'complete',reference:'permit review',typed:'permit review',result},()=>'<header>Test</header>');
 assert.match(html,/WPM/);
 assert.match(html,/GOVERNMENT/);
 assert.doesNotMatch(html,/id="speed-wpm">\d+<\/strong><small>CPM/);
});
