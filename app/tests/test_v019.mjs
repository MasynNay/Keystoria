import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseYouTubeVideoId,youtubeSearchUrl,PLAYBACK_RATES,nextPlaybackRate} from '../web/ui/lyric-lab-core.js';
import {MISSIONS} from '../web/ui/missions.js';

globalThis.localStorage={getItem:()=>null,setItem:()=>null};
const {createViews}=await import('../web/ui/views.js');

test('YouTube link parser accepts official watch, short, live, embed and short links',()=>{
 const id='dQw4w9WgXcQ';
 for(const link of [id,`https://youtu.be/${id}?si=abc`,`https://www.youtube.com/watch?v=${id}&t=30`,
   `https://m.youtube.com/watch?v=${id}`,`https://music.youtube.com/watch?v=${id}`,
   `https://www.youtube.com/shorts/${id}`,`https://www.youtube.com/live/${id}`,
   `https://www.youtube-nocookie.com/embed/${id}`])assert.equal(parseYouTubeVideoId(link),id,link);
 for(const bad of ['','https://youtube.com/watch?v=not-an-id','https://youtube.com.evil.test/watch?v='+id,
  'javascript:alert(1)','https://evil.test/?v='+id,'https://youtube.com/playlist?list=abc','https://youtube.com/watch?v='+id+'MORE'])assert.equal(parseYouTubeVideoId(bad),null,bad);
 assert.match(youtubeSearchUrl({trackName:'Test Track',artistName:'A & B'}),/youtube.com\/results\?search_query=A%20%26%20B%20Test%20Track%20official%20music%20video/);
});

test('speed choices move deterministically and respect player-supported rates',()=>{
 assert.deepEqual(PLAYBACK_RATES,[.5,.75,1,1.25,1.5,1.75,2]);
 assert.equal(nextPlaybackRate(1,-1),.75);
 assert.equal(nextPlaybackRate(1,1),1.25);
 assert.equal(nextPlaybackRate(.5,-1),.5);
 assert.equal(nextPlaybackRate(2,1),2);
 assert.equal(nextPlaybackRate(.75,0,[.5,1,1.5,2]),.5);
 assert.equal(nextPlaybackRate(1,1,[.5,1,1.5,2]),1.5);
 assert.equal(nextPlaybackRate(1,-1,[.5,1,1.5,2]),.5);
});

test('campaign defaults to a 3-card preview and reveals all 24 on expansion',()=>{
 const state={online:true,selectedMission:'station',missionsExpanded:false,modal:null,preferences:{}};
 const views=createViews(state);
 let html=views.homeTemplate();
 assert.match(html,/SHOW FEWER MISSIONS|VIEW ALL 24 MISSIONS/);
 assert.match(html,/aria-expanded="false"/);
 assert.equal((html.match(/data-action="choose-mission"/g)||[]).length,24);
 assert.equal((html.match(/hidden class="mission-card/g)||[]).length,21);
 state.selectedMission='stardoor';html=views.homeTemplate();
 assert.equal((html.match(/hidden class="mission-card/g)||[]).length,20);
 state.missionsExpanded=true;html=views.homeTemplate();
 assert.match(html,/aria-expanded="true"/);
 assert.equal((html.match(/hidden class="mission-card/g)||[]).length,0);
 assert.equal(Object.keys(MISSIONS).length,24);
});

test('video linking and speed are wired into the game without changing the server mission engine',()=>{
 const ctrl=readFileSync(new URL('../web/ui/lyric-lab-controller.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
 assert.match(ctrl,/id="lyric-video-form"/);
 assert.match(ctrl,/data-action="lyric-speed-up"/);
 assert.match(ctrl,/player\.setPlaybackRate/);
 assert.match(ctrl,/getAvailablePlaybackRates/);
 assert.match(ctrl,/getCurrentTime/);
 assert.match(ctrl,/panic\.lyric\.video\./);
 assert.match(app,/event\.target\.id==="lyric-video-form"/);
 assert.match(app,/case "toggle-missions"/);
});
