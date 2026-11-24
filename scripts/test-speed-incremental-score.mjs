import assert from 'node:assert/strict';
import {createIncrementalSpeedScorer,createWordStream,scoreSpeedRun} from '../site/play/assets/ui/speed-engine.js';

// The final scored run is the oracle. Live counters must match it after any
// sequence of native typing, paste, correction, undo and IME-committed text.
// These are UTF-16 code-unit scores, matching the original implementation.
function assertScored(reference,pack,steps){
  const scorer=createIncrementalSpeedScorer(reference,{numpad:pack==='numpad'});
  let compared=0;
  for(const typed of steps){
    const actual=scorer.update(typed);
    const baseline=scoreSpeedRun(reference,typed,60);
    let rawDigits=0,correctDigits=0;
    if(pack==='numpad'){
      for(let i=0;i<typed.length;i++){
        if(typed[i]>='0' && typed[i]<='9'){
          rawDigits++;
          if(typed[i]===reference[i])correctDigits++;
        }
      }
    }
    assert.deepEqual(actual,{
      correct:baseline.correct,characters:baseline.characters,
      accuracy:baseline.accuracy,rawDigits,correctDigits,
    },'live-scoring parity for '+pack+' / '+JSON.stringify(typed.slice(-24)));
    assert.deepEqual(scorer.update(typed),actual,
      'repeated timer-only score reads must be stable');
    compared++;
  }
  return compared;
}

let assertions=0;
for(const pack of ['everyday','technology','atmosphere','numpad','healthcare','government']){
 let seed=5419;
 const reference=createWordStream(pack,700,()=>{
   seed=(seed*1664525+1013904223)>>>0;
   return seed/4294967296;
 });
 assert.ok(reference.length>1500,'full 700-group reference intact');
 const steps=[''];
 // Hundreds of correct single-character edits, including punctuation and
 // Numpad separators, must not force an entire-passage re-score per key.
 for(let n=1;n<=Math.min(330,reference.length);n++)steps.push(reference.slice(0,n));
 const editIndex=19,wrong=pack==='numpad'?'9':'!';
 const bad=reference.slice(0,editIndex)+wrong+reference.slice(editIndex+1,480);
 steps.push(reference.slice(0,400),bad,reference.slice(0,480));
 steps.push(reference.slice(0,120),reference.slice(0,121),'');
 steps.push(reference.slice(0,650),reference.slice(0,650).replace(/./,pack==='numpad'?'8':'x'));
 steps.push(reference.slice(0,320),reference.slice(0,320)+' ');
 steps.push(reference,reference.slice(0,reference.length-1),reference);
 // Native autocorrect and mid-document edits change both text and offsets;
 // the fallback must drop the old suffix before scoring the new one.
 for(const at of [0,1,33,179,400]){
   const replacement=pack==='numpad'?'4':'Z';
   steps.push(reference.slice(0,at)+replacement+reference.slice(at+1,520));
   steps.push(reference.slice(0,at)+replacement+' '+reference.slice(at,520));
   steps.push(reference.slice(0,520));
 }
 assertions+=assertScored(reference,pack,steps);
}

// Surrogate pairs, newlines, pasted overlength data and mixed-case edits must
// retain the original reference-index behavior, including mismatch accounting.
assertions+=assertScored('A👩‍💻 café Ω! 52','everyday',[
 '', 'A','A👩','A👩‍','A👩‍💻','A👩‍💻 c','A👩‍💻 café',
 'a👩‍💻 café Ω! 52','A👩‍💻 café Ω! 52','A👩‍💻 café Ω! 52!',
 'A👩‍💻 cafX Ω! 52','A👩‍💻 café Ω! 52','','A👩‍💻 café Ω! 52'
]);
assert.ok(assertions>2000,'exercised many incremental and correction transitions');
console.log('PASS: '+assertions+' live-scoring comparisons across six full 700-word packs, corrections, Numpad, paste, resets and Unicode');
