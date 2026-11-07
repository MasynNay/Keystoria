/** Optional after-action replay of the 12 authored story states.
 * No mission authority, scores, or timing live here. Navigation is local-only.
 */
import { safe, pad } from './helpers.js';
import { SCENE_BEATS } from './scene-narratives.js';
import { renderSceneSVG } from './scene-illustrations.js';
import { currentShot } from './cinematic-storyboards.js';

const clamp = index => Math.max(0,Math.min(11,index));

export function storyReelTemplate(room) {
  const beats = SCENE_BEATS[room.mission] || SCENE_BEATS.station;
  const shot = currentShot(room,0);
  return `<section class="story-reel" aria-label="Replay the mission story" data-reel-index="0">
    <div class="story-reel-heading"><div><span>// AFTER ACTION STORY REEL</span><h2>WATCH YOUR MISSION UNFOLD</h2><p>Revisit the scenes you played. This is a visual recap; it does not change your result.</p></div><strong id="reel-counter">01 / 12</strong></div>
    <div class="story-reel-camera" id="reel-camera" role="img" aria-label="${safe(beats[0][0])}">${renderSceneSVG(room,0,false)}</div>
    <div class="story-reel-text"><strong id="reel-title">${safe(beats[0][0])}</strong><p id="reel-narrative">${safe(beats[0][1])}</p><small id="reel-dialogue">${safe(shot.dialogue)}</small></div>
    <div class="story-reel-navigation"><button type="button" data-action="reel-prev" id="reel-prev" disabled>← PREVIOUS SCENE</button><span id="reel-act">ACT I / BEGINNING</span><button type="button" data-action="reel-next" id="reel-next">NEXT SCENE →</button></div>
  </section>`;
}

export function moveStoryReel(room,direction) {
  const reel=document.querySelector('.story-reel');
  if (!room || !reel || ![-1,1].includes(direction)) return;
  const next=clamp((Number(reel.dataset.reelIndex)||0)+direction);
  reel.dataset.reelIndex=String(next);
  const [title,narrative]=(SCENE_BEATS[room.mission] || SCENE_BEATS.station)[next];
  const shot=currentShot(room,next);
  const art=document.getElementById('reel-camera');
  if(art){
    art.innerHTML=renderSceneSVG(room,next,false);
    art.setAttribute('aria-label',title);
    art.classList.remove('reel-cut');void art.offsetWidth;art.classList.add('reel-cut');
  }
  for (const [id,value] of [
    ['reel-counter',`${pad(next+1)} / 12`], ['reel-title',title],
    ['reel-narrative',narrative], ['reel-dialogue',shot.dialogue],
    ['reel-act',next<=5 ? 'ACT I / THE DISCOVERY' : 'ACT II / THE RESCUE']]) {
    const el=document.getElementById(id);if(el)el.textContent=value;
  }
  document.getElementById('reel-prev').disabled=next===0;
  document.getElementById('reel-next').disabled=next===11;
}
