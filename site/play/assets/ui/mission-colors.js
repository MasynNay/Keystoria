/** One coherent icon style, eighteen visibly different hues. */
export const MISSION_COLORS = Object.freeze({
  station: ['#52dcf6','#133342','#326a80'],
  hollow: ['#c58bfc','#271e3c','#684b87'],
  outbreak: ['#65f0ab','#0d342c','#287b5d'],
  casefile: ['#f6bd78','#352720','#886147'],
  dead_air: ['#ff9872','#402a2c','#a7544f'],
  last_stop: ['#f7d45e','#37302b','#977b43'],
  abyss: ['#4ae6c9','#062c39','#237884'],
  neon: ['#fe70d4','#301a43','#9147a1'],
  red_horizon: ['#f39b7b','#542a35','#b15f5b'],
  whiteout: ['#d3f3fc','#284657','#769bab'],
  ashfall: ['#ff7849','#4d211f','#ac4737'],
  carnival: ['#f4a874','#382348','#a14c78'],
  mirrorfall: ['#b1a1ff','#221e4a','#7467bb'],
  four_winds: ['#89e9a1','#17483a','#438d88'],
  dawnforge: ['#ffd27a','#512f24','#ba753a'],
  glass_trials: ['#c7d9ef','#303d57','#7c99a9'],
  wildbond: ['#b6e76c','#234324','#7f9b4c'],
  stardoor: ['#d38cff','#282044','#925ba8'],
  clockfall: ["#7ff2eb", "#183e4a", "#347e9b"],
  nightmarket: ["#ff96c9", "#4b2149", "#a9518d"],
  emberwing: ["#ffac52", "#603026", "#c66b3e"],
  deepvault: ["#74c5ff", "#123756", "#2d7a9e"],
  aurora_arc: ["#a5ff9c", "#173e4b", "#5196aa"],
  inkbound: ["#f4d59d", "#483b54", "#a786a0"],
});
export const missionColorStyle = id => { const [ink,deep,glow]=MISSION_COLORS[id] || MISSION_COLORS.station; return `--mission-ink:${ink};--mission-dark:${deep};--mission-glow:${glow}`; };

// Chapter 19–24 cover palettes. Reassign the frozen palette using a single complete map.
export const FRONTIER_MISSION_COLORS = Object.freeze({"clockfall": ["#7ff2eb", "#183e4a", "#347e9b"], "nightmarket": ["#ff96c9", "#4b2149", "#a9518d"], "emberwing": ["#ffac52", "#603026", "#c66b3e"], "deepvault": ["#74c5ff", "#123756", "#2d7a9e"], "aurora_arc": ["#a5ff9c", "#173e4b", "#5196aa"], "inkbound": ["#f4d59d", "#483b54", "#a786a0"]});
