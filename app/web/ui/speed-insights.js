/** Local-first Speed Lab progress summary. No network calls or user accounts.
 * Comparisons are restricted to matching pack, duration and input mode;
 * native phone-assisted results are never mixed with exact typing.
 */
import { readSpeedHistory, PACKS, DURATIONS } from './speed-engine.js?v=0.40.1';
export const ACCURACY_GOALS = Object.freeze([90, 95, 98]);
const GOAL_KEY = 'keystoria.speed.accuracyGoal.v1';
const RESULTS_KEY = 'panic.speed.results.v1';


/** End-of-session target-key review. Inspect only submitted positions
 * using the same case-sensitive comparison as Speed Lab scoring.
 * No keystroke recording, persistence or per-input processing.
 * Built-in passages contain printable ASCII (Numpad: digits and space).
 */
export function reviewSpeedKeys(reference, typed, {numpad=false}={}) {
  const source=String(reference??''), value=String(typed??'');
  const attempted=Math.min(source.length,value.length), counts=new Map();
  let mistakes=0;
  for(let i=0;i<attempted;i++){
    const key=source[i], missed=value[i]!==key;
    if(missed)mistakes++;
    if(!(numpad ? /^[0-9 ]$/ : /^[\x20-\x7e]$/).test(key))continue;
    let row=counts.get(key);
    if(!row){row={key,attempts:0,mistakes:0};counts.set(key,row);}
    row.attempts++;
    if(missed)row.mistakes++;
  }
  // Rank by remaining misses, then error rate, then deterministic key order.
  // Five rows is enough to suggest a next practice focus on small screens.
  const keys=[...counts.values()].filter(row=>row.mistakes>0)
    .sort((a,b)=>b.mistakes-a.mistakes
      || b.mistakes*a.attempts-a.mistakes*b.attempts
      || (a.key<b.key?-1:a.key>b.key?1:0)).slice(0,5);
  return {attempted,mistakes,keys,
    otherMistakes:mistakes-keys.reduce((total,row)=>total+row.mistakes,0)};
}


/** Build a private follow-up passage from the same built-in vocabulary.
 * One requested target is guaranteed in each successive word/group (except
 * Space, which gets shorter tokens to increase separator frequency).
 * This is deliberate practice, never a comparable personal-best test.
 * Limit keys and passage size; unsupported input cannot become prompt text.
 */
export function createFocusedSpeedDrill(pack, requested, count=700, rng=Math.random) {
  if(!Object.hasOwn(PACKS,pack)||!Array.isArray(requested))return null;
  const numpad=pack==='numpad', words=PACKS[pack].words;
  const shortest=words.length?Math.min(...words.map(word=>word.length)):0;
  const shortWords=words.filter(word=>word.length<=Math.max(4,shortest));
  const candidates=new Map();
  for(const key of requested.slice(0,5)){
    if(typeof key!=='string'||key.length!==1||candidates.has(key))continue;
    if(numpad){
      if(/^[0-9 ]$/.test(key))candidates.set(key,[]);
      continue;
    }
    if(!/^[\x20-\x7e]$/.test(key))continue;
    const matches=key===' '?shortWords
      : pack==='atmosphere'&&(key==='.'||key===',')?words.map(word=>word+key)
      : words.filter(word=>word.includes(key));
    if(matches.length)candidates.set(key,matches);
  }
  const keys=[...candidates.keys()];
  if(!keys.length)return null;
  const groups=[];
  const size=Number.isInteger(count)?Math.min(700,Math.max(2,count)):700;
  const pick=length=>{
    const value=Number(rng());
    return Math.min(length-1,Math.max(0,Math.floor((Number.isFinite(value)?value:0)*length)));
  };
  for(let i=0;i<size;i++){
    const key=keys[i%keys.length];
    if(numpad){
      const length=key===' '?3:3+(i%4);
      const digits=Array.from({length},()=>String(pick(10)));
      if(key!==' ')digits[pick(length)]=key;
      groups.push(digits.join(''));
    }else{
      const pool=candidates.get(key);
      groups.push(pool[pick(pool.length)]);
    }
  }
  return {keys,reference:groups.join(' ')};
}

