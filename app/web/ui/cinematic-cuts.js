/** Animated, locally rendered close-up for the currently active story beat.
 *
 * Each typed objective cuts to a different prop. SVG layers are cheap to animate
 * and remain resolution-independent; no external video, sprites, or audio.
 * The moving charge bar is driven by the player's typed characters while the
 * scene selection is driven strictly by confirmed server progress.
 */
import { currentShot } from './cinematic-storyboards.js';
import { safe } from './helpers.js';

const palettes = {
  station: ['#97f8d0','#4b94cf'], hollow: ['#f5c6e7','#9670bd'],
  outbreak: ['#b6ffc3','#419f83'], casefile: ['#f9d79e','#c17b75'],
  dead_air: ['#a7ecff','#368ebd'], last_stop: ['#ffdb9b','#e17f61'],
  abyss: ['#a6f9ef','#248aa0'], neon: ['#ff9ce4','#9367ff'],
  red_horizon: ['#ffcb9e','#f38867'], whiteout:['#c2f5ff','#568ba6'],
  ashfall:['#ffd9a2','#d86c41'], carnival:['#b8dbff','#647ac2'],
  mirrorfall:['#dac5ff','#7e87d8'], four_winds:['#b3ffe6','#60bad4'],
  dawnforge:['#ffdc96','#c67955'], glass_trials:['#ffe2a0','#659bcf'],
  wildbond:['#b8ffcb','#56bc8c'], stardoor:['#d9cdff','#778ee1'],
};
const circles = (color) => `<g class="shot-sonar-sweep">
  <circle r="65" fill="none" stroke="${color}" stroke-width="2" opacity=".66"/>
  <circle r="43" fill="none" stroke="${color}" opacity=".4"/><circle r="21" fill="none" stroke="${color}" opacity=".5"/>
  <path d="M-78 0H78 M0 -78V78" stroke="${color}" opacity=".27"/>
  <path d="M0 0L57 -47A74 74 0 0 1 65 38Z" fill="${color}" opacity=".18" class="shot-radar"/>
  <circle cx="31" cy="-26" r="6" fill="${color}" class="shot-ping"/>
  </g>`;
const scope = (color) => `<path d="M-108 45Q-89 45 -75 36T-44 42T-7 10T29 31T70 15T108 34" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round" class="shot-wave"/>
  <path d="M-108 65H110" stroke="${color}" opacity=".35" stroke-dasharray="8 5"/>
  ${Array.from({length:9}, (_,i)=>`<rect x="${-93+i*24}" y="${-20+(i%3)*6}" width="12" height="${18+(i*7)%44}" rx="3" fill="${color}" opacity="${.28+i*.055}" class="shot-eq"/>`).join('')}`;
const machine = (color) => `<g class="shot-machine"><rect x="-92" y="-62" width="184" height="118" rx="12" fill="#162c39" stroke="${color}" stroke-width="4"/>
 <rect x="-72" y="-44" width="144" height="62" rx="5" fill="#0e1b28" stroke="${color}" opacity=".74"/>
 ${Array.from({length:6},(_,i)=>`<rect x="${-58+i*20}" y="${-27+i%3*11}" width="13" height="13" rx="2" fill="${i<3?color:'#314a55'}" opacity=".8" class="shot-led"/>`).join('')}
 <circle cx="-48" cy="35" r="9" fill="${color}" class="shot-ping"/><path d="M-24 35h90" stroke="${color}" stroke-width="4" stroke-dasharray="13 7"/></g>`;
const lock = (color) => `<g class="shot-lock"><rect x="-71" y="-10" width="142" height="99" rx="9" fill="#172631" stroke="${color}" stroke-width="4"/>
 <path d="M-44 -11v-31a44 44 0 0 1 88 0v31" fill="none" stroke="${color}" stroke-width="10"/>
 <circle cy="29" r="12" fill="${color}"/><path d="M0 37v25" stroke="${color}" stroke-width="8"/></g>`;
