import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLyricWordFeedback } from '../web/ui/lyric-word-feedback.js';
import { cleanWord, sameWord, lineHasForeignScript } from '../web/ui/lyric-lab-core.js';


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
 assert.equal(apostrophe.nextKey,'r');
 assert.ok(apostrophe.html.includes('<span class="type-char ignored">’</span>'));
 assert.match(apostrophe.html,/data-next-key="r"/);
});

test('relaxed mode accepts untyped apostrophes and parentheses but preserves lyric punctuation', () => {
 for (const [display,typed,ignored] of [
  ["don't","dont","'"],
  ["you’re","youre","’"],
  ["(Yeah)","yeah","("],
  ["we’ll","well","’"],
  ['"Hey!"','hey','"'],
  ["rock-and-roll","rockandroll","-"],
  ["(don't)","dont","("],
 ]) {
  const rendered=renderLyricWordFeedback(display,typed);
  assert.equal(rendered.nextKey,'SPACE',display);
  assert.equal(rendered.errors,0,display);
  assert.match(rendered.html,/type-char ignored/,display);
  assert.ok(rendered.html.includes(ignored==="'"?'&#39;':ignored==='"'?'&quot;':ignored),display);
 }
 const afterApostrophe=renderLyricWordFeedback("Don't","Don");
 assert.equal(afterApostrophe.nextKey,'t');
 assert.match(afterApostrophe.html,/data-next-key="t"/);
 const afterParen=renderLyricWordFeedback('(sing)','si');
 assert.equal(afterParen.nextKey,'n');
 assert.ok(afterParen.html.includes('<span class="type-char ignored">(</span>'));
});

test('strict mode remains an explicit opt-in for punctuation and case', () => {
 const mandatory=renderLyricWordFeedback("don't","don",{strict:true});
 assert.equal(mandatory.nextKey,"'");
 assert.equal(renderLyricWordFeedback("(Yeah)","",{strict:true}).nextKey,'(');
 assert.equal(renderLyricWordFeedback("don't","dont",{strict:true}).errors,1);
 const exact=renderLyricWordFeedback("don't","don't",{strict:true});
 assert.equal(exact.errors,0);
 assert.equal(exact.nextKey,'SPACE');
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

test('actual word matching ignores optional symbols in relaxed mode', () => {
 assert.equal(cleanWord("(don't)"),"dont");
 assert.equal(sameWord("dont","(Don't)"),true);
 assert.equal(sameWord("youre","you’re"),true);
 assert.equal(sameWord("rock and roll","rock-and-roll"),true);
 assert.equal(sameWord("word","world"),false);
 assert.equal(sameWord("!!!","?"),false);
});

test('relaxed lyric matching supports non-Latin letters and native IME text', () => {
 assert.equal(cleanWord('Привет!'),'привет');
 assert.equal(sameWord('Привет','привет'),true);
 assert.equal(sameWord('приве','привет'),false);
 assert.equal(sameWord('こんにちは','こんにちは'),true);
 assert.equal(sameWord('안녕','안녕'),true);
 assert.equal(sameWord('नमस्ते','नमस्ते'),true);
 assert.equal(sameWord('مرحبا','مرحبا'),true);
 assert.equal(sameWord('你好','你好'),true);
 assert.equal(cleanWord('café'),'cafe','decomposed Latin accents retain relaxed scoring');
 assert.equal(sameWord('!!!','?'),false,'punctuation-only input is not a word');
 assert.equal(lineHasForeignScript('Café'),false);
 assert.equal(lineHasForeignScript('Привет'),true);
 assert.equal(lineHasForeignScript('नमस्ते'),true);
});

test('Unicode lyric typing guidance advances by grapheme, not code point', () => {
 for(const [target,typed,next] of [
  ['Привет','При','в'],
  ['안녕','안','녕'],
  ['नमस्ते','नम','स्ते'],
  ['がんばれ','が','ん'],
  ['Café','Caf','é'],
 ]) {
  const partial=renderLyricWordFeedback(target,typed);
  assert.equal(partial.nextKey,next,target);
  assert.equal(partial.errors,0,target);
  assert.equal(renderLyricWordFeedback(target,target).nextKey,'SPACE',target);
 }
 const combined=renderLyricWordFeedback('नमस्ते','नम');
 assert.match(combined.html,/data-next-key="स्ते"/);
 assert.equal((combined.html.match(/type-char pending current/g)||[]).length,1,
  'one highlighted next character covers the entire vowel-mark cluster');
 assert.equal(renderLyricWordFeedback('你好','你',{strict:true}).nextKey,'好');
});

test('relaxed Latin accents never erase meaningful marks from other alphabets',()=>{
 const pairs=[
  ['ёж','еж'],
  ['йога','иога'],
  ['ёлка','елка'],
  ['όχι','οχι'],
  ['μάτι','ματι'],
 ];
 for(const [original,confusable] of pairs){
  assert.notEqual(cleanWord(original),cleanWord(confusable),
    original+' and '+confusable+' must remain different words');
  assert.equal(sameWord(original,confusable),false,
    'a visibly different script-specific letter must not earn credit');
  assert.ok(renderLyricWordFeedback(original,confusable).errors>0,
    'the live typing prompt must flag the same mismatch as scoring');
  assert.equal(renderLyricWordFeedback(original,original).errors,0,
    'correctly typed non-Latin text should not show a false error');
 }
 assert.equal(cleanWord('ЙОГА'),'йога','case folding still applies');
 assert.equal(cleanWord('е\u0308ж'),'ёж','decomposed Cyrillic vowels retain their mark');
 assert.equal(cleanWord('и\u0306ога'),'йога','decomposed Cyrillic breve recomposes');
 assert.equal(cleanWord('Café'),'cafe','Latin accents remain optional');
 assert.equal(cleanWord('cafe\u0301'),'cafe','decomposed Latin accent remains optional');
 assert.equal(sameWord('CAFÉ','cafe'),true);
 assert.equal(sameWord('안녕','안녕'),true,'composed Korean IME text stays valid');
 assert.equal(sameWord('नमस्ते','नमस्ते'),true,'Indic combining marks remain valid');
});
