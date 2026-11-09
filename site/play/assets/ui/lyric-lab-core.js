/** Lyric Lab pure timing/scoring logic. Lyrics are never shipped in the game. */
export const FEATURED_SONGS = Object.freeze([
  { title:'Never Gonna Give You Up', artist:'Rick Astley', videoId:'dQw4w9WgXcQ', color:'#eb679d' },
  { title:'Take On Me', artist:'a-ha', videoId:'djV11Xbc914', color:'#6de3f5' },
  { title:'Bohemian Rhapsody', artist:'Queen', videoId:'fJ9rUzIMcZQ', color:'#d4b5ff' },
  { title:'Yellow', artist:'Coldplay', videoId:'yKNxeF4KMsY', color:'#ffe28b' },
  { title:'Shake It Off', artist:'Taylor Swift', videoId:'nfWlot6h_JM', color:'#ffb1c6' },
  { title:'bad guy', artist:'Billie Eilish', videoId:'DyDfgMOUjCI', color:'#a8ff9f' },
  { title:'Royals', artist:'Lorde', videoId:'nlcIKh6sBtc', color:'#c7b4ff' },
  { title:'Believer', artist:'Imagine Dragons', videoId:'7wtfhZwyrcc', color:'#f9b17c' },
  { title:'Dancing Queen', artist:'ABBA', videoId:'xFrGuyw1V8s', color:'#8bdaff' },
  { title:'Get Lucky', artist:'Daft Punk', videoId:'5NV6Rdv1a3I', color:'#eac16a' },
  { title:'Hello', artist:'Adele', videoId:'YQHsXMglC9A', color:'#b8d5e8' },
  { title:'drivers license', artist:'Olivia Rodrigo', videoId:'ZmDBbnmKpqQ', color:'#eac2f8' },
]);
/** Official YouTube embed accepts a video ID, not a generic search term. Never scrape streams. */
export function parseYouTubeVideoId(value){
 const raw=String(value||'').trim();
 if(/^[a-zA-Z0-9_-]{11}$/.test(raw))return raw;
 let url;try{url=new URL(raw);}catch{return null;}
 if(!['http:','https:'].includes(url.protocol))return null;
 const host=url.hostname.toLowerCase();
 let id=null;
 if(host==='youtu.be'||host==='www.youtu.be')id=url.pathname.split('/')[1];
 else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)){
  if(url.pathname==='/watch')id=url.searchParams.get('v');
  else if(/^\/(embed|shorts|live)\//.test(url.pathname))id=url.pathname.split('/')[2];
 }
 return /^[a-zA-Z0-9_-]{11}$/.test(id||'')?id:null;
}
export function youtubeSearchUrl(track){
 const query=[track?.artistName||track?.artist,track?.trackName||track?.title,'official music video'].filter(Boolean).join(' ');
 return 'https://www.youtube.com/results?search_query='+encodeURIComponent(query);
}
export const PLAYBACK_RATES=Object.freeze([0.5,0.75,1,1.25,1.5,1.75,2]);
export function nextPlaybackRate(current,direction,available=PLAYBACK_RATES){
 const valid=[...new Set(available.map(Number).filter(v=>Number.isFinite(v)&&v>0))].sort((a,b)=>a-b);
 if(!valid.length)return 1;
 if(direction>0)return valid.find(v=>v>current+0.001)??valid.at(-1);
 if(direction<0)return [...valid].reverse().find(v=>v<current-0.001)??valid[0];
 return valid.reduce((best,v)=>Math.abs(v-current)<Math.abs(best-current)?v:best,valid[0]);
}
/** Original, reproducible cover illustrations for tracks without an identified video. */
function trackHash(track){
 const str=String(track?.artistName||track?.artist||'')+'|'+String(track?.trackName||track?.title||'');
 let h=2166136261;
 for(const char of str){h=Math.imul(h^char.codePointAt(0),16777619)>>>0;}
 return h>>>0;
}
export function generatedCoverArt(track){
 const seed=trackHash(track),hue=seed%360,hue2=(hue+75+(seed%50))%360;
 const pattern=seed%6,white='#f5f1e7';
 const bits=(shift,mask)=>(seed >>> shift)&mask;
 let subject='';
 if(pattern===0){ // Angular sculpture / stained-glass geometry
  const shards=Array.from({length:22},(_,i)=>{
   const angle=i/22*Math.PI*2,radius=75+bits((i%4)*6,47)+i*2;
   const x=Math.round(205+Math.cos(angle)*radius),y=Math.round(216+Math.sin(angle)*radius);
   const mx=Math.round(200+Math.cos(angle+.42)*36),my=Math.round(218+Math.sin(angle+.42)*36);
   return `<path d="M${mx} ${my}L${x} ${y}L${Math.round(x+40*Math.cos(angle+.6))} ${Math.round(y+40*Math.sin(angle+.6))}Z" fill="hsl(${(hue2+i*9)%360} 74% 70%)" fill-opacity="${(.15+(i%4)*.1).toFixed(2)}" stroke="white" stroke-opacity=".23"/>`;
  }).join('');
  subject=`${shards}<path d="M168 85L340 172L272 355L102 287Z" fill="none" stroke="${white}" stroke-width="5" stroke-opacity=".8"/><path d="M168 85L272 355M102 287L340 172" stroke="white" stroke-opacity=".55" stroke-width="2"/>`;
 }else if(pattern===1){ // Soundwave equalizer, music-driven but not a known cover
  const bars=Array.from({length:35},(_,i)=>{
   const x=i*13-12,h=45+(Math.abs(Math.sin(i*.77+seed%10))*205)+bits(i%5*5,15);
   return `<rect x="${x}" y="${Math.round(215-h/2)}" width="8" height="${Math.round(h)}" rx="4" fill="${white}" fill-opacity="${(.3+i%5*.12).toFixed(2)}"/>`;
  }).join('');
  subject=`<path d="M0 217Q60 80 130 218T260 218T420 217" fill="none" stroke="white" stroke-opacity=".3" stroke-width="22"/>${bars}<circle cx="320" cy="110" r="35" fill="none" stroke="white" stroke-opacity=".62" stroke-width="4"/>`;
 }else if(pattern===2){ // Cosmic constellation / orbiting star cluster
  const stars=Array.from({length:49},(_,i)=>{
   const x=(seed>>>((i%4)*7)+i*113)%420,y=((seed>>((i%3)*8))+i*71)%420,r=i%5===0?3:1.2;
   return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${(.3+(i%7)*.09).toFixed(2)}"/>`;
  }).join('');
  subject=`${stars}<circle cx="${230+bits(5,35)}" cy="${178+bits(10,30)}" r="112" fill="hsl(${hue2} 74% 72%)" fill-opacity=".28"/><circle cx="${240+bits(5,35)}" cy="${167+bits(10,30)}" r="106" fill="url(#bg)"/><path d="M44 348Q210 270 390 65" fill="none" stroke="white" stroke-width="3" stroke-dasharray="1 14" stroke-opacity=".6"/>`;
 }else if(pattern===3){ // Botanical / surreal flower geometry
  const leaves=Array.from({length:18},(_,i)=>{
   const a=i*360/18,cx=210+Math.cos(a*Math.PI/180)*65,cy=208+Math.sin(a*Math.PI/180)*65;
   return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="23" ry="105" transform="rotate(${a} ${cx.toFixed(1)} ${cy.toFixed(1)})" stroke="${white}" stroke-opacity=".43" stroke-width="2" fill="hsl(${(hue2+i*8)%360} 75% 67%)" fill-opacity=".24"/>`;
  }).join('');
  subject=`${leaves}<circle cx="210" cy="210" r="35" fill="${white}" fill-opacity=".76"/><circle cx="210" cy="210" r="21" fill="hsl(${hue} 70% 30%)"/>`;
 }else if(pattern===4){ // Layered poster landscape
  const sunX=155+bits(12,100),sunY=100+bits(6,65);
  subject=`<circle cx="${sunX}" cy="${sunY}" r="64" fill="${white}" fill-opacity=".64"/><path d="M-20 310L100 155L175 246L245 122L430 330V430H-20Z" fill="hsl(${hue2} 72% 70%)" fill-opacity=".47"/><path d="M-20 362L126 268L224 330L346 225L440 317V440H-20Z" fill="hsl(${hue} 68% 22%)" stroke="white" stroke-opacity=".35" stroke-width="2"/><path d="M-20 382Q110 335 240 388T440 383" stroke="${white}" fill="none" stroke-width="3" opacity=".45"/>`;
 }else{ // Stylized night city / neon lights
  const towers=Array.from({length:15},(_,i)=>{
   const x=i*30-16,h=80+bits((i%4)*7,95)+(i%5)*18;
   return `<rect x="${x}" y="${420-h}" width="${24+i%3*3}" height="${h}" fill="hsl(${(hue+i*5)%360} 45% 18%)" stroke="white" stroke-opacity=".25"/><path d="M${x+5} ${430-h}v${h-22}m7 -${h-25}v${h-25}" stroke="${white}" stroke-opacity=".31" stroke-width="2" stroke-dasharray="3 10"/>`;
  }).join('');
  subject=`<circle cx="290" cy="116" r="56" fill="${white}" fill-opacity=".58"/>${towers}<path d="M0 377L420 377" stroke="white" stroke-opacity=".65" stroke-width="2"/>`;
 }
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 60% 35%)"/><stop offset="1" stop-color="hsl(${hue2} 65% 13%)"/></linearGradient><radialGradient id="glow"><stop stop-color="hsl(${hue2} 90% 73%)" stop-opacity=".64"/><stop offset="1" stop-color="hsl(${hue} 55% 30%)" stop-opacity="0"/></radialGradient></defs><rect width="420" height="420" fill="url(#bg)"/><ellipse cx="${180+bits(9,65)}" cy="${100+bits(5,80)}" rx="225" ry="260" fill="url(#glow)"/>${subject}<path d="M0 0H420V420H0Z" fill="none" stroke="white" stroke-opacity=".19" stroke-width="18"/></svg>`;
 return 'data:image/svg+xml,'+encodeURIComponent(svg).replace(/'/g,'%27').replace(/\(/g,'%28').replace(/\)/g,'%29');
}
/** Actual thumbnails are sourced from the linked YouTube video, not a scraped album-art catalog. */
export function youtubeThumbnail(videoId){return /^[a-zA-Z0-9_-]{11}$/.test(String(videoId||''))?`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`:null;}
export function coverStyle(track){
 const thumbnail=youtubeThumbnail(track?.videoId);
 const layers=[thumbnail,generatedCoverArt(track)].filter(Boolean);
 return 'background-image:'+layers.map(url=>`url("${url}")`).join(',')+';';
}
export function lineHasForeignScript(text){return /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7a3\u0400-\u04ff\u0600-\u06ff]/u.test(String(text||''));}
export function calibratedOffset(lineStart,videoTime){
 const t=Number(videoTime),start=Number(lineStart);
 return Number.isFinite(t)&&Number.isFinite(start)?Math.max(-120,Math.min(120,Math.round((start-t)*4)/4)):0;
}
// Lyric Lab's relaxed mode scores letters and digits, not punctuation.
// Apostrophes, parentheses, hyphens, quotation marks, and other symbols stay
// visible in the original lyric, but are never required to type.
export const cleanWord = input => String(input ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const sameWord = (a,b) => cleanWord(a) === cleanWord(b) && cleanWord(b).length > 0;
export function parseLRC(lrc, duration=0) {
  const input=String(lrc || '').slice(0,100000);
  const offsetTag=input.match(/^\[offset:\s*(-?\d+)\s*\]/mi);
  const offset=offsetTag ? Number(offsetTag[1])/1000 : 0;
  const found=[];
  for(const row of input.split(/\r?\n/)){
    const regex=/\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/g;
    const times=[...row.matchAll(regex)].map(m=>Math.max(0,Number(m[1])*60+Number(m[2])+Number('0.'+(m[3]||'0').padEnd(2,'0')) + offset));
    if(!times.length) continue;
    const value=row.replace(regex,'').replace(/<\d+:\d+(?:\.\d+)?>/g,'').trim();
    if(!value || !/[\p{L}\p{N}]/u.test(value))continue;
    for(const time of times)found.push({time,text:value});
  }
  found.sort((a,b)=>a.time-b.time);
  const lines=[];
  for(const entry of found){
    if(lines.length && Math.abs(lines[lines.length-1].time-entry.time)<.001 && lines[lines.length-1].text===entry.text)continue;
    const words=(entry.text.match(/\S+/gu) || []).filter(w=>/[\p{L}\p{N}]/u.test(w));
    if(!words.length)continue;
    lines.push({time:entry.time,text:entry.text,words});
  }
  const wordList=[];
  lines.forEach((line,index)=>{
    line.startWord=wordList.length;
    line.words.forEach((word,i)=>wordList.push({word,line:index,index:i,time:line.time}));
    line.endWord=wordList.length;
    line.end=Math.max(line.time+1.5,lines[index+1]?.time ?? (duration || line.time+7));
  });
  return {lines,words:wordList};
}
export function currentLineAt(lines,time) {
  if(!lines?.length)return 0;
  let lo=0,hi=lines.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(lines[mid].time<=time)lo=mid+1;else hi=mid;}
  return Math.max(0,lo-1);
}
export function expectedWordsAt(lines,time) {
  if(!lines?.length || time < lines[0].time)return 0;
  const i=currentLineAt(lines,time),line=lines[i];
  const dur=Math.max(1,line.end-line.time);
  const progress=Math.min(1,Math.max(0,(time-line.time)/dur));
  return Math.min(line.endWord, line.startWord+Math.floor(line.words.length*progress));
}
export function scoreRun({correct=0,attempts=0,skipped=0,characters=0,elapsed=0,bestStreak=0}={}){
  const wpm=elapsed>0 ? Math.round(characters/5/(elapsed/60)) : 0;
  const total=attempts+skipped;
  const accuracy=total ? Math.round(correct/total*100) : 100;
  return {wpm:Math.max(0,Math.min(999,wpm)),accuracy,correct,attempts,bestStreak,points:Math.round(correct*25*accuracy/100 + bestStreak*10)};
}
export function featuredFor(track){
  const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  return FEATURED_SONGS.find(item=>normalize(item.title)===normalize(track?.trackName||track?.title) && normalize(item.artist)===normalize(track?.artistName||track?.artist))||null;
}
/** LRCLIB offers CORS, documented client identification and no access key. */
export async function searchTimedLyrics(query,{fetcher=fetch,signal}={}){
  if(!String(query||'').trim())return [];
  const url='https://lrclib.net/api/search?q='+encodeURIComponent(String(query).trim().slice(0,110));
  const response=await fetcher(url,{headers:{'Lrclib-Client':'KEYSTORIA Lyric Lab/0.24 (local project; github.com)'},signal});
  if(response.status===429)throw new Error(`Lyric search rate-limited. Please retry after ${response.headers?.get('Retry-After')||'a short break'} seconds.`);
  if(!response.ok)throw new Error('The lyric service could not be reached. Try again in a moment.');
  const rows=await response.json();
  if(!Array.isArray(rows))return [];
  return rows.filter(x=>x && !x.instrumental && typeof x.syncedLyrics==='string' && x.syncedLyrics.includes('['))
     .slice(0,20).map(x=>({id:x.id,trackName:String(x.trackName||x.name||''),artistName:String(x.artistName||''),albumName:String(x.albumName||''),duration:Number(x.duration)||0,syncedLyrics:x.syncedLyrics,videoId:featuredFor(x)?.videoId||null}));
}