const door = (color) => `<g class="shot-door"><rect x="-105" y="-78" width="210" height="158" rx="7" fill="#101c2a" stroke="${color}" stroke-width="5"/>
 <rect class="shot-door-left" x="-100" y="-72" width="98" height="144" fill="#375365" stroke="${color}" stroke-width="2"/>
 <rect class="shot-door-right" x="2" y="-72" width="98" height="144" fill="#375365" stroke="${color}" stroke-width="2"/>
 <path d="M-60 -50v100M60 -50v100" stroke="${color}" opacity=".35" stroke-width="5"/></g>`;
const vehicle = (color, type) => `<g class="shot-vehicle">
 ${type==='submarine'?'<path d="M-112 13Q-103 -34 12 -34H71Q108 -18 115 12Q87 52 -33 52H-65Q-106 42 -112 13"/>':
 type==='train'?'<path d="M-100 -51h155l47 35v80h-202Z"/>':
 type==='shuttle'?'<path d="M-10 -84 33 -19 77 59 5 37 -75 59 -30 -19Z"/>':
 '<path d="M-86 28 -24 -48 21 -48 94 31 27 54 -25 52Z"/>'}
 <circle cx="-31" cy="3" r="15" fill="${color}" opacity=".74"/><circle cx="19" cy="3" r="15" fill="${color}" opacity=".74"/>
 <path d="M-142 74l45 -9M-140 44l40 -4" stroke="${color}" stroke-width="5" class="shot-motion"/>
 </g>`;
const map = (color) => `<g class="shot-map"><rect x="-112" y="-72" width="224" height="154" rx="6" fill="#1b3843" stroke="${color}" stroke-width="4"/>
 ${Array.from({length:5},(_,i)=>`<path d="M${-100+i*42} -67v138 M-105 ${-59+i*31}h206" stroke="${color}" opacity=".16"/>`).join('')}
 <path class="shot-route" d="M-84 44 -42 8 -9 25 36 -30 87 -52" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-dasharray="11 6" fill="none"/>
 <circle cx="-84" cy="44" r="9" fill="${color}"/><circle class="shot-ping" cx="87" cy="-52" r="12" fill="${color}"/></g>`;
const casefiles = (color) => `<g class="shot-files"><g transform="rotate(-12)"><rect x="-82" y="-79" width="155" height="143" fill="#e7d7b2" stroke="${color}" stroke-width="3"/><path d="M-56 -50h98M-56 -32h83M-56 -14h93M-56 4h61" stroke="#786254" stroke-width="6" opacity=".7"/></g>
 <rect x="-36" y="18" width="126" height="64" fill="#283a43" stroke="${color}" stroke-width="4" transform="rotate(9)"/>
 <circle cx="40" cy="30" r="26" fill="none" stroke="${color}" stroke-width="5" class="shot-ping"/></g>`;
const vial = (color) => `<g class="shot-vial"><rect x="-24" y="-72" width="48" height="28" rx="5" fill="#a8cbcb"/>
 <path d="M-22 -40v26l-38 69q-9 27 17 28h86q27 -1 17 -28L22 -14v-26" fill="#102c33" stroke="${color}" stroke-width="6"/>
 <path class="shot-liquid" d="M-38 42Q0 34 38 42l16 22q0 11 -17 11h-74q-20 0 -17 -11Z" fill="${color}" opacity=".64"/>
 ${Array.from({length:5},(_,i)=>`<circle cx="${-26+i*13}" cy="${25-(i%3)*14}" r="${2+i%3}" fill="${color}" class="shot-bubble"/>`).join('')}</g>`;
const greenhouse = (color) => `<g class="shot-plant"><path d="M-90 65Q-92 -87 0 -88Q92 -85 90 65" fill="#162b35" stroke="${color}" stroke-width="6"/>
 <path d="M-74 65h148M0 -88v153" stroke="${color}" opacity=".45" stroke-width="4"/>
 <path d="M0 67V-20" stroke="${color}" stroke-width="7"/>
 <path d="M0 13Q-57 -46 -60 2Q-30 30 0 13M0 -2Q52 -61 65 -7Q37 18 0 -2" fill="${color}" opacity=".76" class="shot-leaves"/></g>`;
const ritual = (color) => `<g class="shot-ritual"><circle r="76" fill="none" stroke="${color}" stroke-width="4" stroke-dasharray="10 7" class="shot-ring"/>
 <path d="M0 -73 64 35 -64 35Z M0 73 64 -35 -64 -35Z" fill="none" stroke="${color}" stroke-width="4"/>
 <circle r="22" fill="${color}" opacity=".65" class="shot-ping"/></g>`;
