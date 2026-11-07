/**
 * Foreground action for the story camera. Every scene is a deliberately drawn
 * SVG vignette, not a video or a second interface. The `--typing-progress`
 * property comes from the shared typing renderer; the server alone determines
 * whether the objective is complete.
 */
import { currentShot } from './cinematic-storyboards.js';
import { safe } from './helpers.js';

const THEMES = {
  station: ['#b5ffe7','#68bddd'], hollow: ['#dec7ff','#b989f0'],
  outbreak: ['#c1ffd0','#7de6b8'], casefile: ['#ffe4ad','#f3b77b'],
  dead_air: ['#bdf8ff','#81cbe5'], last_stop: ['#ffe5a9','#ef9876'],
  abyss: ['#b7fff1','#5cbeda'], neon: ['#ffc7f9','#bf8cff'],
  red_horizon: ['#ffe0be','#ff9d8c'], whiteout: ['#e6faff','#92ccf3'],
  ashfall: ['#ffe4b2','#ff9b63'], carnival: ['#d6e6ff','#d3a4fa'],
  mirrorfall:['#d9c6ff','#8d88df'], four_winds:['#b4fff2','#75b8d3'],
  dawnforge:['#ffdfa1','#ef9876'], glass_trials:['#ffde98','#6fb8ff'],
  wildbond:['#bfffc5','#63c89c'], stardoor:['#ddcdff','#8c9df2'],
};
const line = (path, color, width=4, css='act-draw') => `<path d="${path}" class="${css}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const blink = (x,y,color,r=4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" class="act-indicator"/>`;
const runner = (x,y,color) => `<g transform="translate(${x} ${y})" class="act-runner act-operator">
  <ellipse cx="0" cy="-31" rx="8" ry="10" fill="#f7fafb" opacity=".96"/>
  <path d="M-10 -22Q0 -29 10 -22l10 13q4 6 2 13l-4 15q-2 7 -9 7H-9q-7 0 -9 -7l-4 -15q-2 -7 2 -13Z" fill="${color}"/>
  <path d="M-12 -12 -28 1q-6 5 -4 11l2 8 16 -9 7 -10Z" fill="${color}" opacity=".94"/>
  <path d="M12 -12 28 1q6 5 4 11l-2 8 -16 -9 -7 -10Z" fill="${color}" opacity=".94"/>
  <path d="M-7 25 -20 46q-5 8 2 11h8l14 -21 -3 -10Z" fill="${color}"/>
  <path d="M7 25 18 45q5 8 -2 11h-8L-5 36l3 -10Z" fill="${color}"/>
  <path d="M-10 8h20" stroke="#0b1c26" stroke-width="2" opacity=".2"/>
</g>`;
const signalWaves = (x,y,color) => `<g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width="2.6">${[21,37,55].map((r,i)=>`<circle r="${r}" class="act-broadcast" style="animation-delay:${-i*.55}s" opacity=".23"/>`).join('')}</g>`;

