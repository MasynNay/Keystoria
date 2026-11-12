/** Lifecycle for the optional local typing test.
 *
 * This controller owns its one timer and never reaches the multiplayer socket.
 * Story missions can continue to evolve independently of personal training.
 */
import { DURATIONS, PACKS, createWordStream, scoreSpeedRun, saveSpeedResult } from './speed-engine.js';
import { createSpeedFlow } from './speed-flow.js?v=0.27.1';
import { nextSpeedCue } from './mobile-typing.js';

const node = id => document.getElementById(id);
const text = (id, value) => { const element=node(id); if (element && element.textContent!==String(value)) element.textContent=value; };
const ASSIST_PREF_KEY='keystoria.speed.nativeKeyboardAssist.v1';
const preferredAssist=()=>{
  try {return localStorage.getItem(ASSIST_PREF_KEY)!=='off';}
  catch {return true;}
};
const storeAssist=enabled=>{try {localStorage.setItem(ASSIST_PREF_KEY,enabled?'on':'off');}catch{/* Optional storage */}};
function updateNativeKeyboard(field,enabled){
  if(!field)return;
  field.spellcheck=enabled;
  field.setAttribute('spellcheck',String(enabled));
  field.setAttribute('autocorrect',enabled?'on':'off');
  field.setAttribute('autocomplete',enabled?'on':'off');
  field.setAttribute('autocapitalize','off');
}

