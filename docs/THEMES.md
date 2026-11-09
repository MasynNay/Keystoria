# Keystoria themes · v0.25

Keystoria offers **15 selectable, readable dark-mode palettes** through the settings icon in the game header. The themes share the same gameplay layout; each has a distinct background, panel, border, text, and accent treatment.

## Available themes

- **Signal** — Original electric lime.
- **Midnight** — Cool blue after dark.
- **Aurora** — Northern lights.
- **Ember** — Warm cinematic orange.
- **Amethyst** — Soft violet glow.
- **Deep Sea** — Submerged cobalt.
- **Forest** — Moss and morning light.
- **Rose Quartz** — Muted rose and ink.
- **Copper** — Burnished bronze.
- **Glacier** — Ice blue and graphite.
- **Synthwave** — Magenta neon nights.
- **Royal** — Indigo and silver.
- **Plum** — Velvet berry tones.
- **Slate** — Clean steel blue.
- **Noir** — Minimal monochrome.

## How to switch

1. Open [Keystoria's browser edition](https://keystoria.masynnay.com/play/) or start the local Python version.
2. Select the **Settings** icon in the header.
3. Choose any of the 15 color swatches. The change applies immediately, including Lyric Lab, Speed Lab, Field Academy, and the story interface.
4. Close settings. The choice persists in your browser's local storage and is restored after a refresh.

The selected appearance theme is stored separately from the current story mission, so changing missions does not change your chosen palette. It retains the old `panic.preferences.v1` key to preserve existing settings when upgrading. An unsupported saved theme falls back safely to **Signal**.

All 15 palettes use dark surfaces, legible text, and high-contrast accent colors. The existing high-contrast, reduced-motion, and larger-text settings remain independent. The portfolio showcase retains its own brand style; the theme selector belongs to the playable game.

## Engineering notes

- `app/web/ui/themes.js`: single palette registry and validation.
- `app/web/ui/preferences.js`: backwards-compatible saved preferences and application.
- `app/web/styles/themes.css`: theme variables and consistent common component surfaces.
- `app/web/ui/views.js`: accessible, responsive 15-choice settings grid.
- `site/play/assets/`: equivalent browser-hosted assets.
- `scripts/test-themes.mjs`: automated Playwright check across all palettes and three browser practice modes.

No game logic, save files, or third-party media integrations need to change for palette selection.
