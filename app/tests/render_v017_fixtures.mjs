/** Render the real application templates using snapshots from the Python engine.
 * These fixtures contain no fake screenshot-only layout or UI.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const folder=process.env.PANIC_V017_PREVIEW;
if(!folder)throw new Error('PANIC_V017_PREVIEW is required');
const snapshots=JSON.parse(readFileSync(join(folder,'snapshots.json'),'utf8'));
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
const {createViews}=await import('../web/ui/views.js');
const state={online:true,selectedMission:'mirrorfall',nickname:'DEMO',modal:null,preferences:{}};
const views=createViews(state);
const files=['styles.css','styles/typing.css','styles/speed.css', ...['v06','v07','v08','v09','v010','v011','v012','v013','v014','v015','v017'].map(v=>`styles/${v}.css`)];
const css=files.map(file=>readFileSync(new URL(`../web/${file}`,import.meta.url),'utf8')).join('\n');
const wrap=(content,theme)=>`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body data-theme="${theme}"><div class="grain"></div><div id="app">${content}</div><div id="toast-layer"></div></body></html>`;
writeFileSync(join(folder,'home.html'),wrap(views.homeTemplate(),'mirrorfall'));
for(const [id,room] of Object.entries(snapshots)){
 if(!room||!room.missionInfo)continue;
 writeFileSync(join(folder,`${id}.html`),wrap(views.gameTemplate(room),room.mission));
}
console.log(`Generated ${Object.keys(snapshots).length} v0.17 mission fixtures`);
