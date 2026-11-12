/** Live typing passage renderer.
 *
 * On desktop the complete passage is rendered as before. On phones we retain
 * the full reference for scoring but only mount a rolling ~220-character DOM
 * window. Hundreds of words previously created thousands of inline spans and
 * forced mobile style/layout work on every keystroke and timer tick.
 */
export const SPEED_MOBILE_RENDER_LIMIT = 220;

export function createSpeedFlow(container, reference, { windowed = false } = {}) {
  if (!container) return null;
  const limit = windowed ? SPEED_MOBILE_RENDER_LIMIT : reference.length;
  const doc = container.ownerDocument;
  let start = 0, end = 0, letters = [];
  let previous = null, scrollLine = -1;
  let endCaret = null;

  // The full exercise remains on the client, independent of the visual
  // window, so moving the window never resets timing, input, or accuracy.
  // The data attribute also lets browser QA finish a full-length session.
  if (windowed) container.dataset.fullReference = reference;

  function mount(from) {
    start = Math.min(Math.max(0, from), reference.length);
    end = Math.min(reference.length, start + limit);
    const fragment = doc.createDocumentFragment();
    letters = [];
    for (let i = start; i < end; i++) {
      const span = doc.createElement('span');
      span.className = 'type-char pending';
      span.textContent = reference[i];
      letters.push(span);
      fragment.appendChild(span);
    }
    endCaret = doc.createElement('span');
    endCaret.className = 'type-end-caret';
    endCaret.setAttribute('aria-hidden', 'true');
    endCaret.hidden = true;
    fragment.appendChild(endCaret);
    container.replaceChildren(fragment);
    container.scrollTop = 0;
  }
  mount(0);

  function update(typed) {
    const value = String(typed);
    // The 250ms clock refresh must not trigger DOM writes or layout reads
    // when the input has not changed.
    if (value === previous) return;
    const old = previous ?? '';

    // Keep the current character near the front of a small view. This also
    // moves backwards correctly when a user deletes a larger selection.
    let rebuilt = false;
    if (windowed && (value.length < start || value.length > start + 120)) {
      mount(Math.max(0, value.length - 40));
      rebuilt = true;
    }

    let first = rebuilt || previous === null ? start : 0;
    if (!rebuilt && previous !== null) {
      while (first < old.length && first < value.length && old[first] === value[first]) first++;
      first = Math.max(start, first);
    }
    const last = Math.min(end, Math.max(old.length, value.length));
    for (let i = first; i < last; i++) {
      const letter = letters[i - start];
      letter.className = i >= value.length ? 'type-char pending'
        : value[i] === reference[i] ? 'type-char correct' : 'type-char incorrect';
    }
    if (!rebuilt && old.length >= start && old.length < end)
      letters[old.length - start]?.classList.remove('current');
    if (value.length >= start && value.length < end)
      letters[value.length - start]?.classList.add('current');
    endCaret.hidden = value.length < reference.length;
    previous = value;

    let correct = 0;
    for (let i = 0; i < value.length; i++) if (value[i] === reference[i]) correct++;
    container.dataset.accuracy = value.length ? String(Math.round(correct / value.length * 100)) : '100';

    const caret = letters[Math.min(Math.max(0, value.length - start), letters.length - 1)];
    if (!caret) return;
    const lineHeight = Number.parseFloat(getComputedStyle(container).lineHeight) || 33;
    const viewport = container.getBoundingClientRect();
    const rect = caret.getBoundingClientRect();
    const y = rect.top - viewport.top;
    if (y > container.clientHeight - lineHeight * 1.45) {
      const lines = Math.ceil((y - (container.clientHeight - lineHeight * 1.45)) / lineHeight);
      container.scrollTop += lines * lineHeight;
    } else if (y < lineHeight * .35 && container.scrollTop > 0) {
      const lines = Math.ceil((lineHeight * .35 - y) / lineHeight);
      container.scrollTop = Math.max(0, container.scrollTop - lines * lineHeight);
    }
    scrollLine = Math.round(container.scrollTop / lineHeight);
  }

  return {update, windowed, get linesScrolled() {return scrollLine;}};
}
