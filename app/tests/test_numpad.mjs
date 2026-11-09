import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKS, DURATIONS, createWordStream, createNumberStream, isNumericPack, scoreNumericRun, scoreSpeedRun, saveSpeedResult, readSpeedHistory } from '../web/ui/speed-engine.js';

test('numeric packs are available alongside the existing word banks',()=>{
 assert.deepEqual(DURATIONS,[15,30,60,120]);
 assert.ok(PACKS.everyday && PACKS.technology && PACKS.atmosphere);
 assert.equal(isNumericPack('everyday'),false);
 for(const id of ['numpad','numpad-amounts','numpad-codes']){
   assert.equal(isNumericPack(id),true);
   assert.ok(PACKS[id].description);
 }
});

test('number drills are finite, fictional, reproducible and formatted',()=>{
 const rng=()=>.5;
 const digits=createWordStream('numpad',12,rng);
 const amounts=createWordStream('numpad-amounts',12,rng);
 const codes=createWordStream('numpad-codes',12,rng);
 assert.equal(digits.split(' ').length,12);
 assert.match(digits,/^[0-9 ]+$/);
 assert.match(amounts,/^(?:[0-9]+\.[0-9]{2})(?: [0-9]+\.[0-9]{2})*$/);
 assert.match(codes,/^[0-9 ]+$/);
 assert.equal(createWordStream('numpad',12,rng),digits);
 assert.equal(createNumberStream('digits',0,rng),'');
 assert.equal(createWordStream('everyday',3,()=>0),'the the the');
});

test('digit scoring counts correct digits and excludes separators from DPM',()=>{
 const score=scoreNumericRun('123 45.67','123 45.67',60,9);
 assert.equal(score.dpm,7);
 assert.equal(score.rawDpm,7);
 assert.equal(score.digitAccuracy,100);
 assert.equal(score.correctDigits,7);
 assert.equal(score.typedDigits,7);
 assert.equal(score.keystrokes,9);
 const miss=scoreNumericRun('123 45','129 45',60,6);
 assert.equal(miss.dpm,4);
 assert.equal(miss.rawDpm,5);
 assert.equal(miss.digitAccuracy,80);
 assert.equal(miss.incorrect,1);
 assert.equal(scoreNumericRun('123','',30).digitAccuracy,100);
 assert.equal(scoreSpeedRun('abc','abc',60).wpm,1);
});

test('local history keeps numeric results, caps records and handles corruption',()=>{
 let raw='';
 const storage={getItem(){return raw},setItem(_,value){raw=value}};
 for(let i=0;i<30;i++) saveSpeedResult({pack:'numpad',dpm:i,wpm:0,accuracy:100},storage);
 const history=readSpeedHistory(storage);
 assert.equal(history.length,25);
 assert.equal(history[0].dpm,29);
 raw='{';
 assert.deepEqual(readSpeedHistory(storage),[]);
});
