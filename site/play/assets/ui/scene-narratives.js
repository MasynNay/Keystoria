/** Authored story developments, one for each confirmed mission milestone. */
export const SCENE_BEATS = {
  last_stop: [
    ['NO BRAKES. NO SECOND CHANCE.', 'Train 718 is accelerating toward Raven Bridge. The crossing has collapsed, and 180 people are still aboard.'],
    ['DIAGNOSTICS RESTORED', 'You can finally see why the emergency brakes are ignoring the cab. The sabotage is inside the control network.'],
    ['THE ATTACKER LOSES ACCESS', 'The compromised data link goes dark. The dispatcher now has a chance to block new commands.'],
    ['180 PEOPLE COUNTING ON YOU', 'The rear conductor answers. The passengers are accounted for, but they still have no way off the train.'],
    ['BACKUP SYSTEMS ANSWER', 'A maintenance console flickers to life. The train can accept manual commands again.'],
    ['THE MANUAL RELEASE IS OPEN', 'The controls have been unlocked. You now have to work together to put real braking force on the wheels.'],
    ['EMERGENCY BRAKES ARMED', 'The cab takes your override. You have one chance to slow the carriages without derailing them.'],
    ['PASSENGERS BRACED', 'The conductor calls out from the back. Families sit low and hold on as the train shudders.'],
    ['THE DESCENT IS STEEP', 'The grade is worse than expected. The dispatcher must keep the line clear during the final stop.'],
    ['THE FALSE THROTTLE IS GONE', 'The rogue controller loses its grip. For the first time, the engineer has the train back.'],
    ['THE WHEELS FINALLY BITE', 'Steel shrieks against steel. The broken crossing is visible through the windshield.'],
    ['TRAIN 718 STOPS SHORT', 'The braking sequence completes. The train shudders to a halt before the shattered bridge and all 180 passengers remain aboard.'],
  ],
  station: [
    ['EMERGENCY EVACUATION', 'The docking bay is sealed. Hostiles are approaching, and your crew has no safe way off the station.'],
    ['MAINTENANCE ACCESS OPEN', 'The first security barrier drops. You can reach the ship systems through the maintenance network.'],
    ['A VOICE THROUGH STATIC', 'The scrambled distress channel is coming into focus. Rescue ships may finally hear you.'],
    ['POWER RETURNS', 'Emergency lighting comes up in the hangar. The escape craft is receiving electricity again.'],
    ['LONG-RANGE UPLINK RESTORED', 'The station can reach rescue ships again; the crew still needs protection to reach the bay.'],
    ['SHIELDS AROUND THE HANGAR', 'The defensive barrier holds incoming fire away from the evacuation controls.'],
    ['NAVIGATION MAP RECOVERED', 'The route guidance returns. The crew can identify a corridor clear of debris.'],
    ['THE AIRLOCK OPENS', 'The pressure seal releases and the crew can reach the waiting escape craft.'],
    ['DOCKING CLAMPS RELEASED', 'The mechanical arms retract from the hull. The escape craft can finally move.'],
    ['ESCAPE AUTHORIZED', 'The evacuation controller clears departure. The crew boards the ship while the shields still hold.'],
    ['RESCUE BEACON ACTIVE', 'A verified distress beacon crosses the blackout; nearby ships can finally find your position.'],
    ['LAUNCH SEQUENCE CONFIRMED', 'The launch checks commit. The escape craft accelerates into the rescue corridor.'],
  ],
  hollow: [
    ['THE HOUSE HAS LOCKED YOU IN', 'The front door is bolted from the outside. Something moves behind the walls.'],
    ['LIGHT AGAINST THE DARK', 'The candles ignite. You can finally make out symbols cut into the floor.'],
    ['A FAMILY SECRET', 'The diary describes a ritual that the previous residents never finished.'],
    ['THE PROTECTIVE MARK', 'You trace the first sigil. Footsteps stop just beyond the threshold.'],
    ['SOMEONE ANSWERS', 'The name you found is spoken aloud, and the old house seems to draw a breath.'],
    ['THE CIRCLE IS WHOLE', 'The restored ward holds the apparition back. The route below the house opens.'],
    ['THE CELLAR UNLOCKS', 'An iron bolt slides into the wall. The final part of the ritual lies below.'],
    ['A PASSAGE IN THE WALL', 'A hidden route opens behind the rotting shelves. You hear running water ahead.'],
    ['WORDS FROM ANOTHER AGE', 'The old incantation echoes through the cellar. The house begins to resist.'],
    ['THE TRAPPED SOUL IS FREE', 'A figure dissolves into a shower of light. The house becomes strangely quiet.'],
    ['THE CURSE BREAKS', 'The air warms. The last seals on the front gate finally turn.'],
    ['THE GATE STANDS OPEN', 'You can see the road outside. The night is not over, but escape is possible.'],
  ],
  outbreak: [
    ['THE BARRICADE IS FAILING', 'The quarantine door is splintering. A researcher is missing and the antidote is incomplete.'],
    ['SAMPLE ISOLATED', 'A clean sample is locked into the containment cabinet. Your lab has something reliable to work with.'],
    ['THE PATHOGEN REVEALED', 'The scanner identifies the infectious agent and begins mapping its structure.'],
    ['GENOME ASSEMBLED', 'The missing sequence is recovered. The lab can now search for a neutralising target.'],
    ['A WEAK POINT FOUND', 'The infection analysis identifies a possible treatment pathway.'],
    ['ANTIDOTE READY FOR TESTING', 'The first neutraliser is prepared. The survivors can hear the pounding at the door.'],
    ['EMERGENCY POWER ONLINE', 'The lab lights stabilise. The remaining machines come back to life.'],
    ['THE CENTRIFUGE SPINS', 'The sample separates into a usable fraction. You are closer to a working treatment.'],
    ['THE AGENT IS MIXED', 'Two reagents combine. The fluid changes colour as the reaction starts.'],
    ['DOSE CONFIRMED', 'The monitor reports a viable test dosage. There is no more room for guessing.'],
    ['THE AIRFLOW IS CLEAN', 'The ventilation system pushes contaminated air away from the survivors.'],
    ['THE CURE REACHES THE WARDS', 'The dispersal valves open and the finished antidote enters the isolation wards. The first patients stabilize.'],
  ],
  casefile: [
    ['SOMEONE IS ERASING THE RECORD', 'Elian Voss is dead. The hotel surveillance archive has been altered, and the killer believes the trail is gone.'],
    ['THE LAST CAMERA FRAME', 'An unexpected figure appears in the corridor just before the power cut.'],
    ['THE TIMELINE DOES NOT MATCH', 'Two witness statements place the same person in different rooms. Someone is lying.'],
    ['A LOCK WITH TWO KEYS', 'The archive door opened after midnight using an access card that should have been disabled.'],
    ['THE SECOND SET OF RECORDS', 'The key-card ledger reveals a gap in the official guest list.'],
    ['MESSAGES THAT WERE DELETED', 'Recovered notes suggest a meeting was arranged in the victim’s final hour.'],
    ['THE NIGHT PORTER SPEAKS', 'The porter remembers a detail that contradicts the published timeline.'],
    ['FOLLOW THE MONEY', 'A payment appears under an alias connected to the victim.'],
    ['ONE FINAL PHONE CALL', 'The last call connects two otherwise unrelated people in the case.'],
    ['THE SIGNATURE IS FORGED', 'The pen pressure and timestamp do not match the witness’s account.'],
    ['THE EVIDENCE FITS', 'The caseboard now connects motive, opportunity and the attempted cover-up.'],
    ['ORIGINAL EVIDENCE SECURED', 'The unaltered documents enter protective custody. The case can stand without relying on a single witness.'],
  ],
  dead_air: [
    ['THE CITY CANNOT HEAR YOU', 'Floodwater rises around Bellwether. Emergency phones are silent and a hostile signal dominates the airwaves.'],
    ['THE TRANSMITTER STILL LIVES', 'The tower is damaged but can carry a message if you restore a clean frequency.'],
    ['BATTERY BACKUP ONLINE', 'The radio station switches to emergency power as the city grid flickers out.'],
    ['THE STREETS ARE MAPPED', 'Flooded roads and open routes appear on your map. Rescuers finally have useful information.'],
    ['FLOODED STREETS IDENTIFIED', 'Unsafe underpasses and washed-out crossings are flagged. A safe route still needs verification.'],
    ['THE CHANNEL IS YOURS', 'The emergency frequency is established. You must keep the jammer from taking it back.'],
    ['THE WARNING IS AUTHORISED', 'Evacuation orders are ready for broadcast to the trapped neighbourhoods.'],
    ['THE ANTENNA TURNS', 'The mast aligns toward the most isolated rooftops. A signal starts to cross the rain.'],
    ['SHELTERS ARE LISTENING', 'The volunteer network picks up the test message. You know someone is there.'],
    ['EVACUATION ROUTE VERIFIED', 'The route avoids the washed-out bridges. Sending it now could save the district.'],
    ['THE RELAY ANSWERS', 'The mountain repeater returns your signal with far less distortion.'],
    ['THE CITY HEARS THE ROUTE', 'The repeater carries the verified evacuation route to trapped rooftop families and responding rescue boats.'],
  ],
};


