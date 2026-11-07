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

export function paintTypingFeedback(element, expected, typed, options = {}) {
  if (!element) return compareTyping(expected, typed, options);
  const result = compareTyping(expected, typed, options);
  element.innerHTML = renderTypingFeedback(expected, typed, options);
  element.dataset.accuracy = String(result.percent);
  element.dataset.errors = String(result.incorrect);
  return result;
}
