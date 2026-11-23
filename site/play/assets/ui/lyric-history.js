/** Last completed Lyric Lab performances, already kept on the player's device.
 * Read-only presentation of the existing 40-entry local history key.
 * No lyrics, typed words, media URLs or external requests are involved.
 */
export const LYRIC_HISTORY_KEY='panic.lyric.history';
const isNumber=(x,max)=>Number.isFinite(x)&&x>=0&&x<=max;
export function readRecentLyricResults(storage=globalThis.localStorage,limit=5){
 try{
  const parsed=JSON.parse(storage?.getItem(LYRIC_HISTORY_KEY)||'[]');
  if(!Array.isArray(parsed))return [];
  const max=Math.max(0,Math.min(5,Number.isInteger(limit)?limit:5));
  return parsed.slice(0,40).filter(run=>
   run && typeof run==='object' && !Array.isArray(run) &&
   typeof run.title==='string' && run.title.trim().length>0 &&
   typeof run.artist==='string' &&
   typeof run.date==='string' && Number.isFinite(Date.parse(run.date)) &&
   isNumber(run.wpm,5000) && isNumber(run.accuracy,100) &&
   isNumber(run.points,1000000) && isNumber(run.skipped,100000)
  ).slice(0,max).map(run=>({
   title:run.title.trim().slice(0,120),
   artist:run.artist.trim().slice(0,80),
   date:new Date(run.date).toISOString(),
   wpm:Math.round(run.wpm),accuracy:Math.round(run.accuracy),
   points:Math.round(run.points),skipped:Math.round(run.skipped),
  }));
 }catch{return [];}
}
