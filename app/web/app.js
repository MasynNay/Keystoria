import { LESSONS, matchesCommand, saveLesson, randomizedCourseOrder, activeCommandIndex } from "./ui/lessons.js";
import { readAcademyCheckpoint, saveAcademyCheckpoint, clearAcademyCheckpoint, readAcademyCheckpoints, clearAllAcademyCheckpoints } from "./ui/academy-checkpoint.js?v=0.1.1";
import { trainingTemplate } from "./ui/training-view.js?v=0.50.1";
import { speedTemplate, speedInsightsPanel, speedHistoryPanel } from "./ui/speed-view.js?v=0.48.4";
import { createSpeedController } from "./ui/speed-controller.js?v=0.48.6";
import { readAccuracyGoal, saveAccuracyGoal, clearSpeedResults, exportSpeedResults, parseSpeedHistoryExport, restoreSpeedHistory, SPEED_IMPORT_MAX_BYTES } from "./ui/speed-insights.js?v=0.48.4";
import { readSpeedHistory } from "./ui/speed-engine.js";
import { createLyricLabController } from "./ui/lyric-lab-controller.js?v=0.53.0";
import { paintTypingFeedback } from "./ui/typing-feedback.js?v=0.2.1";
import { sound, toggleSound, isSoundOn } from "./sound.js";
import { MISSIONS } from "./ui/missions.js";
import { updateMissionScene } from "./ui/mission-scenes.js";
import { setCinematicTypingProgress } from "./ui/cinematic-cuts.js?v=0.1.1";
import { moveStoryReel } from "./ui/story-reel.js";
import { deploymentDisplay } from "./ui/deployment.js";
import { safe, norm, timeString, pad, ico, tag } from "./ui/helpers.js";
import { createViews } from "./ui/views.js?v=0.2.0";
import { describeSessionRecovery } from "./ui/session-recovery.js";
import { recordResult } from "./ui/progression.js";
import { loadPreferences, savePreferences, applyPreferences } from "./ui/preferences.js";
import { THEMES, THEME_IDS } from "./ui/themes.js";
import { setupMobileTyping, patchMobileTraining, MOBILE_TYPING_MEDIA } from "./ui/mobile-typing.js?v=0.50.1";
import { createPerformanceCheck } from "./ui/performance-check.js?v=0.4.0";

/** All gameplay authority lives on the server. This module only renders UI. */
const $ = (selector) => document.querySelector(selector);
const app = $("#app");
setupMobileTyping(app);
const performanceCheck=createPerformanceCheck();
const params = new URLSearchParams(location.search);
const savedName = localStorage.getItem("panic.callsign") || "";
const state = {
  socket: null, online: false, room: null, token: null, selectedMission: "station", missionsExpanded: false,
  nickname: savedName, modal: params.has("room") || params.get("demo") === "1" ? null : "welcome", layout: "", targetId: null, pending: false,
  autoStart: false, reconnectTimer: null, disconnectedAt: 0, retryAttempt: 0,
  reconnectPending: false, recovery: null,
  renderedTargetSignature: "",
  lobbySignature: "", logSignature: "", progressSignature: "",
  preferences: loadPreferences(), inviteCode: params.get("room") || "",
  lesson: null, speed: null, lyric: false, clueSignature: "", storySignature: "", choiceAlertSignature: "",
};

applyPreferences(state.preferences);
const { homeTemplate, modalTemplate, lobbyTemplate, briefingTemplate, countdownTemplate, gameTemplate, resultsTemplate, header } = createViews(state);

function setTheme(id) {
  document.body.dataset.theme = id;
  state.selectedMission = id;
}

function toast(message, kind="info") {
  const layer = $("#toast-layer");
 if(layer.children.length >= 4) layer.firstElementChild?.remove();
 const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.innerHTML = `${ico(kind === "error" ? "alert" : "check", 17)}<span>${safe(message)}</span>`;
  layer.appendChild(el);
  setTimeout(() => { el.classList.add("leaving"); setTimeout(() => el.remove(), 250); }, 3200);
}

