/** Direction for the nine miniature cinematic sequences.
 *
 * Frames correspond to the server's 5 + 6 irreversible story objectives.
 * Each step has a different focal prop and a short character exchange. The
 * renderer never decides that an objective has finished; only room snapshots do.
 */
export const STORYBOARDS = {
  station: {
    cast: 'COMMANDER ASHA',
    focus: ['console','signal','power','radio','shield','starship','map','door','shuttle','beacon','engine'],
    dialogue: [
      'Asha: The bay is sealed. I need that console.', 'Asha: I can hear them, but the call is scrambled.',
      'Pilot Ren: The ship has no power. Please hurry.', 'Asha: The rescue channel is finally ours.',
      'Ren: Enemy fire is striking the port side.', 'Asha: Read the navigation charts. We have one path.',
      'Ren: The airlock can open if the pressure holds.', 'Asha: The clamps are physically trapping us.',
      'Ren: Clearance received. Engines are arming.', 'Asha: Our beacon is lighting up the dark.',
      'Ren: Everyone is aboard. Take us home.',
    ],
  },
  hollow: {
    cast: 'MARA / THE INVESTIGATOR',
    focus: ['candle','book','sigil','ghost','shield','door','map','book','ghost','sigil','door'],
    dialogue: [
      'Mara: The hall is too dark to read the walls.', 'Mara: The diary knows why the family vanished.',
      'Theo: I found the sigil. Please do not let it fade.', 'Mara: The spirit has a name. That changes everything.',
      'Theo: The circle is cracking beneath our feet.', 'Mara: The cellar door has opened by itself.',
      'Theo: There is a passage behind the old portrait.', 'Mara: The words were a promise, not a curse.',
      'Theo: That woman in the mirror is crying.', 'Mara: We can release her. We have to finish.',
      'Theo: Dawn is coming. Open the gate!',
    ],
  },
  outbreak: {
    cast: 'DR. IMANI',
    focus: ['vial','dna','dna','scanner','vial','power','spinner','vial','scanner','filter','broadcast'],
    dialogue: [
      'Imani: One sample. That is all we have left.', 'Niko: The infection is changing faster than expected.',
      'Imani: I can read its genetic weakness now.', 'Niko: The cells are responding. Keep going.',
      'Imani: We have a candidate cure. We need power.', 'Niko: Backup lights are on. The door is still holding.',
      'Imani: Spin the serum. Separate what works.', 'Niko: The neutralizer is binding to the pathogen.',
      'Imani: Check that dose. Lives depend on it.', 'Niko: The air filters are ready to distribute it.',
      'Imani: Release it. Open the vents.',
    ],
  },
  casefile: {
    cast: 'DETECTIVE HALE',
    focus: ['camera','clock','lock','key','archive','witness','ledger','phone','signature','evidence','archive'],
    dialogue: [
      'Hale: The camera is all we have from midnight.', 'Porter Dean: I remember the time. The clock stopped.',
      'Hale: The lock was not forced. Someone had a key.', 'Dean: The master key was missing for an hour.',
      'Hale: Deleted messages. Someone is frightened.', 'Dean: I saw the curator coming down the stairs.',
      'Hale: Follow the money, not the gossip.', 'Hale: The last call mentions a forged painting.',
      'Dean: That signature belongs to the curator.', 'Hale: Now we can make a case that will stand.',
      'Hale: Preserve the originals. The truth survives.',
    ],
  },
  dead_air: {
    cast: 'JUNE / EMERGENCY DISPATCH',
    focus: ['radio','power','map','flood','frequency','broadcast','antenna','shelter','route','relay','broadcast'],
    dialogue: [
      'June: This is Tower Nine. Can anybody hear me?', 'Eli: The batteries are our only remaining power.',
      'June: The rescue map is missing half the city.', 'Eli: The south underpass is already underwater.',
      'June: The channel is full of fake warnings. Clear it.', 'June: The official message has been approved.',
      'Eli: Aim the antenna toward the occupied rooftops.', 'Voice: We have children at Bellwether shelter.',
      'June: We need a route that avoids the current.', 'Eli: The mountain relay can reach the west bank.',
      'Voice: We hear you. Please tell us where to go.',
    ],
  },
  last_stop: {
    cast: 'CONDUCTOR LENA',
    focus: ['scanner','signal','passengers','power','lock','brakes','passengers','map','throttle','brakes','train'],
    dialogue: [
      'Lena: Driver, our brakes are not responding.', 'Dispatcher Reyes: Someone is issuing fake signals.',
      'Lena: There are 180 people on this train.', 'Reyes: The backup motor is responding.',
      'Lena: The manual brake handle is locked.', 'Reyes: Build pressure. We have a chance.',
      'Lena: Everyone down, hold onto your seats!', 'Reyes: That grade is steeper than we thought.',
      'Lena: Cut the throttle. The bridge is visible.', 'Reyes: The brakes are biting. Hold steady!',
      'Lena: We have to stop. Right now.',
    ],
  },
  abyss: {
    cast: 'CAPTAIN SOL',
    focus: ['sonar','sonar','light','crew','tether','ballast','winch','pressure','map','submarine','surface'],
    dialogue: [
      'Sol: Pelican Nine, answer if you can.', 'Mara: Three figures. They are moving.',
      'Sol: Turn on every floodlight we have.', 'Survivor: There are three of us. Please hurry.',
      'Mara: The cable is connected. Do not let it snap.', 'Survivor: The floor is moving beneath us!',
      'Sol: Raise the winch slowly. Watch the strain.', 'Mara: The cabin pressure is holding.',
      'Sol: Rocks are falling. Find another lane.', 'Survivor: There is light above us.',
      'Sol: Recovery ship, prepare to receive survivors.',
    ],
  },
  neon: {
    cast: 'IRIS / WHISTLEBLOWER',
    focus: ['camera','camera','door','lock','archive','decrypt','archive','antenna','broadcast','signal','broadcast'],
    dialogue: [
      'Iris: The truth is on the thirty-second floor.', 'Vex: Looping the camera. You are invisible.',
      'Iris: Maintenance hatch ahead. No guards.', 'Vex: The vault is starting to unlock.',
      'Iris: I see the originals. They never destroyed them.', 'Vex: The reports confirm everything you said.',
      'Iris: Make copies. They will erase this place.', 'Vex: The rooftop uplink is above their firewall.',
      'Reporter Ellis: Send the first packet. We are ready.', 'Vex: The trackers cannot find us now.',
      'Iris: Publish it. Let the city decide.',
    ],
  },
  red_horizon: {
    cast: 'DR. NOOR',
    focus: ['oxygen','pump','solar','greenhouse','map','battery','solar','oxygen','shuttle','antenna','landing'],
    dialogue: [
      'Noor: Six people. Less air every minute.', 'Jo: The pumps are catching. I can breathe.',
      'Noor: Find the solar array beneath the storm.', 'Jo: A new leaf. The greenhouse is warming.',
      'Pilot Tamsin: I have you on the orbital map.', 'Noor: We are running on the final battery.',
      'Jo: The panels are producing power again.', 'Noor: The oxygen recycler is finally stable.',
      'Tamsin: Guide me between the dust ridges.', 'Noor: Your signal is clear. Keep descending.',
      'Tamsin: Touchdown. Bring everyone home.',
    ],
  },
};

