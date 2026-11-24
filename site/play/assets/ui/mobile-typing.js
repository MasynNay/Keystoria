/** Phone software-keyboard ergonomics. Desktop typing remains untouched.
 * We keep prompts next to real HTML inputs, then correct their visible position
 * when a native visualViewport shrinks or shifts. No imitation keyboard.
 */
export const MOBILE_TYPING_FIELDS=Object.freeze(['speed-input','lyric-input','lesson-input']);
/** Keep thumb controls on shallow touch landscapes without switching desktop
 * windows merely because they are short. Match the CSS media query exactly.
 */
export const MOBILE_TYPING_MEDIA='(max-width: 760px), (max-height: 520px) and (pointer: coarse)';
/** One bounded reference offset shared by the visual and spoken cues.
 * Cursor is optional for legacy full-passage progress callers.
 */
function speedCaretOffset(source,typed,cursor){
 const typedLength=Math.min(source.length,String(typed??'').length);
 return Number.isFinite(cursor)
   ? Math.max(0,Math.min(typedLength,Math.trunc(cursor)))
   : typedLength;
}
export function nextSpeedCue(reference,typed,visible=38,cursor=undefined) {
 const source=String(reference??'');
 const offset=speedCaretOffset(source,typed,cursor);
 const count=Math.max(2,Math.floor(Number(visible)||38));
 return {next:source[offset]||'',rest:source.slice(offset+1,offset+count),remaining:source.length-offset};
}

/** Accessible Speed Lab target. Unlike the per-character visible cursor, the
 * spoken target changes only at a word/number-group boundary; otherwise a
 * screen reader would be interrupted after every keystroke.
 */
export function speedSpokenTarget(reference, typed, numpad=false, cursor=undefined){
 const source=String(reference??'');
 // With a touch correction or an Arrow/Home key, the editable position may
 // be earlier than the end of the typed text. Match the visual guidance.
 const offset=speedCaretOffset(source,typed,cursor);
 const prefix=numpad?'Current number group: ':'Current word: ';
 if(offset>=source.length)return 'Passage complete';
 let start=offset,end=offset;
 while(start>0 && !/\s/.test(source[start-1]))start--;
 while(end<source.length && !/\s/.test(source[end]))end++;
 let target=source.slice(start,end);
 if(!target){
   start=offset;
   while(start<source.length && /\s/.test(source[start]))start++;
   end=start;
   while(end<source.length && !/\s/.test(source[end]))end++;
   target=source.slice(start,end);
 }
 return target?prefix+target:'Passage complete';
}


/** One caret-positioned word/group for optional touch Word Focus.
 * Display a pending space as ␣ without changing the reference or input.
 */
export function speedFocusWord(reference, typed, cursor=undefined) {
 const source=String(reference??''), value=String(typed??'');
 const offset=speedCaretOffset(source,value,cursor);
 let start=offset;
 while(start>0 && !/\s/.test(source[start-1]))start--;
 let end=start;
 while(end<source.length && !/\s/.test(source[end]))end++;
 const word=source.slice(start,end), characters=[];
 for(let i=0;i<word.length;i++){
   const at=start+i,letter=word[i];
   characters.push({
     letter,
     state:at>=value.length?'pending':(value[at]===letter?'correct':'incorrect'),
     current:at===offset,
   });
 }
 // A pending Space belongs to the word just typed. Do not display the next
 // word until that separator is entered; match the existing spoken target.
 if(offset<source.length && /\s/.test(source[offset])){
   characters.push({letter:'␣',
     state:offset>=value.length?'pending':(value[offset]===source[offset]?'correct':'incorrect'),
     current:true});
 }
 return {word,characters,start};
}

/** Preserve the small Word Focus prompt across native input events. A phone
 * keyboard should never force a new set of character elements for each key.
 * Rebuild only when its visible letters change or another component replaces
 * the node tree, then update the existing classes in place.
 */