function updateText(id, text) { const node = document.getElementById(id); if(node) node.textContent = text; }
function updateGame(r) {
 const self = r.players.find(p=>p.id===r.viewerId);
 const ally = r.players.find(p=>p.id!==r.viewerId);
 updateText("hud-time",timeString(r.remaining));
 updateText("current-objective",r.currentObjective);
 updateText("current-instructions",r.role === "hacker" ? r.missionInfo.briefing.hacker : r.missionInfo.briefing.defender);
 updateText("step-explanation", r.target?.explanation || (r.role === "hacker" ? "Your teammate is clearing the path for your next action." : "Watch for the next incoming threat."));
 if (r.mission === "casefile") {
   const signature = r.discovered.join("|");
   if (signature !== state.clueSignature) {
     const clues = $("#clue-list");
     if (clues) clues.innerHTML = r.discovered.length ? r.discovered.map(clue=>`<div>${safe(clue)}</div>`).join("") : "<p>Investigate records to discover your first clue.</p>";
     updateText("clue-count", `${r.discovered.length} CLUES`);
     state.clueSignature = signature;
   }
 }
 updateText("hud-integrity-num",`${r.stability}%`);
 updateText("hud-score",r.players.reduce((s,p)=>s+p.score,0).toLocaleString());
 updateText("progress-caption",`${pad(r.progress)} / ${pad(r.stageGoal)}`);
 updateText("extraction-text",`${r.objectivesComplete} / ${r.objectivesTotal} OBJECTIVES SECURED`);
 updateText("extraction-message",r.stage===1?`ACT I — ${Math.max(0,5-r.progress)} OBJECTIVES UNTIL ROLE SWAP`:`ACT II — ${Math.max(0,11-r.objectivesComplete)} OBJECTIVES UNTIL EXTRACTION`);
 const extractionFill=$("#extraction-fill"); if(extractionFill) extractionFill.style.width=`${r.overallProgress}%`;

 updateText("threat-name",r.threatName||"SCANNING...");
 updateText("threat-clock",r.threatName?`${r.threatSeconds.toFixed(1)}s`:"--.-s");
 updateText("signal-charge",`${r.syncCharge} / 4`);
 updateText("world-amount",`${r.ambient} / 100`);
 updateText("world-status",r.worldWarning?r.world.warningText:r.world.intro);
 updateText("story-moment",r.storyMoment || r.missionInfo.briefing.stageObjectives[r.stage-1]);
 const sceneRebuilt=updateMissionScene(r);
 const world = $("#world-console"); if(world)world.classList.toggle("world-danger",r.worldWarning);
 const worldTrack = $("#world-track"); if(worldTrack) worldTrack.style.width=`${r.ambient}%`;
 const tacticPanel = $("#tactic-panel");
 if(tacticPanel) {
   tacticPanel.hidden = !r.tacticActive;
   tacticPanel.classList.toggle("choice-required", r.tacticActive && r.role === "hacker" && !r.tacticChoice);
   if(r.tacticActive){
     const actions=$("#tactic-actions");
     const signature=JSON.stringify([r.tacticChoice,r.role,r.tacticOptions]);
     if(actions && actions.dataset.signature!==signature){
       actions.dataset.signature=signature;
       if(r.tacticChoice){
         actions.innerHTML=`<div class="tactic-wait">${r.role==="hacker"?"Plan sent. Your defender is executing it.":"Execute the highlighted countermeasure below to unlock the objective."}</div>`;
       } else if(r.role==="hacker"){
         actions.innerHTML=r.tacticOptions.map(option=>`<button data-action="tactic" data-choice="${safe(option.id)}"><strong>${safe(option.label)}</strong><span>${safe(option.description)}</span></button>`).join("");
       } else actions.innerHTML='<div class="tactic-wait">Your hacker is choosing a plan. Keep defending until orders arrive.</div>';
     }
   }
 }
 // Bring the decision into view once, without chasing the viewport on every tick.
 const choiceKey = r.tacticActive && !r.tacticChoice && r.role === "hacker" ? `tactic-${r.stage}`
   : r.accusationActive && r.role === "hacker" ? `accusation-${r.stage}` : "";
 if (choiceKey && state.choiceAlertSignature !== choiceKey) {
   state.choiceAlertSignature = choiceKey;
   if (typeof requestAnimationFrame === 'function') requestAnimationFrame(()=>{
     const panel = choiceKey.startsWith('tactic') ? $("#tactic-panel") : $("#accusation-panel");
     panel?.scrollIntoView({behavior:'smooth',block:'center'});
     panel?.querySelector('button:not([disabled])')?.focus({preventScroll:true});
   });
 } else if (!choiceKey) state.choiceAlertSignature = "";
 const accusationPanel = $("#accusation-panel");
 if (accusationPanel) {
   accusationPanel.hidden = !r.accusationActive;
   accusationPanel.classList.toggle("choice-required",r.accusationActive && r.role === "hacker");
   if (r.accusationActive) {
     const actions=$("#accusation-options");
     const signature=JSON.stringify([r.role,r.suspects,r.accusationAttempts]);
     if (actions && actions.dataset.signature!==signature) {
       actions.dataset.signature=signature;
       actions.innerHTML=r.role==="hacker" ? r.suspects.map(suspect=>`<button data-action="accuse" data-suspect="${safe(suspect.id)}"><strong>${safe(suspect.name)}</strong><span>${safe(suspect.role)}</span><small>${safe(suspect.detail)}</small></button>`).join("") : `<div class="tactic-wait">Your investigator is studying the evidence. Keep the case files protected from incoming attacks.</div>`;
     }
     updateText("accusation-attempts",`${r.accusationAttempts} ACCUSATION${r.accusationAttempts===1?"":"S"} MADE`);
   }
 }
 const pulseButton = $("#pulse-button");
 if (pulseButton) pulseButton.disabled = !r.syncReady || r.paused;
 const segments = $("#signal-segments");
 if (segments) segments.innerHTML = Array.from({length:4},(_,i)=>`<i class="${i<r.syncCharge?"charged":""}"></i>`).join("");
 const crisis = $("#crisis-banner");
 if (crisis) {
   crisis.hidden = !r.crisisActive;
   crisis.textContent = r.crisisActive ? (r.role === "hacker" ? `CRITICAL LOCKDOWN // Waiting for your partner to stop ${r.crisisName}.` : `CRITICAL INCIDENT // ${r.crisisName}. Clear this threat to restore your partner's access!`) : "";
 }
 updateText("self-score",self.score.toLocaleString());updateText("self-streak",`${self.streak}×`);
 updateText("ally-score",ally.score.toLocaleString());updateText("ally-streak",`${ally.streak}×`);
 updateText("ally-status",ally.connected?"● ONLINE":"○ OFFLINE");
 updateText("header-status",r.paused?"WAITING FOR PARTNER":"CONNECTED");
 updateText("mission-net",r.paused?"RECONNECTING":"CONNECTED");
 $("#hud-integrity-bar")?.style.setProperty("width",`${r.stability}%`);
 $("#threat-bar")?.style.setProperty("width",`${Math.max(0,Math.min(100,r.threatSeconds/r.threatTotal*100))}%`);
 // Snapshots arrive four times per second; stable panels need no DOM churn.
 const progressSignature = `${r.stage}/${r.progress}/${r.stageGoal}`;
 if (state.progressSignature && progressSignature !== state.progressSignature && !r.paused && r.progress > 0) {
   const callout=$("#mission-beat");
   if(callout) { callout.textContent=`OBJECTIVE SECURED · ${r.objectivesComplete}/${r.objectivesTotal}`; callout.classList.remove("beat-show"); void callout.offsetWidth; callout.classList.add("beat-show"); }
 }

 if (progressSignature !== state.progressSignature) {
   const blocks = $("#progress-blocks");
   if (blocks) blocks.innerHTML = Array.from({length:r.stageGoal},(_,i)=>`<span class="${i<r.progress?"filled":""}"></span>`).join("");
   state.progressSignature = progressSignature;
 }
 const logSignature = r.logs.map(event=>event.id).join("|");
 if (logSignature !== state.logSignature) {
   const events = $("#activity-list");
   if (events) events.innerHTML = r.logs.map((event,i)=>`<div class="event-row ${event.kind}"><span>${i===0?"▸":"·"}</span><p>${safe(event.message)}</p></div>`).join("");
   state.logSignature = logSignature;
 }
 const field = $("#task-input");
 if (!field) return;
 const nextId = r.target?.id || null;
 if (nextId !== state.targetId) {
   if (state.targetId && nextId) sound("success");
   state.targetId=nextId;state.pending=false;field.value="";
   field.disabled=false;
   if (nextId && !r.paused && document.activeElement !== field) field.focus({preventScroll:true});
 }
 field.disabled = !nextId || r.paused;
 field.placeholder = r.paused?"Waiting for your teammate...":nextId?"start typing here...":r.tacticActive?"Your squad is resolving a tactical decision...":r.crisisActive?"Your partner must clear the critical threat...":"Waiting for next signal...";
 updateText("command-index", r.role==="hacker"?`SEQ // ${pad(r.progress+1)}`:`HOSTILE // ACTIVE`);
 const signature = `${r.target?.id || "none"}|${field.value}`;
 if(signature !== state.renderedTargetSignature || sceneRebuilt) {
   updateTarget(field.value,r.target?.text||"");
   setCinematicTypingProgress(r, field.value);
   state.renderedTargetSignature = signature;
 }
 const overlay = $("#game-overlay");
 if (overlay) overlay.innerHTML = r.paused ? `<div class="in-game-overlay"><div class="overlay-panel">${tag("SIGNAL INTERRUPTED")}<h2>WAITING FOR PARTNER.</h2><p>Your mission is paused for up to 90 seconds while your teammate reconnects.</p><div class="overlay-loader"></div></div></div>` : "";
}

