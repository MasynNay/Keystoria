/** Small local SVG illustrations that react to confirmed mission progression. */
import { renderSceneEffects } from './scene-effects.js';
import { renderCinematicCut } from './cinematic-cuts.js';
import { renderSceneDepth } from './scene-depth.js';
import { renderSceneDirector } from './scene-director.js';
import { renderStoryVista } from './scene-vistas.js';
import { renderActionStage } from './scene-action-stage.js';
import { renderLegendScene } from './scene-legends.js';
import { renderFrontierScene } from './scene-frontier.js';

const backdrop = (a, b) => `<defs><linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><linearGradient id="scene-metal" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#92b7c1"/><stop offset="1" stop-color="#1f3546"/></linearGradient></defs><rect width="780" height="260" fill="url(#scene-sky)"/>`;
const dots = Array.from({length:19},(_,i)=> `<circle cx="${25+(i*173)%730}" cy="${14+(i*67)%104}" r="${i%4===0?1.8:.85}" fill="#d8f5fa" opacity="${i%3===0?.7:.35}"/>`).join('');

function trainArt(step, danger) {
  const x = 95 + Math.min(11,step)*38;
  const brakes = step>=10;
  return `${backdrop('#07192b','#34445a')}${dots}
    <path d="M0 190 95 90 240 178 395 84 585 173 695 76 780 137V260H0Z" fill="#203247"/>
    <path d="M0 238 155 170 270 225 440 155 605 207 780 145V260H0Z" fill="#101e2b"/>
    <path d="M0 246 780 218" stroke="#728b91" stroke-width="6"/><path d="M0 255 780 227" stroke="#394951" stroke-width="11"/>
    <path d="M620 224 668 222M728 220 780 218" stroke="#b7bfc2" stroke-width="10"/>
    <path d="M675 216 718 254 751 249" fill="none" stroke="#be674b" stroke-width="4"/>
    <path d="M652 226 675 246M739 235 756 211" stroke="#b7a18b" stroke-width="2"/>
    <path d="M675 225 675 174" stroke="#f1786c" stroke-width="3"/><path d="M661 174h28v24h-28z" fill="#7c232b" stroke="#f8987c" stroke-width="2"/><text x="675" y="191" font-size="15" fill="#fff" text-anchor="middle">!</text>
    <g transform="translate(${x},0)"><rect x="-90" y="172" width="154" height="49" rx="9" fill="#314958" stroke="#9bb9c5" stroke-width="2"/><path d="M-65 172 0 146 61 165v7Z" fill="#658494" stroke="#a6c7d4" stroke-width="2"/>
    <rect x="-53" y="171" width="35" height="19" rx="3" fill="#8edaff" opacity=".7"/><rect x="-8" y="166" width="33" height="18" rx="3" fill="#8edaff" opacity=".7"/>
    <circle cx="-60" cy="221" r="14" fill="#0b141e" stroke="#97a8b1" stroke-width="5"/><circle cx="39" cy="221" r="14" fill="#0b141e" stroke="#97a8b1" stroke-width="5"/>
    <ellipse cx="60" cy="192" rx="10" ry="7" fill="#fff2ac"/><path d="M63 193 195 175 195 221Z" fill="#f5c46f" opacity=".18"/>
    ${brakes?'<path d="m-55 239 12 -17 9 20 10 -15 9 14" fill="none" stroke="#ffae55" stroke-width="3"/>':''}</g>
    <path d="M0 255 780 255" stroke="#78a2b4" stroke-width="1" opacity=".2"/>
    <text x="19" y="28" fill="#bcdce8" font-size="14" font-family="monospace" letter-spacing="2">TRAIN 718 • LIVE VISUAL</text>
    <text x="762" y="28" fill="${danger?'#ff818c':'#ffc785'}" font-size="13" font-family="monospace" text-anchor="end">${danger?'OVERSPEED ALERT':'BRIDGE DESTROYED'}</text>`;
}
function stationArt(step,danger) {
  const launched=step>=10;const dx=launched?(step-9)*55:0;
  return `${backdrop('#070f28','#15374d')}${dots}<circle cx="606" cy="147" r="102" fill="#294b7d"/><path d="M508 112q100 -44 185 45q-65 -14 -137 27Z" fill="#3d6790" opacity=".8"/>
  <g transform="translate(340 133)"><ellipse rx="132" ry="35" fill="none" stroke="#c2e1e8" stroke-width="15"/><ellipse rx="173" ry="49" fill="none" stroke="#667e96" stroke-width="5"/><rect x="-82" y="-48" width="164" height="95" rx="12" fill="url(#scene-metal)"/><rect x="-24" y="-94" width="48" height="188" rx="8" fill="#324b59" stroke="#9bb3b9" stroke-width="5"/><circle r="24" fill="${danger?'#e37073':'#9ae8c9'}" opacity=".83"/></g>
  <g transform="translate(${dx} ${launched?-18:0})"><path d="M96 161 152 139 211 161 156 191Z" fill="#a9cfda"/><path d="M152 139 152 191" stroke="#fff"/><circle cx="151" cy="158" r="10" fill="#83e4c2"/>${launched?'<path d="M96 161 -15 162" stroke="#f2bf73" stroke-width="8" opacity=".65"/>':''}</g><text x="18" y="27" fill="#c8dfea" font-size="14" font-family="monospace">ORBITAL CONTROL // CAM 01</text>`;
}
function houseArt(step,danger) {
 const candles=Math.min(6,Math.max(0,step));
 return `${backdrop('#0b1025','#352744')}<circle cx="614" cy="70" r="49" fill="#e1e0c3" opacity=".8"/><path d="M0 165Q210 130 420 166T780 153V260H0" fill="#151622"/>
 <path d="M260 227V80l125-65 125 65v147Z" fill="#14121c" stroke="#7e617f" stroke-width="5"/><path d="m235 84 150-85 150 85" fill="none" stroke="#9784a0" stroke-width="9"/>
 <rect x="348" y="136" width="73" height="91" fill="#24232b" stroke="#9d8c8d" stroke-width="3"/><circle cx="405" cy="183" r="3" fill="#e2ce8b"/>
 ${Array.from({length:4},(_,i)=>`<rect x="${285+i*59}" y="97" width="26" height="28" fill="${i<Math.ceil(step/3)?'#eac17d':'#262b3e'}" stroke="#806989" stroke-width="3"/>`).join('')}
 ${Array.from({length:candles},(_,i)=>`<path d="M${185+i*61} 225v-20" stroke="#c1bfc7" stroke-width="6"/><path d="M${185+i*61} 198q-8 -16 0 -22q10 8 0 22" fill="#ffb46f"/>`).join('')}
 ${step>3?`<path d="M550 200Q530 158 552 134T582 81Q620 143 584 198Z" fill="${danger?'#d4a5d1':'#a2cce2'}" opacity=".35"/>`:''}
 <path d="M0 239Q300 210 780 243" stroke="#a7c1cd" stroke-opacity=".16" stroke-width="19" fill="none"/><text x="18" y="27" fill="#e5d0e9" font-size="14" font-family="monospace">ASH HOLLOW // SECURITY FEED</text>`;
}
function outbreakArt(step,danger) {
 return `${backdrop('#07191f','#28504e')}<rect x="78" y="52" width="624" height="192" rx="12" fill="#132b35" stroke="#528879" stroke-width="5"/>
 <rect x="265" y="70" width="239" height="173" fill="#263e46" stroke="${danger?'#f17e7a':'#9ab6b4'}" stroke-width="7"/><path d="M385 70V243" stroke="#476b73" stroke-width="5"/>
 ${Array.from({length:step>=10?5:Math.min(5,Math.ceil(step/2))},(_,i)=>`<rect x="${120+i*104}" y="87" width="51" height="23" rx="3" fill="#b1f7ba" opacity=".7"/>`).join('')}
 <circle cx="385" cy="159" r="42" fill="#1f3a3b" stroke="#b4e4b1" stroke-width="3"/><text x="385" y="174" font-size="45" fill="#a8f2ac" text-anchor="middle">✣</text>
 ${Array.from({length:4},(_,i)=>`<path d="M${278+i*15} 72v171" stroke="#15202a" opacity=".4"/>`).join('')}
 <path d="M0 250 780 250" stroke="#7cd0a7" stroke-width="3"/><text x="18" y="27" fill="#c5f0dd" font-size="14" font-family="monospace">QUARANTINE LAB // SEAL STATUS</text>`;
}
function caseArt(step,danger) {
 return `${backdrop('#101926','#3b343a')}<rect x="104" y="32" width="566" height="202" fill="#503c35" stroke="#8a6d5f" stroke-width="9"/>
 ${Array.from({length:6},(_,i)=>{const x=143+(i%3)*166,y=56+Math.floor(i/3)*91,active=i<Math.ceil(step/2);return `<g transform="translate(${x},${y}) rotate(${i%2?3:-3})"><rect width="111" height="75" fill="#d8c7a1"/><rect x="7" y="6" width="97" height="47" fill="${active?'#74868a':'#667073'}"/><path d="M18 39 48 15 90 45" stroke="#d8e0d8" fill="none" opacity=".5"/><rect x="7" y="59" width="69" height="4" fill="#7f6052"/></g>`}).join('')}
 ${step>1?'<path d="M225 99 365 179 540 98 225 179" stroke="#f1b485" stroke-width="3" fill="none" opacity=".85"/>':''}
 <rect x="570" y="189" width="70" height="26" fill="${danger?'#ba525a':'#9b6565'}" transform="rotate(-9 570 189)"/><text x="605" y="207" fill="white" font-size="12" text-anchor="middle" font-family="monospace">EVIDENCE</text>
 <text x="18" y="27" fill="#e4d5b6" font-size="14" font-family="monospace">CASEBOARD / EVIDENCE TRACKING</text>`;
}
function radioArt(step,danger) {
 return `${backdrop('#0a2539','#305a72')}<path d="M0 167 130 108 232 151 370 112 548 163 670 112 780 146v114H0Z" fill="#172e40"/>
 <path d="M0 206 ${Array.from({length:16},(_,i)=>`L${i*52} ${182+(i%4)*14}`).join(' ')}V260H0Z" fill="#243f54"/>
 <path d="M0 214Q250 195 390 223T780 204V260H0" fill="#35678a" opacity=".64"/>
 <path d="M366 222 394 33 422 222" fill="none" stroke="#b7d1cf" stroke-width="6"/><path d="M374 187h39M379 153h30M384 120h23M389 89h13" stroke="#82b9bb" stroke-width="5"/>
 <circle cx="394" cy="37" r="8" fill="${danger?'#fa8984':'#adeee1'}"/>
 ${Array.from({length:Math.min(4,Math.ceil(step/3))},(_,i)=>`<circle cx="394" cy="37" r="${33+i*34}" fill="none" stroke="#9fdfeb" opacity="${.55-i*.12}" stroke-width="3"/>`).join('')}
 <text x="18" y="27" fill="#d3ebef" font-size="14" font-family="monospace">BELLWETHER EMERGENCY RADIO</text>`;
}