const battery = (color) => `<g class="shot-power"><rect x="-90" y="-69" width="178" height="138" rx="12" fill="#18303a" stroke="${color}" stroke-width="5"/>
 <rect x="-66" y="-40" width="132" height="81" fill="#0b1b27" stroke="${color}" opacity=".65"/>
 <path d="M12 -34 -28 13h30l-14 29 47 -47h-31Z" fill="${color}" class="shot-ping"/>
 ${Array.from({length:3},(_,i)=>`<circle cx="${-50+i*49}" cy="58" r="5" fill="${color}" class="shot-led"/>`).join('')}</g>`;
const antenna = (color) => `<g class="shot-antenna"><path d="M0 78 -30 -54 0 -89 30 -54Z" fill="#263d4d" stroke="${color}" stroke-width="5"/>
 <path d="M-40 79h80M-20 -42h40M-16 -10h32M-25 20h50" stroke="${color}" stroke-width="6"/>
 ${[40,70,100].map(r=>`<path class="shot-signal" d="M${-r} ${-65}a${r} ${r} 0 0 1 ${r*2} 0" stroke="${color}" stroke-width="4" fill="none" opacity=".7"/>`).join('')}</g>`;

const focusKind = {
  sonar:'radar', signal:'scope', radio:'scope', frequency:'scope', relay:'antenna', broadcast:'scope',
  antenna:'antenna', beacon:'antenna', map:'map', route:'map', flood:'map', shelter:'map', surface:'map',
  key:'lock', lock:'lock', door:'door', shield:'ritual', sigil:'ritual', ghost:'ritual', candle:'ritual',
  book:'files', ledger:'files', evidence:'files', archive:'files', camera:'scope', clock:'scope',
  signature:'files', phone:'scope', decrypt:'files', scanner:'radar', crew:'radar', pressure:'scope',
  dna:'vial', vial:'vial', filter:'vial', oxygen:'scope', greenhouse:'plant',
  engine:'vehicle', starship:'vehicle', shuttle:'vehicle', submarine:'vehicle', train:'vehicle',
  passengers:'vehicle', brakes:'vehicle', throttle:'vehicle', winch:'vehicle', ballast:'vehicle', landing:'vehicle',
  power:'battery', battery:'battery', pump:'battery', solar:'battery', light:'battery',
  console:'machine', tether:'machine', portal:'door', earth:'map', tower:'antenna', fire:'ritual', air:'antenna', water:'vial', guardian:'ritual', rain:'vial', solar:'battery', chain:'lock', gear:'machine', contract:'files', sunrise:'battery', footprints:'map', creature:'vial', tree:'plant', cage:'lock', nest:'plant', seed:'plant', memory:'files', bridge:'map', gravity:'machine',
};

/** Story-relevant words are revealed in-place, never as victory popups.
 * The message stays the same for all players in a mission and never grants progress.
 */