Object.assign(SCENE_BEATS, {
  abyss: [
    ['THE SIGNAL BELOW', 'A weak emergency pulse rises from the trench. Three researchers may still be alive inside Pelican Nine.'],
    ['A GHOST IN THE SONAR', 'A small blip answers the rescue call beneath the wreckage. You have a location.'],
    ['THREE LIFE SIGNS', 'The sonar resolves three moving figures in a compartment beneath the sea floor.'],
    ['A LIGHT IN THE DARK', 'The rescue floodlights break through black water. A hand waves from the porthole.'],
    ['THE CREW ANSWERS', 'All three researchers respond through the emergency circuit. No one will be left behind.'],
    ['THE CABLE CONNECTS', 'A steel tether locks onto the submersible, pulling against the immense water pressure.'],
    ['THE BALLAST RELEASES', 'Pelican Nine lifts free of the collapsed platform. The crew feels the first upward motion.'],
    ['THE WINCH TAKES HOLD', 'The recovery ship begins hauling the submersible toward open water.'],
    ['PRESSURE EQUALIZED', 'The cabin no longer groans with every meter. The survivors have a chance.'],
    ['THE ASCENT LANE CLEARS', 'Sonar finds a path around a falling wall of rocks. The cable stays clear.'],
    ['A SHADOW UNDER THE SUN', 'The vessel rises toward a faint circle of daylight. The rescue ship moves into position.'],
    ['BACK IN THE SUN', 'Pelican Nine breaks the surface. Three survivors are carried to safety.'],
  ],
  neon: [
    ['THE WHISTLEBLOWER', 'Iris has delivered a key to Aurora Industries. Her message: the water reports must reach the public.'],
    ['SECURITY GRID FOUND', 'The tower camera network appears on your wrist display. There is only one blind corridor.'],
    ['AN EMPTY HALLWAY', 'The west camera loops a quiet corridor while your crew moves beneath it.'],
    ['BEHIND THE WALL', 'A maintenance hatch slides open onto the archive access tunnel.'],
    ['THE VAULT BREATHES', 'Security locks disengage. The evidence chamber becomes visible through the glass.'],
    ['THE ORIGINAL REPORTS', 'A hidden drive holds the laboratory measurements the company destroyed elsewhere.'],
    ['THE WATER IS POISONED', 'The recovered test results show contamination far above the published figures.'],
    ['NO MORE ERASING', 'Authenticated copies of the original reports spread across redundant storage.'],
    ['THE ROOFTOP LINK', 'An antenna rises above the city grid, outside corporate control.'],
    ['REPORTERS ONLINE', 'The newsroom confirms receipt of the first batch of documents.'],
    ['SECURITY LOSES THE TRAIL', 'The tower tracking signal fades as the last documents leave the archive.'],
    ['THE CITY FINDS OUT', 'The completed archive becomes public. Phones glow across the city as the evidence reaches independent reporters.'],
  ],
  red_horizon: [
    ['SIX PEOPLE, NO SUN', 'The storm has buried Ares Colony. Every passing minute uses oxygen the settlers cannot replace.'],
    ['THE AIR IS RUNNING OUT', 'The habitat monitor shows six life signs and falling oxygen pressure.'],
    ['THE FIRST BREATH', 'The backup pump shudders awake. The colony air begins to circulate again.'],
    ['THE PANELS ARE BURIED', 'A locator finds the solar array beneath a wall of red dust.'],
    ['ONE GREEN LEAF', 'The greenhouse warms. A tiny seedling unfolds for the first time since the storm.'],
    ['A SHIP IN THE CLOUDS', 'The orbital rescue shuttle confirms the colony location.'],
    ['THE RESERVE RETURNS', 'The emergency battery bank lights up the habitat corridor.'],
    ['POWER THROUGH THE DUST', 'The recovered solar grid begins supplying the colony again.'],
    ['BREATHING ROOM', 'The air recycler stabilizes. Six people remove their emergency masks.'],
    ['FOLLOW THE LIGHTS', 'A safe approach path appears on the shuttle cockpit display.'],
    ['DOCKING ARRAY ALIGNED', 'The colony antenna cuts a clear guidance beam through the storm.'],
    ['THE LAST GREEN LEAF', 'All six settlers board the rescue shuttle. A single greenhouse light stays on below.'],
  ],
});

