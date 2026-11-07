/** Presentation metadata. Actual commands and timings are authored server-side. */
export const MISSIONS = {
  station: {
    name: "STATION ZERO", tag: "SCI-FI / SPACE", sub: "Break into the mainframe. Survive the boarding party.",
    no: "01", danger: "HOSTILE FLEET APPROACHING", roleA: "MAINFRAME", roleB: "DEFENSE", art: "station",
    quote: "The station has 03:30 before orbit decay.",
  },
  hollow: {
    name: "THE HOLLOW HOUSE", tag: "SUPERNATURAL / HORROR", sub: "Break the curse. Keep the darkness outside.",
    no: "02", danger: "UNIDENTIFIED PRESENCE DETECTED", roleA: "RITUAL", roleB: "WARDING", art: "hollow",
    quote: "You hear footsteps. Nobody else is here.",
  },
  casefile: {
    name: "THE LAST ALIBI", tag: "NOIR / MURDER MYSTERY", sub: "Solve a murder before the evidence disappears.",
    no: "04", danger: "EVIDENCE TAMPERING IN PROGRESS", roleA: "INVESTIGATION", roleB: "PROTECTION", art: "casefile",
    quote: "Every alibi has a missing minute.",
  },
  dead_air: {
    name: "DEAD AIR", tag: "DISASTER / RADIO RESCUE", sub: "Restore the warning tower. Guide a flooded city to safety.",
    no: "05", danger: "EMERGENCY CHANNEL UNDER ATTACK", roleA: "BROADCAST", roleB: "SIGNAL DEFENSE", art: "dead_air",
    quote: "Hundreds of families have no other way to hear you.",
  },
  last_stop: {
    name: "LAST STOP", tag: "ACTION / RUNAWAY TRAIN", sub: "Reclaim the brakes before 180 passengers reach a broken bridge.",
    no: "06", danger: "RAVEN BRIDGE IS GONE", roleA: "TRAIN CONTROL", roleB: "DISPATCH", art: "last_stop",
    quote: "The bridge is gone. The train is not slowing down.",
  },
  outbreak: {
    name: "PATIENT ZERO", tag: "SURVIVAL / OUTBREAK", sub: "Create the antidote. Defend the last barricade.",
    no: "03", danger: "QUARANTINE PROTOCOL BREACHED", roleA: "RESEARCH", roleB: "DEFENSE", art: "outbreak",
    quote: "The containment door won't hold.",
  },
};


// New chapters follow the same selection and private-room protocol.
Object.assign(MISSIONS, {
  abyss: {
    name: 'ABYSS NINE', tag: 'OCEAN / DEEP-SEA RESCUE',
    sub: 'Find a trapped submarine and bring its crew back to daylight.',
    no: '07', danger: 'HULL PRESSURE RISING', roleA: 'RESCUE', roleB: 'HULL SUPPORT',
    art: 'abyss', quote: 'Three lives, 3,400 meters below the surface.',
  },
  neon: {
    name: 'NEON HEIST', tag: 'CYBERPUNK / INFILTRATION',
    sub: 'Recover hidden evidence before the security tower locks down.',
    no: '08', danger: 'ARCHIVE SECURITY ACTIVE', roleA: 'INFILTRATION', roleB: 'STEALTH',
    art: 'neon', quote: 'One stolen file could save a city.',
  },
  red_horizon: {
    name: 'RED HORIZON', tag: 'MARS / SURVIVAL',
    sub: 'Keep six settlers breathing through a planet-wide dust storm.',
    no: '09', danger: 'HABITAT OXYGEN FALLING', roleA: 'HABITAT', roleB: 'LIFE SUPPORT',
    art: 'red_horizon', quote: 'There is no backup planet.',
  },
});

// The three additional chapters use the existing campaign selection UI.
Object.assign(MISSIONS, {
  whiteout: {name:'WHITEOUT',tag:'SURVIVAL / POLAR BETRAYAL',sub:'Restore the station heat and uncover a diverted distress call.',no:'10',danger:'CREW EXPOSURE RISING',roleA:'SYSTEMS',roleB:'FIELD CREW',art:'whiteout',quote:'Seven researchers. One rescue call that never left.'},
  ashfall: {name:'ASHFALL',tag:'RESCUE / WILDFIRE',sub:'Save the school convoy and uncover who falsified the escape route.',no:'11',danger:'FIRE FRONT ADVANCING',roleA:'DISPATCH',roleB:'FIREFIGHTER',art:'ashfall',quote:'Someone sent the buses the wrong way.'},
  carnival: {name:'CARNIVAL 13',tag:'MYSTERY / FAIRGROUND RESCUE',sub:'Recover the missing generator and rescue every stranded rider.',no:'12',danger:'WHEEL BRAKES FAILING',roleA:'RIDE TECH',roleB:'SAFETY ENGINEER',art:'carnival',quote:'Eighteen riders. One stolen generator.'},
});

