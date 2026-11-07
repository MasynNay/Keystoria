<div align="center">

# Keystoria

**Every key opens a world.**

A story-driven typing game where every keystroke moves the adventure forward.

**24 cooperative adventures · Lyric Lab · Speed Lab · Field Academy**

[Portfolio website](https://keystoria.masynnay.com/) · [Features](#features) · [Get started](#get-started) · [How it works](#how-it-works)

</div>

---

## Turn typing practice into an adventure

Keystoria brings together cooperative story missions, music-inspired typing challenges, timed speed tests, and practical command-line exercises. Instead of repeating random words, players can explore different ways to build typing speed, accuracy, and confidence.

The project began as *Panic Protocol* and evolved into a broader collection of typing experiences. Keystoria is the new name for that expanded vision.

> **Portfolio project:** The public website showcases the design and development of Keystoria. The complete interactive game runs locally using a Python server. GitHub Pages does not host the multiplayer server or a playable online version.

## Screenshots

**Game homepage** — the main entry point to Keystoria's typing experiences.

![Keystoria game homepage](assets/keystoria-home-desktop-v024.png)

Explore the [portfolio showcase](https://keystoria.masynnay.com/) for an overview of the game and its development.

## Features

- **24 cooperative story adventures.** Progress through themed missions by typing under pressure, with shared objectives and real-time multiplayer gameplay.
- **Lyric Lab.** Practice typing along with synchronized lyrics, with highlighted words, letter-by-letter feedback, and a flashing cue for the next expected key.
- **Speed Lab.** Work on typing speed and accuracy through focused challenges.
- **Field Academy.** Practice useful command-line typing in a game-oriented environment.
- **Responsive interface.** A themed browser frontend designed for desktop and smaller screens.
- **Progress compatibility.** The rebrand preserves existing internal save identifiers so earlier progress is not discarded solely because of the new name.

## Portfolio experience

The public [Keystoria website](https://keystoria.masynnay.com/) is a static product showcase, suitable for GitHub Pages. It introduces the project, its game modes, design, and technical implementation.

The full playable application is included under `app/`. It requires a running Python backend for its real-time features; the static portfolio page is **not** presented as a playable multiplayer demo.

## Get started

### Run the game locally

**macOS:** Open `app/` and run `run_mac.command`.

**Windows:** Open `app/` and run `run_windows.bat`.

**Manual setup** (Python 3.10+):

```bash
cd app
python -m pip install -r requirements.txt
python -m server.app
```

Then open **http://127.0.0.1:8080** in your browser.

### View the portfolio website

The static site is published from the repository root using GitHub Pages, with the intended custom domain `keystoria.masynnay.com`.

For setup instructions, see [GitHub Desktop and domain deployment](DEPLOY_GITHUB_DESKTOP.md).

## How it works

```text
Browser interface
    |
    +-- Story missions / multiplayer ---+
    +-- Lyric Lab                       |
    +-- Speed Lab                       +--> Python aiohttp server
    +-- Field Academy                   |        |
    |                                   |        +--> Game state and sessions
    +-- Live typing feedback -----------+        +--> WebSocket updates
```

Keystoria combines a vanilla JavaScript frontend with a Python `aiohttp` backend. WebSockets support real-time gameplay, while the browser handles responsive presentation and immediate typing feedback.

## Repository structure

```text
Keystoria/
├── index.html                 Static portfolio homepage
├── styles.css                 Portfolio styling
├── assets/                    Screenshots and visual assets
├── app/                       Complete playable game
│   ├── server/                Python backend and WebSocket logic
│   ├── web/                   Browser game interface
│   ├── tests/                 Automated tests
│   └── docs/                  Game documentation and screenshots
├── CNAME                      GitHub Pages custom domain
├── DEPLOY_GITHUB_DESKTOP.md   Publishing and DNS instructions
├── LICENSE                    Project license
└── README.md                  Project overview
```

## Development and testing

The project includes automated tests under `app/tests/`, along with development notes and checkpoints. The source includes the v0.24 Keystoria rebrand and the Lyric Lab next-key typing indicator.

For the latest development handoff, see [CONTINUE_HERE.md](app/CONTINUE_HERE.md).

## Technology

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Python, aiohttp
- **Real-time communication:** WebSockets
- **Portfolio hosting:** GitHub Pages
- **Version control:** Git and GitHub

## Project notes

Keystoria is an independent portfolio project. No commercial music recordings, video sources, or copyrighted songs are distributed in this repository. Third-party content, music-provider access, and branding rights require separate review before broader public distribution.

## License

MIT — see [LICENSE](LICENSE).
