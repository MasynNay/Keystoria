import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const controller=readFileSync(new URL('../web/ui/lyric-lab-controller.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../web/index.html',import.meta.url),'utf8');
test('v0.21 automatically searches matching video only when a song is selected',()=>{
 assert.match(controller,/async function chooseResult\(track, button\)/);
 assert.match(controller,/fetch\('\/api\/music\/resolve\?'/);
 assert.match(controller,/title:String\(track\.trackName/);
 assert.match(controller,/artist:String\(track\.artistName/);
 assert.match(controller,/duration:String\(track\.duration/);
 assert.match(controller,/if\(track\.videoId\|\|savedVideoId\(track\)\)/);
 assert.match(controller,/chooseResult\(track,el\)/);
 assert.match(controller,/panic\.lyric\.video\./);
 assert.match(controller,/matchFailed:true/);
 assert.match(controller,/AUTO-MATCH VIDEO ON SELECT/);
 assert.match(html,/v=0\.24\.0/);
});