export function practiceMode(session = {}) {
  // An explicit mode is authoritative for new saved runs. Older exports can
  // carry the assisted flag without phoneLayout or a practiceMode string:
  // never misclassify those scores as desktop-exact.
  if (session.practiceMode) return session.practiceMode;
  if (session.keyboardAssistedEver === true || session.keyboardAssisted === true)
    return 'mobile-assisted';
  return session.phoneLayout ? 'mobile-exact' : 'standard-exact';
}


/** Session-only focused attempt summaries, based on final submitted text.
 * Only the requested target positions count, including exact case and Space.
 * Do not carry the original text, draft, or keystroke history to the next run.
 */
export const FOCUS_COMPARISON_MIN_POSITIONS=5;
export function summarizeFocusedAttempt(session) {
  if(!session?.targetKeys?.length||!session.result)return null;
  const keys=[...new Set(session.targetKeys.slice(0,5))];
  const rows=keys.map(key=>({key,attempted:0,correct:0}));
  const lookup=new Map(rows.map(row=>[row.key,row]));
  for(let i=0;i<Math.min(session.reference.length,session.typed.length);i++){
    const row=lookup.get(session.reference[i]);
    if(row){row.attempted++;if(session.reference[i]===session.typed[i])row.correct++;}
  }
  return {pack:session.pack,seconds:session.seconds,mode:practiceMode(session.result),
    keys,interrupted:session.interrupted===true,rows};
}

export function sameFocusScope(a,b) {
  return Boolean(a&&b&&a.pack===b.pack&&a.seconds===b.seconds
    &&a.keys.length===b.keys.length&&a.keys.every((key,i)=>key===b.keys[i]));
}

/** Do not compare different keyboard modes, durations, target lists, or
 * interrupted attempts. A small-sample threshold is a UI safeguard, not
 * statistical significance. Rows report their denominators independently.
 */
export function compareFocusedAttempts(current,previous) {
  if(!current)return null;
  const reason=current.interrupted?'interrupted'
    :!previous?'first'
    :previous.interrupted||!sameFocusScope(current,previous)?'scope'
    :current.mode!==previous.mode?'keyboard':'matched';
  const rows=current.rows.map(row=>{
    const prior=reason==='matched'?previous.rows.find(item=>item.key===row.key):null;
    const comparable=Boolean(prior&&row.attempted>=FOCUS_COMPARISON_MIN_POSITIONS
      &&prior.attempted>=FOCUS_COMPARISON_MIN_POSITIONS);
    const rate=row.attempted?Math.round(row.correct/row.attempted*100):null;
    const priorRate=prior?.attempted?Math.round(prior.correct/prior.attempted*100):null;
    return {...row,rate,prior:prior??null,priorRate,delta:comparable?rate-priorRate:null};
  });
  return {reason,rows};
}


/** An optional, bounded two-attempt accuracy routine. Its goal is fixed
 * when launched; the exact fraction (not rounded display accuracy) qualifies
 * each key. This is session practice, not a saved mastery or skill award. */
export const FOCUS_ROUTINE_ATTEMPTS=2;
export function createFocusRoutine(goal) {
  return {goal:ACCURACY_GOALS.includes(goal)?goal:95, streak:0, mode:null,status:'ready'};
}

export function advanceFocusRoutine(routine,attempt) {
  if(!routine||!attempt||routine.status==='complete')return routine;
  if(attempt.interrupted)return {...routine,status:'interrupted'};
  // A mode switch starts a fresh streak, even if the new attempt qualifies.
  const streak=routine.mode===attempt.mode?routine.streak:0;
  const enough=attempt.rows.length>0&&attempt.rows.every(row=>row.attempted>=FOCUS_COMPARISON_MIN_POSITIONS);
  const qualifies=enough&&attempt.rows.every(row=>row.correct*100>=routine.goal*row.attempted);
  const nextStreak=qualifies?Math.min(FOCUS_ROUTINE_ATTEMPTS,streak+1):0;
  return {...routine,mode:attempt.mode,streak:nextStreak,
    status:nextStreak===FOCUS_ROUTINE_ATTEMPTS?'complete'
      :qualifies?'qualified':enough?'below-goal':'insufficient'};
}


/** Explicitly saved practice configuration only. No scores, attempt counts,
 * passages, timestamps, or keyboard logs enter this independent slot. */
