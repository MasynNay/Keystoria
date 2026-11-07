/** Atmospheric in-world effects. No event handling, gameplay authority, or timers.
 * These overlays reflect room conditions and confirmed field interventions.
 */
const effects = {
  station: (used) => `<g class="scene-electric"><path d="M190 98 224 56 244 103 278 67" fill="none" stroke="#9de8ff" stroke-width="3" opacity=".5"/></g>${used ? '<g class="scene-good"><circle cx="340" cy="133" r="107" fill="none" stroke="#9af9bd" stroke-width="4" stroke-dasharray="12 7"/><circle cx="152" cy="159" r="31" fill="none" stroke="#a2ffd9" stroke-width="4"/></g>' : ''}`,
  hollow: (used) => `<g class="scene-mist"><path d="M0 231Q112 201 234 235T500 229T780 227" fill="none" stroke="#d8caee" stroke-width="23" opacity=".13"/></g>${used ? '<g class="scene-good"><circle cx="385" cy="182" r="78" fill="none" stroke="#f4c97d" stroke-width="3" stroke-dasharray="7 6"/><path d="M356 183h60M385 155v57" stroke="#f9e1a1" stroke-width="4" opacity=".7"/></g>' : ''}`,
  outbreak: (used) => `<g class="scene-mist">${Array.from({length:8},(_,i)=>`<circle cx="${75+i*91}" cy="${65+(i*23)%119}" r="${3+(i%3)*2}" fill="#b8f3a0" opacity=".36"/>`).join('')}</g>${used ? '<g class="scene-good"><path d="M260 73V246M507 73V246" stroke="#8cf7c0" stroke-width="8" stroke-dasharray="13 6"/><rect x="345" y="116" width="84" height="86" fill="none" stroke="#7dffb6" stroke-width="3"/></g>' : ''}`,
  casefile: (used) => `<g class="scene-mist"><path d="M195 90 418 126 560 82" fill="none" stroke="#edb5a1" stroke-width="2" stroke-dasharray="6 6" opacity=".7"/></g>${used ? '<g class="scene-good"><circle cx="418" cy="126" r="22" fill="none" stroke="#aaffc7" stroke-width="4"/><path d="M406 126l8 9 17-21" fill="none" stroke="#aaffc7" stroke-width="5"/></g>' : ''}`,
  dead_air: (used) => `<g class="scene-rain">${Array.from({length:16},(_,i)=>`<path d="M${15+i*51} ${45+(i*29)%144}l-10 23" stroke="#98d5ed" stroke-width="2" opacity=".31"/>`).join('')}</g>${used ? '<g class="scene-good"><circle cx="394" cy="37" r="150" fill="none" stroke="#9cffe2" stroke-width="5" stroke-dasharray="20 10"/><circle cx="394" cy="37" r="83" fill="none" stroke="#9cffe2" stroke-width="3"/></g>' : ''}`,
  abyss: (used) => `<g class="scene-bubbles">${Array.from({length:9},(_,i)=>`<circle cx="${46+i*83}" cy="${85+(i*17)%142}" r="${3+i%3}" fill="#8efce9" opacity=".4"/>`).join('')}</g>${used?'<path d="M170 102v103" stroke="#9bf6e5" stroke-width="6" class="scene-good"/>':''}`,
  neon: (used) => `<g class="scene-electric"><path d="M80 172 144 120 205 172" fill="none" stroke="#e691f5" stroke-width="4"/></g>${used?'<path d="M0 242h780" stroke="#7affec" stroke-width="5" class="scene-good"/>':''}`,
  red_horizon: (used) => `<g class="scene-rain">${Array.from({length:18},(_,i)=>`<path d="M${(i*58)%780} ${55+(i*23)%150}l45 10" stroke="#f1b393" stroke-width="3" opacity=".42"/>`).join('')}</g>${used?'<circle cx="175" cy="170" r="94" stroke="#afffc5" stroke-width="5" stroke-dasharray="12 8" fill="none" class="scene-good"/>':''}`,
  whiteout: (used) => `<g class="scene-snow">${Array.from({length:20},(_,i)=>`<circle cx="${i*42%780}" cy="${(i*37)%250}" r="${i%3+1}" fill="#f5ffff" opacity=".65"/>`).join('')}</g>${used?'<path d="M350 55v180" stroke="#b4ffee" stroke-width="4" class="scene-good"/>':''}`,
  ashfall: (used) => `<g class="scene-embers">${Array.from({length:17},(_,i)=>`<circle cx="${i*49%780}" cy="${i*29%230}" r="${i%3+2}" fill="#ffbe6f" opacity=".58"/>`).join('')}</g>${used?'<path d="M0 228h780" stroke="#9fffd4" stroke-width="4" class="scene-good"/>':''}`,
  carnival: (used) => `<g class="scene-rain">${Array.from({length:15},(_,i)=>`<path d="M${i*55} ${i*17%140}l-25 24" stroke="#c6e5ff" stroke-width="2" opacity=".35"/>`).join('')}</g>${used?'<circle cx="660" cy="80" r="50" fill="none" stroke="#9becc7" stroke-width="5" class="scene-good"/>':''}`,
  last_stop: (used) => `<g class="scene-motion"><path d="M15 207l80-3M25 231l95-3M110 249l60-3" stroke="#c6dae6" stroke-width="3" opacity=".55"/></g>${used ? '<g class="scene-good"><path d="M330 230l14-36 12 34 10-26 11 25M404 225l14-36 12 34 10-26 11 25" stroke="#f9b47c" fill="none" stroke-width="4"/><text x="545" y="90" font-size="14" fill="#baffce" font-family="monospace">BRAKES ENGAGED</text></g>' : ''}`,
};