function updateTarget(typed, text) {
 const node = $("#target-text");
 if (!node) return;
 if (!text) { node.textContent = "SCANNING FOR SIGNAL..."; return; }
 const feedback = paintTypingFeedback(node, text, typed, {caseSensitive:false});
 $("#task-input")?.classList.toggle("input-wrong", feedback.incorrect > 0);
 updateText("live-typing-accuracy", `${feedback.percent}% ACCURATE`);
}

// Local practice has its own lifecycle and never touches room authority.
const lyricController=createLyricLabController({state,onRender:()=>{state.layout="";render();}});
const speedController=createSpeedController({
  state,
  onRender:()=>{state.layout="";render();},
  playSound:sound,
});
// Preserve the timer when a mobile device locks or the tab is backgrounded.
// Returning requires an explicit action: never restart a clock behind the user.
document.addEventListener('visibilitychange',()=>speedController.onVisibilityChange());
window.addEventListener('pagehide',()=>speedController.onPageHide());

let speedImportGeneration=0;
async function restoreSpeedFile(field) {
  const file=field.files?.[0];
  field.value=''; // Allow choosing the same file again after cancel/error.
  if(!state.speed || !file)return;
  const activeSession=state.speed;
  const generation=++speedImportGeneration;
  // A file read can finish after leaving Speed Lab, starting another drill,
  // or choosing a newer export. Only the latest still-mounted picker may act.
  const isCurrent=()=>generation===speedImportGeneration
    && state.speed===activeSession && field.isConnected;
  try {
  if(file.size>SPEED_IMPORT_MAX_BYTES) {
    toast("Import file exceeds the 128 KB safety limit.","error"); return;
  }
  let records;
  try { records=parseSpeedHistoryExport(await file.text()); }
  catch(error) {
    if(isCurrent())toast(error instanceof Error ? error.message : "Could not read that export.","error");
    return;
  }
  if(!isCurrent())return;
  const previous=readSpeedHistory().length;
  if(!window.confirm("Replace "+previous+" saved Speed Lab result(s) with "+records.length+" from this export? Export your current results first if you want a backup.")) return;
  if(!isCurrent())return;
  if(!restoreSpeedHistory(records)) { toast("Could not save imported results on this device.","error"); return; }
  refreshSpeedInsights();
  toast("Restored "+records.length+" Speed Lab result(s) on this device.");
  } finally {
    // Never steal focus from a newer import, drill, or navigation target.
    if(isCurrent())
      document.querySelector('[data-action="speed-import"]')?.focus({preventScroll:true});
  }
}

function refreshSpeedInsights() {
  if(!state.speed)return;
  const pulse=document.getElementById("speed-practice-insights");
  if(pulse){
    // Keep the live status, file picker and focusable goal buttons mounted.
    // Replacing the entire panel discards the focused button and makes screen
    // readers miss updates to a newly inserted role=status element.
    const host=document.createElement("div");
    host.innerHTML=speedInsightsPanel(state.speed);
    const next=host.firstElementChild;
    if(next){
      pulse.dataset.matches=next.dataset.matches;
      for(const selector of [".speed-insight-scope",".speed-insight-stats",".speed-insight-qualified",".speed-insight-next",".speed-week-activity"]){
        const current=pulse.querySelector(selector);
        const updated=next.querySelector(selector);
        if(current&&updated){
          if(current.innerHTML!==updated.innerHTML)current.innerHTML=updated.innerHTML;
          // The activity container retains its identity while restoring,
          // clearing or saving runs; only its bounded seven-day snapshot moves.
          if(selector===".speed-week-activity"){
            current.dataset.activeDays=updated.dataset.activeDays;
            current.dataset.savedRuns=updated.dataset.savedRuns;
          }
        }
      }
      const previousTrail=pulse.querySelector(".speed-insight-trail");
      const nextTrail=next.querySelector(".speed-insight-trail");
      if(previousTrail&&nextTrail)previousTrail.replaceWith(nextTrail);
      else if(previousTrail)previousTrail.remove();
      else if(nextTrail)pulse.querySelector(".speed-insight-tip")?.before(nextTrail);
      for(const button of pulse.querySelectorAll('[data-action="speed-goal"]')){
        const updated=next.querySelector('[data-action="speed-goal"][data-goal="'+button.dataset.goal+'"]');
        if(updated)button.setAttribute("aria-pressed",updated.getAttribute("aria-pressed"));
      }
      const status=pulse.querySelector(".speed-insight-tip");
      const updatedStatus=next.querySelector(".speed-insight-tip");
      if(status&&updatedStatus&&status.textContent!==updatedStatus.textContent)
        status.textContent=updatedStatus.textContent;
    }
  }
  const history=document.getElementById("speed-history-panel");
  if(history)history.innerHTML=speedHistoryPanel();
}

