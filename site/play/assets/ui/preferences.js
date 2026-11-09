import { DEFAULT_THEME, validTheme } from "./themes.js";
/** Presentation preferences are independent of server gameplay state. */
const KEY = "panic.preferences.v1";
const DEFAULTS = Object.freeze({ largerType: false, highContrast: false, reducedMotion: false, theme: DEFAULT_THEME });

export function loadPreferences(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(KEY) || "{}");
    return { largerType: value.largerType === true, highContrast: value.highContrast === true, reducedMotion: value.reducedMotion === true, theme: validTheme(value.theme) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePreferences(settings, storage = globalThis.localStorage) {
  const sanitized = { largerType: settings.largerType === true, highContrast: settings.highContrast === true, reducedMotion: settings.reducedMotion === true, theme: validTheme(settings.theme) };
  try { storage.setItem(KEY, JSON.stringify(sanitized)); } catch { /* Optional storage. */ }
  return sanitized;
}

export function applyPreferences(settings, body = document.body) {
  body.dataset.uiTheme = validTheme(settings.theme);
  body.classList.toggle("larger-type", settings.largerType);
  body.classList.toggle("high-contrast", settings.highContrast);
  body.classList.toggle("reduce-motion", settings.reducedMotion);
}
