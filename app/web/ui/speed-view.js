/** Stateless presentation for the solo Speed Lab. */
import { safe, ico, tag } from './helpers.js';
import { DURATIONS, PACKS, readSpeedHistory } from './speed-engine.js';
import { ACCURACY_GOALS, readAccuracyGoal, summarizeSpeedPractice, practiceMode } from './speed-insights.js?v=0.32.0';

export function speedLibrary() {
  return `<section class="speed-promo shell" id="speed-lab">
    <div class="speed-promo-copy">${tag('SPEED LAB / SOLO PRACTICE')}
      <h2>YOUR KEYBOARD.<br><em>YOUR LIMIT.</em></h2>
      <p>Classic timed typing in the Keystoria universe. Race your own best in 15, 30, 60, or 120 seconds. No enemies, no rooms, no explanations. Just focus and flow.</p>
      <button class="btn btn-primary btn-large" data-action="speed-open">${ico('keyboard',19)} ENTER SPEED LAB ${ico('arrow',18)}</button>
    </div><div class="speed-promo-display" aria-hidden="true"><span>// PERSONAL BEST</span><strong>00:30</strong><div class="speed-promo-words"><span>quiet </span><span>signal </span><span>before </span><span>the </span><span>storm</span><i>▋</i></div><small>WPM / ACCURACY / PERSONAL BESTS</small></div>
  </section>`;
}

export function speedHistoryPanel() {
  const history = readSpeedHistory();
  if (!history.length) return `<div class="speed-empty">Your personal records appear here after your first completed run. Scores are kept on this device.</div>`;
  return `<div class="speed-history">${history.slice(0, 5).map(run => `<div><strong>${run.pack==="numpad"?Number(run.cpm??0):Number(run.wpm)} <small>${run.pack==="numpad"?"CPM":"WPM"}</small></strong><span>${safe(PACKS[run.pack]?.title || 'EVERYDAY')} · ${Number(run.seconds)}s</span><b>${Number(run.accuracy)}% accuracy · ${run.keyboardAssisted===true?"ASSISTED":"EXACT"}</b></div>`).join('')}</div>`;
}

export function speedInsightsPanel(session) {
  const goal = readAccuracyGoal();
  const pulse = summarizeSpeedPractice(readSpeedHistory(),session,goal);
  const mode = practiceMode(session);
  const friendlyMode = mode === 'mobile-assisted' ? 'PHONE ASSISTED'
    : mode === 'mobile-exact' ? 'PHONE EXACT' : 'DESKTOP EXACT';
  return `<section id="speed-practice-insights" class="speed-insights" aria-label="Practice Compass" data-matches="${pulse.count}">
    <span>// PRACTICE COMPASS · PRIVATE BY DEFAULT</span>
    <h3>BUILD YOUR NEXT BEST.</h3>
    <p class="speed-insight-scope">${safe(PACKS[session.pack]?.title || 'EVERYDAY')} · ${Number(session.seconds)}s · ${friendlyMode}. Compare matching sessions only.</p>
    <div class="speed-insight-stats">
      <div><small>COMPARABLE RUNS</small><strong>${pulse.count}</strong></div>
      <div><small>BEST ${pulse.metric}</small><strong>${pulse.best ?? '—'}</strong></div>
      <div><small>AVERAGE ACCURACY</small><strong>${pulse.averageAccuracy == null?'—':pulse.averageAccuracy+'%'}</strong></div>
    </div>
    <div class="speed-insight-goals"><span>ACCURACY GOAL</span><div class="speed-insight-buttons" role="group" aria-label="Accuracy goal">
      ${ACCURACY_GOALS.map(value=>`<button type="button" data-action="speed-goal" data-goal="${value}" aria-pressed="${value===goal}">${value}%</button>`).join('')}
    </div></div>
    ${pulse.recent.length ? `<div class="speed-insight-trail">
      <div class="speed-insight-trail-heading"><strong>RECENT MATCHING RUNS</strong><small>Oldest to newest · up to five</small></div>
      <ol aria-label="Recent comparable typing scores, oldest to newest">
        ${pulse.recent.map((run,index)=>`<li>
          <div class="speed-insight-bar" aria-hidden="true"><span style="height:${Math.max(6,Math.round(run.speed / Math.max(1,pulse.best) * 100))}%"></span></div>
          <span class="speed-insight-bar-label">${run.speed} ${pulse.metric}</span>
          <small>RUN ${index+1}${run.metGoal?' · GOAL MET':''}</small>
        </li>`).join('')}
      </ol>
      <p class="speed-insight-trend">LAST VS PREVIOUS: <strong>${pulse.paceChange===null?'Need two runs':(pulse.paceChange>0?'+':'')+pulse.paceChange+' '+pulse.metric}</strong> · ACCURACY GOAL: <strong>${pulse.goalStreak} consecutive ${pulse.goalStreak===1?'run':'runs'} (max 5)</strong></p>
    </div>` : ''}
    <p class="speed-insight-tip" role="status">${pulse.message}</p>
    <div class="speed-insight-privacy"><button type="button" data-action="speed-export">EXPORT RESULTS</button>
      <button type="button" data-action="speed-import">RESTORE EXPORT</button>
      <input id="speed-import-file" class="speed-import-file" type="file" accept=".json,application/json" tabindex="-1" aria-label="Select a Speed Lab results JSON export" />
      <button type="button" data-action="speed-clear">CLEAR SAVED RESULTS</button></div>
    <p class="speed-insight-footnote">Only stored in this browser. Keeps at most 25 runs. Export downloads a JSON file. Restore replaces this device's results only after confirmation; invalid files are rejected. Clear requires confirmation. Assisted, exact and number drills are not mixed.</p>
  </section>`;
}

