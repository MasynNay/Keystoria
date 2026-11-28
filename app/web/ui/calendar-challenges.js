/** Local calendar challenges. Deterministic prompts; two optional completion markers only. */
import {createWordStream,PACKS} from './speed-engine.js?v=0.40.1';
export const CALENDAR_KEY='keystoria.speed.calendar.v1';
const DAY=86400000;
const rotation=['everyday','technology','numpad','atmosphere','mixed-numbers','home-row','government'];
const mod=(a,b)=>((a%b)+b)%b;
const keyOf=n=>new Date(n*DAY).toISOString().slice(0,10);
export function calendarChallenge(kind,now=new Date()){
 if(!['daily','weekly'].includes(kind)||!Number.isFinite(now.getTime()))return null;
 // Convert the local date (not the local clock) into a stable day ordinal.
 const day=Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/DAY);
 const start=kind==='daily'?day:day-mod(day+3,7);
 const index=kind==='daily'?day:Math.floor((start+3)/7)+3;
 const pack=rotation[mod(index,rotation.length)];
 const tokens=kind==='daily'?10:20,seconds=kind==='daily'?30:60,goal=kind==='daily'?95:98;
 let seed=(Math.imul(start,2654435761)^(kind==='daily'?0x12345678:0x87654321))>>>0;
 const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 return {kind,key:keyOf(start),pack,tokens,seconds,goal,reference:createWordStream(pack,tokens,rng)};
}
export function readCalendarMarks(storage=globalThis.localStorage,now=new Date()){
 try{
  const raw=JSON.parse(storage?.getItem(CALENDAR_KEY)||'{}');
  const marks={};
  for(const kind of ['daily','weekly']){
   const challenge=calendarChallenge(kind,now);
   if(challenge&&raw?.[kind]===challenge.key)marks[kind]=challenge.key;
  }
  return marks;
 }catch{return {};}
}
export function calendarOutcome(challenge,metrics,interrupted,now=new Date()){
 const current=calendarChallenge(challenge?.kind,now);
 if(!current||current.key!==challenge.key)return 'expired';
 if(interrupted)return 'interrupted';
 if(!Number.isSafeInteger(metrics?.characters)||!Number.isSafeInteger(metrics?.correct)||metrics.characters!==challenge.reference.length||metrics.correct<0||metrics.correct>metrics.characters)return 'incomplete';
 return metrics.correct*100>=metrics.characters*challenge.goal?'passed':'accuracy';
}
export function saveCalendarMark(challenge,metrics,interrupted,storage=globalThis.localStorage,now=new Date()){
 if(calendarOutcome(challenge,metrics,interrupted,now)!=='passed')return false;
 try{storage.setItem(CALENDAR_KEY,JSON.stringify({...readCalendarMarks(storage,now),[challenge.kind]:challenge.key}));return true;}catch{return false;}
}
export function clearCalendarMarks(storage=globalThis.localStorage){
 try{storage.removeItem(CALENDAR_KEY);return true;}catch{return false;}
}
