/** Twelve independent, illustrated environments inside the existing scene camera.
 *
 * Each world has its own dramatic motion, secondary actors and evolving physical
 * state. The server determines scene progress; this file never modifies it.
 * CSS animation is decorative; progress-sensitive routes consume the same
 * --typing-progress value as the existing close-up actuator.
 */
import { currentShot } from './cinematic-storyboards.js';
import { safe } from './helpers.js';

const palette = {
  station: ['#101e37','#315b76','#9be4fd','ORBITAL HANGAR'],
  hollow: ['#221c35','#53405b','#ddc2ff','EAST WING'],
  outbreak: ['#102e36','#38645a','#a8ffe2','QUARANTINE LAB'],
  casefile: ['#242631','#776455','#ffe3ba','EVIDENCE ROOM'],
  dead_air: ['#122b40','#31697d','#a9f4fa','EMERGENCY RADIO'],
  last_stop: ['#1d2633','#626b78','#ffd6a5','BRAKE CONTROL'],
  abyss: ['#082f44','#1b6f80','#a7faef','TRENCH / 3400M'],
  neon: ['#191b42','#6c4075','#ff99eb','SECURE ARCHIVE'],
  red_horizon: ['#482b35','#ab6d60','#ffdbb6','MARS COLONY'],
  whiteout: ['#233e57','#729cac','#ddffff','POLAR STATION'],
  ashfall: ['#4e2629','#9f5341','#ffe4a1','EVACUATION ZONE'],
  carnival: ['#2a224c','#7a527a','#ffe2b7','LUMINA PIER'],
  mirrorfall:['#13162e','#594383','#d4c4ff','LARKSPUR REFLECTION'],
  four_winds:['#103245','#2b6870','#bfffe8','SKY CANAL WARDS'],
  dawnforge:['#221d2f','#8e574d','#ffd28c','SOLAR FORGE'],
  glass_trials:['#151c34','#456481','#ffe0a7','CROWN ARENA'],
  wildbond:['#102c2e','#34785a','#c3ffbf','MOSSVALE GROVE'],
  stardoor:['#191c41','#4c568b','#d8d5ff','STAR ARCHIVE'],
};

