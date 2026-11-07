/** Mission-specific animated story actions, independent of gameplay authority.
 *
 * These layers live INSIDE the existing 780 × 260 SVG camera. The environment
 * occupies its left 415px, so it never covers the right-hand action close-up.
 * Server-confirmed objective progress chooses the scene. A correct typed prefix
 * moves the actuator but cannot change the mission state or trigger a win.
 */
const line = (d, color, width=3, className='director-path', opacity=.9) => `<path class="${className}" d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}"/>`;
const ping = (x,y,color,r=24) => `<g transform="translate(${x} ${y})" stroke="${color}" fill="none"><circle class="director-beacon" r="${r}" stroke-width="2"/><circle class="director-beacon" r="${r*1.35}" style="animation-delay:-.75s" stroke-width="1.5"/><circle class="director-progress-light" r="5" fill="${color}" stroke="none"/></g>`;
const people = (x,y,color='#d8e9e8',count=2) => Array.from({length:count},(_,i)=>`<g class="director-operator" transform="translate(${x+i*20} ${y+i%2*4})" aria-hidden="true"><ellipse cy="-17" rx="4.5" ry="6" fill="#f0eeed"/><path d="M-6 -10Q0-15 6-10l5 10v9H-11V0Z" fill="${color}"/><path d="M-6 -6 -12 6l4 3 8-10M6 -6 13 6l-4 3-9-10" fill="${color}"/><path d="M-8 8 -11 20h6l5-12M8 8l11 12h-6L0 8" fill="${color}"/></g>`).join('');
const sparkle = (x,y,color) => `<g transform="translate(${x} ${y})" class="director-window" stroke="${color}" stroke-width="2"><path d="M-9 0H9M0-9V9M-5-5l10 10M-5 5 10-10"/></g>`;
const warning = (x,y) => `<g transform="translate(${x} ${y})" class="director-warning"><path d="M0 -17 17 14h-34Z" fill="#a52e43" stroke="#ffaf9e" stroke-width="2"/><path d="M0 -7v11m0 6v1" stroke="white" stroke-width="3"/></g>`;

