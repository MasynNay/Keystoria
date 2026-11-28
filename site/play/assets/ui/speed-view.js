/** Stateless presentation for the solo Speed Lab. */
import { safe, ico, tag } from './helpers.js';
import { DURATIONS, PACKS, readSpeedHistory } from './speed-engine.js?v=0.40.1';
import { speedSpokenTarget } from './mobile-typing.js?v=0.42.0';
import { ACCURACY_GOALS, readAccuracyGoal, summarizeSpeedPractice, summarizeSpeedActivity, practiceMode, compareFocusedAttempts, FOCUS_ROUTINE_ATTEMPTS, readFocusPlan, focusPlanFromSession, sameFocusScope, readGuidedActivity, summarizeGuidedActivity, recommendDailyPractice, summarizeTrainingMilestones, ACCURACY_LADDER, SURVIVAL_WAVES, SURVIVAL_SECONDS, SURVIVAL_BUDGET } from './speed-insights.js?v=0.48.13';

export function speedLibrary() {
  return `<section class="speed-promo shell" id="speed-lab">
    <div class="speed-promo-copy">${tag('SPEED LAB / SOLO PRACTICE')}
      <h2>YOUR KEYBOARD.<br><em>YOUR LIMIT.</em></h2>
      <p>Classic timed typing in the Keystoria universe. Race your own best in 15, 30, 60, or 120 seconds. No enemies, no rooms, no explanations. Just focus and flow.</p>
      <button class="btn btn-primary btn-large" data-action="speed-open">${ico('keyboard',19)} ENTER SPEED LAB ${ico('arrow',18)}</button>
    </div><div class="speed-promo-display" aria-hidden="true"><span>// PERSONAL BEST</span><strong>00:30</strong><div class="speed-promo-words"><span>quiet </span><span>signal </span><span>before </span><span>the </span><span>storm</span><i>▋</i></div><small>WPM / ACCURACY / PERSONAL BESTS</small></div>
  </section>`;
}

function displayPracticeMode(record) {
  const mode=practiceMode(record);
  return mode==='mobile-assisted' ? 'PHONE ASSISTED'
    : mode==='mobile-exact' ? 'PHONE EXACT' : 'DESKTOP EXACT';
}

export function speedHistoryPanel() {
  const history = readSpeedHistory();
  if (!history.length) return `<div class="speed-empty">Your personal records appear here after your first completed run. Scores are kept on this device.</div>`;
  return `<div class="speed-history">${history.slice(0, 5).map(run => `<div><strong>${run.pack==="numpad"?Number(run.cpm??0):Number(run.wpm)} <small>${run.pack==="numpad"?"CPM":"WPM"}</small></strong><span>${safe(PACKS[run.pack]?.title || 'EVERYDAY')} · ${Number(run.seconds)}s</span><b>${Number(run.accuracy)}% accuracy · ${displayPracticeMode(run)}</b></div>`).join('')}</div>`;
}