function abyssArt(step, danger) {
  const y = 155 - Math.max(0,step-5)*12;
  return `${backdrop('#03111e','#10576a')}
    ${Array.from({length:17},(_,i)=>`<circle class="scene-bubble" cx="${(i*79)%780}" cy="${90+(i*41)%173}" r="${2+i%4}" fill="#8de3e2" opacity=".35"/>`).join('')}
    <path d="M0 222 105 182 189 215 296 169 405 211 559 183 664 209 780 160V260H0Z" fill="#061e30"/>
    <path d="M0 247 150 213 290 247 399 211 560 249 780 209" fill="none" stroke="#23636d" stroke-width="11"/>
    <path d="M160 0v${y-32}" stroke="#8ac5cc" stroke-width="4" stroke-dasharray="7 5"/>
    <g class="scene-sub" transform="translate(135 ${y})"><path d="M-92 7Q-85 -28 15 -33h40Q103 -26 112 11Q86 46 -30 45h-30Q-92 29 -92 7" fill="#2c7180" stroke="#9adddd" stroke-width="4"/>
    <circle cx="-42" cy="5" r="15" fill="#a2e6de"/><circle cx="6" cy="5" r="15" fill="#a2e6de"/><path d="M15 -32l24-23h36" stroke="#b6dce7" stroke-width="7"/>
    <path d="M-100 5l-27 -18v35Z" fill="#47899a"/></g>
    <g class="shot-bubble"><circle cx="306" cy="191" r="4" fill="#7defec"/><circle cx="326" cy="177" r="3" fill="#7defec"/></g>
    <text x="18" y="27" fill="#d2f8f3" font-family="monospace" font-size="14">ABYSS NINE // RESCUE SONAR</text>
    ${danger ? '<path d="M0 221h780" stroke="#fd8d85" stroke-width="6" class="scene-risk"/>' : ''}`;
}
function neonArt(step,danger) {
  return `${backdrop('#100b28','#3b2057')}
    ${Array.from({length:13},(_,i)=>`<rect x="${i*67}" y="${83+(i*31)%70}" width="${40+i%3*12}" height="170" fill="${i%2?'#182240':'#101831'}" stroke="#7250a9" stroke-width="2"/><path d="M${i*67+8} ${112+(i*31)%70}h21" stroke="${i%2?'#e774db':'#69d7f6'}" stroke-width="5" class="shot-led"/>`).join('')}
    <path d="M0 237h780" stroke="#ff8bed" stroke-opacity=".62" stroke-width="3"/>
    <g class="scene-drone"><path d="M135 111l31-14 36 14-36 17Z" fill="#7b81bb" stroke="#fa91d4" stroke-width="3"/>
    <circle cx="166" cy="111" r="5" fill="#ff7ac5" class="shot-ping"/><path d="M166 128v90" stroke="#ff73bd" opacity=".42" stroke-width="4"/></g>
    <path class="shot-motion" d="M21 212 167 171 286 185" fill="none" stroke="#7af4fc" stroke-dasharray="12 7" stroke-width="3"/>
    <text x="18" y="27" fill="#ffd1f7" font-family="monospace" font-size="14">AURORA ARCHIVE // LIVE SECURITY FEED</text>
    ${danger?'<text x="19" y="59" fill="#ff949c" font-size="12">SECURITY TRACE ACTIVE</text>':''}`;
}
function marsArt(step,danger) {
  return `${backdrop('#421d2a','#bd674e')}
    <circle cx="106" cy="72" r="50" fill="#ffd3a1" opacity=".56" class="scene-sun"/>
    <path d="M0 202 104 168 232 208 359 163 474 195 604 143 780 181v79H0Z" fill="#7a3c3c"/>
    <path d="M0 232 152 202 305 239 517 205 662 236 780 208v52H0Z" fill="#542c36"/>
    <path d="M57 208Q66 96 172 101Q277 99 292 208" fill="#243f45" stroke="#f2a58a" stroke-width="7"/>
    <path d="M175 102v105M65 208h226" stroke="#c2aba8" stroke-width="5"/>
    <path d="M198 201v-58q-22-38 -35-19 0 24 35 30q37 -41 43 -19 2 27 -43 29" fill="#78bc88" stroke="#8fe1a0" stroke-width="4" class="shot-leaves"/>
    ${Array.from({length:17},(_,i)=>`<path class="scene-dust" d="M${(i*73)%780} ${42+(i*31)%149}l-33 -5" stroke="#e8a986" opacity=".34" stroke-width="${2+i%3}"/>`).join('')}
    <text x="18" y="27" fill="#ffe0bc" font-family="monospace" font-size="14">ARES COLONY // SOL 209</text>
    ${step>8?'<path d="M350 63l-50 -23 -44 33 42 20Z" fill="#edd5cc" stroke="#fae7df" stroke-width="3" class="scene-shuttle"/>':''}
    ${danger?'<path d="M0 5h780" stroke="#ff8685" stroke-width="7" class="scene-risk"/>':''}`;
}

