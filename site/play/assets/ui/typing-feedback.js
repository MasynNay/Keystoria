/** Character-level feedback shared by missions, Academy and the Speed Lab.
 *
 * Rendering is pure: the caller owns its editable control and state. Keeping
 * the exact same comparisons and CSS tokens prevents a mode from silently
 * losing correct/incorrect highlights as the product expands.
 */
import { safe } from './helpers.js';

export function compareTyping(expected, typed, { caseSensitive = true } = {}) {
  const target = Array.from(String(expected ?? ''));
  const input = Array.from(String(typed ?? ''));
  const equal = (left, right) => caseSensitive ? left === right : left.toLowerCase() === right.toLowerCase();
  let correct = 0;
  let incorrect = 0;
  for (let i = 0; i < input.length; i++) {
    if (i < target.length && equal(target[i], input[i])) correct++;
    else incorrect++;
  }
  return {
    correct,
    incorrect,
    total: input.length,
    complete: input.length === target.length && incorrect === 0,
    percent: input.length ? Math.round(correct / input.length * 100) : 100,
  };
}

export function renderTypingFeedback(expected, typed, options = {}) {
  const target = Array.from(String(expected ?? ''));
  const input = Array.from(String(typed ?? ''));
  const { caseSensitive = true } = options;
  const equal = (left, right) => caseSensitive ? left === right : left.toLowerCase() === right.toLowerCase();
  const rendered = target.map((character, index) => {
    const status = index >= input.length ? 'pending' : equal(character, input[index]) ? 'correct' : 'incorrect';
    const current = index === input.length ? ' current' : '';
    // Each character has an independent status, including spaces and punctuation.
    return `<span class="type-char ${status}${current}">${safe(character)}</span>`;
  });
  for (const character of input.slice(target.length)) {
    rendered.push(`<span class="type-char extra">${safe(character)}</span>`);
  }
  // End-of-target caret remains visible for overtyping and final input.
  if (input.length >= target.length) rendered.push('<span class="type-end-caret" aria-hidden="true"></span>');
  return rendered.join('');
}

// Keep the character nodes mounted while the player types. Replacing the
// entire prompt's innerHTML for every key causes avoidable layout, paint, and
// accessibility-tree work on mobile (particularly beside native keyboards).
// The pure markup renderer above remains the reference for initial output.
const paintedPrompts=new WeakMap();
export function paintTypingFeedback(element, expected, typed, options = {}) {
  if (!element) return compareTyping(expected, typed, options);
  const result=compareTyping(expected, typed, options);
  const source=String(expected ?? '');
  const input=Array.from(String(typed ?? ''));
  const sensitive=options.caseSensitive!==false;
  let entry=paintedPrompts.get(element);
  if (!entry || entry.source!==source || entry.sensitive!==sensitive
      || element.firstElementChild!==entry.firstChild) {
    const target=Array.from(source);
    let children=Array.from(element.children);
    // Academy and story templates already have correctly rendered spans on
    // their first frame. Adopt those nodes instead of rebuilding them on the
    // very first native keyboard event (the most noticeable phone input lag).
    const reusable=children.length>=target.length &&
      target.every((character,i)=>children[i]?.tagName==='SPAN'
        && children[i].classList.contains('type-char')
        && !children[i].classList.contains('extra')
        && children[i].textContent===character) &&
      children.slice(target.length).every(node=>
        node.classList.contains('extra')||node.classList.contains('type-end-caret'));
    if(!reusable){
      // Only an actual new reference or externally replaced markup needs a
      // fresh mount. Keep renderTypingFeedback as the source of truth.
      element.innerHTML=renderTypingFeedback(expected, typed, options);
      children=Array.from(element.children);
    }
    entry={
      source,sensitive,target,
      characters:children.slice(0,target.length),
      extras:children.slice(target.length).filter(node=>node.classList.contains('extra')),
      endCaret:children.find(node=>node.classList.contains('type-end-caret'))||null,
      firstChild:element.firstElementChild,
    };
    paintedPrompts.set(element,entry);
  }
  const {target,characters,extras}=entry;
  for(let i=0;i<target.length;i++){
    const status=i>=input.length?'pending'
      : (sensitive ? target[i]===input[i] : target[i].toLowerCase()===input[i].toLowerCase())
        ? 'correct':'incorrect';
    const className='type-char '+status+(i===input.length?' current':'');
    if(characters[i].className!==className)characters[i].className=className;
  }
  const extraCount=Math.max(0,input.length-target.length);
  while(extras.length>extraCount)extras.pop().remove();
  while(extras.length<extraCount){
    const extra=element.ownerDocument.createElement('span');
    extra.className='type-char extra';
    if(entry.endCaret)entry.endCaret.before(extra);
    else element.append(extra);
    extras.push(extra);
  }
  for(let i=0;i<extras.length;i++){
    const value=input[target.length+i];
    if(extras[i].textContent!==value)extras[i].textContent=value;
  }
  if(input.length>=target.length){
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
  const accuracy=String(result.percent),errors=String(result.incorrect);
  if(element.dataset.accuracy!==accuracy)element.dataset.accuracy=accuracy;
  if(element.dataset.errors!==errors)element.dataset.errors=errors;
  return result;
}
