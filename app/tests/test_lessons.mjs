import { RHYTHM_CHALLENGES, rhythmOutcome } from '../web/ui/lyric-rhythm.js';
import { parseLRC } from '../web/ui/lyric-lab-core.js';
import { playerMilestones } from '../web/ui/player-milestones.js';
/** Training reference integrity and isolation: no command execution is exposed. */
import test from 'node:test';
import { summarizePlayerDossier, playerDossierTemplate } from '../web/ui/player-dossier.js';
import assert from 'node:assert/strict';
import { LESSONS, matchesCommand, savedLessons, saveLesson } from '../web/ui/lessons.js';
import { trainingTemplate, trainingLibrary } from '../web/ui/training-view.js';
import { LESSON_OUTPUTS } from '../web/ui/lesson-output.js';
import { COMMAND_GUIDES } from '../web/ui/command-guides.js';

const saved = new Map();
globalThis.localStorage = {
  getItem(key) { return saved.get(key) ?? null; },
  setItem(key, value) { saved.set(key, String(value)); },
};
const header = () => '<header>TEST HEADER</header>';
const session = (os, overrides = {}) => ({
  os, index:0, answered:false, errors:0, completed:false, review:false, errorMessage:'', draft:'', ...overrides,
});

test('nine separate courses teach curated real commands with context', () => {
  assert.deepEqual(Object.keys(LESSONS).sort(), ['docker','git','linux','macos','network','python','services','sql','windows']);
  for (const [id,lesson] of Object.entries(LESSONS)) {
    const count=['git','network','docker','sql','python','services'].includes(id)?10:14;
    assert.equal(lesson.commands.length,count);
    assert.ok(lesson.story.length>60);
    for (const command of lesson.commands) {
      assert.ok(command.text.length>1);
      assert.ok(command.title.length>3);
      assert.ok(command.detail.length>25);
    }
    assert.equal(new Set(lesson.commands.map(c=>c.text)).size,count);
  }
});

test('platform differences are accurate rather than pretending Linux equals macOS', () => {
  assert.ok(LESSONS.macos.commands.some(c=>c.text==='open .'));
  assert.ok(LESSONS.macos.commands.some(c=>c.text==='sw_vers'));
  assert.ok(LESSONS.windows.commands.some(c=>c.text==='Get-Service'));
  assert.ok(LESSONS.windows.commands.some(c=>c.text==='Get-Process'));
  assert.ok(LESSONS.linux.commands.some(c=>c.text==='ps aux'));
  assert.ok(LESSONS.linux.commands.some(c=>c.text==='chmod u+x script.sh'));
});

test('typing preserves meaningful case, ignores only accidental whitespace', () => {
  assert.equal(matchesCommand('  ls   -la  ','ls -la'),true);
  assert.equal(matchesCommand('get-childitem','Get-ChildItem'),false);
  assert.equal(matchesCommand('ls -l','ls -la'),false);
  assert.equal(matchesCommand('rm -rf /','pwd'),false);
});

test('all 102 real commands have clearly fictionalized example output', () => {
  for (const [os, lesson] of Object.entries(LESSONS)) {
    assert.equal(LESSON_OUTPUTS[os].length, lesson.commands.length);
    for (const output of LESSON_OUTPUTS[os]) assert.ok(output.length >= 4);
  }
});

test('training UI makes simulated safety and context unmistakable', () => {
  const page = trainingTemplate(session('windows'),header);
  assert.match(page,/SIMULATED CONSOLE/);
  assert.match(page,/No real shell commands are executed|nothing runs|nothing was executed/i);
  assert.match(page,/WHAT DOES IT DO/);
  assert.match(page,/Get-Location/);
  assert.match(page,/CHECK COMMAND/);
  assert.match(page,/PS C:/);
});

test('correct answer creates visible success state and a manual next step', () => {
  const page = trainingTemplate(session('linux',{answered:true}),header);
  assert.match(page,/COMMAND RECOGNIZED/);
  assert.match(page,/SIMULATED TERMINAL OUTPUT/);
  assert.match(page,/home\/operator/);
  assert.match(page,/NEXT COMMAND/);
  assert.doesNotMatch(page,/CHECK COMMAND ↵/);
});

test('optional full guide and completed guide include all fourteen explanations', () => {
  for (const options of [{review:true},{completed:true,index:13}]) {
    const page=trainingTemplate(session('macos',options),header);
    assert.match(page,/YOUR FIELD MANUAL/);
    assert.match(page,/screencapture -i screenshot.png/);
    assert.match(page,/man open/);
  }
});

test('completion is stored locally and corrupt browser storage is tolerated', () => {
  assert.match(trainingLibrary(),/OPEN TERMINAL/);
  saveLesson('linux');
  assert.equal(savedLessons().linux,true);
  assert.match(trainingLibrary(),/COMPLETED ✓/);
  saved.set('panic.lessons.v1','{not-json');
  assert.deepEqual(savedLessons(),{});
});