export const SAVED_FOCUS_PLAN_KEY='keystoria.speed.focusPlan.v1';
export function normalizeFocusPlan(value) {
  if(!value||typeof value!=='object'||Array.isArray(value)
      ||typeof value.pack!=='string'||!Object.hasOwn(PACKS,value.pack)||!DURATIONS.includes(value.seconds)
      ||!ACCURACY_GOALS.includes(value.goal)||!Array.isArray(value.keys)
      ||value.keys.length<1||value.keys.length>5)return null;
  const drill=createFocusedSpeedDrill(value.pack,value.keys,2,()=>0);
  // Reject invalid, duplicate or out-of-category keys instead of silently
  // changing a saved goal. The generated sample is never retained.
  if(!drill||drill.keys.length!==value.keys.length
      ||!drill.keys.every((key,i)=>key===value.keys[i]))return null;
  return {pack:value.pack,seconds:value.seconds,goal:value.goal,keys:drill.keys};
}

export function focusPlanFromSession(session,goal=95) {
  if(session?.status!=='complete'||session.accuracyLadder||session.survival)return null;
  const keys=session.targetKeys?.length?session.targetKeys:session.keyReview?.keys.map(row=>row.key);
  return normalizeFocusPlan({pack:session.pack,seconds:session.seconds,
    goal:session.focusRoutine?.goal??goal,keys});
}

export function readFocusPlan(storage) {
  try{
    const raw=(storage===undefined?globalThis.localStorage:storage)?.getItem(SAVED_FOCUS_PLAN_KEY);
    return typeof raw==='string'&&raw.length<=512?normalizeFocusPlan(JSON.parse(raw)):null;
  }catch{return null;}
}

export function saveFocusPlan(value,storage) {
  const plan=normalizeFocusPlan(value);
  if(!plan)return false;
  try{(storage===undefined?globalThis.localStorage:storage).setItem(SAVED_FOCUS_PLAN_KEY,JSON.stringify(plan));return true;}
  catch{return false;}
}

export function clearFocusPlan(storage) {
  try{(storage===undefined?globalThis.localStorage:storage).removeItem(SAVED_FOCUS_PLAN_KEY);return true;}
  catch{return false;}
}


/** Opt-in local calendar counts, separate from saved plans and score history.
 * No target keys, passages, scores, attempt rows or per-event timestamps.
 * Retain at most 30 local calendar days; a day count is capped at 999.
 */
export const GUIDED_ACTIVITY_KEY='keystoria.speed.guidedActivity.v1';
export const GUIDED_ACTIVITY_DAYS=30;
function guidedDayKey(date){
  return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}
function guidedCalendar(now){
  if(!(now instanceof Date)||!Number.isFinite(now.getTime()))return [];
  return Array.from({length:GUIDED_ACTIVITY_DAYS},(_,i)=>guidedDayKey(
    new Date(now.getFullYear(),now.getMonth(),now.getDate()-GUIDED_ACTIVITY_DAYS+1+i,12)));
}
function normalizedGuidedActivity(value,now){
  if(!value||value.enabled!==true||!value.days||typeof value.days!=='object'||Array.isArray(value.days))return null;
  const calendar=guidedCalendar(now);
  if(!calendar.length)return null;
  const days={};
  for(const key of calendar){
    const count=Object.hasOwn(value.days,key)?value.days[key]:0;
    if(Number.isInteger(count)&&count>0&&count<=999)days[key]=count;
  }
  return {enabled:true,days};
}
export function readGuidedActivity(storage,now=new Date()){
  try{
    const raw=(storage===undefined?globalThis.localStorage:storage)?.getItem(GUIDED_ACTIVITY_KEY);
    return typeof raw==='string'&&raw.length<=4096?normalizedGuidedActivity(JSON.parse(raw),now):null;
  }catch{return null;}
}
export function enableGuidedActivity(storage,now=new Date()){
  try{
    const target=storage===undefined?globalThis.localStorage:storage;
    if(!readGuidedActivity(target,now))target.setItem(GUIDED_ACTIVITY_KEY,JSON.stringify({enabled:true,days:{}}));
    return true;
  }catch{return false;}
}
export function clearGuidedActivity(storage){
  try{(storage===undefined?globalThis.localStorage:storage).removeItem(GUIDED_ACTIVITY_KEY);return true;}
  catch{return false;}
}
export function recordGuidedCompletion(previous,current,storage,now=new Date()){
  if(!previous||previous.status==='complete'||current?.status!=='complete')return false;
  try{
    const target=storage===undefined?globalThis.localStorage:storage;
    const activity=readGuidedActivity(target,now);
    if(!activity)return false;
    const key=guidedDayKey(now);
    activity.days[key]=Math.min(999,(activity.days[key]??0)+1);
    target.setItem(GUIDED_ACTIVITY_KEY,JSON.stringify(activity));
    return true;
  }catch{return false;}
}
export function summarizeGuidedActivity(activity,now=new Date()){
  const clean=normalizedGuidedActivity(activity,now);
  const days=guidedCalendar(now).map(key=>({key,count:clean?.days[key]??0}));
  return {enabled:Boolean(clean),days,total:days.reduce((sum,day)=>sum+day.count,0),
    activeDays:days.filter(day=>day.count>0).length,today:days.at(-1)?.count??0};
}