function speedPackChoices(professional, selected) {
  return Object.entries(PACKS)
    .filter(([, pack]) => Boolean(pack.professional) === professional)
    .map(([id, pack]) => `<button type="button" data-action="speed-pack" data-pack="${safe(id)}" title="${safe(pack.description)}" aria-pressed="${id===selected}">${safe(pack.title)}</button>`)
    .join('');
}

export function speedTemplate(session, header) {
  const done = session.status === 'complete';
  const result = session.result;
  return `${header({inGame:true})}<main class="speed-page shell" data-speed="${safe(session.pack)}">
    <div class="speed-topline"><button class="text-button" data-action="speed-home">${ico('arrow',16)} BACK TO MISSIONS</button><span>// PERSONAL TRAINING / ZERO PRESSURE FROM TEAMMATES</span></div>
    <div class="speed-title">${tag('THE SPEED LAB / SOLO MODE')}<h1>FIND YOUR <em>RHYTHM.</em></h1><p>${session.pack==="numpad"?"NUMPAD CHALLENGE: Practice digit groups with Space or Numpad Enter between groups. Track characters per minute (CPM) and accuracy.":"Inspired by the fast feedback of TypeNinja. The timer starts on your first keystroke. Mistakes glow red, correct characters turn green, and Backspace lets you correct errors."}</p></div>
    <section class="speed-console" aria-label="Timed typing test">
      <div class="speed-settings"><div class="speed-setting"><span>TIME LIMIT</span><div class="speed-choices" role="group" aria-label="Duration">${DURATIONS.map(seconds => `<button type="button" data-action="speed-duration" data-seconds="${seconds}" aria-pressed="${seconds===session.seconds}">${seconds}s</button>`).join('')}</div></div>
      <div class="speed-setting speed-setting--packs"><span>PRACTICE CATEGORY</span><div class="speed-pack-sections"><div class="speed-pack-section"><span>CORE DRILLS</span><div class="speed-choices" role="group" aria-label="Core practice categories">${speedPackChoices(false,session.pack)}</div></div><div class="speed-pack-section"><span>WORKPLACE DRILLS</span><div class="speed-choices" role="group" aria-label="Workplace practice categories">${speedPackChoices(true,session.pack)}</div></div></div></div></div>
      <div class="speed-metrics"><div><span>TIME REMAINING</span><strong id="speed-time" class="speed-clock">${done ? 0 : session.seconds}</strong><small>SECONDS</small></div><div><span>NET SPEED</span><strong id="speed-wpm">${done ? (session.pack==="numpad"?result.cpm:result.wpm) : 0}</strong><small>${session.pack==="numpad"?"CPM":"WPM"}</small></div><div><span>ACCURACY</span><strong id="speed-accuracy">${done ? `${result.accuracy}%` : "100%"}</strong><small>CORRECT KEYS</small></div><div><span>RAW SPEED</span><strong id="speed-raw">${done ? (session.pack==="numpad"?result.rawCpm:result.rawWpm) : 0}</strong><small>${session.pack==="numpad"?"CPM":"WPM"}</small></div></div>
      ${done ? `<div class="speed-results" role="status" aria-live="polite"><p class="speed-assist-result-label">${result.keyboardAssisted===true?"MOBILE ASSISTED":"EXACT TYPING"} · ${session.phoneLayout?"PHONE LAYOUT":"DESKTOP LAYOUT"}</p>${tag('SESSION FINISHED')}<h2 id="speed-results-heading" tabindex="-1">YOU FOUND YOUR PACE.</h2><div class="speed-result-hero"><strong>${session.pack==="numpad"?result.cpm:result.wpm} <small>${session.pack==="numpad"?"CPM":"WPM"}</small></strong><div><span>ACCURACY <b>${result.accuracy}%</b></span><span>RAW SPEED <b>${session.pack==="numpad"?result.rawCpm:result.rawWpm} ${session.pack==="numpad"?"CPM":"WPM"}</b></span><span>CORRECT CHARACTERS <b>${result.correct}</b></span><span>MISTAKES REMAINING <b>${result.incorrect}</b></span></div></div><p>${session.pack==="numpad"?"CPM measures correctly typed digits per minute.":"Results measure correctly typed characters."} Mobile assistance is labeled separately from exact typing. Press Ctrl + Enter or click Test Again to try again and beat this score.</p><button class="btn btn-primary btn-large" data-action="speed-restart">${ico('refresh',18)} TEST AGAIN</button></div>` : `<div class="speed-prompt-wrap"><div class="speed-prompt-label"><span><i class="command-live"></i> ${session.pack==="numpad"?"NUMPAD / DIGIT ACCURACY":"LIVE CHARACTER FEEDBACK"}</span><span id="speed-mode">${session.status==='running'?'SESSION LIVE':'TIMER STARTS WHEN YOU TYPE'}</span></div>
        <div id="speed-letters" class="typing-feedback speed-letters" aria-live="off"></div>
        <div class="speed-page-indicator">CONTINUOUS PASSAGE · <span id="speed-progress">${session.pack==="numpad"?"0 digits typed":"0 characters typed"}</span> · ${session.pack==="numpad"?"SPACE OR NUMPAD ENTER BETWEEN GROUPS":"WORDS ADVANCE UPWARD ONLY"}</div>
        <div class="typing-legend"><span><i class="legend-correct"></i> CORRECT</span><span><i class="legend-incorrect"></i> INCORRECT</span><span><i class="legend-caret"></i> NEXT KEY</span></div></div>
        <div class="speed-mobile-entry mobile-typing-entry" id="speed-mobile-entry">
          <div class="mobile-speed-cue" aria-hidden="true"><small>NEXT CHARACTERS · TYPE WHAT YOU SEE</small><div><span id="speed-mobile-first"></span><span id="speed-mobile-rest"></span></div></div>
        ${session.pack!=="numpad"?`<div class="speed-assist-settings" role="group" aria-label="Phone keyboard assistance"><button id="speed-assist-toggle" type="button" data-action="speed-assist" aria-pressed="${session.keyboardAssist===true}">KEYBOARD HELP: ${session.keyboardAssist===true?"ON":"OFF"}</button><p id="speed-assist-detail" role="note">${session.keyboardAssist===true?"Phone predictions and autocorrect allowed. Score marked Assisted; suggestions depend on your keyboard settings.":"Exact typing. Native keyboard assistance is off."}</p></div>`:""}<label id="speed-input-instructions" for="speed-input" class="speed-input-label">${session.pack==="numpad"?"TYPE THE DIGITS ABOVE — SPACE OR NUMPAD ENTER BETWEEN GROUPS":"TYPE THE WORDS ABOVE — USE BACKSPACE TO FIX MISTAKES"}</label>
        <textarea id="speed-input" class="speed-input" rows="2" spellcheck="${session.keyboardAssist===true?"true":"false"}" autocorrect="${session.keyboardAssist===true?"on":"off"}" autocapitalize="off" autocomplete="${session.keyboardAssist===true?"on":"off"}" inputmode="${session.pack==="numpad"?"numeric":"text"}" enterkeyhint="next" aria-label="${session.pack==="numpad"?"Type the displayed number groups":"Type the displayed words"}" aria-describedby="speed-input-instructions speed-mode" placeholder="Click here or start typing to begin..."></textarea>
          <div class="mobile-entry-actions"><button type="button" data-action="speed-space" aria-label="Type a space character">SPACE / NEXT</button><button type="button" data-action="speed-restart">RESTART</button></div>
        </div>
        <div class="speed-controls"><span>TIME STARTS ON FIRST KEY · CTRL + ENTER TO RESTART</span><button class="btn btn-outline" data-action="speed-restart">${ico('refresh',16)} RESTART</button></div>`}
    </section>
    <div class="speed-bottom"><section><span>// YOUR RECENT RESULTS</span><h2>PERSONAL RECORDS.</h2><div id="speed-history-panel">${speedHistoryPanel()}</div>${speedInsightsPanel(session)}</section><aside><span>// PRACTICE PROFILE</span><h2>${safe(PACKS[session.pack].title)}</h2><p>${safe(PACKS[session.pack].description)}</p><p>Timed solo drills use local browser storage, so you can train without an account. None of these words are shell commands.</p></aside></div>
  </main>`;
}
