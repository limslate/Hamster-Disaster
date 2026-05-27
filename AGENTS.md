# AGENTS.md — HamsterDisaster

## Project Overview

A 2D platformer game built with **Phaser 3** (Arcade Physics), served as a static HTML page with no build system. All source is plain ES6 JavaScript loaded via `<script>` tags in `index.html`. Art and audio are Kenney Assets.

## Running

Open `index.html` in a browser via a local server (e.g. VS Code Live Server, `npx serve`, `python -m http.server`). Phaser cannot load tilemaps from `file://` — a server is required. There is no build step, bundler, or package manager.

## Architecture & Scene Flow

```
Load (loadScene) → Platformer (platformerScene)
                         ├── death/fall → back to Load
                         ├── reach flag (overlap) → End (end)
                         └── reach x=2200 (position) → Ending (endCopy)
End (end) → reach flag → back to Load
Ending (endCopy) → press R → back to Load
```

- `Load` preloads assets for the main level, creates animations, then starts `platformerScene`.
- `LoadTwo.js` exists but is **not registered** in the scene list in `main.js` and is effectively dead code — it was likely intended for a second level.
- `Platformer` is the main gameplay scene.
- `End` is a second playable level using the `WinScreen` tilemap with a flag that restarts the game.
- `Ending` is a static win screen image with restart prompt.

## Key Files

| File | Purpose |
|------|---------|
| `src/main.js` | Game config, global `my` object, `SCALE`, `cursors` |
| `src/Scenes/Load.js` | Asset preload + animation definitions |
| `src/Scenes/Platformer.js` | Main gameplay: player, tilemap, coins, particles, physics |
| `src/Scenes/End.js` | Second level on WinScreen tilemap |
| `src/Scenes/Ending.js` | Static win screen |
| `src/Scenes/LoadTwo.js` | Dead code — duplicate of Load.js for a second level |
| `index.html` | Script loading order matters — scenes must load before `main.js` |

## Physics & Game Constants

Constants are set in `init()` of each playable scene:
- `ACCELERATION = 300`, `DRAG = 1000`, `JUMP_VELOCITY = -600`, `SCALE = 2.0`
- Gravity: `1500` (set in `init()`, overrides the `0` in config)
- Physics debug is **on** (`debug: true` in config) — toggle at runtime with `D` key

## Global State

The `my` object (`{sprite: {}, text: {}, vfx: {}}`) is declared globally in `main.js` and shared across all scenes. Player sprite is stored as `my.sprite.player`. Particle emitters are stored as `my.vfx.walking` and `my.vfx.jumping`. `cursors` is also a global.

## Tilemap Conventions

- Maps are built in **Tiled** and exported as `.tmj` (JSON) and `.tmx` (XML) — only the `.tmj` files are loaded.
- Tile size is **18×18** pixels.
- Collision is set by the `collides` boolean property on tiles in Tiled (`setCollisionByProperty({ collides: true })`).
- Collectible objects are placed in the **"Objects"** object layer and created with `createFromObjects`.
- Layers: Background, Ground, Danger, Goal, Objects.

## Asset Keys

| Key | Type | Source |
|-----|------|--------|
| `platformer_characters` | Atlas | `tilemap-characters-packed.png/.json` |
| `tilemap_tiles` | Image | `tilemap_packed.png` |
| `tilemap_sheet` | Spritesheet | Same image, 18×18 frames |
| `kenny-particles` | Multi-atlas | `kenny-particles.json` + 5 PNG pages |
| `HamsterDisaster` | Tilemap | `HamsterDisaster.tmj` |
| `WinScreen` | Tilemap | `WinScreen.tmj` |
| `bang` | Audio | `jingles_HIT14.ogg` |
| `winScreen` | Image | `winScreen.png` |

## Animation Keys

Defined in `Load.js`:
- `walk` — frames 9–10 of `platformer_characters` atlas, 15fps, looping
- `idle` — single frame `tile_0006.png`
- `jump` — single frame `tile_0007.png`

## Known Issues / Gotchas

- **LoadTwo.js is dead code** — not in the scene list. If a second level is needed, register it and ensure assets don't conflict.
- **Danger layer collides but has no death logic** — the player just stands on danger tiles instead of dying.
- **Two competing win conditions**: flag overlap → "end", reaching x≥2200 → "endCopy". The position-based check makes the flag overlap partially redundant.
- **Death by falling** uses a hardcoded y-position check (`y >= 420`) instead of world bounds or an overlap.
- **Score text doesn't follow the camera** — it's positioned at player coordinates and scrolls away. Needs `setScrollFactor(0, 0)`.
- **Walking particles always emit rightward** regardless of player direction (`setParticleSpeed` always positive).
- **Walk animation only plays when moving right** — the left-branch calls `resetFlip()` but never `anims.play('walk')`.
- **Duplicate code in update() else-branch** — acceleration, drag, and idle animation are set twice.
- **Debug mode is on by default** — `debug: true` in config.
