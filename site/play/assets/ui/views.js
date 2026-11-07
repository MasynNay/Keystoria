/** Static page composition. View templates depend only on state and shared presentation helpers. */
import { MISSIONS } from "./missions.js";
import { missionIcon } from "./mission-icons.js";
import { MISSION_COLORS, missionColorStyle } from "./mission-colors.js";
import { renderTypingFeedback } from "./typing-feedback.js";
import { missionScene, sceneStep, sceneStory } from "./mission-scenes.js";
import { renderSceneSVG } from "./scene-illustrations.js";
import { safe, timeString, pad, ico, brand, tag } from "./helpers.js";
import { isSoundOn } from "../sound.js";
import { trainingLibrary } from "./training-view.js";
import { speedLibrary } from "./speed-view.js";
import { readHistory, readCareer, summarizeHistory, MILESTONES } from "./progression.js";
import { deploymentDisplay } from "./deployment.js";
import { storyReelTemplate } from "./story-reel.js";

const BROWSER_EDITION = typeof document !== 'undefined' && Boolean(document.querySelector('meta[name="keystoria-browser-edition"]'));
export function createViews(state) {
function header({inGame=false} = {}) {
  return `<header class="topbar shell">${brand()}<nav class="desktop-nav" aria-label="Main navigation">
    ${inGame ? `<span class="top-nav-text">// MISSION CONTROL</span>` : `<a href="#operations" data-action="scroll-ops">MISSIONS</a><a href="#lyric-lab">LYRIC LAB</a><a href="#speed-lab">SPEED LAB</a><a href="#how-it-works">HOW TO PLAY</a>${BROWSER_EDITION ? `<a class="nav-join" href="../">PORTFOLIO ↗</a>` : `<button class="nav-join" data-action="show-join">JOIN A ROOM</button>`}`}
  </nav><div class="topbar-right"><button class="sound-toggle prefs-toggle" data-action="settings" aria-label="Display and accessibility settings" title="Display settings">${ico("settings",20)}</button><button class="sound-toggle" data-action="sound" title="Toggle sounds" aria-label="Toggle sounds">${ico(isSoundOn() ? "volume" : "mute",20)}</button>
  ${inGame ? `<span class="server-indicator"><i></i> <span id="header-status">${BROWSER_EDITION ? "BROWSER PRACTICE" : "CONNECTED"}</span></span>` : `<span class="server-indicator"><i></i> <span id="header-status">${BROWSER_EDITION ? "BROWSER PRACTICE" : state.online ? "SERVER ONLINE" : "CONNECTING"}</span></span>`}</div></header>`;
}

function stationArt() {
 return `<div class="sim-grid"></div><div class="orbit-ring orbit-ring-a"></div><div class="orbit-ring orbit-ring-b"></div><div class="orbit-ring orbit-ring-c"></div><div class="sim-ship"><div class="ship-core"></div><div class="ship-ray a"></div><div class="ship-ray b"></div><div class="ship-ray c"></div><span>07</span></div><div class="sim-blip blip-a"></div><div class="sim-blip blip-b"></div><div class="sim-blip blip-c"></div><span class="sim-coord top">N: 41.582 / E: 07.013</span><span class="sim-coord bottom">// LIVE TACTICAL FEED</span>`;
}
/** Matching, purpose-drawn mission crests across the complete campaign.
 * The old mixed placeholder illustrations made some chapters look unfinished.
 */
function missionArt(id) {
 const covers={
   station:['#10283d','#367b87','ORBITAL STATION // ESCAPE'],
   hollow:['#1f1b35','#65517c','ASHCROFT HOUSE // HAUNTED'],
   outbreak:['#0b3032','#387d68','QUARANTINE // ANTIDOTE'],
   casefile:['#2c2529','#866754','ASHCROFT HOTEL // CASE'],
   dead_air:['#0a293c','#37839e','BELLWETHER // BROADCAST'],
   last_stop:['#232635','#7c6864','RAVEN BRIDGE // BRAKES'],
   abyss:['#042039','#16778b','DEPTH 3,400M // RESCUE'],
   neon:['#100d2b','#652178','SECURITY GRID // LIVE'],
   red_horizon:['#6e2635','#ce8058','ARES COLONY // SOL 209'],
   whiteout:['#153851','#82adb9','POLAR BASE // WHITEOUT'],
   ashfall:['#512a2c','#c66e46','REDWOOD COUNTY // RESCUE'],
   carnival:['#34213c','#bf5b79','LUMINA PIER // FERRIS WHEEL'],
   mirrorfall:['#1f1942','#7553b9','MIRROR CITY // INVERTED'],
   four_winds:['#143c39','#3b9d84','FOUR GUARDIANS // SKY CANALS'],
   dawnforge:['#422718','#d68536','SUN FORGE // LABYRINTH'],
   glass_trials:['#27334b','#8c9db9','GLASS ARENA // FINALISTS'],
   wildbond:['#183920','#6c9c4f','FOREST HEART // SANCTUARY'],
   stardoor:['#282048','#7b56b5','SIX REALMS // STARDOORS'],
 };
 const [dark,light,caption]=covers[id] || covers.station;
 return `<div class="art-art mission-crest-art" style="background:radial-gradient(circle at 45% 20%,${light},${dark} 74%)"><span class="mission-crest-orbit" aria-hidden="true"></span><span class="mission-crest-emblem">${missionIcon(id)}</span><span class="mission-crest-caption">${caption}</span></div>`;
}

function homeTemplate() {
  const history = readHistory();
  const stats = summarizeHistory(history);
  const career = readCareer();
  const expanded = Boolean(state.missionsExpanded);
  return `${header()}<main>
  <section class="hero shell" aria-labelledby="hero-title">
    <div class="hero-copy">
      <div class="hero-kicker"><span class="live-pulse"></span> KEYSTORIA <span class="dot-separator">/</span> A WORLD OF TYPING ADVENTURES</div>
      <h1 id="hero-title">EVERY KEY<br/><em>OPENS A WORLD.</em></h1>
      <p class="hero-lede">Step into twenty-four original story adventures, type in time with music, sharpen your speed, or master command-line skills. <strong>Choose your world. Your keyboard takes you there.</strong></p>
      <div class="hero-actions">${BROWSER_EDITION ? `<button class="btn btn-primary btn-large" data-action="speed-open">${ico("play",19)} PLAY SPEED LAB ${ico("arrow",19)}</button><button class="btn btn-outline btn-large" data-action="lyric-open">${ico("headphones",19)} PLAY LYRIC LAB</button>` : `<button class="btn btn-primary btn-large" data-action="solo">${ico("play",19)} SINGLE PLAYER / PLAY WITH ECHO <span class="button-arrow">${ico("arrow",19)}</span></button><button class="btn btn-outline btn-large" data-action="create">${ico("users",19)} TWO PLAYER / INVITE A FRIEND</button>`}</div>
      <button class="hero-join" data-action="speed-open">WANT A SOLO TYPING TEST? ENTER SPEED LAB ${ico("arrow",14)}</button><button class="hero-join lyric-hero-link" data-action="lyric-open">${ico("play",14)} MUSIC + KARAOKE TYPING? TRY LYRIC LAB ${ico("arrow",14)}</button>${BROWSER_EDITION ? `<p style="margin:12px 0;color:#ddcfed;font-size:13px">To play story missions or create co-op rooms, run the full Python game locally.</p>` : `<button class="hero-join" data-action="show-join">HAVE A CODE? JOIN A FRIEND ${ico("arrow",14)}</button>`}
      <div class="hero-footnotes"><span>${ico("keyboard",16)} KEYBOARD-FIRST GAMEPLAY</span><span>${ico("clock",16)} ~ 3 MINUTE MISSIONS</span><span>${ico("link",16)} INSTANT ROOM CODES</span></div>
    </div>
    <div class="hero-visual" aria-label="Stylized live mission radar preview">
      <div class="visual-top"><span class="mini-label">KEYSTORIA // STORY WORLD 01</span><span class="visual-live"><i></i> LIVE SIMULATION</span></div>
      <div class="sim-canvas">${stationArt()}<div class="radar-sweep"></div></div>
      <div class="floating-target panel-a"><span class="float-icon">${ico("target",16)}</span><div><span>PRIMARY OBJECTIVE</span><strong>BREACH MAINFRAME</strong></div><div class="panel-progress"><b></b></div></div>
      <div class="floating-target panel-b"><span class="threat-alert">!</span><div><span>INCOMING HOSTILES</span><strong>THREAT LVL: CRITICAL</strong></div><span class="tiny-bars">▂▄▆█</span></div>
      <div class="visual-bottom"><span>OPERATOR 01 // ACCESS</span><span>OPERATOR 02 // DEFENSE</span><span class="signal-icon">▂▄▆</span></div>
      <div class="visual-corner vcl"></div><div class="visual-corner vcr"></div>
    </div>
  </section>
  <div class="ticker"><div class="ticker-track"><span>24 WORLDS TO EXPLORE</span><b>✳</b><span>TYPE TO THE BEAT</span><b>✳</b><span>EVERY KEY OPENS A WORLD</span><b>✳</b><span>TRAIN · PLAY · EXPLORE</span><b>✳</b><span>24 WORLDS TO EXPLORE</span><b>✳</b></div></div>
  <section class="operations shell ${expanded?'missions-expanded':'missions-collapsed'}" id="operations">
    <div class="section-head"><div>${tag("PICK YOUR NEXT WORLD")}<h2>TWENTY-FOUR STORIES.<br/><span>YOUR NEXT ADVENTURE.</span></h2></div><div class="section-aside"><span>01 — 24</span><p>Pick an operation below. Expand the gallery whenever you want to explore all twenty-four stories.</p></div></div>
    <div class="mission-gallery-toolbar"><div><strong>${expanded?'ALL 24 OPERATIONS':'FEATURED OPERATIONS'}</strong><span>${expanded?'Explore every story and select a mission.':'Three starting missions · your current selection stays visible.'}</span></div><button type="button" class="mission-gallery-toggle" data-action="toggle-missions" aria-expanded="${expanded}" aria-controls="mission-gallery">${expanded?'SHOW FEWER MISSIONS':'VIEW ALL 24 MISSIONS'} ${ico('arrow',17)}</button></div>
    <div class="mission-grid" id="mission-gallery">${Object.entries(MISSIONS).map(([id,m],i) => `<button ${!expanded && i>=3 && id!==state.selectedMission?'hidden':''} class="mission-card ${state.selectedMission === id ? "active" : ""}" style="${missionColorStyle(id)}" data-action="choose-mission" data-mission="${id}" aria-pressed="${state.selectedMission === id}"><span class="mission-card-top"><span>OPERATION / ${m.no}</span><span class="card-selector">${state.selectedMission === id ? ico("check",14) : "+"}</span></span>${missionArt(id)}<span class="mission-cover-mark">${missionIcon(id)}</span><span class="mission-card-body"><span class="mission-genre">${m.tag}</span><strong>${m.name}</strong><span class="mission-desc">${m.sub}</span>${Number(localStorage.getItem(`panic.best.${id}`)) > 0 ? `<span class="mission-best">YOUR BEST: ${Number(localStorage.getItem(`panic.best.${id}`)).toLocaleString()} PTS</span>` : ""}</span><span class="mission-card-foot"><span>${state.selectedMission === id ? "SELECTED MISSION" : "SELECT OPERATION"}</span>${ico("arrow",17)}</span></button>`).join("")}</div>
  </section>
  <section class="lyric-home-teaser shell" id="lyric-lab"><div><span>// NEW · RHYTHM TYPING</span><h2>LYRIC <em>LAB.</em></h2><p>Type along with real songs and the original YouTube player. Search for timed lyrics, match the beat, and improve your accuracy—no music files required.</p></div><button class="btn btn-primary btn-large" data-action="lyric-open">${ico("play",20)} ENTER LYRIC LAB ${ico("arrow",18)}</button></section>
  ${trainingLibrary()}
  ${speedLibrary()}
  <section class="how shell" id="how-it-works"><div class="how-intro">${tag("THE RULES")}<h2>DIFFERENT ROLES.<br/><span>ONE SHARED FATE.</span></h2><p>It's not a race against your friend. It's a race against everything else. Build a shared signal pulse together, survive a crisis, and regroup for a rematch. ${BROWSER_EDITION ? "These co-op missions run in the local Python edition; this browser version offers the three practice modes." : ""}</p></div><div class="how-steps"><div class="how-step"><span class="step-id">01 // CONNECT</span><div class="step-icon">${ico("users",29)}</div><h3>FIND YOUR PERSON.</h3><p>Create a private room and share a six-character code. Or play with ECHO, your automated teammate.</p></div><div class="how-step"><span class="step-id">02 // SURVIVE</span><div class="step-icon">${ico("keyboard",29)}</div><h3>DO YOUR JOB.</h3><p>One operator types commands to complete the objective. The other types countermeasures to stop incoming attacks.</p></div><div class="how-step"><span class="step-id">03 // ADAPT</span><div class="step-icon">${ico("refresh",29)}</div><h3>SWITCH UNDER FIRE.</h3><p>Halfway through, your assignments reverse. Stay accurate, protect system integrity, and finish together.</p></div></div></section>
  <section class="record-section shell" id="career-record">
    <div class="record-head">${tag("OPERATOR DOSSIER / STORED ON THIS DEVICE")}<h2>YOUR FIELD <em>RECORD.</em></h2><p>Every operation leaves a mark. Your results stay in this browser, without an account.</p></div>
    <div class="record-metrics"><div><strong>${stats.runs}</strong><span>RUNS</span></div><div><strong>${stats.wins}</strong><span>EXTRACTIONS</span></div><div><strong>${stats.best.toLocaleString()}</strong><span>TOP SCORE</span></div><div><strong>${stats.unlocked} / ${MILESTONES.length}</strong><span>BADGES</span></div></div>
    <div class="milestone-grid">${MILESTONES.map(badge => `<div class="milestone ${badge.unlocked(career) ? "earned" : "locked"}"><span>${badge.unlocked(career) ? ico("check",17) : ico("lock",17)}</span><div><strong>${badge.title}</strong><small>${badge.detail}</small></div></div>`).join("")}</div>
    ${history.length ? `<div class="record-recent"><span>// RECENT OPERATIONS</span>${history.slice(0, 3).map(run => `<div><b>${safe(MISSIONS[run.mission]?.name || run.mission)}</b><span>${run.won ? "EXTRACTED" : "FAILED"}</span><strong>${run.score.toLocaleString()} PTS</strong></div>`).join("")}</div>` : ""}
  </section>
  <section class="closing-cta shell"><div><span>READY, OPERATOR?</span><h2>THE NEXT MOVE IS YOURS.</h2></div><button class="btn btn-primary" data-action="${BROWSER_EDITION ? 'speed-open' : 'solo'}">${BROWSER_EDITION ? 'PLAY SPEED LAB' : 'PLAY SOLO'} ${ico("arrow",19)}</button></section>
  </main><footer class="footer shell"><span>© 2026 KEYSTORIA // EVERY KEY OPENS A WORLD</span><span>V0.24 / THE KEYSTORIA ERA</span></footer>`;
}

function modalTemplate() {
  if(state.modal === "welcome") {
    return `<div class="modal-backdrop welcome-backdrop" data-action="close-modal"><div class="modal-panel welcome-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="welcome-description">
      <button class="close-modal" data-action="close-modal" aria-label="Close welcome guide">${ico("cross",20)}</button>
      <div class="welcome-modal-scroll">${tag("WELCOME / KEYSTORIA")}
      <h2 id="modal-title">EVERY KEYSTROKE<br><em>CHANGES THE STORY.</em></h2>
      <p id="welcome-description">${BROWSER_EDITION ? 'Welcome to the real Keystoria browser interface. Lyric Lab, Speed Lab, and Field Academy are playable here, with no download required. Story missions and co-op rooms require the local Python server.' : 'KEYSTORIA is a collection of typing adventures for curious players, music lovers, keyboard enthusiasts, and friends who want to learn and play together. Explore a story, follow a song, challenge your speed, or practice real-world commands.'}</p>
${BROWSER_EDITION ? `      <div class="welcome-ways">
        <article><span>01 / MUSIC</span><strong>${ico("headphones",17)} LYRIC LAB</strong><p>Type along with synchronized lyrics and get live, letter-by-letter feedback. Start with the original offline practice track or explore available songs.</p></article>
        <article><span>02 / SPEED</span><strong>${ico("keyboard",17)} SPEED LAB</strong><p>Practice typing in timed 15-, 30-, 60-, or 120-second rounds. Track speed, accuracy, and personal bests as you improve.</p></article>
        <article><span>03 / SKILLS</span><strong>${ico("keyboard",17)} FIELD ACADEMY</strong><p>Practice Linux, Windows PowerShell, and macOS commands in a safe simulation. Nothing runs on your device.</p></article>
      </div>` : `      <div class="welcome-ways">
        <article><span>01 / MOST POPULAR</span><strong>${ico("play",17)} SINGLE PLAYER</strong><p>Take on twenty-four short story missions with ECHO, your built-in automated teammate. Switch roles, respond to threats, and help the characters reach the ending.</p></article>
        <article><span>02 / TOGETHER</span><strong>${ico("users",17)} TWO PLAYER CO-OP</strong><p>Invite a friend with a private room code. One player advances the mission while the other keeps danger away. Halfway through, you switch.</p></article>
        <article><span>03 / PRACTICE</span><strong>${ico("keyboard",17)} SPEED LAB + ACADEMY</strong><p>Race the clock in a classic typing test, or learn practical Linux, Windows PowerShell, and macOS commands in a safe simulation.</p></article>
      </div>`}
      <p class="welcome-footnote">${BROWSER_EDITION ? 'This browser edition uses the original game controllers for practice modes. Music availability depends on external providers. The story missions shown in the gallery are previews until a game server is available.' : "Try Lyric Lab for music-backed karaoke typing, too. No account needed. Story commands are fictional; Academy commands are never executed on your device. The mission clock won't begin until you press Play."}</p></div>
      <button class="btn btn-primary btn-wide welcome-continue" data-action="close-modal">LET'S PLAY ${ico("arrow",18)}</button>
    </div></div>`;
  }
  if(state.modal === "settings") {
    const options = [
      ["largerType", "LARGER COMMAND TEXT", "Increase size of typing prompts and input."],
      ["highContrast", "HIGH CONTRAST", "Strengthen borders and muted interface text."],
      ["reducedMotion", "REDUCED MOTION", "Disable atmospheric animations and transitions."],
    ];
    return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-panel settings-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="close-modal" data-action="close-modal" aria-label="Close dialog">${ico("cross",20)}</button>
      ${tag("PERSONALIZE THE TERMINAL")}<h2 id="modal-title">DISPLAY SETTINGS.</h2><p>These settings only affect this browser. Your teammate can choose their own.</p><div class="settings-list">${options.map(([key, name, help])=>`<button class="setting-choice" data-action="setting" data-setting="${key}" aria-pressed="${state.preferences[key]}"><span><strong>${name}</strong><small>${help}</small></span><i class="setting-switch ${state.preferences[key] ? "on" : ""}"></i></button>`).join("")}</div><button class="btn btn-primary btn-wide" data-action="close-modal">DONE</button>
    </div></div>`;
  }
  if (state.modal === "guide" && state.room) {
    const t=state.room.missionInfo;
    return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-panel guide-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="close-modal" data-action="close-modal" aria-label="Close guide">${ico("cross",20)}</button>${tag("MISSION FIELD GUIDE")}<h2 id="modal-title">KNOW YOUR ROLE.</h2><p>${safe(t.briefing.opening)}</p><div class="guide-roles"><article><span>// HACKER</span><p>${safe(t.briefing.hacker)}</p></article><article><span>// DEFENDER</span><p>${safe(t.briefing.defender)}</p></article></div><p><strong>HOW TO PLAY:</strong> Type the exact phrase shown in the command card. Correct phrases resolve instantly; Enter submits a partial or wrong entry and costs integrity. The defender must finish before the attack timer runs out. After five hacker tasks, roles swap. A tactical decision and final crisis require coordination.</p><p class="guide-stakes">${safe(t.briefing.stakes)}</p><button data-action="close-modal" class="btn btn-primary btn-wide">RETURN TO MISSION</button></div></div>`;
  }
  const join = state.modal === "join";
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="close-modal" data-action="close-modal" aria-label="Close dialog">${ico("cross",20)}</button>
    ${tag(join ? "ESTABLISH UPLINK" : "NEW OPERATION")}
    <h2 id="modal-title">${join ? "JOIN A SQUAD." : "ASSEMBLE YOUR SQUAD."}</h2><p>${join ? "Enter your friend's room code and your callsign." : "Choose a callsign. We'll generate a secure six-character room code for your friend."}</p>
    <form id="session-form" class="session-form"><label for="callsign">YOUR CALLSIGN <span>MAX 18 CHARACTERS</span></label><input id="callsign" name="callsign" maxlength="18" autocomplete="nickname" placeholder="e.g. GHOST_01" value="${safe(state.nickname)}" required />
    ${join ? `<label for="room-code">ROOM CODE</label><input id="room-code" name="roomcode" class="code-field" maxlength="6" autocomplete="off" placeholder="XXXXXX" value="${safe(state.inviteCode || "")}" required />` : `<div class="modal-mission"><span>SELECTED OPERATION</span><strong>${safe(MISSIONS[state.selectedMission].name)}</strong><a href="#operations" data-action="edit-mission">CHANGE</a></div>`}
    <button class="btn btn-primary btn-wide" type="submit" ${state.online ? "" : "disabled"}>${join ? "CONNECT TO ROOM" : "GENERATE ROOM CODE"} ${ico("arrow",19)}</button></form>
    <div class="modal-alt">${join ? "NEED TO HOST?" : "HAVE A ROOM CODE?"} <button data-action="${join ? "create" : "show-join"}">${join ? "CREATE A ROOM" : "JOIN YOUR FRIEND"}</button></div>
  </div></div>`;
}

function lobbyTemplate(r) {
  const mission = MISSIONS[r.mission];
  const host = r.hostId === r.viewerId;
  const ready = r.players.length === 2 && r.players.every(p=>p.connected);
  const teammate = r.players.find(p => p.id !== r.viewerId);
  return `${header({inGame:true})}<main class="game-shell lobby"><div class="lobby-top">${tag("PRIVATE SQUAD LOBBY")}
    <button class="text-button" data-action="home">${ico("arrow",15)} EXIT TO MENU</button></div>
    <div class="lobby-heading"><div><h1>AWAITING <em>DEPLOYMENT.</em></h1><p>Set up your squad. The clock doesn't start until you say so.</p></div><div class="lobby-status"><span class="lobby-ping"></span>${ready ? "SQUAD READY" : "AWAITING OPERATOR"}</div></div>
    <div class="lobby-grid"><section class="lobby-panel lobby-room"><div class="panel-label">01 / INVITE YOUR PARTNER</div><h2>YOUR ROOM CODE</h2><div class="room-code">${[...r.code].map(ch=>`<span>${safe(ch)}</span>`).join("")}</div><button class="btn btn-outline btn-wide" data-action="copy-invite">${ico("copy",17)} COPY INVITE LINK</button><p class="fine-print">Share this code with a friend. Each player types on their own keyboard and screen.</p><div class="lobby-members"><div class="panel-label">CONNECTED OPERATORS</div>${r.players.map((p,i)=>`<div class="member-row"><span class="member-avatar">${i===0?"01":"02"}</span><div><strong>${safe(p.name)}</strong><small>${p.bot?"SIMULATED OPERATOR":p.id===r.hostId?"SQUAD HOST":"SQUAD MEMBER"}</small></div><span class="connected-tag">${p.connected?"CONNECTED":"OFFLINE"}</span></div>`).join("")}${!teammate?`<div class="member-row pending"><span class="member-avatar">??</span><div><strong>WAITING FOR FRIEND</strong><small>ROOM CODE: ${safe(r.code)}</small></div><span class="loading-dot"></span></div>`:""}</div></section>
    <section class="lobby-panel mission-choice"><div class="panel-label">02 / SELECT OPERATION</div><div class="lobby-mission-art theme-${r.mission}" style="${missionColorStyle(r.mission)}">${missionArt(r.mission)}<span class="mission-cover-mark mission-cover-mark-lobby">${missionIcon(r.mission)}</span><div class="lobby-art-shade"></div><span>OPERATION / ${mission.no}</span></div><div class="lobby-mission-name"><h2>${mission.name}</h2><span>${mission.tag}</span></div><p>${safe(r.missionInfo.story)}</p>
    <div class="lobby-mission-options">${Object.keys(MISSIONS).map(id=>`<button data-action="set-mission" data-mission="${id}" class="mini-mission ${r.mission===id?"selected":""}" ${host?"":"disabled"}>${MISSIONS[id].no} <span>${MISSIONS[id].name}</span>${r.mission===id?ico("check",15):""}</button>`).join("")}</div>
    <div class="difficulty-picker" aria-label="Mission difficulty"><div class="panel-label">03 / DIFFICULTY</div><div class="difficulty-options">
       ${[["story","CADET","Extra time"],["standard","STANDARD","Balanced"],["overdrive","OVERDRIVE","High pressure"]].map(([id,label,desc])=>`<button type="button" data-action="difficulty" data-difficulty="${id}" class="difficulty-option ${r.difficulty===id?"selected":""}" aria-pressed="${r.difficulty===id}" ${host?"":"disabled"}><strong>${label}</strong><small>${desc}</small></button>`).join("")}
    </div><p class="difficulty-caption">${r.difficultyLabel} selected · Difficulty changes the timer, threat speed, and damage. Only the host can change it.</p></div></section></div>
    <div class="lobby-guide"><div class="panel-label">WHAT YOU'RE ABOUT TO DO</div><p><strong>HACKER:</strong> ${safe(r.missionInfo.briefing.hacker)}</p><p><strong>DEFENDER:</strong> ${safe(r.missionInfo.briefing.defender)}</p><p><strong>WIN:</strong> ${safe(r.missionInfo.briefing.stageObjectives[1])}</p><span>You'll see the full story and a ready check before the countdown begins.</span></div>
    <div class="lobby-launch"><div><span class="launch-kicker">${ready ? "ALL SYSTEMS GREEN" : "WAITING FOR SECOND OPERATOR"}</span><p>${r.solo ? "ECHO will automatically perform the other role. You'll switch positions halfway through." : "You and your partner will receive different instructions. Communication is your advantage."}</p></div><button class="btn btn-primary btn-large" data-action="start" ${!ready||!host?"disabled":""}>${ico("play",18)} LAUNCH MISSION ${ico("arrow",18)}</button></div>
  </main>`;
}

function briefingTemplate(r) {
  const b=r.missionInfo.briefing;
  const mineReady=r.readyPlayers.includes(r.viewerId);
  return `${header({inGame:true})}<main class="game-shell briefing-page">
    <div class="briefing-heading">${tag(b.chapter)}<h1>${safe(r.missionInfo.title)}<span>.</span></h1><p>CONFIDENTIAL MISSION DOSSIER // ${safe(r.missionInfo.location)}</p></div>
    <div class="briefing-splash"><span>INCOMING TRANSMISSION</span><p>${safe(b.opening)}</p><div class="briefing-static" aria-hidden="true">///  O P E R A T I O N   I S   L I V E  ///</div></div>
    <div class="briefing-stations"><article class="briefing-station ${r.role==="hacker"?"assigned":""}"><span>STATION 01 / ACCESS ${r.role==="hacker"?"— YOUR ROLE":""}</span><h2>${safe(r.missionInfo.attack_title)}</h2><p>${safe(b.hacker)}</p></article><article class="briefing-station ${r.role==="defender"?"assigned":""}"><span>STATION 02 / PROTECTION ${r.role==="defender"?"— YOUR ROLE":""}</span><h2>${safe(r.missionInfo.defend_title)}</h2><p>${safe(b.defender)}</p></article></div>
    <div class="briefing-bottom"><div class="briefing-orders"><span>// MISSION ORDER</span><strong>${safe(b.stageObjectives[0])}</strong><small>Complete five hacker commands, coordinate a tactical decision, then switch roles for six final commands.</small><p>${safe(b.stakes)}</p></div><div class="briefing-confirm"><span>READY CHECK // ${r.readyPlayers.length} / 2 OPERATORS</span><div class="ready-list">${r.players.map(p=>`<span class="${r.readyPlayers.includes(p.id)?"is-ready":""}">${safe(p.name)} <b>${r.readyPlayers.includes(p.id)?"✓ READY":"WAITING"}</b></span>`).join("")}</div><button class="btn btn-primary btn-large" data-action="ready" ${mineReady?"disabled":""}>${mineReady?"AWAITING PARTNER":"I UNDERSTAND · READY TO DEPLOY"} ${ico("arrow",18)}</button><small>Your timer doesn't begin until both operators are ready and the countdown finishes.</small></div></div>
    </main>`;
}

function countdownTemplate(r) {
  const display = deploymentDisplay(r.countdownSeconds);
  const firstTask = r.role === "hacker" ? r.missionInfo.briefing.hacker : r.missionInfo.briefing.defender;
  const armed = r.phase === "armed";
  const confirmed = r.launchReadyPlayers?.includes(r.viewerId);
  return `${header({inGame:true})}<main class="countdown-page countdown-orientation"><div class="countdown-orbit" aria-hidden="true"></div>${tag("OPERATORS READY / TIMER PAUSED")}
    <h1>${armed ? "YOUR MISSION" : "MISSION BEGINS"} <em>${armed ? "IS READY." : "IN TEN."}</em></h1>
    <div class="countdown-assignment"><span>YOUR MISSION BRIEFING · READ BEFORE TYPING</span><p class="deployment-story">${safe(r.missionInfo.briefing.opening)}</p><span>YOU ARE THE ${safe(r.role.toUpperCase())}</span><strong>${safe(firstTask)}</strong><small>When the countdown finishes, the illustrated mission and typing field appear together. Type the highlighted command and press Enter. Your clock starts only after everyone presses Play.</small></div>
    <div class="launch-gate ${armed ? "is-armed" : ""}" id="launch-gate">
      ${armed ? `<button class="launch-play-button" type="button" data-action="launch" ${confirmed || r.paused ? "disabled" : ""} aria-label="${confirmed ? "Waiting for your partner" : "Start mission"}">${ico("play",35)} <span>${confirmed ? "WAITING FOR PARTNER" : "PLAY MISSION"}</span></button><p class="launch-gate-note">${confirmed ? "Your teammate has not pressed Play yet. Time and threats remain frozen." : "Take your time. The mission starts only when every human operator presses Play."}</p><div class="launch-gate-players">${r.players.map(p=>`<span class="${r.launchReadyPlayers?.includes(p.id) ? "confirmed" : ""}">${safe(p.name)} ${r.launchReadyPlayers?.includes(p.id) ? "✓ READY" : "AWAITING PLAY"}</span>`).join("")}</div>` : `<div class="countdown-number ${display.preparing ? "is-preparing" : ""}" id="deployment-count" aria-live="polite">${display.label}</div>`}
    </div>
    <span class="countdown-role" id="deployment-phase">${armed ? "PRESS PLAY WHEN YOU ARE COMFORTABLE" : display.instruction}</span><div class="deployment-track" role="progressbar" aria-label="Deployment countdown" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${r.countdownSeconds}"><span id="deployment-track-fill" style="width:${100*Math.max(0,Math.min(1,r.countdownSeconds/10))}%"></span></div><p>${safe(r.missionInfo.briefing.stageObjectives[0])}</p></main>`;
}

function metric(label, id, value, extra="") { return `<div class="metric"><span>${label}</span><strong id="${id}" class="${extra}">${value}</strong></div>`; }
function gameTemplate(r) {
  const hacking = r.role === "hacker";
  const t = r.missionInfo;
  const teammate = r.players.find(p=>p.id!==r.viewerId);
  const self = r.players.find(p=>p.id===r.viewerId);
  const mission = MISSIONS[r.mission];
  return `${header({inGame:true})}<main class="game-shell gameplay">
   <div class="game-topline"><div>${tag(t.location)}<h1>${safe(t.title)} <span>// SECTOR ${pad(r.stage)}</span></h1></div><div class="live-status"><span class="live-pulse"></span> ${r.paused?"CONNECTION INTERRUPTED":`${r.difficultyLabel.toUpperCase()} / MISSION LIVE`}</div></div>
   <div class="mission-now"><div><span>// CURRENT OBJECTIVE</span><strong id="current-objective">${safe(r.currentObjective)}</strong><small id="current-instructions">${safe(hacking?t.briefing.hacker:t.briefing.defender)}</small></div><button data-action="guide" type="button">${ico("alert",16)} HOW TO PLAY</button></div>
   <div class="mission-beat" id="mission-beat" aria-live="polite"></div>
   <div class="game-hud"><div class="hud-item hud-phase"><span>MISSION PHASE</span><strong>0<span id="hud-stage">${r.stage}</span> <small>/ 02</small></strong></div><div class="hud-item hud-timer"><span>TIME TO FAILURE</span><strong id="hud-time">${timeString(r.remaining)}</strong></div><div class="hud-item hud-stability"><span>SYSTEM INTEGRITY <b id="hud-integrity-num">${r.stability}%</b></span><div class="meter"><i id="hud-integrity-bar" style="width:${r.stability}%"></i></div></div><div class="hud-item hud-score"><span>SQUAD SCORE</span><strong id="hud-score">${r.players.reduce((a,p)=>a+p.score,0).toLocaleString()}</strong></div></div>
   <div class="game-columns">
   <section class="typing-zone" id="typing-zone" aria-label="Your typing assignment"><div class="typing-top"><span class="your-role">${ico(hacking?"keyboard":"shield",17)} ASSIGNED ROLE // <strong id="role-name">${hacking?"HACKER":"DEFENDER"}</strong></span><span class="role-switch-hint">SWAP AT HALFTIME ${ico("refresh",14)}</span></div>
     <div class="typing-main"><div class="mission-workspace"><div class="mission-visual-pane" aria-label="Live illustrated world">${missionScene(r)}</div><div class="mission-input-pane"><div class="mission-type-ready" role="note"><span class="mission-type-beacon" aria-hidden="true"></span><strong>YOUR TURN TO TYPE</strong><span>Read the phrase. Type it below. Press Enter to execute.</span></div><div id="crisis-banner" class="crisis-banner" hidden role="status"></div><span class="task-stamp">${hacking?"// 01 — SYSTEM INTERFACE":"// 02 — DEFENSE INTERFACE"}</span><div class="role-emblem">${ico(hacking?"bolt":"target",32)}</div><h2>${safe(hacking?t.attack_title:t.defend_title)}</h2><span class="step-context-label">// WHAT THIS ACTION DOES & WHY IT HELPS</span><p class="task-subtitle step-explanation" id="step-explanation">${safe(r.target?.explanation || (hacking ? "Awaiting your next mission step." : "Stay alert for an incoming threat."))}</p>
      <div class="tactic-panel" id="tactic-panel" ${r.tacticActive ? "" : "hidden"}>
        <div class="choice-callout" role="status">${ico("alert",18)} PICK AN OPTION TO CONTINUE</div><div class="tactic-heading"><span>${ico("alert",18)} // TACTICAL DECISION</span><strong>${safe(r.world.encounter)}</strong></div>
        <p>${safe(r.world.encounterIntro)}</p><div id="tactic-actions" class="tactic-actions"></div>
      </div>
      ${r.mission === "casefile" ? `<div id="accusation-panel" class="accusation-panel" ${r.accusationActive?"":"hidden"}><div class="choice-callout" role="status">${ico("alert",18)} PICK A SUSPECT TO CONTINUE</div><div class="accusation-heading">${ico("target",18)} // FINAL DEDUCTION <strong>WHO KILLED ELIAN VOSS?</strong></div><p>Compare your clues to the suspect list. The investigator must make the accusation while their partner protects the case file. Wrong choices damage the team's chances.</p><div class="accusation-options" id="accusation-options"></div><span id="accusation-attempts">${r.accusationAttempts} ACCUSATION${r.accusationAttempts===1?"":"S"} MADE</span></div>`:""}
      <div class="command-card"><div class="command-top"><span><i class="command-live"></i> <span id="command-label">${hacking?"ENCRYPTED COMMAND":"INCOMING THREAT"}</span></span><span id="command-index">SEQ // ${pad(r.progress+1)}</span></div>
      <div class="target-text typing-feedback" id="target-text" aria-live="off">${r.target?.text ? renderTypingFeedback(r.target.text, "", {caseSensitive:false}) : "SCANNING FOR SIGNAL..."}</div><div class="typing-legend"><span><i class="legend-correct"></i> CORRECT</span><span><i class="legend-incorrect"></i> INCORRECT</span><span><i class="legend-caret"></i> NEXT KEY</span></div><div class="command-bottom"><span>TYPE THE PHRASE BELOW</span><span id="live-typing-accuracy">100% ACCURATE</span></div></div>
      <label class="input-label" for="task-input">YOUR KEYBOARD IS THE CONTROLLER <span>↵ ENTER</span></label><div class="typing-input-wrap"><span class="input-chevron">›</span><input id="task-input" class="typing-input" type="text" aria-label="Type the command shown above" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="start typing here..." autofocus /><span class="input-enter">ENTER ↵</span></div><p class="input-hint">Accurate commands execute instantly. Wrong entries cost ${r.mistakePenalty}% integrity.</p>
     </div></div></div><div class="typing-footer"><div class="typing-footer-icon">${ico("alert",17)}</div><span>MISSION ALERT: <strong>${safe(mission.danger)}</strong></span><span class="kbd-graphic">[ W A S D ] // [ TYPE ]</span></div></section>
<aside class="mission-sidebar"><div class="sidebar-heading">// MISSION BRIEFING</div><div class="mission-goal"><small>PRIMARY OBJECTIVE</small><strong>${safe(t.goal)}</strong><span>STAGE ${pad(r.stage)} / TWO STAGES</span></div><div class="progress-header"><span>BREACH PROGRESS</span><b id="progress-caption">${pad(r.progress)} / ${pad(r.stageGoal)}</b></div><div class="progress-blocks" id="progress-blocks">${Array.from({length:r.stageGoal},(_,i)=>`<span class="${i<r.progress?"filled":""}"></span>`).join("")}</div>
      <div class="story-transmission" aria-live="polite"><span>◉ // LATEST STORY DEVELOPMENT</span><p id="story-moment">${safe(r.storyMoment || t.briefing.stageObjectives[r.stage-1])}</p></div>
      <div class="threat-monitor"><div class="sidebar-heading">// PROXIMITY ALERT</div><div class="threat-visual"><div class="threat-rings"><i></i><i></i><i></i><span>!</span></div></div><div class="threat-name" id="threat-name">${safe(r.threatName || "SCANNING...")}</div><div class="threat-timer"><span>TIME TO IMPACT</span><b id="threat-clock">${r.threatSeconds.toFixed(1)}s</b></div><div class="meter threat-meter"><i id="threat-bar" style="width:${Math.min(100,r.threatSeconds/r.threatTotal*100)}%"></i></div></div></aside>
<aside class="team-sidebar"><div class="sidebar-heading">// SQUAD TELEMETRY</div><div class="operator-card self-card"><div class="operator-head"><span class="op-number">01</span><span class="op-connected"><i></i> YOU</span></div><strong>${safe(self.name)}</strong><span class="op-role" id="self-role">${hacking?"HACKING SYSTEMS":"DEFENDING POSITION"}</span><div class="op-stats">${metric("SCORE","self-score",self.score.toLocaleString())}${metric("STREAK","self-streak",`${self.streak}×`)}</div></div><div class="operator-card ally-card"><div class="operator-head"><span class="op-number">02</span><span class="op-connected" id="ally-status"><i></i> ${teammate?.connected?"ONLINE":"OFFLINE"}</span></div><strong>${safe(teammate?.name||"UNKNOWN")}</strong><span class="op-role" id="ally-role">${hacking?"DEFENDING POSITION":"HACKING SYSTEMS"}</span><div class="op-stats">${metric("SCORE","ally-score",(teammate?.score||0).toLocaleString())}${metric("STREAK","ally-streak",`${teammate?.streak||0}×`)}</div></div>
     <div class="signal-panel"><div class="signal-top"><span>${ico("radio",17)} // SQUAD SIGNAL</span><b id="signal-charge">${r.syncCharge} / 4</b></div><div class="signal-segments" id="signal-segments">${Array.from({length:4},(_,i)=>`<i class="${i<r.syncCharge?"charged":""}"></i>`).join("")}</div><p>Both roles contribute. When fully charged, either operator can trigger a pulse to restore integrity and delay danger.</p><button class="btn btn-signal" id="pulse-button" data-action="pulse" ${r.syncReady?"":"disabled"}>${ico("heart",16)} ACTIVATE SIGNAL PULSE</button></div>
     <div class="quick-pings"><span>// QUICK SIGNALS</span><div><button data-action="ping" data-ping="help" title="Ask your teammate for support">NEED SUPPORT</button><button data-action="ping" data-ping="steady" title="Tell your teammate to hold steady">HOLD STEADY</button><button data-action="ping" data-ping="ready" title="Tell your teammate you're ready">I'M READY</button></div></div>
     ${r.mission==="casefile" ? `<div class="case-board"><div class="activity-title">// CASE EVIDENCE <span id="clue-count">${r.discovered.length} CLUES</span></div><div id="clue-list" class="clue-list">${r.discovered.length?r.discovered.map(c=>`<div>${safe(c)}</div>`).join(""):"<p>Investigate records to discover your first clue.</p>"}</div></div>`:""}
     <div class="activity-panel"><div class="activity-title">// EVENT FEED <span class="activity-live">● LIVE</span></div><div id="activity-list" class="activity-list"></div></div></aside></div>
   <section class="game-intelligence" aria-label="Additional mission information"><div class="intelligence-heading"><span>// FULL MISSION INTELLIGENCE</span><p>Everything else is still here. Your live scene and typing field stay together above.</p><button type="button" data-action="back-to-live">BACK TO LIVE GAME ↑</button></div>
   <div class="mission-tracker" role="group" aria-label="Overall mission progress"><div><span>◉ EXTRACTION PATH</span><strong id="extraction-text">${r.objectivesComplete ?? 0} / ${r.objectivesTotal ?? 11} OBJECTIVES SECURED</strong></div><div class="extraction-track"><i id="extraction-fill" style="width:${r.overallProgress ?? 0}%"></i></div><p id="extraction-message">${r.stage === 1 ? 'ACT I — ESTABLISH CONTROL. SWITCH ROLES AFTER FIVE OBJECTIVES.' : 'ACT II — FINAL RESCUE. THE FINISH LINE IS IN SIGHT.'}</p></div>
   <div class="world-console ${r.worldWarning ? "world-danger" : ""}" id="world-console" role="status">
     <div><span class="world-console-kicker">// SCENARIO PRESSURE</span><strong>${safe(r.world.label)}</strong><small id="world-status">${r.worldWarning ? safe(r.world.warningText) : safe(r.world.intro)}</small></div>
     <div class="world-monitor"><strong id="world-amount">${r.ambient}<span> / 100</span></strong><div class="world-track"><i id="world-track" style="width:${r.ambient}%"></i></div><span>${r.world.direction === "high" ? "100 = FAILURE" : "0 = FAILURE"}</span></div>
   </div>
   </section>
   <div class="game-lower"><span>◈ COMMAND LINK ESTABLISHED</span><span>END-TO-END REALTIME CO-OP // <span id="mission-net">CONNECTED</span></span></div>
  </main><div id="game-overlay"></div>`;
}

function resultsTemplate(r) {
 const win = r.phase === "won";
 const t = r.missionInfo;
 const combined = r.players.reduce((a,p) => a+p.correct,0);
 const typing = r.typing.find(p=>p.id===r.viewerId) || {accuracy:0,wpm:0};
 const earned = MILESTONES.filter(b=>b.unlocked(readCareer()));
 return `${header({inGame:true})}<main class="game-shell result-page"><div class="result-glow"></div><div class="result-content">${tag(win?"MISSION COMPLETE // ALL OPERATORS EXTRACTED":"MISSION FAILED // SIGNAL TERMINATED")}
  <div class="outcome-marquee ${win?'success':'failure'}" role="status"><span>${win?'✓ OPERATION SUCCESSFUL':'✕ OPERATION FAILED'}</span><strong>${win?'ALL OBJECTIVES CLEARED':'MISSION TERMINATED'}</strong></div>
  <div class="result-cinema ${win?'result-success':'result-failure'}" aria-label="Mission final scene">
    <div class="result-cinema-image" role="img" aria-label="${safe((sceneStory({...r,stage:win?2:r.stage,progress:win?6:r.progress})||[])[0] || t.title)}">${renderSceneSVG(r, win ? 11 : sceneStep(r), !win)}<span class="scene-camera-glow" aria-hidden="true"></span></div>
    <div class="result-cinema-caption"><span>${win?'OPERATION COMPLETED — EXTRACTION CONFIRMED':'OPERATION INTERRUPTED — REVIEW THE FAILURE'}</span><strong>${win?'100% SECURED':`${r.overallProgress ?? 0}% SECURED`}</strong><div class="result-cinema-meter"><i style="width:${win?100:r.overallProgress ?? 0}%"></i></div></div>
  </div>
  <div class="grade-orbit"><div class="grade-inner"><span>MISSION GRADE</span><strong>${safe(r.finalGrade)}</strong></div></div><h1>${safe(win?t.win:t.lose)}<span>.</span></h1><p>${win?"You trusted each other. You survived the switch. You made it out.":"The operation is over, but the next run could be the one. Regroup and try again."}</p>
  <section class="result-reason" aria-label="Mission outcome explanation"><span>// WHY THIS MISSION ENDED</span><strong>${safe(r.finishReason || (win?'You completed the operation.':'The operation ended before extraction.'))}</strong><small>${r.objectivesComplete ?? 0} OF ${r.objectivesTotal ?? 11} OBJECTIVES COMPLETE · ${safe(r.solo?'SOLO WITH ECHO':'TWO-PLAYER SQUAD')}</small></section>
  <section class="result-debrief"><span>// AFTER ACTION REPORT</span><p>${safe(win?t.briefing.outro : t.briefing.stakes)}</p>${r.accusationVerdict?`<div class="case-verdict">FINAL ACCUSATION CONFIRMED // ${safe(r.accusationVerdict)}</div>`:""}${r.discovered.length ? `<div class="result-evidence"><strong>EVIDENCE COLLECTED / ${r.discovered.length}</strong>${r.discovered.map(clue=>`<div>${safe(clue)}</div>`).join("")}</div>`:""}</section>
  ${storyReelTemplate(r)}
  ${r.fieldOps?.history?.length ? `<section class="result-debrief field-history"><span>// DECISIONS THAT CHANGED YOUR WORLD</span>${r.fieldOps.history.map(item=>`<article><strong>ACT ${item.stage} · ${safe(item.label)}</strong><p>${safe(item.outcome)}</p><small>ACTIVATED BY ${safe(item.operator)}</small></article>`).join("")}</section>` : ""}
  ${r.storyRecap?.length ? `<section class="result-debrief story-chronicle"><span>// WHAT YOUR ACTIONS CHANGED</span><ol>${r.storyRecap.map(item=>`<li>${safe(item)}</li>`).join("")}</ol></section>` : ""}
  <div class="result-stats"><div><small>TOTAL SCORE</small><strong>${r.finalScore.toLocaleString()}</strong></div><div><small>COMMANDS COMPLETED</small><strong>${pad(combined)}</strong></div><div><small>REMAINING INTEGRITY</small><strong>${r.stability}%</strong></div><div><small>TIME LEFT</small><strong>${timeString(r.remaining)}</strong></div></div>
  <div class="result-personal"><div><span>YOUR ACCURACY</span><strong>${typing.accuracy}%</strong></div><div><span>YOUR TYPING SPEED</span><strong>${typing.wpm} WPM</strong></div><div><span>WORLD ${safe(r.world.label)}</span><strong>${r.ambient}/100</strong></div></div>
  ${earned.length ? `<div class="result-badges"><span>// UNLOCKED BADGES</span><p>${earned.map(badge => `<b>${safe(badge.title)}</b>`).join("")}</p></div>` : ""}
  <p class="result-special">${r.difficultyLabel.toUpperCase()} DIFFICULTY · ${r.pulsesUsed} SQUAD PULSE${r.pulsesUsed===1?"":"S"} ACTIVATED</p>
  <div class="result-players">${r.players.map(p=>`<div><span>${safe(p.name)} ${p.bot?"[AI]":""}</span><strong>${p.score.toLocaleString()} PTS</strong><small>${p.correct} CORRECT / ${p.mistakes} ERRORS / BEST STREAK ${p.bestStreak}</small></div>`).join("")}</div>
  <div class="result-buttons">${r.viewerId===r.hostId?`<button class="btn btn-primary btn-large" data-action="rematch">${ico("refresh",18)} REMATCH WITH SQUAD</button>`:"<span class='result-wait'>Waiting for the host to start a rematch...</span>"}<button class="btn btn-outline btn-large" data-action="copy-result">${ico("copy",18)} SHARE RESULT</button><button class="btn btn-outline btn-large" data-action="home">BACK TO MENU</button></div></div></main>`;
}


  return { homeTemplate, modalTemplate, lobbyTemplate, briefingTemplate, countdownTemplate, gameTemplate, resultsTemplate, header };
}
