/** Presentation preferences are independent of server gameplay state. */
const KEY = "panic.preferences.v1";
const DEFAULTS = Object.freeze({ largerType: false, highContrast: false, reducedMotion: false });

export function loadPreferences(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(KEY) || "{}");
    return Object.fromEntries(Object.keys(DEFAULTS).map(key => [key, value[key] === true]));
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePreferences(settings, storage = globalThis.localStorage) {
  const sanitized = Object.fromEntries(Object.keys(DEFAULTS).map(key => [key, settings[key] === true]));
  try { storage.setItem(KEY, JSON.stringify(sanitized)); } catch { /* Optional storage. */ }
  return sanitized;
}

export function applyPreferences(settings, body = document.body) {
  body.classList.toggle("larger-type", settings.largerType);
  body.classList.toggle("high-contrast", settings.highContrast);
  body.classList.toggle("reduce-motion", settings.reducedMotion);
}
