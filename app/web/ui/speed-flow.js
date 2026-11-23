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
  let previous = null, previousCaret = null, scrollLine = -1;
  let endCaret = null;
  let scrollFrame = null, pendingScrollCursor = null, disposed = false;

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

  /** Follow the textarea selection, even when correcting previously typed words.
   * Caret-only changes never recompute accuracy or rewrite character classes.
   */
  function update(typed, selectionStart = undefined, scoredAccuracy = undefined) {
    if (disposed) return;
    const value = String(typed);
    const cursor = Number.isFinite(selectionStart)
      ? Math.max(0, Math.min(value.length, Math.trunc(selectionStart)))
      : value.length;
    const contentChanged = value !== previous;
    if (!contentChanged && cursor === previousCaret) return;
    const old = previous ?? '';

    // Reposition the compact window around the edit point, never the end of
    // the passage when the player is correcting an earlier word.
    let rebuilt = false;
    if (windowed && (cursor < start || cursor > start + 120)) {
      mount(Math.max(0, cursor - 40));
      rebuilt = true;
    }

    if (contentChanged || rebuilt) {
      let first = rebuilt || previous === null ? start : 0;
      if (!rebuilt && previous !== null) {
        while (first < old.length && first < value.length && old[first] === value[first]) first++;
        first = Math.max(start, first);
      }
      const last = Math.min(end, Math.max(old.length, value.length));
      for (let k = first; k < last; k++) {
        const letter = letters[k - start];
        letter.className = k >= value.length ? 'type-char pending'
          : value[k] === reference[k] ? 'type-char correct' : 'type-char incorrect';
      }
      if (contentChanged) {
        // The Speed controller supplies an accuracy snapshot already computed
        // for the same text edit. Direct renderer users retain the original
        // local calculation when they do not supply it.
        let accuracy = scoredAccuracy;
        if (!Number.isInteger(accuracy) || accuracy < 0 || accuracy > 100) {
          let correct = 0;
          for (let k = 0; k < value.length; k++) if (value[k] === reference[k]) correct++;
          accuracy = value.length ? Math.round(correct / value.length * 100) : 100;
        }
        const display = String(accuracy);
        if (container.dataset.accuracy !== display) container.dataset.accuracy = display;
      }
    }

    if (!rebuilt && previousCaret !== null && previousCaret >= start && previousCaret < end)
      letters[previousCaret - start]?.classList.remove('current');
    if (cursor >= start && cursor < end) letters[cursor - start]?.classList.add('current');
    endCaret.hidden = value.length < reference.length;
    previous = value;
    previousCaret = cursor;

    // Character highlighting stays synchronous, but layout reads may flush
    // the entire mobile page after every native keyboard input. Coalesce the
    // expensive caret geometry to the next animation frame instead.
    pendingScrollCursor = cursor;
    if (!windowed || typeof requestAnimationFrame !== 'function') {
      scrollCaret(cursor);
    } else if (scrollFrame === null) {
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = null;
        if (!disposed) scrollCaret(pendingScrollCursor);
      });
    }
  }

  function scrollCaret(scrollCursor) {
    if (disposed || !container.isConnected) return;
    const caret = letters[Math.min(Math.max(0, scrollCursor - start), letters.length - 1)];
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
  function dispose() {
    disposed = true;
    if (scrollFrame !== null && typeof cancelAnimationFrame === 'function')
      cancelAnimationFrame(scrollFrame);
    scrollFrame = null;
  }

  return {update, dispose, windowed, get linesScrolled() {return scrollLine;}};
}
