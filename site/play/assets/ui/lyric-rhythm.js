/** Original offline rhythm passages, independent of external song providers. */
const make=(id,title,level,goal,step,bpm,lines)=>Object.freeze({
 id:'rhythm-'+id,trackName:title,artistName:'KEYSTORIA',duration:step*lines.length+4,
 videoId:null,demo:true,rhythm:true,level,goal,bpm,
 syncedLyrics:lines.map((line,i)=>{const t=i*step;return '['+String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')+'.00] '+line;}).join('\n')
});
export const RHYTHM_CHALLENGES=Object.freeze([
 make('harbor','Harbor Lights','Warm-up',90,6,90,[
 'Soft lights cross the bay','Morning opens up the sky','Little boats return to shore','Follow where the gulls fly','Keep your hands relaxed and steady','Let the quiet rhythm guide you','Every word becomes a lantern','Carry home the morning blue']),
 make('orbit','Orbit Runner','Precision',95,5,120,[
 'Silver circuits trace the horizon','Satellite signals ripple through the air','Calibrate the engines before departure','Every pulse reveals another layer','Navigate the shadows between planets','Keep the sequence clear and steady','Across the stars our messages travel','Return with every signal answered','Quiet engines settle into orbit','Morning breaks across the station']),
 make('storm','Stormline','Expert',98,4,150,[
 'Thunder echoes across the mountain ridge','Winds unravel patterns in the rain','Trace the lightning through the darkened valley','Keep the current flowing through each chain','Steady hands can navigate the pressure','Read the rhythm underneath the roar','Clouds assemble over distant cities','Every signal finds a different shore','Through the tempest follow every letter','Precision makes the tangled pathways clear','Silence settles slowly after thunder','Carry all the words that brought you here'])
]);
export function rhythmOutcome(track,{correct=0,attempts=0,skipped=0,total=0,invalid=false}={}){
 if(!track?.rhythm||invalid)return 'practice';
 if(!Number.isSafeInteger(total)||total<=0||!Number.isSafeInteger(correct)||!Number.isSafeInteger(attempts)||!Number.isSafeInteger(skipped)||correct<0||attempts<correct||skipped<0)return 'practice';
 if(correct!==total||skipped!==0)return 'incomplete';
 return correct*100>=attempts*track.goal?'passed':'accuracy';
}
export const RHYTHM_RESULT_TEXT=Object.freeze({
 passed:'Challenge passed! Every word completed and the accuracy goal reached.',
 accuracy:'All words completed, but the exact accuracy goal was missed. Try again.',
 incomplete:'Some words were missed or skipped. Complete every word to qualify.',
 practice:'Practice only: a seek, line loop or timing adjustment invalidated challenge qualification.'
});