export function speedInsightsPanel(session) {
  const goal = readAccuracyGoal();
  const savedRuns = readSpeedHistory();
  const pulse = summarizeSpeedPractice(savedRuns,session,goal);
  const activity = summarizeSpeedActivity(savedRuns);
  const tallest = Math.max(1,...activity.days.map(day=>day.count));
  const friendlyMode = displayPracticeMode(session);
  const target = pulse.nextTarget;
  const nextLabel = target.kind === 'start' ? 'Complete your first timed run'
    : target.kind === 'accuracy' ? `Reach ${goal}%+ accuracy`
    : target.kind === 'maintain' ? `Hold ${target.speed} ${pulse.metric} at ${goal}%+ accuracy`
    : `Try ${target.speed} ${pulse.metric} at ${goal}%+ accuracy`;
  const nextHelp = target.kind === 'start'
    ? 'A completed, saved run in this category, duration and input mode unlocks a personal suggestion.'
    : target.kind === 'accuracy'
      ? 'Your latest comparable run missed this accuracy goal. Find a comfortable pace before trying to go faster.'
      : 'Based on your latest comparable saved run. This is a small practice suggestion, not a record to beat or a requirement.';
  return `<section id="speed-practice-insights" class="speed-insights" aria-label="Practice Compass" data-matches="${pulse.count}">
    <span>// PRACTICE COMPASS · PRIVATE BY DEFAULT</span>
    <h3>BUILD YOUR NEXT BEST.</h3>
    <p class="speed-insight-scope">${safe(PACKS[session.pack]?.title || 'EVERYDAY')} · ${Number(session.seconds)}s · ${friendlyMode}. Compare matching sessions only.${session.targetKeys?.length?' These records describe regular sessions, not this targeted drill.':''}</p>
    <div class="speed-insight-stats">
      <div><small>RECENT MATCHES · MAX 5</small><strong>${pulse.count}</strong></div>
      <div><small>BEST IN LAST 5 · ${pulse.metric}</small><strong>${pulse.best ?? '—'}</strong></div>
      <div><small>RECENT AVERAGE ACCURACY</small><strong>${pulse.averageAccuracy == null?'—':pulse.averageAccuracy+'%'}</strong></div>
    </div>
    <section class="speed-week-activity" aria-label="Last seven days of saved Speed Lab practice" data-active-days="${activity.activeDays}" data-saved-runs="${activity.savedRuns}">
      <div class="speed-week-heading"><strong>LAST 7 DAYS · PRACTICE ACTIVITY</strong><span>${activity.activeDays} active ${activity.activeDays===1?'day':'days'} · ${activity.savedRuns} saved ${activity.savedRuns===1?'run':'runs'}</span></div>
      <ol aria-label="Locally saved Speed Lab sessions, oldest day first">
        ${activity.days.map(day=>`<li aria-label="${day.label} ${day.dateLabel}: ${day.count} saved ${day.count===1?'run':'runs'}" data-date="${day.key}" data-runs="${day.count}">
          <div class="speed-week-track" aria-hidden="true"><span style="height:${day.count?Math.max(14,Math.round(day.count/tallest*100)):0}%"></span></div>
          <small>${day.label}</small><span class="speed-week-count">${day.count||'·'}</span>
        </li>`).join('')}
      </ol>
      <p>Count of locally saved runs, across all Speed Lab categories and input modes. This is activity, not a speed comparison.${activity.undated?' '+activity.undated+' older or invalid-date '+(activity.undated===1?'record is':'records are')+' not shown.':''} Only the newest 25 saved results are available; the display may omit earlier practice.</p>
    </section>
    <div class="speed-insight-goals"><span>ACCURACY GOAL</span><div class="speed-insight-buttons" role="group" aria-label="Accuracy goal">
      ${ACCURACY_GOALS.map(value=>`<button type="button" data-action="speed-goal" data-goal="${value}" aria-pressed="${value===goal}">${value}%</button>`).join('')}
    </div></div>
    <div class="speed-insight-qualified" aria-label="Accuracy-qualified personal best from saved results">
      <div><span>BEST AT ${goal}%+ ACCURACY</span><strong>${pulse.goalQualifiedBest ?? '—'} <small>${pulse.metric}</small></strong></div>
      <p>${pulse.goalQualifiedCount === 0
        ? 'No matching saved run reached this goal yet.'
        : `${pulse.goalQualifiedCount} of ${pulse.matchingCount} comparable saved ${pulse.matchingCount===1?'run':'runs'} met the goal.`} Based on at most 25 locally stored results.</p>
    </div>
    <div class="speed-insight-next" aria-label="Suggested next practice session">
      <small>NEXT SESSION · OPTIONAL SUGGESTION</small>
      <strong>${nextLabel}</strong>
      <p>${nextHelp}</p>
    </div>
    ${pulse.recent.length ? `<div class="speed-insight-trail">
      <div class="speed-insight-trail-heading"><strong>RECENT MATCHING RUNS</strong><small>Oldest to newest · up to five</small></div>
      <ol aria-label="Recent comparable typing scores, oldest to newest">
        ${pulse.recent.map((run,index)=>`<li>
          <div class="speed-insight-bar" aria-hidden="true"><span style="height:${Math.max(6,Math.round(run.speed / Math.max(1,pulse.best) * 100))}%"></span></div>
          <span class="speed-insight-bar-label">${run.speed} ${pulse.metric}</span>
          <small>${index===pulse.recent.length-1?'LATEST':'RUN '+(index+1)} · ${run.metGoal?'GOAL MET':'BELOW GOAL'}</small>
        </li>`).join('')}
      </ol>
      <p class="speed-insight-trend">LAST VS PREVIOUS: <strong>${pulse.paceChange===null?'Need two runs':(pulse.paceChange>0?'+':'')+pulse.paceChange+' '+pulse.metric}</strong> · ACCURACY GOAL: <strong>${pulse.goalStreak} consecutive ${pulse.goalStreak===1?'run':'runs'} (max 5)</strong></p>
    </div>` : ''}
    <p class="speed-insight-tip" role="status" aria-live="polite" aria-atomic="true">Accuracy goal ${goal}%: ${pulse.message} Next session: ${nextLabel}.</p>
    <div class="speed-insight-privacy"><button type="button" data-action="speed-export">EXPORT RESULTS</button>
      <button type="button" data-action="speed-import">RESTORE EXPORT</button>
      <input id="speed-import-file" class="speed-import-file" type="file" accept=".json,application/json" tabindex="-1" aria-label="Select a Speed Lab results JSON export" />
      <button type="button" data-action="speed-clear">CLEAR SAVED RESULTS</button></div>
    <p class="speed-insight-footnote">Only stored in this browser. Keeps at most 25 runs. Export downloads a JSON file. Restore replaces this device's results only after confirmation; invalid files are rejected. Clear requires confirmation. Assisted, exact and number drills are not mixed.</p>
  </section>`;
}

function speedPackChoices(group, selected) {
  return Object.entries(PACKS)
    .filter(([, pack]) => (pack.keyboard?'keyboard':pack.professional?'workplace':'core') === group)
    .map(([id, pack]) => `<button type="button" data-action="speed-pack" data-pack="${safe(id)}" title="${safe(pack.description)}" aria-pressed="${id===selected}">${safe(pack.title)}</button>`)
    .join('');
}

