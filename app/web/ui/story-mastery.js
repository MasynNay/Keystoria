/** Bounded victory mastery across the three authoritative story difficulties.
 * Retain only a best grade (or confirmed win with unknown historical grade) per slot.
 */
import { MISSIONS } from './missions.js';
export const STORY_DIFFICULTIES=Object.freeze([
 Object.freeze({id:'story',label:'Cadet'}),
 Object.freeze({id:'standard',label:'Standard'}),
 Object.freeze({id:'overdrive',label:'Overdrive'})
]);
const gradeRank=Object.freeze({cleared:1,B:2,A:3,S:4});
const knownGrade=grade=>typeof grade==='string'&&Object.hasOwn(gradeRank,grade);
export function mergeMastery(...sources){
 const result={};
 for(const source of sources){
  if(!source||typeof source!=='object'||Array.isArray(source))continue;
  for(const id of Object.keys(MISSIONS)){
   const entry=Object.hasOwn(source,id)?source[id]:null;
   if(!entry||typeof entry!=='object'||Array.isArray(entry))continue;
   for(const {id:difficulty} of STORY_DIFFICULTIES){
    const grade=Object.hasOwn(entry,difficulty)?entry[difficulty]:null;
    if(!knownGrade(grade))continue;
    const current=result[id]?.[difficulty];
    if(!current||gradeRank[grade]>gradeRank[current]){
     if(!result[id])result[id]={};
     result[id][difficulty]=grade;
    }
   }
  }
 }
 return result;
}
export function masteryFromRuns(runs){
 const results=[];
 for(const run of Array.isArray(runs)?runs:[]){
  if(run?.won!==true||!Object.hasOwn(MISSIONS,run.mission)||!STORY_DIFFICULTIES.some(d=>d.id===run.difficulty))continue;
  results.push({[run.mission]:{[run.difficulty]:knownGrade(run.grade)?run.grade:'cleared'}});
 }
 return mergeMastery(...results);
}
export function masterySummary(career={}){
 const mastery=mergeMastery(career.mastery);
 const entries=Object.values(mastery),count=Object.keys(MISSIONS).length;
 const cleared=entries.reduce((total,entry)=>total+Object.keys(entry).length,0);
 const mastered=entries.filter(entry=>STORY_DIFFICULTIES.every(d=>entry[d.id])).length;
 const sGrades=entries.reduce((total,entry)=>total+Object.values(entry).filter(g=>g==='S').length,0);
 return {mastery,cleared,total:count*STORY_DIFFICULTIES.length,mastered,worlds:count,sGrades};
}