function render() {
 const r = state.room;
 if (r && document.body.dataset.theme !== r.mission) setTheme(r.mission);
 const layout = state.lyric ? "lyric" : state.speed ? "speed" : state.lesson ? "training" : !r ? "home" : r.phase === "lobby" ? "lobby" : r.phase === "briefing" ? "briefing" : r.phase === "countdown" || r.phase === "armed" ? r.phase : r.phase === "switching" ? "switching" : ["won","lost"].includes(r.phase) ? "results" : `game-${r.stage}-${r.role}`;
 if (layout !== state.layout) {
   state.layout=layout;
   if (r) setTheme(r.mission); else setTheme(state.selectedMission);
   if (layout === "home") app.innerHTML=homeTemplate();
   else if (layout === "training") app.innerHTML=trainingTemplate(state.lesson, header);
   else if (layout === "speed") app.innerHTML=speedTemplate(state.speed, header);
   else if (layout === "lyric") {app.innerHTML=lyricController.template(header); requestAnimationFrame(()=>lyricController.mount());}
   else if (layout === "briefing") app.innerHTML=briefingTemplate(r);
   else if (layout === "countdown" || layout === "armed") {app.innerHTML=countdownTemplate(r);if(layout === "countdown")sound("swap");}
   else if (layout === "lobby") state.lobbySignature = "";
   else if (layout === "switching") {
     app.innerHTML=header({inGame:true})+`<main class="switch-screen"><div class="switch-rings"><span>${ico("refresh",59)}</span></div>${tag("PROTOCOL BREACH / PHASE 02")}<h1>SWITCH <em>POSITIONS.</em></h1><p>${safe(r.missionInfo.switch)}. YOUR ASSIGNMENTS HAVE CHANGED.</p><div class="swap-chapter"><span>// FINAL ACT OBJECTIVE</span><strong>${safe(r.missionInfo.briefing.stageObjectives[1])}</strong><small>${safe(r.role==="hacker"?r.missionInfo.briefing.defender:r.missionInfo.briefing.hacker)}</small></div><div class="swap-card"><div><span>YOU ARE NOW</span><strong>${r.role==="hacker"?"DEFENDER":"HACKER"}</strong></div><div><span>YOUR PARTNER</span><strong>${r.role==="hacker"?"HACKER":"DEFENDER"}</strong></div></div><div class="swap-count">RESUMING IN <strong id="swap-seconds">${Math.ceil(r.switchSeconds)}</strong></div></main>`;
     sound("swap");
   } else if (layout === "results") {
     recordResult(r);
     const recordKey = `panic.best.${r.mission}`;
     try {
       const previous = Number(localStorage.getItem(recordKey)) || 0;
       if (r.finalScore > previous) localStorage.setItem(recordKey, String(r.finalScore));
     } catch { /* Private browsing can disallow persistence. */ }
     app.innerHTML = resultsTemplate(r);
     // A player can be scrolled halfway through the mission when it ends.
     // Always reveal the outcome at the top rather than leaving it offscreen.
     window.scrollTo({top:0,behavior:"instant"});
     sound(r.phase === "won" ? "win" : "error");
   }
   else {
     app.innerHTML=gameTemplate(r);
     state.targetId=null;
     state.pending=false;
     state.logSignature = "";
     state.progressSignature = "";
     state.renderedTargetSignature = "";
     state.clueSignature = "";
     // Only scroll on phase entry. Snapshot ticks must not steal focus or
     // move the viewport while a player is making a tactical decision.
     if (typeof requestAnimationFrame === "function") requestAnimationFrame(()=>{
       const input=$("#task-input");
       if (!input || !input.isConnected || input.disabled) return;
       // The live scene and field are now side by side. Starting at the top
       // keeps both visible instead of hiding the illustration above the input.
       window.scrollTo({top:0,behavior:"instant"});
       input.focus({preventScroll:true});
     });
   }
 }
 if (layout === "briefing" && r) {
   const signature = JSON.stringify([r.mission,r.readyPlayers,r.players.map(p=>p.connected)]);
   if (state.briefingSignature !== signature) {
     app.innerHTML=briefingTemplate(r);
     state.briefingSignature=signature;
   }
 }
 if (layout === "countdown" && r) {
   const deployment = deploymentDisplay(r.countdownSeconds);
   updateText("deployment-count", r.paused ? "PAUSED" : deployment.label);
   updateText("deployment-phase", r.paused ? "WAITING FOR YOUR TEAMMATE" : deployment.instruction);
   $("#deployment-count")?.classList.toggle("is-preparing", deployment.preparing && !r.paused);
   const fill = $("#deployment-track-fill");
   if (fill) fill.style.width = `${Math.max(0, Math.min(100, r.countdownSeconds * 10))}%`;
   const track = document.querySelector(".deployment-track");
   if (track) track.setAttribute("aria-valuenow", String(Math.max(0, r.countdownSeconds)));
 }
 if (layout === "lobby" && r) {
   const signature = JSON.stringify([r.mission, r.difficulty, r.hostId, r.players.map(p => [p.id, p.connected])]);
   if (signature !== state.lobbySignature) {
     app.innerHTML = lobbyTemplate(r);
     state.lobbySignature = signature;
   }
 }
 if (layout.startsWith("game-")) updateGame(r);
 if (layout === "speed") speedController.paint();
 if (layout === "switching") updateText("swap-seconds",Math.ceil(r.switchSeconds));
 if (layout === "home" && !state.modal) {
   const status=$("#header-status"); if(status) status.textContent=state.online?"SERVER ONLINE":"CONNECTING";
 }
 // Keep a single keyboard-accessible main landmark across route rerenders.
 const landmark=app.querySelector('main');
 if(landmark){landmark.id='app-main';landmark.tabIndex=-1;}
 document.body.classList.toggle("modal-open", Boolean(state.modal));
 if (state.modal) {
   const old = $(".modal-backdrop");
   if (old && (old.dataset.mode !== state.modal || old.dataset.connected !== String(state.online))) old.remove();
   if(!$(".modal-backdrop")) {
     app.insertAdjacentHTML("beforeend",modalTemplate());
     const modal = $(".modal-backdrop");
     modal.dataset.mode = state.modal;
     modal.dataset.connected = String(state.online);
     setTimeout(()=> (state.modal === "welcome" ? $(".welcome-continue") : $("#callsign") || $(".modal-backdrop [data-action=close-modal]"))?.focus({preventScroll:true}),10);
   }
 } else $(".modal-backdrop")?.remove();

 // The keyboard Tab trap alone does not make a dialog truly modal:
 // header, main, external skip navigation, and browser-edition links can
 // otherwise remain accessible behind it. Inert excludes those surfaces
 // from both keyboard navigation and the accessibility tree without
 // replacing the underlying practice DOM or disrupting its session state.
 const modalOpen=Boolean(state.modal);
 for(const child of app.children){
   if(!child.classList.contains("modal-backdrop"))child.inert=modalOpen;
 }
 for(const node of document.querySelectorAll('.skip-link, .browser-edition-note')){
   node.inert=modalOpen;
 }
}