// Each director is drawn for its own physical location and plots a sequence of
// actual scene changes. Conditionals mirror authored story milestones; they
// deliberately do not reuse a generic particle effect for every mission.
const STAGES = {
  station(step,danger){
    const pod = step>=7;return `
      <g class="director-drift-reverse">${line('M40 75Q169 5 315 81','#9fd6f6',2,'director-path',.5)}<circle cx="304" cy="83" r="5" fill="#b2e3ff"/></g>
      <g transform="translate(${pod?220:88} ${pod?163:136})"><g class="director-rescue"><path d="M-23 -3 0-13 25-4 25 12 0 18-25 10Z" fill="#b4d8e1" stroke="#e9ffff" stroke-width="2"/><path d="M-20 4h34" stroke="#395a74" stroke-width="6"/><path class="director-progress-actuator" d="M-26 5h-36" stroke="#ffcc96" stroke-width="7" stroke-linecap="round"/></g></g>
      ${step>=3 ? `<g transform="translate(338 133)"><circle class="director-rotor" r="25" fill="none" stroke="#a6eecf" stroke-width="4" stroke-dasharray="12 12"/></g>${ping(338,133,'#a6eecf',27)}`:''}
      ${danger?warning(105,106):''}${pod?line('M90 169Q160 118 301 141','#e6ffbf',3,'director-reveal'):''}`;
  },
  hollow(step,danger){
    const awake=step>=3;return `
      <g transform="translate(148 188)"><g class="director-drift"><path d="M-23 0Q-32-41 0-65Q32-42 22 0Q10-10 0 0Q-10-9-23 0Z" fill="${danger?'#ffc0d6':'#afc9ff'}" opacity="${awake?.55:.19}"/><circle cx="-7" cy="-33" r="3" fill="#233451"/><circle cx="8" cy="-33" r="3" fill="#233451"/></g></g>
      <g transform="translate(385 177)"><circle class="director-rotor" r="${step>=8?57:30}" fill="none" stroke="${step>=8?'#ffe5a2':'#b886e4'}" stroke-width="3" stroke-dasharray="5 9" opacity=".8"/>${line('M-33 0H33M0-33V33','#f5d7ed',2,'director-progress-route')}</g>
      ${step>=6?`<path class="director-progress-actuator" d="M352 140 385 113 417 140v52h-65Z" fill="#8da4d0" opacity=".56"/>`:''}${danger?warning(154,112):''}${step>=9?sparkle(370,119,'#fff1ac'):''}`;
  },
  outbreak(step,danger){
    return `<g transform="translate(134 165)"><g class="director-oscillate"><rect x="-31" y="-39" width="62" height="74" rx="7" fill="#244d56" stroke="#a4efda" stroke-width="3"/><rect x="-20" y="-29" width="40" height="39" fill="#122a34"/><rect class="director-pour" x="-18" y="-5" width="36" height="16" fill="${step>=7?'#79efb1':'#a4d9da'}" opacity=".85"/><path d="M-15 23h30" stroke="#a6f4d9" stroke-width="5"/></g></g>
      <g transform="translate(292 131)"><rect x="-32" y="-22" width="67" height="44" rx="5" fill="#233f45" stroke="#7eb2ad"/><path class="director-progress-route" d="M-27 3h12l8-13 10 28 9-15h18" stroke="#aaffbe" stroke-width="4" fill="none"/></g>
      ${step>=7?`${ping(381,159,'#a7ffb9',30)}${people(122,212,'#d5ffe7',2)}`:''}${danger?warning(290,70):''}`;
  },
  casefile(step,danger){
    return `<g transform="translate(76 146)"><g class="director-oscillate"><rect x="-18" y="-46" width="89" height="75" rx="4" fill="#dac8aa" stroke="#f0deb5" stroke-width="2" transform="rotate(-9)"/><path d="M0 -28h46M0-14h34M0 0h53" stroke="#9d7d65" stroke-width="5"/></g></g>
      ${line('M110 134Q185 95 250 147T370 109','#fbd49d',3,'director-reveal',step>=4?.85:.25)}
      <g transform="translate(${step>=6?292:237} ${step>=6?164:145})"><g class="director-drift"><circle r="27" stroke="#e3d7c0" stroke-width="5" fill="#273f4b" opacity=".84"/><path d="M18 18 37 36" stroke="#f0dfb7" stroke-width="8" stroke-linecap="round"/><path d="M-11 -2h21m-12 7h17" stroke="#ffe5a6" stroke-width="2"/></g></g>
      ${step>=8?`${ping(350,111,'#ffe6b1',15)}${sparkle(354,83,'#fff0bb')}`:''}${danger?warning(189,75):''}`;
  },
  dead_air(step,danger){
    return `<g class="director-wind">${Array.from({length:9},(_,i)=>line(`M${-20+i*44} ${72+(i%5)*31}l-12 22`,'#b0e6ff',1.8,'director-path',.5)).join('')}</g>
      ${line('M84 226Q183 191 253 215T393 196','#7ccee9',3,'director-path',.84)}
      <g transform="translate(${step>=7?258:109} 201)"><g class="director-rescue"><path d="M-36 8h76l-12 17h-51Z" fill="#d7d7c3" stroke="#fff4c5" stroke-width="2"/><path d="M-11-7h23v16h-23Z" fill="#648b9f"/>${people(-14,2,'#f9f3db',2)}</g></g>
      ${step>=4?`${ping(383,45,'#b0fbf1',26)}${ping(157,114,'#d6ffe1',12)}`:''}
      ${step>=7?`${line('M383 45Q277 55 198 111','#bef4d9',4,'director-progress-route')}${sparkle(198,111,'#e4ffcd')}`:''}
      ${danger?warning(267,85):''}`;
  },
  last_stop(step,danger){
    const braking=step>=8;return `<g class="director-wind">${line('M25 210H235M15 232H300','#b2cbdb',3,'director-path',.58)}</g>
      <g transform="translate(${braking?303:177} 196)"><g class="director-oscillate"><circle r="24" fill="#1a2c3b" stroke="#d0dce1" stroke-width="6"/><circle class="director-rotor" r="13" stroke="#a7c3cf" fill="none" stroke-width="4" stroke-dasharray="8 7"/></g></g>
      ${braking?`<g transform="translate(331 189)"><path class="director-warning" d="M0 0l-17 27 23-16 5 30 24-18-11 0 11-33Z" fill="#ffb56a"/><path d="M-34 36h78" stroke="#fce9be" stroke-width="3"/></g>`:danger?warning(346,182):""}
      ${step>=10?`${ping(332,194,'#b0ffd7',15)}${line('M205 230H337','#dcffd4',3,'director-reveal')}`:''}`;
  },
  abyss(step,danger){
    return `<g transform="translate(208 116)"><g class="director-drift"><path d="M-17 -14Q2 -29 18-12l10 13-23 13-18-9Z" fill="#e0d6b0" stroke="#b4f0e6" stroke-width="3"/><circle cx="-6" cy="-12" r="6" fill="#7baac4"/><path d="M-13 6l-19 13m43-9 20 15" stroke="#d5ffe9" stroke-width="5"/></g></g>
      ${Array.from({length:7},(_,i)=>`<circle class="director-ascend" style="animation-delay:-${i*.47}s" cx="${95+(i*33)%240}" cy="${195-(i*27)%90}" r="${3+i%4}" fill="none" stroke="#a7fff0" stroke-width="2"/>`).join('')}
      ${step>=4?line('M145 59 145 189 205 160','#b8ffe8',4,'director-progress-route'):''}
      ${step>=9?`${ping(165,77,'#fff9b7',23)}${line('M165 170Q201 99 310 56','#d6ffdc',3,'director-reveal')}`:''}${danger?warning(326,140):''}`;
  },
  neon(step,danger){
    return `<g transform="translate(87 188)"><g class="director-drift"><path d="M-13-30h27l8 14-6 38h-33l-6-37Z" fill="#38384e" stroke="#fdc1f0" stroke-width="3"/><circle cy="-37" r="11" fill="#744f88" stroke="#f6aadd" stroke-width="2"/><path d="M-18 5l-18 20m55-20 18 20" stroke="#cba6e4" stroke-width="5"/></g></g>
      ${[150,210,270,330].map((x,i)=>`<path class="${step>=6?'director-progress-light':'director-oscillate'}" d="M${x} 90v110" stroke="${step>=6?'#8effe0':'#ff6ace'}" stroke-width="${step>=6?3:4}" opacity="${step>=6?.45:.9}"/>`).join('')}
      ${step>=3?`${line('M111 191Q160 138 224 177T370 121','#aafdf8',3,'director-progress-route')}${ping(336,116,'#ffa9ef',16)}`:''}${danger?warning(321,84):''}`;
  },
  red_horizon(step,danger){
    return `<g class="director-wind">${Array.from({length:7},(_,i)=>line(`M${i*61} ${91+i%4*33}l55 10`,'#ffd0a3',2.7,'director-path',.39)).join('')}</g>
      <g transform="translate(${step>=8?270:155} 211)"><g class="director-rescue"><path d="M-47-17h73l18 24h-101Z" fill="#d6aaa0" stroke="#ffd9b4" stroke-width="3"/><circle cx="-25" cy="9" r="13" fill="#362e3b" stroke="#debda7" stroke-width="5"/><circle cx="24" cy="9" r="13" fill="#362e3b" stroke="#debda7" stroke-width="5"/></g></g>
      ${step>=4?`<g transform="translate(338 152)"><g class="director-oscillate"><path d="M-28 25v-35h52v35" stroke="#bcfff0" stroke-width="4" fill="#27454a"/><path d="M-18 12q5-21 18-18 13-16 16-9" fill="none" stroke="#b0ffcc" stroke-width="4"/></g></g>`:''}
      ${step>=8?`${ping(265,80,'#d7ffcc',20)}${line('M265 80Q343 37 381 102','#f2ffd0',3,'director-progress-route')}`:''}${danger?warning(95,92):''}`;
  },
  whiteout(step,danger){
    return `<g class="director-wind">${Array.from({length:13},(_,i)=>line(`M${(i*37)%414} ${(i*61)%220}l-25 15`,'#f1fcff',2.5,'director-path',.66)).join('')}</g>
      <g transform="translate(${step>=8?300:129} 199)"><g class="director-rescue"><rect x="-36" y="-17" width="65" height="25" rx="6" fill="#f5dfb6" stroke="#effdff" stroke-width="3"/><rect x="-13" y="-25" width="31" height="12" fill="#6894ad"/><path d="M-45 14h85" stroke="#bdd8e7" stroke-width="5"/><circle cx="-17" cy="10" r="8" fill="#1e3d51"/><circle cx="23" cy="10" r="8" fill="#1e3d51"/></g></g>
      ${step>=5?`${ping(322,70,'#e1fff3',19)}${line('M319 67Q230 42 127 85','#f9e9b4',3,'director-progress-route')}`:''}${danger?warning(193,97):''}`;
  },
  ashfall(step,danger){
    return `<g>${Array.from({length:6},(_,i)=>`<path class="director-oscillate" d="M${48+i*59} 213q-18 -32 6 -55q-1 24 12 29q8-31 15-38q21 45-6 64Z" fill="${i%2?'#e95b37':'#ffc36f'}" opacity="${step>=8?.32:.74}"/>`).join('')}</g>
      <g transform="translate(${step>=8?320:121} 204)"><g class="director-rescue"><rect x="-42" y="-24" width="79" height="29" rx="7" fill="#e7c477" stroke="#fff2ca" stroke-width="3"/><rect x="-28" y="-19" width="19" height="12" fill="#618b96"/><rect x="-5" y="-19" width="19" height="12" fill="#618b96"/><circle cx="-22" cy="10" r="9" fill="#252f3b" stroke="#a8a6a0" stroke-width="4"/><circle cx="24" cy="10" r="9" fill="#252f3b" stroke="#a8a6a0" stroke-width="4"/></g></g>
      ${step>=5?`${line('M68 94Q165 81 249 124','#ace8f6',5,'director-progress-route')}${sparkle(256,122,'#e2faff')}`:''}${danger?warning(195,88):''}`;
  },
  carnival(step,danger){
    return `<g transform="translate(261 122)"><g class="director-rotor"><circle r="69" stroke="${step>=8?'#a6ffd5':'#ffd6a0'}" stroke-width="5" fill="none" stroke-dasharray="15 10" opacity=".83"/>${[0,90,180,270].map(a=>`<g transform="rotate(${a})"><circle cx="0" cy="-69" r="7" fill="#fff0ad" class="director-window"/></g>`).join('')}</g></g>
      ${step>=5?`<g transform="translate(139 193)"><g class="director-rescue"><path d="M-35 -11h75l-12 35h-48Z" fill="#b1d4e7" stroke="#e8ffff" stroke-width="3"/><path d="M0 -11V-39" stroke="#b7f5ec" stroke-width="4"/>${people(-11,8,'#fff3d2',2)}</g></g>${line('M142 164Q185 110 234 96','#b8f6e9',3,'director-progress-route')}`:''}
      ${step>=9?ping(261,122,'#b9ffce',33):''}${danger?warning(367,113):''}`;
  },
  mirrorfall(step,danger){return `<g class="legend-director-rift">${line('M207 46Q179 87 207 127T207 220','#dcc8ff',4,'director-progress-route')}${step>=5?ping(207,114,'#c1a5ff',32):sparkle(207,93,'#e3dbff')}${step>=8?line('M80 211 137 181 207 146','#b9ffdf',4,'director-progress-route'):''}</g>${danger?warning(354,100):''}`;},
  four_winds(step,danger){return `<g class="legend-director-elements">${[76,151,230,309].map((x,i)=>`<g transform="translate(${x} 118)"><circle r="${17+i%2*6}" fill="none" stroke="${['#7ce5f0','#a9e3ac','#ffb77e','#e4f0ff'][i]}" stroke-width="3" opacity="${step>i+4?.95:.35}" class="director-window"/></g>`).join('')}${step>=8?`${line('M76 118Q170 68 309 118','#c8fff2',4,'director-progress-route')}${ping(206,98,'#baffdd',24)}`:''}</g>${danger?warning(372,173):''}`;},
  dawnforge(step,danger){return `<g class="legend-director-dawn"><circle cx="230" cy="112" r="${step>=8?70:44}" fill="none" stroke="#ffce86" stroke-width="5" stroke-dasharray="11 9" class="director-rotor"/>${[0,1,2,3].map((i)=>`<path class="${step>i+5?'director-reveal':'director-oscillate'}" d="M${145+i*29} 37v140" stroke="#b5b2b4" stroke-width="${step>i+5?2:5}" opacity="${step>i+5?.22:.65}"/>`).join('')}${step>=10?ping(230,112,'#fff3bd',45):''}</g>${danger?warning(70,134):''}`;},
  glass_trials(step,danger){return `<g class="legend-director-arena">${line('M25 211 114 185 214 202 374 174','#e5e4b8',4,'director-progress-route')}${step>=4?`<path class="director-progress-actuator" d="M135 212l34-21 38 20" fill="none" stroke="#d1ffde" stroke-width="6"/>`:''}${step>=8?`${ping(337,93,'#a9ffe7',17)}${sparkle(339,109,'#f9dd95')}`:''}</g>${danger?warning(199,153):''}`;},
  wildbond(step,danger){return `<g class="legend-director-forest">${line('M35 226Q118 182 206 227T378 206','#b8f9bf',4,'director-progress-route')}${[0,1,2,3,4].map((i)=>`<circle class="director-window" cx="${147+i*28}" cy="${117+i%2*14}" r="${step>i+5?6:2}" fill="#ddffc3" opacity="${step>i+5?.95:.34}"/>`).join('')}${step>=9?ping(206,112,'#d4ffb3',34):''}</g>${danger?warning(346,150):''}`;},
  stardoor(step,danger){return `<g class="legend-director-star">${[0,1,2].map((i)=>`<ellipse cx="208" cy="127" rx="${43+i*21}" ry="${65+i*10}" stroke="#bacaff" fill="none" stroke-width="${2.5-i*.4}" opacity="${step>=i*3+2?.74:.24}" class="director-rotor"/>`).join('')}${step>=7?`${line('M82 216 147 172 207 127 268 168 333 213','#d1c5ff',4,'director-progress-route')}${ping(208,124,'#e3e2ff',24)}`:''}</g>${danger?warning(348,151):''}`;},

};