export function createSpeedController({ state, onRender, playSound }) {
  let interval=null;
  let flow=null;

  function clearTimer() {
    if (interval !== null) clearInterval(interval);
    interval=null;
  }

  function open({ pack='everyday', seconds=30 } = {}) {
    const enteringFromAnotherMode=!state.speed;
    clearTimer();
    flow=null;
    const selectedPack=PACKS[pack] ? pack : 'everyday';
    const phoneLayout=window.matchMedia?.('(max-width: 760px)').matches ?? false;
    const keyboardAssist=phoneLayout && selectedPack!=='numpad' && preferredAssist();
    state.speed={
      pack:selectedPack,
      seconds:DURATIONS.includes(seconds) ? seconds : 30,
      reference:createWordStream(selectedPack),
      typed:'',startedAt:null,status:'idle',keystrokes:0,result:null,
      keyboardAssist,keyboardAssistedEver:keyboardAssist,phoneLayout,
    };
    onRender();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(()=>{
      const field=node('speed-input');
      if (!field || !field.isConnected) return;
      updateNativeKeyboard(field,state.speed?.keyboardAssist===true);
      if(enteringFromAnotherMode) window.scrollTo({top:0,behavior:"instant"});
      field.focus({preventScroll:true});
    });
  }

  function close() {
    clearTimer();
    flow=null;
    state.speed=null;
    onRender();
  }

  function elapsed() {
    const session=state.speed;
    return session?.startedAt == null ? 0 : Math.min(session.seconds,(performance.now()-session.startedAt)/1000);
  }

  function paint() {
    const session=state.speed;
    if (!session || session.status==='complete') return;
    const seconds=elapsed();
    const metrics=scoreSpeedRun(session.reference,session.typed,Math.max(1,seconds),session.keystrokes);
    // Mount the passage once; only letter classes and vertical scroll update.
    const mobile=window.matchMedia?.('(max-width: 760px)').matches ?? false;
    if (!flow || flow.windowed !== mobile)
      flow=createSpeedFlow(node('speed-letters'),session.reference,{windowed:mobile});
    flow?.update(session.typed);
    const cue=nextSpeedCue(session.reference,session.typed);
    text('speed-mobile-first',cue.next===' ' ? '␣' : cue.next);
    text('speed-mobile-rest',cue.rest.replace(/ /g,'·'));
    text('speed-progress',session.pack==='numpad'?`${session.typed.replace(/\s/g,'').length} digits typed`:`${session.typed.length} characters typed`);
    text('speed-time',String(Math.max(0,Math.ceil(session.seconds-seconds))));
    text('speed-wpm',String(seconds ? (session.pack==='numpad'?Math.round(session.typed.split('').filter((ch,i)=>ch>='0'&&ch<='9'&&ch===session.reference[i]).length/Math.max(1,seconds)*60):metrics.wpm) : 0));
    text('speed-accuracy',`${metrics.accuracy}%`);
    text('speed-raw',String(seconds ? (session.pack==='numpad'?Math.round(session.typed.replace(/[^0-9]/g,'').length/Math.max(1,seconds)*60):metrics.rawWpm) : 0));
    text('speed-mode',session.status === 'running' ? 'SESSION LIVE' : 'TIMER STARTS WHEN YOU TYPE');
  }

  function finish() {
    const session=state.speed;
    if (!session || session.status==='complete') return;
    clearTimer();
    const metrics=scoreSpeedRun(session.reference,session.typed,session.seconds,session.keystrokes);
    session.result={
      ...metrics,cpm:Math.round(session.typed.split('').filter((ch,i)=>ch>='0'&&ch<='9'&&ch===session.reference[i]).length/session.seconds*60),
      rawCpm:Math.round(session.typed.replace(/[^0-9]/g,'').length/session.seconds*60),
      pack:session.pack,seconds:session.seconds,at:new Date().toISOString(),
      keyboardAssisted:session.keyboardAssistedEver===true,
      practiceMode:session.phoneLayout ? (session.keyboardAssistedEver?'mobile-assisted':'mobile-exact') : 'standard-exact',
    };
    session.status='complete';
    saveSpeedResult(session.result);
    playSound('success');
    onRender();
    requestAnimationFrame(()=>node('speed-results-heading')?.focus({preventScroll:true}));
  }

  function tick() {
    if (state.speed?.status !== 'running') return;
    if (elapsed() >= state.speed.seconds) finish();
    else paint();
  }

  function input(value) {
    const session=state.speed;
    if (!session || session.status==='complete') return;
    session.typed=(session.pack==='numpad'?value.replace(/[^0-9 ]/g,''):value.replace(/[\r\n]/g,'')).slice(0,session.reference.length);
    const field=node('speed-input');
    if (field && field.value!==session.typed) field.value=session.typed;
    if (session.status==='idle' && session.typed.length) {
      session.startedAt=performance.now();
      session.status='running';
      clearTimer();
      interval=setInterval(tick,250);
    }
    paint();
    if (session.typed.length===session.reference.length) finish();
  }

  /** Mobile separator stays a real input character, included in accuracy. */
  function insertSpace(){
    const session=state.speed;
    if(!session||session.status==='complete'||session.typed.length>=session.reference.length)return;
    session.keystrokes++;
    input(session.typed+' ');
    const field=node('speed-input');
    if(field&&!field.disabled)field.focus({preventScroll:true});
  }

  /** Toggle phone native predictions without detaching the focused field.
   * A score stays marked assisted if predictions were enabled at any point.
   */
  function toggleKeyboardAssist(){
    const session=state.speed;
    if(!session||!session.phoneLayout||session.pack==='numpad'||session.status==='complete')return;
    session.keyboardAssist=!session.keyboardAssist;
    if(session.keyboardAssist)session.keyboardAssistedEver=true;
    storeAssist(session.keyboardAssist);
    const field=node('speed-input');
    updateNativeKeyboard(field,session.keyboardAssist);
    const button=node('speed-assist-toggle');
    if(button){
      button.textContent=session.keyboardAssist?'KEYBOARD HELP: ON':'KEYBOARD HELP: OFF';
      button.setAttribute('aria-pressed',String(session.keyboardAssist));
    }
    text('speed-assist-detail',session.keyboardAssist
      ? 'Phone predictions and autocorrect allowed. Score marked Assisted; suggestions depend on your keyboard settings.'
      : 'Exact typing. No automatic corrections requested; this score stays Assisted if help was used.');
    if(field&&!field.disabled)field.focus({preventScroll:true});
  }

  function keystroke() {
    if (state.speed?.status==='running' || state.speed?.status==='idle') state.speed.keystrokes++;
  }

  return {open,close,paint,input,keystroke,insertSpace,toggleKeyboardAssist,finish,tick};
}
