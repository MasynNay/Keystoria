import { LESSONS, matchesCommand, saveLesson, randomizedCourseOrder, activeCommandIndex } from "./ui/lessons.js";
import { trainingTemplate } from "./ui/training-view.js";
import { speedTemplate } from "./ui/speed-view.js";
import { createSpeedController } from "./ui/speed-controller.js";
import { createLyricLabController } from "./ui/lyric-lab-controller.js";
import { paintTypingFeedback } from "./ui/typing-feedback.js";
import { sound, toggleSound, isSoundOn } from "./sound.js";
import { MISSIONS } from "./ui/missions.js";
import { updateMissionScene } from "./ui/mission-scenes.js";
import { setCinematicTypingProgress } from "./ui/cinematic-cuts.js";
import { moveStoryReel } from "./ui/story-reel.js";
import { deploymentDisplay } from "./ui/deployment.js";
import { safe, norm, timeString, pad, ico, tag } from "./ui/helpers.js";
import { createViews } from "./ui/views.js";
import { recordResult } from "./ui/progression.js";
import { loadPreferences, savePreferences, applyPreferences } from "./ui/preferences.js";
import { THEMES, THEME_IDS } from "./ui/themes.js";
import { setupMobileTyping, patchMobileTraining } from "./ui/mobile-typing.js";

/** All gameplay authority lives on the server. This module only renders UI. */
const $ = (selector) => document.querySelector(selector);
const app = $("#app");
setupMobileTyping(app);
const BROWSER_EDITION = Boolean(document.querySelector('meta[name="keystoria-browser-edition"]'));
const params = new URLSearchParams(location.search);
const savedName = localStorage.getItem("panic.callsign") || "";
const state = {
  socket: null, online: false, room: null, token: null, selectedMission: "station", missionsExpanded: false,
  nickname: savedName, modal: params.has("room") || params.get("demo") === "1" ? null : "welcome", layout: "", targetId: null, pending: false,
  autoStart: false, reconnectTimer: null, disconnectedAt: 0, retryAttempt: 0,
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
   const status=$("#header-status"); if(status) status.textContent=BROWSER_EDITION?"PRACTICE ONLINE":state.online?"SERVER ONLINE":"CONNECTING";
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
   if(session?.code&&session?.token){ send({type:"reconnect",code:session.code,token:session.token}); }
   else if(params.get("demo")==="1"){
      state.selectedMission=MISSIONS[params.get("mission")]?params.get("mission"):"station";
      send({type:"create",name:savedName||"GHOST_01",mission:state.selectedMission,solo:true});state.autoStart=true;
   }
   render();
 });
 ws.addEventListener("message",event=>{
   let message;try{message=JSON.parse(event.data);}catch{return;}
   if(message.type==="welcome"){
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
     toast(message.message,"error");
     if(message.message.includes("reconnect pass")||message.message.includes("expired")){
       sessionStorage.removeItem("panic.session");state.room=null;state.layout="";render();
     }
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
function resetHome(){sessionStorage.removeItem("panic.session");location.href=BROWSER_EDITION?"./":"/";}

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
    $(".modal-backdrop")?.remove();render();
    break;
  }
  case "lyric-open":lyricController.open();break;
  case "speed-open":speedController.open();break;
  case "speed-space":speedController.insertSpace();break;
  case "speed-duration":if(state.speed)speedController.open({pack:state.speed.pack,seconds:Number(item.dataset.seconds)});break;
  case "speed-pack":if(state.speed)speedController.open({pack:item.dataset.pack,seconds:state.speed.seconds});break;
  case "speed-restart":if(state.speed)speedController.open({pack:state.speed.pack,seconds:state.speed.seconds});break;
  case "speed-home":speedController.close();showModal("welcome");break;
  case "create":showModal("create");break;
  case "show-join":showModal("join");break;
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
  case "learn":{
    const os=item.dataset.os;
    if(!LESSONS[os])break;
    state.lesson={os,index:0,order:randomizedCourseOrder(os),answered:false,errors:0,completed:false,review:false,errorMessage:"",draft:"",referenceIndex:null};
    state.modal=null;state.layout="";render();
    window.scrollTo({top:0,behavior:"instant"});
    $("#lesson-input")?.focus({preventScroll:true});
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
  case "training-restart":if(state.lesson){state.lesson={...state.lesson,index:0,order:randomizedCourseOrder(state.lesson.os),answered:false,errors:0,completed:false,review:false,errorMessage:"",draft:"",referenceIndex:null};renderTrainingInPlace();}break;
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
    if (BROWSER_EDITION) {toast("The 24 story missions need the Python game server. Lyric Lab, Speed Lab and Field Academy are playable here.", "error");break;}
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
  // Never remove the focused native input while a phone's keyboard is up.
  if (focused && !state.lesson?.completed && window.matchMedia("(max-width:760px)").matches) {
    const draft=document.createElement("div");
    draft.innerHTML=trainingTemplate(state.lesson,header);
    if(patchMobileTraining($(".academy-play"),draft.querySelector(".academy-play"))){
      if(!focused.readOnly)focused.focus({preventScroll:true});
      return;
    }
  }
  state.layout="";
  render();
  window.scrollTo({top,behavior:"instant"});
  $("#lesson-input")?.focus({preventScroll:true});
}

function advanceLesson() {
  const session=state.lesson;
  if (!session?.answered || session.completed) return;
  if (session.index === LESSONS[session.os].commands.length-1) {
    session.completed=true;
    saveLesson(session.os);
  } else {
    session.index++;
    session.answered=false;
    session.errorMessage="";
    session.draft="";
  }
  session.referenceIndex=null;
  renderTrainingInPlace();
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

app.addEventListener("change",event=>{if(state.lyric)lyricController.handleChange(event);});
app.addEventListener("input",event=>{
 if(state.lyric && lyricController.handleInput(event))return;
 if(event.target.id === "lesson-input" && state.lesson) {
   state.lesson.draft=event.target.value;
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

function submitTyping(value){
 const r=state.room;
 if(!r?.target||state.pending)return;
 state.pending=true;
 if(!send({type:"submit",value,targetId:r.target.id})){state.pending=false;return;}
 const input=$("#task-input"); if(input)input.disabled=true;
}
app.addEventListener("keydown",event=>{
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
   event.preventDefault();speedController.open({pack:state.speed.pack,seconds:state.speed.seconds});return;
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
render();if (!BROWSER_EDITION) connect();