function speedKeyReview(session) {
  const review=session.keyReview;
  if(!review)return '';
  const description=review.attempted===0
    ? 'No target characters were submitted in this run.'
    : review.mistakes===0
      ? 'No mistakes remain in your submitted text.'
      : 'Use these target characters as a focus for your next practice session.';
  return `<section id="speed-key-review" class="speed-key-review" aria-labelledby="speed-key-review-heading" data-error-count="${review.mistakes}">
    <h3 id="speed-key-review-heading">KEYS TO PRACTICE</h3>
    <p>${description}</p>
    ${review.keys.length?`<ul aria-label="Target keys with the most remaining mistakes">${review.keys.map(row=>`<li data-key="${safe(row.key)}"><kbd>${row.key===' '?'Space':safe(row.key)}</kbd><span><strong>${row.mistakes}</strong> of ${row.attempts} ${row.attempts===1?'position':'positions'} missed</span></li>`).join('')}</ul>`:''}
    ${review.otherMistakes?`<p>Other remaining mistakes: ${review.otherMistakes}.</p>`:''}
    ${review.keys.length?`<button type="button" class="btn btn-primary speed-targeted-launch" data-action="speed-targeted">PRACTICE THESE KEYS</button><button type="button" class="btn btn-outline speed-targeted-launch" data-action="speed-guided">START GUIDED ROUTINE</button><p>Practice freely or aim for two qualifying attempts at your selected accuracy goal. Neither option saves personal records.</p>`:""}
    <p class="speed-key-review-note">Based on the final submitted text${session.result?.keyboardAssisted?' after native keyboard assistance':''}. Corrected mistakes and untyped characters are not counted. This is a practice recap, not a keystroke log. The key breakdown is not saved or exported. You can separately choose to save only the focus plan configuration.</p>
  </section>`;
}

function speedFocusedComparison(session) {
  const comparison=compareFocusedAttempts(session.focusAttempt,session.previousFocusAttempt);
  if(!comparison)return '';
  const notes={first:'First attempt for these focus keys and duration. Repeat this drill to compare.',
    scope:'The previous drill was different. Repeat this drill to establish a comparison.',
    keyboard:'Keyboard assistance or input mode changed. These attempts are not compared.',
    interrupted:'This attempt was interrupted. No change comparison is shown or used as a baseline.',
    matched:'Compared with the last uninterrupted targeted attempt in the same category, duration, key order and input mode.'};
  const countText=row=>`${row.correct} of ${row.attempted} correct`;
  const rateText=row=>row.rate===null?'Not attempted':`${row.rate}%`;
  const deltaText=row=>row.delta===null?'Need at least 5 positions in both attempts':row.delta===0?'No change':`${row.delta>0?'+':''}${row.delta} percentage points`;
  return `<section id="speed-focus-comparison" class="speed-focus-comparison" aria-labelledby="speed-focus-comparison-heading" data-comparison="${comparison.reason}">
    <h3 id="speed-focus-comparison-heading">FOCUS KEY PROGRESS</h3>
    <p>${notes[comparison.reason]}</p>
    <ul aria-label="Accuracy by focus key">${comparison.rows.map(row=>`<li data-key="${safe(row.key)}"><kbd>${row.key===' '?'Space':safe(row.key)}</kbd><div><strong>${rateText(row)}</strong><span>${countText(row)}</span>${row.prior?`<span>Previous: ${row.priorRate===null?'not attempted':row.priorRate+'%'} (${countText(row.prior)})</span><span class="speed-focus-delta" data-delta="${row.delta===null?'insufficient':row.delta}">${deltaText(row)}</span>`:''}</div></li>`).join('')}</ul>
    <p class="speed-focus-note">Counts include only final submitted target positions. Passages vary, so these changes are practice feedback, not proof of skill gain. The comparison stays in this session and is not saved or exported.</p>
  </section>`;
}

function speedFocusRoutine(session) {
  const routine=session.focusRoutine;
  if(!routine)return '';
  const done=session.status==='complete';
  const notes={ready:'Type at a comfortable pace and aim for accuracy on every focus key.',
    qualified:'First qualifying attempt complete. Repeat this drill in the same keyboard mode.',
    'below-goal':'At least one focus key missed the accuracy goal. The qualifying streak resets; try again at a comfortable pace.',
    insufficient:'At least one focus key had fewer than five submitted positions. This attempt resets the streak. Try a longer drill if needed.',
    interrupted:'This interrupted attempt does not count. Your previous qualifying streak is unchanged.',
    complete:'Routine complete. You reached the goal on every focus key in two consecutive qualifying attempts.'};
  const label=routine.status==='complete'?'ROUTINE COMPLETE':'GUIDED ACCURACY ROUTINE';
  const message=done||routine.status==='complete'?notes[routine.status]:'Reach the goal on every focus key. Keep the same keyboard mode for both qualifying attempts.';
  return `<section id="speed-focus-routine" class="speed-focus-routine" aria-labelledby="speed-focus-routine-heading" data-streak="${routine.streak}" data-routine-status="${routine.status}">
    <div class="speed-routine-heading"><h3 id="speed-focus-routine-heading">${label}</h3><strong>${routine.streak}/${FOCUS_ROUTINE_ATTEMPTS} qualifying attempts</strong></div>
    <progress max="${FOCUS_ROUTINE_ATTEMPTS}" value="${routine.streak}" aria-label="Qualifying attempts"></progress>
    <p>Goal: ${routine.goal}% or higher on each focus key, with at least five positions per key in each attempt. This goal is fixed for the routine. Changing the duration or category ends it.</p>
    <p role="status">${message}</p>
    ${done&&routine.status==='complete'?'<p>Return to a regular drill whenever you are ready. No scores or mastery awards are saved. Optional local activity counts completed routines only.</p>':''}
  </section>`;
}