test('Git and network lessons retain exact command case and platform context',()=>{
 for(const id of ['git','network']){
  const lesson=LESSONS[id];
  assert.equal(lesson.commands.length,10);
  assert.match(lesson.note,/simulated|never sends traffic/);
  for(let index=0;index<lesson.commands.length;index++){
   const command=lesson.commands[index];
   const html=trainingTemplate(session(id,{index,answered:true,referenceIndex:index}),header);
   assert.match(html,/SIMULATED TERMINAL OUTPUT/);
   assert.match(html,/WHAT DOES IT DO/);
   assert.ok(LESSON_OUTPUTS[id][index].trim().length>0);
   assert.equal(matchesCommand(command.text,command.text),true);
  }
  const complete=trainingTemplate(session(id,{completed:true,index:9}),header);
  assert.match(complete,/All 10 commands completed/);
  assert.match(complete,/YOUR FIELD MANUAL/);
 }
 assert.ok(LESSONS.network.commands.some(c=>c.text==='ping -n 4 192.0.2.1'));
 assert.ok(LESSONS.network.commands.some(c=>c.text==='ping -c 4 192.0.2.1'));
 assert.ok(LESSONS.git.commands.some(c=>c.text==='git diff --staged'));
 assert.match(trainingLibrary(),/9 hands-on practice courses/);
});

test('Docker and SQL courses teach inspection only, with aligned simulated output and reference',()=>{
 for(const id of ['docker','sql']){
  const lesson=LESSONS[id];
  assert.equal(lesson.commands.length,10);
  assert.match(lesson.note,/simulated/);
  for(let index=0;index<lesson.commands.length;index++){
   const command=lesson.commands[index];
   assert.match(command.text,id==='docker'?/^docker /:/^SELECT .*;$/);
   const html=trainingTemplate(session(id,{index,answered:true,referenceIndex:index}),header);
   assert.match(html,/SIMULATED TERMINAL OUTPUT/);
   assert.match(html,/WHAT DOES IT DO/);
   assert.ok(LESSON_OUTPUTS[id][index].trim().length>0);
   assert.equal(matchesCommand(command.text,command.text),true);
   if(id==='sql')assert.match(html,/sqlite>/);
  }
  assert.match(trainingTemplate(session(id,{completed:true,index:9}),header),/All 10 commands completed/);
 }
 assert.ok(LESSONS.docker.commands.some(c=>c.text==='docker compose ps -a'));
 assert.ok(LESSONS.sql.commands.some(c=>c.text.includes(' JOIN ')));
 assert.match(trainingLibrary(),/9 hands-on practice courses/);
});

test('every Academy command has one matching guide and nonempty illustrative output',()=>{
 assert.deepEqual(Object.keys(COMMAND_GUIDES).sort(),Object.keys(LESSONS).sort());
 assert.deepEqual(Object.keys(LESSON_OUTPUTS).sort(),Object.keys(LESSONS).sort());
 for(const [id,lesson] of Object.entries(LESSONS)){
  assert.equal(COMMAND_GUIDES[id].length,lesson.commands.length);
  assert.equal(LESSON_OUTPUTS[id].length,lesson.commands.length);
  for(const guide of COMMAND_GUIDES[id])for(const field of ['use','benefit','caution'])
   assert.ok(typeof guide[field]==='string'&&guide[field].trim().length>10,id+' has contextual '+field);
  for(const output of LESSON_OUTPUTS[id])assert.ok(output.trim().length>0);
 }
});
test('SQL sample outputs refer to the same five fictional inventory records',()=>{
 const rows=LESSON_OUTPUTS.sql[0].split('\n').slice(1).map(line=>line.split('|').map(value=>value.trim()));
 assert.equal(rows.length,5);
 assert.equal(rows.reduce((sum,row)=>sum+Number(row[1]),0),58);
 assert.equal(LESSON_OUTPUTS.sql[5].trim().split('\n').at(-1),'5');
 assert.equal(LESSON_OUTPUTS.sql[6].trim().split('\n').at(-1),'58');
 assert.deepEqual(LESSON_OUTPUTS.sql[1].split('\n').slice(1),rows.filter(row=>Number(row[1])<10).map(row=>row[0]));
 assert.equal(LESSON_OUTPUTS.sql[9].split('\n').length,6);
});