const clipLine = (text='', len=20) => {
  const clean = String(text).replace(/[^a-z0-9\s]/gi,' ').replace(/\s+/g,' ').trim().toUpperCase();
  return clean.length > len ? `${clean.slice(0, len-1)}…` : clean || 'LIVE DATA';
};
const encodedLine = (text='') => clipLine(String(text).replace(/[A-Za-z]/g, ch => {
  const base = ch <= 'Z' ? 65 : 97;
  return String.fromCharCode(base + ((ch.charCodeAt(0) - base + 7) % 26));
}).replace(/[AEIOUaeiou]/g,'•').replace(/\s/g,'·'), 20);
function cueMode(room, shot) {
  // Classify the literal typed action FIRST. A recycled thumbnail focus must
  // never make "release the rain" animate a generic computer console.
  const command=String(room?.target?.text||'').toLowerCase();
  const focus=String(shot?.focus||'').toLowerCase();
  const matches=(pattern)=>pattern.test(command);
  // Bespoke genres: restore tree roots should nurture a forest, not decode a radio;
  // release the dawn should move the sun, not trigger a battery graphic.
  if(room?.mission==='wildbond' && !matches(/decode the ranger ledger/)) return 'creature';
  if(room?.mission==='dawnforge') return 'forge';
  if(room?.mission==='four_winds' && !matches(/decode the weatherkeeper orders/)) return 'elemental';
  if(room?.mission==='stardoor' && matches(/storydoor|monarch|memory|memories|realm bridge|apprentice friend|starless door/)) return 'portal';
  if(matches(/decode|decrypt|broadcast|transmit|frequency|signal|radio|repeater|antenna|call|message|communication|channel|uplink|beacon/)) return 'decode';
  if(matches(/map|route|navigation|landing|street|corridor|passage|path|evacuation|convoy|footsteps|pawprints|approach|coordinate/)) return 'route';
  if(matches(/unlock|lock|door|airlock|gate|elevator|lift|clamps|key|brakes|throttle|winch|tether|pressure|seal|bulkhead|valves|exhaust|hatch|access|booth/)) return 'access';
  if(matches(/power|battery|generator|pump|solar|engine|reactor|filter|oxygen|reboot|reroute|restore|shield|traction|current|circuit|heater/)) return 'power';
  if(matches(/sample|pathogen|genome|antidote|agent|dosage|dispersal|neutraliz|centrifuge|infection|vial|serum/)) return 'lab';
  if(matches(/evidence|ledger|archive|signature|file|report|footage|timeline|payment|witness|records|prophecy|tablet|forged|order|security log/)) return 'evidence';
  if(matches(/candles|diary|sigil|spirit|circle|curse|ritual|lantern|soul|old words|incantation|binding/)) return 'ritual';
  if(matches(/\brain\b|water guardian|sluice|earth support|fire line|air turbine|water bridge|four guardians|weather tower|elemental/)) return 'elemental';
  if(matches(/sunrise|sunless|temple|braziers|solar chain|celestial gears|dawn ember|immortal smith|pilgrim|sunlight|bronze labyrinth|pact/)) return 'forge';
  if(matches(/skyfox|grove|nest|forest|heart tree|heart seed|companion|guardian|pawprint|nursery|snares/)) return 'creature';
  if(matches(/stardoor|realm|memories|memory|monarch|apprentice friend|mirror threshold|reflected city|reflection|portal|six bridge|breach/)) return 'portal';
  if(matches(/train|shuttle|submarine|rover|bus|vehicle|launch|escape|passengers|crew|docking|raise|ascent|surface/)) return 'vehicle';
  if(matches(/camera|clock|sonar|scanner|radar|inspect|locate|survey|loop|trace|identify|find|contact|cross reference|verify|reconstruct|review|check/)) return 'scan';
  // Fall back to the storyboard only if there was no matching active command.
  if(/signal|radio|broadcast|frequency|antenna|beacon|phone|relay/.test(focus)) return 'decode';
  if(/map|route|landing|flood|shelter|surface/.test(focus)) return 'route';
  if(/door|lock|key|brakes|tether|winch|throttle/.test(focus)) return 'access';
  if(/power|battery|pump|solar|engine|oxygen|filter|light/.test(focus)) return 'power';
  if(/vial|dna|greenhouse/.test(focus)) return 'lab';
  if(/ghost|sigil|candle|shield/.test(focus)) return 'ritual';
  if(/archive|book|evidence|ledger|signature|files|decrypt/.test(focus)) return 'evidence';
  if(/vehicle|train|shuttle|submarine|passenger/.test(focus)) return 'vehicle';
  if(/sonar|scanner|camera|clock/.test(focus)) return 'scan';
  return 'scan'; // A readable instrumentation shot is safer than an unrelated graphic.
}