// Original genre stories: familiar adventure motifs, entirely new casts and plots.
Object.assign(MISSIONS, {
  mirrorfall: {name:'MIRRORFALL',tag:'PARALLEL REALITY / MYSTERY',sub:'Cross a gravity-inverted city and bring the missing families home.',no:'13',danger:'REFLECTION IS DESTABILIZING',roleA:'RESCUE',roleB:'REALITY ANCHOR',art:'mirrorfall',quote:'The missing town is directly beneath your feet.'},
  four_winds: {name:'FOUR WINDS',tag:'ELEMENTAL / FANTASY',sub:'Repair four elemental wards and expose the architect of the disaster.',no:'14',danger:'THE SKY CANALS ARE FALLING',roleA:'WARD ENGINEER',roleB:'SKYBRIDGE GUARD',art:'four_winds',quote:'The city can only survive if all four guardians return.'},
  dawnforge: {name:'DAWNFORGE',tag:'MYTHIC / QUEST',sub:'Enter a sunless labyrinth and free the first sunrise.',no:'15',danger:'THE SOLAR FORGE IS OVERHEATING',roleA:'PATHFINDER',roleB:'FORGE GUARD',art:'dawnforge',quote:'Someone chained morning under the mountain.'},
  glass_trials: {name:'THE GLASS TRIALS',tag:'TOURNAMENT / CONSPIRACY',sub:'Expose a rigged spectacle while rescuing its hidden finalists.',no:'16',danger:'THE ARENA FLOOR IS ARMED',roleA:'CONTROL TECH',roleB:'SAFETY OPERATOR',art:'glass_trials',quote:'The broadcast ended. The game has not.'},
  wildbond: {name:'WILDBOND',tag:'CREATURE / FOREST ADVENTURE',sub:'Rescue enchanted companions and restore a stolen forest heart.',no:'17',danger:'THE SANCTUARY HEART IS DYING',roleA:'CARETAKER',roleB:'GUARDIAN',art:'wildbond',quote:'The forest remembers who betrayed it.'},
  stardoor: {name:'THE LAST STARDOOR',tag:'STORYBOOK / PORTAL FANTASY',sub:'Reconnect six worlds and recover memories traded to a false king.',no:'18',danger:'SIX KINGDOMS ARE UNRAVELING',roleA:'REALM KEEPER',roleB:'PORTAL WARDEN',art:'stardoor',quote:'Every doorway leads to someone waiting to come home.'},
});

// Six more original asymmetric chapters, built for the same authoritative mission engine.
Object.assign(MISSIONS, {
  clockfall: {"name": "CLOCKFALL", "tag": "TIME LOOP / SCI-FI", "sub": "Save trapped commuters and stop the city repeating its last minute.", "no": "19", "danger": "TIME FRACTURE / REWIND IMMINENT", "roleA": "CHRONO ENGINEER", "roleB": "TIME GUARDIAN", "art": "clockfall", "quote": "A minute can last forever. Nobody should."},
  nightmarket: {"name": "THE DREAM MARKET", "tag": "DREAM / MYSTERY", "sub": "Free stolen dreams and wake the children of Nocturne.", "no": "20", "danger": "DREAM VAULT UNSTABLE", "roleA": "DREAM ARCHIVIST", "roleB": "LANTERN GUARD", "art": "nightmarket", "quote": "Never trade away a dream you cannot remember."},
  emberwing: {"name": "EMBERWING REFUGE", "tag": "DRAGONS / FANTASY", "sub": "Recover kidnapped dragon hatchlings from a floating fortress.", "no": "21", "danger": "NEST BRIDGES FAILING", "roleA": "DRAGON RANGER", "roleB": "ROOST WARDEN", "art": "emberwing", "quote": "The mountains were never theirs to take."},
  deepvault: {"name": "THE DROWNED ARCHIVE", "tag": "OCEAN / CONSPIRACY", "sub": "Rescue undersea librarians and recover the original historical record.", "no": "22", "danger": "LIBRARY DOME ABOUT TO FAIL", "roleA": "SALVAGE DIVER", "roleB": "PRESSURE OFFICER", "art": "deepvault", "quote": "The truth does not dissolve underwater."},
  aurora_arc: {"name": "AURORA ARC", "tag": "SPACE / AURORA", "sub": "Save the orbital habitats and free a living light imprisoned for power.", "no": "23", "danger": "AURORA RING FRACTURING", "roleA": "GRID SCIENTIST", "roleB": "ORBITAL GUARD", "art": "aurora_arc", "quote": "The stars are alive—and one is asking for help."},
  inkbound: {"name": "INKBOUND KINGDOM", "tag": "STORYBOOK / FAIRY TALE", "sub": "Restore erased citizens before the royal scribe destroys their ending.", "no": "24", "danger": "THE FINAL CHAPTER IS FADING", "roleA": "PAGEKEEPER", "roleB": "MARGIN GUARD", "art": "inkbound", "quote": "Every person deserves to write their own next page."},
});
