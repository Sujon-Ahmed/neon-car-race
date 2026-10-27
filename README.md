# Neon Runner 🏎️

An endless traffic-dodging 3D game built with **Three.js** and **Vite**. Race a neon car down a three-lane highway, weave through oncoming traffic, and survive as long as you can while the speed climbs. All sound is synthesized in real time with the Web Audio API — no audio assets required.

> Developed by [Sujon Ahmed](https://github.com/Sujon-Ahmed)

---

## ✨ Features

- **Endless procedural gameplay** — oncoming traffic spawns randomly across three lanes, so no two runs are the same.
- **Progressive difficulty** — speed ramps up smoothly with your score, from a cruising pace up to a top speed of ~242 km/h.
- **Smooth lane changes** — the car glides, leans into turns, and steers its nose toward the target lane using damped easing.
- **Keyboard + touch controls** — play with `←`/`→` or `A`/`D`, or swipe left/right on mobile.
- **Procedural audio engine** — a continuous engine drone that pitches up with speed, lane-change whooshes, and a layered crash sound, all synthesized with oscillators and noise buffers.
- **Neon synthwave aesthetic** — cyan and magenta point lights, glowing curbs and pylons, lane markings, atmospheric fog, and an ACES Filmic tone-mapped render.
- **Live HUD** — score, a circular speed gauge (km/h), and a top-speed tracker.
- **Game over & restart** — crash stats screen with a one-click "Race Again" reset that clears the track and respawns you in the center lane.
- **Mute toggle** — SFX button to silence the whole mix without leaving the game.
- **Responsive** — the canvas and camera adapt to window resize and device orientation.

---

## 🧱 Tech Stack

| Layer            | Technology                                   |
| ---------------- | ------------------------------------------- |
| 3D rendering     | [Three.js](https://threejs.org/) `^0.186.1` |
| Build tool/Dev server | [Vite](https://vitejs.dev/) `^8.3.4`    |
| Language         | Vanilla JavaScript (ES modules)             |
| Audio            | Web Audio API (oscillators + noise buffers) |
| Styling          | Plain CSS (HUD overlay)                    |
| Markup           | Single `index.html` entry point             |

No frontend framework, no state library, no asset pipeline — just Three.js, Vite, and the browser.

---

## 📁 Project Structure

```
neon-car-race/
├── index.html              # HTML entry, mounts #app and loads src/main.js
├── package.json            # Scripts and dependencies
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.js             # Scene, camera, renderer, game loop, HUD, input
    ├── audio.js            # Web Audio synth engine (engine, lane, crash, mute)
    ├── style.css           # HUD and game-over overlay styles
    └── assets/             # Static image assets
```

---

## 🚀 Installation

Prerequisites:

- [Node.js](https://nodejs.org/) 18+ (for Vite 8)
- npm (bundled with Node.js) — or your preferred package manager

Steps:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd neon-car-race

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Vite prints a local URL (typically `http://localhost:5173`). Open it in your browser to play.

---

## 🎮 How to Play

| Action          | Keyboard        | Touch            |
| --------------- | --------------- | ---------------- |
| Move left       | `←` or `A`      | Swipe left       |
| Move right      | `→` or `D`      | Swipe right      |
| Toggle sound    | SFX button (HUD) | SFX button (HUD) |
| Restart after crash | "Race Again" button | "Race Again" button |

Goal: dodge the oncoming red and pink cars for as long as possible. Your score ticks up with survival time, and speed gradually increases — the longer you live, the faster everything comes at you.

---

## 🛠️ Available Scripts

```bash
npm run dev      # Start the Vite dev server with HMR
npm run build    # Production build into dist/
npm run preview  # Preview the production build locally
```

---

## 🎚️ Audio System

All sound is generated at runtime in `src/audio.js` — there are no audio files to load.

- `startEngine()` / `stopEngine()` — a continuous two-oscillator drone through a low-pass filter that fades in/out.
- `setEnginePitch(ratio)` — slides the drone's frequency and filter cutoff between base speed (`0`) and top speed (`1`).
- `playLaneChange(direction)` — a quick triangle-wave whoosh, pitched lower for left and higher for right.
- `playCrash()` — filtered noise burst plus a low sine "thump" for impact.
- `toggleMute()` — mutes/unmutes the master gain without touching individual sounds.

Audio only starts after the first user interaction (pointerdown), per browser autoplay policy.

---

## 🌐 Browser Support

Runs in any modern browser with WebGL and Web Audio API support (recent Chrome, Edge, Firefox, Safari). Mobile browsers are supported, including touch-swipe controls.

---

## 📝 Notes

- The project is currently marked `private` in `package.json` with no license specified. Add a `LICENSE` file if you intend to distribute it.
- All 3D models (cars, pylons, road) are built from primitive geometries — no external model files are loaded.

---

## 👤 Credits

Developed by [Sujon Ahmed](https://github.com/Sujon-Ahmed).

Built with [Three.js](https://threejs.org/) and [Vite](https://vitejs.dev/).