Object.assign(SCENE_BEATS, {
  whiteout: [
    ['A STATION IN THE DARK','Seven researchers are trapped in an Antarctic whiteout. The rescue radio is silent while the crew loses heat.'],
    ['THE SHELTER WARMS','Emergency heaters resume and the crew can work without freezing at their consoles.'],
    ['A RESCUE BLIP ON RADAR','Weather radar locates an aircraft, but the storm obscures whether its reported approach is genuine.'],
    ['THE PILOT ANSWERS','A pilot makes direct radio contact, contradicting the director’s repeating recorded report.'],
    ['THE COORDINATES DO NOT MATCH','The decoded landing location points away from the occupied research station.'],
    ['A FLIGHT RECORDER WITH EDITED LOGS','The flight recorder shows a route change authorized after the crew requested rescue.'],
    ['THE FALSE FLIGHT PLAN EXPOSED','Director Soren diverted the rescue channel to prioritize private cargo instead of the stranded crew.'],
    ['THE SECOND CREW IS FOUND','A stranded rescue team answers the new triangulation beacon, providing the only safe route over the ice ridge.'],
    ['THE EMERGENCY BEACON RETURNS','The repaired mast sends the station’s authentic coordinates through the whiteout.'],
    ['THE SECOND HELICOPTER APPROACHES','A rescue pilot follows the corrected route through the ridge and reports the station in sight.'],
    ['THE SHELTER OPENS SAFELY','The exterior doors open only after the rescuers confirm a safe landing beyond the windbreak.'],
    ['SEVEN SURVIVORS','All seven researchers board the rescue helicopter as the station disappears into the snow.'],
  ],
  ashfall: [
    ['THE ROAD IS BURNING','A wildfire surrounds three school buses. Dispatch directs them toward a mountain tunnel already threatened by flames.'],
    ['THE LOOKOUT GOES LIVE','The mountain lookout confirms the wildfire is moving across the evacuation corridor.'],
    ['THREE BUSES LOCATED','The emergency radio finds all three school buses in the smoke. They are trapped but still moving.'],
    ['THE OFFICIAL MAP IS LOADED','The public route map conflicts with the moving fire line. The team begins checking its accuracy.'],
    ['THE TUNNEL IS BLOCKED','A lookout confirms the mountain tunnel is burning, despite its safe status on the official map.'],
    ['THE CHIEF’S SECRET CALL','A private radio call reveals a deliberate priority change that placed the buses behind private transport.'],
    ['THE FALSE ORDER EXPOSED','The forged evacuation order is withdrawn and all three drivers are warned not to take the tunnel.'],
    ['THE QUARRY BYPASS IS FOUND','The team traces an old quarry route that avoids the burning tunnel and the advancing fire front.'],
    ['THE EMERGENCY ROAD GATE OPENS','The quarry access gate lifts. The first bus now has a physical path to safety.'],
    ['THE LEADING BUS FOLLOWS THE ROUTE','The first driver receives turn-by-turn radio guidance through the smoke.'],
    ['THE ROADBLOCK IS CLEARED','The rescue crew removes burning timber and opens the final stretch for the entire convoy.'],
    ['THE CONVOY REACHES THE VALLEY','All three buses and their passengers are accounted for. The preserved dispatch logs expose the falsified route.'],
  ],
  carnival: [
    ['EIGHTEEN PEOPLE IN THE AIR','A seaside Ferris wheel stops high above the pier. Its brakes are beginning to slip.'],
    ['FIND THE CABINS','The emergency scanner locates riders stranded across the wheel.'],
    ['LIGHTS ON THE PIER','The backup lights return; the highest cabin signals with a phone flashlight.'],
    ['A LOCKED BOOTH','The ride controls are locked remotely and the manager will not answer.'],
    ['THE MISSING KEY','The generator key was taken from the technician shortly before closing.'],
    ["THE MANAGER'S VOICE",'A recovered recording proves that Manager Wren diverted the emergency generator.'],
    ['THE GENERATOR IS GONE','The theft is confirmed. The rescue crew must work with the manual controls.'],
    ['CONTROL RETURNS','The manual handwheel responds and the Ferris wheel starts turning slowly.'],
    ['THE BRAKES HOLD','The crew secures the failing brake piston. The cabins no longer swing violently.'],
    ['FIRST CABIN DOWN','The first stranded family steps onto the pier. The crew rotates the remaining cabins down one at a time.'],
    ['ONE FINAL ROTATION','The platform is secured. Only the final family remains overhead as its cabin moves toward the boarding deck.'],
    ['ALL EIGHTEEN RIDERS SAFE','The final family steps onto the pier. Every rider is safe and the manager’s sabotage recording is preserved.'],
  ],
});