const mountedFocusWords=new WeakMap();
export function paintSpeedFocusWord(element,focus){
 if(!element)return;
 const characters=Array.isArray(focus?.characters)?focus.characters:[];
 if(!characters.length){
   const only=element.firstElementChild;
   if(element.childNodes.length!==1||only?.tagName!=='SPAN'||only.textContent!=='COMPLETE'){
     const done=element.ownerDocument.createElement('span');
     done.textContent='COMPLETE';
     element.replaceChildren(done);
   }
   mountedFocusWords.delete(element);
   return;
 }
 let nodes=mountedFocusWords.get(element);
 const intact=nodes &&
   element.childNodes.length===nodes.length &&
   nodes.every((node,i)=>node.parentElement===element
     &&element.children[i]===node&&node.classList.contains('speed-focus-char'));
 const shared=intact &&
   nodes.slice(0,Math.min(nodes.length,characters.length))
     .every((node,i)=>node.textContent===String(characters[i].letter));
 if(shared){
   // At the end of a word, the visible pending Space becomes an extra span.
   // Grow or shrink only that suffix; never detach the completed letters.
   while(nodes.length>characters.length)nodes.pop().remove();
   while(nodes.length<characters.length){
     const span=element.ownerDocument.createElement('span');
     span.textContent=characters[nodes.length].letter;
     element.append(span);
     nodes.push(span);
   }
 }else{
   const existing=Array.from(element.children);
   const adopt=existing.length===characters.length &&
     element.childNodes.length===existing.length &&
     characters.every((ch,i)=>existing[i].tagName==='SPAN'
       &&existing[i].classList.contains('speed-focus-char')
       &&existing[i].textContent===String(ch.letter));
   if(adopt)nodes=existing;
   else{
     const fragment=element.ownerDocument.createDocumentFragment();
     nodes=characters.map(ch=>{
       const span=element.ownerDocument.createElement('span');
       span.textContent=ch.letter;
       fragment.append(span);
       return span;
     });
     element.replaceChildren(fragment);
   }
   mountedFocusWords.set(element,nodes);
 }
 for(let i=0;i<characters.length;i++){
   const ch=characters[i];
   const className='speed-focus-char '+ch.state+(ch.current?' current':'');
   if(nodes[i].className!==className)nodes[i].className=className;
 }
}

/** Range to delete when a phone player taps Back Word. Mirrors text-editing
 * keyboard shortcuts, but never deletes text after the caret or changes a
 * pre-existing selection. Removing a middle word also avoids double spaces.
 */
export function previousWordRange(value,start,end=start){
 const text=String(value??'');
 const pos=n=>Math.max(0,Math.min(text.length,Number.isFinite(n)?Math.trunc(n):text.length));
 const a=Math.min(pos(start),pos(end)),b=Math.max(pos(start),pos(end));
 if(a!==b)return {start:a,end:b};
 let from=a;
 while(from>0 && /\s/.test(text[from-1]))from--;
 while(from>0 && !/\s/.test(text[from-1]))from--;
 let to=a;
 if(from<a && from>0 && /\s/.test(text[from-1]) && /\s/.test(text[to]||''))to++;
 return {start:from,end:to};
}

/** Positive delta scrolls the document downward; negative scrolls upward. */
export function mobileScrollDelta(rect,visibleTop,visibleHeight,padding=12) {
 const top=Math.max(0,Number(visibleTop)||0);
 const height=Math.max(0,Number(visibleHeight)||0);
 if(!height||!rect)return 0;
 const margin=Math.min(Math.max(0,padding),Math.floor(height/8));
 const available=Math.max(0,height-2*margin);
 // Prioritize the input end if the full cue/actions won't fit.
 if(rect.bottom-rect.top>available)return rect.bottom-(top+height-margin);
 if(rect.bottom>top+height-margin)return rect.bottom-(top+height-margin);
 if(rect.top<top+margin)return rect.top-(top+margin);
 return 0;
}
/** The practice prompt and input are the critical region while a native
 * software keyboard is visible. Controls below the field remain scrollable,
 * but must not push the cue above the viewport during focus corrections.
 */
export function mobileFocusBounds(field) {
 if (!field?.getBoundingClientRect) return null;
 const input=field.getBoundingClientRect();
 const cue=field.closest?.('.mobile-typing-entry')
   ?.querySelector?.('.mobile-speed-cue,.mobile-lyric-word,.mobile-academy-target');
 const target=cue?.getBoundingClientRect?.();
 if (!target || target.height<=0) return input;
 return {top:Math.min(target.top,input.top),bottom:Math.max(target.bottom,input.bottom)};
}

/** Patch an Academy step without detaching its native input or live status.
 * Keeps phone keyboards open and screen-reader status updates discoverable on
 * desktop. Completed courses still use the full result screen.
 */
export function patchMobileTraining(current,next){
 if(!current||!next||next.querySelector('.training-complete'))return false;
 const original=current.querySelector('#lesson-input');
 const fresh=next.querySelector('#lesson-input');
 if(!original||!fresh)return false;
 const selectors=[
   '.training-hud','.terminal-bar','.terminal-inner > h2',
   '.terminal-inner > p','.terminal-prompt',
   '.terminal-inner > .typing-legend',
   '.mobile-academy-target','.academy-mobile-entry > label',
   '.academy-mobile-entry > .mobile-entry-actions',
   '.terminal-inner > .training-buttons','.reference-panel'
 ];
 for(const selector of selectors){
   const old=current.querySelector(selector);
   const replacement=next.querySelector(selector);
   if(old&&replacement)old.replaceWith(replacement.cloneNode(true));
 }
 // Replacing a status node on submit hides the update from some screen
 // readers. Keep its DOM identity and update its message only when changed.
 const status=current.querySelector('#training-feedback');
 const nextStatus=next.querySelector('#training-feedback');
 if(status&&nextStatus){
   status.className=nextStatus.className;
   if(status.textContent!==nextStatus.textContent)
     status.textContent=nextStatus.textContent;
 }
 for(const [selector,insert] of [
   ['.terminal-inner > .sample-output',()=>current.querySelector('.terminal-inner > .training-buttons')],
   ['.training-glossary',()=>null]
 ]){
   const old=current.querySelector(selector);
   const replacement=next.querySelector(selector);
   if(old&&replacement)old.replaceWith(replacement.cloneNode(true));
   else if(old&&!replacement)old.remove();
   else if(!old&&replacement){
     const anchor=insert();
     if(anchor)anchor.before(replacement.cloneNode(true));
     else current.append(replacement.cloneNode(true));
   }
 }
 original.value=fresh.value;
 original.readOnly=fresh.readOnly;
 original.disabled=fresh.disabled;
 original.setAttribute?.('aria-invalid',fresh.getAttribute?.('aria-invalid')||'false');
 return true;
}

