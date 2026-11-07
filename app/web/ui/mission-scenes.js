/** Live scene orchestration. Scene art and narrative are presentation only. */
import { safe, pad } from './helpers.js';
import { SCENE_BEATS } from './scene-narratives.js';
import { renderSceneSVG } from './scene-illustrations.js';
import { currentShot } from './cinematic-storyboards.js';
import { fieldControlsTemplate, updateFieldControls } from './field-controls.js';

export function sceneStep(room) {
  return Math.min(11, (room.stage===1 ? 0 : 5) + Math.max(0,room.progress));
}
export function sceneStory(room) {
  return (SCENE_BEATS[room.mission]||SCENE_BEATS.station)[sceneStep(room)];
}
/** Preserve earlier decisions in the story even after a role swap. */
export function interventionTimeline(room) {
  const history = room.fieldOps?.history || [];
  if (!history.length) return '';
  return `<div class="field-history-inline">${history.map(entry => `<div><span>ACT ${entry.stage} · ${safe(entry.operator)}</span><strong>${safe(entry.label)}</strong><p>${safe(entry.outcome)}</p></div>`).join('')}</div>`;
}

/** Same story, but the camera dialogue acknowledges each player's assigned job.
 * Defender threats rotate independently from scripted hacker actions.
 */
export function roleStoryShot(room,step){
  const shot=currentShot(room,step);
  if(room.role!=='defender') return shot;
  const detail=room.target?.explanation || 'Protect the crew while your teammate completes the next story objective.';
  const clipped=detail.length>108?`${detail.slice(0,105).trimEnd()}…`:detail;
  return {...shot,cast:'DEFENSE / LIVE COUNTERMEASURE',dialogue:`Defender: ${clipped}`};
}
export function missionScene(room) {
  const step=sceneStep(room);
  const [title,description]=sceneStory(room);
  const danger=room.worldWarning || room.crisisActive;
  const shot=roleStoryShot(room,step);
  return `<section class="mission-cinema" id="mission-cinema" aria-label="Illustrated live mission scene" data-scene-step="${step}">
    <div class="cinema-topline"><span>◉ LIVE STORY VIEW</span><span id="cinema-status" class="${danger?'cinema-alert':''}">${danger?'DANGER // ACT NOW':'MISSION IN PROGRESS'}</span></div>
    <div class="cinema-art" id="cinema-art" role="img" aria-label="${safe(title)}">${renderSceneSVG(room,step,danger)}<span class="scene-camera-glow" aria-hidden="true"></span><div class="cinema-shot-dialogue"><p id="cinema-dialogue">${safe(shot.dialogue)}</p><span>LIVE CUT ${pad(step+1)}/11</span></div></div>
    <div class="scene-live-stats" role="group" aria-label="Live mission completion"><span>◉ EXTRACTION TELEMETRY</span><strong id="scene-rescue-status">${room.objectivesComplete ?? 0} OF ${room.objectivesTotal ?? 11} ACTIONS COMPLETE</strong><strong id="scene-rescue-pct">${room.overallProgress ?? 0}%</strong></div>
    <div class="scene-live-progress" id="scene-live-progress" role="progressbar" aria-label="Mission objectives completed" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${room.overallProgress ?? 0}"><span id="scene-live-progress-bar" style="width:${room.overallProgress ?? 0}%"></span></div>
    <div class="cinema-storyline"><strong id="cinema-shot-role">${safe(shot.cast)}</strong><span id="cinema-action-status">ACTION READY · 0%</span></div>
    <div class="cinema-summary"><span id="cinema-progress">SCENE ${pad(step+1)} / 12</span><strong id="cinema-title">${safe(title)}</strong><p id="cinema-description">${safe(description)}</p></div>
    <div class="cinema-progress-track" aria-hidden="true">${Array.from({length:11},(_,i)=>`<span class="${i<step?'seen':''}"></span>`).join('')}</div>
    <div class="scene-operations-bar" aria-label="Live environment condition and emergency controls">
      <div class="scene-environment"><span id="scene-env-label">${safe(room.world?.label || 'WORLD CONDITION')}</span>
        <strong id="scene-env-value">${room.ambient ?? 0} / 100</strong>
        <div class="scene-env-track" role="progressbar" id="scene-env-track" aria-label="Environment condition" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${room.ambient ?? 0}"><i id="scene-env-fill" style="width:${room.ambient ?? 0}%"></i></div>
      </div>
      <button type="button" id="field-jump" data-action="jump-field" class="field-jump ${room.fieldOps?.available ? 'ready':''}" ${room.fieldOps?.available ? '' : 'disabled'}>${room.fieldOps?.available ? '◉ CHOOSE EMERGENCY ACTION ↓' : room.fieldOps?.used ? '✓ ACTION COMMITTED' : '◌ CONTROLS UNLOCK AFTER 1 ACTION'}</button>
    </div>
    <div id="field-story-log" class="field-story-log" aria-live="polite">${interventionTimeline(room)}</div>
    ${fieldControlsTemplate(room)}
  </section>`;
}
export function updateMissionScene(room) {
  const host=document.getElementById('mission-cinema');
  if (!host) return;
  updateFieldControls(room);
  const fieldButton = document.getElementById('field-jump');
  if (fieldButton) {
    const enabled = Boolean(room.fieldOps?.available);
    fieldButton.disabled = !enabled;
    fieldButton.classList.toggle('ready', enabled);
    fieldButton.textContent = enabled ? '◉ CHOOSE EMERGENCY ACTION ↓' : room.fieldOps?.used ? '✓ ACTION COMMITTED' : '◌ CONTROLS UNLOCK AFTER 1 ACTION';
  }
  const envValue = Math.min(100, Math.max(0, room.ambient ?? 0));
  const envTrack = document.getElementById('scene-env-track');
  if (envTrack) envTrack.setAttribute('aria-valuenow', String(envValue));
  const envLabel = document.getElementById('scene-env-label');
  if (envLabel) envLabel.textContent = room.world?.label || 'WORLD CONDITION';
  const envReadout = document.getElementById('scene-env-value');
  if (envReadout) envReadout.textContent = `${envValue} / 100`;
  const envFill = document.getElementById('scene-env-fill');
  if (envFill) envFill.style.width = `${envValue}%`;
  if (envTrack) envTrack.classList.toggle('environment-danger', Boolean(room.worldWarning));
  const timeline = document.getElementById('field-story-log');
  const historyKey = (room.fieldOps?.history || []).map(entry=>`${entry.stage}:${entry.label}`).join('|');
  if (timeline && timeline.dataset.key !== historyKey) {
    timeline.dataset.key = historyKey;
    timeline.innerHTML = interventionTimeline(room);
  }
  const step=sceneStep(room), danger=Boolean(room.worldWarning||room.crisisActive);
  const rescue=document.getElementById('scene-rescue-status');
  if(rescue) rescue.textContent=`${room.objectivesComplete ?? 0} OF ${room.objectivesTotal ?? 11} ACTIONS COMPLETE`;
  const percentage = Math.min(100, Math.max(0, room.overallProgress ?? 0));
  const progress = document.getElementById('scene-live-progress');
  if(progress) progress.setAttribute('aria-valuenow', String(percentage));
  const bar = document.getElementById('scene-live-progress-bar');
  if(bar) bar.style.width = `${percentage}%`;
  const pct = document.getElementById('scene-rescue-pct');
  if(pct) pct.textContent = `${percentage}%`;

  const status=document.getElementById('cinema-status');
  if(status){status.textContent=danger?'DANGER // ACT NOW':'MISSION IN PROGRESS';status.classList.toggle('cinema-alert',danger);}
  const action = room.fieldOps?.selected || "";
  const targetId=room.target?.id || "";
  const ambient = room.ambient ?? 0;
  // Ambient pressure changes frequently. Updating CSS variables avoids
  // rebuilding the SVG and restarting every animation on each server tick.
  host.style.setProperty('--world-pressure', String(Math.max(0,Math.min(1,ambient/100))));
  if (Number(host.dataset.sceneStep)===step && host.dataset.danger===String(danger) && host.dataset.action === action && host.dataset.targetId === targetId) return false;
  const previousStep=Number(host.dataset.sceneStep);
  host.dataset.sceneStep=String(step);host.dataset.danger=String(danger);host.dataset.action=action;host.dataset.targetId=targetId;
  const [title,description]=sceneStory(room);
  const art=document.getElementById('cinema-art');
  if (art) {
    // Keep the dialogue within the scene instead of increasing cockpit height.
    art.innerHTML=renderSceneSVG(room,step,danger) + '<span class="scene-camera-glow" aria-hidden="true"></span>' +
      `<div class="cinema-shot-dialogue"><p id="cinema-dialogue">${safe(roleStoryShot(room,step).dialogue)}</p><span>LIVE CUT ${pad(step+1)}/11</span></div>`;
    art.setAttribute('aria-label',title);
  }
  const speaker=document.getElementById('cinema-shot-role');
  if (speaker) speaker.textContent=roleStoryShot(room,step).cast;
  const actionStatus=document.getElementById('cinema-action-status');
  if (actionStatus) actionStatus.textContent='ACTION READY · 0%';
  for (const [id,value] of [['cinema-progress',`SCENE ${pad(step+1)} / 12`],['cinema-title',title],['cinema-description',description]]) {
    const el=document.getElementById(id);if(el)el.textContent=value;
  }
  host.querySelectorAll('.cinema-progress-track span').forEach((item,i)=>item.classList.toggle('seen',i<step));
  host.classList.remove('cinema-change');void host.offsetWidth;host.classList.add('cinema-change');
  // Keep the story window purely visual. When the squad advances,
  // celebrate with light/camera motion instead of more words appearing.
  if(Number.isFinite(previousStep) && previousStep < step && art){
    art.classList.remove('cinema-scene-complete');
    void art.offsetWidth;
    art.classList.add('cinema-scene-complete');
    setTimeout(()=>art.isConnected && art.classList.remove('cinema-scene-complete'),900);
  }
  return true;
}
