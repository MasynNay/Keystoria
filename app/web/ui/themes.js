/** Fifteen distinct, accessible dark palettes. Story-specific art is preserved. */
export const THEMES = Object.freeze([
  {
    "id": "signal",
    "name": "Signal",
    "description": "Original electric lime",
    "bg": "#080d14",
    "panel": "#111823",
    "panel2": "#18232b",
    "accent": "#eaff78",
    "text": "#eaf1e7",
    "muted": "#aebec0",
    "line": "#c7e9e0"
  },
  {
    "id": "midnight",
    "name": "Midnight",
    "description": "Cool blue after dark",
    "bg": "#09101f",
    "panel": "#141e33",
    "panel2": "#1b2a42",
    "accent": "#85c5ff",
    "text": "#edf3ff",
    "muted": "#aebcd4",
    "line": "#b5d8f3"
  },
  {
    "id": "aurora",
    "name": "Aurora",
    "description": "Northern lights",
    "bg": "#071b1a",
    "panel": "#102c28",
    "panel2": "#163b37",
    "accent": "#72ebcb",
    "text": "#edfff7",
    "muted": "#a6d0c4",
    "line": "#abe5d1"
  },
  {
    "id": "ember",
    "name": "Ember",
    "description": "Warm cinematic orange",
    "bg": "#1b1213",
    "panel": "#291c1b",
    "panel2": "#392620",
    "accent": "#ffb475",
    "text": "#fff4e9",
    "muted": "#d7baaa",
    "line": "#f0c79f"
  },
  {
    "id": "amethyst",
    "name": "Amethyst",
    "description": "Soft violet glow",
    "bg": "#151020",
    "panel": "#241c33",
    "panel2": "#30243f",
    "accent": "#d6b5ff",
    "text": "#f8f1ff",
    "muted": "#c4b3d6",
    "line": "#e4caff"
  },
  {
    "id": "deep-sea",
    "name": "Deep Sea",
    "description": "Submerged cobalt",
    "bg": "#071625",
    "panel": "#10283c",
    "panel2": "#183b50",
    "accent": "#81d6f6",
    "text": "#eefaff",
    "muted": "#a9c5d6",
    "line": "#b9e6f4"
  },
  {
    "id": "forest",
    "name": "Forest",
    "description": "Moss and morning light",
    "bg": "#0e1a13",
    "panel": "#1a2b20",
    "panel2": "#233b2b",
    "accent": "#b6e492",
    "text": "#f2fbed",
    "muted": "#bad0b6",
    "line": "#d6eab6"
  },
  {
    "id": "rose",
    "name": "Rose Quartz",
    "description": "Muted rose and ink",
    "bg": "#201219",
    "panel": "#311e28",
    "panel2": "#412633",
    "accent": "#ffb2cf",
    "text": "#fff1f7",
    "muted": "#d9b7c6",
    "line": "#f4cbdc"
  },
  {
    "id": "copper",
    "name": "Copper",
    "description": "Burnished bronze",
    "bg": "#1d1711",
    "panel": "#30251c",
    "panel2": "#423124",
    "accent": "#f2c48c",
    "text": "#fcf4e7",
    "muted": "#d1beab",
    "line": "#f1d0a8"
  },
  {
    "id": "glacier",
    "name": "Glacier",
    "description": "Ice blue and graphite",
    "bg": "#111b27",
    "panel": "#1a2a39",
    "panel2": "#243b4d",
    "accent": "#b6e2ff",
    "text": "#f4faff",
    "muted": "#bacddc",
    "line": "#d3eaff"
  },
  {
    "id": "synthwave",
    "name": "Synthwave",
    "description": "Magenta neon nights",
    "bg": "#1b1028",
    "panel": "#2e1b40",
    "panel2": "#3f2355",
    "accent": "#f4a2f5",
    "text": "#fff3ff",
    "muted": "#d9b9e5",
    "line": "#f6c3f3"
  },
  {
    "id": "royal",
    "name": "Royal",
    "description": "Indigo and silver",
    "bg": "#0f1630",
    "panel": "#1b2542",
    "panel2": "#273456",
    "accent": "#acbbff",
    "text": "#f3f6ff",
    "muted": "#b7c3e5",
    "line": "#d2d9ff"
  },
  {
    "id": "plum",
    "name": "Plum",
    "description": "Velvet berry tones",
    "bg": "#211626",
    "panel": "#33223a",
    "panel2": "#432b4e",
    "accent": "#e6b3d9",
    "text": "#fdf2fa",
    "muted": "#d3b9d0",
    "line": "#efd2e9"
  },
  {
    "id": "slate",
    "name": "Slate",
    "description": "Clean steel blue",
    "bg": "#10191c",
    "panel": "#1c2b31",
    "panel2": "#273940",
    "accent": "#a8d4dc",
    "text": "#f1f9f9",
    "muted": "#b8cace",
    "line": "#d2e9e9"
  },
  {
    "id": "noir",
    "name": "Noir",
    "description": "Minimal monochrome",
    "bg": "#121416",
    "panel": "#202326",
    "panel2": "#2c3034",
    "accent": "#f1e7cd",
    "text": "#faf7f0",
    "muted": "#c3c3bf",
    "line": "#e8e1d3"
  }
].map(theme => Object.freeze(theme)));
export const DEFAULT_THEME = "signal";
export const THEME_IDS = Object.freeze(THEMES.map(theme => theme.id));
export function validTheme(id) { return THEME_IDS.includes(id) ? id : DEFAULT_THEME; }