const windowGrid = (x,y,color,cols=5,rows=3) => Array.from({length:cols*rows},(_,i)=>`<rect x="${x+i%cols*14}" y="${y+Math.floor(i/cols)*17}" width="7" height="9" rx="1" fill="${color}" opacity="${i%5===0?.92:.34}" class="${i%4===0?'v-pulse-slow':''}"/>`).join('');
const person = (x,y,color='#eaf5f5',scale=1,pose='v-hover')=>`<g class="${pose}" transform="translate(${x} ${y}) scale(${scale})" aria-hidden="true"><ellipse cy="-20" rx="6" ry="7" fill="#f7fbfc" opacity=".96"/><path d="M-7 -12Q0 -17 7 -12l6 8q3 4 2 10l-3 11q-1 5 -6 5H-6q-5 0 -6 -5l-3 -11q-1 -6 2 -10Z" fill="${color}"/><path d="M-8 -4 -18 6q-4 4 -2 8l1 5 10 -7 4 -6Z" fill="${color}"/><path d="M8 -4 18 6q4 4 2 8l-1 5 -10 -7 -4 -6Z" fill="${color}"/><path d="M-4 21 -12 34q-3 5 1 7h5l9 -13 -2 -7Z" fill="${color}"/><path d="M4 21 12 34q3 5 -1 7H6l-9 -13 2 -7Z" fill="${color}"/></g>`;
const signal = (x,y,c) => `<g transform="translate(${x} ${y})" fill="none" stroke="${c}" stroke-width="2.3"><circle r="7" fill="${c}" class="v-pulse"/><circle r="25" class="v-pulse-slow"/><circle r="46" class="v-pulse-slow" opacity=".5"/><path d="M0 -53v-8M53 0h8M0 53v8M-53 0h-8" opacity=".55"/></g>`;
const lights = (x,y,color,n=6) => Array.from({length:n},(_,i)=>`<circle cx="${x+i*27}" cy="${y+i%2*3}" r="${i%3===0?4:2.4}" fill="${color}" class="${i%2?'v-fade':'v-pulse'}" style="animation-delay:-${i*.4}s"/>`).join('');
const beams = (color,n=6) => Array.from({length:n},(_,i)=>`<path class="v-trace" d="M${-38+i*76} 0l${-50+i%3*17} 248" stroke="${color}" stroke-width="${1+i%3}" opacity="${.18+i%3*.1}"/>`).join('');
const dial=(x,y,color)=>`<g transform="translate(${x} ${y})"><circle r="34" fill="#122934" stroke="${color}" stroke-width="4"/><circle r="24" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="3 5"/><path d="M0 0L20-15" stroke="${color}" stroke-width="5" stroke-linecap="round" class="v-sway"/><circle r="5" fill="${color}"/></g>`;
const route = (path,color) => `<path class="v-typed-route" d="${path}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
const gate = (x,y,color)=>`<g transform="translate(${x} ${y})"><rect x="-34" y="-54" width="68" height="106" rx="6" fill="#1a333f" stroke="${color}" stroke-width="4"/><rect class="v-typed-gate" x="-26" y="-45" width="49" height="88" fill="#4e6c79" stroke="${color}" stroke-width="2"/><path d="M-17 -15v43" stroke="${color}" stroke-width="3"/></g>`;
const sparks=(x,y,color,n=10)=>Array.from({length:n},(_,i)=>`<path d="M${x+i%5*11} ${y+i%3*8}l${-5+i%3*5} -${8+i%4*4}" stroke="${color}" stroke-width="2" class="v-fade" style="animation-delay:-${i*.21}s"/>`).join('');
const documents=(x,y,c)=>`<g transform="translate(${x} ${y})" class="v-sway"><rect x="-48" y="-61" width="95" height="123" rx="3" fill="#d8c4a3" stroke="${c}" stroke-width="3"/><path d="M-35 -43H28M-35 -29H33M-35 -15H8M-35 13H30M-35 28H21" stroke="#806d6b" stroke-width="4"/><circle cx="23" cy="44" r="12" fill="none" stroke="#9e3d46" stroke-width="4"/></g>`;
const rescueBoat = (x,y,c)=>`<g transform="translate(${x} ${y})" class="v-approach"><path d="M-67 7h129L44 31h-94Z" fill="#bacfd1" stroke="${c}" stroke-width="3"/><rect x="-14" y="-16" width="34" height="24" rx="2" fill="#37647c" stroke="${c}"/><path d="M-5 -16V-27l45 15" stroke="${c}" stroke-width="3"/>${person(37,-15,c,.34)}</g>`;
const rover = (x,y,c)=>`<g transform="translate(${x} ${y})" class="v-approach"><rect x="-65" y="-35" width="127" height="53" rx="10" fill="#c1a69a" stroke="${c}" stroke-width="3"/><path d="M-42 -35l11-20h47l13 20" fill="#667583" stroke="${c}" stroke-width="2"/><rect x="-14" y="-52" width="28" height="14" fill="#294f6a"/><circle cx="-33" cy="20" r="16" fill="#282f3b" stroke="${c}" stroke-width="5"/><circle cx="34" cy="20" r="16" fill="#282f3b" stroke="${c}" stroke-width="5"/></g>`;
const rail = (y,c)=>`<path d="M-10 ${y} 417 ${y-12}" stroke="#bec4c6" stroke-width="6"/><path d="M-10 ${y+15} 417 ${y+3}" stroke="#7d9096" stroke-width="8"/>${Array.from({length:13},(_,i)=>`<path d="M${i*35-20} ${y-5}v21" stroke="${c}" stroke-width="5" opacity=".43"/>`).join('')}`;
const pulsePlane=(x,y,c)=>`<g transform="translate(${x} ${y})" class="v-approach"><path d="M0 -14 -54 21 0 6 57 21Z" fill="#dce9e6" stroke="${c}" stroke-width="3"/><path d="M0 -31 11 5 0 40 -11 5Z" fill="#738ba0" stroke="${c}"/><path d="M-13 8H14" stroke="${c}" stroke-width="3"/></g>`;
const ghost=(x,y,c)=>`<g transform="translate(${x} ${y})" class="v-hover"><path d="M-27 29v-40q1-34 27-34t27 34v40l-12-9-14 12-13-11Z" fill="${c}" opacity=".53"/><circle cx="-8" cy="-8" r="4" fill="#2b3047"/><circle cx="11" cy="-8" r="4" fill="#2b3047"/><path d="M-7 10q7-5 14 0" stroke="#2b3047" stroke-width="3" fill="none"/></g>`;
const plant=(x,y,c)=>`<g transform="translate(${x} ${y})" class="v-sway"><path d="M0 0v-89" stroke="${c}" stroke-width="5"/><path d="M0 -24Q-51 -26 -39-61Q-12 -65 0 -24ZM0 -47Q39 -52 45-86Q9-93 0 -47" fill="#82bf9a" stroke="${c}" stroke-width="2"/></g>`;

const drawings = {
  station: (step,c) => `<g class="v-parallax-back">${windowGrid(18,100,'#7eb9de',7,4)}<path d="M0 198L74 79 119 79 162 202" fill="#20384c" stroke="${c}" stroke-width="2"/></g><g transform="translate(${step>6?240:103} 151)" class="v-approach"><path d="M-70 5 -24-35 40-37 69 11 11 22Z" fill="#c1d6d8" stroke="${c}" stroke-width="4"/><path d="M-10 -32 32-31 42 -5 -34-6Z" fill="#375f77"/><path d="M-66 8h33m73 0h28" stroke="${c}" stroke-width="5"/>${step>7?'<path d="M-20 27l-24 33h38l12-33" fill="#ffb87c" class="v-pulse"/>':''}</g>${signal(327,91,c)}${step>3?gate(44,169,c):''}`,
  hollow: (step,c) => `<g class="v-parallax-back"><path d="M0 233V62l55-34 51 31 53-29 69 29 50-30 85 27v177" fill="#312d46" stroke="${c}" stroke-width="2" opacity=".75"/>${windowGrid(22,81,'#c4a7d5',6,4)}</g><g transform="translate(186 66)" class="v-sway"><path d="M0 -40v33" stroke="#b2a4bc" stroke-width="4"/><path d="M-27 0h54l-14 25h-26Z" fill="#c4a483"/><circle cy="11" r="11" fill="#f8ddb2" class="v-pulse"/></g>${ghost(step>6?250:115,148,c)}<path d="M0 233Q202 208 420 234" fill="none" stroke="${c}" stroke-width="4" opacity=".46"/>${step>7?signal(343,157,c):''}`,
  outbreak: (step,c) => `<g class="v-parallax-back">${windowGrid(8,41,'#7ae0bc',9,3)}<path d="M0 126h416" stroke="${c}" stroke-width="4" opacity=".4"/></g>${gate(345,146,c)}<g transform="translate(112 159)"><rect x="-50" y="-72" width="104" height="115" rx="7" fill="#2d555c" stroke="${c}" stroke-width="4"/><path d="M-26 -52h59v55h-59Z" fill="#092932"/><path d="M-19 -17h11l9-19 11 31 13-15" stroke="${c}" stroke-width="3" fill="none"/>${lights(-31,26,c,3)}</g>${step>6?`<path class="v-typed-route" d="M175 158 256 149 317 150" fill="none" stroke="#abffc5" stroke-width="6"/>${person(248,169,c,.66)}`:person(231,178,'#d7ecdc',.76)}`,
  casefile: (step,c) => `<g class="v-parallax-back"><path d="M0 34h415v170H0Z" fill="#433c43" stroke="${c}" stroke-width="3"/>${Array.from({length:4},(_,i)=>documents(43+i*95,95+(i%2)*15,c)).join('')}</g><g transform="translate(213 189)"><circle r="39" fill="#26343d" stroke="${c}" stroke-width="6"/><circle r="28" fill="none" stroke="${c}" stroke-width="2"/><path d="M26 26 51 52" stroke="${c}" stroke-width="9" stroke-linecap="round"/></g>${step>6?`${signal(321,100,'#b4ffc7')}${route('M53 192 133 164 208 144 310 103',c)}`:person(324,177,c,.67)}`,
  dead_air: (step,c)=> `<g class="v-parallax-back">${Array.from({length:4},(_,i)=>`<rect x="${i*112-7}" y="${130-(i%3)*25}" width="84" height="115" fill="#263f55" stroke="${c}" opacity=".6"/>`).join('')}<path d="M0 204Q160 176 414 208V260H0" fill="#2a667b"/></g><g class="v-rain">${beams('#a9d6f5',13)}</g><g transform="translate(265 106)"><path d="M0-105 -36 105h72Z" fill="#35566c" stroke="${c}" stroke-width="4"/><path d="M-26 49h52M-18 0h36M-9-52h18" stroke="${c}" stroke-width="4"/>${signal(0,-96,c)}</g>${rescueBoat(step>6?235:78,207,c)}${step>5?route('M70 226 151 198 259 171 348 91',c):''}`,
  last_stop: (step,c) => `${rail(225,c)}<g class="v-parallax-back"><path d="M0 118l72-62 47 56 85-79 76 79 79-49 57 45v108H0Z" fill="#354354" opacity=".72"/></g><g transform="translate(${step>7?184:112} 168)" class="v-approach"><rect x="-103" y="-68" width="203" height="107" rx="13" fill="#8299a9" stroke="${c}" stroke-width="4"/>${windowGrid(-84,-51,'#d7e8ee',6,2)}<rect x="-103" y="10" width="203" height="15" fill="#384b5c"/>${[-65,55].map(x=>`<circle cx="${x}" cy="46" r="19" fill="#182b3b" stroke="${c}" stroke-width="5" class="v-spin-fast"/>`).join('')}</g>${step>6?sparks(307,198,'#ffe0a7',13):signal(343,144,c)}`,
  abyss: (step,c) => `<g class="v-parallax-back"><path d="M0 213 78 176 132 215 210 163 297 199 370 145 416 190v70H0Z" fill="#123b55"/>${Array.from({length:13},(_,i)=>`<circle class="v-fall" cx="${i*34}" cy="${i%3*40}" r="${2+i%3}" fill="${c}" opacity=".48" style="animation-delay:-${i*.55}s"/>`).join('')}</g><g transform="translate(${step>6?247:128} 147)" class="v-approach"><path d="M-93 2Q-70-42 38-38 95-31 102 10 78 48-45 43-94 34-93 2Z" fill="#7ca8b2" stroke="${c}" stroke-width="4"/>${[-36,6,49].map(x=>`<circle cx="${x}" cy="5" r="14" fill="#17475a" stroke="${c}" stroke-width="3"/>`).join('')}<path d="M-58 -39v-18h54" stroke="${c}" stroke-width="4"/></g>${step>3?`${person(345,172,c,.7)}${route('M167 126 256 111 336 168',c)}`:signal(325,65,c)}`,
  neon: (step,c) => `<g class="v-parallax-back">${Array.from({length:5},(_,i)=>`<rect x="${i*92}" y="${29+i%3*22}" width="75" height="195" fill="#343052" stroke="${c}" stroke-width="2" opacity=".52"/>${windowGrid(i*92+8,69+i%3*22,c,4,5)}`).join('')}</g>${Array.from({length:3},(_,i)=>`<path class="v-scanner" d="M${i*130} 39v187" stroke="#fd7dc8" stroke-width="3" opacity=".57" style="animation-delay:-${i*1.3}s"/>`).join('')}${person(step>7?288:90,183,'#f7cced',1.1,'v-approach')}${gate(337,165,c)}${step>4?route('M102 203 160 164 249 170 336 156',c):''}`,
  red_horizon: (step,c) => `<g class="v-parallax-back"><path d="M0 216 64 158 110 184 182 125 263 196 354 143 416 190v70H0Z" fill="#8e5a58"/>${beams('#edaa80',7)}</g><path d="M22 193Q42 81 138 84Q245 82 260 195" fill="#446874" fill-opacity=".45" stroke="${c}" stroke-width="5"/><path d="M22 193h238" stroke="${c}" stroke-width="4" opacity=".68"/>${step>6?plant(162,189,c):rover(307,184,c)}${step>7?signal(194,104,'#e6ffb3'):''}`,
  whiteout: (step,c) => `<g class="v-parallax-back"><path d="M0 209 72 99 112 159 189 56 255 160 312 91 416 211Z" fill="#5f829d"/><path d="M50 138 72 99 86 135M164 93l25-37 25 47M291 127l21-36 37 48" stroke="#eefaff" stroke-width="13" fill="none"/>${beams('#edf8ff',12)}</g>${pulsePlane(step>7?250:102,76,c)}${step>6?`${person(294,180,c,1)}${signal(324,152,c)}`:`${rover(260,199,c)}`}`,
  ashfall: (step,c) => `<g class="v-parallax-back"><path d="M0 170 58 93 96 141 175 70 267 162 349 85 416 161v99H0" fill="#673931"/>${Array.from({length:8},(_,i)=>`<path class="v-fade" d="M${i*58-10} 185q-21 -18 3 -52 17 27 32 0 20 37 3 52Z" fill="${i%2?'#ef8a48':'#ffc178'}" opacity=".65"/>`).join('')}</g>${rail(235,c)}<g transform="translate(${step>7?250:102} 189)" class="v-approach"><rect x="-85" y="-46" width="173" height="63" rx="8" fill="#eec76b" stroke="#fff0b0" stroke-width="4"/>${windowGrid(-65,-35,'#7ba5ab',5,2)}<circle cx="-50" cy="23" r="17" fill="#283039" stroke="${c}" stroke-width="5"/><circle cx="49" cy="23" r="17" fill="#283039" stroke="${c}" stroke-width="5"/></g>${step>7?`${route('M26 186 129 172 257 165 378 142','#b8ffd1')}`:''}`,
  carnival: (step,c) => `<g class="v-parallax-back">${windowGrid(12,164,'#eeafd4',7,3)}${lights(20,217,c,12)}<path d="M0 235 112 198 231 225 416 192v68H0" fill="#453852"/></g><g transform="translate(250 121)"><g class="v-rotor"><circle r="99" fill="none" stroke="${c}" stroke-width="6"/><circle r="72" fill="none" stroke="${c}" opacity=".55" stroke-width="3"/>${Array.from({length:8},(_,i)=>{const rad=i*Math.PI/4,x=Math.round(99*Math.cos(rad)),y=Math.round(99*Math.sin(rad));return `<path d="M0 0L${x} ${y}" stroke="${c}" stroke-width="2"/><g transform="translate(${x} ${y})"><rect x="-13" y="-7" width="26" height="27" rx="5" fill="#d1a7c9" stroke="${c}" stroke-width="2"/></g>`}).join('')}</g><path d="M0 0 -78 129M0 0 78 129" fill="none" stroke="#ad9db9" stroke-width="7"/><circle r="11" fill="${c}"/></g>${step>8?`${signal(351,132,c)}${person(53,197,c,.78)}`:lights(70,74,'#ffd3b0',8)}`,
};

Object.assign(palette, {
  clockfall:['#091d31','#27616b','#8ae5e8','MERIDIAN / 11:59'],
  nightmarket:['#281a38','#6c365e','#ffb3dd','NOCTURNE MARKET'],
  emberwing:['#322039','#975438','#ffc17f','SKYREACH REFUGE'],
  deepvault:['#082538','#185473','#95d8ff','PELAGIC ARCHIVE'],
  aurora_arc:['#091e39','#16566a','#b2ffc7','KEPLER AURORA RING'],
  inkbound:['#29253d','#75516a','#ffe2af','FABLEMERE CHRONICLE'],
});

export function renderStoryVista(room, step, danger) {
  const [dark,mid,color,location] = palette[room.mission] || palette.station;
  const draw = drawings[room.mission];
  if (!draw) {
    const shot=currentShot(room,step);
    const sceneLabel=String(room?.target?.text || shot.focus).toUpperCase().slice(0,31);
    const moment=step<5?'ARRIVAL':step<9?'CONFRONTATION':'RETURN';
    return `<g class="story-vista legend-vista" data-world-vista="${room.mission}" data-vista-beat="${step}" aria-hidden="true"><defs><clipPath id="v-clip"><rect width="415" height="260"/></clipPath></defs><g clip-path="url(#v-clip)"><path class="v-frame-edge" d="M11 54h20m-20 0v21m393-21h-20m20 0v21M11 232h20m-20 0v-21m393 21h-20m20 0v-21"/><rect class="v-cinema-matte" x="0" y="0" width="415" height="27"/><text class="v-scene-label" x="13" y="17">${location}</text><text class="v-caption" x="402" y="17" text-anchor="end">${moment}</text><rect class="v-cinema-matte" x="0" y="239" width="415" height="21"/><text class="v-caption" x="14" y="253">${safe(sceneLabel)}</text><text class="v-caption" x="400" y="253" text-anchor="end">SHOT ${String(step+1).padStart(2,'0')}</text><path class="v-typed-route" d="M0 235H412" fill="none" stroke="${color}" stroke-width="4" opacity=".64"/>${danger?`<path d="M4 4H411V257H4Z" fill="none" stroke="#ff7776" stroke-width="5" stroke-dasharray="11 15" class="v-pulse"/>`:''}</g></g>`;
  }
  const act = step < 4 ? 'I / ARRIVAL' : step < 8 ? 'II / TURNING POINT' : 'III / EXTRACTION';
  const shot = currentShot(room,step);
  const sceneLabel = room?.target?.text || shot.focus.replaceAll('_',' ');
  const text = safe(String(sceneLabel).toUpperCase().slice(0,30));
  return `<g class="story-vista" data-world-vista="${room.mission}" data-vista-beat="${step}" aria-hidden="true">
    <defs><clipPath id="v-clip"><rect width="415" height="260"/></clipPath>
      <linearGradient id="v-light" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${dark}" stop-opacity=".88"/><stop offset=".66" stop-color="${mid}" stop-opacity=".48"/><stop offset="1" stop-color="${dark}" stop-opacity=".08"/></linearGradient>
      <linearGradient id="v-bloom" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${color}" stop-opacity=".26"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient>
    </defs>
    <g clip-path="url(#v-clip)">
      <rect width="415" height="260" fill="url(#v-light)"/>
      <circle class="v-cinema-beam v-parallax-back" cx="330" cy="45" r="115" fill="url(#v-bloom)"/>
      <g class="v-parallax-front">${draw(step,color)}</g>
      <path class="v-frame-edge" d="M10 56h19m-19 0v22m395-22h-19m19 0v22M10 235h19m-19 0v-22m395 22h-19m19 0v-22"/>
      <rect class="v-cinema-matte" x="0" y="0" width="415" height="28"/>
      <text class="v-scene-label" x="13" y="17">${location}</text><text class="v-caption" x="401" y="17" text-anchor="end">${act}</text>
      <rect class="v-cinema-matte" x="0" y="240" width="415" height="20"/>
      <text class="v-caption" x="14" y="254">${text}</text><text class="v-caption" x="400" y="254" text-anchor="end">TAKE ${String(step+1).padStart(2,'0')} / 11</text>
      ${danger?`<path d="M5 4H410V256H5Z" fill="none" stroke="#ff7776" stroke-width="7" stroke-dasharray="11 14" class="v-pulse"/>`:''}
    </g>
  </g>`;
}
