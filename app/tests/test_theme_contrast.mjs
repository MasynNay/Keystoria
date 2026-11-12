import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {THEMES,DEFAULT_THEME,validTheme} from '../web/ui/themes.js';

const css=readFileSync(new URL('../web/styles/themes.css',import.meta.url),'utf8');
const luminance=hex=>{
 assert.match(hex,/^#[0-9a-f]{6}$/i);
 const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const l=c.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return l[0]*.2126+l[1]*.7152+l[2]*.0722;
};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
test('15 unique supported themes',()=>{
 assert.equal(THEMES.length,15);
 assert.equal(new Set(THEMES.map(t=>t.id)).size,15);
 assert.ok(THEMES.some(t=>t.id===DEFAULT_THEME));
 for(const theme of THEMES)assert.equal(validTheme(theme.id),theme.id);
});
for(const theme of THEMES){
 test(theme.id+' text and accent achieve at least AA contrast across surfaces',()=>{
  for(const fg of ['text','muted','accent']){
   for(const bg of ['bg','panel','panel2']){
    const contrast=ratio(theme[fg],theme[bg]);
    assert.ok(contrast>=4.5,theme.id+' '+fg+' vs '+bg+' should be >= 4.5:1 (actual '+contrast.toFixed(2)+')');
   }
  }
  assert.ok(ratio(theme.accent,theme.panel)>=7,theme.id+' focus accent should exceed 7:1 on the panel');
 });
 test(theme.id+' browser CSS matches shared palette definitions',()=>{
  const block=css.split('body[data-ui-theme="'+theme.id+'"] {')[1]?.split('}')[0];
  assert.ok(block,'missing CSS theme '+theme.id);
  const tokens={bg:'--theme-bg',panel:'--theme-panel',panel2:'--theme-panel-2',line:'--theme-line',text:'--theme-text',muted:'--theme-muted',accent:'--theme-accent'};
  for(const [key,variable] of Object.entries(tokens))
   assert.ok(block.includes(variable+':'+theme[key]+';'),theme.id+' '+variable+' must match JS theme');
 });
}