export function savedFocusPlanPanel(session) {
  const plan=readFocusPlan(), candidate=focusPlanFromSession(session,readAccuracyGoal());
  const matches=Boolean(plan&&candidate&&sameFocusScope(plan,candidate)&&plan.goal===candidate.goal);
  return `<section id="speed-saved-focus-plan" class="speed-saved-focus-plan" aria-labelledby="speed-saved-focus-heading" data-saved="${Boolean(plan)}">
    <h3 id="speed-saved-focus-heading" tabindex="-1">YOUR FOCUS PLAN</h3>
    ${plan?`<p class="speed-plan-summary"><strong>${safe(PACKS[plan.pack].title)} · ${plan.seconds}s · ${plan.goal}% goal</strong><span>Keys: ${plan.keys.map(key=>key===' '?'Space':safe(key)).join(' · ')}</span></p>
      <div class="speed-plan-actions"><button type="button" class="btn btn-primary" data-action="speed-plan-launch">START SAVED ROUTINE</button><button type="button" class="btn btn-outline" data-action="speed-plan-clear">REMOVE PLAN</button></div>`
      :'<p>No plan saved. Finish a drill with missed keys, or complete a focused attempt, to save a practice goal for next time.</p>'}
    ${candidate?`<button type="button" class="btn btn-outline speed-plan-save" data-action="speed-plan-save" ${matches?'disabled':''}>${matches?'PLAN SAVED':plan?'REPLACE SAVED PLAN':'SAVE FOCUS PLAN'}</button>`:''}
    <p class="speed-plan-note">One optional plan on this browser. Only category, duration, goal and up to five target keys are saved. Starting it creates a fresh routine; attempt progress and typed text are never stored. Score export and clear-results controls do not include this plan. Remove it here.</p>
  </section>`;
}

function trainingMilestonesView(activity) {
  if(!activity)return '';
  const dateLabel=day=>day.slice(5).replace('-','/');
  const periodLabel=period=>`${dateLabel(period.from)}–${dateLabel(period.through)}`;
  const counts=period=>`${period.routines} ${period.routines===1?'routine':'routines'} · ${period.activeDays} active ${period.activeDays===1?'day':'days'}`;
  return `<section class="speed-training-milestones" aria-labelledby="speed-training-milestones-heading" data-reached="${activity.reached}">
    <h4 id="speed-training-milestones-heading">PRACTICE MILESTONES · LAST 30 DAYS</h4>
    <p>${activity.reached} of ${activity.milestones.length} milestones reached in the current window.</p>
    <ul>${activity.milestones.map(item=>`<li data-milestone="${item.id}" data-reached="${item.reached}"><div><strong>${item.label}</strong><span>${item.reached?'Reached':`${item.value} of ${item.target}`}</span></div><progress aria-label="${item.label}" max="${item.target}" value="${Math.min(item.value,item.target)}"></progress></li>`).join('')}</ul>
    <h4>RECENT PRACTICE · TWO SEVEN-DAY WINDOWS</h4>
    <div class="speed-training-weeks"><div><small>LAST 7 DAYS · ${periodLabel(activity.recent)}</small><strong>${counts(activity.recent)}</strong></div><div><small>PREVIOUS 7 DAYS · ${periodLabel(activity.previous)}</small><strong>${counts(activity.previous)}</strong></div></div>
    <p>These are optional rolling activity markers, not permanent awards or skill ratings. Practice days need not be consecutive. Older activity naturally leaves the window; no missed-day penalty.</p>
  </section>`;
}

export function guidedActivityPanel() {
  const now=new Date(), saved=readGuidedActivity(undefined,now);
  const activity=summarizeGuidedActivity(saved,now);
  const milestones=summarizeTrainingMilestones(saved,now);
  return `<section id="speed-guided-activity" class="speed-saved-focus-plan speed-guided-activity" aria-labelledby="speed-guided-activity-heading" data-enabled="${activity.enabled}" data-total="${activity.total}">
    <h3 id="speed-guided-activity-heading" tabindex="-1">GUIDED TRAINING ACTIVITY</h3>
    ${activity.enabled?`<div class="speed-guided-stats"><div><small>LAST 30 DAYS</small><strong>${activity.total}</strong><span>Completed routines</span></div><div><small>ACTIVE DAYS</small><strong>${activity.activeDays}</strong><span>of 30 days</span></div><div><small>TODAY</small><strong>${activity.today}</strong><span>Completed routines</span></div></div>
      <div class="speed-guided-days" role="group" aria-label="Last 30 local calendar days of guided training">${activity.days.map(day=>`<span class="${day.count?'has-activity':''}" title="${day.key}: ${day.count} completed routines" aria-label="${day.key}: ${day.count} completed routines" role="img"></span>`).join('')}</div>
      <p>One count when a guided routine first reaches its goal. Ordinary drills, retries of a completed routine and partial attempts do not count. A maximum of 999 completions per day is retained.</p>
      ${trainingMilestonesView(milestones)}
      <button type="button" class="btn btn-outline" data-action="speed-activity-clear">TURN OFF &amp; CLEAR ACTIVITY</button>`:
      '<p>Optional: remember how many guided routines you finish each day. Tracking is off until you enable it; past routines are not added retroactively.</p><button type="button" class="btn btn-outline" data-action="speed-activity-enable">ENABLE LOCAL ACTIVITY</button>'}
    <p class="speed-plan-note">Local calendar counts only. No typed text, keys, scores or individual attempts are saved. Older days are excluded and pruned on the next completion. This is a training consistency indicator, not a skill rating. Separate from saved plans and personal score exports.</p>
  </section>`;
}