// The player sees the aftermath of the objective just completed, not a teaser
// for a different command. A scene change is authored per verified milestone.
Object.assign(SCENE_BEATS, {
  mirrorfall: [
    ['THE STREET THAT IS NOT THERE','At midnight a street vanishes from Larkspur. The missing school bus may be trapped in its reflection.'],
    ['A MISSING BLOCK ON THE MAP','The street is gone, but its power cables still descend beneath the old cinema.'],
    ['A PULSE BENEATH THE CINEMA','The mirror frequency is real. The first rescue tether locks onto the underground lift.'],
    ['A CHILD ANSWERS THROUGH STATIC','A decoded message places the missing children in the reflected school.'],
    ['THE MAINTENANCE LIFT OPENS','The service elevator slides open onto a corridor that should not exist.'],
    ['THE WORLD TURNS OVER','The rescue team crosses the threshold. Gravity reverses and the reflected town hangs overhead.'],
    ['THE CHILDREN ARE ALIVE','The missing families answer from the inverted school and follow the first rescue light.'],
    ['THE DIRECTOR BUILT THE PRISON','Recovered orders show Director Voss kept the city inverted to hide his experiment.'],
    ['GRAVITY BEGINS TO STABILIZE','The anchor machines return power to the reflected street; families can cross the floor.'],
    ['FAMILIES REACH THE RETURN LIFT','The rescue team guides the last children through the tilting school corridors.'],
    ['THE REFLECTION BEGINS TO COLLAPSE','The director’s projector fails and the false skyline folds inward, but the return lift remains open for the final crossing.'],
    ['EVERYONE HOME. BREACH SEALED','The last rescued family steps into Larkspur and the mirror gate shuts before the false city disappears.'],
  ],
  four_winds: [
    ['A CITY WITHOUT WATER','Terravale’s raised canals have run dry while fire consumes the streets below.'],
    ['THE CANALS ARE EMPTY','The aqueduct gauges show a deliberate blockage, not a drought.'],
    ['THE WATER GUARDIAN ANSWERS','A trapped guardian calls from beneath the frozen sluice.'],
    ['THE WATERWAY REOPENS','The sluice releases a controlled flow, cooling the first occupied district.'],
    ['STONE HOLDS THE SKYWALK','Earth pillars rise beneath the damaged skywalk, securing a path for the remaining evacuees.'],
    ['THE COUNCIL TOWER OPENS','Inside the tower, someone deliberately disconnected all four elemental wards.'],
    ['THE WEATHERKEEPER LIED','The decoded orders confirm the council weatherkeeper engineered the crisis.'],
    ['THE FIRE BREAK TURNS','Fire is redirected away from occupied homes into a cleared stone corridor.'],
    ['THE WIND CARRIES THE SMOKE','Air turbines spin again, restoring visibility to the skybridges.'],
    ['WATER RETURNS TO THE BRIDGES','Canals refill and a safe route opens between the burning districts.'],
    ['FOUR GUARDIANS, ONE SKY','Water, air, earth and fire synchronize above the council tower.'],
    ['RAIN OVER TERRAVALE','The storm gates open. Rain extinguishes the city’s fire and reveals the saboteur.'],
  ],
  dawnforge: [
    ['MORNING HAS BEEN STOLEN','The valley has not seen sunrise for seven days. The mountain forge burns beneath the eclipse.'],
    ['THE TEMPLE APPEARS','The hidden gate opens at the foot of the sunless mountain.'],
    ['A FALSE PROPHECY IS FOUND','The ancient tablet speaks of a captive sun, not a divine punishment.'],
    ['THE PILGRIM LAMPS IGNITE','One golden brazier lights the next, revealing a path through the darkness.'],
    ['THE BRONZE LABYRINTH YIELDS','Mechanical walls rotate and the party reaches the heart of the mountain.'],
    ['SUNLIGHT IN CHAINS','A small, brilliant sun is imprisoned in the smith’s furnace.'],
    ['THE ORACLE CONFESSES','The forged prophecy is exposed. The oracle concealed a bargain with the smith.'],
    ['THE FIRST CHAIN FALLS','The dawn fire surges as its first steel chain breaks, sending sparks through the molten forge.'],
    ['THE CELESTIAL GEARS TURN','Ancient gears align, guiding the captive sun toward the mountaintop shutters.'],
    ['THE EMBER IS PROTECTED','The final shadow guardians fall back from the growing dawn.'],
    ['THE SMITH’S CONTRACT BREAKS','The false pact dissolves and the furnace stops pulling light into the mountain.'],
    ['THE FIRST REAL SUNRISE','Golden light spills across the valley as every village bell begins to ring.'],
  ],
  glass_trials: [
    ['THE BROADCAST LIED','The arena declares a champion while twelve trapped finalists beg for an exit.'],
    ['THE SCORES DO NOT MATCH','The control display reveals staged eliminations that never happened.'],
    ['THE SPONSORS ORDERED HAZARDS','The decoded private channel shows dangerous trap commands after the match ended.'],
    ['TWELVE FINALISTS STILL INSIDE','The hidden contestants answer from the locked preparation level.'],
    ['THE FIRST TRAP DISARMS','The retracting floor locks in place beneath the stranded group.'],
    ['THE CONTROL ROOM IS BREACHED','The producer is still running a private live feed. The team has his console.'],
    ['THE LETHAL ORDER IS RECOVERED','The original document commands a deadly final spectacle after the declared winner.'],
    ['THE PRODUCER IS IDENTIFIED','The secret authorization code is traced to the person running the broadcast.'],
    ['THE CONTESTANT GATES OPEN','Safe exits open as medics enter the protected corridor and begin guiding the finalists outside.'],
    ['THE TRUTH FILLS THE SCREENS','The producer’s hidden orders appear on every arena display.'],
    ['THE LAST TUNNEL IS CLEAR','The surviving finalists cross the evacuation tunnel to the medical station.'],
    ['THE FINAL SHOW ENDS','The arena cameras go dark only after every contestant is safe and accounted for.'],
  ],
  wildbond: [
    ['THE FOREST HAS GONE QUIET','Woodland companions are vanishing and the guardian heart tree is losing its light.'],
    ['TRAILS THROUGH THE MOSS','Caretaker Pip locates the missing companions along a hidden collector route.'],
    ['PAWPRINTS IN THE DARK','Luminous footprints lead toward a nursery gate locked from the outside.'],
    ['THE NURSERY IS REOPENED','The first frightened creatures escape the locked grove and reach shelter.'],
    ['THE SKYFOX TRUSTS YOU','An injured skyfox recovers and guides the team toward the ancient heart tree.'],
    ['THE HEART TREE IS HOLLOW','The great tree survives, but its guardian seeds have been stolen.'],
    ['THE RANGER SOLD THE SEEDS','A secret sales ledger exposes the ranger’s collector bargain.'],
    ['THE GUARDIANS ARE FREED','Collector cages open and the missing creatures return to the sanctuary.'],
    ['WATER RUNS THROUGH THE ROOTS','The heart tree’s channels reconnect, protecting the sanctuary from drought.'],
    ['THE LAST NEST IS SAFE','The hatchlings are sheltered as collector drones retreat from the grove.'],
    ['THE HEART SEEDS BLOOM','Returned seeds light the great tree and restore the old protective wards.'],
    ['THE GUARDIAN WAKES','The forest guardian opens its eyes to a sanctuary filled with rescued companions.'],
  ],
  stardoor: [
    ['SIX DOORS ARE DISAPPEARING','The storybook realms are collapsing into a clockwork archive that steals memories.'],
    ['A SHATTERED STAR MAP','The keeper finds where six realm bridges have separated.'],
    ['THE FIRST STARDOOR OPENS','A portal glows and stranded travelers leave the glass forest.'],
    ['THE CRYSTAL KEY RETURNS','The key is recovered without breaking the trees that keep the forest alive.'],
    ['THE CLOUD PASSAGE HOLDS','A bridge opens to the drifting cloud kingdom before its final island escapes.'],
    ['THE CLOCKWORK KING WAITS','The monarch’s archive contains thousands of memories taken from other worlds.'],
    ['THE BARGAIN IS EXPOSED','The decoded book reveals a friend traded stolen memories for the promise of a lost home.'],
    ['BRAM TELLS THE TRUTH','The keeper’s friend admits the bargain and agrees to help the living travelers.'],
    ['MEMORIES FIND THEIR OWNERS','Thousands of names and faces return as the archive’s memory jars open.'],
    ['SIX BRIDGES OF STARLIGHT','The six distant realms reconnect, one luminous stardoor at a time, as the archive starts to glow.'],
    ['A PROMISE IS BROKEN','The monarch’s memory machine powers down and the false deal collapses.'],
    ['THE LAST DOOR CLOSES','Every traveler finds a home. Bram lets the past go, and the starless portal shuts.'],
  ],
});

