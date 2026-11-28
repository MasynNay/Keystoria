/** A spoiler-free collection of all existing operations. No mission rules or artwork change. */
import { MISSIONS } from './missions.js';
import { readCareer } from './progression.js?v=0.2.0';
import { safe, tag, ico } from './helpers.js';
const chapters=Object.freeze([
 {title:'First contact',detail:'The original operations and the first rescue assignments.'},
 {title:'Beyond the frontier',detail:'From the ocean floor to distant planets and dangerous terrain.'},
 {title:'Shattered worlds',detail:'Unstable realities, elemental wards and hidden conspiracies.'},
 {title:'The final frontiers',detail:'Time fractures, dreams, dragons and worlds made of stories.'},
]);
export const CAMPAIGN_IDS=Object.freeze(Object.keys(MISSIONS).sort((a,b)=>Number(MISSIONS[a].no)-Number(MISSIONS[b].no)));
export function campaignSummary(career={}){
 const completed=new Set((Array.isArray(career.completedMissions)?career.completedMissions:[]).filter(id=>Object.hasOwn(MISSIONS,id)));
 const groups=chapters.map((chapter,i)=>{
  const ids=CAMPAIGN_IDS.slice(i*6,i*6+6);
  return {...chapter,number:i+1,ids,completed:ids.filter(id=>completed.has(id)).length};
 });
 return {groups,total:CAMPAIGN_IDS.length,completed:completed.size,next:CAMPAIGN_IDS.find(id=>!completed.has(id))??null,completedIds:[...completed]};
}
export function campaignAtlasTemplate({career=readCareer(),browserEdition=false,selectedMission='station'}={}){
 const atlas=campaignSummary(career);
 return `<section class="campaign-atlas shell" id="campaign-atlas" aria-labelledby="campaign-atlas-heading">
 <div class="record-head">${tag('STORY CAMPAIGN / FOUR COLLECTIONS')}<h2 id="campaign-atlas-heading" tabindex="-1">CAMPAIGN <em>ATLAS.</em></h2><p>Explore all twenty-four existing stories in operation order. Every story remains available; collections are optional goals, not locked levels. Successful extractions are remembered on this device. Older victories may be missing if their records were already discarded.</p></div>
 <div class="campaign-summary"><div><strong>${atlas.completed} / ${atlas.total}</strong><p>Distinct worlds cleared</p></div><progress aria-label="Distinct story worlds cleared" value="${atlas.completed}" max="${atlas.total}"></progress>
 ${atlas.next?`<div><strong>Suggested next: ${safe(MISSIONS[atlas.next].name)}</strong><p>First operation without a recorded win.</p>${browserEdition?'<p>Play story missions in the local Python edition.</p>':`<button type="button" class="btn btn-primary" data-action="campaign-select" data-mission="${atlas.next}">SELECT NEXT OPERATION ${ico('arrow',16)}</button>`}</div>`:'<p>Every world has a recorded victory. Replay any operation or difficulty.</p>'}
 </div>
 <div class="campaign-chapters">${atlas.groups.map(group=>`<article class="campaign-chapter"><header><span>COLLECTION ${group.number}</span><h3>${group.title}</h3><p>${group.detail}</p><progress value="${group.completed}" max="${group.ids.length}" aria-label="${group.title} completed"></progress><small>${group.completed} / ${group.ids.length} cleared</small></header><ol>${group.ids.map(id=>{
 const mission=MISSIONS[id],won=atlas.completedIds.includes(id),selected=id===selectedMission;
 const body=`<span class="campaign-operation-number">${mission.no}</span><span><strong>${safe(mission.name)}</strong><small>${won?'CLEARED':'NOT YET CLEARED'}${selected?' · SELECTED':''}</small></span>`;
 return `<li data-campaign-mission="${id}" data-cleared="${won}">${browserEdition?`<div class="campaign-operation">${body}</div>`:`<button type="button" class="campaign-operation" data-action="campaign-select" data-mission="${id}" aria-pressed="${selected}">${body}</button>`}</li>`;
 }).join('')}</ol></article>`).join('')}</div>
 </section>`;
}