const CLUES = {
  station:'RESCUE CHANNEL 12 IS OPEN', hollow:'THE SPIRIT WANTS TO BE FREE',
  outbreak:'THE PATHOGEN HAS A WEAKNESS', casefile:'THE PAINTING WAS A FORGERY',
  dead_air:'SHELTER EAST IS STILL OCCUPIED', last_stop:'DISCONNECT THE REMOTE THROTTLE',
  abyss:'THREE SURVIVORS IN PELICAN NINE', neon:'THE ORIGINAL WATER TESTS EXIST',
  red_horizon:'SIX SETTLERS AWAIT EXTRACTION', whiteout:'THE FLIGHT PLAN WAS ALTERED',
  ashfall:'THE QUARRY ROUTE IS OPEN', carnival:'THE MANAGER TOOK THE GENERATOR',
  mirrorfall:'THE SCHOOL IS BENEATH CINEMA', four_winds:'THE WEATHERKEEPER CUT THE WARDS',
  dawnforge:'THE ORACLE FORGED THE PROPHECY', glass_trials:'SPONSOR TRAPS STILL ACTIVE',
  wildbond:'THE RANGER SOLD THE HEART SEEDS', stardoor:'BRAM TRADED THE REALM MEMORIES',
};
export function decodeRevealText(mission, objective='') {
  const fallback = String(objective).replace(/[^a-z0-9 ]/gi,' ').replace(/\s+/g,' ').trim().toUpperCase();
  return (CLUES[mission] || fallback || 'THE SIGNAL IS CLEAR').slice(0,24);
}
export function partialDecode(cipher, plaintext, fraction) {
  const clear=String(plaintext ?? '');
  const noise=String(cipher ?? '');
  const reveal=Math.min(clear.length,Math.max(0,Math.floor(Math.max(0,Math.min(1,Number(fraction)||0))*clear.length)));
  return clear.slice(0,reveal)+noise.slice(reveal).padEnd(Math.max(0,clear.length-reveal),'·');
}
const shiftCipher=text=>String(text).replace(/[A-Z]/g, c=>String.fromCharCode(65+(c.charCodeAt(0)-65+7)%26)).replace(/ /g,'·');
const compactText = (text='', words=4) => String(text).replace(/[^a-z0-9\s]/gi,' ').trim().split(/\s+/).filter(Boolean).slice(0,words).join(' ').toUpperCase() || 'LIVE FEED';
const clipLine = (text='', len=22) => {
  const clean = String(text).replace(/\s+/g,' ').trim().toUpperCase();
  return clean.length > len ? `${clean.slice(0, len-1)}…` : clean;
};
const encodedLine = (text='') => clipLine(String(text).toUpperCase().replace(/[A-Z]/g, ch => String.fromCharCode(65 + ((ch.charCodeAt(0) - 65 + 7) % 26))).replace(/[AEIOU]/g,'•').replace(/\s/g,'·'), 22);
const splitLabel = (text='', words=8) => {
  const parts = compactText(text, words).split(' ');
  const mid = Math.max(1, Math.ceil(parts.length / 2));
  return [parts.slice(0, mid).join(' ') || 'MISSION', parts.slice(mid).join(' ') || 'READY'];
};
function statusPack(kind, focus, objective, explanation) {
  const fallback = compactText(objective || focus, 4);
  if (kind === 'scope' || kind === 'antenna') {
    return {
      mode: 'SIGNAL DECRYPT',
      headA: 'ENCRYPTED',
      headB: 'DECODED',
      lineA: encodedLine(objective || focus),
      lineB: clipLine(explanation || fallback, 22),
      statusA: 'CHANNEL LOCK',
      statusB: 'DISTRESS LINK'
    };
  }
  if (kind === 'map') {
    return {
      mode: 'ROUTE SOLVER',
      headA: 'HAZARD MAP',
      headB: 'SAFE PATH',
      lineA: clipLine(fallback, 22),
      lineB: clipLine(explanation || 'EXTRACTION ROUTE OPEN', 22),
      statusA: 'GRID MATCH',
      statusB: 'EGRESS GREEN'
    };
  }
  if (kind === 'lock' || kind === 'door') {
    return {
      mode: 'ACCESS OVERRIDE',
      headA: 'LOCK STATE',
      headB: 'UNSEALED',
      lineA: clipLine(fallback, 22),
      lineB: clipLine(explanation || 'CORRIDOR ACCESS CLEARED', 22),
      statusA: 'CONTROL AUTH',
      statusB: 'PATH OPEN'
    };
  }
  if (kind === 'vial' || kind === 'battery' || kind === 'plant') {
    return {
      mode: 'SYSTEM STABILIZE',
      headA: 'INPUT',
      headB: 'RESULT',
      lineA: clipLine(fallback, 22),
      lineB: clipLine(explanation || 'PRIMARY SYSTEMS RECOVERED', 22),
      statusA: 'ANALYSIS',
      statusB: 'RECOVERY'
    };
  }
  if (kind === 'files' || kind === 'machine') {
    return {
      mode: 'EVIDENCE SYNC',
      headA: 'SOURCE',
      headB: 'VERIFIED',
      lineA: clipLine(fallback, 22),
      lineB: clipLine(explanation || 'INTEL CONFIRMED', 22),
      statusA: 'TRACE DATA',
      statusB: 'CASE LINK'
    };
  }
  if (kind === 'vehicle') {
    return {
      mode: 'EXTRACTION COORD',
      headA: 'VEHICLE',
      headB: 'CLEARED',
      lineA: clipLine(fallback, 22),
      lineB: clipLine(explanation || 'EXTRACTION WINDOW OPEN', 22),
      statusA: 'DRIVE SYSTEM',
      statusB: 'MOVEMENT'
    };
  }
  return {
    mode: 'TACTICAL FEED',
    headA: 'OBJECTIVE',
    headB: 'OUTCOME',
    lineA: clipLine(fallback, 22),
    lineB: clipLine(explanation || fallback, 22),
    statusA: 'LIVE TASK',
    statusB: 'MISSION FLOW'
  };
}