const scenes = {
  station: (step, color) => `${line('M40 184h260m-260 -14h260',color,2,'act-conduit')}<g class="act-slide"><path d="M69 150 111 122h110l41 28-41 20H111Z" fill="#517a8e" stroke="${color}" stroke-width="3"/><path d="M111 122h110l-18-17h-72Z" fill="#1d3446"/>${blink(241,149,color,7)}<path class="act-engine" d="M94 154l-60 15 62 3Z" fill="#b9ebff"/></g>${signalWaves(265,136,color)}${runner(311,194,color)}`,
  hollow: (step,color) => `<g class="act-ghost"><path d="M85 191v-65q0-30 28-34t28 34v65l-14-13-13 12-16-12Z" fill="#b5a1e4" opacity=".65"/>${blink(104,132,'#211e39',4)}${blink(123,132,'#211e39',4)}</g><circle cx="253" cy="157" r="46" fill="none" stroke="${color}" opacity=".4" stroke-width="3" class="act-ritual"/><path class="act-trace" d="M253 110 294 183h-82Z" fill="none" stroke="${color}" stroke-width="5"/>${line('M193 215Q227 202 253 215T324 215',color,3,'act-conduit')}${runner(326,208,color)}`,
  outbreak: (step,color) => `<g><rect x="59" y="112" width="124" height="92" rx="7" fill="#153b3e" stroke="${color}" stroke-width="3"/><path d="M67 169h108" stroke="${color}" opacity=".3"/><path class="act-ekg" d="M64 163h23l13-18 13 34 12-27 11 11h41" fill="none" stroke="${color}" stroke-width="4"/></g><path d="M229 139h62v61h-62Z" fill="#173936" stroke="${color}" stroke-width="3"/><path class="act-liquid" d="M233 195h54v-41h-54Z" fill="#7efaad" opacity=".45"/>${runner(336,216,color)}${blink(278,143,color)}`,
  casefile: (step,color) => `<g><rect x="37" y="94" width="305" height="109" fill="#392e31" stroke="#9f8070" stroke-width="4"/>${[0,1,2,3].map((i)=>`<rect x="${52+i*70}" y="${106+(i%2)*11}" width="55" height="71" fill="#d4c4a9" transform="rotate(${i%2?4:-4} ${80+i*70} 140)"/><path d="M${61+i*70} ${127+(i%2)*11}h34m-34 9h27" stroke="#6c5554" stroke-width="2"/>`).join('')}${blink(95,118,'#ffdca8',5)}${blink(244,129,color,5)}${line('M96 118 154 173 244 129 309 174',color,3,'act-case-link')}</g><g class="act-magnifier"><circle cx="299" cy="167" r="21" fill="none" stroke="${color}" stroke-width="5"/><path d="M315 185l23 24" stroke="${color}" stroke-width="8"/></g>`,
  dead_air: (step,color) => `<g class="act-flood"><path d="M14 198q28-10 56 0t56 0t56 0t56 0t56 0t56 0v23H14Z" fill="#3a8ba6" opacity=".6"/><path d="M12 195q25-7 50 0t50 0t50 0t50 0t50 0t50 0" stroke="${color}" fill="none" stroke-width="3"/></g><g class="act-sail"><path d="M40 182h115l-19 24H58Z" fill="#b8d1d6" stroke="#ceeef2" stroke-width="3"/><rect x="76" y="152" width="40" height="30" fill="#3b6679"/>${blink(98,158,'#ffe1a3',5)}</g><path d="M277 208 291 72l19 136" fill="none" stroke="${color}" stroke-width="5"/><path d="M265 110h54m-45 39h38" stroke="${color}" stroke-width="3"/>${signalWaves(291,71,color)}${line('M105 187 210 165 290 89',color,4,'act-route')}${runner(346,210,color)}`,
  last_stop: (step,color) => `<path d="M15 215h375m-375 14h375" stroke="${color}" opacity=".5" stroke-width="5"/>${Array.from({length:8},(_,i)=>`<path d="M${i*49+20} 213l-12 17" stroke="#8fa5b4" stroke-width="6"/>`).join('')}<g class="act-train"><rect x="35" y="112" width="230" height="88" rx="15" fill="#7a919e" stroke="${color}" stroke-width="4"/><rect x="49" y="125" width="53" height="35" rx="5" fill="#183d4a"/><rect x="114" y="125" width="53" height="35" rx="5" fill="#183d4a"/><path d="M186 133h60m-60 17h60" stroke="${color}" stroke-width="3"/>${[95,209].map(x=>`<circle cx="${x}" cy="204" r="16" fill="#162a34" stroke="${color}" stroke-width="5" class="act-wheel"/>`).join('')}<path class="act-brakes" d="M65 205h160" stroke="#ffb77f" stroke-width="11" opacity=".7"/></g><path d="M326 103v117" stroke="#ffad80" stroke-width="6"/><path d="M310 103h35l-18 25Z" fill="#ffa484"/>`,
  abyss: (step,color) => `<g class="act-sub"><path d="M40 156Q49 115 161 116h45q54 3 62 49-8 40-73 43H107Q50 200 40 156Z" fill="#396e80" stroke="${color}" stroke-width="4"/>${[105,157,207].map(x=>`<circle cx="${x}" cy="162" r="17" fill="#082d44" stroke="${color}" stroke-width="4"/>`).join('')}<path d="M68 115v-19h54" stroke="${color}" stroke-width="4"/></g>${line('M196 117 250 80 319 130',color,4,'act-tether')}${runner(326,181,color)}${[0,1,2,3].map(i=>`<circle class="act-bubble" cx="${289+i*19}" cy="${130+i%2*25}" r="${3+i%3*2}" fill="none" stroke="${color}" style="animation-delay:-${i*.8}s"/>`).join('')}`,
  neon: (step,color) => `<g><rect x="38" y="116" width="168" height="94" rx="6" fill="#1a233c" stroke="${color}" stroke-width="3"/><path d="M62 134h93m-93 15h111m-111 14h66" stroke="${color}" stroke-width="3" class="act-decrypt"/><rect x="62" y="181" width="110" height="7" fill="#60528c"/><rect class="act-fill" x="62" y="181" width="110" height="7" fill="${color}"/></g><path class="act-laser" d="M251 95v127m38-127v127" stroke="#ff6abd" stroke-width="4" stroke-dasharray="11 7"/>${runner(327,198,color)}${signalWaves(244,102,color)}`,
  red_horizon: (step,color) => `<g class="act-rover"><path d="M35 175h200v32H35Z" fill="#b07d6f" stroke="${color}" stroke-width="3"/><rect x="82" y="131" width="106" height="44" fill="#53717b" stroke="${color}" stroke-width="3"/>${[83,192].map(x=>`<circle cx="${x}" cy="211" r="18" fill="#41383b" stroke="${color}" stroke-width="5"/>`).join('')}</g><path d="M259 192v-72l23-23 22 23v72Z" fill="#567f7c" stroke="${color}" stroke-width="4"/><path class="act-oxygen" d="M270 163h22m-11 -11v22" stroke="#cbffc1" stroke-width="6"/>${runner(343,207,color)}${signalWaves(282,101,color)}`,
  whiteout: (step,color) => `<g class="act-blizzard">${Array.from({length:9},(_,i)=>`<path d="M${20+i*40} ${75+i%3*31}l-14 13" stroke="${color}" stroke-width="3" opacity=".6"/>`).join('')}</g><g class="act-helicopter"><path d="M63 152q8-36 91-32l53 24-13 24H98Z" fill="#88a9bb" stroke="${color}" stroke-width="4"/><path d="M105 120 75 90h70l36 30" stroke="#edfaff" stroke-width="4" fill="none"/><path d="M78 113h175m-137 55v17m80-17v17" stroke="${color}" stroke-width="5"/><circle cx="205" cy="156" r="9" fill="#dbeeff"/></g>${runner(313,217,color)}${signalWaves(352,119,color)}`,
  ashfall: (step,color) => `<g class="act-embers">${Array.from({length:7},(_,i)=>`<path d="M${25+i*58} 208q-16-26 6-44q18 27 6 44Z" fill="${i%2?'#ffb36b':'#ff7954'}" opacity=".65"/>`).join('')}</g><g class="act-bus"><rect x="32" y="129" width="226" height="74" rx="12" fill="#e8bb62" stroke="#ffe6a9" stroke-width="4"/>${[0,1,2,3].map(i=>`<rect x="${56+i*44}" y="140" width="34" height="28" fill="#497486"/>`).join('')}${[83,217].map(x=>`<circle cx="${x}" cy="208" r="15" fill="#28323f" stroke="#ffe6a9" stroke-width="4"/>`).join('')}</g>${line('M62 186 137 159 274 151 360 110','#b2ffe4',4,'act-route')}${runner(345,208,color)}`,
  carnival: (step,color) => `<g class="act-ferris"><circle cx="180" cy="143" r="76" fill="none" stroke="${color}" stroke-width="5"/><circle cx="180" cy="143" r="53" fill="none" stroke="${color}" opacity=".4"/>${Array.from({length:8},(_,i)=>{const a=Math.PI*i/4;const x=Math.round(180+76*Math.cos(a)), y=Math.round(143+76*Math.sin(a));return `<path d="M180 143L${x} ${y}" stroke="${color}" stroke-width="3"/><rect x="${x-12}" y="${y-5}" width="24" height="25" rx="4" fill="#a5a2cd" stroke="${color}"/>`}).join('')}<path d="M180 143 119 224m61-81 61 81" stroke="#91a0be" stroke-width="6"/></g><path class="act-cable" d="M175 67q20 15 44 0" stroke="${color}" stroke-width="5" fill="none"/>${runner(338,211,color)}${signalWaves(313,117,color)}`,
  mirrorfall: (step,c)=>`<g class="legend-action-mirror"><path d="M30 206Q85 156 138 209" fill="none" stroke="${c}" stroke-opacity=".45" stroke-width="5"/><path d="M141 78v123M170 78v123" stroke="${c}" stroke-width="5" opacity=".5"/><path class="act-route" d="M44 211 84 185 120 174 171 122" fill="none" stroke="${c}" stroke-width="5"/><circle cx="151" cy="133" r="27" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="8 6" class="act-ritual"/><circle cx="151" cy="133" r="9" fill="${c}" opacity=".48"/></g>`,
  four_winds: (step,c)=>`<g class="legend-action-elements"><path class="act-liquid" d="M52 204q26-24 54 0t53 0 55 0v24H52Z" fill="#51c4d7" opacity=".45"/><path class="act-conduit" d="M30 132Q101 97 168 131T285 114" fill="none" stroke="${c}" stroke-width="4"/><circle cx="151" cy="101" r="43" stroke="${c}" stroke-width="3" fill="none" class="act-ritual"/><path d="M144 101q-31-13-17-36q29 8 17 36m15-2q30 1 20-25q-26 1-20 25" fill="#b2edca" opacity=".7"/></g>`,
  dawnforge: (step,c)=>`<g class="legend-action-forge"><circle cx="133" cy="125" r="58" fill="none" stroke="#d8a17e" stroke-width="13" stroke-dasharray="13 8" class="act-radar-sweep"/><circle cx="133" cy="125" r="33" fill="#9f5543" stroke="${c}" stroke-width="3"/><circle cx="133" cy="125" r="14" fill="${c}" class="act-power"/><path class="act-conduit" d="M186 126h79v-37h56" fill="none" stroke="${c}" stroke-width="5"/></g>`,
  glass_trials: (step,c)=>`<g class="legend-action-arena"><path class="act-gate-leaf" d="M80 111h37v103H80Z" fill="#638aa8" stroke="${c}" stroke-width="3"/><path class="act-gate-leaf act-gate-leaf-right" d="M123 111h37v103h-37Z" fill="#638aa8" stroke="${c}" stroke-width="3"/><rect x="38" y="57" width="145" height="39" rx="6" fill="#1b3046" stroke="${c}" stroke-width="2"/><path class="act-route" d="M50 75h99" stroke="${c}" stroke-width="4"/><path d="M24 226 195 226" stroke="${c}" stroke-width="4" opacity=".6"/></g>`,
  wildbond: (step,c)=>`<g class="legend-action-roots"><path class="act-route" d="M24 213Q88 188 142 214T279 201" fill="none" stroke="#b2ffcf" stroke-width="7"/><path d="M143 206V115" stroke="#917b60" stroke-width="19" stroke-linecap="round"/><path d="M140 147q-52-38-68 3 38 12 68-3m2-29q54-43 70-4-39 23-70 4" fill="#64b585" stroke="${c}" stroke-width="2"/><circle cx="143" cy="108" r="18" fill="${c}" opacity=".46" class="act-indicator"/></g>`,
  stardoor: (step,c)=>`<g class="legend-action-door"><path d="M77 215V109q0-71 75-71 74 0 74 71v106" stroke="${c}" stroke-width="10" fill="none"/><path class="act-ritual" d="M95 212V112q0-51 57-51 56 0 56 51v100" stroke="#c5b7ff" stroke-width="5" fill="none"/><path class="act-route" d="M151 195Q173 167 215 144T319 128" fill="none" stroke="${c}" stroke-width="4"/><circle cx="152" cy="139" r="43" stroke="${c}" stroke-width="3" fill="#a9b5ff" opacity=".14"/></g>`,

};

