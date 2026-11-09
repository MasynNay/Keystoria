/** Stateless presentation for the solo Speed Lab. */
import { safe, ico, tag } from './helpers.js';
import { DURATIONS, PACKS, readSpeedHistory } from './speed-engine.js';

export function speedLibrary() {
  return `<section class="speed-promo shell" id="speed-lab">
    <div class="speed-promo-copy">${tag('SPEED LAB / SOLO PRACTICE')}
      <h2>YOUR KEYBOARD.<br><em>YOUR LIMIT.</em></h2>
      <p>Classic timed typing in the Keystoria universe. Race your own best in 15, 30, 60, or 120 seconds. No enemies, no rooms, no explanations. Just focus and flow.</p>
      <button class="btn btn-primary btn-large" data-action="speed-open">${ico('keyboard',19)} ENTER SPEED LAB ${ico('arrow',18)}</button>
    </div><div class="speed-promo-display" aria-hidden="true"><span>// PERSONAL BEST</span><strong>00:30</strong><div class="speed-promo-words"><span>quiet </span><span>signal </span><span>before </span><span>the </span><span>storm</span><i>▋</i></div><small>WPM / ACCURACY / PERSONAL BESTS</small></div>
  </section>`;
}

function historyPanel() {
  const history = readSpeedHistory();
  if (!history.length) return `<div class="speed-empty">Your personal records appear here after your first completed run. Scores are kept on this device.</div>`;
  return `<div class="speed-history">${history.slice(0, 5).map(run => `<div><strong>${run.pack==="numpad"?Number(run.cpm??0):Number(run.wpm)} <small>${run.pack==="numpad"?"CPM":"WPM"}</small></strong><span>${safe(PACKS[run.pack]?.title || 'EVERYDAY')} · ${Number(run.seconds)}s</span><b>${Number(run.accuracy)}% accuracy</b></div>`).join('')}</div>`;
}