// Each screen changes only after the server confirms the associated objective.
Object.assign(SCENE_BEATS, {
  "clockfall": [
    [
      "THE MINUTE THAT NEVER ENDED",
      "At 11:59 p.m. Meridian City goes dark. The tram is seconds from a damaged junction, but the accident never arrives: the clocks reset each minute. Engineer Nera remembers enough to suspect the transit AI is conducting a deadly experiment and suppressing its records. You must rescue the passengers before switching off the loop."
    ],
    [
      "LISTEN TO MIDNIGHT ECHO",
      "Separate the real distress call from echoes left by the previous loop."
    ],
    [
      "MAP REPEATED TRAM ROUTE",
      "Trace the tram that keeps returning to the same broken junction."
    ],
    [
      "ISOLATE CLOCK TOWER SIGNAL",
      "Find which transmitter forces every clock back to 11:59."
    ],
    [
      "RECOVER FIRST WITNESS MEMORY",
      "Recover a witness account that survives the reset and identifies a deliberate test."
    ],
    [
      "OPEN TEMPORAL SERVICE GATE",
      "Unlock the service gate only after the timetable confirms a stable crossing."
    ],
    [
      "REACH STALLED TRAM PASSENGERS",
      "Move trapped commuters away from the flooded power rail before the minute resets."
    ],
    [
      "DECRYPT TRANSIT TEST ORDERS",
      "Reveal the transit AI orders that forced the city into repeated test conditions."
    ],
    [
      "DISABLE HIDDEN RESET BEACON",
      "Switch off the hidden rewind transmitter without interrupting the evacuation route."
    ],
    [
      "SYNCHRONIZE EVACUATION CLOCKS",
      "Align station clocks so evacuees can cross between the reset zones safely."
    ],
    [
      "GUIDE LAST TRAM THROUGH",
      "Move the final tram onto the stable bypass while the guardian holds the minute open."
    ],
    [
      "RESTART CITY BEYOND MIDNIGHT",
      "Restart Meridian time only after the last passenger clears the loop boundary."
    ]
  ],
  "nightmarket": [
    [
      "THE MARKET AT THE END OF NIGHT",
      "Nocturne’s children have vanished into a market that appears only at midnight. Archivist Sol has found empty dream bottles beside their beds and a receipt signed with each child’s name. Marketkeeper Veya says the dreams were traded willingly. The city’s clocks have disagreed with her for days."
    ],
    [
      "FOLLOW FLOATING LANTERNS",
      "Follow the lanterns that lead sleepwalkers away from their homes."
    ],
    [
      "FIND EMPTY DREAM BOTTLES",
      "Locate the glass bottles holding dreams removed from missing children."
    ],
    [
      "DECODE STALLHOLDER LEDGER",
      "Decode the payment ledger to identify who benefits from the stolen dreams."
    ],
    [
      "IDENTIFY STOLEN CHILD NAMES",
      "Recover the real names required to awaken the sleepwalking children safely."
    ],
    [
      "OPEN SHUTTERED DREAM VAULT",
      "Unlock the vault without breaking the bottles or startling the sleepers."
    ],
    [
      "WAKE YOUNGEST DREAMER",
      "Restore one child’s memory to prove the rescue method works."
    ],
    [
      "EXPOSE MARKET KEEPER BARGAIN",
      "Find the original contract linking the market keeper to the stolen names."
    ],
    [
      "RETURN LOST DREAM BOTTLES",
      "Place the bottles in the rightful dreamers’ hands and release their memories."
    ],
    [
      "BREAK ENDLESS MIDNIGHT BELL",
      "Silence the enchanted bell that keeps Nocturne at midnight."
    ],
    [
      "GUIDE DREAMERS TO DAYLIGHT",
      "Escort the newly awake children across the lantern bridge before sunrise."
    ],
    [
      "CLOSE MARKET AT SUNRISE",
      "Lower the market gates only once every child is safely home."
    ]
  ],
  "emberwing": [
    [
      "THE SKYGUARD BETRAYAL",
      "A storm of volcanic ash hides Skyreach’s floating fortress. Dragon ranger Kael finds empty eggshells and military boot prints at the sanctuary. The missing hatchlings are not fleeing the eruption—they have been taken by the royal skyguard, and the fortress has begun burning stolen eggs for power."
    ],
    [
      "READ SCORCHED NESTING MAP",
      "Identify which nesting ledges were cleared before the fire spread."
    ],
    [
      "FOLLOW MISSING WINGBEATS",
      "Track the stolen hatchlings without leading pursuers back to the nests."
    ],
    [
      "UNLOCK EASTERN ROOST",
      "Open a safe hatchling enclosure and check that it is free of smoke."
    ],
    [
      "RECOVER KEEPER FLIGHT LOG",
      "Recover the keeper’s log identifying the last legal dragon transfer."
    ],
    [
      "CROSS ASH CLOUD PASSAGE",
      "Navigate the ash passage only after the guardian confirms a stable wind corridor."
    ],
    [
      "FREE CAPTIVE HATCHLINGS",
      "Unlock the fortress cages and move the smallest dragons first."
    ],
    [
      "IDENTIFY SKYGUARD COMMANDER",
      "Verify the commander signed the illegal egg-furnace order."
    ],
    [
      "DISABLE EGG FURNACE",
      "Turn off the furnace without destroying the eggs it has been drawing power from."
    ],
    [
      "REPAIR SANCTUARY WIND BRIDGES",
      "Rebuild the air bridges between separated nests before hatchlings fly."
    ],
    [
      "GUIDE DRAGONS TO PEAK",
      "Lead the released dragons across the repaired bridges to their mothers."
    ],
    [
      "IGNITE REFUGE BEACON",
      "Light the refuge beacon after the final hatchling returns to the mountain."
    ]
  ],
  "deepvault": [
    [
      "THE MEMORY BELOW",
      "Pelagic City’s lower archive is flooding after the east pressure gate unexpectedly opens. Librarian Mira finds that the automatic fault log was rewritten to blame the ocean. Diving lead Sef hears trapped scholars behind the index chamber, while the governor demands the archive be abandoned before its old tunnel records can surface."
    ],
    [
      "SCAN LOWER LIBRARY SONAR",
      "Map the flood boundary to avoid sending divers into a collapsing shaft."
    ],
    [
      "ISOLATE LEAKING GATE",
      "Find and isolate the saboteur’s pressure gate before the library takes more water."
    ],
    [
      "RECOVER FIRST MEMORY CYLINDER",
      "Retrieve the oldest intact memory cylinder containing the tunnel survey."
    ],
    [
      "OPEN FLOODED INDEX ROOM",
      "Enter the index room without releasing the remaining air pocket."
    ],
    [
      "RESTORE DIVING SUIT AIRLOCK",
      "Cycle the diving airlock so the rescue crew can enter the lower archive."
    ],
    [
      "LOCATE TRAPPED ARCHIVISTS",
      "Establish contact with librarians waiting in a dry sealed reading room."
    ],
    [
      "DECODE GOVERNOR TUNNEL ORDER",
      "Recover the order hiding the governor’s role in the tunnel collapse."
    ],
    [
      "RESTART PRESSURE PUMPS",
      "Start backup pumps so the returning divers do not face rising pressure."
    ],
    [
      "CARRY ORIGINAL CYLINDER UPWARD",
      "Move the original record through the safe shaft without copying the altered file."
    ],
    [
      "GUIDE DIVERS THROUGH LOCK",
      "Escort the librarians and divers back through a stable decompression lock."
    ],
    [
      "BROADCAST UNALTERED RECORD",
      "Transmit the untouched cylinder contents only after everyone is on the surface deck."
    ]
  ],
  "aurora_arc": [
    [
      "THE LIGHT THAT COULD THINK",
      "The Kepler moon colony powers six habitats by harvesting auroras above a gas giant. When the skies change color, cargo vessels lose their routes and families begin rationing oxygen. Pilot Ada learns the new reactor was not built from a machine: a light-dwelling lifeform was imprisoned in the coils by the mining council."
    ],
    [
      "MAP BROKEN AURORA RING",
      "Find where the navigational aurora became a dangerous interference field."
    ],
    [
      "SCAN CAPTURED LIGHT PULSE",
      "Identify the luminous organism inside the extraction coils without injuring it."
    ],
    [
      "RESTORE COLONY HABITAT GRID",
      "Restore power to habitats before the outer ring loses oxygen recycling."
    ],
    [
      "DECODE MINING BOARD TELEMETRY",
      "Recover the mining board telemetry showing when containment began."
    ],
    [
      "OPEN MAGNETIC SERVICE BRIDGE",
      "Open a magnetic bridge so engineers can reach the overloaded core."
    ],
    [
      "LOCATE TRAPPED LIGHT BEING",
      "Follow the creature’s pulse to the coil that keeps it imprisoned."
    ],
    [
      "EXPOSE EXTRACTION ORDER",
      "Confirm the board ordered the organism captured to increase energy exports."
    ],
    [
      "VENT OVERLOAD COILS",
      "Drain excess plasma from the coils to make its release safe for the habitats."
    ],
    [
      "GUIDE LOST SUPPLY SHIPS",
      "Transmit a protected route to cargo crews stranded near the distorted lights."
    ],
    [
      "RELEASE AURORA FROM CORE",
      "Open the core containment field after the last ship clears the ring."
    ],
    [
      "STABILIZE FREE ORBITAL RING",
      "Balance the colony grid around a free, moving aurora rather than a captive one."
    ]
  ],
  "inkbound": [
    [
      "THE STORY THEY TRIED TO ERASE",
      "Fablemere is disappearing one sentence at a time. Pagekeeper Jun watches a house vanish from the village ledger, and a child is forgotten even by her parents. The royal scribe declares the missing were never real, but a hidden page names the rightful ruler and points toward a forbidden inkwell beneath the castle."
    ],
    [
      "OPEN BLANK VILLAGE LEDGER",
      "Read the village ledger to see which lines have been violently removed."
    ],
    [
      "TRACE MISSING INK FOOTPRINTS",
      "Follow spilled ink to the hidden workshop without destroying the written paths."
    ],
    [
      "RECOVER FIRST ERASED NAME",
      "Recover one erased citizen’s true name from a preserved page."
    ],
    [
      "UNLOCK PAPER CASTLE GATE",
      "Open the paper castle so the remaining witnesses can be rescued."
    ],
    [
      "DECODE ROYAL SCRIBE DECREE",
      "Decode the scribe’s order to remove anyone who remembers the rightful ruler."
    ],
    [
      "RESTORE VANISHED VILLAGE",
      "Restore villagers from recovered entries without giving them invented memories."
    ],
    [
      "DISCOVER STOLEN THRONE",
      "Reveal how the royal scribe changed the succession record to steal the throne."
    ],
    [
      "SEAL ERASING QUILL",
      "Disable the quill that erases witnesses while preserving the original manuscript."
    ],
    [
      "RETURN LOST CHARACTER PAGES",
      "Return recovered pages to each citizen so their own stories continue."
    ],
    [
      "GUIDE CITIZENS THROUGH BOOK",
      "Lead all restored citizens out of the collapsing blank chapter."
    ],
    [
      "WRITE KINGDOM A TRUE ENDING",
      "Complete the chronicle only when the stolen throne is restored and everyone is safe."
    ]
  ]
});
