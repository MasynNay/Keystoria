/** Representative UI state for offline responsive visual inspection. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLD_RULES } from './world_fixture.mjs';

const localStore = new Map();
globalThis.localStorage = {
  getItem(key) { return localStore.get(key) ?? null; },
  setItem(key, value) { localStore.set(key, String(value)); },
};
const state = {
  online: true, selectedMission: 'hollow', nickname: 'GHOST_01',
  modal: null, preferences: { largerType:false, highContrast:false, reducedMotion:false },
};
const { createViews } = await import('../web/ui/views.js');
const { homeTemplate, gameTemplate, briefingTemplate, countdownTemplate, header } = createViews(state);
const { trainingTemplate } = await import('../web/ui/training-view.js');
const room = {
  code: 'B4KM9X', mission: 'hollow', difficulty: 'standard', difficultyLabel:'Standard',
  mistakePenalty:2, phase:'playing', stage:1, stageGoal:5, progress:3,
  stability:79, remaining:147.3, paused:false, role:'hacker',
  threatName:'THE WATCHER', threatSeconds:7.6, threatTotal:13,
  crisisActive:false, syncCharge:3, syncReady:false, pulsesUsed:0,
  tacticActive:true, tacticChoice:null, tacticOptions:WORLD_RULES.hollow.choices,
  ambient:62, worldWarning:false, world:WORLD_RULES.hollow,
  viewerId:'p1', hostId:'p1', players:[
    { id:'p1',name:'GHOST_01',score:724,streak:3,connected:true,bot:false },
    { id:'p2',name:'ECHO / AI',score:340,streak:2,connected:true,bot:true },
  ],
  currentObjective: 'Find the ritual in the family diary', discovered:[],
  readyPlayers:['p2'], countdownSeconds:2.6,
  missionInfo:{
    briefing:{ chapter:'01 / THE HOUSE THAT LISTENS',
      opening:'You entered Blackthorn Estate searching for a missing family. The front door locked behind you, and portraits whispered your names. A diary tells of a ritual that can break the curse, but every word draws the darkness closer.',
      hacker:'Reconstruct the ritual by typing the phrases shown on your terminal. Your successes advance the objective.',
      defender:'Type protective wards before each spirit reaches you. Each ward reduces the rising dread.',
      stakes:'If integrity collapses, dread reaches 100, or time expires, the house keeps you.',
      stageObjectives:['Find the ritual in the family diary','Complete the binding and unseal the door'],
      outro:'The front door finally opens.' },
    title:'THE HOLLOW HOUSE',subtitle:"The house knows you're here.",
    location:'BLACKTHORN ESTATE // 03:13',goal:'Unseal the front door',
    attack_title:'BREAK THE CURSE',defend_title:'BANISH THE SHADOWS',
  },
  logs:[{message:'The chapel has two exits. Choose a plan.',kind:'warning',id:'1'}],
};
const destination = process.env.PANIC_FIXTURE_DIR || process.cwd();
const css = [
  readFileSync(new URL('../web/styles.css', import.meta.url), 'utf8').split('\n').slice(1).join('\n'),
  readFileSync(new URL('../web/styles/typing.css', import.meta.url), 'utf8'),
  readFileSync(new URL('../web/styles/speed.css', import.meta.url), 'utf8'),
].join('\n');
function html(body, theme) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><style>${css}</style></head><body data-theme="${theme}"><div class="grain"></div><div id="app">${body}</div></body></html>`;
}
const renderedGame = gameTemplate(room).replace(
  '<div id="tactic-actions" class="tactic-actions"></div>',
  `<div id="tactic-actions" class="tactic-actions">${room.tacticOptions.map(option => `<button><strong>${option.label}</strong><span>${option.description}</span></button>`).join('')}</div>`,
);
writeFileSync(join(destination, 'landing.html'), html(homeTemplate(), 'hollow'));
writeFileSync(join(destination, 'briefing.html'), html(briefingTemplate({...room,phase:'briefing'}), 'hollow'));
writeFileSync(join(destination, 'countdown.html'), html(countdownTemplate({...room,phase:'countdown'}), 'hollow'));
writeFileSync(join(destination, 'training.html'), html(trainingTemplate({os:'windows',index:5,answered:false,errors:1,completed:false,review:false,draft:'',errorMessage:''},header), 'station'));
writeFileSync(join(destination, 'game.html'), html(renderedGame, 'hollow'));
console.log('Offline fixtures rendered from application templates');