/** The foreground reacts to the exact objective text instead of only the mission theme.
 * This keeps the scene visuals aligned with what the player is currently typing.
 */
function actionCue(room, shot, color) {
  const focus = shot?.focus || '';
  const objective = room?.target?.text || focus;
  const explanation = room?.target?.explanation || objective;
  const mode = cueMode(room, shot);
  const at=(markup)=>`<g class="act-action-cue" data-action-mode="${mode}" opacity=".84">${markup}</g>`;
  if (mode === 'decode') return at(`<g class="act-message-panel"><rect x="222" y="55" width="150" height="73" rx="8" fill="#102433" stroke="${color}" stroke-width="2" opacity=".95"/><text x="234" y="73" fill="${color}" font-size="8" font-family="monospace">DECODE TRAFFIC</text><text x="234" y="90" fill="#90b9c8" font-size="7.3" font-family="monospace">ENCRYPTED</text><text x="234" y="103" class="act-decode-encoded" fill="#ffffff" font-size="9.4" font-family="monospace">${safe(encodedLine(objective))}</text><text x="234" y="103" class="act-decode-decoded" fill="#dffcf4" font-size="9.4" font-family="monospace">${safe(clipLine(explanation, 20))}</text><rect x="234" y="112" width="122" height="4" rx="2" fill="#35505e" opacity=".55"/><rect x="234" y="112" width="122" height="4" rx="2" fill="${color}" class="act-signal-fill"/></g>${signalWaves(357,81,color)}${line('M292 120 322 94 354 82',color,4,'act-route')}`);
  if (mode === 'route') return at(`<g class="act-route-map"><rect x="231" y="57" width="141" height="76" rx="8" fill="#122432" stroke="${color}" stroke-width="2"/><path d="M244 71h116M244 86h116M244 101h116M244 116h116M255 66v57M283 66v57M311 66v57M339 66v57" stroke="${color}" opacity=".12"/><path class="act-route" d="M247 120 277 98 301 103 324 80 359 69" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="247" cy="120" r="5" fill="${color}"/><circle cx="359" cy="69" r="6" fill="${color}" class="act-indicator"/><path class="act-route-tip" d="M0 0l12 -7 -4 14Z" fill="${color}" transform="translate(247 120)"/></g>`);
  if (mode === 'access') return at(`<g class="act-access"><rect x="277" y="58" width="85" height="86" rx="7" fill="#183140" stroke="${color}" stroke-width="3"/><path class="act-gate-leaf" d="M281 64h36v74h-36Z" fill="${color}" opacity=".28"/><path class="act-gate-leaf act-gate-leaf-right" d="M322 64h36v74h-36Z" fill="${color}" opacity=".28"/><path d="M294 83v42M344 83v42" stroke="${color}" opacity=".45" stroke-width="3"/><circle cx="319" cy="101" r="13" fill="#102433" stroke="${color}" stroke-width="3"/><path d="M319 95v13" stroke="${color}" stroke-width="4"/><circle cx="319" cy="106" r="3" fill="${color}"/><path class="act-cable" d="M237 101h38" stroke="${color}" stroke-width="5" fill="none"/><circle cx="236" cy="101" r="6" fill="${color}" class="act-indicator"/></g>`);
  if (mode === 'power') return at(`<g class="act-power-grid"><path class="act-conduit" d="M227 85h34v-17h43v33h50" stroke="${color}" stroke-width="5" fill="none"/><rect x="303" y="57" width="66" height="82" rx="8" fill="#142d37" stroke="${color}" stroke-width="3"/><rect x="315" y="72" width="42" height="45" rx="4" fill="#0c1d27" stroke="${color}" opacity=".58"/><path d="M336 76l-11 17h12l-7 16 19-23h-12l8-10Z" fill="${color}" class="act-power"/><rect x="316" y="123" width="40" height="5" rx="2.5" fill="#365360" opacity=".52"/><rect x="316" y="123" width="40" height="5" rx="2.5" fill="${color}" class="act-fill"/><circle cx="241" cy="85" r="5" fill="${color}" class="act-indicator"/><circle cx="353" cy="85" r="5" fill="${color}" class="act-indicator"/></g>`);
  if (mode === 'lab') return at(`<g class="act-lab"><rect x="223" y="55" width="149" height="81" rx="8" fill="#10272c" stroke="${color}" stroke-width="2"/><path d="M241 111h43v-33h-43Z" fill="#0f1b21" stroke="${color}" stroke-width="2"/><path class="act-ekg" d="M246 97h8l6-10 7 18 8-15 5 7h10" fill="none" stroke="${color}" stroke-width="3"/><path d="M320 70v13l-19 35q-5 11 7 12h35q12-1 7-12l-19-35V70" fill="#17333a" stroke="${color}" stroke-width="3"/><path class="act-liquid" d="M307 115q11-4 23 0t13 8q0 4-7 4h-34q-7 0-7-4 0-4 12-8Z" fill="${color}" opacity=".56"/><circle cx="331" cy="87" r="4" fill="${color}" class="act-particle"/><circle cx="324" cy="96" r="3" fill="${color}" class="act-particle" style="animation-delay:-1.2s"/></g>`);
  if (mode === 'evidence') return at(`<g class="act-evidence"><rect x="221" y="55" width="154" height="83" rx="8" fill="#1d232e" stroke="#8e7968" stroke-width="3"/><g transform="translate(239 67) rotate(-6)"><rect width="42" height="56" fill="#dcc8a4"/><path d="M8 15h25M8 23h20M8 31h27" stroke="#725d53" stroke-width="2"/></g><g transform="translate(292 71) rotate(4)"><rect width="44" height="53" fill="#cfbf9d"/><path d="M9 18h27M9 26h20M9 34h24" stroke="#725d53" stroke-width="2"/></g><path class="act-case-link" d="M260 95 312 98 345 82" stroke="${color}" stroke-width="3" fill="none"/><circle cx="260" cy="95" r="5" fill="${color}"/><circle cx="312" cy="98" r="5" fill="${color}"/><circle cx="345" cy="82" r="5" fill="${color}" class="act-indicator"/></g>`);
  if (mode === 'ritual') return at(`<g class="act-ritual-panel"><circle cx="319" cy="98" r="34" fill="none" stroke="${color}" stroke-width="3" class="act-ritual"/><path d="M319 64 349 116h-60Z" fill="none" stroke="${color}" stroke-width="3"/><circle cx="319" cy="98" r="8" fill="${color}" opacity=".58"/><path d="M249 124v-19M267 124v-22M285 124v-17" stroke="#f6d4a5" stroke-width="4"/><path d="M249 101q-7 -12 0 -17q8 6 0 17M267 98q-7 -12 0 -17q8 6 0 17M285 104q-7 -12 0 -17q8 6 0 17" fill="#ffb873"/></g>`);
  if (mode === 'vehicle') return at(`<g class="act-vehicle"><path class="act-engine" d="M229 116q8-32 84-34h23q37 5 43 34-7 25-42 29h-23q-76-2-85-29Z" fill="#3f6577" stroke="${color}" stroke-width="3"/><circle cx="279" cy="118" r="12" fill="#112734" stroke="${color}" stroke-width="3" class="act-wheel"/><circle cx="333" cy="118" r="12" fill="#112734" stroke="${color}" stroke-width="3" class="act-wheel"/><path class="act-brakes" d="M245 134h122" stroke="#ffb57e" stroke-width="8" opacity=".72"/><path class="act-route" d="M227 147 279 159 338 155 370 141" stroke="${color}" stroke-width="3" fill="none"/></g>`);
  if (mode === 'elemental') return at(`<g class="act-elemental"><circle cx="316" cy="97" r="42" fill="#123c44" stroke="${color}" stroke-width="3"/><path class="act-route" d="M272 117q25-24 44 0t44 0" stroke="#a5e8fb" stroke-width="5" fill="none"/><path class="act-brakes" d="M292 92q-7-18 3-29q15 18 12 30" fill="#ffad6b" stroke="#ffb982" stroke-width="3"/><path d="M325 131v-28l17-11 13 15v24Z" fill="#817d63" stroke="#d6d0a2" stroke-width="3"/><g class="act-radar-sweep" transform="translate(321 86)"><path d="M0 0v-29M0 0l26 11M0 0l-22 13" stroke="${color}" stroke-width="5" stroke-linecap="round"/></g><circle cx="316" cy="97" r="5" fill="${color}"/></g>`);
  if (mode === 'forge') return at(`<g class="act-forge"><circle cx="323" cy="97" r="42" stroke="#dca17a" stroke-width="9" stroke-dasharray="13 7" fill="#342a38" class="act-radar-sweep"/><circle cx="323" cy="97" r="30" stroke="${color}" stroke-width="3" fill="#5b393b"/><circle cx="323" cy="97" r="14" fill="#ffdf91" opacity=".82" class="act-power"/><path class="act-conduit" d="M240 111l29-9 30 4" stroke="${color}" stroke-width="5" fill="none"/><path class="act-ritual" d="M323 57v81" stroke="#fff1cc" stroke-width="4" stroke-dasharray="7 6"/><path d="M290 132l-9 12 20-7" fill="#ffc679"/></g>`);
  if (mode === 'creature') return at(`<g class="act-creature"><path d="M280 119l-12-49 40 17q30-12 56 7l19-20-1 54-28 20-48-2Z" fill="#91bba8" stroke="${color}" stroke-width="3"/><ellipse cx="307" cy="119" rx="5" ry="6" fill="#143b38"/><ellipse cx="352" cy="119" rx="5" ry="6" fill="#143b38"/><path d="M322 135q8 8 16 0" fill="none" stroke="#164639" stroke-width="3"/><path d="M268 130q-42 11-31-23" fill="none" stroke="#a3f6d1" stroke-width="10" stroke-linecap="round"/><path class="act-ritual" d="M243 144q43-40 95 10" stroke="${color}" stroke-width="3" fill="none"/><g class="act-runner" transform="translate(371 159)"><path d="M0 0v-29m0 20q-24-14-24-28 25 2 24 28m0-8q20-24 26-9-1 20-26 20" fill="#5d9b69" stroke="#9beb9c" stroke-width="3"/></g></g>`);
  if (mode === 'portal') return at(`<g class="act-portal"><path d="M281 144V99q0-45 43-45 46 0 46 45v45" stroke="${color}" stroke-width="7" fill="none"/><path d="M291 141V102q0-34 33-34 35 0 35 34v39Z" fill="#6978ad" opacity=".25" stroke="#e9dfff" stroke-width="3"/><ellipse cx="324" cy="106" rx="26" ry="33" stroke="${color}" fill="none" stroke-width="3" class="act-ritual"/><path class="act-route" d="M233 111q43-17 76 2 22 18 48-11" stroke="${color}" stroke-width="3" fill="none"/><circle class="act-indicator" cx="322" cy="106" r="9" fill="#dcd5ff"/></g>`);
  if (mode === 'scan') return at(`<circle cx="343" cy="93" r="40" fill="none" stroke="${color}" stroke-width="2" opacity=".55"/><path class="act-radar-sweep" d="M343 93l37 -16a41 41 0 0 1 -3 47Z" fill="${color}" opacity=".2"/>${blink(356,86,color,5)}`);
  return at(`<rect x="302" y="67" width="66" height="60" rx="8" fill="#1e3648" stroke="${color}" stroke-width="3"/>${blink(334,96,color,9)}`);
}

