/** Local-only cinematic navigation. Reached scenes only; no server authority. */
import { safe, pad } from './helpers.js';
import { SCENE_BEATS } from './scene-narratives.js';
import { renderSceneSVG } from './scene-illustrations.js';
import { currentShot } from './cinematic-storyboards.js';

export function reachedReelStep(room){
 if(room?.phase==='won')return 11;
 if(!room)return 0;
 const fallback=(room.stage===2?5:0)+(Number.isInteger(room.progress)?Math.max(0,room.progress):0);
 const count=Number.isInteger(room.objectivesComplete)?room.objectivesComplete:fallback;
 return Math.max(0,Math.min(10,count));
}
export function reelFrame(room,index){
 const limit=reachedReelStep(room);
 const step=Math.max(0,Math.min(limit,Number.isInteger(index)?index:0));
 const beats=SCENE_BEATS[room?.mission]||SCENE_BEATS.station;
 return {step,limit,title:beats[step][0],narrative:beats[step][1],dialogue:currentShot(room,step).dialogue,act:step<=5?'ACT I / THE DISCOVERY':'ACT II / THE RESCUE'};
}
export function storyReelTemplate(room){
 const frame=reelFrame(room,0);
 return `<section class="story-reel" aria-label="Replay reached mission scenes" data-reel-index="0">
    <div class="story-reel-heading"><div><span>// AFTER ACTION STORY REEL</span><h2>WATCH YOUR MISSION UNFOLD</h2><p>${room.phase==='won'?'Revisit all twelve scenes.':'Revisit only the scenes your squad reached; later story developments stay hidden until you reach them.'} This visual recap does not change your result.</p></div><strong id="reel-counter">01 / ${pad(frame.limit+1)}</strong></div>
    <div class="story-reel-camera" id="reel-camera" role="img" aria-label="${safe(frame.title)}">${renderSceneSVG(room,0,false)}</div>
    <div class="story-reel-text" role="status" aria-atomic="true"><strong id="reel-title">${safe(frame.title)}</strong><p id="reel-narrative">${safe(frame.narrative)}</p><small id="reel-dialogue">${safe(frame.dialogue)}</small></div>
    <div class="story-reel-navigation"><button type="button" data-action="reel-prev" id="reel-prev" disabled>← PREVIOUS SCENE</button><span id="reel-act">${frame.act}</span><button type="button" data-action="reel-next" id="reel-next" ${frame.limit===0?'disabled':''}>NEXT SCENE →</button></div>
    <div class="story-reel-chapters" role="group" aria-label="Jump to a reached scene">${Array.from({length:12},(_,i)=>`<button type="button" data-action="reel-jump" data-index="${i}" aria-label="Scene ${i+1}${i>frame.limit?', not reached':''}" ${i===0?'aria-current="step"':''} ${i>frame.limit?'disabled':''}>${pad(i+1)}</button>`).join('')}</div>
  </section>`;
}
export function jumpStoryReel(room,index){
 const reel=document.querySelector('.story-reel');
 if(!room||!reel||!Number.isInteger(index)||index<0||index>reachedReelStep(room))return;
 const frame=reelFrame(room,index);
 if(Number(reel.dataset.reelIndex)===frame.step)return;
 reel.dataset.reelIndex=String(frame.step);
 const art=document.getElementById('reel-camera');
 if(art){
   art.innerHTML=renderSceneSVG(room,frame.step,false);
   art.setAttribute('aria-label',frame.title);
 }
 for(const [id,value] of [['reel-counter',pad(frame.step+1)+' / '+pad(frame.limit+1)],['reel-title',frame.title],['reel-narrative',frame.narrative],['reel-dialogue',frame.dialogue],['reel-act',frame.act]]){
  const el=document.getElementById(id);if(el)el.textContent=value;
 }
 reel.querySelectorAll('[data-action="reel-jump"]').forEach(button=>{
  if(Number(button.dataset.index)===frame.step)button.setAttribute('aria-current','step');
  else button.removeAttribute('aria-current');
 });
 document.getElementById('reel-prev').disabled=frame.step===0;
 document.getElementById('reel-next').disabled=frame.step===frame.limit;
}
export function moveStoryReel(room,direction){
 const reel=document.querySelector('.story-reel');
 if(!room||!reel||![-1,1].includes(direction))return;
 jumpStoryReel(room,(Number(reel.dataset.reelIndex)||0)+direction);
}