// Six original location-specific interventions from chapters 19–24.
Object.assign(STAGES, {
  clockfall(step,danger){return `<g class="frontier-director-time">${line('M30 216Q165 185 323 214','#92f4ed',3,'director-progress-route')}${step>=4?ping(192,100,'#9ceff2',35):sparkle(192,100,'#b6d8fa')}${step>=8?people(246,190,'#adf7e9',2):''}</g>${danger?warning(302,89):''}`;},
  nightmarket(step,danger){return `<g class="frontier-director-dream">${[70,134,201,273,348].map((x,i)=>`<circle cx="${x}" cy="${75+i%2*11}" r="${step>i?9:4}" fill="#f9b8d9" opacity="${step>i?.87:.21}" class="director-window"/>`).join('')}${step>=6?line('M52 217Q200 150 357 221','#f8bddf',4,'director-progress-route'):''}${step>=9?ping(353,81,'#fff1c7',37):''}</g>${danger?warning(128,114):''}`;},
  emberwing(step,danger){return `<g class="frontier-director-dragon">${line('M43 210Q128 99 210 147T386 112','#ffcb92',4,'director-progress-route')}${step>=5?ping(220,136,'#ffda9d',31):''}${step>=8?people(77,204,'#ffe1be',2):''}</g>${danger?warning(322,88):''}`;},
  deepvault(step,danger){return `<g class="frontier-director-divers">${line('M37 197Q144 160 206 207T380 165','#90d6f9',3,'director-progress-route')}${step>=5?ping(252,133,'#b5f9f1',29):''}${step>=8?people(92,194,'#b2deec',2):''}</g>${danger?warning(331,119):''}`;},
  aurora_arc(step,danger){return `<g class="frontier-director-orbit">${[0,1,2].map(i=>`<ellipse cx="201" cy="116" rx="${38+i*20}" ry="${22+i*12}" fill="none" stroke="#a8ffd3" stroke-width="2" opacity="${step>=4+i*2?.76:.23}" class="director-rotor"/>`).join('')}${step>=6?ping(201,116,'#c6ffde',21):''}${step>=9?line('M52 216Q220 164 384 201','#c2fff6',4,'director-progress-route'):''}</g>${danger?warning(350,85):''}`;},
  inkbound(step,danger){return `<g class="frontier-director-pages">${[0,1,2,3,4].map((i)=>`<path d="M${60+i*65} 189q29 -${25+i*3} 50 1" fill="none" stroke="#ffe2b5" stroke-width="${step>i+3?5:2}" opacity="${step>i+3?.82:.24}" class="director-progress-route"/>`).join('')}${step>=7?ping(207,132,'#ffe8cc',30):''}${step>=9?people(78,217,'#ffe0c1',3):''}</g>${danger?warning(343,135):''}`;},
});

export function renderSceneDirector(room, step, danger=false) {
  const draw=STAGES[room.mission];
  if(!draw) return '';
  const index=Math.max(0,Math.min(11,Number(step)||0));
  return `<defs><clipPath id="story-director-clip"><rect width="415" height="260"/></clipPath></defs><g class="story-director" data-director-world="${room.mission}" data-beat="${index}" clip-path="url(#story-director-clip)" aria-hidden="true">${draw(index,Boolean(danger))}</g>`;
}