/** One optional recommendation derived from existing local settings and
 * current-session feedback. No new history, streak, date storage, or timers.
 * When activity is disabled, never infer whether today's goal was completed.
 */
export function recommendDailyPractice(session,plan,activity,now=new Date()){
  const daily=summarizeGuidedActivity(activity,now);
  if(daily.enabled&&daily.today>0)return {kind:'done-today',today:daily.today};
  if(session?.focusRoutine?.status==='complete')return {kind:'done-session'};
  if(session?.focusRoutine)return {kind:'continue'};
  const saved=normalizeFocusPlan(plan);
  if(saved)return {kind:'saved',plan:saved};
  if(session?.status==='complete'&&session.keyReview?.keys?.length){
    const candidate=normalizeFocusPlan({pack:session.pack,seconds:session.seconds,goal:95,
      keys:session.keyReview.keys.map(row=>row.key)});
    if(candidate)return {kind:'review',keys:candidate.keys,pack:candidate.pack,seconds:candidate.seconds};
  }
  return {kind:'regular',pack:typeof session?.pack==='string'&&Object.hasOwn(PACKS,session.pack)?session.pack:'everyday',
    seconds:DURATIONS.includes(session?.seconds)?session.seconds:30};
}


/** Describe rolling practice milestones from the existing opt-in calendar.
 * These are not permanent achievements, skill grades, or daily streaks.
 * No extra storage, qualification rules or timing loop is required. */
const GUIDED_MILESTONES=Object.freeze([
  ['first-routine','First routine','total',1],
  ['three-days','Three practice days','activeDays',3],
  ['five-routines','Five routines','total',5],
  ['seven-days','Seven practice days','activeDays',7],
  ['ten-routines','Ten routines','total',10],
  ['fourteen-days','Fourteen practice days','activeDays',14],
]);
export function summarizeTrainingMilestones(activity,now=new Date()){
  const summary=summarizeGuidedActivity(activity,now);
  if(!summary.enabled)return null;
  const window=days=>({routines:days.reduce((sum,day)=>sum+day.count,0),
    activeDays:days.filter(day=>day.count>0).length,
    from:days[0]?.key??'',through:days.at(-1)?.key??''});
  const milestones=GUIDED_MILESTONES.map(([id,label,metric,target])=>({
    id,label,metric,target,value:summary[metric],reached:summary[metric]>=target
  }));
  return {milestones,reached:milestones.filter(item=>item.reached).length,
    recent:window(summary.days.slice(-7)),previous:window(summary.days.slice(-14,-7))};
}


/** Optional three-round challenge; never persist its attempts or outcomes.
 * Accuracy uses the exact submitted-position fraction, not rounded UI scores.
 * Each stage's timer remains the ordinary Speed Lab timer. */
