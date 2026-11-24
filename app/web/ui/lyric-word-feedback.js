/** Character-by-character Lyric Lab prompt using the same visual states as other
 * Keystoria typing modes. The original lyric stays visible, even when its
 * punctuation/accents are optional for the current scoring mode.
 */
import { safe } from './helpers.js';
import { cleanWord } from './lyric-lab-core.js?v=0.52.0';

// One visual cursor per user-perceived character, including combining marks.
const segmenter=typeof Intl.Segmenter==='function'
  ? new Intl.Segmenter(undefined,{granularity:'grapheme'}) : null;
const graphemes=value=>segmenter
  ? Array.from(segmenter.segment(String(value)),item=>item.segment)
  : Array.from(String(value));

export function renderLyricWordFeedback(word, typed = '', { strict = false } = {}) {
  const characters = graphemes(String(word ?? ''));
  const submitted = graphemes(strict ? String(typed ?? '') : cleanWord(typed));
  const equal = (a, b) => strict ? a === b : a.toLowerCase() === b.toLowerCase();
  let position = 0;
  let nextKey = null;
  let errors = 0;
  const rendered = characters.map(character => {
    const comparable = strict ? character : cleanWord(character);
    // In relaxed mode commas, periods, quotation marks, etc. remain printed,
    // but never become a phantom key that prevents advancing the cursor.
    if (!comparable) return `<span class="type-char ignored">${safe(character)}</span>`;
    const status = position >= submitted.length ? 'pending'
      : equal(comparable, submitted[position]) ? 'correct' : 'incorrect';
    if (status === 'incorrect') errors++;
    const current = position === submitted.length;
    if (current) nextKey = character;
    position++;
    return `<span class="type-char ${status}${current ? ' current' : ''}"${current ? ` data-next-key="${safe(character)}"` : ''}>${safe(character)}</span>`;
  });
  for (const extra of submitted.slice(position)) {
    errors++;
    rendered.push(`<span class="type-char extra">${safe(extra)}</span>`);
  }
  if (submitted.length >= position) {
    rendered.push('<span class="type-end-caret" aria-hidden="true"></span>');
    nextKey = errors ? 'BACKSPACE' : 'SPACE';
  }
  return { html: rendered.join(''), nextKey, errors };
}


// Keep a word's character nodes mounted while a phone keyboard edits it.
// States stay identical to the pure renderer; only changed classes, next-key
// markers, overtyping nodes, and the final caret update per character.
const paintedLyricWords=new WeakMap();
// Optional precomputed output is shared by both Lyric Lab word views.
// The controller computes scoring and next-key guidance once per edit.
export function paintLyricWordFeedback(element,word,typed='',{strict=false,precomputed=null}={}){
 const feedback=precomputed??renderLyricWordFeedback(word,typed,{strict});
 if(!element)return feedback;
 const source=String(word??'');
 const characters=graphemes(source);
 const submitted=graphemes(strict?String(typed??''):cleanWord(typed));
 let entry=paintedLyricWords.get(element);
 const valid=entry?.source===source &&
   entry.characters.length===characters.length &&
   entry.firstChild===element.firstElementChild &&
   entry.characters.every((node,i)=>node.parentElement===element&&node.textContent===characters[i]);
 if(!valid){
  const existing=Array.from(element.children);
  // Adopt first-frame word markup rather than detaching it on the first key.
  const adopt=existing.length>=characters.length &&
   characters.every((ch,i)=>existing[i]?.classList.contains('type-char') &&
    !existing[i]?.classList.contains('extra') && existing[i].textContent===ch) &&
   existing.slice(characters.length).every(node=>
    node.classList.contains('extra')||node.classList.contains('type-end-caret'));
  if(!adopt)element.innerHTML=feedback.html;
  const nodes=Array.from(element.children);
  entry={source,characters:nodes.slice(0,characters.length),
   extras:nodes.slice(characters.length).filter(node=>node.classList.contains('extra')),
   endCaret:nodes.find(node=>node.classList.contains('type-end-caret'))||null,
   firstChild:element.firstElementChild};
  paintedLyricWords.set(element,entry);
  if(!adopt)return feedback;
 }
 let position=0;
 for(let i=0;i<characters.length;i++){
  const character=characters[i],node=entry.characters[i];
  const comparable=strict?character:cleanWord(character);
  if(!comparable){
   if(node.className!=='type-char ignored')node.className='type-char ignored';
   if(node.hasAttribute('data-next-key'))node.removeAttribute('data-next-key');
   continue;
  }
  const state=position>=submitted.length?'pending':
   (strict?comparable===submitted[position]:
    comparable.toLowerCase()===submitted[position].toLowerCase())?'correct':'incorrect';
  const current=position===submitted.length;
  const className='type-char '+state+(current?' current':'');
  if(node.className!==className)node.className=className;
  if(current){
   if(node.getAttribute('data-next-key')!==character)node.setAttribute('data-next-key',character);
  }else if(node.hasAttribute('data-next-key'))node.removeAttribute('data-next-key');
  position++;
 }
 const extras=submitted.slice(position);
 while(entry.extras.length>extras.length)entry.extras.pop().remove();
 while(entry.extras.length<extras.length){
  const node=element.ownerDocument.createElement('span');
  node.className='type-char extra';
  if(entry.endCaret)entry.endCaret.before(node);
  else element.append(node);
  entry.extras.push(node);
 }
 for(let i=0;i<extras.length;i++)
  if(entry.extras[i].textContent!==extras[i])entry.extras[i].textContent=extras[i];
 if(submitted.length>=position){
  if(!entry.endCaret){
   entry.endCaret=element.ownerDocument.createElement('span');
   entry.endCaret.className='type-end-caret';
   entry.endCaret.setAttribute('aria-hidden','true');
   element.append(entry.endCaret);
  }
 }else if(entry.endCaret){
  entry.endCaret.remove();
  entry.endCaret=null;
 }
 entry.firstChild=element.firstElementChild;
 return feedback;
}