export function dailyPracticePanel(session) {
  const suggestion=recommendDailyPractice(session,readFocusPlan(),readGuidedActivity());
  const keysText=keys=>keys.map(key=>key===' '?'Space':safe(key)).join(' · ');
  const title={
    'done-today':'TODAY’S GUIDED PRACTICE IS COMPLETE',
    'done-session':'YOU COMPLETED A GUIDED ROUTINE',
    continue:'CONTINUE YOUR CURRENT ROUTINE',
    saved:'REVISIT YOUR SAVED FOCUS PLAN',
    review:'TURN YOUR MISSED KEYS INTO PRACTICE',
    regular:'START WITH A REGULAR DRILL'
  }[suggestion.kind];
  const descriptions={
    'done-today':()=>`${suggestion.today} completed ${suggestion.today===1?'routine':'routines'} recorded today. That is enough for this optional suggestion. Take a break or choose another drill whenever you want.`,
    'done-session':()=> 'Your current guided routine reached its goal. You can stop here or practice again whenever you want.',
    continue:()=> 'Finish the current routine at a comfortable pace. Two qualifying attempts in the same keyboard mode complete it.',
    saved:()=> `${safe(PACKS[suggestion.plan.pack].title)} · ${suggestion.plan.seconds}s · ${suggestion.plan.goal}% goal. Focus keys: ${keysText(suggestion.plan.keys)}.`,
    review:()=> `${safe(PACKS[suggestion.pack].title)} · ${suggestion.seconds}s. Practice the missed keys ${keysText(suggestion.keys)} at your selected accuracy goal.`,
    regular:()=> `${safe(PACKS[suggestion.pack].title)} · ${suggestion.seconds}s. Complete a regular drill to discover keys worth practicing; no speed target is required.`
  };
  const action={saved:'START SAVED ROUTINE',review:'START GUIDED ROUTINE',regular:'START REGULAR DRILL'}[suggestion.kind];
  return `<section id="speed-daily-practice" class="speed-saved-focus-plan speed-daily-practice" aria-labelledby="speed-daily-practice-heading" data-suggestion="${suggestion.kind}">
    <h3 id="speed-daily-practice-heading">TODAY’S PRACTICE · OPTIONAL</h3>
    <p class="speed-daily-title"><strong>${title}</strong></p><p>${descriptions[suggestion.kind]()}</p>
    ${action?`<button type="button" class="btn btn-primary" data-action="speed-daily-start">${action}</button>`:''}
    <p class="speed-plan-note">Based only on your saved plan, current drill and optional local activity. No extra tracking, required streaks or daily deadlines. Refresh or reopen Speed Lab for a new calendar day.</p>
  </section>`;
}

function accuracyLadderPanel(session) {
  const ladder=session.accuracyLadder;
  if(!ladder)return `<section id="speed-accuracy-ladder" class="speed-saved-focus-plan" aria-labelledby="speed-ladder-heading" data-ladder="off"><h3 id="speed-ladder-heading">ACCURACY LADDER · THREE ROUNDS</h3><p>Take on three increasingly demanding accuracy rounds in your selected category. No personal scores, saved progress, or daily activity counts are added.</p><p>15s · 90% · 20 positions → 30s · 95% · 40 positions → 60s · 98% · 60 positions.</p><button type="button" class="btn btn-primary" data-action="speed-ladder-start">START ACCURACY LADDER</button></section>`;
  const stage=ACCURACY_LADDER[ladder.stage];
  const notes={ready:'Reach the accuracy goal and submit enough positions before the round ends.',passed:'Round passed. Continue to the next round when ready.',complete:'All three rounds passed. Your ladder is complete.',interrupted:'This round was interrupted. Retry it without losing earlier rounds.','below-goal':'Accuracy was below the exact goal. Retry this round at your own pace.',insufficient:'Too few positions were submitted. Retry this round.'};
  const completed=ladder.status==='complete'?ACCURACY_LADDER.length:ladder.stage+(ladder.status==='passed'?1:0);
  return `<section id="speed-accuracy-ladder" class="speed-saved-focus-plan speed-ladder-active" aria-labelledby="speed-ladder-heading" data-ladder="${ladder.status}" data-stage="${ladder.stage+1}">
    <h3 id="speed-ladder-heading">ACCURACY LADDER · ROUND ${ladder.stage+1} OF ${ACCURACY_LADDER.length}</h3>
    <ol class="speed-ladder-rounds">${ACCURACY_LADDER.map((round,i)=>`<li ${i===ladder.stage?'aria-current="step"':''}><strong>${round.name}</strong><span>${round.seconds}s · ${round.goal}% · ${round.minimum} positions</span><small>${i<completed?'PASSED':i===ladder.stage?'CURRENT':'UPCOMING'}</small></li>`).join('')}</ol>
    <progress aria-label="Passed ladder rounds" max="${ACCURACY_LADDER.length}" value="${completed}"></progress>
    <p><strong>${stage.name}: ${stage.goal}% accuracy, at least ${stage.minimum} submitted positions (including spaces).</strong></p><p role="status">${notes[ladder.status]}</p>
    ${ladder.status==='passed'?'<button type="button" class="btn btn-primary" data-action="speed-ladder-next">NEXT ROUND</button>':''}
    <p class="speed-plan-note">Accuracy uses the exact final fraction, not rounded display accuracy. Paused rounds do not qualify. Restart retries the current round (or starts a new ladder after completion). Changing category or duration, launching another routine, or leaving Speed Lab ends the ladder. No ladder data is saved.</p>
    <button type="button" class="btn btn-outline" data-action="speed-regular">EXIT TO REGULAR DRILL</button>
  </section>`;
}

