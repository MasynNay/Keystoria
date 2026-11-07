/** Six illustrated original environments (19–24).
 * Objective changes are driven solely by server-confirmed steps.
 * Motion is cosmetic and isolated inside the story camera, never the HUD.
 */
const palettes = {
  clockfall:['#091d31','#27616b','#8ae5e8'], nightmarket:['#281a38','#6c365e','#ffb3dd'],
  emberwing:['#322039','#975438','#ffc17f'], deepvault:['#082538','#185473','#95d8ff'],
  aurora_arc:['#091e39','#16566a','#b2ffc7'], inkbound:['#29253d','#75516a','#ffe2af'],
};
const mk=(color,step)=>Array.from({length:24},(_,i)=>`<circle cx="${(i*71+step*17)%415}" cy="${(i*59+step*11)%229+3}" r="${i%3+1}" fill="${color}" opacity="${(.09+i%5*.035).toFixed(3)}" class="frontier-particle" style="animation-delay:-${(i*.27).toFixed(2)}s"/>`).join('');
const lamps=(c,step)=>[0,1,2,3,4,5].map((i)=>`<g transform="translate(${15+i*71},${51+(i%2)*22})" class="frontier-lantern" style="animation-delay:-${i*.36}s"><path d="M0 -18v17" stroke="#e6c8ae" stroke-width="2"/><path d="M-10 0l10-9 10 9v23H-10Z" fill="${step>i?c:'#825d7c'}" opacity=".75" stroke="#f9e4cc" stroke-width="2"/><circle cy="11" r="4" fill="#fff2c9" opacity="${step>i?.95:.1}"/></g>`).join('');
const backgrounds={
 clockfall:(s,c)=>`<path d="M0 210 62 171 106 184 163 146 237 183 290 135 369 184 415 161V260H0Z" fill="#18384b"/>
  ${[0,1,2,3,4,5].map((i)=>`<rect x="${i*77-4}" y="${133+i%3*18}" width="61" height="121" fill="#1d4559" stroke="#51999c" stroke-opacity=".24"/>`).join('')}
  <g class="frontier-time-clock" transform="translate(195 105)"><circle r="83" fill="#142638" stroke="${c}" stroke-width="8" opacity=".95"/>
  <circle r="68" fill="none" stroke="#d8f7eb" stroke-opacity=".45" stroke-width="2"/>
  ${Array.from({length:12},(_,i)=>`<path d="M0 -73v8" stroke="${c}" stroke-width="3" transform="rotate(${i*30})"/>`).join('')}
  <g class="frontier-time-hand" style="transform-origin:0px 0px"><path d="M0 13V-52" stroke="#d8e6f7" stroke-width="6" stroke-linecap="round"/><path d="M0 8l34 22" stroke="${c}" stroke-width="5" stroke-linecap="round"/></g><circle r="6" fill="#fff4c9"/></g>
  <g class="frontier-ghost-tram" transform="translate(${Math.min(275,s*28-55)} 0)"><rect x="26" y="195" width="150" height="41" rx="10" fill="#3a9a9e" stroke="${c}" stroke-width="3"/><path d="M39 203h22m9 0h22m9 0h22" stroke="#c8f5f5" stroke-width="7"/><circle cx="59" cy="239" r="7" fill="#10212f"/><circle cx="143" cy="239" r="7" fill="#10212f"/></g>
  ${s>=7?`<path d="M9 243Q180 216 395 238" fill="none" stroke="#a9ffd8" stroke-width="5" class="frontier-drawn-route"/>`:''}`,
 nightmarket:(s,c)=>`<path d="M0 211Q78 168 155 216T310 190T415 201V260H0Z" fill="#352c4e"/>
  ${[0,1,2,3].map((i)=>`<g transform="translate(${9+i*103} ${137+i%2*9})"><path d="M0 29 16 -8h78l16 37" fill="#7a4877" stroke="${c}" stroke-width="3" opacity=".72"/><rect y="28" width="108" height="62" fill="#34253f" stroke="#a77a9f" stroke-width="3"/><rect x="37" y="44" width="32" height="38" fill="#71506d"/></g>`).join('')}
  ${lamps(c,s)}<g transform="translate(205 173)"><path d="M-25 45v-48l-9-13h68L25-3v48" fill="#724d82" stroke="${c}" stroke-width="4"/><ellipse cy="-12" rx="22" ry="14" fill="${c}" opacity=".28" class="frontier-dream-glow"/><path d="M-12 12q12-15 24 0" fill="none" stroke="#fff4df" stroke-width="3"/></g>
  ${s>=9?`<circle cx="355" cy="73" r="48" fill="#ffc995" opacity=".42" class="frontier-dawn"/>`:''}`,
 emberwing:(s,c)=>`<path d="M0 232 79 109 119 182 210 32 294 185 361 94 415 189V260H0Z" fill="#74505c" stroke="#cd8070" stroke-width="2"/>
  <path d="M0 248 78 183 164 238 236 151 314 231 415 195V260H0Z" fill="#452c41"/>
  <path d="M239 177 255 45 300 15 349 60 357 171Z" fill="#463447" stroke="#df9b7c" stroke-width="4"/>
  <g class="frontier-dragon"><path d="M56 168q32-34 65-5 35-43 79-28-34 35-63 33 13 41-27 47l-26-20Z" fill="${c}" opacity=".83" stroke="#ffe2b8" stroke-width="3"/>
  <path d="M84 176q-22-53-64-57 9 44 58 73m43-27q9-55 49-61-11 49-43 79" stroke="#fbd19e" fill="${c}" opacity=".65" stroke-width="3"/>
  <circle cx="126" cy="168" r="4" fill="#421b1d"/></g>
  <g class="frontier-eggs">${[0,1,2,3].map((i)=>`<ellipse cx="${224+i*27}" cy="${231-i%2*5}" rx="11" ry="16" fill="${s>=5+i?c:'#8d747e'}" stroke="#f9d2a8" stroke-width="3" opacity="${s>=5+i?.95:.45}"/>`).join('')}</g>
  ${s>=10?`<path d="M16 224Q127 179 210 218T398 212" fill="none" stroke="#fff2ba" stroke-width="5" class="frontier-drawn-route"/>`:''}`,
 deepvault:(s,c)=>`<path d="M0 229Q100 191 207 219T415 195V260H0Z" fill="#123d56"/><path d="M0 55Q115 63 207 52T415 49" stroke="#80b7d5" stroke-opacity=".19" stroke-width="5" fill="none" class="frontier-waterline"/>
  <rect x="64" y="51" width="291" height="189" rx="32" fill="#183e55" stroke="#75abc3" stroke-width="7"/>
  <path d="M82 97h255M82 144h255M82 193h255" stroke="${c}" stroke-opacity=".4" stroke-width="4"/>
  ${Array.from({length:15},(_,i)=>`<rect x="${97+i%5*46}" y="${102+Math.floor(i/5)*47}" width="${18+i%3*5}" height="${25+i%3*3}" rx="2" fill="${i<s?'#7fafd1':'#4d718a'}" stroke="#b7dbeb" stroke-opacity=".44" stroke-width="1"/>`).join('')}
  <circle cx="208" cy="97" r="24" fill="#17415d" stroke="${c}" stroke-width="4"/><path d="M195 98q12-13 25 0t25 0" fill="none" stroke="#dbfaff" stroke-width="3"/>
  <g class="frontier-bubbles">${Array.from({length:15},(_,i)=>`<circle cx="${17+i*29}" cy="${215-(i*17)%158}" r="${2+i%4}" fill="none" stroke="${c}" opacity=".32"/>`).join('')}</g>
  ${s>=8?`<g class="frontier-salvage" transform="translate(312 186)"><rect x="-16" y="-22" width="33" height="48" rx="5" fill="#accde0" stroke="${c}" stroke-width="3"/><circle cy="-11" r="8" fill="#245674"/><path d="M-12 28l-18 18m38-18 18 18" stroke="${c}" stroke-width="6"/></g>`:''}`,
 aurora_arc:(s,c)=>`<circle cx="340" cy="209" r="144" fill="#1c506b" stroke="#73c4d6" stroke-width="5" opacity=".93"/><ellipse cx="352" cy="211" rx="136" ry="47" fill="none" stroke="#d7f5df" stroke-width="10" opacity=".27" transform="rotate(-21 352 211)"/>
  <g class="frontier-aurora">${[0,1,2,3].map((i)=>`<path d="M-20 ${63+i*14}Q${80+i*15} ${-31+i*20} 206 ${63+i*3}T437 ${50+i*18}" fill="none" stroke="${[c,'#83c8ff','#a6edfa','#fff2b0'][i]}" stroke-width="${9-i}" stroke-opacity="${.5-i*.06}" class="frontier-aurora-band" style="animation-delay:-${i*.58}s"/>`).join('')}</g>
  <g class="frontier-orbital-station" transform="translate(205 137)"><path d="M-170 0h340" stroke="#9fc7c7" stroke-width="8"/><rect x="-80" y="-31" width="160" height="62" rx="9" fill="#3d6379" stroke="${c}" stroke-width="4"/><rect x="-161" y="-25" width="66" height="50" fill="#1f4b6d" stroke="#bedde9" stroke-width="3"/><rect x="95" y="-25" width="66" height="50" fill="#1f4b6d" stroke="#bedde9" stroke-width="3"/><circle r="17" fill="${s>=10?'#a3f9ad':'#f5c37d'}" class="frontier-reactor"/><path d="M-42 -31v62M42 -31v62" stroke="#a9d7df" stroke-width="3"/></g>
  ${s>=9?`<path class="frontier-drawn-route" d="M45 196Q139 170 226 193T394 157" stroke="#d2ffb3" stroke-width="5" fill="none"/>`:''}`,
 inkbound:(s,c)=>`<path d="M0 203Q72 161 162 207T322 188T415 195V260H0Z" fill="#4f3854"/>
  <g class="frontier-open-book"><path d="M205 65Q133 31 57 70v148q89-18 148 13 58-31 150-13V70Q267 31 205 65Z" fill="#dac49f" stroke="${c}" stroke-width="7"/>
  <path d="M205 65v167M76 88q56-16 110 1M76 105q55-11 112 5M76 124q55-10 112 6M228 90q53-16 106 1M228 109q55-10 105 2M228 130q56-9 102 6" fill="none" stroke="#896d69" stroke-width="4" stroke-opacity="${s>=8?.56:.18}"/>
  <g class="frontier-ink-drop"><path d="M252 40q22-35 43 0 4 24-21 30-27-6-22-30Z" fill="#392647" opacity="${s>=8?.1:.85}"/><circle cx="275" cy="42" r="5" fill="${c}"/></g>
  ${s>=4?`<path d="M97 177l35-49 34 49m15 0q24-40 40-26" fill="none" stroke="#bd79a2" stroke-width="5" class="frontier-drawn-route"/>`:''}
  ${s>=9?`<path d="M82 150q56-39 110-2M228 157q54-45 108 0" stroke="#5d8159" stroke-width="5" fill="none" class="frontier-restored"/>`:''}</g>`,
};
export const FRONTIER_WORLD_IDS=Object.freeze(Object.keys(backgrounds));
export function renderFrontierScene(room,step=0,danger=false){
 const colors=palettes[room.mission], draw=backgrounds[room.mission];if(!draw)return '';
 const s=Math.max(0,Math.min(11,Number(step)||0));const [sky,floor,glow]=colors;
 return `<defs><linearGradient id="frontier-sky" x2="0" y2="1"><stop stop-color="${sky}"/><stop offset="1" stop-color="${floor}"/></linearGradient><clipPath id="frontier-stage-clip"><rect width="415" height="260"/></clipPath></defs>
 <rect width="780" height="260" fill="url(#frontier-sky)"/><g clip-path="url(#frontier-stage-clip)" data-frontier-world="${room.mission}" data-frontier-step="${s}" class="frontier-scene frontier-${room.mission}"><rect width="415" height="260" fill="url(#frontier-sky)"/>${mk(glow,s)}${draw(s,glow)}<path d="M0 251h415" stroke="${glow}" stroke-opacity=".4" stroke-width="3"/>${danger?`<rect x="5" y="5" width="405" height="250" fill="none" stroke="#ff7d82" stroke-width="6" stroke-dasharray="16 9" class="frontier-danger"/>`:''}</g>`;
}
