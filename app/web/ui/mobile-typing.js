/** Phone software-keyboard ergonomics. Desktop typing remains untouched.
 * We keep prompts next to real HTML inputs, then correct their visible position
 * when a native visualViewport shrinks or shifts. No imitation keyboard.
 */
export const MOBILE_TYPING_FIELDS=Object.freeze(['speed-input','lyric-input','lesson-input']);
export function nextSpeedCue(reference,typed,visible=38) {
 const source=String(reference??'');
 const offset=Math.max(0,Math.min(source.length,String(typed??'').length));
 const count=Math.max(2,Math.floor(Number(visible)||38));
 return {next:source[offset]||'',rest:source.slice(offset+1,offset+count),remaining:source.length-offset};
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
/** Update a mobile Academy lesson without detaching its native text input.
 * Keeping the same focused input node avoids closing the software keyboard
 * between accepted commands on touch devices. Returns false for final screens.
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
   '.terminal-inner > .training-feedback',
   '.terminal-inner > .training-buttons','.reference-panel'
 ];
 for(const selector of selectors){
   const old=current.querySelector(selector);
   const replacement=next.querySelector(selector);
   if(old&&replacement)old.replaceWith(replacement.cloneNode(true));
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
 return true;
}

export function setupMobileTyping(root) {
 if(typeof window==='undefined'||!root)return ()=>{};
 const selector=MOBILE_TYPING_FIELDS.map(id=>`#${id}`).join(',');
 const isMobile=()=>window.matchMedia('(max-width: 760px)').matches;
 let active=null,queued=false,blurToken=0;
 const viewport=window.visualViewport;
 function position() {
   queued=false;
   if(!active||!active.isConnected||!isMobile())return;
   const bounds=active.closest('.mobile-typing-entry')?.getBoundingClientRect()||active.getBoundingClientRect();
   const top=viewport?.offsetTop||0;
   const height=viewport?.height||window.innerHeight;
   const delta=mobileScrollDelta(bounds,top,height);
   // No animations while a virtual keyboard is resizing the viewport.
   if(Math.abs(delta)>3)window.scrollBy(0,Math.round(delta));
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
   if(!isMobile()){active=null;document.body.classList.remove('mobile-typing-active');return;}
   queue();
 }
 root.addEventListener('focusin',focus);
 root.addEventListener('focusout',blur);
 viewport?.addEventListener('resize',onResize);
 viewport?.addEventListener('scroll',onResize);
 window.addEventListener('resize',onResize);
 return ()=>{
   root.removeEventListener('focusin',focus);
   root.removeEventListener('focusout',blur);
   viewport?.removeEventListener('resize',onResize);
   viewport?.removeEventListener('scroll',onResize);
   window.removeEventListener('resize',onResize);
   document.body.classList.remove('mobile-typing-active');
 };
}
