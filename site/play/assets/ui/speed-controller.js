/** Lifecycle for the optional local typing test.
 *
 * This controller owns its one timer and never reaches the multiplayer socket.
 * Story missions can continue to evolve independently of personal training.
 */
import { DURATIONS, PACKS, createWordStream, scoreSpeedRun, createIncrementalSpeedScorer, saveSpeedResult } from './speed-engine.js?v=0.40.1';
import { createSpeedFlow } from './speed-flow.js?v=0.41.4';
import { reviewSpeedKeys, createFocusedSpeedDrill, summarizeFocusedAttempt, sameFocusScope, readAccuracyGoal, createFocusRoutine, advanceFocusRoutine, normalizeFocusPlan, recordGuidedCompletion, ACCURACY_LADDER, createAccuracyLadder, retryAccuracyLadder, nextAccuracyLadder, evaluateAccuracyLadder } from './speed-insights.js?v=0.48.12';
import { MOBILE_TYPING_MEDIA, nextSpeedCue, previousWordRange, speedSpokenTarget, speedFocusWord, paintSpeedFocusWord } from './mobile-typing.js?v=0.50.1';

const node = id => document.getElementById(id);
const text = (id, value) => { const element=node(id); if (element && element.textContent!==String(value)) element.textContent=value; };
const ASSIST_PREF_KEY='keystoria.speed.nativeKeyboardAssist.v1';
const FOCUS_PREF_KEY='keystoria.speed.wordFocus.v1';
const preferredFocus=()=>{try{return localStorage.getItem(FOCUS_PREF_KEY)==='on';}catch{return false;}};
const storeFocus=enabled=>{try{localStorage.setItem(FOCUS_PREF_KEY,enabled?'on':'off');}catch{/* optional */}};
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
  let focusFrame=null;
  let focusWordSignature=null;
  // Mobile browsers often deliver select + selectionchange after one input.
  // Skip duplicate guidance only when session, field, renderer, text, caret,
  // and Word Focus presentation are genuinely unchanged.
  let lastGuidance=null;
  // Time-only ticks must not re-score a full passage or re-render the caret.
  // Invalidate on text edits (including middle edits, IME commits, Back Word)
  // and on every newly created session. Timer math still uses live elapsed time.
  let scoreSession=null, scoreText=null, scoreSnapshot=null, incrementalScorer=null;
  function releaseLiveScore(){
    scoreSession=null;scoreText=null;scoreSnapshot=null;incrementalScorer=null;
  }
  function liveScore(session) {
    if (scoreSession!==session){
      // Rebuild for a new generated passage; old session text isn't retained.
      incrementalScorer=createIncrementalSpeedScorer(session.reference,{numpad:session.pack==='numpad'});
      scoreSession=session;
      scoreText=null;
    }
    if (scoreText!==session.typed) {
      scoreSnapshot=incrementalScorer.update(session.typed);
      scoreText=session.typed;
    }
    return scoreSnapshot;
  }

  function cancelPendingFocus() {
    // An earlier Speed Lab launch must not steal focus from the next button
    // while Enter/Space is still activating a freshly rendered choice.
    if(focusFrame!==null && typeof cancelAnimationFrame==='function')
      cancelAnimationFrame(focusFrame);
    focusFrame=null;
  }

  function clearTimer() {
    if (interval !== null) clearInterval(interval);
    interval=null;
  }

  function open({ pack='everyday', seconds=30, focusChoice=null, targetKeys=[], guidedGoal=null, keepRoutine=false, accuracyLadder=null } = {}) {
    const enteringFromAnotherMode=!state.speed;
    const leavingResults=state.speed?.status==='complete';
    const priorSession=state.speed;
    cancelPendingFocus();
    clearTimer();
    flow?.dispose?.();
    flow=null;
    releaseLiveScore();
    focusWordSignature=null;
    lastGuidance=null;
    const selectedPack=Object.hasOwn(PACKS,pack) ? pack : 'everyday';
    if(accuracyLadder){seconds=ACCURACY_LADDER[accuracyLadder.stage].seconds;targetKeys=[];guidedGoal=null;keepRoutine=false;}
    const focusedDrill=createFocusedSpeedDrill(selectedPack,targetKeys);
    const compact=window.matchMedia?.(MOBILE_TYPING_MEDIA).matches ?? false;
    // Browser zoom can shrink a mouse desktop to 320 CSS pixels. Keep the
    // fast compact renderer, but never request phone autocorrect or label
    // physical-keyboard scores as Assisted unless the primary pointer is touch.
    const phoneLayout=compact && (window.matchMedia?.('(pointer: coarse)').matches ?? false);
    const keyboardAssist=phoneLayout && selectedPack!=='numpad' && preferredAssist();
    const scope={pack:selectedPack,seconds:DURATIONS.includes(seconds)?seconds:30,keys:focusedDrill?.keys??[]};
    // Keep only the last eligible summary in an unchanged focused drill.
    // A canceled/interrupted attempt does not replace a valid baseline.
    const candidate=priorSession?.focusAttempt&&!priorSession.focusAttempt.interrupted
      ?priorSession.focusAttempt:priorSession?.previousFocusAttempt;
    const previousFocusAttempt=scope.keys.length&&guidedGoal===null&&sameFocusScope(scope,candidate)?candidate:null;
    // Routine state is tied to the exact ordered keys, category and timer.
    const priorScope=priorSession&&{pack:priorSession.pack,seconds:priorSession.seconds,keys:priorSession.targetKeys??[]};
    const routine=scope.keys.length?(guidedGoal!==null?createFocusRoutine(guidedGoal)
      :keepRoutine&&sameFocusScope(scope,priorScope)?priorSession.focusRoutine??null:null):null;
    state.speed={
      pack:selectedPack,
      seconds:DURATIONS.includes(seconds) ? seconds : 30,
      reference:focusedDrill?.reference??createWordStream(selectedPack),
      targetKeys:focusedDrill?.keys??[],previousFocusAttempt,focusRoutine:routine,accuracyLadder,
      typed:'',startedAt:null,pausedAt:null,interrupted:false,status:'idle',keystrokes:0,result:null,
      keyboardAssist,keyboardAssistedEver:keyboardAssist,phoneLayout,
      focusPractice:phoneLayout && preferredFocus(),
    };
    const launchedSession=state.speed;
    onRender();
    const focusFreshSession=()=>{
      if(state.speed!==launchedSession)return;
      const field=node('speed-input');
      if(!field || !field.isConnected)return;
      updateNativeKeyboard(field,launchedSession.keyboardAssist===true);
      // Keep the newly selected category/duration focused for hardware
      // keyboard users. Pointer taps continue directly into the typing field.
      const choice=focusChoice==='speed-pack'
        ? document.querySelector('[data-action="speed-pack"][data-pack="'+launchedSession.pack+'"]')
        : focusChoice==='speed-duration'
          ? document.querySelector('[data-action="speed-duration"][data-seconds="'+launchedSession.seconds+'"]')
          : null;
      (choice||field).focus({preventScroll:!(!choice&&focusedDrill&&(leavingResults||guidedGoal!==null))});
    };
    if(enteringFromAnotherMode && typeof requestAnimationFrame==='function'){
      focusFrame=requestAnimationFrame(()=>{
        focusFrame=null;
        if(state.speed!==launchedSession)return;
        window.scrollTo({top:0,behavior:'instant'});
        focusFreshSession();
      });
    }else{
      // The DOM is already rebuilt synchronously by onRender. Never schedule
      // a second focus jump that can interrupt a quick Enter/Space press.
      focusFreshSession();
    }
  }

  // Only the current completed result can authorize a follow-up drill.
  // The previous draft and key review never enter browser storage.
  function startTargeted({guided=false}={}) {
    const session=state.speed;
    if(session?.status!=='complete'||session.accuracyLadder||!session.keyReview?.keys.length)return;
    open({pack:session.pack,seconds:session.seconds,targetKeys:session.keyReview.keys.map(row=>row.key),guidedGoal:guided?readAccuracyGoal():null});
  }

  function launchFocusPlan(value) {
    const plan=normalizeFocusPlan(value);
    if(!plan||!state.speed||!['idle','complete'].includes(state.speed.status))return false;
    open({pack:plan.pack,seconds:plan.seconds,targetKeys:plan.keys,guidedGoal:plan.goal});
    return true;
  }

  function launchAccuracyLadder(){
    const session=state.speed;
    if(!session||!['idle','complete'].includes(session.status)||session.accuracyLadder)return false;
    open({pack:session.pack,accuracyLadder:createAccuracyLadder()});
    return true;
  }

  function advanceAccuracyLadder(){
    const session=state.speed;
    if(session?.status!=='complete')return false;
    const ladder=nextAccuracyLadder(session.accuracyLadder);
    if(!ladder)return false;
    open({pack:session.pack,accuracyLadder:ladder});
    return true;
  }

  function restart({regular=false}={}) {
    const session=state.speed;
    if(!session)return;
    if(session.accuracyLadder&&!regular){open({pack:session.pack,accuracyLadder:retryAccuracyLadder(session.accuracyLadder)});return;}
    open({pack:session.pack,seconds:session.seconds,targetKeys:regular?[]:session.targetKeys,keepRoutine:!regular});
  }

  function close() {
    cancelPendingFocus();
    clearTimer();
    flow?.dispose?.();
    flow=null;
    releaseLiveScore();
    focusWordSignature=null;
    lastGuidance=null;
    state.speed=null;
    onRender();
  }

  function elapsed() {
    const session=state.speed;
    return session?.startedAt == null ? 0
      : Math.min(session.seconds,((session.pausedAt ?? performance.now())-session.startedAt)/1000);
  }

  /** Follow the native editing caret in both the visual next-key cue and
   * spoken word/group status. Selection changes never rescore, rerender
   * the passage, or detach the user's focused mobile textarea.
   */
  function updateCaretGuidance() {
    const session=state.speed;
    const field=node('speed-input');
    if(!session || session.status==='complete' || !field || !field.isConnected)return;
    const caret=Number.isInteger(field.selectionStart)?field.selectionStart:session.typed.length;
    const previous=lastGuidance;
    if(previous?.session===session && previous.field===field
       && previous.flow===flow && previous.typed===session.typed
       && previous.caret===caret && previous.wordFocus===session.focusPractice)return;
    // The controller already scores the same input for the live accuracy
    // label. Supply that exact value to the passage renderer instead of
    // rescanning the entire typed prefix for its data-accuracy attribute.
    flow?.update(session.typed,caret,liveScore(session).accuracy);
    const cue=nextSpeedCue(session.reference,session.typed,38,caret);
    text('speed-mobile-first',cue.next===' ' ? '␣' : cue.next);
    text('speed-mobile-rest',cue.rest.replace(/ /g,'·'));
    // Repaint a single bounded word only if its characters/caret changed.
    // Neither the textarea, timer, score nor full passage is reconstructed.
    if(session.focusPractice){
      const target=node('speed-focus-word');
      if(target){
        const focus=speedFocusWord(session.reference,session.typed,caret);
        // Two separate occurrences of the same word may produce identical
        // character classes. Include the reference position so moving between
        // them cannot skip the painter and reuse the old word's nodes.
        const signature=JSON.stringify([focus.start,focus.word,focus.characters]);
        if(signature!==focusWordSignature){
          paintSpeedFocusWord(target,focus);
          focusWordSignature=signature;
        }
      }
    }
    // Only change this live region if the whole word/group changed.
    text('speed-screenreader-target',
      speedSpokenTarget(session.reference,session.typed,session.pack==='numpad',caret));
    lastGuidance={session,field,flow,typed:session.typed,caret,wordFocus:session.focusPractice};
  }

  function paint() {
    const session=state.speed;
    if (!session || session.status==='complete') return;
    const seconds=elapsed();
    const contentChanged=scoreSession!==session || scoreText!==session.typed;
    const metrics=liveScore(session);
    // Mount the passage once; only letter classes and vertical scroll update.
    const mobile=window.matchMedia?.(MOBILE_TYPING_MEDIA).matches ?? false;
    const flowChanged=!flow || flow.windowed!==mobile;
    if(flowChanged){
      flow?.dispose?.();
      flow=createSpeedFlow(node('speed-letters'),session.reference,{windowed:mobile});
    }
    // A quarter-second timer tick changes only the clock and speed numbers.
    // Caret, spoken cues and progress repaint only after edits, selection
    // events, or a responsive renderer change; keyboard focus stays mounted.
    if(contentChanged || flowChanged)updateCaretGuidance();
    if(contentChanged)text('speed-progress',session.pack==='numpad'?
      `${metrics.rawDigits} digits typed`:`${metrics.characters} characters typed`);
    text('speed-time',String(Math.max(0,Math.ceil(session.seconds-seconds))));
    const duration=Math.max(1,seconds);
    text('speed-wpm',String(seconds ? (session.pack==='numpad'?
      Math.round(metrics.correctDigits/duration*60):
      Math.round(metrics.correct/5/(duration/60))) : 0));
    text('speed-accuracy',`${metrics.accuracy}%`);
    text('speed-raw',String(seconds ? (session.pack==='numpad'?
      Math.round(metrics.rawDigits/duration*60):
      Math.round(metrics.characters/5/(duration/60))) : 0));
    // Both the thumb action and desktop control track the same live state.
    // A paused or not-yet-started run cannot be paused again.
    const pauseDisabled=session.status!=='running';
    document.querySelectorAll('[data-action="speed-pause"]').forEach(button=>{
      // A native form-control setter can reflect the disabled attribute.
      // Avoid attribute churn on 250ms timer ticks once the state is stable.
      if(button.disabled!==pauseDisabled)button.disabled=pauseDisabled;
    });
    text('speed-mode',session.status === 'paused' ? 'PAUSED · RESUME TO CONTINUE'
      : session.status === 'running' ? 'SESSION LIVE' : 'TIMER STARTS WHEN YOU TYPE');
  }

  /** Stop a running clock when the tab becomes hidden. A resumed exercise
   * remains available for practice, but cannot become a comparable record.
   * No input DOM is replaced, so typed characters and caret survive.
   */
  function pauseForInterruption() {
    const session=state.speed;
    if(!session || session.status!=='running')return;
    const now=performance.now();
    if((now-session.startedAt)/1000>=session.seconds){finish();return;}
    session.pausedAt=now;
    session.interrupted=true;
    session.status='paused';
    clearTimer();
    const field=node('speed-input');
    if(field)field.readOnly=true;
    const banner=node('speed-pause-banner');
    if(banner)banner.hidden=false;
    paint();
  }

  /** Intentional breaks use the same safe clock-freeze and practice-only
   * record policy as background interruptions. Never create a second timer.
   * Focus the newly shown Resume button for keyboard accessibility.
   */
  function pauseManually() {
    if(document.hidden || state.speed?.status!=='running')return;
    pauseForInterruption();
    if(state.speed?.status==='paused')
      node('speed-pause-banner')?.querySelector('[data-action="speed-resume"]')
        ?.focus(); // Let the browser reveal the focused button to keyboard users.
  }

  /** Only the player can resume a backgrounded run. Paused wall-clock time
   * is excluded without rewriting the scoring or stored-result formats.
   */
  function resume() {
    const session=state.speed;
    if(!session || session.status!=='paused' || document.hidden)return;
    session.startedAt+=performance.now()-session.pausedAt;
    session.pausedAt=null;
    session.status='running';
    const field=node('speed-input');
    if(field)field.readOnly=false;
    const banner=node('speed-pause-banner');
    if(banner)banner.hidden=true;
    clearTimer();
    interval=setInterval(tick,250);
    paint();
    if(field?.isConnected)field.focus({preventScroll:true});
  }

  function onVisibilityChange() {
    if(document.hidden)pauseForInterruption();
    // Returning to a visible tab must NOT restart the clock on its own.
  }

  // BFCache navigation can preserve the page without a document.hidden event.
  // Treat pagehide as an interruption even if the tab is still technically
  // visible. The existing paused state makes duplicate events idempotent.
  function onPageHide() {
    pauseForInterruption();
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
    // The private learning recap is computed once, after the clock stops.
    // Keep it separate from the persisted/exported result object.
    session.keyReview=reviewSpeedKeys(session.reference,session.typed,{numpad:session.pack==='numpad'});
    session.focusAttempt=summarizeFocusedAttempt(session);
    const previousRoutine=session.focusRoutine;
    session.focusRoutine=advanceFocusRoutine(previousRoutine,session.focusAttempt);
    recordGuidedCompletion(previousRoutine,session.focusRoutine);
    session.accuracyLadder=evaluateAccuracyLadder(session.accuracyLadder,metrics,session.interrupted);
    session.status='complete';
    // Background pauses make timed scores non-comparable; never persist them
    // or include them in personal best / Practice Compass calculations.
    if(!session.interrupted&&!session.targetKeys?.length&&!session.accuracyLadder)saveSpeedResult(session.result);
    releaseLiveScore(); // Drop transient previous input after final scoring.
    playSound('success');
    onRender();
    requestAnimationFrame(()=>node('speed-results-heading')?.focus({preventScroll:true}));
  }

  function tick() {
    if (state.speed?.status !== 'running') return;
    if (document.hidden){pauseForInterruption();return;}
    if (elapsed() >= state.speed.seconds) finish();
    else paint();
  }

  function input(value) {
    const session=state.speed;
    if (!session || session.status==='complete') return;
    if(session.status==='paused'){
      const pausedField=node('speed-input');
      if(pausedField && pausedField.value!==session.typed)pausedField.value=session.typed;
      return;
    }
    if(document.hidden){pauseForInterruption();return;}
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

  /** Insert a real separator at the textarea selection, like a physical Space.
   * A phone player may return to an earlier word or number group to correct it.
   */
  function insertSpace(){
    const session=state.speed;
    const field=node('speed-input');
    if(!session||session.status==='complete'||session.status==='paused'||document.hidden||!field||field.disabled)return;
    const start=Number.isInteger(field.selectionStart)?field.selectionStart:field.value.length;
    const end=Number.isInteger(field.selectionEnd)?field.selectionEnd:start;
    // Replacing selected text is allowed at the reference limit; overflowing is not.
    if(field.value.length-(end-start)+1>session.reference.length)return;
    field.setRangeText(' ',start,end,'end');
    session.keystrokes++;
    input(field.value);
    if(field.isConnected&&!field.disabled)field.focus({preventScroll:true});
  }


  /** Correct an entire preceding word or number group without restarting the
   * exercise. Keep text after the caret and the same native input element, so
   * the software keyboard can remain open when a touch action is used.
   */
  function backWord(){
    const session=state.speed,field=node('speed-input');
    if(!session||session.status==='complete'||session.status==='paused'||document.hidden||!field||field.disabled)return;
    const {start,end}=previousWordRange(field.value,field.selectionStart,field.selectionEnd);
    if(start!==end){
      field.setRangeText('',start,end,'start');
      session.keystrokes++;
      input(field.value);
    }
    if(field.isConnected&&!field.disabled)field.focus({preventScroll:true});
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

  /** Touch-only presentation switch; not a new score/timing mode. */
  function toggleWordFocus(){
    const session=state.speed;
    if(!session || session.status==='complete')return;
    // Responsive touch layouts can become compact after rotation. Guard the
    // currently visible control, not only the layout at session launch.
    const touch=window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const compact=window.matchMedia?.(MOBILE_TYPING_MEDIA).matches ?? false;
    if(!touch || !compact)return;
    session.focusPractice=!session.focusPractice;
    storeFocus(session.focusPractice);
    focusWordSignature=null;
    const panel=document.querySelector('.speed-page');
    if(panel)panel.dataset.wordFocus=String(session.focusPractice);
    const button=node('speed-focus-toggle');
    if(button){
      button.textContent=session.focusPractice?'WORD FOCUS: ON':'WORD FOCUS: OFF';
      button.setAttribute('aria-pressed',String(session.focusPractice));
    }
    text('speed-focus-detail',session.focusPractice
      ? 'One word or number group at a time. The full passage and scoring stay unchanged.'
      : 'Full passage visible. Your accuracy and timer stay unchanged.');
    updateCaretGuidance();
    const field=node('speed-input');
    if(field && !field.disabled)field.focus({preventScroll:true});
  }

  function keystroke() {
    if (state.speed?.status==='running' || state.speed?.status==='idle') state.speed.keystrokes++;
  }

  return {open,close,startTargeted,launchFocusPlan,launchAccuracyLadder,advanceAccuracyLadder,restart,paint,updateCaretGuidance,input,keystroke,insertSpace,backWord,toggleKeyboardAssist,toggleWordFocus,onVisibilityChange,onPageHide,pauseManually,resume,finish,tick};
}
