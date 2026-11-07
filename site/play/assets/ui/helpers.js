/** Shared display helpers; values destined for HTML are escaped at the boundary. */
export const safe = (s) => String(s ?? "").replace(/[&<>"']/g, ch => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[ch]));
export const norm = (s) => String(s).toLowerCase().trim().replace(/\s+/g, " ");
export const timeString = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(Math.floor(seconds % 60)).padStart(2,"0")}`;
export const pad = (n) => String(n).padStart(2, "0");
export const ico = (name, size=18) => {
  const paths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    headphones: '<path d="M3 14v-3a9 9 0 0 1 18 0v3M5 14h2v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Zm12 0h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2v-6Z"/>',
    volume: '<path d="M11 5 6 9H3v6h3l5 4V5Zm4 4a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"/>',
    mute: '<path d="M11 5 6 9H3v6h3l5 4V5Zm6 4 5 6m0-6-5 6"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2H2Zm15-16a4 4 0 0 1 0 7m1 5a5 5 0 0 1 4 4"/>',
    shield: '<path d="m12 22 8-4V6l-8-4-8 4v12l8 4Z"/><path d="m8 12 3 3 5-6"/>',
    bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7l0-8Z"/>',
    keyboard: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h.01M18 13h.01M7 16h10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 .5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/>',
    alert: '<path d="m12 2 10 18H2L12 2Zm0 7v4m0 3v.01"/>',
    cross: '<path d="M18 6 6 18M6 6l12 12"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    play: '<path d="m8 5 12 7-12 7V5Z"/>',
    radio: '<circle cx="12" cy="12" r="2"/><path d="M16 8a6 6 0 0 1 0 8M8 16a6 6 0 0 1 0-8M19 5a10 10 0 0 1 0 14M5 19a10 10 0 0 1 0-14"/>',
    settings: '<path d="M4 7h16M4 17h16M9 4v6m6 4v6"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.bolt}</svg>`;
};
export const brand = () => `<a class="brand" data-action="home" href="./" aria-label="Keystoria home"><span class="brand-symbol"><img src="assets/keystoria-mark.svg" alt="" width="40" height="40" /></span><span class="brand-name">KEY<span>STORIA</span></span><span class="brand-ver">// EVERY KEY OPENS A WORLD</span></a>`;
export const tag = (text, extra="") => `<span class="eyebrow ${extra}"><span class="tiny-square"></span>${safe(text)}</span>`;

