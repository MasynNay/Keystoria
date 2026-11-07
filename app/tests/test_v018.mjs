import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FEATURED_SONGS,parseLRC,currentLineAt,expectedWordsAt,scoreRun,cleanWord,sameWord,featuredFor,searchTimedLyrics } from '../web/ui/lyric-lab-core.js';
import { MISSIONS } from '../web/ui/missions.js';
import { MISSION_COLORS,missionColorStyle } from '../web/ui/mission-colors.js';
globalThis.localStorage={getItem:()=>null,setItem:()=>null};
const {createViews}=await import('../web/ui/views.js');
const views=createViews({online:true,selectedMission:'station',nickname:'TEST',modal:null,preferences:{}});

test('all 24 mission cards and cover art have unique palettes, including six new chapters',()=>{
  const ids=Object.keys(MISSIONS);
  assert.equal(ids.length,24);
  assert.equal(Object.keys(MISSION_COLORS).length,24);
  assert.equal(new Set(ids.map(id=>MISSION_COLORS[id][0])).size,24);
  for(const id of ids){assert.ok(MISSION_COLORS[id],id);assert.match(missionColorStyle(id),/--mission-glow:/);}
  const html=views.homeTemplate();
  assert.match(html,/TWENTY-FOUR STORIES/);
  for(const id of ids)assert.match(html,new RegExp('data-mission="'+id+'"'));
  for(const id of ['mirrorfall','four_winds','dawnforge','glass_trials','wildbond','stardoor'])assert.match(html,new RegExp('data-mission-mark="'+id+'"'));
  assert.match(html,/lyric-open/);
  assert.match(html,/id="lyric-lab"/);
});

test('featured catalog has 12 independent YouTube video identifiers with no shipped lyrics',()=>{
  assert.equal(FEATURED_SONGS.length,12);
  assert.equal(new Set(FEATURED_SONGS.map(x=>x.videoId)).size,12);
  for(const song of FEATURED_SONGS){assert.match(song.videoId,/^[a-zA-Z0-9_-]{11}$/);assert.ok(song.title && song.artist);assert.equal(song.syncedLyrics,undefined);}
  assert.equal(featuredFor({trackName:'yellow',artistName:'Coldplay'}).videoId,'yKNxeF4KMsY');
});

test('LRC parses repeated timestamps, milliseconds, accents and punctuation, in time order',()=>{
  const lrc='[ar:Original]\n[00:03.20][00:06.70] Hello, world!\n[00:01.00] Café tonight.\n[00:09.10] The signal returns';
  const chart=parseLRC(lrc,12);
  assert.deepEqual(chart.lines.map(l=>l.time),[1,3.2,6.7,9.1]);
  assert.equal(chart.lines[0].words[0],'Café');
  assert.equal(chart.lines[1].words[0],'Hello,');
  assert.equal(chart.lines[3].startWord,6);
  assert.equal(currentLineAt(chart.lines,3.5),1);
  assert.equal(currentLineAt(chart.lines,15),3);
  assert.ok(expectedWordsAt(chart.lines,3.5)>=chart.lines[1].startWord);
  assert.equal(parseLRC('not a song').words.length,0);
  assert.equal(cleanWord('Café!'),'cafe');
  assert.equal(sameWord('cafe','Café!'),true);
  assert.equal(sameWord('late','later'),false);
});

test('song WPM, streak and accuracy score count correct words and elapsed time',()=>{
  assert.deepEqual(scoreRun(),{wpm:0,accuracy:100,correct:0,attempts:0,bestStreak:0,points:0});
  const s=scoreRun({correct:12,attempts:15,characters:75,elapsed:30,bestStreak:7});
  assert.equal(s.wpm,30);assert.equal(s.accuracy,80);assert.equal(s.points,310);
});

test('LRCLIB client reads timed results without files and ignores unsynced/instrumental tracks',async()=>{
  let lastUrl='',headers={};
  const fake=async (url,args)=>{lastUrl=url;headers=args.headers;return {ok:true,status:200,json:async()=>[
    {id:1,trackName:'yellow',artistName:'Coldplay',syncedLyrics:'[00:00.00] Example sentence',duration:200},
    {id:2,trackName:'instrumental',instrumental:true,syncedLyrics:'[00:00.00] Some noise'},
    {id:3,trackName:'missing sync',plainLyrics:'No timestamps'}]};};
  const rows=await searchTimedLyrics('yellow Coldplay',{fetcher:fake});
  assert.match(lastUrl,/https:\/\/lrclib.net\/api\/search\?q=yellow%20Coldplay/);
  assert.match(headers['Lrclib-Client'],/KEYSTORIA/);
  assert.equal(rows.length,1);
  assert.equal(rows[0].videoId,'yKNxeF4KMsY');
});

test('LRCLIB rate limiting and failures are surfaced instead of silently failing',async()=>{
 await assert.rejects(searchTimedLyrics('test',{fetcher:async()=>({ok:false,status:429,headers:{get:()=>15}})}),/15 seconds/);
 await assert.rejects(searchTimedLyrics('test',{fetcher:async()=>({ok:false,status:503})}),/could not be reached/);
});

test('Lyric Lab is a separate mode without affecting the mission engine',()=>{
 const script=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
 assert.match(script,/createLyricLabController/);
 assert.match(script,/state.lyric \? "lyric"/);
 assert.match(script,/case "lyric-open"/);
 assert.doesNotMatch(readFileSync(new URL('../web/ui/lyric-lab-controller.js',import.meta.url),'utf8'),/\.submit\(room|GameEngine|server\/game/);
});
