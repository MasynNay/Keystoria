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
  const source=String(expected ?? '');
  const value=String(typed ?? '');
  const input=Array.from(value);
  const sensitive=options.caseSensitive!==false;
  const equal=(left,right)=>sensitive?left===right:left.toLowerCase()===right.toLowerCase();
  let entry=paintedPrompts.get(element);
  if (!entry || entry.source!==source || entry.sensitive!==sensitive
      || element.firstElementChild!==entry.firstChild) {
    const target=Array.from(source);
    let children=Array.from(element.children);
    // Pre-rendered Academy/Story prompts can be adopted without remounting the
    // software-keyboard-adjacent character tree on the first native edit.
    const reusable=children.length>=target.length &&
      target.every((character,i)=>children[i]?.tagName==='SPAN'
        && children[i].classList.contains('type-char')
        && !children[i].classList.contains('extra')
        && children[i].textContent===character) &&
      children.slice(target.length).every(node=>
        node.classList.contains('extra')||node.classList.contains('type-end-caret'));
    if(!reusable){
      element.innerHTML=renderTypingFeedback(expected,typed,options);
      children=Array.from(element.children);
    }
    entry={
      source,sensitive,target,
      characters:children.slice(0,target.length),
      extras:children.slice(target.length).filter(node=>node.classList.contains('extra')),
      endCaret:children.find(node=>node.classList.contains('type-end-caret'))||null,
      firstChild:element.firstElementChild,
      previousInput:null,previousText:'',correct:0,
    };
    paintedPrompts.set(element,entry);
  }
  const {target,characters,extras}=entry;
  const prior=entry.previousInput;
  // Native ordinary typing and backspace only change a suffix. Compare the
  // common prefix in the JS engine; for autocorrect, selection replacement,
  // IME commits or middle edits, find the first changed Unicode code point.
  let first=0;
  if(prior!==null){
    if(value.startsWith(entry.previousText))first=prior.length;
    else if(entry.previousText.startsWith(value))first=input.length;
    else{
      const limit=Math.min(prior.length,input.length);
      while(first<limit && prior[first]===input[first])first++;
    }
  }
  let correct=entry.correct;
  if(prior!==null){
    for(let i=first;i<prior.length;i++)
      if(i<target.length && equal(target[i],prior[i]))correct--;
  }
  for(let i=first;i<input.length;i++)
    if(i<target.length && equal(target[i],input[i]))correct++;
  const incorrect=input.length-correct;
  const result={
    correct,incorrect,total:input.length,
    complete:input.length===target.length&&incorrect===0,
    percent:input.length?Math.round(correct/input.length*100):100,
  };
  // Only the changed range and the old/new native caret positions require
  // class comparisons. On a one-character append this visits at most two
  // target characters, even in a large Story/Academy reference.
  const last=prior===null?target.length:
    Math.min(target.length,Math.max(prior.length,input.length)+1);
  for(let i=Math.min(first,target.length);i<last;i++){
    const status=i>=input.length?'pending'
      :equal(target[i],input[i])?'correct':'incorrect';
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
  for(let i=Math.max(0,first-target.length);i<extras.length;i++){
    const character=input[target.length+i];
    if(extras[i].textContent!==character)extras[i].textContent=character;
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
  entry.previousInput=input;
  entry.previousText=value;
  entry.correct=correct;
  entry.firstChild=element.firstElementChild;
  const accuracy=String(result.percent),errors=String(result.incorrect);
  if(element.dataset.accuracy!==accuracy)element.dataset.accuracy=accuracy;
  if(element.dataset.errors!==errors)element.dataset.errors=errors;
  return result;
}