function send(payload) {
 if(state.socket?.readyState !== WebSocket.OPEN) {toast("Connection lost. Trying to reconnect...","error"); return false;}
 state.socket.send(JSON.stringify(payload)); return true;
}
function connect() {
 if (state.socket && [WebSocket.OPEN,WebSocket.CONNECTING].includes(state.socket.readyState)) return;
 const proto=location.protocol==="https:"?"wss":"ws";
 const ws=new WebSocket(`${proto}://${location.host}/ws`);
 state.socket=ws;
 ws.addEventListener("open",()=>{
   state.online=true;state.disconnectedAt=0;state.retryAttempt=0;
   let session;
   try {session=JSON.parse(sessionStorage.getItem("panic.session")||"null");} catch {session=null;}
   if(params.get("room") && session?.code !== params.get("room")?.toUpperCase()) {
     session=null;sessionStorage.removeItem("panic.session");
   }
   if(session?.code&&session?.token && state.recovery?.kind !== "cooldown"){
     state.reconnectPending=send({type:"reconnect",code:session.code,token:session.token});
   }
   else if(params.get("demo")==="1"){
      state.selectedMission=MISSIONS[params.get("mission")]?params.get("mission"):"station";
      send({type:"create",name:savedName||"GHOST_01",mission:state.selectedMission,solo:true});state.autoStart=true;
   }
   render();
 });
 ws.addEventListener("message",event=>{
   let message;try{message=JSON.parse(event.data);}catch{return;}
   if(message.type==="welcome"){
     state.reconnectPending=false;
     state.recovery=null;
     state.token=message.token;
     sessionStorage.setItem("panic.session",JSON.stringify({code:message.code,token:message.token}));
     const url=new URL(location.href);url.searchParams.delete("room");url.searchParams.delete("demo");url.searchParams.delete("mission");history.replaceState({},"",url);
   }else if(message.type==="snapshot"){
     const wasPhase=state.room?.phase;
     state.room=message.room;
     if(state.modal === "welcome") state.modal=null;
     // Preserve an open guide during frequent gameplay snapshots.
     if (wasPhase && wasPhase !== message.room.phase) state.modal=null;
     state.selectedMission=state.room.mission;
     render();
     if(state.autoStart&&state.room.phase==="lobby"&&state.room.solo&&state.room.viewerId===state.room.hostId){state.autoStart=false;send({type:"start"});}
     if(wasPhase==="armed"&&state.room.phase==="playing")sound("success");
   }else if(message.type==="error"){
     const recovery=describeSessionRecovery(message.message,{
       reconnecting:state.reconnectPending,
       hasRoom:Boolean(state.room),
     });
     state.reconnectPending=false;
     if(recovery){
       if(recovery.discardSession){
         sessionStorage.removeItem("panic.session");
         state.token=null;
       }
       state.recovery=recovery;
       state.room=null;
       state.autoStart=false;
       state.modal=null;
       state.layout="";
       render();
       $("#session-recovery-title")?.focus({preventScroll:true});
     }else toast(message.message,"error");
   }
 });
 ws.addEventListener("close",()=>{
   if(state.socket!==ws)return;
   state.online=false;state.disconnectedAt=Date.now();
   if(state.room?.phase==="playing") toast("Connection interrupted. Reconnecting...","error");
   const status=$("#header-status");if(status)status.textContent="RECONNECTING";
   clearTimeout(state.reconnectTimer);
   // Back off while offline instead of polling indefinitely at a fixed rate.
   const delay=Math.min(16000,1200*2**Math.min(4,state.retryAttempt++));
   state.reconnectTimer=setTimeout(connect,delay);
 });
 ws.addEventListener("error",()=>{/* close event triggers retry */});
}

async function copy(text, success) {
 try {await navigator.clipboard.writeText(text);toast(success,"success");}
 catch {toast("Clipboard unavailable. Copy the room code on screen.","error");}
}
let modalReturnAction=null;
function showModal(which){
 // Preserve the invoking control across a dialog even if the view is repainted.
 if(!state.modal)modalReturnAction=document.activeElement?.dataset?.action||null;
 state.modal=which;render();
}
function dismissModal(){
 const action=modalReturnAction;
 modalReturnAction=null;
 state.modal=null;render();
 const origin=action?app.querySelector('[data-action="'+action+'"]'):null;
 (origin||app.querySelector('.prefs-toggle'))?.focus({preventScroll:true});
}
function resetHome(){sessionStorage.removeItem("panic.session");location.href="/";}