/** Different acts favor different foreground shots without changing gameplay. */
export function renderActionStage(room, step) {
  const [primary,secondary]=THEMES[room.mission] || THEMES.station;
  const shot=currentShot(room,step);
  const scene=scenes[room.mission] || scenes.station;
  const act=step<5?'ACT I':step<9?'ACT II':'FINALE';
  return `<g class="action-stage" data-action-world="${safe(room.mission)}" data-action-beat="${step}" data-action-focus="${safe(shot.focus)}" data-operator-role="${room.role === 'defender' ? 'defender' : 'hacker'}" aria-hidden="true">
    <defs><clipPath id="action-stage-clip"><rect x="0" y="29" width="415" height="211"/></clipPath>
    <linearGradient id="action-stage-halo" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${primary}" stop-opacity=".08"/><stop offset="1" stop-color="${secondary}" stop-opacity="0"/></linearGradient></defs>
    <g clip-path="url(#action-stage-clip)">
      <rect x="3" y="35" width="409" height="197" fill="#071725" opacity=".23"/>
      <rect x="3" y="35" width="409" height="197" fill="url(#action-stage-halo)"/>
      <g class="action-world-props">${scene(step,primary)}${actionCue(room,shot,primary)}</g>
      <g class="action-defense-layer">
        <circle cx="202" cy="140" r="75" fill="#142638" fill-opacity=".83" stroke="#ff8582" stroke-width="2" stroke-dasharray="7 9" class="act-defense-scanner"/>
        <circle cx="202" cy="140" r="57" fill="none" stroke="#ffb3a4" stroke-width="6" opacity=".23"/>
        <circle class="act-defense-ring" cx="202" cy="140" r="57" fill="none" stroke="${primary}" stroke-width="6" stroke-linecap="round" transform="rotate(-90 202 140)"/>
        <path d="M202 106l30 14v21q-1 30-30 43-30-13-30-43v-21Z" fill="#1b4b5a" stroke="${primary}" stroke-width="3"/>
        <path class="act-defense-check" d="M184 143l13 13 24-29" stroke="#cbffde" stroke-width="6" stroke-linecap="round" fill="none"/>
        <text x="202" y="215" text-anchor="middle" fill="#ffd4ce" font-family="monospace" font-size="10" font-weight="700">INTERCEPT THE THREAT</text>
      </g>
      <rect class="act-danger-frame" x="6" y="38" width="402" height="187" rx="5" fill="none" stroke="#ff8a89" stroke-width="5"/>
      <rect x="9" y="37" width="93" height="17" rx="3" fill="#071a22" opacity=".84"/><text x="16" y="49" fill="${primary}" font-size="8.5" font-family="monospace" letter-spacing="1">${act} / LIVE</text>
      <rect class="act-signal-meter" x="14" y="225" width="387" height="3" fill="${secondary}" opacity=".22"/>
      <rect class="act-signal-meter act-signal-fill" x="14" y="225" width="387" height="3" fill="${primary}"/>
    </g>
  </g>`;
}

Object.assign(THEMES, {"clockfall": ["#7ff2eb", "#347e9b"], "nightmarket": ["#ff96c9", "#a9518d"], "emberwing": ["#ffac52", "#c66b3e"], "deepvault": ["#74c5ff", "#2d7a9e"], "aurora_arc": ["#a5ff9c", "#5196aa"], "inkbound": ["#f4d59d", "#a786a0"]});