export function currentShot(room, step) {
  const script = STORYBOARDS[room.mission] || STORYBOARDS.station;
  const frame = Math.max(0, Math.min(10, Number(step) || 0));
  return { index: frame, focus: script.focus[frame],
    cast: script.cast, dialogue: script.dialogue[frame] };
}

// Direction and dialogue are used exclusively inside the in-game story panel.
Object.assign(STORYBOARDS, {
  whiteout:{cast:'MIKA / POLAR TECHNICIAN',focus:['battery','sonar','radio','decrypt','files','map','sonar','antenna','map','door','vehicle'], dialogue:[
    'Mika: The heaters are dying. Soren says help is coming.',
    'Ivo: The generator cable was cut from inside.',
    'Mika: The radar found an aircraft. Verify its pilot before you trust it.',
    'Ivo: Wait. This radio log has been edited.',
    'Mika: Our call sign was replaced by a cargo code.',
    'Ivo: That aircraft belongs to the director.',
    'Soren: You do not understand what is in that cargo.',
    'Mika: He locked the mast. We can still reach it.',
    'Ivo: The beacon is pointing at the ice runway.',
    'Pilot: Your real coordinates are in. We see you.',
    'Mika: The crew is aboard. Leave the cargo behind.']},
  ashfall:{cast:'RAE / RESCUE COORDINATOR',focus:['scanner','sonar','map','map','radio','files','map','door','radio','vehicle','vehicle'], dialogue:[
    'Rae: The school buses are inside the smoke.',
    'Finn: The lookout confirms the pass is burning.',
    'Rae: All three buses are accounted for. Get them moving.',
    'Finn: This official map does not match the live fire line.',
    'Rae: The mountain tunnel is blocked. The map is false.',
    'Finn: That call proves the official order was changed. Expose the forgery.',
    'Finn: The old quarry road is still open. Plot the bypass.',
    'Rae: Open the emergency gate for the quarry bypass.',
    'Bus Driver: The leading bus has your directions.',
    'Finn: The roadblock is burning. Clear it for the convoy.',
    'Rae: Last bus is out. Nobody gets left behind.']},
  carnival:{cast:'KIT / RIDE TECHNICIAN',focus:['scanner','power','console','key','radio','files','lock','brakes','vehicle','door','vehicle'],dialogue:[
    'Kit: Eighteen people are still in those cabins.',
    'Ana: The backup lights are coming on.',
    'Kit: The operator booth is locked from inside.',
    'Ana: Somebody took the generator key.',
    'Kit: I found a recording of Manager Wren.',
    'Ana: He stole the generator. He blamed you.',
    'Kit: The manual controller is responding.',
    'Ana: The wheel brakes are holding. Keep typing.',
    'Rider: The wheel has stopped shaking. Please lower us safely.',
    'Ana: The first family is down. Secure the platform for the others.',
    'Kit: One cabin left. Lower it gently; nobody gets left behind.'
  ]},
});

