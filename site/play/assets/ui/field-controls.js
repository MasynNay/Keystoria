/** A compact, accessible control board for the optional act intervention.
 * Options and activation status always come from the authoritative server.
 */
import { safe } from './helpers.js';

function content(room) {
  const op = room.fieldOps;
  if (!op) return '';
  if (op.used) {
    const action = op.history.find(entry => entry.stage === room.stage);
    return `<div class="field-done" role="status"><span>✓ FIELD ACTION APPLIED</span><strong>${safe(action?.label || 'OPERATION COMPLETE')}</strong><p>${safe(action?.outcome || 'Your emergency measure changed the mission.')}</p></div>`;
  }
  if (!op.unlocked) return `<div class="field-locked"><span>◌ FIELD CONSOLE LOCKED</span><p>Secure your first objective in this act to activate the emergency controls. Then choose how your team responds.</p></div>`;
  return `<div class="field-choices" role="group" aria-label="Choose an optional emergency intervention">
    <div class="field-call">◉ LIVE DECISION AVAILABLE · ONE ACTION THIS ACT</div>
    <p>${safe(op.context)}</p>
    <div class="field-choice-grid">${op.options.map((option, i) => `<button type="button" data-action="field-action" data-field="${safe(option.id)}" ${op.available ? '' : 'disabled'} aria-label="${safe(option.label)}: ${safe(option.benefit)}">
      <span>OPTION 0${i+1} →</span><strong>${safe(option.label)}</strong><small>${safe(option.benefit)}</small>
    </button>`).join('')}</div>
  </div>`;
}

export function fieldControlsTemplate(room) {
  return `<section class="field-console" id="field-console" aria-label="Interactive world controls">
    <div class="field-console-header"><span>◈ // INTERACTIVE WORLD CONTROL</span><strong id="field-heading">${safe(room.fieldOps?.heading || 'MISSION CONTROL')}</strong></div>
    <div id="field-content">${content(room)}</div>
  </section>`;
}

/** Only repaint on a real decision or milestone; snapshots arrive four times/second. */
export function updateFieldControls(room) {
  const root = document.getElementById('field-console');
  if (!root || !room.fieldOps) return;
  const key = `${room.stage}|${room.fieldOps.unlocked}|${room.fieldOps.used}|${room.fieldOps.selected}|${room.fieldOps.available}`;
  if (root.dataset.key === key) return;
  root.dataset.key = key;
  document.getElementById('field-heading').textContent = room.fieldOps.heading;
  const body = document.getElementById('field-content');
  body.innerHTML = content(room);
  root.classList.toggle('field-applied', room.fieldOps.used);
  root.classList.remove('field-reveal');
  void root.offsetWidth;
  root.classList.add('field-reveal');
}