export function speedTemplate(session, header) {
  const done = session.status === 'complete';
  const result = session.result;
  return `${header({inGame:true})}<main class="speed-page shell" data-speed="${safe(session.pack)}">
    <div class="speed-topline"><button class="text-button" data-action="speed-home">${ico('arrow',16)} BACK TO MISSIONS</button><span>// PERSONAL TRAINING / ZERO PRESSURE FROM TEAMMATES</span></div>
    <div class="speed-title">${tag('THE SPEED LAB / SOLO MODE')}<h1>FIND YOUR <em>RHYTHM.</em></h1><p>${session.pack==="numpad"?"NUMPAD CHALLENGE: Practice digit groups with Space or Numpad Enter between groups. Track characters per minute (CPM) and accuracy.":"Inspired by the fast feedback of TypeNinja. The timer starts on your first keystroke. Mistakes glow red, correct characters turn green, and Backspace lets you correct errors."}</p></div>
    <section class="speed-console" aria-label="Timed typing test">
      <div class="speed-settings"><div class="speed-setting"><span>TIME LIMIT</span><div class="speed-choices" role="group" aria-label="Duration">${DURATIONS.map(seconds => `<button type="button" data-action="speed-duration" data-seconds="${seconds}" aria-pressed="${seconds===session.seconds}">${seconds}s</button>`).join('')}</div></div>
      <div class="speed-setting"><span>PRACTICE CATEGORY</span><div class="speed-choices" role="group" aria-label="Word bank">${Object.entries(PACKS).map(([id,pack]) => `<button type="button" data-action="speed-pack" data-pack="${id}" aria-pressed="${id===session.pack}">${safe(pack.title)}</button>`).join('')}</div></div></div>
      <div class="speed-metrics"><div><span>TIME REMAINING</span><strong id="speed-time" class="speed-clock">${done ? 0 : session.seconds}</strong><small>SECONDS</small></div><div><span>NET SPEED</span><strong id="speed-wpm">${done ? result.wpm : 0}</strong><small>${session.pack==="numpad"?"CPM":"WPM"}</small></div><div><span>ACCURACY</span><strong id="speed-accuracy">${done ? `${result.accuracy}%` : "100%"}</strong><small>CORRECT KEYS</small></div><div><span>RAW SPEED</span><strong id="speed-raw">${done ? result.rawWpm : 0}</strong><small>${session.pack==="numpad"?"CPM":"WPM"}</small></div></div>
      ${done ? `<div class="speed-results">${tag('SESSION FINISHED')}<h2>YOU FOUND YOUR PACE.</h2><div class="speed-result-hero"><strong>${session.pack==="numpad"?result.cpm:result.wpm} <small>${session.pack==="numpad"?"CPM":"WPM"}</small></strong><div><span>ACCURACY <b>${result.accuracy}%</b></span><span>RAW SPEED <b>${session.pack==="numpad"?result.rawCpm:result.rawWpm} ${session.pack==="numpad"?"CPM":"WPM"}</b></span><span>CORRECT CHARACTERS <b>${result.correct}</b></span><span>MISTAKES REMAINING <b>${result.incorrect}</b></span></div></div><p>${session.pack==="numpad"?"CPM measures correctly typed characters per minute.":"Results measure correctly typed characters."} Press Ctrl + Enter or click Test Again to try again and beat this score.</p><button class="btn btn-primary btn-large" data-action="speed-restart">${ico('refresh',18)} TEST AGAIN</button></div>` : `<div class="speed-prompt-wrap"><div class="speed-prompt-label"><span><i class="command-live"></i> ${session.pack==="numpad"?"NUMPAD / DIGIT ACCURACY":"LIVE CHARACTER FEEDBACK"}</span><span id="speed-mode">${session.status==='running'?'SESSION LIVE':'TIMER STARTS WHEN YOU TYPE'}</span></div>
        <div id="speed-letters" class="typing-feedback speed-letters" aria-live="off"></div>
        <div class="speed-page-indicator">CONTINUOUS PASSAGE · <span id="speed-progress">${session.pack==="numpad"?"0 digits typed":"0 characters typed"}</span> · ${session.pack==="numpad"?"SPACE OR NUMPAD ENTER BETWEEN GROUPS":"WORDS ADVANCE UPWARD ONLY"}</div>
        <div class="typing-legend"><span><i class="legend-correct"></i> CORRECT</span><span><i class="legend-incorrect"></i> INCORRECT</span><span><i class="legend-caret"></i> NEXT KEY</span></div></div>
        <label for="speed-input" class="speed-input-label">${session.pack==="numpad"?"TYPE THE DIGITS ABOVE — SPACE OR NUMPAD ENTER BETWEEN GROUPS":"TYPE THE WORDS ABOVE — USE BACKSPACE TO FIX MISTAKES"}</label>
        <textarea id="speed-input" class="speed-input" rows="2" spellcheck="false" autocorrect="off" autocapitalize="off" autocomplete="off" ${session.pack==="numpad"?'inputmode="numeric"':""} aria-label="${session.pack==="numpad"?"Type the displayed number groups":"Type the displayed words"}" placeholder="Click here or start typing to begin..."></textarea>
        <div class="speed-controls"><span>TIME STARTS ON FIRST KEY · CTRL + ENTER TO RESTART</span><button class="btn btn-outline" data-action="speed-restart">${ico('refresh',16)} RESTART</button></div>`}
    </section>
    <div class="speed-bottom"><section><span>// YOUR RECENT RESULTS</span><h2>PERSONAL RECORDS.</h2>${historyPanel()}</section><aside><span>// PRACTICE PROFILE</span><h2>${safe(PACKS[session.pack].title)}</h2><p>${safe(PACKS[session.pack].description)}</p><p>Timed solo drills use local browser storage, so you can train without an account. None of these words are shell commands.</p></aside></div>
  </main>`;
}
