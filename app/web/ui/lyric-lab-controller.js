/** A no-upload lyrics typing studio. Track metadata/lyrics loaded on demand from
 * LRCLIB; videos play exclusively through YouTube's official visible iframe.
 * This is a separate mode: it never touches mission server state.
 */
import { safe, ico } from './helpers.js';
import { renderLyricWordFeedback } from './lyric-word-feedback.js';
import { FEATURED_SONGS, cleanWord, sameWord, parseLRC, currentLineAt, expectedWordsAt, scoreRun, searchTimedLyrics, featuredFor, parseYouTubeVideoId, youtubeSearchUrl, PLAYBACK_RATES, nextPlaybackRate, coverStyle, lineHasForeignScript, calibratedOffset } from './lyric-lab-core.js';

const $ = id => document.getElementById(id);
const fmt = s => `${String(Math.floor(Math.max(0,s)/60)).padStart(2,'0')}:${String(Math.floor(Math.max(0,s)%60)).padStart(2,'0')}`;
const originalDemo = Object.freeze({
 id:0,trackName:'Signals Through The Night',artistName:'KEYSTORIA',duration:68,videoId:null,demo:true,
 syncedLyrics:`[00:00.00] Signals through the night
[00:04.00] Another city coming into view
[00:08.00] I hear a voice beyond the static
[00:12.00] And I am sending one back to you
[00:16.00] Every letter lights a window
[00:20.00] Every word can open up a door
[00:24.00] Through the rhythm and the thunder
[00:28.00] We are stronger than before
[00:32.00] Find the signal keep it glowing
[00:36.00] Let the melody light the way
[00:40.00] All the stories we are showing
[00:44.00] Will be written here today
[00:48.00] Hold the line and keep on typing
[00:52.00] Every moment brings us near
[00:56.00] Let the darkness fade behind us
[01:00.00] There is nothing left to fear`,
});
function youtubeApi(){
 if(typeof window==='undefined')return Promise.reject(new Error('YouTube requires a browser.'));
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(window.__panicYTReady)return window.__panicYTReady;
 window.__panicYTReady=new Promise((resolve,reject)=>{
  const old=window.onYouTubeIframeAPIReady;
  let timeout=setTimeout(()=>reject(new Error('YouTube did not load. Check your network or browser extensions.')),14000);
  window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);try{old?.();}catch{}resolve(window.YT);};
  if(!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')){
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
    script.onerror=()=>{clearTimeout(timeout);reject(new Error('YouTube is blocked in this browser.'));};
    document.head.appendChild(script);
  }
 }).catch(err=>{window.__panicYTReady=null;throw err;});
 return window.__panicYTReady;
}
export function createLyricLabController({state,onRender}){
 let phase='browse',query='',results=[],selected=null,chart=null,fetchController=null,request=0;
 let player=null,playerReady=false,videoPlaying=false,lagPaused=false,active=false,videoError='';
 let ticker=null,elapsed=0,time=0,offset=0,assist=false,strict=false;
 let index=0,correct=0,attempts=0,skipped=0,chars=0,streak=0,bestStreak=0,wrong=false,notice='',searching=false;
 let loopIndex=null,practice=false,savedResult=false,lastClock=0,playbackRate=1,playerGeneration=0;
 const save = ()=>{try{localStorage.setItem('panic.lyric.assist',String(assist));localStorage.setItem('panic.lyric.strict',String(strict));localStorage.setItem('panic.lyric.speed',String(playbackRate));}catch{}};
 try{assist=localStorage.getItem('panic.lyric.assist')==='true';strict=localStorage.getItem('panic.lyric.strict')==='true';const remembered=Number(localStorage.getItem('panic.lyric.speed'));if(PLAYBACK_RATES.includes(remembered))playbackRate=remembered;}catch{}
 const savedVideoId=track=>{try{return parseYouTubeVideoId(localStorage.getItem('panic.lyric.video.'+String(track.id)));}catch{return null;}};
 const offsetKey=track=>'panic.lyric.offset.'+String(track?.id??'demo')+'.'+String(track?.videoId||'none');
 const storedOffset=track=>{try{const num=Number(localStorage.getItem(offsetKey(track)));return Number.isFinite(num)?Math.max(-120,Math.min(120,num)):0;}catch{return 0;}};
 const saveOffset=()=>{if(selected)try{localStorage.setItem(offsetKey(selected),String(offset));}catch{}};
 const artStyle=track=>safe(coverStyle(track));
 const record=(str)=>`<div class="lyric-browse-notice" role="status">${safe(str)}</div>`;
 function template(header){
  if(phase==='browse')return `${header({inGame:true})}<main class="lyric-shell shell"><div class="lyric-titlebar"><button class="text-button" data-action="lyric-home">← EXIT TO MENU</button><span>// PRACTICE MODE · NO UPLOADS</span></div><section class="lyric-intro"><div class="lyric-disc" aria-hidden="true"><div></div></div><div><span class="lyric-kicker">KEYSTORIA // LYRIC LAB</span><h1>TYPE TO <em>THE BEAT.</em></h1><p>Choose a featured video or search for timed lyrics. When you select a song, we automatically try to connect a matching YouTube recording. Type along at your own speed. No MP3s, lyric files, or accounts required for players.</p></div></section>
  <form id="lyric-search-form" class="lyric-search"><label for="lyric-search-input">FIND A SONG OR ARTIST</label><div><input id="lyric-search-input" name="query" value="${safe(query)}" placeholder="Search thousands of songs with timed lyrics…" autocomplete="off" maxlength="110" required/><button type="submit" class="btn btn-primary" ${searching?'disabled':''}>${searching?'SEARCHING…':'SEARCH LYRICS'}</button></div></form>
  ${notice?record(notice):''}${searching?'<div class="lyric-loading">Finding synced lyrics…</div>':''}
  ${results.length?`<section class="lyric-results"><h2>SEARCH RESULTS <span>${results.length} TIMED TRACKS</span></h2><div class="lyric-results-grid">${results.map((track,i)=>`<button class="lyric-song-result" data-action="lyric-result" data-index="${i}"><span class="lyric-result-art" aria-hidden="true" style="${artStyle(track)}"></span><span class="lyric-result-info"><strong>${safe(track.trackName)}</strong><span>${safe(track.artistName)}</span><small>${(track.videoId||savedVideoId(track))?'◉ VIDEO READY':'◎ AUTO-MATCH VIDEO ON SELECT'} · ${fmt(track.duration)}</small></span></button>`).join('')}</div></section>`:''}
  <section class="lyric-featured"><div class="lyric-section-head"><h2>FEATURED MUSIC VIDEOS</h2><p>These tracks have an identified YouTube video. Timed lyrics are retrieved when you select one, not bundled with this app.</p></div><div class="lyric-album-grid">${FEATURED_SONGS.map((song,i)=>`<button data-action="lyric-featured" data-index="${i}" class="lyric-album lyric-has-art" style="--lyric-album:${song.color}"><span class="lyric-album-art" aria-hidden="true" style="${artStyle(song)}"></span><span class="lyric-album-icon">${ico('play',26)}</span><strong>${safe(song.title)}</strong><small>${safe(song.artist)}</small></button>`).join('')}</div></section>
  <section class="lyric-demo-strip"><div><strong>NO INTERNET? TEST THE GAMEPLAY.</strong><p>Try our original timed-lyrics demo with a built-in electronic beat. The lyrics and tune are made for Keystoria.</p></div><button class="btn btn-outline" data-action="lyric-demo">PLAY ORIGINAL DEMO</button></section><p class="lyric-legal">Music videos are played in the official YouTube embedded player. Lyrics are requested from LRCLIB only when you select a track. Video availability, captions and timing can differ. Attribution does not establish copyright permission for commercial distribution.</p></main>`;
  const stats=scoreRun({correct,attempts,skipped,characters:chars,elapsed,bestStreak});
  const song=selected||originalDemo;
  return `${header({inGame:true})}<main class="lyric-shell shell"><div class="lyric-titlebar"><button class="text-button" data-action="lyric-back">← ALL SONGS</button><span>// ${song.demo?'ORIGINAL PRACTICE TRACK':song.videoId?'YOUTUBE + SYNCED LYRICS':'SYNCED LYRICS · CONNECT VIDEO'}</span></div><div class="lyric-song-heading"><div class="lyric-song-identity"><span class="lyric-track-cover" aria-hidden="true" style="${artStyle(song)}"></span><div><span class="lyric-kicker">NOW PLAYING // LYRIC LAB</span><h1>${safe(song.trackName)}</h1><p>${safe(song.artistName)}</p></div></div><button class="btn btn-outline" data-action="lyric-retry">↻ RESTART</button></div>
  <div class="lyric-game-grid"><section class="lyric-video-column"><div class="lyric-player-frame" id="lyric-player-frame">${song.videoId?'<div id="lyric-video-slot" class="lyric-video-slot"><span>Preparing YouTube…</span></div>':song.demo?'<div class="lyric-original-visual"><span>◉</span><strong>ORIGINAL PRACTICE BEAT</strong><small>LICENSE-FREE DEMO</small></div>':'<div class="lyric-no-video"><span>♫</span><strong>LYRICS FOUND. CONNECT THE MUSIC.</strong><small>Search YouTube below, then paste a video link. No downloads or files.</small></div>'}</div><div class="lyric-video-controls"><button data-action="lyric-toggle" id="lyric-toggle" class="btn btn-primary">▶ START</button><button data-action="lyric-rewind" class="btn btn-outline">↶ 5 SEC</button><button data-action="lyric-loop" id="lyric-loop" class="btn btn-outline" aria-pressed="${loopIndex!==null}">${loopIndex!==null?'✓ LOOPING':'↺ LOOP LINE'}</button><span id="lyric-clock">00:00 / ${fmt(song.duration)}</span></div><div class="lyric-speed-options"><span>PLAYBACK SPEED</span><div class="lyric-speed-controls"><button type="button" data-action="lyric-speed-down" aria-label="Slow playback down" title="Slow down">−</button><strong id="lyric-speed" aria-live="polite">${playbackRate.toFixed(2)}×</strong><button type="button" data-action="lyric-speed-up" aria-label="Speed playback up" title="Speed up">+</button><button type="button" data-action="lyric-speed-reset" class="lyric-speed-reset">1× RESET</button></div></div>${!song.demo?`<details class="lyric-video-linker" ${song.videoId?'':'open'}><summary>${song.videoId?'CHANGE YOUTUBE VIDEO':'CONNECT MUSIC FOR THIS SONG'}</summary><p>We automatically try to find a matching recording when you select a song. If no reliable match exists, search YouTube and connect a video here. No downloads required.</p><a class="lyric-find-video" href="${safe(youtubeSearchUrl(song))}" target="_blank" rel="noopener noreferrer">FIND “${safe(song.trackName)}” ON YOUTUBE ↗</a><form id="lyric-video-form" class="lyric-video-form"><label for="lyric-video-url">YOUTUBE VIDEO LINK</label><div><input id="lyric-video-url" name="videoUrl" type="url" placeholder="https://www.youtube.com/watch?v=…" autocomplete="off" required/><button type="submit" class="btn btn-outline">CONNECT VIDEO</button></div></form></details>`:''}<div class="lyric-seek"><label for="lyric-seek-slider">VIDEO POSITION</label><input type="range" id="lyric-seek-slider" min="0" max="${Math.max(1,Math.round(song.duration))}" step=".5" value="0"/></div><div class="lyric-sync-options"><span>LYRIC SYNC</span><button data-action="lyric-offset-back" title="Show lyrics 0.25 seconds later">−0.25s</button><strong id="lyric-offset">${offset>=0?'+':''}${offset.toFixed(2)}s</strong><button data-action="lyric-offset-forward" title="Show lyrics 0.25 seconds earlier">+0.25s</button><button data-action="lyric-offset-reset" title="Restore original lyric timing">RESET</button></div><p class="lyric-sync-tip">Hear a line starting? Tap <b>SYNC</b> beside that line below to align it to the video's current position. Adjustments are saved per song and video.</p><div class="lyric-mode-toggles"><button data-action="lyric-assist" id="lyric-assist" aria-pressed="${assist}">${assist?'✓':'○'} PAUSE VIDEO IF 8+ WORDS BEHIND</button><button data-action="lyric-strict" id="lyric-strict" aria-pressed="${strict}">${strict?'✓':'○'} STRICT PUNCTUATION</button></div><p class="lyric-video-status" id="lyric-video-status" role="status">${song.demo?'Start the original beat to practice offline.':song.videoId?'Click START after the YouTube player is ready.':song.matchFailed?'An automatic video match was not found. Use FIND ON YOUTUBE above as a fallback, or practice lyrics silently.':'No video connected. Use FIND ON YOUTUBE above as a fallback, or practice lyrics silently.'}</p></section>
  <section class="lyric-typing-column"><div class="lyric-score-grid"><div><span>WPM</span><strong id="lyric-wpm">0</strong></div><div><span>ACCURACY</span><strong id="lyric-accuracy">100%</strong></div><div><span>STREAK</span><strong id="lyric-streak">0</strong></div><div><span>WORDS</span><strong id="lyric-progress">0/${chart?.words.length||0}</strong></div><div><span>SKIPPED</span><strong id="lyric-skipped">0</strong></div></div><div class="lyric-now-singing"><div class="lyric-live-heading"><span>♫ PLAYING NOW</span><span id="lyric-live-time">00:00</span></div><p id="lyric-live-text">Waiting for music…</p><div class="lyric-live-progress"><span id="lyric-live-fill"></span></div><span id="lyric-lag-status">The highlighted line follows the video's clock.</span></div><div class="lyric-stage"><div class="lyric-prompt-heading"><span class="lyric-stage-heading" id="lyric-stage-heading">${phase==='done'?'TRACK COMPLETE':'TYPE THE HIGHLIGHTED WORD'}</span><span id="lyric-next-keystroke" class="lyric-next-keystroke" aria-live="off"></span></div><div class="lyric-current-line typing-feedback" id="lyric-current-line" aria-live="off"></div><div class="lyric-next-line" id="lyric-next-line"></div><div class="lyric-prompt"><label for="lyric-input">YOUR TURN · TYPE A WORD, PRESS SPACE</label><input id="lyric-input" type="text" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" disabled placeholder="Begin typing the lyrics…"/><span id="lyric-typing-hint">${strict?'STRICT MODE: match every symbol · SPACE submits':'Punctuation is optional · SPACE submits'} · ENTER skips the line</span><button type="button" class="lyric-skip-button" data-action="lyric-skip" id="lyric-skip">↵ SKIP THIS LYRIC LINE</button></div><div class="lyric-line-meter"><div id="lyric-line-meter-fill"></div></div></div><div class="lyric-scroll-list" id="lyric-lines" aria-label="Synchronized lyric lines. Choose a line to jump to."></div><div class="lyric-attribution"><span>LYRICS: <a href="${song.id?'https://lrclib.net/api/get/'+Number(song.id):'#'}" target="_blank" rel="noopener noreferrer">${song.demo?'ORIGINAL KEYSTORIA':'LRCLIB'}</a></span><span id="lyric-result-note">${phase==='done'?`FINISHED · ${stats.points} POINTS`:'Each word advances your score.'}</span></div></section></div></main>`;
 }
 function rerender(){onRender();}
 const setStatus=s=>{const el=$('lyric-video-status');if(el)el.textContent=s;};
 function teardown(){request++;playerGeneration++;loopIndex=null;practice=false;lastClock=0;fetchController?.abort();fetchController=null;searching=false;clearInterval(ticker);ticker=null;stopBeat();active=false;videoPlaying=false;lagPaused=false;playerReady=false;try{player?.destroy();}catch{}player=null;}
 function open(){teardown();phase='browse';state.lyric=true;state.modal=null;state.layout='';rerender();}
 function close(){teardown();phase='browse';state.lyric=false;state.modal='welcome';state.layout='';rerender();}
 function back(){teardown();phase='browse';state.layout='';rerender();}
 async function search(text){
  query=String(text||'').trim().slice(0,110);if(!query)return;
  fetchController?.abort();fetchController=new AbortController();const req=++request;
  searching=true;notice='';results=[];rerender();
  try{const found=await searchTimedLyrics(query,{signal:fetchController.signal});if(req!==request || !state.lyric)return;
   results=found.map(track=>({...track,videoId:track.videoId||savedVideoId(track)}));notice=found.length?'':'No timestamped lyrics were found for that search. Try artist + song title, or a featured track.';
  }catch(error){if(req!==request||error.name==='AbortError')return;notice=error.message||'Search temporarily unavailable.';}
  finally{if(req===request){searching=false;rerender();}}
 }
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 async function chooseFeatured(i){
  const item=FEATURED_SONGS[i];if(!item)return;
  notice='';query=`${item.artist} ${item.title}`;fetchController?.abort();fetchController=new AbortController();const req=++request;searching=true;results=[];rerender();
  try{
   let found=await searchTimedLyrics(query,{signal:fetchController.signal});
   if(!found.length)found=await searchTimedLyrics(item.title,{signal:fetchController.signal});
   if(req!==request||!state.lyric)return;
   const match=found.find(x=>norm(x.trackName)===norm(item.title) && norm(x.artistName)===norm(item.artist)) || found.find(x=>norm(x.trackName)===norm(item.title));
   if(!match){notice=`Timed lyrics are not available for ${item.title} right now. Try another featured song.`;searching=false;rerender();return;}
   select({...match,videoId:item.videoId});
  }catch(error){if(req!==request||error.name==='AbortError')return;notice=error.message||'Unable to retrieve timed lyrics.';}
  finally{if(req===request){searching=false;if(phase==='browse')rerender();}}
 }
 /** On selection, resolve the recording once; never run 20 YouTube searches for every lyric search. */
 async function chooseResult(track, button){
  if(!track)return;
  if(track.videoId||savedVideoId(track)){select({...track,videoId:track.videoId||savedVideoId(track)});return;}
  fetchController?.abort();const controller=new AbortController();fetchController=controller;
  const req=++request;
  const label=button?.querySelector('small');if(label)label.textContent='◎ FINDING MATCHING YOUTUBE VIDEO…';
  if(button)button.disabled=true;
  try{
   const params=new URLSearchParams({title:String(track.trackName||''),artist:String(track.artistName||''),duration:String(track.duration||0)});
   const response=await fetch('/api/music/resolve?'+params.toString(),{signal:controller.signal});
   if(!response.ok)throw new Error('Video search service unavailable');
   const data=await response.json();
   if(req!==request||!state.lyric)return;
   const id=parseYouTubeVideoId(data?.videoId);
   if(id){
    try{localStorage.setItem('panic.lyric.video.'+String(track.id),id);}catch{}
    select({...track,videoId:id,matchSource:data.source,autoMatched:true});
   }else select({...track,matchFailed:true});
  }catch(error){
   if(req!==request||!state.lyric||error.name==='AbortError')return;
   select({...track,matchFailed:true});
  }finally{if(button)button.disabled=false;}
 }
 function select(track){
  teardown();selected={...track,videoId:track.videoId||savedVideoId(track)};chart=parseLRC(track.syncedLyrics,track.duration);if(chart.words.length<3){phase='browse';notice='That lyric record does not contain enough timed words.';rerender();return;}
  phase='song';index=0;attempts=0;skipped=0;correct=0;chars=0;streak=0;bestStreak=0;elapsed=0;time=0;offset=storedOffset(selected);wrong=false;videoError='';active=false;practice=false;savedResult=false;lastClock=0;lastHtmlKey='';state.layout='';rerender();
 }
 function mount(){
  if(phase==='browse')return;
  lastHtmlKey='';updateUI();clearInterval(ticker);ticker=setInterval(tick,180);
  mountPlayer();
 }
 /** Player lifecycle is independent of lyric state, so connecting a video never
  * discards the timed lyrics or creates duplicate ticking intervals. */
 function mountPlayer(){
  const videoId=selected?.videoId;
  const generation=++playerGeneration;
  if(!videoId){setStatus(selected?.demo?'Offline original demo—press START to play the built-in beat.':selected?.matchFailed?'An automatic video match was not found. You can connect a different video manually, or practice lyrics silently.':'This lyric result has no linked video yet. Use FIND ON YOUTUBE and CONNECT VIDEO to add music.');return;}
  youtubeApi().then(YT=>{
   if(generation!==playerGeneration||phase==='browse'||!state.lyric||!$('lyric-video-slot')||selected?.videoId!==videoId)return;
   player=new YT.Player('lyric-video-slot',{
    width:'100%',height:'100%',videoId,
    playerVars:{playsinline:1,controls:1,rel:0,origin:location.origin},
    events:{onReady:()=>{
      if(generation!==playerGeneration)return;
      playerReady=true;applyPlaybackRate(playbackRate);
      const videoDuration=Number(player?.getDuration?.())||0;
      const slider=$('lyric-seek-slider');if(slider&&videoDuration>0)slider.max=String(Math.round(videoDuration));
      if(videoDuration>0 && selected?.duration && Math.abs(videoDuration-selected.duration)>8){
       setStatus(`This video is ${fmt(videoDuration)} while the lyric record is ${fmt(selected.duration)}. They may be different edits. Use SYNC beside a lyric as you hear it, or connect a matching video.`);
      }else setStatus((selected?.autoMatched?'Video automatically matched. ':'Video ready. ')+'Press START. Playback speed: '+playbackRate.toFixed(2)+'×.');
     },onStateChange:event=>{
      if(generation!==playerGeneration)return;
      videoPlaying=event.data===YT.PlayerState.PLAYING;
      if(videoPlaying){active=true;lastClock=performance.now();if($('lyric-input'))$('lyric-input').disabled=false;}
      else if(event.data===YT.PlayerState.PAUSED)active=false;
      if(event.data===YT.PlayerState.ENDED)finish();
      if(!lagPaused&&$('lyric-toggle'))$('lyric-toggle').textContent=videoPlaying?'Ⅱ PAUSE':'▶ START';
     },onPlaybackRateChange:event=>{
      if(generation!==playerGeneration)return;
      const rate=Number(event.data);if(Number.isFinite(rate)&&rate>0){playbackRate=rate;save();updateSpeedLabel();}
     },onError:event=>{
      if(generation!==playerGeneration)return;
      const blocked=[101,150].includes(Number(event?.data));
      videoError=blocked?'This video owner does not allow embedding. Use CHANGE YOUTUBE VIDEO to choose another upload.':'YouTube could not play this video here. Try another link or check your browser extensions.';
      setStatus(videoError);
     }}
   });
  }).catch(e=>{if(generation!==playerGeneration)return;videoError=e.message;setStatus(videoError+' You can still practice the timed lyrics.');});
 }
 function availableRates(){
  if(!playerReady||!player||typeof player.getAvailablePlaybackRates!=='function')return PLAYBACK_RATES;
  try{const rates=player.getAvailablePlaybackRates();return Array.isArray(rates)&&rates.length?rates.filter(rate=>rate>=.5&&rate<=2):[1];}catch{return [1];}
 }
 function updateSpeedLabel(){if($('lyric-speed'))$('lyric-speed').textContent=playbackRate.toFixed(2)+'×';}
 function applyPlaybackRate(wanted){
  if(!selected)return;
  const actual=nextPlaybackRate(wanted,0,availableRates());
  if(playerReady&&player){
   try{player.setPlaybackRate?.(actual);}catch{setStatus('This YouTube video cannot change speed.');}
   const reported=Number(player.getPlaybackRate?.());
   playbackRate=Number.isFinite(reported)&&reported>0?reported:actual;
  }else{playbackRate=actual;if(selected.demo&&active)startBeat();}
  save();updateSpeedLabel();
 }
 function changeSpeed(direction){
  if(!selected)return;
  const target=direction===0?1:nextPlaybackRate(playbackRate,direction,availableRates());
  applyPlaybackRate(target);
  if(playerReady&&player&&Math.abs(playbackRate-target)>.001)setStatus('This video supports '+availableRates().join('×, ')+'× playback speeds. Using '+playbackRate.toFixed(2)+'×.');
  else setStatus('Playback speed: '+playbackRate.toFixed(2)+'×. Lyric timing follows the music.');
  $('lyric-input')?.focus({preventScroll:true});
 }
 function connectVideo(value){
  if(!selected||selected.demo)return;
  const videoId=parseYouTubeVideoId(value);
  if(!videoId){setStatus('That is not a valid YouTube video link. Open FIND ON YOUTUBE, copy a video URL and try again.');return;}
  try{localStorage.setItem('panic.lyric.video.'+String(selected.id),videoId);}catch{}
  // A newly connected recording starts a clean run; the old iframe is destroyed.
  retry();playerGeneration++;try{player?.destroy();}catch{}player=null;
  playerReady=false;videoPlaying=false;videoError='';active=false;selected={...selected,videoId};offset=storedOffset(selected);
  const frame=$('lyric-player-frame');if(frame)frame.innerHTML='<div id="lyric-video-slot" class="lyric-video-slot"><span>Preparing YouTube…</span></div>';
  const details=$('lyric-video-form')?.closest('details');if(details){details.open=false;const summary=details.querySelector('summary');if(summary)summary.textContent='CHANGE YOUTUBE VIDEO';}
  setStatus('Connecting your YouTube video. Press START when it is ready.');
  lastHtmlKey='';updateUI();mountPlayer();
 }
 function tick(){
  if(phase!=='song'||!selected||!chart)return;
  const now=performance.now();const delta=lastClock?Math.min(.5,Math.max(0,(now-lastClock)/1000)):0;lastClock=now;
  if(selected.videoId){
   // Video clock is authoritative: never advance a separate local timer while YouTube is loading/paused.
   if(playerReady && player)try{const t=Number(player.getCurrentTime());if(Number.isFinite(t))time=Math.max(0,t);}catch{}
  }else if(active){time=Math.max(0,time+delta*playbackRate);}
  if(active && !practice && (videoPlaying||!selected.videoId||!playerReady))elapsed+=delta;
  const lyricTime=Math.max(0,time+offset);
  if(loopIndex!==null && chart.lines[loopIndex] && lyricTime>=chart.lines[loopIndex].end-.12){
    seek(chart.lines[loopIndex].time-offset,chart.lines[loopIndex].startWord);return;
  }
  if(assist && playerReady && player && videoPlaying && !lagPaused && expectedWordsAt(chart.lines,lyricTime)-index>=8){
   lagPaused=true;try{player.pauseVideo();}catch{}setStatus('Practice assist paused the video. Type to catch up, then it resumes.');
  }
  if((!selected.videoId||!playerReady) && active && time>=(selected.duration||chart.lines.at(-1).end)){finish();return;}
  updateUI();
 }
 function updateUI(){
  if(!selected||!chart)return;
  const sc=scoreRun({correct,attempts,skipped,characters:chars,elapsed,bestStreak});
  const reportedDuration=playerReady?Number(player?.getDuration?.())||0:0;
  const updates={'lyric-wpm':sc.wpm,'lyric-accuracy':sc.accuracy+'%','lyric-streak':streak,'lyric-skipped':skipped,'lyric-progress':`${index}/${chart.words.length}`,'lyric-clock':`${fmt(time)} / ${fmt(reportedDuration||selected.duration)}`,'lyric-offset':`${offset>=0?'+':''}${offset.toFixed(2)}s`};
  for(const [id,value] of Object.entries(updates))if($(id))$(id).textContent=String(value);
  if($('lyric-seek-slider') && document.activeElement!==$('lyric-seek-slider'))$('lyric-seek-slider').value=String(Math.min(selected.duration,Math.max(0,time)));
  renderLyrics();
 }
 let lastHtmlKey='';
 function renderLyrics(){
  if(!chart)return;
  const lyricTime=Math.max(0,time+offset);
  const audioLine=currentLineAt(chart.lines,lyricTime),typeLine=index>=chart.words.length?chart.lines.length-1:chart.words[index]?.line??0;
  const typed=$('lyric-input')?.value||'';
  const key=`${index}|${audioLine}|${typeLine}|${phase}|${wrong}|${offset}|${strict}|${typed}`;
  const live=$('lyric-live-text'),liveTime=$('lyric-live-time'),liveFill=$('lyric-live-fill');
  if(liveFill){const l=chart.lines[audioLine];const ratio=l&&lyricTime>=chart.lines[0].time?Math.max(0,Math.min(1,(lyricTime-l.time)/Math.max(.5,l.end-l.time))):0;liveFill.style.width=(ratio*100).toFixed(2)+'%';}
  if(liveTime)liveTime.textContent=fmt(time);
  if(key===lastHtmlKey)return;lastHtmlKey=key;
  if(live){live.textContent=lyricTime<chart.lines[0].time?`Instrumental intro · first lyric at ${fmt(chart.lines[0].time-offset)}`:chart.lines[audioLine]?.text||'Waiting for first lyric…';}
  if(liveTime)liveTime.textContent=fmt(time);
  const lag=$('lyric-lag-status');if(lag){
   const distance=audioLine-typeLine;
   lag.textContent=lyricTime<chart.lines[0].time?'The lyric will appear when its timestamp arrives.':distance>0?`You're ${distance} lyric ${distance===1?'line':'lines'} behind the music. Press ENTER to skip a line.`:distance<0?`You're ${-distance} ${distance===-1?'line':'lines'} ahead of the music.`:'Your typing is on the current lyric line.';
  }
  const line=chart.lines[typeLine];if(!line)return;
  const current=$('lyric-current-line'),next=$('lyric-next-line');
  const currentWord=chart.words[index]?.word||'';
  const feedback=renderLyricWordFeedback(currentWord,typed,{strict});
  const nextKeystroke=$('lyric-next-keystroke');
  if(nextKeystroke){
   const suggestedKey=phase==='done'?'':lineHasForeignScript(line.text)?'ENTER TO SKIP':feedback.nextKey;
   nextKeystroke.textContent=suggestedKey?`NEXT KEY  ${suggestedKey.length===1?suggestedKey.toUpperCase():suggestedKey}`:'';
   nextKeystroke.hidden=!suggestedKey;
  }
  if(current){current.innerHTML=line.words.map((word,i)=>{
   const wi=line.startWord+i,cls=wi<index?'lyric-correct':wi===index?'lyric-active-word lyric-live-word':'lyric-pending';
   return `<span class="${cls}">${wi===index ? feedback.html : safe(word)}</span>`;
  }).join(' ');current.setAttribute('data-audio-line',String(audioLine));}
  if(next)next.textContent=chart.lines[typeLine+1]?.text || (phase==='done'?'Great run!':'Keep going…');
  const lines=$('lyric-lines');if(lines){
   const first=Math.max(0,typeLine-2),last=Math.min(chart.lines.length,typeLine+5);
   lines.innerHTML=chart.lines.slice(first,last).map((l,i)=>`<div class="lyric-line-row"><button type="button" data-action="lyric-jump" data-index="${first+i}" class="lyric-line ${first+i===audioLine?'lyric-line-playing':''} ${first+i===typeLine?'lyric-line-typing':''}"><time>${fmt(l.time)}</time><span>${safe(l.text)}</span></button><button type="button" class="lyric-calibrate" data-action="lyric-calibrate" data-index="${first+i}" title="Set this lyric to the current video time">SYNC</button></div>`).join('');
  }
  const meter=$('lyric-line-meter-fill');if(meter)meter.style.width=`${Math.round((index-line.startWord)/Math.max(1,line.words.length)*100)}%`;
  const hint=$('lyric-typing-hint');if(hint)hint.textContent=lineHasForeignScript(line.text)?'Different alphabet detected. Press ENTER or SKIP LINE to move on without credit.':feedback.errors>0?'A red letter does not match. Use BACKSPACE to correct it before pressing SPACE.':wrong?'Not quite. Type the word again or press ENTER to skip the line.':lagPaused?'Video paused for catch-up. ENTER skips this line.':strict?'STRICT MODE: match punctuation and case · SPACE submits a word · ENTER skips the line':'Punctuation is optional (including apostrophes) · SPACE submits a word · ENTER skips the line';
 }
 function startBeat(){if(!selected?.demo)return;stopBeat();try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;beatCtx=new Audio();if(beatCtx.state==='suspended')beatCtx.resume();beatTimer=setInterval(()=>{
  if(!active||!beatCtx)return;const o=beatCtx.createOscillator(),g=beatCtx.createGain();o.type='triangle';o.frequency.value=beatNum%4===0?220:beatNum%2===0?330:440;g.gain.setValueAtTime(.0001,beatCtx.currentTime);g.gain.exponentialRampToValueAtTime(.06,beatCtx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,beatCtx.currentTime+.16);o.connect(g);g.connect(beatCtx.destination);o.start();o.stop(beatCtx.currentTime+.18);beatNum++;
 },500/playbackRate);}catch{}}
 let beatCtx=null,beatTimer=null,beatNum=0;
 function stopBeat(){clearInterval(beatTimer);beatTimer=null;try{beatCtx?.close();}catch{}beatCtx=null;}
 function toggle(){if(phase==='done')return;
  if(selected?.videoId && !playerReady){setStatus(videoError||'YouTube is still loading. Try START when the player is ready.');return;}
  if(playerReady && player){
   try{if(videoPlaying){player.pauseVideo();active=false;}else{player.playVideo();active=true;}}catch{setStatus('Use the YouTube player controls to play.');}
  }else{if(active){active=false;stopBeat();setStatus('Paused. Press START to continue.');}else{active=true;lastClock=performance.now();startBeat();setStatus(selected?.demo?'Original electronic beat playing. Type each word in rhythm.':'Timed-lyrics practice running without a video.');}if($('lyric-toggle'))$('lyric-toggle').textContent=active?'Ⅱ PAUSE':'▶ START';}
  if(active && $('lyric-input'))$('lyric-input').disabled=false;
  $('lyric-input')?.focus({preventScroll:true});
 }
 function resumeAfterCatchup(){
  if(lagPaused && expectedWordsAt(chart.lines,Math.max(0,time+offset))-index<=3){
   lagPaused=false;try{player?.playVideo();}catch{}setStatus('You caught up! Video resumed.');
  }
 }
 function skipLine(){
  if(!selected||phase==='done'||!chart?.words[index])return;
  const line=chart.lines[chart.words[index].line];
  if(!line)return;
  const count=Math.max(0,line.endWord-index);
  if(!count)return;
  if(!practice)skipped+=count;
  index=line.endWord;streak=0;wrong=false;lastHtmlKey='';
  const input=$('lyric-input');if(input){input.value='';input.classList.remove('lyric-error');input.focus({preventScroll:true});}
  setStatus(`Skipped ${count} untyped ${count===1?'word':'words'} in this line. No points awarded.`);
  resumeAfterCatchup();
  if(loopIndex!==null && index>=chart.lines[loopIndex].endWord){seek(chart.lines[loopIndex].time-offset,chart.lines[loopIndex].startWord);return;}
  if(index>=chart.words.length){finish();return;}
  updateUI();
 }
 function submitWord(value){if(!selected||phase==='done'||!chart?.words[index])return;
  const expected=chart.words[index].word;
  const input=String(value||'').trim();if(!input)return;
  if(!active && !lagPaused && !practice)return;
  if(!practice)attempts++;
  const okay=strict ? input===expected : sameWord(input,expected);
  if(okay){if(!practice){correct++;chars+=(strict?expected.length:cleanWord(expected).length)+1;streak++;bestStreak=Math.max(bestStreak,streak);}index++;wrong=false;}else{wrong=true;if(!practice)streak=0;}
  const el=$('lyric-input');if(el){el.value='';el.classList.toggle('lyric-error',!okay);}
  lastHtmlKey='';
  resumeAfterCatchup();
  if(loopIndex!==null && index>=chart.lines[loopIndex].endWord){seek(chart.lines[loopIndex].time-offset,chart.lines[loopIndex].startWord);return;}
  if(index>=chart.words.length){finish();return;}
  updateUI();
 }
 function finish(){if(phase==='done')return;phase='done';active=false;videoPlaying=false;stopBeat();try{player?.pauseVideo();}catch{}
  const result=scoreRun({correct,attempts,skipped,characters:chars,elapsed,bestStreak});
  if(!savedResult && selected && !practice){
    savedResult=true;try{const old=JSON.parse(localStorage.getItem('panic.lyric.history')||'[]');
      const entry={id:selected.id,title:selected.trackName,artist:selected.artistName,videoId:selected.videoId||null,date:new Date().toISOString(),skipped,...result};
      const history=Array.isArray(old)?old.slice(0,39):[];history.unshift(entry);localStorage.setItem('panic.lyric.history',JSON.stringify(history));
    }catch{}
  }
  if($('lyric-input'))$('lyric-input').disabled=true;
  if($('lyric-stage-heading'))$('lyric-stage-heading').textContent='TRACK COMPLETE!';
  if($('lyric-result-note'))$('lyric-result-note').textContent=`FINISHED · ${result.points} POINTS · ${result.accuracy}% ACCURACY`;
  setStatus(`Complete! ${result.wpm} WPM · ${result.accuracy}% accuracy · ${result.points} points. Try again for a new best.`);
  lastHtmlKey='';updateUI();
 }
 function retry(){if(!selected)return;index=0;correct=0;attempts=0;skipped=0;chars=0;elapsed=0;streak=0;bestStreak=0;wrong=false;lagPaused=false;time=0;active=false;practice=false;loopIndex=null;savedResult=false;phase='song';lastHtmlKey='';
  if(playerReady)try{player.pauseVideo();player.seekTo(0,true);}catch{}
  stopBeat();const el=$('lyric-input');if(el){el.disabled=false;el.value='';el.classList.remove('lyric-error');el.focus({preventScroll:true});}
  if($('lyric-stage-heading'))$('lyric-stage-heading').textContent='TYPE THE HIGHLIGHTED WORD';
  if($('lyric-loop')){$('lyric-loop').textContent='↺ LOOP LINE';$('lyric-loop').setAttribute('aria-pressed','false');}
  if($('lyric-toggle'))$('lyric-toggle').textContent='▶ START';setStatus('Ready for another run.');updateUI();
 }
 function seek(seconds,wordIndex=null){const maximum=Number(playerReady?player?.getDuration?.():0)||selected?.duration||999;const t=Math.max(0,Math.min(maximum,Number(seconds)||0));time=t;
  if(wordIndex!=null)index=Math.max(0,Math.min(chart.words.length,wordIndex));else index=chart.lines[currentLineAt(chart.lines,Math.max(0,time+offset))]?.startWord||0;
  lagPaused=false;wrong=false;lastHtmlKey='';const input=$('lyric-input');if(input){input.value='';input.classList.remove('lyric-error');}if(playerReady)try{player.seekTo(t,true);}catch{}
  if(phase==='done'){phase='song';if($('lyric-input'))$('lyric-input').disabled=false;}
  updateUI();
 }
 function loopLine(){if(!selected||!chart)return;
  if(loopIndex!==null){loopIndex=null;practice=false;setStatus('Line loop disabled. Continue the song.');}
  else{loopIndex=chart.words[Math.min(index,chart.words.length-1)]?.line??currentLineAt(chart.lines,time+offset);practice=true;seek(chart.lines[loopIndex].time-offset,chart.lines[loopIndex].startWord);setStatus('Practicing this line repeatedly. Looping will not inflate your score.');}
  if($('lyric-loop')){$('lyric-loop').textContent=loopIndex===null?'↺ LOOP LINE':'✓ LOOPING';$('lyric-loop').setAttribute('aria-pressed',String(loopIndex!==null));}
 }
 function handleAction(action,el){switch(action){
  case 'lyric-home':close();return true;
  case 'lyric-back':back();return true;
  case 'lyric-featured':chooseFeatured(Number(el.dataset.index));return true;
  case 'lyric-result':{const track=results[Number(el.dataset.index)];if(track)chooseResult(track,el);return true;}
  case 'lyric-demo':select(originalDemo);return true;
  case 'lyric-toggle':toggle();return true;
  case 'lyric-retry':retry();return true;
  case 'lyric-loop':loopLine();return true;
  case 'lyric-skip':skipLine();return true;
  case 'lyric-calibrate':{
   const line=chart?.lines[Number(el.dataset.index)];if(!line)return true;
   offset=calibratedOffset(line.time,time);saveOffset();lastHtmlKey='';updateUI();
   setStatus(`Synced “${line.text.slice(0,65)}” at video ${fmt(time)}. This timing offset is saved for this track and recording.`);
   $('lyric-input')?.focus({preventScroll:true});return true;
  }
  case 'lyric-offset-reset':offset=0;saveOffset();lastHtmlKey='';updateUI();setStatus('Original lyric timestamps restored for this song.');return true;
  case 'lyric-rewind':seek(time-5);return true;
  case 'lyric-speed-down':changeSpeed(-1);return true;
  case 'lyric-speed-up':changeSpeed(1);return true;
  case 'lyric-speed-reset':changeSpeed(0);return true;
  case 'lyric-offset-back':offset=Math.max(-120,Math.round((offset-.25)*4)/4);saveOffset();lastHtmlKey='';updateUI();return true;
  case 'lyric-offset-forward':offset=Math.min(120,Math.round((offset+.25)*4)/4);saveOffset();lastHtmlKey='';updateUI();return true;
  case 'lyric-assist':assist=!assist;save();el.setAttribute('aria-pressed',String(assist));el.textContent=(assist?'✓':'○')+' PAUSE VIDEO IF 8+ WORDS BEHIND';return true;
  case 'lyric-strict':strict=!strict;save();el.setAttribute('aria-pressed',String(strict));el.textContent=(strict?'✓':'○')+' STRICT PUNCTUATION';lastHtmlKey='';renderLyrics();return true;
  case 'lyric-jump':{const line=chart?.lines[Number(el.dataset.index)];if(line)seek(line.time-offset,line.startWord);return true;}
  }return false;}
 function handleInput(event){if(event.target?.id==='lyric-input'){
  if(event.target.value.length>100)event.target.value=event.target.value.slice(0,100);
  const word=chart?.words[index]?.word||'';
  const normalized=strict?event.target.value:cleanWord(event.target.value);
  const wanted=strict?word:cleanWord(word);
  const valid=wanted.startsWith(normalized);
  event.target.classList.toggle('lyric-error',!valid && normalized.length>0);
  renderLyrics();
  return true;
 }if(event.target?.id==='lyric-seek-slider'){if($('lyric-clock'))$('lyric-clock').textContent=fmt(Number(event.target.value))+' / '+fmt(selected?.duration||0);return true;}return false;}
 function handleKeydown(event){if(event.target?.id!=='lyric-input')return false;
  if(event.isComposing)return false;
  if(event.key==='Enter'){
   event.preventDefault();
   if(event.repeat)return true; // Holding Enter must not accidentally skip the song.
   if(event.metaKey||event.ctrlKey)submitWord(event.target.value);
   else skipLine();
   return true;
  }
  if(event.key===' '){event.preventDefault();submitWord(event.target.value);return true;}
  return false;
 }
 function handleChange(event){if(event.target?.id==='lyric-seek-slider'){seek(Number(event.target.value));return true;}return false;}
 async function handleSubmit(event){if(event.target?.id==='lyric-search-form'){event.preventDefault();await search(new FormData(event.target).get('query'));return true;}if(event.target?.id==='lyric-video-form'){event.preventDefault();connectVideo(new FormData(event.target).get('videoUrl'));return true;}return false;}
 return {open,close,back,template,mount,handleAction,handleInput,handleKeydown,handleChange,handleSubmit,featured:FEATURED_SONGS};
}