app.addEventListener("click",event=>{
 const item=event.target.closest("[data-action]");if(!item)return;
 const action=item.dataset.action;
 if(action.startsWith("lyric-") && action!=="lyric-open" && lyricController.handleAction(action,item)){event.preventDefault();return;}
 if(item.classList.contains("modal-backdrop") && event.target !== item) return;
 if(action!="scroll-ops") event.preventDefault();
 switch(action){
  case "reel-prev":moveStoryReel(state.room,-1);break;
  case "reel-next":moveStoryReel(state.room,1);break;
  case "settings":showModal("settings");break;
  case "perf-start":{
    if(!performanceCheck.start())break;
    dismissModal();
    // Starting a check should not waste the capture by leaving keyboard focus
    // on the Settings button. Return directly to an editable practice field.
    // No input is focused on the home screen, or when a session is paused.
    const field=["speed-input","lyric-input","lesson-input","task-input"]
      .map(id=>document.getElementById(id))
      .find(el=>el?.isConnected && !el.disabled && !el.readOnly
        && el.getClientRects().length>0);
    field?.focus({preventScroll:true});
    break;
  }
  case "theme-select": {
    const id = item.dataset.themeId;
    if (!THEME_IDS.includes(id)) break;
    state.preferences = savePreferences({...state.preferences,theme:id});
    applyPreferences(state.preferences);
    // Keep the settings modal open and its scroll position intact.
    app.querySelectorAll(".theme-choice").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.themeId === id));
    });
    const status = document.getElementById("theme-selection-status");
    if (status) status.textContent = "Selected: " + THEMES.find(theme => theme.id === id).name + " · Changes apply instantly.";
    break;
  }
  case "setting":{
    const key=item.dataset.setting;
    if(!Object.hasOwn(state.preferences,key)) break;
    state.preferences=savePreferences({...state.preferences,[key]:!state.preferences[key]});
    applyPreferences(state.preferences);
    // Style-only preferences do not require rebuilding the dialog. Keep the
    // activated button, keyboard focus and scroll position intact.
    item.setAttribute("aria-pressed",String(state.preferences[key]));
    item.querySelector(".setting-switch")?.classList.toggle("on",state.preferences[key]);
    break;
  }
  case "lyric-open":lyricController.open();break;
  case "speed-open":speedController.open();break;
  case "speed-resume":speedController.resume();break;
   case "speed-pause":speedController.pauseManually();break;
   case "speed-space":speedController.insertSpace();break;
  case "speed-back-word":speedController.backWord();break;
  case "speed-assist":speedController.toggleKeyboardAssist();break;
   case "speed-focus":speedController.toggleWordFocus();break;
  case "speed-goal": {
    const goal=Number(item.dataset.goal);
    if(!state.speed||!saveAccuracyGoal(goal))break;
    refreshSpeedInsights();
    document.querySelector('[data-action="speed-goal"][data-goal="'+goal+'"]')?.focus({preventScroll:true});
    break;
  }
  case "speed-import": {
    if(!state.speed)break;
    document.getElementById("speed-import-file")?.click();
    break;
  }
  case "speed-export": {
    const records=readSpeedHistory();
    if(!records.length){toast("Complete a Speed Lab run before exporting results.","error");break;}
    const json=JSON.stringify(exportSpeedResults(records),null,2);
    const blob=new Blob([json],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url;link.download="keystoria-speed-results.json";
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),3000);
    toast("Speed Lab results exported from this device.");
    break;
  }
  case "speed-clear": {
    if(!window.confirm("Clear all saved Speed Lab results on this device? This cannot be undone."))break;
    if(!clearSpeedResults()){toast("Could not clear saved results in this browser.","error");break;}
    refreshSpeedInsights();
    // The refresh replaced the focused button; keep keyboard users in place.
    document.querySelector('[data-action="speed-clear"]')?.focus({preventScroll:true});
    toast("Saved Speed Lab results cleared.");
    break;
  }
  case "speed-duration":if(state.speed)speedController.open({pack:state.speed.pack,seconds:Number(item.dataset.seconds),targetKeys:state.speed.targetKeys,focusChoice:event.detail===0?"speed-duration":null});break;
  case "speed-pack":if(state.speed)speedController.open({pack:item.dataset.pack,seconds:state.speed.seconds,focusChoice:event.detail===0?"speed-pack":null});break;
  case "speed-targeted":speedController.startTargeted();break;
   case "speed-regular":speedController.restart({regular:true});break;
   case "speed-restart":speedController.restart();break;
  case "speed-home":speedController.close();showModal("welcome");break;
  case "create":showModal("create");break;
  case "show-join":showModal("join");break;
  case "recovery-retry": {
    if(!state.online){toast("Connect to the local server before retrying.","error");break;}
    let session;
    try {session=JSON.parse(sessionStorage.getItem("panic.session")||"null");} catch {session=null;}
    if(!session?.code||!session?.token){
      sessionStorage.removeItem("panic.session");
      state.recovery=describeSessionRecovery("Your reconnect pass is no longer valid.",{reconnecting:true});
      state.layout="";render();
      break;
    }
    if(send({type:"reconnect",code:session.code,token:session.token})){
      state.reconnectPending=true;
      state.recovery=null;
      state.layout="";
      render();
    }
    break;
  }
  case "recovery-create":
  case "recovery-join":
    // Recovery actions deliberately abandon the previous identity. No room
    // code may restore a missing or invalid single-use reconnect pass.
    sessionStorage.removeItem("panic.session");
    state.token=null;
    state.reconnectPending=false;
    state.recovery=null;
    state.room=null;
    state.autoStart=false;
    state.modal=null;
    state.layout="";
    showModal(action==="recovery-create"?"create":"join");
    break;
  case "close-modal":dismissModal();break;
  case "edit-mission":state.modal=null;render();document.getElementById("operations")?.scrollIntoView({behavior:"smooth"});break;
  case "toggle-missions":state.missionsExpanded=!state.missionsExpanded;state.layout="";render();document.getElementById("operations")?.scrollIntoView({block:"start",behavior:"instant"});break;
  case "choose-mission":setTheme(item.dataset.mission);state.layout="";render();break;
  case "set-mission":send({type:"set_mission",mission:item.dataset.mission});break;
  case "ready":send({type:"ready"});break;
  case "launch":send({type:"launch"});break;
  case "guide":showModal("guide");break;
  case "back-to-live": {
    document.querySelector(".typing-zone")?.scrollIntoView({block:"start",behavior:"smooth"});
    $("#task-input")?.focus({preventScroll:true});
    break;
  }
  case "academy-clear-progress":{
    const count=Object.keys(readAcademyCheckpoints()).length;
    if(!count)break;
    const question=`Clear saved steps for ${count} unfinished Field Academy ${count===1?'course':'courses'} on this device? Completed-course badges will stay.`;
    if(!window.confirm(question))break;
    if(!clearAllAcademyCheckpoints()){
      toast("Could not clear Academy progress. Browser storage may be blocked.","error");
      break;
    }
    // Rebuild just the home layout so all cards show their new state.
    // The pressed button is removed, so place focus on a stable heading.
    state.layout="";
    render();
    document.getElementById("academy-course-heading")?.focus({preventScroll:true});
    toast("Unfinished Academy progress cleared. Completed badges kept.","success");
    break;
  }
  case "learn":{
    const os=item.dataset.os;
    if(!LESSONS[os])break;
    // Re-enter the same randomized course, or begin a new one if no valid
    // local checkpoint exists. We intentionally never store command drafts.
    const resumed=readAcademyCheckpoint(os);
    state.lesson=resumed||{os,index:0,order:randomizedCourseOrder(os),answered:false,errors:0,completed:false,review:false,errorMessage:"",draft:"",referenceIndex:null};
    if(!resumed)saveAcademyCheckpoint(state.lesson);
    state.modal=null;state.layout="";render();
    window.scrollTo({top:0,behavior:"instant"});
    const next=resumed?.answered ? [...document.querySelectorAll('[data-action="training-next"]')].find(button=>button.getClientRects().length) : null;
    (next||$("#lesson-input"))?.focus({preventScroll:true});
    break;
  }
  case "training-home":state.lesson=null;state.layout="";showModal("welcome");window.scrollTo({top:0,behavior:"instant"});break;
  case "training-submit":submitLesson();break;
  case "training-review":if(state.lesson){state.lesson.review=!state.lesson.review;renderTrainingInPlace();}break;
  case "training-reference":{
    const lesson=state.lesson;
    if (!lesson) break;
    const index=Number(item.dataset.index);
    if (!Number.isInteger(index) || index<0 || index>=LESSONS[lesson.os].commands.length) break;
    lesson.referenceIndex=index;
    // The sidebar is a reference navigator, not a page-navigation control.
    renderTrainingInPlace();
    break;
  }
  case "training-shuffle":
  case "training-restart":if(state.lesson){state.lesson={...state.lesson,index:0,order:randomizedCourseOrder(state.lesson.os),answered:false,errors:0,completed:false,review:false,errorMessage:"",draft:"",referenceIndex:null};saveAcademyCheckpoint(state.lesson);renderTrainingInPlace();}break;
  case "training-next":advanceLesson();break;
  case "difficulty":send({type:"difficulty",difficulty:item.dataset.difficulty});break;
  case "ping":send({type:"ping",code:item.dataset.ping});break;
  case "pulse":if(state.room?.syncReady && send({type:"pulse"})) sound("success");break;
  case "jump-field": {
    // This is an explicit click inside story gameplay; never scroll in Academy/Speed Lab.
    document.getElementById('field-console')?.scrollIntoView({block:'center',behavior:'smooth'});
    document.querySelector('.field-choice-grid button:not(:disabled)')?.focus({preventScroll:true});
    break;
  }
  case "field-action":{
    if (state.room?.fieldOps?.available && send({type:"field_action",action:item.dataset.field})) {
      sound("success");
      // A world control is a mouse action, not a new typing target.
      $("#task-input")?.focus({preventScroll:true});
    }
    break;
  }
  case "tactic":send({type:"tactic",choice:item.dataset.choice});break;
  case "accuse":send({type:"accuse",suspect:item.dataset.suspect});break;
  case "rematch":send({type:"rematch"});break;
  case "solo":{
    if (!state.online) {toast("Connecting to game server. Please try again shortly.", "error");break;}
    const name=state.nickname||"GHOST_01";
    localStorage.setItem("panic.callsign",name);
    state.autoStart=true;
    send({type:"create",name,mission:state.selectedMission,solo:true});
    break;
  }
  case "start":send({type:"start"});break;
  case "copy-invite":copy(`${location.origin}/?room=${state.room.code}`,"Invite link copied to clipboard");break;
  case "copy-result":{
    const r=state.room;
    copy(`KEYSTORIA // ${r.missionInfo.title}\n${r.phase==="won"?"EXTRACTED":"MISSION FAILED"} — GRADE ${r.finalGrade}\n${r.difficultyLabel.toUpperCase()} DIFFICULTY | SCORE: ${r.finalScore.toLocaleString()} | INTEGRITY: ${r.stability}%\nSQUAD PULSES: ${r.pulsesUsed}\nPlay together: ${location.origin}`,"Mission results copied");
    break;
  }
  case "sound":toggleSound();item.innerHTML=ico(isSoundOn()?"volume":"mute",20);sound("tap");break;
  case "home":resetHome();break;
 }
});

