import { milestoneTemplate } from './player-milestones.js?v=0.1.0';
/** Read-only cross-mode dashboard. Existing local records only; no additional storage. */
import { LESSONS, savedLessons } from './lessons.js?v=0.2.2';
import { readAcademyCheckpoints } from './academy-checkpoint.js?v=0.1.4';
import { readSpeedHistory, PACKS, DURATIONS } from './speed-engine.js?v=0.40.1';
import { practiceMode, readFocusPlan, readGuidedActivity, summarizeGuidedActivity } from './speed-insights.js?v=0.48.14';
import { readRecentLyricResults } from './lyric-history.js';
import { readCareer } from './progression.js';
import { safe, tag } from './helpers.js';

const metric=(n,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
const modes={'standard-exact':'Desktop exact','mobile-exact':'Phone exact','mobile-assisted':'Phone assisted'};
export function summarizePlayerDossier(storage=globalThis.localStorage,now=new Date()){
 const badges=savedLessons(storage), checkpoints=readAcademyCheckpoints(storage);
 const courses=Object.entries(LESSONS).map(([id,lesson])=>({
  id,name:lesson.name,total:lesson.commands.length,completed:badges[id]===true,
  progress:checkpoints[id]?checkpoints[id].index+Number(checkpoints[id].answered):null
 }));
 const records=readSpeedHistory(storage).filter(run=>run&&Object.hasOwn(PACKS,run.pack)&&DURATIONS.includes(run.seconds)
  &&metric(run.wpm,5000)&&metric(run.accuracy,100)
  &&(run.pack!=='numpad'||metric(run.cpm,30000))&&Object.hasOwn(modes,practiceMode(run)));
 const recent=records[0];
 const speed=recent?{label:PACKS[recent.pack].title,seconds:recent.seconds,mode:modes[practiceMode(recent)],
  value:Math.round(recent.pack==='numpad'?recent.cpm:recent.wpm),unit:recent.pack==='numpad'?'CPM':'WPM',accuracy:Math.round(recent.accuracy)}:null;
 const lyrics=readRecentLyricResults(storage,5),lyric=lyrics[0]??null;
 const career=readCareer(storage);
 const activity=summarizeGuidedActivity(readGuidedActivity(storage,now),now);
 return {courses,completed:courses.filter(c=>c.completed).length,
  unfinished:courses.filter(c=>c.progress!==null),speed,speedCount:records.length,
  lyric,lyricCount:lyrics.length,activity:activity.enabled?{days:activity.activeDays,total:activity.total}:null,
  focusSaved:Boolean(readFocusPlan(storage)),
  storyRuns:Number.isSafeInteger(career.runs)?career.runs:0,
  storyWins:Number.isSafeInteger(career.wins)?Math.min(career.runs,career.wins):0};
}

export function playerDossierTemplate({storage=globalThis.localStorage,browserEdition=false,now=new Date()}={}){
 const d=summarizePlayerDossier(storage,now);
 return `<section class="player-dossier shell" id="player-dossier" aria-labelledby="player-dossier-heading">
  <div class="record-head">${tag('PLAYER DOSSIER / ON THIS DEVICE')}
   <h2 id="player-dossier-heading">YOUR <em>JOURNEY.</em></h2>
   <p>Explore your saved progress across modes. Results have different scoring rules and are never combined into a rank. No new tracking is enabled.</p>
  </div>
  <div class="dossier-grid">
   <article class="dossier-card" data-dossier="academy"><h3>Field Academy</h3>
    <strong class="dossier-metric">${d.completed} / ${d.courses.length}</strong><p>Courses completed</p>
    <progress value="${d.completed}" max="${d.courses.length}" aria-label="Completed Academy courses"></progress>
    ${d.unfinished.length?`<ul>${d.unfinished.map(c=>`<li>${safe(c.name)}: ${c.progress}/${c.total} steps${c.completed?' (replay)':''}</li>`).join('')}</ul>`:'<p>No unfinished courses on this device.</p>'}
    <a href="#academy">Explore courses</a>
   </article>
   <article class="dossier-card" data-dossier="speed"><h3>Speed Lab</h3>
    ${d.speed?`<strong class="dossier-metric">${d.speed.value} ${d.speed.unit}</strong><p>Latest saved drill · ${d.speed.accuracy}% accuracy</p><p>${safe(d.speed.label)} · ${d.speed.seconds}s · ${safe(d.speed.mode)}</p>`:'<p>No saved regular drill yet.</p>'}
    <p>${d.speedCount} retained regular results (up to 25).</p>
    ${d.focusSaved?'<p>Saved focus plan available.</p>':''}
    ${d.activity?`<p>${d.activity.total} guided routines across ${d.activity.days} practice days in the last 30 days.</p>`:'<p>Optional guided activity is off.</p>'}
    <a href="#speed-lab">Explore Speed Lab</a>
   </article>
   <article class="dossier-card" data-dossier="lyric"><h3>Lyric Lab</h3>
    ${d.lyric?`<strong class="dossier-metric">${d.lyric.wpm} WPM</strong><p>Latest saved performance · ${d.lyric.accuracy}% accuracy</p><p>${safe(d.lyric.title)}${d.lyric.artist?' · '+safe(d.lyric.artist):''}</p><p>${d.lyric.skipped} skipped</p>`:'<p>No saved lyric performance yet.</p>'}
    <a href="#lyric-lab">Explore Lyric Lab</a>
   </article>
   <article class="dossier-card" data-dossier="story"><h3>Story adventures</h3>
    <strong class="dossier-metric">${d.storyWins}</strong><p>Successful extractions · ${d.storyRuns} recorded operations</p>
    ${browserEdition?'<p>Story play requires the local Python edition. Any record shown is from this browser only.</p>':'<p>Play solo with ECHO or invite a friend.</p>'}
    <a href="#career-record">View story field record</a>
   </article>
  </div>
  ${milestoneTemplate(d,browserEdition)}
 </section>`;
}
