import test from 'node:test';
import assert from 'node:assert/strict';
import {LYRIC_HISTORY_KEY,readRecentLyricResults} from '../web/ui/lyric-history.js';

const storage=records=>({
 getItem:key=>key===LYRIC_HISTORY_KEY?JSON.stringify(records):null
});
const entry=(i)=>({
 id:i,title:'Song '+i,artist:'Artist '+i,date:new Date(Date.UTC(2026,10,23,12,i)).toISOString(),
 wpm:i*5,accuracy:95,points:120,skipped:2,videoId:'dQw4w9WgXcQ'
});

test('private recent song list is bounded and preserves saved newest-first order',()=>{
 const runs=Array.from({length:45},(_,i)=>entry(i));
 const recent=readRecentLyricResults(storage(runs));
 assert.equal(recent.length,5);
 assert.deepEqual(recent.map(x=>x.title),['Song 0','Song 1','Song 2','Song 3','Song 4']);
 assert.equal(readRecentLyricResults(storage(runs),2).length,2);
 assert.equal(readRecentLyricResults(storage(runs),-3).length,0);
 assert.equal(readRecentLyricResults(storage(runs),12).length,5);
 assert.equal('videoId' in recent[0],false,'do not expose media connections');
 assert.equal('id' in recent[0],false,'do not expose library IDs');
});

test('corrupt or missing localStorage never crashes the song library',()=>{
 assert.deepEqual(readRecentLyricResults({getItem(){return '{bad';}}),[]);
 assert.deepEqual(readRecentLyricResults({getItem(){throw Error('blocked');}}),[]);
 assert.deepEqual(readRecentLyricResults({getItem(){return '{}';}}),[]);
 assert.deepEqual(readRecentLyricResults({getItem(){return 'null';}}),[]);
 assert.deepEqual(readRecentLyricResults(storage([])),[]);
});

test('discard malformed scores and bound even adversarial saved metadata',()=>{
 const hostile=entry(1);hostile.title='<img src=x onerror=alert(1)>'.repeat(12);
 hostile.artist='<svg onload=alert(2)>'.repeat(12);
 const tooOld={...entry(2),date:'not a date'};
 const badAccuracy={...entry(3),accuracy:150};
 const badScore={...entry(4),points:-50};
 const badTitle={...entry(5),title:''};
 const noNumber={...entry(6),wpm:'100'};
 const good=entry(7);
 const list=readRecentLyricResults(storage([hostile,tooOld,badAccuracy,badScore,badTitle,noNumber,good]));
 assert.equal(list.length,2);
 assert.equal(list[0].title.length,120);
 assert.equal(list[0].artist.length,80);
 assert.equal(list[0].date,hostile.date);
 assert.equal(list[1].title,'Song 7');
});