/** Preserve the user's reading position while Academy content re-renders.
 * Only story missions are allowed to scroll to their typing input.
 */
function renderTrainingInPlace() {
  const top=window.scrollY;
  const focused=$("#lesson-input");
  // Clicking CHECK replaces that button with NEXT. Focus the next available
  // action for keyboard/screen-reader users instead of dropping to <body>.
  // Enter from the input itself continues to keep focus on the native field.
  const activated=document.activeElement;
  const checkedFromButton=activated?.matches?.('button[data-action="training-submit"]')===true;
  // The reference list and guide toggle rebuild their own buttons. Restore
  // the same keyboard destination instead of abruptly reopening the input
  // (and a phone's software keyboard) after the user chose to read the guide.
  const referenceIndex=activated?.matches?.('button[data-action="training-reference"]')
    ? Number(activated.dataset.index) : null;
  const guideSelector=activated?.matches?.('button[data-action="training-review"]')
    ? (activated.closest('.academy-mobile-entry')
      ? '.academy-mobile-entry [data-action="training-review"]'
      : '.terminal-inner > .training-buttons [data-action="training-review"]') : null;
  const focusAfterUpdate=()=>{
    const selector=referenceIndex!==null && Number.isInteger(referenceIndex)
      ? '.mini-glossary [data-action="training-reference"][data-index="'+referenceIndex+'"]'
      : guideSelector;
    const preserved=selector ? $(selector) : null;
    if(preserved?.getClientRects().length){preserved.focus({preventScroll:true});return;}
    if(checkedFromButton && state.lesson?.answered){
      const next=[
        $('.academy-mobile-entry [data-action="training-next"]'),
        $('.terminal-inner > .training-buttons [data-action="training-next"]')
      ].find(button=>button?.getClientRects().length);
      if(next){next.focus({preventScroll:true});return;}
    }
    $("#lesson-input")?.focus({preventScroll:true});
  };
  // Keep the input and role=status feedback mounted after every command.
  // Phone keyboards remain open and desktop screen readers can hear the
  // changed status without losing its existing accessibility tree identity.
  const softKeyboardLayout=window.matchMedia(MOBILE_TYPING_MEDIA).matches;
  if (focused && !state.lesson?.completed) {
    const draft=document.createElement("div");
    draft.innerHTML=trainingTemplate(state.lesson,header);
    if(patchMobileTraining($(".academy-play"),draft.querySelector(".academy-play"))){
      if(!softKeyboardLayout)window.scrollTo({top,behavior:"instant"});
      focusAfterUpdate();
      return;
    }
  }
  state.layout="";
  render();
  if(state.lesson?.completed){
    // The native input no longer exists on the result screen. Move focus to
    // the success heading, so keyboard and screen-reader players are not left
    // on the document body after their final Enter/Finish action.
    $("#academy-complete-heading")?.focus();
    return;
  }
  window.scrollTo({top,behavior:"instant"});
  focusAfterUpdate();
}

function advanceLesson() {
  const session=state.lesson;
  if (!session?.answered || session.completed) return;
  if (session.index === LESSONS[session.os].commands.length-1) {
    session.completed=true;
    saveLesson(session.os);
    clearAcademyCheckpoint(session.os);
  } else {
    session.index++;
    session.answered=false;
    session.errorMessage="";
    session.draft="";
    saveAcademyCheckpoint(session);
  }
  session.referenceIndex=null;
  renderTrainingInPlace();
  if(!session.completed){
    // On a phone the original input remains focused (to preserve the soft
    // keyboard). Announce the new command without blurring it or speaking
    // every keystroke. This live region survives the mobile in-place patch.
    const command=LESSONS[session.os].commands[activeCommandIndex(session)].text;
    const cue=$("#academy-step-announcement");
    if(cue)cue.textContent=`Step ${session.index+1} of ${LESSONS[session.os].commands.length}. Type: ${command}`;
  }
}

function submitLesson() {
  const session=state.lesson;
  if (!session || session.completed || session.answered) return;
  const input=$("#lesson-input");
  if (!input) return;
  const expected=LESSONS[session.os].commands[activeCommandIndex(session)].text;
  session.draft=input.value;
  if (matchesCommand(input.value,expected)) {
    session.answered=true;
    session.referenceIndex=null;
    session.errorMessage="";
    session.draft="";
    sound("success");
  } else {
    session.errors++;
    session.errorMessage="Not quite. Compare the command, spaces, capitals and flags, then try again. Nothing was executed.";
    sound("error");
  }
  saveAcademyCheckpoint(session);
  renderTrainingInPlace();
}

app.addEventListener("submit",event=>{
 if(event.target.id==="lyric-search-form" || event.target.id==="lyric-video-form") {event.preventDefault();lyricController.handleSubmit(event);return;}
 if(event.target.id!=="session-form")return;
 event.preventDefault();
 const data=new FormData(event.target);
 const name=String(data.get("callsign")||"").trim().slice(0,18);
 if(!name){toast("Choose a callsign first.","error");return;}
 state.nickname=name;localStorage.setItem("panic.callsign",name);
 if(state.modal==="join") {
   const code=String(data.get("roomcode")||"").toUpperCase().trim();
   if(code.length!==6){toast("A room code must have six characters.","error");return;}
   send({type:"join",code,name});
 }else send({type:"create",name,mission:state.selectedMission,solo:false});
});

