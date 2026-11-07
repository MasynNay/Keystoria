import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FEATURED_SONGS,generatedCoverArt,youtubeThumbnail,coverStyle,calibratedOffset,lineHasForeignScript,parseLRC,scoreRun,currentLineAt} from '../web/ui/lyric-lab-core.js';

test('YouTube thumbnails are used only for safely validated video IDs',()=>{
 assert.equal(youtubeThumbnail(FEATURED_SONGS[0].videoId),'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
 assert.equal(youtubeThumbnail('abc" onclick="evil'),null);
 assert.equal(youtubeThumbnail(''),null);
 assert.match(coverStyle(FEATURED_SONGS[0]),/i\.ytimg\.com/);
 assert.doesNotMatch(coverStyle({trackName:'Breathe',artistName:'Other'}),/i\.ytimg\.com/);
});

test('generated cover art is distinct, deterministic, self-contained and safe against markup injection',()=>{
 const a=generatedCoverArt({trackName:'Wild Card',artistName:'Tester'});
 const b=generatedCoverArt({trackName:'Wild Card',artistName:'Tester'});
 const c=generatedCoverArt({trackName:'Different song',artistName:'Tester'});
 assert.equal(a,b);
 assert.notEqual(a,c);
 assert.match(decodeURIComponent(a),/viewBox="0 0 420 420"/);
 assert.match(decodeURIComponent(a),/<linearGradient/);
 assert.doesNotMatch(decodeURIComponent(generatedCoverArt({trackName:'\"><script>alert(1)</script>',artistName:'evil'})),/<script>/);
});

test('line skip penalizes accuracy but does not create word credit',()=>{
 assert.equal(scoreRun({correct:1,attempts:1,skipped:4,characters:6,elapsed:5}).accuracy,20);
 assert.equal(scoreRun({correct:0,attempts:0,skipped:4}).accuracy,0);
 assert.equal(scoreRun({correct:3,attempts:3,characters:15,elapsed:12}).accuracy,100);
 assert.equal(scoreRun().accuracy,100);
});

test('non-latin scripts are detected and can be skipped without requiring another keyboard',()=>{
 for(const text of ['こんにちは 世界','안녕하세요 여러분','汉字 测试','Привет мир','مرحبا'])assert.equal(lineHasForeignScript(text),true,text);
 assert.equal(lineHasForeignScript('Café and crème brûlée'),false);
 const c=parseLRC('[00:00.00] Hello world\n[00:04.00] 안녕하세요 여러분\n[00:08.00] Back to English',18);
 assert.equal(c.lines[1].endWord-c.lines[1].startWord,2);
 assert.equal(c.words[c.lines[1].endWord]?.word,'Back');
});

test('video-to-lyric calibration is precise to a quarter second and bounded',()=>{
 assert.equal(calibratedOffset(33,35.61),-2.5);
 assert.equal(calibratedOffset(12,10.12),2);
 assert.equal(calibratedOffset(1,1000),-120);
 assert.equal(calibratedOffset(500,0),120);
});

test('music playback, song timing, skip and cover elements are present without server changes',()=>{
 const source=readFileSync(new URL('../web/ui/lyric-lab-controller.js',import.meta.url),'utf8');
 assert.match(source,/data-action="lyric-skip"/);
 assert.match(source,/event\.key==='Enter'/);
 assert.match(source,/function skipLine\(\)/);
 assert.match(source,/skipped\+=count/);
 assert.match(source,/data-action="lyric-calibrate"/);
 assert.match(source,/saveOffset\(\)/);
 assert.match(source,/player\.getCurrentTime\(\)/);
 assert.match(source,/id="lyric-live-text"/);
 assert.match(source,/class="lyric-album-art"/);
 assert.match(source,/class="lyric-result-art"/);
});
