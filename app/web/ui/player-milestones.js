/** Milestones derived from validated existing records. No achievement store. */
export function playerMilestones(d){
 const count=d.courses.length;
 const goal=(id,title,detail,value,target,available=true)=>({id,title,detail,value:Math.min(target,Math.max(0,value)),target,available,earned:available&&value>=target});
 return [
  goal('academy-first','First lesson','Finish one Academy course.',d.completed,1),
  goal('academy-three','Terminal explorer','Finish three Academy courses.',d.completed,3),
  goal('academy-all','Academy graduate','Finish every current Academy course.',d.completed,count),
  goal('speed-first','Find your rhythm','Keep one regular Speed Lab result.',d.speedCount,1),
  goal('speed-five','Training circuit','Keep five regular Speed Lab results.',d.speedCount,5),
  goal('speed-ten','Practice regular','Keep ten regular Speed Lab results.',d.speedCount,10),
  goal('lyric-first','First performance','Keep one Lyric Lab result.',d.lyricCount,1),
  goal('lyric-three','Encore','Keep three recent Lyric Lab results.',d.lyricCount,3),
  goal('story-first','First extraction','Win a story mission in the local edition.',d.storyWins,1),
  goal('story-five','Seasoned operator','Win five story missions in the local edition.',d.storyWins,5),
  goal('guided-three','Focused training','Complete three guided routines in the last 30 days.',d.activity?.total??0,3,Boolean(d.activity)),
  goal('explorer','Multi-mode explorer','Have records in Academy, Speed Lab and Lyric Lab.',Number(d.completed>0)+Number(d.speedCount>0)+Number(d.lyricCount>0),3),
 ];
}
export function milestoneTemplate(d,browserEdition=false){
 const milestones=playerMilestones(d),eligible=milestones.filter(m=>m.available);
 return `<section class="dossier-milestones" aria-labelledby="dossier-milestones-heading">
  <div class="dossier-milestones-heading"><div><h3 id="dossier-milestones-heading">JOURNEY ACHIEVEMENTS</h3><p>Milestones reflect current local records, not permanent awards. Clearing records or rolling activity expiry can change them.</p></div><strong data-earned="${eligible.filter(m=>m.earned).length}" data-available="${eligible.length}">${eligible.filter(m=>m.earned).length} / ${eligible.length} reached</strong></div>
  <div class="dossier-milestone-grid">${milestones.map(m=>`<article class="dossier-milestone" data-milestone="${m.id}" data-earned="${m.earned}" data-available="${m.available}">
   <span class="dossier-milestone-state">${m.earned?'REACHED':!m.available?'OPTIONAL · OFF':'IN PROGRESS'}</span>
   <h4>${m.title}</h4><p>${m.detail}</p>
   ${m.available?`<progress value="${m.value}" max="${m.target}" aria-label="${m.title} progress"></progress><small>${m.value} / ${m.target}</small>`:'<small>Enable guided activity in Speed Lab to include this milestone.</small>'}
   ${browserEdition&&m.id.startsWith('story-')?'<small>Story play requires the local edition.</small>':''}
  </article>`).join('')}</div>
 </section>`;
}