Object.assign(STORYBOARDS, {
  mirrorfall:{cast:'TALIA / RESCUE ENGINEER',focus:['map','signal','decrypt','door','portal','crew','archive','gravity','route','power','door'], dialogue:[
    'Talia: That entire street is missing from the map.','Nia: The signal is coming from under the cinema.','Child: We are at the school. Everything is above us.','Talia: I have the lift. Prepare for a gravity shift.','Nia: We crossed. The whole town is upside down!','Talia: I can see the school bus. Search for survivors inside.','Nia: The director built this place. He lied to us.','Talia: Stabilize the anchors so the children can walk.','Child: We are on the lift! Please do not close it.','Nia: The false city is disappearing. Keep moving.','Talia: All families clear. Shut the breach behind us.'
  ]},
  four_winds:{cast:'NERI / WARD ENGINEER',focus:['map','sonar','gate','earth','tower','decrypt','fire','air','water','guardian','rain'],dialogue:[
    'Neri: Dry canals and burning streets. This is no drought.','Guardian: Water is trapped beneath the frozen sluice.','Neri: Release the sluice gently. People live below.','Keeper Tal: The stone walkways are holding again.','Neri: The tower ward sockets have been severed.','Tal: These orders came from the weatherkeeper.','Neri: Move the flames into the empty stone channel.','Tal: The wind turbines are moving the smoke away.','Neri: The skybridges have water again!','Tal: Four guardian signals. Bring them together.','Neri: Open the rain gates. Let the city breathe.'
  ]},
  dawnforge:{cast:'IONA / TEMPLE PATHFINDER',focus:['door','book','candle','lock','solar','book','chain','gear','shield','contract','sunrise'],dialogue:[
    'Iona: Seven mornings without light. The gate is here.','Orin: This tablet says the sun was chained, not lost.','Iona: Light the lamps. Watch the stone guardians.','Orin: The bronze maze is moving. Follow the gears.','Iona: There is a sun inside that furnace.','Orin: The oracle changed the prophecy herself.','Iona: Break the chain before the embers scatter.','Orin: Align the gears toward the mountain shutters.','Iona: Protect the dawn ember from the sentinels.','Orin: The forge contract is exposed. Break the pact before it reignites.','Iona: Open the shutters. Give the valley its morning.'
  ]},
  glass_trials:{cast:'REMY / ARENA TECHNICIAN',focus:['scanner','decrypt','camera','lock','console','archive','signature','gate','broadcast','route','power'],dialogue:[
    'Remy: The scoreboard says the show is over. It is not.','Medic Sol: These sponsor orders are still live.','Remy: Twelve finalists are trapped below the stage.','Sol: Lock that floor. Someone is standing on it.','Remy: I have the producer’s private studio.','Sol: That order would have killed the finalists.','Remy: The producer signed it himself.','Sol: All gates must open together.','Remy: Put the private orders on every screen.','Sol: The last group is crossing the medical tunnel.','Remy: Cut the show. Everyone is out.'
  ]},
  wildbond:{cast:'PIP / SANCTUARY CARETAKER',focus:['map','footprints','door','creature','tree','ledger','cage','water','nest','seed','guardian'],dialogue:[
    'Pip: The creatures are gone. Those are collector tracks.','Skyfox: The nursery is this way. Follow the light.','Pip: Someone locked these frightened animals inside.','Guardian Mae: The wounded skyfox can guide us.','Pip: Someone took the seeds from the heart tree.','Mae: The ranger sold them. Here is the ledger.','Pip: Open the cages. Bring every creature home.','Mae: The roots are taking water again.','Pip: Keep the collector drones away from that nest.','Mae: The stolen seeds are blooming.','Pip: Guardian, wake. Your forest is safe.'
  ]},
  stardoor:{cast:'ELIA / STARDOOR KEEPER',focus:['map','portal','key','door','clock','decrypt','book','memory','bridge','power','door'],dialogue:[
    'Elia: The star map is broken. People are stranded.','Bram: The glass forest door is open.','Elia: Bring back the key without harming the trees.','Bram: The cloud kingdom is drifting away. Hurry.','Elia: The monarch keeps memories inside his clocks.','Elia: The monarch sealed stolen memories inside these books. Decode one.','Elia: Bram, your signature is on this bargain. Tell me the truth.','Bram: I traded their memories for our home. I was wrong. I will help.','Bram: The memories are free. Help me bring the six bridges back.','Elia: The bridges are linked. The monarch’s final lie must end.','Bram: The monarch’s bargain is broken. Close the last dark door.'
  ]},
});

