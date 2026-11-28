/** Estimated constant pace, never a recorded replay. */
import { practiceMode } from './speed-insights.js?v=0.48.14';
import { PACKS, DURATIONS } from './speed-engine.js?v=0.40.1';
export function ghostScope(s){return {pack:s.pack,seconds:s.seconds,practiceMode:s.phoneLayout?(s.keyboardAssist?'mobile-assisted':'mobile-exact'):'standard-exact'};}
export function selectPaceGhost(history,scope){
 if(!scope||!Object.hasOwn(PACKS,scope.pack)||!DURATIONS.includes(scope.seconds)||!['standard-exact','mobile-exact','mobile-assisted'].includes(scope.practiceMode))return null;
 const numeric=scope.pack==='numpad';let best=null;
 for(const run of (Array.isArray(history)?history.slice(0,25):[])){
  if(!run||run.pack!==scope.pack||run.seconds!==scope.seconds||practiceMode(run)!==scope.practiceMode)continue;
  const rate=numeric?run.cpm:run.wpm;
  if(!Number.isFinite(rate)||rate<=0||rate>(numeric?30000:5000)||!Number.isFinite(run.accuracy)||run.accuracy<0||run.accuracy>100)continue;
  if(!best||rate>best.rate||(rate===best.rate&&run.accuracy>best.accuracy))best={...scope,unit:numeric?'CPM':'WPM',rate,accuracy:run.accuracy};
 }
 return best;
}
export function ghostProgress(g,elapsed,correct){
 const seconds=Math.min(g.seconds,Math.max(0,Number.isFinite(elapsed)?elapsed:0));
 const target=Math.floor(g.rate*(g.unit==='WPM'?5:1)*seconds/60),player=Math.max(0,Math.floor(Number.isFinite(correct)?correct:0));
 return {target,player,delta:player-target};
}
export function ghostMatches(g,s){return g.pack===s.pack&&g.seconds===s.seconds&&g.practiceMode===s.practiceMode;}
export function ghostOutcome(g,s){
 if(s.interrupted||s.ghostInvalid||!ghostMatches(g,{pack:s.pack,seconds:s.seconds,practiceMode:practiceMode(s.result??s)}))return null;
 const rate=g.unit==='CPM'?s.result?.cpm:s.result?.wpm;
 if(!Number.isFinite(rate))return null;
 return {delta:rate-g.rate,accuracyDelta:s.result.accuracy-g.accuracy};
}