test('Python tooling and systemd diagnostics provide ten simulated independent steps each',()=>{
 for(const id of ['python','services']){
  const lesson=LESSONS[id];
  assert.equal(lesson.commands.length,10);
  assert.match(lesson.note,/simulated/);
  for(let index=0;index<10;index++){
   const task=lesson.commands[index];
   assert.match(task.text,id==='python'?/^python /:/^(systemctl|journalctl) /);
   assert.equal(matchesCommand(task.text,task.text),true);
   const html=trainingTemplate(session(id,{index,answered:true,referenceIndex:index}),header);
   assert.match(html,/SIMULATED TERMINAL OUTPUT/);
   assert.match(html,/WHAT DOES IT DO/);
  }
  assert.match(trainingTemplate(session(id,{completed:true,index:9}),header),/All 10 commands completed/);
 }
 assert.ok(LESSONS.python.commands.some(c=>c.text==='python -m pip check'));
 assert.ok(LESSONS.services.commands.some(c=>c.text==='systemctl --failed'));
 assert.match(trainingLibrary(),/9 hands-on practice courses/);
});

test('unified player dossier reads existing bounded histories without writes or metric mixing',()=>{
 const values=new Map([
  ['panic.lessons.v1',JSON.stringify({linux:true,windows:'true',unknown:true})],
  ['panic.speed.results.v1',JSON.stringify([{pack:'numpad',seconds:30,wpm:100,cpm:220,accuracy:97,practiceMode:'mobile-exact'},{pack:'fake',seconds:30,wpm:999,accuracy:100}])],
  ['panic.lyric.history',JSON.stringify([{title:'<img src=x>',artist:'Demo',date:'2026-11-28T00:00:00Z',wpm:50,accuracy:92,points:300,skipped:2}])],
  ['panic.career.v1',JSON.stringify({runs:4,wins:2,best:100})],
 ]);
 const storage={getItem:k=>values.get(k)??null,setItem(){throw Error('unexpected write')},removeItem(){throw Error('unexpected removal')}};
 const d=summarizePlayerDossier(storage,new Date('2026-11-28T12:00:00Z'));
 assert.equal(d.completed,1);
 assert.equal(d.courses.length,9);
 assert.equal(d.speedCount,1);
 assert.equal(d.speed.unit,'CPM');
 assert.equal(d.speed.value,220);
 assert.equal(d.speed.mode,'Phone exact');
 assert.equal(d.activity,null);
 assert.equal(d.storyWins,2);
 const html=playerDossierTemplate({storage,browserEdition:true});
 assert.match(html,/220 CPM/);
 assert.match(html,/&lt;img src=x&gt;/);
 assert.doesNotMatch(html,/<img src=x>/);
 assert.match(html,/local Python edition/);
 assert.match(html,/No new tracking/);
 const empty=playerDossierTemplate({storage:{getItem(){throw Error('blocked')}}});
 assert.match(empty,/No saved regular drill yet/);
 assert.match(empty,/0 \/ 9/);
});

 test('journey achievements derive twelve bounded milestones without adding storage',()=>{
 const d={courses:Array.from({length:9}),completed:3,speedCount:10,lyricCount:3,storyWins:5,activity:null};
 const badges=playerMilestones(d), by=id=>badges.find(b=>b.id===id);
 assert.equal(badges.length,12);
 assert.equal(by('academy-three').earned,true);
 assert.equal(by('academy-all').earned,false);
 assert.equal(by('speed-five').value,5);
 assert.equal(by('lyric-three').earned,true);
 assert.equal(by('story-five').earned,true);
 assert.equal(by('explorer').earned,true);
 assert.equal(by('guided-three').available,false);
 assert.equal(by('guided-three').earned,false);
 const enabled=playerMilestones({...d,activity:{total:3,days:2}}).find(b=>b.id==='guided-three');
 assert.equal(enabled.earned,true);
 const cleared=playerMilestones({...d,speedCount:0}).find(b=>b.id==='explorer');
 assert.equal(cleared.earned,false);
 });

 test('three original offline rhythm challenges have bounded timed charts and exact qualification',()=>{
 assert.equal(RHYTHM_CHALLENGES.length,3);
 assert.equal(new Set(RHYTHM_CHALLENGES.map(t=>t.id)).size,3);
 assert.deepEqual(RHYTHM_CHALLENGES.map(t=>t.goal),[90,95,98]);
 assert.deepEqual(RHYTHM_CHALLENGES.map(t=>t.bpm),[90,120,150]);
 for(const t of RHYTHM_CHALLENGES){
  const chart=parseLRC(t.syncedLyrics,t.duration);
  assert.ok(chart.words.length>=30);
  assert.ok(chart.lines.at(-1).time<t.duration);
  const n=chart.words.length,m={total:n,correct:n,attempts:n,skipped:0};
  assert.equal(rhythmOutcome(t,m),'passed');
  assert.equal(rhythmOutcome(t,{...m,correct:n-1,skipped:1}),'incomplete');
  assert.equal(rhythmOutcome(t,{...m,attempts:n*2}),'accuracy');
  assert.equal(rhythmOutcome(t,{...m,invalid:true}),'practice');
 }
 });
