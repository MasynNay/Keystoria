/** Stateless presentation for optional self-paced terminal lessons. */
import { LESSONS, savedLessons, activeCommandIndex } from "./lessons.js";
import { LESSON_OUTPUTS } from "./lesson-output.js";
import { COMMAND_GUIDES } from "./command-guides.js";
import { renderTypingFeedback } from "./typing-feedback.js";
import { safe, ico, tag } from "./helpers.js";

export function trainingLibrary() {
  const completed = savedLessons();
  return `<section class="academy shell" id="academy">
    <div class="academy-heading">${tag("THE FIELD ACADEMY / NO TIMER, NO PRESSURE")}
      <h2>LEARN THE <em>REAL COMMANDS.</em></h2>
      <p>Three hands-on practice terminals. Type everyday commands, consult the optional side reference, and keep a complete command guide when you finish. <strong>Everything is simulated — nothing runs on your machine.</strong></p></div>
    <div class="academy-grid">${Object.entries(LESSONS).map(([id,lesson]) => `<button class="academy-card" data-action="learn" data-os="${id}"><span class="academy-number">COURSE ${lesson.number} ${completed[id] ? "· COMPLETED ✓" : "· 14 COMMANDS"}</span><span class="academy-icon">${lesson.icon}</span><strong>${safe(lesson.name)}</strong><small>${safe(lesson.objective)}</small><span class="academy-open">OPEN TERMINAL ${ico("arrow", 16)}</span></button>`).join("")}</div>
  </section>`;
}