function renderStoryHUD(room, focus, kind, color, secondary) {
  const objective = room?.target?.text || room?.currentObjective || focus;
  const explanation = room?.target?.explanation || currentShot(room, room?.stage===1 ? 0 : 6).dialogue || objective;
  const labels = splitLabel(objective, 6);
  const wantsDecode=/(decode|decrypt|recover.*recording|reconstruct.*call|distress recording)/i.test(objective);
  const status = statusPack(kind, focus, objective, explanation);
  const clearText=decodeRevealText(room.mission, objective);
  const ciphertext=shiftCipher(clearText);
  return `<g class="shot-story-ui" aria-hidden="true">
    <rect x="456" y="57" width="118" height="77" rx="10" fill="#0b1925" stroke="${color}" stroke-opacity=".38"/>
    <text x="468" y="73" fill="${color}" font-size="8.8" font-family="monospace" letter-spacing="1.1">${safe(status.mode)}</text>
    <text x="468" y="90" fill="#9ecad8" font-size="7.5" font-family="monospace">${safe(status.headA)}</text>
    ${wantsDecode ? `<text x="468" y="105" fill="#d7e8ef" font-size="10" font-family="monospace" class="shot-story-message is-decoding" data-encoded="${safe(ciphertext)}" data-decoded="${safe(clearText)}">${safe(ciphertext)}</text>` : `<text x="468" y="105" fill="#d7e8ef" font-size="10.5" font-family="monospace" class="shot-story-encoded">${safe(status.lineA)}</text><text x="468" y="105" fill="#ffffff" font-size="10.5" font-family="monospace" class="shot-story-decoded">${safe(status.lineB)}</text>`}
    <text x="468" y="123" fill="#8caab7" font-size="7.2" font-family="monospace">${safe(status.statusA)}</text>

    <rect x="581" y="57" width="160" height="77" rx="10" fill="#0d1e2c" stroke="${secondary}" stroke-opacity=".33"/>
    <text x="594" y="73" fill="${secondary}" font-size="8.8" font-family="monospace" letter-spacing="1.1">CURRENT STORY BEAT</text>
    <text x="594" y="92" fill="#ffffff" font-size="11.5" font-family="monospace">${safe(labels[0])}</text>
    <text x="594" y="107" fill="#ffffff" font-size="11.5" font-family="monospace">${safe(labels[1])}</text>
    <rect x="594" y="116" width="134" height="5" rx="2.5" fill="#314653" opacity=".5"/>
    <rect x="594" y="116" width="134" height="5" rx="2.5" fill="${color}" class="shot-story-progress"/>
    <text x="594" y="130" fill="#9ecad8" font-size="7.2" font-family="monospace">${safe(status.statusB)}</text>
  </g>`;
}

