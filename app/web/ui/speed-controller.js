/** Lifecycle for the optional local typing test.
 *
 * This controller owns its one timer and never reaches the multiplayer socket.
 * Story missions can continue to evolve independently of personal training.
 */
import { DURATIONS, PACKS, createWordStream, scoreSpeedRun, saveSpeedResult } from './speed-engine.js';
import { createSpeedFlow } from './speed-flow.js';

const node = id => document.getElementById(id);
const text = (id, value) => { const element=node(id); if (element) element.textContent=value; };

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
    state.speed={
      pack:selectedPack,
      seconds:DURATIONS.includes(seconds) ? seconds : 30,
      reference:createWordStream(selectedPack),
      typed:'',startedAt:null,status:'idle',keystrokes:0,result:null,
    };
    onRender();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(()=>{
      const field=node('speed-input');
      if (!field || !field.isConnected) return;
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
    if (!flow) flow=createSpeedFlow(node('speed-letters'),session.reference);
    flow?.update(session.typed);
    text('speed-progress',session.pack==='numpad'?`${session.typed.replace(/\s/g,'').length} digits typed`:`${session.typed.length} characters typed`);
    text('speed-time',String(Math.max(0,Math.ceil(session.seconds-seconds))));
    text('speed-wpm',String(seconds ? (session.pack==='numpad'?Math.round(metrics.correct/Math.max(1,seconds)*60):metrics.wpm) : 0));
    text('speed-accuracy',`${metrics.accuracy}%`);
    text('speed-raw',String(seconds ? (session.pack==='numpad'?Math.round(metrics.characters/Math.max(1,seconds)*60):metrics.rawWpm) : 0));
    text('speed-mode',session.status === 'running' ? 'SESSION LIVE' : 'TIMER STARTS WHEN YOU TYPE');
  }

  function finish() {
    const session=state.speed;
    if (!session || session.status==='complete') return;
    clearTimer();
    const metrics=scoreSpeedRun(session.reference,session.typed,session.seconds,session.keystrokes);
    session.result={
      ...metrics,cpm:Math.round(metrics.correct/session.seconds*60),
      rawCpm:Math.round(metrics.characters/session.seconds*60),
      pack:session.pack,seconds:session.seconds,at:new Date().toISOString(),
    };
    session.status='complete';
    saveSpeedResult(session.result);
    playSound('success');
    onRender();
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
      interval=setInterval(tick,100);
    }
    paint();
    if (session.typed.length===session.reference.length) finish();
  }

  function keystroke() {
    if (state.speed?.status==='running' || state.speed?.status==='idle') state.speed.keystrokes++;
  }

  return {open,close,paint,input,keystroke,finish,tick};
}