function survivalPanel(session) {
  const run=session.survival;
  if(!run)return `<section id="speed-survival" class="speed-saved-focus-plan" aria-labelledby="speed-survival-heading" data-survival="off"><h3 id="speed-survival-heading">SURVIVAL · FIVE WAVES</h3><p>Finish five growing passages in your selected category. Each wave has 30 seconds, and you have five uncorrected mistakes to spend across the entire challenge. Backspace corrections are free. No personal records or activity counts are saved.</p><button type="button" class="btn btn-primary" data-action="speed-survival-start">START SURVIVAL</button></section>`;
  const notes={ready:'Complete the whole passage before the clock expires. Correct mistakes before the final character.',passed:'Wave cleared. Continue when ready.',complete:'All five waves cleared. Survival complete!',interrupted:'This wave was interrupted. Retry it with the same remaining budget.',timeout:'Time expired before the passage was complete. Start a new run.',depleted:'The mistake budget was exceeded. Start a new run.'};
  const completed=run.status==='complete'?SURVIVAL_WAVES.length:run.wave+(run.status==='passed'?1:0);
  return `<section id="speed-survival" class="speed-saved-focus-plan speed-ladder-active" aria-labelledby="speed-survival-heading" data-survival="${run.status}" data-wave="${run.wave+1}" data-budget="${run.remaining}">
    <h3 id="speed-survival-heading">SURVIVAL · WAVE ${run.wave+1} OF ${SURVIVAL_WAVES.length}</h3>
    <ol class="speed-ladder-rounds speed-survival-rounds">${SURVIVAL_WAVES.map((count,i)=>`<li ${i===run.wave?'aria-current="step"':''}><strong>Wave ${i+1}</strong><span>${count} ${session.pack==='numpad'?'groups':'tokens'} · ${SURVIVAL_SECONDS}s</span><small>${i<completed?'CLEARED':i===run.wave?'CURRENT':'UPCOMING'}</small></li>`).join('')}</ol>
    <progress aria-label="Cleared survival waves" max="${SURVIVAL_WAVES.length}" value="${completed}"></progress>
    <p><strong>${run.remaining} of ${SURVIVAL_BUDGET} mistakes remaining</strong> · Budget updates when a wave ends. Zero remaining still allows a perfect wave.</p><p role="status">${notes[run.status]}</p>
    ${run.status==='passed'?'<button type="button" class="btn btn-primary" data-action="speed-survival-next">NEXT WAVE</button>':''}
    <p class="speed-plan-note">No data is saved. An unfinished passage or exceeded budget ends the run. Restart starts from wave one, except after an interruption, when it retries the same wave. Changing category or duration, opening another practice mode, or exiting ends the run.</p>
    <button type="button" class="btn btn-outline" data-action="speed-regular">EXIT TO REGULAR DRILL</button>
  </section>`;
}

