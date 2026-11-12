import test from 'node:test';
import assert from 'node:assert/strict';
import { searchTimedLyrics } from '../web/ui/lyric-lab-core.js';

const synced='[00:00.00] Start a new signal\n[00:03.00] Keep the connection open\n[00:06.00] Finish the original melody';
const sample={id:424242,trackName:'Signal Test',artistName:'Example Artist',duration:20,syncedLyrics:synced};
const ok=rows=>({status:200,ok:true,json:async()=>rows});

test('normal timed lyrics filter incomplete and instrumental results',async()=>{
 const data=await searchTimedLyrics('Signal Test',{fetcher:async(url,options)=>{
  assert.match(url,/lrclib\.net\/api\/search\?q=Signal%20Test/);
  assert.equal(options.signal.aborted,false);
  return ok([sample,{...sample,id:2,instrumental:true},{...sample,id:3,syncedLyrics:null}]);
 }});
 assert.equal(data.length,1);
 assert.equal(data[0].trackName,'Signal Test');
 assert.match(data[0].syncedLyrics,/Start a new signal/);
});

test('rate limits show a bounded retry time',async()=>{
 await assert.rejects(searchTimedLyrics('busy',{fetcher:async()=>({
  status:429,ok:false,headers:{get:()=> '4'}
 })}),/rate-limited.*4 seconds/i);
 await assert.rejects(searchTimedLyrics('busy',{fetcher:async()=>({
  status:429,ok:false,headers:{get:()=> '999999'}
 })}),/after a short break/i);
});

test('offline and unreadable responses explain useful next actions',async()=>{
 await assert.rejects(searchTimedLyrics('offline',{fetcher:async()=>({status:503,ok:false})}),/offline demo/i);
 await assert.rejects(searchTimedLyrics('invalid',{fetcher:async()=>({
  status:200,ok:true,json:async()=>{throw new SyntaxError('bad json');}
 })}),/unreadable results/i);
 assert.deepEqual(await searchTimedLyrics('empty',{fetcher:async()=>ok({unexpected:true})}),[]);
});

test('hung providers hit a deadline and release the request',async()=>{
 let requestSignal;
 await assert.rejects(searchTimedLyrics('never responds',{
  timeoutMs:30,
  fetcher:async(_url,options)=>{requestSignal=options.signal;return new Promise(()=>{});}
 }),/timed out/i);
 assert.equal(requestSignal.aborted,true);
});

test('caller cancellation wins immediately without waiting for a timeout',async()=>{
 const parent=new AbortController();
 let requestSignal;
 const pending=searchTimedLyrics('replaced search',{
  signal:parent.signal,
  timeoutMs:5000,
  fetcher:async(_url,options)=>{requestSignal=options.signal;return new Promise(()=>{});}
 });
 parent.abort();
 await assert.rejects(pending,error=>error.name==='AbortError');
 assert.equal(requestSignal.aborted,true);
});
