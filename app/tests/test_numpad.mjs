import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKS, createWordStream, scoreSpeedRun, readSpeedHistory, saveSpeedResult } from '../web/ui/speed-engine.js';
import { speedTemplate } from '../web/ui/speed-view.js';
// Browser storage is intentionally mocked in the pure Node test.
globalThis.localStorage={getItem(){return null},setItem(){}};
test('Numpad is an independent Speed Lab category',()=>{
 assert.equal(PACKS.numpad.title,'NUMPAD');
 const passage=createWordStream('numpad',12,()=>0.47);
 const groups=passage.split(' ');
 assert.equal(groups.length,12);
 assert.deepEqual(groups.map(x=>x.length),[3,4,5,6,3,4,5,6,3,4,5,6]);
 assert.ok(groups.every(x=>/^\d+$/.test(x)));
 assert.equal(createWordStream('numpad',1,()=>0),'000');
 assert.equal(createWordStream('numpad',1,()=>0.999),'999');
 assert.ok(createWordStream('everyday',3,()=>0).includes('the'));
});
test('Numpad score and local record history retain category',()=>{
 const a=scoreSpeedRun('123 456','123 456',30,7);
 assert.equal(a.accuracy,100);
 assert.equal(a.correct,7);
 const storage={value:null,getItem(){return this.value},setItem(k,v){this.value=v}};
 saveSpeedResult({pack:'numpad',wpm:a.wpm,cpm:12,accuracy:100,seconds:30},storage);
 assert.equal(readSpeedHistory(storage)[0].pack,'numpad');
 assert.equal(readSpeedHistory(storage)[0].cpm,12);
});
test('Numpad screen offers separate selection, number prompts, and CPM results',()=>{
 const base={pack:'numpad',seconds:30,reference:'123 456',typed:'',startedAt:null,status:'idle',keystrokes:0,result:null};
 const header=()=>'<header>Test</header>';
 const html=speedTemplate(base,header);
 assert.match(html,/data-pack="numpad"/);
 assert.match(html,/NUMPAD CHALLENGE/);
 assert.match(html,/CPM/);
 assert.match(html,/SPACE OR NUMPAD ENTER/);
 assert.match(html,/id="speed-input"/);
 const finished=speedTemplate({...base,status:'complete',result:{wpm:12,cpm:60,rawCpm:60,rawWpm:12,accuracy:100,correct:7,incorrect:0}},header);
 assert.match(finished,/60 <small>CPM<\/small>/);
});