export function speedTemplate(session, header) {
  const done = session.status === 'complete';
  const result = session.result;
  const targeted=Boolean(session.targetKeys?.length);
  const focusedKeys=targeted?session.targetKeys.map(key=>key===' '?'Space':safe(key)).join(' · '):'';
  return `${header({inGame:true})}<main class="speed-page shell" data-speed="${safe(session.pack)}" data-word-focus="${session.focusPractice===true}" data-targeted="${targeted}">
    <div class="speed-topline"><button class="text-button" data-action="speed-home">${ico('arrow',16)} BACK TO HOME</button><span>// PERSONAL TRAINING / ZERO PRESSURE FROM TEAMMATES</span></div>
    <div class="speed-title">${tag('THE SPEED LAB / SOLO MODE')}<h1>FIND YOUR <em>RHYTHM.</em></h1><p>${session.pack==="numpad"?"NUMPAD CHALLENGE: Practice digit groups with Space or Numpad Enter between groups. Track characters per minute (CPM) and accuracy.":"Inspired by the fast feedback of TypeNinja. The timer starts on your first keystroke. Mistakes glow red, correct characters turn green, and Backspace lets you correct errors."}</p>${PACKS[session.pack].keyboard?`<p>${safe(PACKS[session.pack].description)}</p>`:""}</div>
    <section class="speed-console" aria-label="Timed typing test">
      <div class="speed-settings"><div class="speed-setting"><span>TIME LIMIT</span><div class="speed-choices" role="group" aria-label="Duration">${DURATIONS.map(seconds => `<button type="button" data-action="speed-duration" data-seconds="${seconds}" aria-pressed="${seconds===session.seconds}">${seconds}s</button>`).join('')}</div></div>
      <div class="speed-setting speed-setting--packs"><span>PRACTICE CATEGORY</span><div class="speed-pack-sections"><div class="speed-pack-section"><span>CORE DRILLS</span><div class="speed-choices" role="group" aria-label="Core practice categories">${speedPackChoices("core",session.pack)}</div></div><div class="speed-pack-section"><span>KEYBOARD CHALLENGES</span><div class="speed-choices" role="group" aria-label="Keyboard practice categories">${speedPackChoices("keyboard",session.pack)}</div></div><div class="speed-pack-section"><span>WORKPLACE DRILLS</span><div class="speed-choices" role="group" aria-label="Workplace practice categories">${speedPackChoices("workplace",session.pack)}</div></div></div></div></div>
      ${targeted?`<section id="speed-targeted-banner" class="speed-targeted-banner" aria-label="Targeted key practice"><div><strong>TARGETED PRACTICE · NOT SAVED</strong><p>Focus keys: ${focusedKeys}. Extra repetitions, same timer and scoring, no personal records.</p></div><button type="button" class="btn btn-outline" data-action="speed-regular">RETURN TO REGULAR DRILL</button></section>`:""}
      ${speedFocusRoutine(session)}
      ${session.accuracyLadder?accuracyLadderPanel(session):''}
      ${session.survival?survivalPanel(session):''}
      <div class="speed-metrics"><div><span>TIME REMAINING</span><strong id="speed-time" class="speed-clock">${done ? 0 : session.seconds}</strong><small>SECONDS</small></div><div><span>NET SPEED</span><strong id="speed-wpm">${done ? (session.pack==="numpad"?result.cpm:result.wpm) : 0}</strong><small>${session.pack==="numpad"?"CPM":"WPM"}</small></div><div><span>ACCURACY</span><strong id="speed-accuracy">${done ? `${result.accuracy}%` : "100%"}</strong><small>CORRECT KEYS</small></div><div><span>RAW SPEED</span><strong id="speed-raw">${done ? (session.pack==="numpad"?result.rawCpm:result.rawWpm) : 0}</strong><small>${session.pack==="numpad"?"CPM":"WPM"}</small></div></div>
      ${done ? `<div class="speed-results" role="status" aria-live="polite"><p class="speed-assist-result-label">${result.keyboardAssisted===true?"MOBILE ASSISTED":"EXACT TYPING"} · ${session.phoneLayout?"PHONE LAYOUT":"DESKTOP LAYOUT"}${session.interrupted?" · INTERRUPTED PRACTICE (NOT SAVED)":""}${targeted?" · TARGETED PRACTICE (NOT SAVED)":""}${session.accuracyLadder?" · ACCURACY LADDER (NOT SAVED)":""}${session.survival?" · SURVIVAL (NOT SAVED)":""}</p>${tag('SESSION FINISHED')}<h2 id="speed-results-heading" tabindex="-1">YOU FOUND YOUR PACE.</h2><div class="speed-result-hero"><strong>${session.pack==="numpad"?result.cpm:result.wpm} <small>${session.pack==="numpad"?"CPM":"WPM"}</small></strong><div><span>ACCURACY <b>${result.accuracy}%</b></span><span>RAW SPEED <b>${session.pack==="numpad"?result.rawCpm:result.rawWpm} ${session.pack==="numpad"?"CPM":"WPM"}</b></span><span>CORRECT CHARACTERS <b>${result.correct}</b></span><span>MISTAKES REMAINING <b>${result.incorrect}</b></span></div></div><p>${session.pack==="numpad"?"CPM measures correctly typed digits per minute.":"Results measure correctly typed characters."} ${session.interrupted?"This run was paused during practice. Its score is practice-only and was not added to personal records.":targeted?"This targeted score is practice-only and was not added to personal records.":session.accuracyLadder?"Ladder results are practice-only and are not added to personal records.":session.survival?"Survival results are practice-only and are not added to personal records.":"Mobile assistance is labeled separately from exact typing."} Press Ctrl + Enter or click Test Again to try again.</p>${speedFocusedComparison(session)}${session.accuracyLadder||session.survival?"":speedKeyReview(session)}<button class="btn btn-primary btn-large" data-action="speed-restart">${ico('refresh',18)} ${session.accuracyLadder?(session.accuracyLadder.status==='complete'?'NEW LADDER':'RETRY ROUND'):session.survival?(session.survival.status==='interrupted'?'RETRY WAVE':'NEW SURVIVAL RUN'):'TEST AGAIN'}</button></div>` : `<div class="speed-prompt-wrap"><div class="speed-prompt-label"><span><i class="command-live"></i> ${session.pack==="numpad"?"NUMPAD / DIGIT ACCURACY":"LIVE CHARACTER FEEDBACK"}</span><span id="speed-mode">${session.status==='running'?'SESSION LIVE':'TIMER STARTS WHEN YOU TYPE'}</span></div>
        <div id="speed-letters" class="typing-feedback speed-letters" aria-live="off"></div>
        <div class="speed-page-indicator">CONTINUOUS PASSAGE · <span id="speed-progress">${session.pack==="numpad"?"0 digits typed":"0 characters typed"}</span> · ${session.pack==="numpad"?"SPACE OR NUMPAD ENTER BETWEEN GROUPS":"WORDS ADVANCE UPWARD ONLY"}</div>
        <div class="typing-legend"><span><i class="legend-correct"></i> CORRECT</span><span><i class="legend-incorrect"></i> INCORRECT</span><span><i class="legend-caret"></i> NEXT KEY</span></div></div>
        <div id="speed-pause-banner" class="speed-pause-banner" role="status" aria-live="polite" hidden><strong>SESSION PAUSED.</strong><p>The clock is stopped and your typed work is safe. Resume when ready. Paused sessions are practice-only and are not saved to personal records.</p><button type="button" class="btn btn-primary" data-action="speed-resume">RESUME TYPING</button></div>
        <div class="speed-mobile-entry mobile-typing-entry" id="speed-mobile-entry">
          <div class="mobile-speed-cue" aria-hidden="true">
            <small class="speed-focus-heading">ACTIVE ${session.pack==="numpad"?"NUMBER GROUP":"WORD"} · SPACE TO ADVANCE</small>
            <div id="speed-focus-word" class="speed-focus-word"></div>
            <small class="speed-stream-heading">NEXT CHARACTERS · TYPE WHAT YOU SEE</small>
            <div class="speed-stream-cue"><span id="speed-mobile-first"></span><span id="speed-mobile-rest"></span></div>
          </div>
          <div class="speed-focus-settings" role="group" aria-label="Touch practice presentation"><button id="speed-focus-toggle" type="button" data-action="speed-focus" aria-pressed="${session.focusPractice===true}">WORD FOCUS: ${session.focusPractice===true?"ON":"OFF"}</button><p id="speed-focus-detail" role="note">${session.focusPractice===true?"One word or number group at a time. The full passage and scoring stay unchanged.":"Full passage visible. Your accuracy and timer stay unchanged."}</p></div>
        ${session.pack!=="numpad"?`<div class="speed-assist-settings" role="group" aria-label="Phone keyboard assistance"><button id="speed-assist-toggle" type="button" data-action="speed-assist" aria-pressed="${session.keyboardAssist===true}">KEYBOARD HELP: ${session.keyboardAssist===true?"ON":"OFF"}</button><p id="speed-assist-detail" role="note">${session.keyboardAssist===true?"Phone predictions and autocorrect allowed. Score marked Assisted; suggestions depend on your keyboard settings.":"Exact typing. Native keyboard assistance is off."}</p></div>`:""}<label id="speed-input-instructions" for="speed-input" class="speed-input-label">${session.pack==="numpad"?"TYPE THE DIGITS ABOVE — SPACE OR NUMPAD ENTER BETWEEN GROUPS":"TYPE THE WORDS ABOVE — USE BACKSPACE TO FIX MISTAKES"}</label>
        <span id="speed-screenreader-target" class="practice-sr-only" role="status" aria-live="polite" aria-atomic="true">${safe(speedSpokenTarget(session.reference,session.typed,session.pack==="numpad"))}</span>
        <textarea id="speed-input" class="speed-input" rows="2" spellcheck="${session.keyboardAssist===true?"true":"false"}" autocorrect="${session.keyboardAssist===true?"on":"off"}" autocapitalize="off" autocomplete="${session.keyboardAssist===true?"on":"off"}" inputmode="${session.pack==="numpad"?"numeric":"text"}" enterkeyhint="next" aria-label="${session.pack==="numpad"?"Type the displayed number groups":"Type the displayed words"}" aria-describedby="speed-input-instructions speed-mode speed-screenreader-target" placeholder="Click here or start typing to begin..."></textarea>
          <div class="mobile-entry-actions"><button type="button" data-action="speed-space" aria-label="Type a space character">SPACE / NEXT</button><button type="button" data-action="speed-back-word" aria-label="Delete previous word or number group at the cursor">BACK WORD</button><button type="button" data-action="speed-pause" aria-label="Pause for practice. This session will not be saved." disabled>PAUSE</button><button type="button" data-action="speed-restart">RESTART</button></div>
        </div>
        <div class="speed-controls"><span>TIME STARTS ON FIRST KEY · PAUSE MAKES A RUN PRACTICE-ONLY · CTRL + ENTER TO RESTART</span><button type="button" class="btn btn-outline" data-action="speed-pause" aria-label="Pause for practice. This session will not be saved." disabled>PAUSE PRACTICE</button><button class="btn btn-outline" data-action="speed-restart">${ico('refresh',16)} RESTART</button></div>`}
    </section>
    ${session.accuracyLadder||session.survival?'':accuracyLadderPanel(session)}
    ${session.accuracyLadder||session.survival?'':survivalPanel(session)}
    ${session.accuracyLadder||session.survival?'':dailyPracticePanel(session)}
    ${savedFocusPlanPanel(session)}
    ${guidedActivityPanel()}
    <div class="speed-bottom"><section><span>// YOUR RECENT RESULTS</span><h2>PERSONAL RECORDS.</h2><div id="speed-history-panel">${speedHistoryPanel()}</div>${speedInsightsPanel(session)}</section><aside><span>// PRACTICE PROFILE</span><h2>${safe(PACKS[session.pack].title)}</h2><p>${safe(PACKS[session.pack].description)}</p><p>Timed solo drills use local browser storage, so you can train without an account. None of these words are shell commands.</p></aside></div>
  </main>`;
}
