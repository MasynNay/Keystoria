/** In-scene motion, not a new interface.
 *
 * These small SVG foreground layers give each world local depth and motion.
 * Scene changes are keyed to the server-confirmed objective index. The typing
 * animation is cosmetic and cannot advance authoritative mission progress.
 */
const particles = (fill, count, seed=1) => Array.from({length:count}, (_,i) => {
  const x=(i*97+seed*31)%413, y=(i*61+seed*19)%245, r=1+(i%4)*.6;
  return `<circle class="story-particle" style="--delay:${-(i%7)*.47}s;--travel:${8+i%5*5}px" cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity=".45"/>`;
}).join('');
const beam = (color, x, y, angle=0) => `<g transform="translate(${x} ${y}) rotate(${angle})" class="story-searchlight">
  <path d="M0 0L-95 255H95Z" fill="${color}" opacity=".09"/><circle r="8" fill="${color}" opacity=".9"/></g>`;
const human = (x,y,color) => `<g class="story-character" transform="translate(${x} ${y})" aria-hidden="true">
  <ellipse cx="0" cy="-34" rx="10" ry="12" fill="#f0f5f6" opacity=".95"/>
  <path d="M-11 -24Q0 -32 11 -24l8 10q5 7 3 15l-4 19q-2 9 -11 9H-7q-9 0 -11 -9l-4 -19q-2 -8 3 -15Z" fill="${color}"/>
  <path d="M-12 -15 -29 1q-8 8 -5 16l3 8 17 -12 7 -12Z" fill="${color}" opacity=".92"/>
  <path d="M12 -15 29 0q8 8 5 16l-3 8 -17 -12 -7 -12Z" fill="${color}" opacity=".92"/>
  <path d="M-7 29 -18 54q-4 9 4 11h7l13 -26 -2 -10Z" fill="${color}" opacity=".95"/>
  <path d="M7 29 18 54q4 9 -4 11h-7L-6 39l2 -10Z" fill="${color}" opacity=".95"/>
  <path d="M-10 11h20" stroke="#10222b" stroke-width="2" opacity=".24"/>
</g>`;
const signal = (color, x, y) => `<g transform="translate(${x} ${y})" class="story-pulse-group" fill="none" stroke="${color}" stroke-width="2">
  ${[0,1,2].map(i=>`<circle class="story-pulse" style="--delay:-${i*.7}s" r="${20+i*21}" opacity=".45"/>`).join('')}
</g>`;
const icons = {
  station: (step)=>`${particles('#bce9ff',18,2)}<g class="story-debris"><path d="M56 79 76 65 95 86 73 97Z" fill="#a4b7c4" opacity=".7"/><path d="M281 54 305 50 314 75 283 83Z" fill="#748ca5" opacity=".6"/></g>${step>=7?signal('#a5ffdc',173,164):''}`,
  hollow: (step)=>`${particles('#d7c6e9',11,3)}<g class="story-ghost" opacity=".5"><path d="M56 206Q23 156 49 119Q63 96 79 129Q105 94 118 128Q137 169 113 206Z" fill="#a6c9df"/><circle cx="68" cy="152" r="5" fill="#233247"/><circle cx="99" cy="152" r="5" fill="#233247"/></g>${step>=7?signal('#e9c9ff',295,155):''}`,
  outbreak: (step)=>`${particles('#bdffb9',12,4)}${human(95,183,'#8bb6a5')}${step>=4?`<g class="story-medical"><path d="M167 82v48M144 106h46" stroke="#c4ffb5" stroke-width="8" class="story-heartbeat"/></g>`:''}`,
  casefile: (step)=>`${particles('#ffd6ac',8,5)}<g class="story-desk"><path d="M20 212H356" stroke="#b18b6f" stroke-width="8"/><path d="M58 212V250M320 212V250" stroke="#8d6255" stroke-width="8"/></g>${step>=6?`<path d="M86 192 141 148 216 172" fill="none" stroke="#ffe1a1" stroke-width="3" stroke-dasharray="7 5" class="story-trace"/>`:''}`,
  dead_air: (step)=>`${particles('#caefff',13,6)}${beam('#bceaff',328,52,18)}${step>=6?signal('#b7fff0',326,60):''}<g class="story-rescue-boat"><path d="M35 220h137l-20 23H52Z" fill="#96afba"/><rect x="86" y="190" width="36" height="30" fill="#667f8d"/><circle cx="104" cy="204" r="7" fill="#fbe9ab"/></g>`,
  last_stop: (step)=>`${particles('#ffe0ad',8,7)}<g class="story-sparks">${Array.from({length:7},(_,i)=>`<path d="M${56+i*16} 225l${-13+i%4*8} -${14+i*3}" stroke="#f9b977" stroke-width="2" opacity=".85"/>`).join('')}</g>${step>=9?signal('#ffdb89',210,193):''}`,
  abyss: (step)=>`${particles('#a5f3ed',16,8)}${beam('#a0f7ed',123,146,-33)}<g class="story-fish"><path d="M291 139q18 -14 36 0q-18 16 -36 0l-13 12v-24Z" fill="#7bb3bc" opacity=".5"/></g>${step>=7?signal('#c5ffdf',178,128):''}`,
  neon: (step)=>`${particles('#f3bbfa',10,9)}<g class="story-laser"><path d="M42 91 211 194 331 84" stroke="#ff78df" stroke-width="3" fill="none" stroke-dasharray="13 10"/></g>${step>=7?signal('#8ff4ff',285,102):''}`,
  red_horizon: (step)=>`${particles('#ffd4ae',17,10)}${beam('#ffd7b4',122,166,-15)}${step>=8?signal('#b6ffcf',275,127):''}`,
  whiteout: (step)=>`${particles('#f4ffff',23,11)}${human(85,172,'#c8dce8')}${step>=9?signal('#b8ffff',321,70):''}`,
  ashfall: (step)=>`${particles('#ffb16c',22,12)}<g class="story-ash"><path d="M40 198q12 -21 -9 -39M87 196q27 -41 -4 -62M148 190q-1 -31 -17 -44" stroke="#ffb576" stroke-width="4" fill="none" opacity=".55"/></g>${step>=8?beam('#fff1bc',315,166,0):''}`,
  carnival: (step)=>`${particles('#f6caab',13,13)}${step>=8?signal('#c7ffdf',246,119):''}<g class="story-rider-lights"><circle cx="85" cy="149" r="5" fill="#ffe3ae" class="story-particle"/><circle cx="111" cy="168" r="4" fill="#ffe3ae" class="story-particle"/></g>`,
  mirrorfall:(step)=>`${particles('#cbb7ff',22,19)}<g class="story-ghost"><path d="M45 185q26-18 55 0t55 0" stroke="#b9acff" stroke-width="4" stroke-opacity=".5" fill="none"/></g>${step>=5?signal('#d2baff',209,123):''}`,
  four_winds:(step)=>`${particles('#c3ffe6',17,20)}<g class="story-laser"><path d="M8 194q56-24 114 0t108 0t130 0" fill="none" stroke="#84e5f1" stroke-opacity=".42" stroke-width="6"/></g>${step>=7?signal('#b7ffe4',208,93):''}`,
  dawnforge:(step)=>`${particles('#ffcb85',20,21)}<g class="story-sparks"><path d="M45 209q90-26 181 0t185 0" stroke="#ffc185" stroke-opacity=".28" stroke-width="5" fill="none"/></g>${step>=6?signal('#fff1aa',229,112):''}`,
  glass_trials:(step)=>`${particles('#ffe4b6',15,22)}<g class="story-laser"><path d="M40 184 151 161 229 186 332 156" stroke="#ffdb9f" stroke-width="3" stroke-dasharray="8 6" opacity=".48" fill="none"/></g>${step>=8?signal('#ceffe3',332,105):''}`,
  wildbond:(step)=>`${particles('#c3ffbb',25,23)}<g class="story-drift"><path d="M33 222q70-28 130 0t155 0" stroke="#a5e3ab" stroke-width="5" stroke-opacity=".32" fill="none"/></g>${step>=9?signal('#c1ffbe',208,108):''}`,
  stardoor:(step)=>`${particles('#e2d4ff',26,24)}<g class="story-ghost"><path d="M95 221Q206 91 319 221" stroke="#e8d8ff" stroke-width="5" stroke-opacity=".32" fill="none"/></g>${step>=7?signal('#d7d4ff',206,128):''}`,

};