/** The command index is navigational reference, never the active exercise. */
export function trainingTemplate(state, header) {
  const lesson = LESSONS[state.os];
  const commands = lesson.commands;
  const activeIndex = activeCommandIndex(state);
  const task = commands[activeIndex];
  const done = state.completed;
  const correct = state.answered;
  const progress = done ? commands.length : state.index + (correct ? 1 : 0);
  const referenceIndex = Number.isInteger(state.referenceIndex) ? state.referenceIndex : activeIndex;
  const selected = commands[referenceIndex];
  const guide = COMMAND_GUIDES[state.os][referenceIndex];
  const glossary = commands.map((entry, i) => {
    const position = state.order ? state.order.indexOf(i) : i;
    const status = done || position < state.index || (position===state.index && correct)
      ? "COMPLETED" : position===state.index ? "CURRENT" : "UPCOMING";
    return `<button type="button" class="glossary-line ${referenceIndex===i ? "current" : ""}"
       data-action="training-reference" data-index="${i}" aria-pressed="${referenceIndex===i}"
       aria-label="Review command ${i+1}: ${safe(entry.title)}"><span>${String(i+1).padStart(2,"0")}</span><code>${safe(entry.text)}</code><small>${status}</small></button>`;
  }).join("");
  return `${header({inGame:true})}<main class="game-shell academy-play" data-lesson="${state.os}">
    <div class="training-nav"><button class="text-button" data-action="training-home">${ico("arrow",15)} BACK TO MISSIONS</button><span>FIELD ACADEMY / COURSE ${lesson.number}</span></div>
    <div class="training-title">${tag(lesson.label)}<h1>${safe(lesson.name)}<span>.</span></h1><p>${safe(lesson.story)}</p></div>
    <div class="academy-shuffle-tools"><p class="academy-shuffle-label">↻ RANDOMIZED PRACTICE ORDER — FRESH SEQUENCE EACH ATTEMPT</p><button class="btn btn-outline" type="button" data-action="training-shuffle">RESHUFFLE & START OVER ↻</button></div>
    <div class="training-hud"><div><span>LESSON PROGRESS</span><strong>${progress} / ${commands.length}</strong></div><div class="training-progress"><i style="width:${progress / commands.length * 100}%"></i></div><div><span>MISTAKES</span><strong>${state.errors}</strong></div></div>
    <div class="training-layout"><section class="terminal-card">
    ${done ? `<div class="training-complete">${tag("CURRICULUM COMPLETE")}<h2>MISSION ACCOMPLISHED.</h2><p>All ${commands.length} commands completed. Select any command on the right to review how it works and when to use it.</p><div class="training-buttons"><button class="btn btn-primary" data-action="training-restart">REPLAY LESSON</button><button class="btn btn-outline" data-action="training-home">EXPLORE MORE MISSIONS</button></div></div>` : `
      <div class="terminal-bar"><span>● ● ●</span><strong>SIMULATED CONSOLE</strong><span>STEP ${String(state.index+1).padStart(2,"0")} / ${commands.length}</span></div>
      <div class="terminal-inner">${tag("YOUR NEXT COMMAND")}<h2>${safe(task.title)}</h2><p>${safe(task.summary)}</p>
       <div class="terminal-prompt"><small>${state.os === "windows" ? "PS C:\\Training>" : "operator@academy ~ %"}</small><code class="typing-feedback academy-target" id="lesson-target-text" aria-live="off">${renderTypingFeedback(task.text, correct ? task.text : state.draft || "", {caseSensitive:true})}</code></div>
       <div class="typing-legend"><span><i class="legend-correct"></i> CORRECT</span><span><i class="legend-incorrect"></i> INCORRECT</span><span><i class="legend-caret"></i> NEXT KEY</span></div>
       <label for="lesson-input">${correct ? "COMMAND ACCEPTED — PRESS ENTER AGAIN TO CONTINUE" : "TYPE THIS COMMAND EXACTLY, THEN PRESS ENTER"}</label><div class="terminal-input-box"><span>›</span><input id="lesson-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="training-feedback" placeholder="type the command here..." value="${safe(correct ? task.text : state.draft || "")}" ${correct?"readonly":""}/></div>
       <div class="training-feedback ${correct ? "passed" : ""}" id="training-feedback" role="status">${correct ? "COMMAND RECOGNIZED ✓ — Press Enter to go to the next command. No commands were run." : state.errorMessage ? safe(state.errorMessage) : "No real shell commands are executed. The practical uses are explained on the right."}</div>
       ${correct ? `<div class="sample-output"><span>// SIMULATED TERMINAL OUTPUT · EXAMPLE ONLY</span><pre>${safe(LESSON_OUTPUTS[state.os][activeIndex])}</pre></div>` : ""}
       <div class="training-buttons">${correct ? `<button data-action="training-next" class="btn btn-primary">${state.index === commands.length-1 ? "FINISH COURSE" : "NEXT COMMAND"} ${ico("arrow",16)}</button>` : `<button data-action="training-submit" class="btn btn-primary">CHECK COMMAND ↵</button>`}<button data-action="training-review" class="btn btn-outline">${state.review ? "HIDE FULL GUIDE" : "VIEW FULL GUIDE"}</button></div>
      </div>`}</section>
      <aside class="reference-panel"><div class="reference-head"><span>// SELECTED COMMAND ${String(referenceIndex+1).padStart(2,'0')} / ${commands.length}</span><strong>WHAT DOES IT DO? / WHEN WOULD I USE THIS?</strong></div>
        <div class="reference-command"><code>${safe(selected.text)}</code><h3>${safe(selected.title)}</h3><p>${safe(selected.detail)}</p>
         <div class="reference-situation"><strong>REAL-WORLD EXAMPLE</strong><p>${safe(guide.use)}</p></div>
         <div class="reference-situation"><strong>WHAT IT ACTUALLY HELPS WITH</strong><p>${safe(guide.benefit)}</p></div>
         <div class="reference-caution"><strong>BE CAREFUL</strong><p>${safe(guide.caution)}</p></div>
         <div class="reference-example"><span>SIMULATED OUTPUT</span><pre>${safe(LESSON_OUTPUTS[state.os][referenceIndex])}</pre></div>
        </div><div class="reference-note">${ico("alert",16)} ${safe(lesson.note)}</div>
        <div class="reference-head reference-secondary"><span>// COMMANDS IN THIS COURSE</span><small>CLICK ANY COMMAND TO REVIEW</small></div>
        <div class="mini-glossary">${glossary}</div>
      </aside>
    </div>
    ${(done || state.review) ? `<section class="training-glossary">${tag("COMPLETE COMMAND REFERENCE")}<h2>YOUR FIELD MANUAL.</h2><p>Study each command and its practical application. The terminal output is illustrative and nothing ran on your computer.</p><div class="glossary-grid">${commands.map((entry,i)=>`<article><span>${String(i+1).padStart(2,"0")}</span><code>${safe(entry.text)}</code><h3>${safe(entry.title)}</h3><p>${safe(entry.detail)}</p><p><strong>WHEN TO USE:</strong> ${safe(COMMAND_GUIDES[state.os][i].use)}</p></article>`).join("")}</div></section>` : ""}
  </main>`;
}
