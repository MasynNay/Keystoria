import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLyricWordFeedback } from '../web/ui/lyric-word-feedback.js';

test('the first letter flashes, and advances with each live typed character', () => {
 const untouched=renderLyricWordFeedback('Signals');
 assert.equal(untouched.nextKey,'S');
 assert.match(untouched.html, /type-char pending current" data-next-key="S"/);
 const partial=renderLyricWordFeedback('Signals','Sig');
 assert.equal(partial.nextKey,'n');
 assert.equal((partial.html.match(/type-char correct/g)||[]).length,3);
 assert.match(partial.html,/type-char pending current" data-next-key="n"/);
});

test('incorrect letters are red and next-letter prompt still advances', () => {
 const result=renderLyricWordFeedback('Signals','Sx');
 assert.equal(result.nextKey,'g');
 assert.equal(result.errors,1);
 assert.match(result.html,/type-char incorrect/);
});

test('normal scoring skips punctuation without losing the original lyric text', () => {
 const result=renderLyricWordFeedback('Hello,','Hello');
 assert.equal(result.nextKey,'SPACE');
 assert.match(result.html,/type-char ignored">,<\/span>/);
 assert.equal((result.html.match(/type-char correct/g)||[]).length,5);
 const apostrophe=renderLyricWordFeedback('You’re','you');
 assert.equal(apostrophe.nextKey,'’');
 assert.match(apostrophe.html,/data-next-key="’"/);
});

test('accented letters accept their typed Latin equivalents in non-strict mode', () => {
 const result=renderLyricWordFeedback('Café','Caf');
 assert.equal(result.nextKey,'é');
 assert.equal(renderLyricWordFeedback('Café','Cafe').nextKey,'SPACE');
 assert.equal(renderLyricWordFeedback('Café','Cafe').errors,0);
});

test('strict mode tracks literal casing and punctuation', () => {
 const result=renderLyricWordFeedback('Hello,','Hello',{strict:true});
 assert.equal(result.nextKey,',');
 assert.equal(renderLyricWordFeedback('Hello,','Hello,',{strict:true}).nextKey,'SPACE');
 assert.equal(renderLyricWordFeedback('Hello,','hello',{strict:true}).errors,1);
});

test('overtyping shows red extra characters and a backspace cue', () => {
 const result=renderLyricWordFeedback('OK','OKno');
 assert.equal(result.nextKey,'BACKSPACE');
 assert.equal(result.errors,2);
 assert.equal((result.html.match(/type-char extra/g)||[]).length,2);
});

test('untrusted lyric content is escaped before rendering', () => {
 const result=renderLyricWordFeedback('<Hi&>', '<Hi');
 assert.ok(result.html.includes('&lt;')&&result.html.includes('&amp;')&&result.html.includes('&gt;'));
 assert.equal(result.html.includes('<Hi&>'),false);
});