export const ACCURACY_LADDER=Object.freeze([
 Object.freeze({name:'Warm-up',seconds:15,goal:90,minimum:20}),
 Object.freeze({name:'Precision',seconds:30,goal:95,minimum:40}),
 Object.freeze({name:'Endurance',seconds:60,goal:98,minimum:60})
]);
export function createAccuracyLadder(){return {stage:0,status:'ready'};}
export function retryAccuracyLadder(ladder){
 if(!ladder||!ACCURACY_LADDER[ladder.stage]||ladder.status==='complete')return createAccuracyLadder();
 return {stage:ladder.stage,status:'ready'};
}
export function nextAccuracyLadder(ladder){
 return ladder?.status==='passed'&&ladder.stage<ACCURACY_LADDER.length-1
  ?{stage:ladder.stage+1,status:'ready'}:null;
}
export function evaluateAccuracyLadder(ladder,metrics,interrupted=false){
 if(!ladder||ladder.status!=='ready'||!ACCURACY_LADDER[ladder.stage])return ladder;
 const stage=ACCURACY_LADDER[ladder.stage];
 if(interrupted)return {...ladder,status:'interrupted'};
 const {correct,characters}=metrics??{};
 if(!Number.isInteger(correct)||!Number.isInteger(characters)||correct<0||correct>characters||characters<stage.minimum)
  return {...ladder,status:'insufficient'};
 if(correct*100<stage.goal*characters)return {...ladder,status:'below-goal'};
 return {...ladder,status:ladder.stage===ACCURACY_LADDER.length-1?'complete':'passed'};
}


/** Five bounded waves; only remaining errors at completion consume budget. */
export const SURVIVAL_WAVES=Object.freeze([8,12,16,20,24]);
export const SURVIVAL_SECONDS=30;
export const SURVIVAL_BUDGET=5;
export function createSurvival(){return {wave:0,remaining:SURVIVAL_BUDGET,status:'ready'};}
export function restartSurvival(run){
 return run?.status==='interrupted'?{wave:run.wave,remaining:run.remaining,status:'ready'}:createSurvival();
}
export function nextSurvival(run){
 return run?.status==='passed'&&run.wave<SURVIVAL_WAVES.length-1
  ?{wave:run.wave+1,remaining:run.remaining,status:'ready'}:null;
}
export function evaluateSurvival(run,metrics,referenceLength,interrupted=false){
 if(!run||run.status!=='ready'||!Number.isInteger(run.wave)||!SURVIVAL_WAVES[run.wave])return run;
 if(interrupted)return {...run,status:'interrupted'};
 const {correct,characters}=metrics??{};
 if(!Number.isInteger(referenceLength)||referenceLength<1||!Number.isInteger(characters)
   ||characters!==referenceLength||!Number.isInteger(correct)||correct<0||correct>characters)
  return {...run,status:'timeout'};
 const remaining=run.remaining-(characters-correct);
 if(remaining<0)return {...run,remaining:0,status:'depleted'};
 return {...run,remaining,status:run.wave===SURVIVAL_WAVES.length-1?'complete':'passed'};
}

export function readAccuracyGoal(storage = globalThis.localStorage) {
  try {
    const value = Number(storage?.getItem(GOAL_KEY));
    return ACCURACY_GOALS.includes(value) ? value : 95;
  } catch { return 95; }
}
export function saveAccuracyGoal(value, storage = globalThis.localStorage) {
  const goal = Number(value);
  if (!ACCURACY_GOALS.includes(goal)) return false;
  try { storage.setItem(GOAL_KEY, String(goal)); return true; }
  catch { return false; }
}