/** Small in-scene indicators are different for each field decision. */
const interventionVisuals = {
  station: {coolant:['COOLANT FLOW','cool'],shuttle:['SHUTTLE ONLINE','power'],vent:['PLASMA VENTED','cool'],beacon:['RESCUE BEACON','power']},
  hollow: {lamps:['WARD LAMPS LIT','cool'],mirror:['MIRROR BROKEN','power'],circle:['CIRCLE REINFORCED','cool'],chant:['WARDEN ANSWERS','power']},
  outbreak: {seal:['DOOR REINFORCED','cool'],medkit:['RESEARCHER SAFE','power'],foam:['SEALING FOAM ACTIVE','cool'],airlift:['MEDEVAC RESPONDS','power']},
  casefile: {mirror:['CAMERA COPY SAVED','cool'],lock:['ARCHIVE LOCKED','power'],safehouse:['WITNESS PROTECTED','cool'],warrant:['WARRANT ISSUED','power']},
  dead_air: {filter:['JAMMER FILTERED','cool'],battery:['BATTERY POWER ON','power'],relay:['REPEATER ACTIVE','cool'],volunteers:['ROOFTOP NETWORK','power']},
  abyss: {oxygen:['OXYGEN DELIVERED','power'],silt:['TRENCH CLEARED','cool'],decompress:['PRESSURE BALANCED','cool'],tow:['BACKUP TETHER','power']},
  neon: {blind:['CAMERAS BLINDED','cool'],badge:['ACCESS SPOOFED','power'],dark:['ARCHIVE DARK','cool'],decoy:['DECOY ACTIVE','power']},
  red_horizon: {heater:['HEATERS ON','power'],scrubber:['CARBON REMOVED','cool'],antenna:['BEACON BOOSTED','cool'],reserve:['POWER RESERVED','power']},
  whiteout: {thermal:['HEATERS ONLINE','power'],shutters:['SHUTTERS DOWN','cool'],flares:['RUNWAY FLARES LIT','cool'],shelter:['CREW IN SHELTER','power']},
  ashfall: {tanker:['WATER DROP READY','cool'],masks:['PASSENGERS PROTECTED','power'],airdrop:['FIRE FRONT CONTAINED','cool'],escort:['CONVOY ESCORTED','power']},
  carnival: {trim:['TRIM FINS STABLE','cool'],crew:['PASSENGERS SECURED','power'],flaps:['FLAPS DEPLOYED','cool'],lights:['CABIN GUIDANCE LIT','power']},
  last_stop: {brake:['AIR BRAKES READY','cool'],clear:['PASSENGERS BRACED','power'],drag:['DRAG BRAKES ON','cool'],warn:['CARRIAGES ALERTED','power']},
};

function interventionStatus(room) {
  const state = interventionVisuals[room.mission]?.[room.fieldOps?.selected];
  if (!state) return '';
  const [label, variant] = state;
  const color = variant === 'cool' ? '#9ceecb' : '#ffd28c';
  return `<g class="scene-intervention"><rect x="516" y="204" width="251" height="43" rx="5" fill="#0b2024" opacity=".9" stroke="${color}" stroke-width="2"/>
    <circle cx="534" cy="225" r="6" fill="${color}" class="scene-signal-dot"/><text x="548" y="230" fill="${color}" font-family="monospace" font-size="14">${label}</text>
    ${variant === 'cool' ? '<path d="M483 242q-25 -18 -50 0" fill="none" stroke="#a5fbe2" stroke-width="4" class="scene-coolant"/>' : '<path d="M480 207l-11 21h13l-10 20" fill="none" stroke="#ffe5ae" stroke-width="4" class="scene-power"/>'}</g>`;
}

export function renderSceneEffects(room) {
  const used = Boolean(room.fieldOps?.selected);
  const full = room.worldWarning || room.crisisActive;
  return `<g class="scene-effects" aria-hidden="true">${effects[room.mission]?.(used) || ''}${interventionStatus(room)}${full ? '<rect x="6" y="6" width="768" height="248" rx="4" fill="none" stroke="#f58b91" stroke-width="7" stroke-dasharray="23 12" class="scene-risk"/>' : ''}</g>`;
}
