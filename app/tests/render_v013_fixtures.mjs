/** Offline screenshot fixtures using real server game snapshots. No fake wins. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const preview=process.env.PANIC_V013_PREVIEW;
if (!preview) throw new Error('Set PANIC_V013_PREVIEW to a writable fixture directory');
const saved=JSON.parse(readFileSync(join(preview,'state.json'),'utf8'));
const state={online:true,selectedMission:'dead_air',nickname:'NOVA',modal:null,preferences:{largerType:false,highContrast:false,reducedMotion:false}};
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const {createViews}=await import('../web/ui/views.js');
const views=createViews(state);
const css=['styles.css','styles/typing.css','styles/speed.css',...['v06','v07','v08','v09','v010','v011','v012','v013','v014'].map(x=>`styles/${x}.css`)].map(file=>readFileSync(new URL(`../web/${file}`, import.meta.url),'utf8')).join('\n');
const wrap=(body,theme)=>`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body data-theme="${theme}"><div class="grain"></div><div id="app">${body}</div><div id="toast-layer"></div></body></html>`;
writeFileSync(join(preview,'home.html'),wrap(views.homeTemplate(),'station'));
writeFileSync(join(preview,'countdown.html'),wrap(views.countdownTemplate(saved.dead_air_countdown),'dead_air'));
if(saved.dead_air_armed)writeFileSync(join(preview,'armed.html'),wrap(views.countdownTemplate(saved.dead_air_armed),'dead_air'));
for(const mission of Object.keys(saved).filter(key=>!key.endsWith("_countdown") && !key.endsWith("_armed"))) {
 writeFileSync(join(preview,`${mission}.html`),wrap(views.gameTemplate(saved[mission]),mission));
}
console.log('Generated static templates with the real engine snapshots');
