/** Headless smoke check for browser module composition, with no external DOM. */
import test from 'node:test';
import assert from 'node:assert/strict';

const handlers = {};
const storage = new Map();
const fakeApp = {
  innerHTML: '',
  addEventListener(type, handler) { handlers[type] = handler; },
  insertAdjacentHTML(_, html) { this.innerHTML += html; },
};
const fakeModal = { dataset: {}, remove() { fakeApp.innerHTML = fakeApp.innerHTML.replace(/<div class="modal-backdrop[\s\S]*$/, ''); } };
globalThis.document = {
  body: { dataset: { theme: 'station' }, classList: { toggle() {} } },
  querySelector(selector) {
    if (selector === '#app') return fakeApp;
    if (selector === '.modal-backdrop' && fakeApp.innerHTML.includes('class="modal-backdrop')) return fakeModal;
    return null;
  },
};
globalThis.localStorage = {
  getItem(key) { return storage.get(key) ?? null; },
  setItem(key, value) { storage.set(key, String(value)); },
};
globalThis.sessionStorage = {
  getItem() { return null; },
  setItem() {}, removeItem() {},
};
globalThis.location = {
  search: '', protocol: 'http:', host: 'localhost:8080', href: 'http://localhost:8080/',
};
globalThis.WebSocket = class {
  static OPEN = 1; static CONNECTING = 0;
  constructor() { this.readyState = 0; }
  addEventListener() {}
};

await import('../web/app.js');

test('home page builds six mission cards, three Academy courses, and the solo entry point', () => {
  assert.match(fakeApp.innerHTML, /EVERY KEY/);
  assert.match(fakeApp.innerHTML, /OPENS A WORLD/);
  assert.match(fakeApp.innerHTML, /STATION ZERO/);
  assert.match(fakeApp.innerHTML, /THE HOLLOW HOUSE/);
  assert.match(fakeApp.innerHTML, /PATIENT ZERO/);
  assert.match(fakeApp.innerHTML, /THE LAST ALIBI/);
  assert.match(fakeApp.innerHTML, /DEAD AIR/);
  assert.match(fakeApp.innerHTML, /LAST STOP/);
  assert.match(fakeApp.innerHTML, /FIELD ACADEMY/);
  assert.equal((fakeApp.innerHTML.match(/class="academy-card"/g) || []).length, 3);
  assert.match(fakeApp.innerHTML, /SINGLE PLAYER \/ PLAY WITH ECHO/);
  assert.match(fakeApp.innerHTML, /JOIN A ROOM/);
});

test('choosing the haunted-house mission changes the selected theme', () => {
  const button = { dataset: { action: 'choose-mission', mission: 'hollow' }, classList: { contains() { return false; } }, closest() { return this; } };
  handlers.click({ target: button, preventDefault() {} });
  assert.equal(document.body.dataset.theme, 'hollow');
  assert.match(fakeApp.innerHTML, /aria-pressed="true"/);
});

test('opening a room displays the complete callsign dialog', () => {
  const button = { dataset: { action: 'create' }, classList: { contains() { return false; } }, closest() { return this; } };
  handlers.click({ target: button, preventDefault() {} });
  assert.match(fakeApp.innerHTML, /ASSEMBLE YOUR SQUAD/);
  assert.match(fakeApp.innerHTML, /YOUR CALLSIGN/);
  assert.match(fakeApp.innerHTML, /GENERATE ROOM CODE/);
});