export function summarizeSpeedPractice(history, session, goal = 95) {
  const mode = practiceMode(session), numpad = session.pack === 'numpad';
  const metric = numpad ? 'CPM' : 'WPM';
  const limit = numpad ? 30000 : 5000;
  const speed = run => Number(numpad ? run.cpm : run.wpm);
  // The history writer prepends new runs. Preserve that order even after
  // unrelated categories, durations or input modes are excluded.
  const matchingAll = (Array.isArray(history) ? history.slice(0,25) : [])
    .filter(run => run && run.pack === session.pack
      && Number(run.seconds) === Number(session.seconds)
      && practiceMode(run) === mode
      && Number.isFinite(speed(run)) && speed(run) >= 0 && speed(run) <= limit
      && Number.isFinite(Number(run.accuracy))
      && Number(run.accuracy) >= 0 && Number(run.accuracy) <= 100);
  const matching = matchingAll.slice(0, 5);
  const safeGoal = ACCURACY_GOALS.includes(Number(goal)) ? Number(goal) : 95;
  const empty = {
    count:0, matchingCount:0, metric, best:null, average:null, averageAccuracy:null,
    goalQualifiedBest:null, goalQualifiedCount:0,
    nextTarget:{kind:'start',speed:null},
    paceChange:null, goalStreak:0, recent:[],
    message:'Finish a run in this category, duration and input mode to start tracking progress.'
  };
  if (!matching.length) return empty;
  const scores = matching.map(speed);
  const avg = Math.round(scores.reduce((a,b) => a+b,0) / scores.length);
  const avgAccuracy = Math.round(matching.reduce((a,r) => a + Number(r.accuracy),0) / matching.length);
  // The recent trend uses five runs; the best earned at an accuracy goal
  // must include the complete saved 25-run window and exclude non-matches.
  const goalQualified = matchingAll.filter(run => Number(run.accuracy) >= safeGoal);
  const goalQualifiedBest = goalQualified.length ? Math.max(...goalQualified.map(speed)) : null;
  // A gentle next-session suggestion: recover accuracy first when the latest
  // comparable run missed the goal; only suggest a small pace increase after
  // a successful latest run. Never base an achievable next step on an older
  // lifetime best, another input mode, or a score outside saved history.
  const newest=matching[0];
  const step=numpad ? 5 : 2;
  const latestSpeed=speed(newest);
  const nextTarget=Number(newest.accuracy)<safeGoal
    ? {kind:'accuracy',speed:null}
    : latestSpeed+step>limit
      ? {kind:'maintain',speed:Math.round(latestSpeed)}
      : {kind:'pace',speed:Math.ceil(latestSpeed)+step};
  // A streak starts at the most recent run and stops at the first miss.
  const goalStreak = matching.findIndex(run => Number(run.accuracy) < safeGoal);
  // Preserve the exact metric used by this pack, with the oldest at left.
  const recent = matching.slice().reverse().map(run => ({
    speed:speed(run), accuracy:Number(run.accuracy),
    metGoal:Number(run.accuracy) >= safeGoal
  }));
  const paceChange = scores.length >= 2
    ? Math.round(scores[0] - scores[1]) : null;
  let message;
  if(avgAccuracy < safeGoal){
    message = 'Focus on accuracy before speed. Slow down slightly, then repeat this drill.';
  } else if(matching.length < 3){
    message = 'Accuracy goal reached. Complete a few more comparable runs to reveal a trend.';
  } else if(scores[0] > scores[scores.length - 1]){
    message = 'Your latest speed is above the oldest comparable run. Keep the rhythm going.';
  } else {
    message = 'Accuracy is on target. Repeat this drill steadily before increasing pace.';
  }
  return {
    count:matching.length, matchingCount:matchingAll.length, metric,
    best:Math.max(...scores), average:avg, averageAccuracy:avgAccuracy,
    goalQualifiedBest, goalQualifiedCount:goalQualified.length, nextTarget,
    paceChange, goalStreak:goalStreak < 0 ? matching.length : goalStreak,
    recent, message,
  };
}


/** Device-local, rolling seven-calendar-day activity for saved Speed Lab runs.
 * This is a modest practice indicator, NOT a streak or lifetime count:
 * only the most recent 25 saved results exist; interrupted/unsaved runs
 * and older entries without a timestamp cannot be reconstructed.
 * All input modes count as sessions without mixing their speed metrics.
 */