Object.assign(STORYBOARDS, {
  "clockfall": {
    "cast": "NERA / CLOCK ENGINEER",
    "focus": [
      "clock",
      "map",
      "signal",
      "memory",
      "door",
      "passengers",
      "files",
      "power",
      "clock",
      "train",
      "clock"
    ],
    "dialogue": [
      "Nera: The minute keeps repeating. Listen to what changes.",
      "Ivo: The tram route ends at the same broken rail, every time.",
      "Nera: The tower is transmitting the reset signal.",
      "Ivo: One passenger remembers yesterday. Preserve the memory.",
      "Nera: The service gate is stable. Everyone behind me.",
      "Conductor: The passengers are alive! We need a safe route.",
      "Nera: Those test orders are signed by the transit AI.",
      "Ivo: The rewind beacon is dark. The clock is finally ours.",
      "Conductor: Synchronize the crossings. The train is moving.",
      "Nera: Last carriage out. Close the platform behind us.",
      "Ivo: Midnight. At last, the clock is moving forward."
    ]
  },
  "nightmarket": {
    "cast": "SOL / DREAM ARCHIVIST",
    "focus": [
      "light",
      "vial",
      "files",
      "memory",
      "door",
      "light",
      "files",
      "vial",
      "clock",
      "map",
      "door"
    ],
    "dialogue": [
      "Sol: Follow the lanterns, but keep hold of my sleeve.",
      "Mina: Those empty bottles are whispering our names.",
      "Sol: The ledger records children, not merchandise.",
      "Mina: These are the names the dreamers forgot.",
      "Sol: The vault opens. Do not break a single bottle.",
      "Child: I remember my mother. I remember where I live.",
      "Sol: Veya signed the bargain herself. Everyone was deceived.",
      "Mina: Their dreams are returning. Listen—they're waking.",
      "Sol: Stop that midnight bell. It's holding the sky shut.",
      "Mina: Take the lantern bridge. The dawn is waiting.",
      "Child: The market is gone, and we can go home."
    ]
  },
  "emberwing": {
    "cast": "KAEL / DRAGON RANGER",
    "focus": [
      "map",
      "radar",
      "door",
      "files",
      "map",
      "creature",
      "files",
      "power",
      "bridge",
      "creature",
      "beacon"
    ],
    "dialogue": [
      "Kael: Every empty nest points toward the same mountain.",
      "Eira: Those wingbeats were forced away from the refuge.",
      "Kael: The eastern roost is safe. Bring the hatchlings in.",
      "Eira: A military flight log. The skyguard did this.",
      "Kael: The ash bridge is open; keep the wind from shifting.",
      "Hatchling Keeper: The cages are open. They're terrified.",
      "Eira: The commander's seal is on the egg furnace order.",
      "Kael: Cut the furnace feed. The eggs must survive.",
      "Eira: The wind bridges hold. Bring them back carefully.",
      "Kael: The oldest dragon is circling. Follow her home.",
      "Eira: The refuge beacon is lit. Every wing is counted."
    ]
  },
  "deepvault": {
    "cast": "MIRA / ARCHIVE DIVER",
    "focus": [
      "sonar",
      "pressure",
      "memory",
      "door",
      "oxygen",
      "radio",
      "files",
      "pump",
      "memory",
      "door",
      "broadcast"
    ],
    "dialogue": [
      "Mira: Scan the library. That water wasn't here yesterday.",
      "Sef: The leak is inside the wall. Someone opened the gate.",
      "Mira: The original cylinder still contains the tunnel survey.",
      "Sef: The index room has air. Do not let it flood.",
      "Mira: Suit pressure equalized. The rescue divers can enter.",
      "Archivist: We're alive behind the reading-room door.",
      "Mira: The governor ordered the records changed. I have proof.",
      "Sef: Backup pumps online. The floodline is dropping.",
      "Mira: Carry the original, not the copied file.",
      "Sef: All divers to the ascent lock. Hold the pressure.",
      "Archivist: The public can see what happened. We're safe."
    ]
  },
  "aurora_arc": {
    "cast": "ADA / ORBITAL PILOT",
    "focus": [
      "map",
      "signal",
      "power",
      "files",
      "bridge",
      "signal",
      "files",
      "power",
      "shuttle",
      "light",
      "solar"
    ],
    "dialogue": [
      "Ada: The aurora is twisting around the broken sky ring.",
      "Iven: This pulse has a heartbeat. The light is alive.",
      "Ada: Habitat power first. Families still need oxygen.",
      "Iven: These mining orders explain the missing energy.",
      "Ada: Bridge locked. We can cross into the core.",
      "Iven: It heard us. We can bring it out alive.",
      "Ada: The council signed the extraction order.",
      "Iven: Vent the coils before the creature breaks free.",
      "Ada: Supply ships, follow my beacon past the storm.",
      "Iven: The field is open. Look at the stars change.",
      "Ada: Free orbit confirmed. The colony is safe."
    ]
  },
  "inkbound": {
    "cast": "JUN / PAGEKEEPER",
    "focus": [
      "book",
      "map",
      "files",
      "door",
      "files",
      "book",
      "files",
      "lock",
      "book",
      "door",
      "book"
    ],
    "dialogue": [
      "Jun: The village ledger ends where the houses vanished.",
      "Fenn: Ink footprints lead into the abandoned paper castle.",
      "Jun: One name survived. We can bring this person back.",
      "Fenn: The castle gate opens. Keep the pages dry.",
      "Jun: The royal decree ordered their names erased.",
      "Fenn: The villagers are remembering their lives.",
      "Jun: The succession page proves who stole the throne.",
      "Fenn: Seal that quill. Stop the scribe before they vanish.",
      "Jun: Each recovered page belongs to a real person.",
      "Fenn: Bring everyone through the story's last doorway.",
      "Jun: No one writes another's ending. The book is theirs."
    ]
  }
});
