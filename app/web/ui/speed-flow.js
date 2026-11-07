/** A continuous, stable typing surface.
 *
 * The reference is rendered only once. Per-key updates change classes on
 * existing character nodes, so no word can reflow horizontally while typing.
 * Only the viewport's vertical scroll offset changes at a line boundary.
 */
export function createSpeedFlow(container, reference) {
  if (!container) return null;
  const fragment=document.createDocumentFragment();
  const letters=Array.from(reference,(char)=>{
    const span=document.createElement('span');
    span.className='type-char pending';
    span.textContent=char;
    fragment.appendChild(span);
    return span;
  });
  const endCaret=document.createElement('span');
  endCaret.className = 'type-end-caret';
  endCaret.setAttribute('aria-hidden', 'true');
  endCaret.hidden = true;
  fragment.appendChild(endCaret);
  container.replaceChildren(fragment);
  container.scrollTop = 0;
  let previous = '';
  let scrollLine = -1;

  function update(typed) {
    const value = String(typed);
    const old = previous;
    // Update only altered characters plus the caret. Backspace restores pending.
    let first = 0;
    while (first < old.length && first < value.length && old[first] === value[first]) first++;
    for (let i = first; i < Math.max(old.length, value.length); i++) {
      const letter = letters[i];
      if (!letter) continue;
      letter.className = i >= value.length ? 'type-char pending'
        : (value[i] === reference[i] ? 'type-char correct' : 'type-char incorrect');
    }
    if (old.length < letters.length) letters[old.length]?.classList.remove('current');
    if (value.length < letters.length) letters[value.length]?.classList.add('current');
    endCaret.hidden = value.length < letters.length;
    previous = value;
    container.dataset.accuracy = value.length
      ? String(Math.round(Array.from(value).filter((char, i) => char === reference[i]).length / value.length * 100)) : '100';

    const caret = letters[Math.min(value.length, letters.length - 1)];
    if (!caret) return;
    const lineHeight = Number.parseFloat(getComputedStyle(container).lineHeight) || 33;
    const viewport = container.getBoundingClientRect();
    const rect = caret.getBoundingClientRect();
    const y = rect.top - viewport.top;
    // Discrete, full-line vertical movement; never change text positions on X.
    if (y > container.clientHeight - lineHeight * 1.45) {
      const lines = Math.ceil((y - (container.clientHeight - lineHeight * 1.45)) / lineHeight);
      container.scrollTop += lines * lineHeight;
    } else if (y < lineHeight * .35 && container.scrollTop > 0) {
      const lines = Math.ceil((lineHeight * .35 - y) / lineHeight);
      container.scrollTop = Math.max(0, container.scrollTop - lines * lineHeight);
    }
    scrollLine = Math.round(container.scrollTop / lineHeight);
  }
  return {update, get linesScrolled() {return scrollLine;}};
}