export function summarizeSpeedActivity(history, now = new Date()) {
  const today=now instanceof Date?new Date(now.getTime()):new Date(NaN);
  const validNow=Number.isFinite(today.getTime())?today:new Date();
  const rows=Array.isArray(history)?history.slice(0,25):[];
  const days=Array.from({length:7},(_,i)=>{
    const day=new Date(validNow.getFullYear(),validNow.getMonth(),validNow.getDate()-(6-i),12);
    const key=`${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
    return {key,label:['SUN','MON','TUE','WED','THU','FRI','SAT'][day.getDay()],
      dateLabel:`${day.getMonth()+1}/${day.getDate()}`,count:0};
  });
  const byDay=new Map(days.map(day=>[day.key,day]));
  let undated=0;
  for(const run of rows){
    if(!run||typeof run.at!=='string'){
      undated++;continue;
    }
    const time=Date.parse(run.at);
    if(!Number.isFinite(time)||time>validNow.getTime()){
      undated++;continue;
    }
    const date=new Date(time);
    const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const day=byDay.get(key);
    if(day)day.count++;
  }
  return {
    days,
    activeDays:days.filter(day=>day.count>0).length,
    savedRuns:days.reduce((sum,day)=>sum+day.count,0),
    undated,
    capped:rows.length===25,
  };
}

export function exportSpeedResults(history = readSpeedHistory(), now = new Date()) {
  return {
    format:'keystoria.speed.history',
    version:1,
    exportedAt:now.toISOString(),
    maxStoredResults:25,
    records:history,
  };
}

export function clearSpeedResults(storage = globalThis.localStorage) {
  try { storage.removeItem(RESULTS_KEY); return true; }
  catch { return false; }
}


// Restore data is external input, even when it was exported by this site.
// Validate the entire file before presenting the destructive replace prompt.
export const SPEED_IMPORT_MAX_BYTES = 128 * 1024;
const IMPORT_MODES = new Set(['mobile-assisted', 'mobile-exact', 'standard-exact']);
const IMPORT_NUMERIC_LIMITS = Object.freeze({
  wpm:5000, rawWpm:5000, cpm:30000, rawCpm:30000,
  accuracy:100, correct:50000, incorrect:50000,
  characters:50000, keystrokes:50000,
});

function validImportedRun(run) {
  if (!run || typeof run !== 'object' || Array.isArray(run)) return false;
  if (!Object.hasOwn(PACKS, run.pack) || !DURATIONS.includes(run.seconds)) return false;
  if (!Number.isFinite(run.wpm) || run.wpm < 0 || run.wpm > 5000) return false;
  if (!Number.isFinite(run.accuracy) || run.accuracy < 0 || run.accuracy > 100) return false;
  if (run.pack === 'numpad' && (!Number.isFinite(run.cpm) || run.cpm < 0 || run.cpm > 30000)) return false;
  for (const [name,maximum] of Object.entries(IMPORT_NUMERIC_LIMITS)) {
    if (!Object.hasOwn(run,name)) continue;
    const value=run[name];
    if (!Number.isFinite(value) || value < 0 || value > maximum) return false;
    if (['correct','incorrect','characters','keystrokes'].includes(name) && !Number.isInteger(value)) return false;
  }
  if (run.practiceMode !== undefined && !IMPORT_MODES.has(run.practiceMode)) return false;
  if (run.keyboardAssisted !== undefined && typeof run.keyboardAssisted !== 'boolean') return false;
  if (run.at !== undefined && (typeof run.at !== 'string' || run.at.length > 40 || !Number.isFinite(Date.parse(run.at)))) return false;
  return true;
}

export function parseSpeedHistoryExport(json) {
  if (typeof json !== 'string' || json.length > SPEED_IMPORT_MAX_BYTES
      || new TextEncoder().encode(json).byteLength > SPEED_IMPORT_MAX_BYTES) {
    throw new Error('Import file exceeds the 128 KB safety limit.');
  }
  let payload;
  try { payload=JSON.parse(json); }
  catch { throw new Error('That file is not valid JSON.'); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)
      || payload.format !== 'keystoria.speed.history' || payload.version !== 1
      || !Array.isArray(payload.records)) {
    throw new Error('Use a Keystoria Speed Lab version 1 JSON export.');
  }
  if (payload.records.length > 25) throw new Error('The export exceeds the 25-result history limit.');
  const clean=[];
  for (const run of payload.records) {
    if (!validImportedRun(run)) throw new Error('The export includes an invalid Speed Lab result.');
    const record={pack:run.pack,seconds:run.seconds,wpm:run.wpm,accuracy:run.accuracy};
    for (const name of Object.keys(IMPORT_NUMERIC_LIMITS)) {
      if (name==='wpm' || name==='accuracy') continue;
      if (Object.hasOwn(run,name)) record[name]=run[name];
    }
    for (const name of ['practiceMode','keyboardAssisted','at']) {
      if (Object.hasOwn(run,name)) record[name]=run[name];
    }
    clean.push(record);
  }
  return clean;
}

export function restoreSpeedHistory(records, storage = globalThis.localStorage) {
  if (!Array.isArray(records) || records.length > 25 || records.some(run => !validImportedRun(run))) return false;
  try { storage.setItem(RESULTS_KEY,JSON.stringify(records)); return true; }
  catch { return false; }
}
