import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveLocalVideoMatch} from '../web/ui/lyric-lab-core.js';
const track={trackName:'Signals Through The Night',artistName:'KEYSTORIA',duration:68};

test('local video resolver encodes the song metadata',async()=>{
 const data=await resolveLocalVideoMatch(track,{fetcher:async(url,{signal})=>{
  assert.match(url,/title=Signals\+Through\+The\+Night/);assert.match(url,/artist=KEYSTORIA/);assert.equal(signal.aborted,false);
  return {ok:true,json:async()=>({videoId:'video123'})};
 }});
 assert.equal(data.videoId,'video123');
});
test('a hung local video backend times out and aborts its request',async()=>{
 let signal;
 await assert.rejects(resolveLocalVideoMatch(track,{timeoutMs:25,
  fetcher:async(_,opts)=>{signal=opts.signal;return new Promise(()=>{});}
 }),/timed out.*YouTube link/i);
 assert.equal(signal.aborted,true);
});
test('superseding an older local lookup cancels it',async()=>{
 const controller=new AbortController();let signal;
 const work=resolveLocalVideoMatch(track,{signal:controller.signal,
  fetcher:async(_,opts)=>{signal=opts.signal;return new Promise(()=>{});}
 });
 controller.abort();
 await assert.rejects(work,e=>e.name==='AbortError');
 assert.equal(signal.aborted,true);
});
test('bad local backend and corrupt JSON explain manual fallback',async()=>{
 await assert.rejects(resolveLocalVideoMatch(track,{fetcher:async()=>({ok:false,status:502})}),/Connect a YouTube link/i);
 await assert.rejects(resolveLocalVideoMatch(track,{fetcher:async()=>({ok:true,json:async()=>{throw new Error('bad JSON')}})}),/unreadable data/i);
 await assert.rejects(resolveLocalVideoMatch(track,{fetcher:async()=>{throw new TypeError('offline')}}),/Cannot reach video matching/i);
});
