/** Opt-in, entirely local 10-second phone responsiveness snapshot.
 * Never retains keystrokes, media URLs, scores or recorded measurements.
 * Nothing is sent to a server: the player chooses whether to copy the report.
 * Frame cadence and next-frame input delay are proxies, not physical FPS or INP.
 */
const PRACTICE_FIELDS=Object.freeze({
  'speed-input':'Speed Lab',
  'lyric-input':'Lyric Lab',
  'lesson-input':'Field Academy',
  'task-input':'Story mode'
});
const round=value=>Number.isFinite(value)?Math.round(value):0;

export function percentile(values,p) {
  if(!values.length)return null;
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length-1,Math.max(0,Math.ceil(sorted.length*p)-1))];
}

export function makePerformanceReport(stats,context) {
  const elapsed=Math.max(0,Number(context.elapsedMs)||0);
  const fps=stats.frameMsTotal>0?round(stats.frameIntervals*1000/stats.frameMsTotal):null;
  const delays=stats.inputFrameDelays||[];
  const modes=Object.entries(stats.modes||{}).map(([name,count])=>name+': '+count).join(', ')||'No practice input detected';
  const lines=[
    'Keystoria — on-device responsiveness check',
    'Result: '+context.reason,
    'Duration: '+(elapsed/1000).toFixed(1)+' seconds',
    'Browser: '+(context.userAgent||'Not reported'),
    'Viewport: '+context.width+' × '+context.height+' CSS pixels; device pixel ratio '+context.dpr,
    'Mode input counts: '+modes,
    'Animation-frame callbacks: '+stats.frameIntervals,
    'Average animation-frame cadence: '+(fps===null?'Unavailable':fps+' per second'),
    'Slow frame gaps (>50ms): '+stats.slowFrames,
    'Longest frame gap: '+round(stats.maxFrameGap)+' ms',
    'Practice input events: '+stats.inputEvents,
    'Input-to-next-frame samples: '+delays.length,
    'Input-to-next-frame p95: '+(delays.length?round(percentile(delays,.95))+' ms':'Not measured'),
    'Input-to-next-frame maximum: '+(delays.length?round(Math.max(...delays))+' ms':'Not measured'),
    'Long tasks (>50ms): '+(stats.longTasksSupported?stats.longTasks:'Not exposed by this browser'),
    'Longest long task: '+(stats.longTasksSupported?round(stats.maxLongTask)+' ms':'Unavailable'),
    'Note: Timing values approximate browser scheduling only; they are not certified physical FPS or a full input-latency trace.',
    'Privacy: collected locally after an explicit click; no typed text, stored results, or media links were collected or uploaded.'
  ];
  return lines.join('\n');
}

