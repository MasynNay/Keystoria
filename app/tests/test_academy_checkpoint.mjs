import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS} from '../web/ui/lessons.js';
import {readAcademyCheckpoints,readAcademyCheckpoint,saveAcademyCheckpoint,clearAcademyCheckpoint,clearAllAcademyCheckpoints} from '../web/ui/academy-checkpoint.js';

const key='keystoria.academy.checkpoints.v1';
function storage(){
 const values=new Map();
 return {
  getItem(k){return values.get(k)??null;},
  setItem(k,v){values.set(k,String(v));},
  removeItem(k){values.delete(k);}
 };
}
const course=(os='linux')=>({
 os,index:0,order:LESSONS[os].commands.map((_,i)=>i).reverse(),
 answered:false,errors:0,completed:false,review:false,
 draft:'SECRET COMMAND DRAFT',errorMessage:'private',referenceIndex:3
});

test('checkpoint roundtrip preserves the shuffle and step, not typed drafts',()=>{
 const s=storage(),start=course();
 assert.equal(saveAcademyCheckpoint(start,s),true);
 const resumed=readAcademyCheckpoint('linux',s);
 assert.deepEqual(resumed.order,start.order);
 assert.equal(resumed.index,0);
 assert.equal(resumed.draft,'');
 assert.equal(resumed.errorMessage,'');
 assert.equal(resumed.referenceIndex,null);
 assert.equal(resumed.review,false);
 assert.equal(s.getItem(key).includes('SECRET'),false);
 const answered={...start,index:4,answered:true,errors:2};
 assert.equal(saveAcademyCheckpoint(answered,s),true);
 const reread=readAcademyCheckpoint('linux',s);
 assert.equal(reread.index,4);
 assert.equal(reread.answered,true);
 assert.equal(reread.errors,2);
 assert.deepEqual(reread.order,start.order);
 assert.equal(Object.keys(readAcademyCheckpoints(s)).length,1);
});

test('different Academy courses have independent bounded checkpoints',()=>{
 const s=storage(),other=Object.keys(LESSONS).find(os=>os!=='linux');
 assert.ok(other);
 saveAcademyCheckpoint(course('linux'),s);
 saveAcademyCheckpoint({...course(other),index:2},s);
 assert.equal(readAcademyCheckpoint(other,s).index,2);
 assert.equal(clearAcademyCheckpoint('linux',s),true);
 assert.equal(readAcademyCheckpoint('linux',s),null);
 assert.equal(readAcademyCheckpoint(other,s).index,2);
 assert.equal(clearAcademyCheckpoint(other,s),true);
 assert.equal(s.getItem(key),null);
});

test('invalid and stale shuffles never enter the rendered Academy session',()=>{
 const s=storage(),c=course();
 for(const broken of [
  {...c,index:-1},{...c,index:LESSONS.linux.commands.length},
  {...c,index:1.5},{...c,order:[...c.order].fill(0)},
  {...c,order:c.order.slice(1)},{...c,order:[...c.order.slice(1),999]},
  {...c,answered:'yes'},{...c,errors:10001},{...c,errors:-1},
  {...c,os:'untrusted'},null,[],
 ]) assert.equal(saveAcademyCheckpoint(broken,s),false);
 const good=course();
 saveAcademyCheckpoint(good,s);
 s.setItem(key,JSON.stringify({linux:{...good,order:[0,0]},untrusted:{...good}}));
 assert.deepEqual(readAcademyCheckpoints(s),{});
 assert.equal(readAcademyCheckpoint('linux',s),null);
 assert.equal(readAcademyCheckpoint('missing',s),null);
 s.setItem(key,'{not json');
 assert.equal(readAcademyCheckpoint('linux',s),null);
});

test('blocked storage preserves gameplay without throwing',()=>{
 const denied={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
 assert.deepEqual(readAcademyCheckpoints(denied),{});
 assert.equal(saveAcademyCheckpoint(course(),denied),false);
 assert.equal(clearAcademyCheckpoint('linux',denied),false);
 assert.equal(clearAcademyCheckpoint('invalid',storage()),false);
});

test('explicit bulk reset erases only unfinished checkpoints, not earned badges',()=>{
 const s=storage();
 s.setItem('panic.lessons.v1',JSON.stringify({linux:true}));
 assert.equal(saveAcademyCheckpoint(course('linux'),s),true);
 assert.equal(saveAcademyCheckpoint({...course('windows'),index:3},s),true);
 assert.deepEqual(Object.keys(readAcademyCheckpoints(s)).sort(),['linux','windows']);
 assert.equal(clearAllAcademyCheckpoints(s),true);
 assert.equal(s.getItem(key),null);
 assert.deepEqual(readAcademyCheckpoints(s),{});
 assert.equal(s.getItem('panic.lessons.v1'),JSON.stringify({linux:true}),
   'completed course badges must remain intact');
 // Clearing again is harmless; unavailable storage must be nonfatal.
 assert.equal(clearAllAcademyCheckpoints(s),true);
 assert.equal(clearAllAcademyCheckpoints({removeItem(){throw Error('blocked')}}),false);
});