app.addEventListener("change",event=>{
  if(event.target.id==="speed-import-file"){void restoreSpeedFile(event.target);return;}
  if(state.lyric)lyricController.handleChange(event);
});
// An IME may send multiple input/Enter events while a word is still being
// composed. Score and validate only committed text; preserve the native input
// and let the browser complete its composition rather than stealing Enter.
const practiceFields=new Set(["lyric-input","speed-input","lesson-input","task-input"]);
let composingPractice=null;
app.addEventListener("compositionstart",event=>{
 if(!practiceFields.has(event.target?.id))return;
 composingPractice=event.target;
 if(event.target.id==="lyric-input"){
   event.target.dataset.imeCommitted=event.target.value;
   event.target.dataset.imeComposing="true";
 }
});
app.addEventListener("compositionend",event=>{
 const field=event.target;
 if(field!==composingPractice)return;
 composingPractice=null;
 if(field.id==="lyric-input"){
   delete field.dataset.imeComposing;
   delete field.dataset.imeCommitted;
 }
 // Browsers differ about whether the final native input fires before or after
 // compositionend. Reconcile once after the commit; a later native input is
 // idempotent. A detached input must never restart a departed practice mode.
 queueMicrotask(()=>{
   if(field.isConnected && composingPractice!==field)
     field.dispatchEvent(new Event("input",{bubbles:true}));
 });
});
app.addEventListener("input",event=>{
 if(practiceFields.has(event.target?.id) &&
    (event.isComposing || event.target===composingPractice))return;
 if(state.lyric && lyricController.handleInput(event))return;
 if(event.target.id === "lesson-input" && state.lesson) {
   state.lesson.draft=event.target.value;
   if(state.lesson.errorMessage){
     // Clear invalid state when the player starts correcting an error;
     // announce the new guidance once rather than per keystroke.
     state.lesson.errorMessage="";
     event.target.setAttribute("aria-invalid","false");
     const feedback=$("#training-feedback");
     if(feedback)feedback.textContent="Command edited. Press Enter or select Check Command to try again. Nothing was executed.";
   }
   const target=LESSONS[state.lesson.os].commands[activeCommandIndex(state.lesson)].text;
   paintTypingFeedback($("#lesson-target-text"),target,state.lesson.draft);
    paintTypingFeedback($("#lesson-mobile-target"),target,state.lesson.draft);
   return;
 }
 if(event.target.id === "speed-input") {speedController.input(event.target.value);return;}
 if(event.target.id!=="task-input")return;
 const r=state.room;
 const value=event.target.value;
 updateTarget(value,r?.target?.text||"");
 setCinematicTypingProgress(r, value);
 if(!r?.target || state.pending)return;
 if(norm(value)===norm(r.target.text))submitTyping(value);
});

/** Textarea selection changes on phone taps, drag handles, Home/Arrow keys,
 * and programmatic caret corrections. Keep cues aligned with the caret
 * without starting timers or touching the scoring pipeline.
 */
function refreshSpeedCaretFor(field){
 if(field?.id==='speed-input' && field!==composingPractice && state.speed)
   speedController.updateCaretGuidance();
}
app.addEventListener('select',event=>refreshSpeedCaretFor(event.target));
document.addEventListener('selectionchange',()=>refreshSpeedCaretFor(document.activeElement));

function submitTyping(value){
 const r=state.room;
 if(!r?.target||state.pending)return;
 state.pending=true;
 if(!send({type:"submit",value,targetId:r.target.id})){state.pending=false;return;}
 const input=$("#task-input"); if(input)input.disabled=true;
}
app.addEventListener("keydown",event=>{
 // Legacy IME keyCode 229 is common during East Asian text conversion;
 // Ctrl+Enter, Space and other practice shortcuts must not intercept it.
 if(practiceFields.has(event.target?.id) &&
    (event.isComposing || event.keyCode===229 || event.target===composingPractice))return;
 if(state.lyric && lyricController.handleKeydown(event))return;
 if(state.modal && event.key==='Tab'){
  const dialog=app.querySelector('.modal-backdrop [role="dialog"]');
  if(dialog){
   const focusable=[...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(element=>element.getClientRects().length>0&&!element.closest('[hidden]'));
   if(focusable.length){
    const first=focusable[0],last=focusable.at(-1),current=document.activeElement;
    if(!dialog.contains(current)){event.preventDefault();(event.shiftKey?last:first).focus();return;}
    if(event.shiftKey&&current===first){event.preventDefault();last.focus();return;}
    if(!event.shiftKey&&current===last){event.preventDefault();first.focus();return;}
   }
  }
 }
 if(event.key==='Escape'&&state.modal){event.preventDefault();dismissModal();return;}
 if (state.speed && event.ctrlKey && event.key === "Enter") {
   event.preventDefault();speedController.restart();return;
 }
 if(state.speed && event.target.id === "speed-input" && event.key === "Enter") {
   if(event.isComposing || event.keyCode===229)return;
   event.preventDefault();
   if(state.speed.pack==="numpad" && event.code==="NumpadEnter" && !state.speed.result) {
     const field=event.target;
     field.setRangeText(" ",field.selectionStart,field.selectionEnd,"end");
     speedController.input(field.value);
     speedController.keystroke();
   }
   return;
 }
 if(state.speed && event.target.id === "speed-input" && event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
   speedController.keystroke();
 }
 if(event.target.id === "lesson-input" && event.key === "Enter") {
   if(event.isComposing || event.keyCode === 229)return;
   event.preventDefault();
   if (state.lesson?.answered) advanceLesson();
   else submitLesson();
   return;
 }

 if(event.key === "/" && state.room?.phase === "playing" && !["INPUT","TEXTAREA"].includes(event.target.tagName)){
   event.preventDefault(); $("#task-input")?.focus(); return;
 }
 if(event.target.id==="task-input"&&event.key==="Enter"){
   event.preventDefault();
   const r=state.room;
   if(!r?.target||state.pending)return;
   const value=event.target.value;
   if(!value.trim())return;
   if(norm(value)!==norm(r.target.text)){
     sound("error");event.target.classList.remove("shake");void event.target.offsetWidth;event.target.classList.add("shake");
     send({type:"submit",targetId:r.target.id,value});
     event.target.value="";updateTarget("",r.target.text);setCinematicTypingProgress(r, "");
   }else submitTyping(value);
 }
});

app.addEventListener("paste",event=>{
 if(event.target.id === "speed-input" || event.target.id === "lyric-input") {event.preventDefault();toast("Paste is disabled in typing challenges. Type to earn your score.","error");}
});

// Offer a fast path to joining a room sent by a friend.
if(params.has("room")) state.modal="join";
render();connect();