/** Art is authored locally and parameterized by shot: 99 action transitions. */
export function renderCinematicCut(room, step) {
  const {focus,index} = currentShot(room,step);
  const [color,secondary] = palettes[room.mission] || palettes.station;
  const kind = focusKind[focus] || 'machine';
  const prop = kind==='radar' ? circles(color) : kind==='scope' ? scope(color)
    : kind==='lock' ? lock(color) : kind==='door' ? door(color)
    : kind==='vehicle' ? vehicle(color,focus) : kind==='map' ? map(color)
    : kind==='files' ? casefiles(color) : kind==='vial' ? vial(color)
    : kind==='plant' ? greenhouse(color) : kind==='ritual' ? ritual(color)
    : kind==='battery' ? battery(color) : kind==='antenna' ? antenna(color)
    : machine(color);
  const title = focus.replaceAll('_',' ').toUpperCase();
  const alert = room.worldWarning || room.crisisActive;
  const objectiveTitle = compactText(room?.target?.text || room?.currentObjective || title, 5);
  return `<g class="cinematic-closeup" data-focus="${safe(focus)}">
    <defs><linearGradient id="cut-panel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#091827" stop-opacity=".98"/><stop offset="1" stop-color="${secondary}" stop-opacity=".87"/></linearGradient></defs>
    <rect x="430" y="30" width="326" height="206" rx="10" fill="url(#cut-panel)" stroke="${color}" stroke-opacity=".75" stroke-width="2"/>
    <path d="M444 55h16M444 55v17M740 55h-16M740 55v17M444 209h16M444 209v-17M740 209h-16M740 209v-17" stroke="${color}" stroke-width="3" fill="none"/>
    <text x="449" y="48" fill="${color}" font-size="11" font-family="monospace">CLOSEUP / ${String(index+1).padStart(2,'0')} : ${title}</text>
    <text x="736" y="48" text-anchor="end" fill="#e3edf1" font-size="9.5" font-family="monospace">${safe(objectiveTitle)}</text>
    <path d="M458 141H728" stroke="#7da2b0" stroke-opacity=".12" stroke-dasharray="6 6"/>
    <g transform="translate(592 167)" fill="#284557" stroke="${color}" stroke-width="3">${prop}</g>
    ${renderStoryHUD(room, focus, kind, color, secondary)}
    <rect x="458" y="222" width="270" height="3" rx="1.5" fill="${secondary}" opacity=".35"/>
    <rect id="shot-completion-fill" x="458" y="222" width="0" height="3" rx="1.5" fill="${color}"/>
    ${alert ? `<circle cx="734" cy="40" r="6" fill="#ff8188" class="shot-ping"/>` : ''}
  </g>`;
}

export function setCinematicTypingProgress(room, typed) {
  const target = room?.target?.text || '';
  const field = document.getElementById('shot-completion-fill');
  if (!field) return;
  // Only a correct prefix advances the visual actuator. Incorrect letters can
  // still be corrected using Backspace without falsely granting progress.
  let count = 0;
  while(count < typed.length && count < target.length &&
    typed[count].toLowerCase() === target[count].toLowerCase()) count += 1;
  const fraction = target ? count / target.length : 0;
  field.setAttribute('width', String(Math.round(270 * fraction)));
  const message=document.querySelector('.cinematic-closeup .shot-story-message');
  if(message) message.textContent=partialDecode(message.getAttribute('data-encoded'),message.getAttribute('data-decoded'),fraction);
  // The physical prop reacts as well: doors part, maps trace routes, liquids
  // fill, and vehicles move while the player enters a correct prefix.
  const camera=document.getElementById('cinema-art');
  if(camera){
    const defender=room?.role === 'defender';
    camera.style.setProperty('--typing-progress', defender ? '0' : String(fraction));
    camera.style.setProperty('--defense-progress', defender ? String(fraction) : '0');
    camera.dataset.typingPhase=fraction<.25?'starting':fraction<.65?'engaged':fraction<1?'finalizing':'complete';
  }
  document.getElementById('cinema-action-status')?.replaceChildren(document.createTextNode(
    room?.role === 'hacker' ? `ACTION IN PROGRESS · ${Math.round(fraction*100)}%` :
    `DEFENSE INTERCEPT · ${Math.round(fraction*100)}%`));
}

Object.assign(palettes, {"clockfall": ["#7ff2eb", "#347e9b"], "nightmarket": ["#ff96c9", "#a9518d"], "emberwing": ["#ffac52", "#c66b3e"], "deepvault": ["#74c5ff", "#2d7a9e"], "aurora_arc": ["#a5ff9c", "#5196aa"], "inkbound": ["#f4d59d", "#a786a0"]});
Object.assign(CLUES, {"clockfall": "THE AI ORDERED THE REWIND", "nightmarket": "THE NAMES WERE STOLEN", "emberwing": "THE SKYGUARD TOOK THE EGGS", "deepvault": "THE GOVERNOR HID THE COLLAPSE", "aurora_arc": "THE AURORA IS ALIVE", "inkbound": "THE SCRIBE FORGED THE THRONE"});