Object.assign(icons, {
  clockfall:step=>`${particles('#95edea',15,31)}${step>=5?signal('#bcf6db',200,119):''}${human(86,182,'#90cedd')}`,
  nightmarket:step=>`${particles('#ffc5e6',17,32)}${step>=6?signal('#ffe6bc',300,95):''}${human(92,187,'#ddb9d8')}`,
  emberwing:step=>`${particles('#ffdb9d',18,33)}${step>=6?signal('#ffedab',269,96):''}${human(79,187,'#e6c8a8')}`,
  deepvault:step=>`${particles('#b8edff',20,34)}${step>=6?signal('#a1f2ff',302,132):''}${human(69,193,'#a9dcea')}`,
  aurora_arc:step=>`${particles('#b7ffe1',21,35)}${step>=7?signal('#a5ffde',219,108):''}${human(72,187,'#a2d2d1')}`,
  inkbound:step=>`${particles('#f7d9be',15,36)}${step>=7?signal('#f9d6ba',208,128):''}${human(72,193,'#dabbb8')}`,
});

export function renderSceneDepth(room, step) {
  const draw = icons[room.mission];
  if (!draw) return '';
  return `<defs><clipPath id="story-foreground-clip"><rect width="415" height="260"/></clipPath></defs>
    <g class="story-depth" clip-path="url(#story-foreground-clip)" aria-hidden="true">
      ${draw(step)}
      <rect class="story-light-sweep" width="16" height="260" x="-25" fill="#e5f7ff" opacity=".04"/>
      <rect x="0" y="0" width="415" height="260" fill="none" stroke="#e2f3fa" stroke-width="1" opacity=".11"/>
    </g>`;
}