export function createPerformanceCheck({durationMs=10000}={}) {
  let panel=null,recording=false,timeout=null,frame=null,observer=null;
  let startedAt=0,lastFrame=null,pendingInputAt=null,stats=null,report='';
  const now=()=>performance.now();
  const $=selector=>panel?.querySelector(selector);

  function showPanel() {
    panel?.remove();
    panel=document.createElement('section');
    panel.className='keystoria-perf-check';
    panel.id='keystoria-perf-check';
    panel.setAttribute('role','region');
    panel.setAttribute('aria-label','On-device responsiveness check');
    panel.innerHTML='<strong>PHONE PERFORMANCE CHECK</strong>'+
      '<p class="perf-check-message" role="status" aria-live="polite">Recording locally for 10 seconds. Type or scroll normally.</p>'+
      '<button type="button" data-perf-action="stop">STOP & SHOW RESULTS</button>'+
      '<textarea class="perf-check-report" readonly hidden aria-label="Local performance report" spellcheck="false"></textarea>'+
      '<button type="button" data-perf-action="copy" hidden>COPY REPORT</button>'+
      '<button type="button" data-perf-action="close" hidden>CLOSE</button>';
    panel.addEventListener('click',event=>{
      const action=event.target?.closest?.('[data-perf-action]')?.dataset.perfAction;
      if(action==='stop')finish('Stopped by player');
      else if(action==='copy')void copy();
      else if(action==='close')close();
    });
    document.body.appendChild(panel);
  }

  function handleInput(event) {
    if(!recording||!Object.hasOwn(PRACTICE_FIELDS,event.target?.id))return;
    const mode=PRACTICE_FIELDS[event.target.id];
    stats.inputEvents++;
    stats.modes[mode]=(stats.modes[mode]||0)+1;
    if(pendingInputAt===null)pendingInputAt=now();
    // The actual typed value is intentionally never read.
  }

  function animate(time) {
    if(!recording)return;
    if(lastFrame!==null){
      const gap=Math.max(0,time-lastFrame);
      stats.frameIntervals++;
      stats.frameMsTotal+=gap;
      if(gap>50)stats.slowFrames++;
      stats.maxFrameGap=Math.max(stats.maxFrameGap,gap);
    }
    lastFrame=time;
    if(pendingInputAt!==null){
      if(stats.inputFrameDelays.length<1200)
        stats.inputFrameDelays.push(Math.max(0,time-pendingInputAt));
      pendingInputAt=null;
    }
    frame=requestAnimationFrame(animate);
  }

  function onVisibilityChange() {
    if(document.hidden)finish('Interrupted when tab was hidden');
  }
  function onPageHide() {finish('Interrupted when page was left');}

  function finish(reason='Completed') {
    if(!recording)return;
    recording=false;
    clearTimeout(timeout);timeout=null;
    if(frame!==null)cancelAnimationFrame(frame);
    frame=null;
    observer?.disconnect();observer=null;
    document.removeEventListener('input',handleInput,true);
    document.removeEventListener('visibilitychange',onVisibilityChange);
    window.removeEventListener('pagehide',onPageHide);
    const context={
      elapsedMs:now()-startedAt,reason,width:window.innerWidth,height:window.innerHeight,
      dpr:window.devicePixelRatio||1,userAgent:navigator.userAgent||''
    };
    report=makePerformanceReport(stats,context);
    const field=$('.perf-check-report');
    if(field){field.value=report;field.hidden=false;}
    const message=$('.perf-check-message');
    if(message)message.textContent='Local check finished. Review the report below and copy it only if you choose.';
    for(const action of ['stop','copy','close']){
      const button=$('[data-perf-action="'+action+'"]');
      if(button)button.hidden=action==='stop';
    }
  }

  async function copy() {
    if(!report)return;
    try{
      if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(report);
      const message=$('.perf-check-message');
      if(message)message.textContent='Copied. Share the report only if you want help investigating lag.';
    }catch{
      const field=$('.perf-check-report');
      field?.focus();
      field?.select();
      const message=$('.perf-check-message');
      if(message)message.textContent='Clipboard permission unavailable. Report selected; use your browser Copy command.';
    }
  }

  function close() {
    if(recording)finish('Stopped by player');
    panel?.remove();panel=null;report='';
  }

  function start() {
    if(recording)return false;
    close();
    recording=true;startedAt=now();lastFrame=null;pendingInputAt=null;
    stats={frameIntervals:0,frameMsTotal:0,slowFrames:0,maxFrameGap:0,
      inputEvents:0,inputFrameDelays:[],modes:{},longTasksSupported:false,longTasks:0,maxLongTask:0};
    showPanel();
    if(typeof PerformanceObserver!=='undefined' &&
        PerformanceObserver.supportedEntryTypes?.includes('longtask')){
      try{
        observer=new PerformanceObserver(list=>{
          for(const task of list.getEntries()){
            stats.longTasks++;
            stats.maxLongTask=Math.max(stats.maxLongTask,task.duration);
          }
        });
        observer.observe({entryTypes:['longtask']});
        stats.longTasksSupported=true;
      }catch{observer?.disconnect();observer=null;}
    }
    document.addEventListener('input',handleInput,true);
    document.addEventListener('visibilitychange',onVisibilityChange);
    window.addEventListener('pagehide',onPageHide);
    if(typeof requestAnimationFrame==='function')frame=requestAnimationFrame(animate);
    timeout=setTimeout(()=>finish('Completed'),durationMs);
    return true;
  }
  return {start,stop:finish,close,get running(){return recording;}};
}