export function setupMobileTyping(root) {
 if(typeof window==='undefined'||!root)return ()=>{};
 const selector=MOBILE_TYPING_FIELDS.map(id=>`#${id}`).join(',');
 const isMobile=()=>window.matchMedia(MOBILE_TYPING_MEDIA).matches;
 let active=null,queued=false,blurToken=0;
 const viewport=window.visualViewport;
 // Safari can emit visualViewport.scroll repeatedly while a player manually
 // moves the page. Unlike keyboard resize, that must not snap the page back
 // to the focused typing field or force a layout read each frame.
 let lastViewportWidth=viewport?.width, lastViewportHeight=viewport?.height;
 function recordViewportSize(){
   lastViewportWidth=viewport?.width;
   lastViewportHeight=viewport?.height;
 }
 function onViewportScroll(){
   // Some browsers signal a keyboard geometry change with scroll but without
   // resize; correct those changes while ignoring ordinary pan/scroll events.
   const width=viewport?.width, height=viewport?.height;
   if(!Number.isFinite(width)||!Number.isFinite(height))return;
   if(Math.abs(width-lastViewportWidth)>1||Math.abs(height-lastViewportHeight)>1)
     onResize();
 }
 function position() {
   queued=false;
   if(!active||!active.isConnected||document.activeElement!==active||document.hidden||!isMobile())return;
   const bounds=mobileFocusBounds(active);
   const top=viewport?.offsetTop||0;
   const height=viewport?.height||window.innerHeight;
   const delta=mobileScrollDelta(bounds,top,height);
   // No animations while a virtual keyboard is resizing the viewport.
   // The page uses global smooth scrolling for anchor navigation. Native
   // keyboard shifts must NOT inherit it, or the cue can chase the keyboard.
   if(Math.abs(delta)>3)window.scrollBy({top:Math.round(delta),left:0,behavior:'instant'});
 }
 function queue() {
   if(!active||queued)return;
   queued=true;window.requestAnimationFrame(position);
 }
 function focus(event) {
   if(!event.target?.matches?.(selector)||!isMobile())return;
   blurToken++;
   active=event.target;
   document.body.classList.add('mobile-typing-active');
   queue();
 }
 function blur(event) {
   if(event.target!==active)return;
   const token=++blurToken;
   window.setTimeout(()=>{
     if(token!==blurToken)return;
     const current=document.activeElement;
     if(current?.matches?.(selector)){active=current;return;}
     active=null;document.body.classList.remove('mobile-typing-active');
   },180);
 }
 function onResize(){
   recordViewportSize();
   // A physical phone may cross the 760px breakpoint while rotating. Returning
   // to portrait does not fire focusin again if the native input stayed focused.
   // Reconcile with the actual focused element on every viewport change.
   const focused=document.activeElement;
   if(!isMobile()){
     active=null;
     document.body.classList.remove('mobile-typing-active');
     return;
   }
   if(focused?.isConnected&&focused.matches?.(selector)){
     if(active!==focused)blurToken++;
     active=focused;
     document.body.classList.add('mobile-typing-active');
     queue();
     return;
   }
   // Do not resurrect the keyboard-active UI for a stale or detached input.
   active=null;
   document.body.classList.remove('mobile-typing-active');
 }
 // Some mobile browsers do not emit a fresh visualViewport resize after
 // returning from the app switcher. Recheck the *current* focused input,
 // without reopening or stealing the software keyboard.
 function onReturn() {
   if(!document.hidden)onResize();
 }
 document.addEventListener('visibilitychange',onReturn);
 window.addEventListener('pageshow',onReturn);
 root.addEventListener('focusin',focus);
 root.addEventListener('focusout',blur);
 viewport?.addEventListener('resize',onResize);
 viewport?.addEventListener('scroll',onViewportScroll);
 window.addEventListener('resize',onResize);
 return ()=>{
   document.removeEventListener('visibilitychange',onReturn);
   window.removeEventListener('pageshow',onReturn);
   root.removeEventListener('focusin',focus);
   root.removeEventListener('focusout',blur);
   viewport?.removeEventListener('resize',onResize);
   viewport?.removeEventListener('scroll',onViewportScroll);
   window.removeEventListener('resize',onResize);
   document.body.classList.remove('mobile-typing-active');
 };
}