/** Location-specific scenes for the three new chapters. These are only used
 * by the live story camera and the result reel; the surrounding UI is shared.
 */
function polarArt(step,danger){
  const rescuer=step>=9;
  return `${backdrop('#132a42','#648aa0')}
    <path d="M0 161 130 97 237 152 381 72 536 126 687 90 780 119V260H0Z" fill="#cce6ef" opacity=".45"/>
    <path d="M0 204 137 144 261 185 422 131 563 183 780 146V260H0Z" fill="#d0e4eb"/>
    <path d="M0 226Q191 179 357 214T780 196V260H0" fill="#9ac4d3"/>
    <g class="polar-station"><rect x="127" y="109" width="235" height="108" rx="14" fill="#314f60" stroke="#dceaf0" stroke-width="5"/>
      <path d="M117 116 173 67H323l47 49" fill="#567688" stroke="#e4edf0" stroke-width="5"/>
      ${[0,1,2].map(i=>`<rect x="${150+i*64}" y="137" width="42" height="44" rx="5" fill="${step>2?'#fbdca6':'#395568'}" stroke="#9ccbd7" stroke-width="2" class="polar-window"/>`).join('')}
      <rect x="241" y="172" width="41" height="45" fill="#1c3444" stroke="#b3d8dc" stroke-width="3"/>
    </g>
    <g class="polar-mast"><path d="M389 192 431 41 474 192" fill="none" stroke="#99bdc9" stroke-width="5"/>
      <path d="M410 121h42M402 160h59" stroke="#c8e1e6" stroke-width="5"/>
      ${step>=8?'<circle cx="431" cy="45" r="30" fill="none" stroke="#a6fff0" class="polar-beacon" stroke-width="3"/>':''}</g>
    ${rescuer?'<g class="polar-plane"><path d="m-120 0 65 -8 38 -30 17 4 -16 29 71 11 7 18 -85 -4 -45 13 -8 -13 -43 -3Z" fill="#edf6f9" stroke="#678ea2" stroke-width="3"/></g>':''}
    <text x="20" y="29" font-family="monospace" font-size="14" fill="#f4ffff">POLAR RESEARCH // STATION CAMERA</text>
    ${danger?'<path class="scene-risk" d="M5 5h770" stroke="#ff918e" stroke-width="5"/>':''}`;
}
function wildfireArt(step,danger){
  const busX = Math.min(310, 45 + step*23);
  return `${backdrop('#44283c','#d58759')}
    <circle cx="646" cy="62" r="60" fill="#ffc78a" opacity=".67"/>
    <path d="M0 188 135 130 261 162 408 112 541 156 672 112 780 156V260H0Z" fill="#553747"/>
    ${Array.from({length:16},(_,i)=>`<g transform="translate(${i*55-8} ${190+(i%4)*7})"><path d="M0 26 -18 0 -9 1 -22 -26 0 -64 20 -28 8 0 17 1Z" fill="${i%3===0?'#213a3a':'#29413e'}"/></g>`).join('')}
    <path d="M0 246Q220 226 430 240T780 224" stroke="#b0a49b" stroke-width="23" fill="none"/>
    <path d="M0 246Q220 226 430 240T780 224" stroke="#f0c788" stroke-width="2" stroke-dasharray="24 22" fill="none"/>
    <g class="ashfall-bus" transform="translate(${busX} 0)"><rect x="-72" y="185" width="145" height="47" rx="9" fill="#e7b95a" stroke="#4d3b36" stroke-width="4"/>
      ${[0,1,2,3].map(i=>`<rect x="${-57+i*30}" y="194" width="23" height="18" rx="3" fill="#5a8790" stroke="#cde2cc" stroke-width="2"/>`).join('')}
      <circle cx="-45" cy="235" r="11" fill="#24323d" stroke="#c7d0cc" stroke-width="4"/><circle cx="46" cy="235" r="11" fill="#24323d" stroke="#c7d0cc" stroke-width="4"/>
      <rect x="38" y="193" width="23" height="18" rx="4" fill="#f4e8ba"/>
    </g>
    <g class="ember-fire">${Array.from({length:8},(_,i)=>`<path d="M${14+i*98} 223q-18 -23 6 -50q-1 18 13 16q21 -31 10 -48q40 44 5 82Z" fill="${i%2?'#ed743e':'#ffb35f'}" opacity="${step>7?.3:.72}"/>`).join('')}</g>
    <text x="18" y="29" font-size="14" font-family="monospace" fill="#ffe7c4">REDWOOD COUNTY // FIRE CAMERA</text>
    ${danger?'<path class="scene-risk" d="M0 5h780" stroke="#ff949a" stroke-width="5"/>':''}`;
}
function carnivalArt(step,danger){
  const angle=(Math.min(10,step)-5)*3;
  const lit=step>=2;
  return `${backdrop('#17162f','#49314d')}
    <circle cx="101" cy="52" r="46" fill="#f5e4bd" opacity=".72"/>
    <path d="M0 197Q180 173 380 206T780 187V260H0Z" fill="#171d39"/>
    <path d="M0 236Q192 212 390 245T780 222V260H0Z" fill="#222944"/>
    ${[38,87,142,201,254,313].map((x,i)=>`<path d="M${x} 233v-${39+(i%3)*16}" stroke="#b49cab" stroke-width="6"/><circle cx="${x}" cy="${189-(i%3)*16}" r="5" fill="${lit?'#ffd28e':'#7a6f88'}" class="carnival-light"/>`).join('')}
    <g class="carnival-wheel" transform="translate(261 122) rotate(${angle})">
      <circle r="100" fill="none" stroke="#b9d1de" stroke-width="7"/>
      <circle r="76" fill="none" stroke="#8f9eaf" stroke-width="3"/>
      ${Array.from({length:8},(_,i)=>{const a=i*Math.PI/4,x=Math.round(99*Math.cos(a)),y=Math.round(99*Math.sin(a));return `<path d="M0 0L${x} ${y}" stroke="#9fb9c9" stroke-width="3"/><g transform="translate(${x} ${y})"><rect x="-14" y="1" width="28" height="22" rx="5" fill="${lit?'#eab68d':'#695c6d'}" stroke="#f1d0a9" stroke-width="2"/><path d="M0 -4v6" stroke="#d4ebf2" stroke-width="4"/></g>`}).join('')}
      <circle r="15" fill="#fbd18b" stroke="#cfa5a9" stroke-width="6"/>
    </g>
    <path d="M260 123 173 248M261 123l87 125" stroke="#728798" stroke-width="8"/>
    <rect x="81" y="224" width="360" height="24" fill="#5e6575" stroke="#b1a6a9" stroke-width="4"/>
    <path d="M0 250h780" stroke="#8ba9c0" stroke-width="6" opacity=".4"/>
    ${step>=9?'<path d="M264 235h140" stroke="#acf8cc" stroke-width="9" class="scene-good"/>':''}
    <text x="18" y="28" fill="#ffe0cf" font-size="14" font-family="monospace">LUMINA PIER // RIDE CAMERA</text>
    ${danger?'<path class="scene-risk" d="M0 5h780" stroke="#ff898a" stroke-width="5"/>':''}`;
}

const ART = {last_stop:trainArt,station:stationArt,hollow:houseArt,outbreak:outbreakArt,casefile:caseArt,dead_air:radioArt,abyss:abyssArt,neon:neonArt,red_horizon:marsArt,whiteout:polarArt,ashfall:wildfireArt,carnival:carnivalArt};
export function renderSceneSVG(room, step, danger) {
  return `<svg class="scene-world-${room.mission}" viewBox="0 0 780 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${ART[room.mission] ? ART[room.mission](step,danger) : (renderFrontierScene(room,step,danger) || renderLegendScene(room,step,danger))}${renderSceneDepth(room,step)}${renderSceneEffects(room)}${renderSceneDirector(room,step,danger)}${renderStoryVista(room,step,danger)}${renderActionStage(room,step)}${renderCinematicCut(room,step)}</svg>`;
}
