/** Character-by-character Lyric Lab prompt using the same visual states as other
 * Keystoria typing modes. The original lyric stays visible, even when its
 * punctuation/accents are optional for the current scoring mode.
 */
import { safe } from './helpers.js';
import { cleanWord } from './lyric-lab-core.js';

export function renderLyricWordFeedback(word, typed = '', { strict = false } = {}) {
  const characters = Array.from(String(word ?? ''));
  const submitted = Array.from(strict ? String(typed ?? '') : cleanWord(typed));
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
