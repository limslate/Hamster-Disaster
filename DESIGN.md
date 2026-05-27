# DESIGN.md — Hamster Disaster

## Game Summary

**Hamster Disaster** is a 2D side-scrolling platformer. The player controls a small character (hamster) who must traverse a horizontally scrolling level, collecting mushrooms and reaching a flag goal while avoiding hazards and falling off platforms. The game features one main level, a second smaller level (win screen with retry), and a static victory screen.

## Core Mechanics

### Player Avatar

The player is a single animated sprite using the `platformer_characters` atlas (frame `tile_0002.png` as the base). Three animation states exist:

| State | Animation Key | Frames | Frame Rate | Loop |
|-------|--------------|--------|------------|------|
| Idle | `idle` | `tile_0006.png` (single frame) | — | Yes |
| Walk | `walk` | `tile_0009.png` → `tile_0010.png` | 15 fps | Yes |
| Jump | `jump` | `tile_0007.png` (single frame) | — | No |

The sprite is horizontally flipped when moving right (`setFlip(true, false)`) and unflipped when moving left (`resetFlip()`). The default sprite faces left.

### Player Movement Physics

| Parameter | Value | Description |
|-----------|-------|-------------|
| Horizontal acceleration | 300 px/s² | Applied while left/right held |
| Horizontal drag | 1000 px/s² | Applied when no direction held (deceleration) |
| Jump velocity | -600 px/s | Instantaneous upward impulse (negative = up) |
| Gravity | 1500 px/s² | Downward acceleration |
| World bounds collision | Enabled | Player cannot leave the map rectangle |

- Movement uses **acceleration** (not direct velocity), giving a responsive but slightly weighty feel.
- **Drag** decelerates the player quickly when no key is held, preventing sliding.
- Jump is only allowed when the player's body is `blocked.down` (standing on a surface), checked via `JustDown` to prevent holding the key for repeated jumps.
- The player cannot move vertically through solid tiles.

### Controls

| Input | Action |
|-------|--------|
| Left arrow | Move left |
| Right arrow | Move right |
| Up arrow | Jump (only when grounded) |
| R | Restart current scene |
| D | Toggle physics debug display |

## Game World

### Tile System

- **Tile size**: 18×18 pixels
- **Tileset image**: `tilemap_packed.png` (360×162 px, 20 columns, 9 rows, 180 tiles total)
- **Collision** is determined per-tile by a boolean `collides` property defined in the Tiled tileset. Only tiles with `collides: true` produce solid collision.
- The world is rendered at **2× scale** (camera zoom = 2.0), making effective tile size appear as 36×36 on screen.
- Rendering uses **pixel art** mode (crisp nearest-neighbor scaling, no anti-aliasing).

### Level 1: HamsterDisaster

- **Map file**: `HamsterDisaster.tmj` (JSON format, created in Tiled 1.12.1)
- **Map size**: 125 tiles wide × 25 tiles tall (2250×450 world pixels)
- **Tileset reference name**: `tilemap_packed`
- **Render order**: right-down, orthogonal projection

#### Tile Layers

| Layer Name | Z-Order | Purpose | Collision |
|------------|---------|---------|-----------|
| Background | Bottom | Sky/cloud decoration tiles (tile ID 74, 39) | No |
| Ground | Middle | Solid platforms the player walks on | Yes — tiles with `collides: true` |
| Danger | Middle | Hazard tiles (spikes/lava, IDs 125–126, 18–20, 69) | Yes — tiles with `collides: true` (NOTE: currently collides like ground; intended to kill on contact) |
| Collect | Middle | Hidden layer (not rendered) | No |
| Goal | Top | Goal indicator tiles (IDs 112, 132) | No |

#### Object Layers

| Layer Name | Object Name | Sprite | Purpose |
|------------|-------------|--------|---------|
| Objects | `Mushroom` | `tilemap_sheet` frame 128 (tile ID 129 in Tiled) | Collectible item — 31 instances placed across the level |
| Flag | `flag` | `tilemap_sheet` frame 111 (tile ID 112 in Tiled) and frame 131 (tile ID 132) | Level exit — 2 flag objects at x≈2214, y≈89–108 |

#### Collectibles (Mushrooms)

- 31 mushroom objects are placed throughout the level at varied positions.
- Each uses spritesheet frame index 128 from `tilemap_sheet`.
- Mushrooms have **static physics bodies** (immovable, no gravity).
- On overlap with the player, the mushroom is destroyed, the score increments by 1, a sound plays, and a star particle burst appears at the mushroom's position.

#### Goal (Flag)

- Two flag objects mark the end of the level near x=2214.
- On overlap with the player, the game transitions to the End scene.
- Additionally, reaching world x-coordinate ≥ 2200 also triggers a win transition (to a different scene).

#### Death / Failure

- If the player falls below y=420 (world coordinates), the game restarts from the Load scene (effectively restarting the level).
- Danger tiles currently act as solid platforms rather than killing the player — this appears to be an incomplete hazard system.

### Level 2: WinScreen (End Scene)

- **Map file**: `WinScreen.tmj`
- **Map size**: 25 tiles wide × 25 tiles tall (450×450 world pixels)
- **Tileset reference name**: `EndSet` (same `tilemap_packed.png` image, different collision configuration)
- A simpler level with background and ground layers only.
- One flag object in the "Retry" object layer at approximately (397, 361). Reaching it restarts the game from the beginning.
- Features a text/letter pattern made from tile ID 10 in the background layer.

### Victory Screen

- A non-interactive scene displaying `winScreen.png` scaled to 1.6× and tiled twice side-by-side.
- Text "Press R to Restart" displayed at (520, 650).
- Pressing R restarts from the Load scene.

## Scoring System

- Score starts at 0.
- Each mushroom collected increments score by 1.
- Score is displayed as a text object ("Score: N") in the top area of the screen.
- Score does not persist across scene transitions (resets on restart).

## Camera

- **Mode**: Follow player with smooth lerp (0.25 on both axes).
- **Deadzone**: 50×50 pixels — camera only moves when the player exits this central rectangle.
- **Bounds**: Clamped to the full tilemap dimensions.
- **Zoom**: 2.0 (everything appears doubled).

## Visual Effects (Particle Systems)

All particles use the `kenny-particles` multi-atlas. Particles are initially stopped and toggled on/off in the update loop.

### Walking Particles

| Property | Value |
|----------|-------|
| Frames | `dirt_01.png`, `dirt_02.png` |
| Scale | 0.03 → 0.1 (grow over lifetime) |
| Lifespan | 350 ms |
| Gravity Y | -400 (float upward) |
| Alpha | 1.0 → 0.1 (fade out) |
| Max alive | 10 |
| Trigger | Player moving horizontally while grounded |
| Follow | Player sprite, offset to foot position |

### Jumping Particles

| Property | Value |
|----------|-------|
| Frames | `circle_01.png`, `circle_02.png` |
| Scale | 0.03 → 0.1 |
| Lifespan | 300 ms |
| Alpha | 1.0 → 0.1 |
| Trigger | Player airborne (not `blocked.down`) |
| Follow | Player sprite, offset to foot position |

### Coin Collection Particles

| Property | Value |
|----------|-------|
| Frame | `star_01.png` |
| Speed | 100–300 px/s (random range) |
| Lifespan | 800 ms |
| Scale | 0.2 → 0 (shrink to nothing) |
| Blend mode | Additive (ADD) |
| Quantity | 4 per burst |
| Trigger | On mushroom overlap — one-time burst at mushroom position |

## Audio

| Asset Key | File | Usage |
|-----------|------|-------|
| `bang` | `jingles_HIT14.ogg` | Plays on each mushroom collection |

This is the only sound effect in the game. No jump, death, landing, background music, or UI sounds are present.

## Scene Flow

```
[Game Start]
    │
    ▼
Load ("loadScene")
    │  Preloads all assets (shared across all scenes)
    │  Defines walk/idle/jump animations (globally cached)
    │
    ▼
Platformer ("platformerScene")
    │  Main gameplay level (HamsterDisaster map)
    │
    ├─ Player falls (y ≥ 420) ──→ Load (restart)
    ├─ Player reaches flag (overlap) ──→ End
    └─ Player reaches x ≥ 2200 ──→ Ending
         │
         ▼
    End ("end")
    │  Second playable level (WinScreen map)
    │  Has a retry flag that goes back to Load
    │
    └─ Player reaches flag ──→ Load (restart)

    Ending ("endCopy")
    │  Static win screen image
    │
    └─ Press R ──→ Load (restart)
```

## Art Assets

### Tileset

| File | Description |
|------|-------------|
| `tilemap_packed.png` | 360×162 px sprite sheet, 20 columns × 9 rows of 18×18 tiles. Contains terrain, decorations, hazards, and objects. |
| `tilemap_packed.tsj` | Tiled tileset definition with per-tile `collides` property. |

### Characters

| File | Description |
|------|-------------|
| `tilemap-characters-packed.png` | 122×119 px atlas of character sprites (trimmed). |
| `tilemap-characters-packed.json` | Atlas data mapping frame names (tile_0000 through tile_0025) to sub-regions. |

### Particles

| File | Description |
|------|-------------|
| `kenny-particles.json` | Multi-atlas manifest referencing 5 texture pages. |
| `kenny-particles-0.png` through `kenny-particles-4.png` | 2048×2048 texture pages containing circle, dirt, fire, flame, flare, light, magic, muzzle, scorch, scratch, slash, smoke, spark, star, symbol, trace, twirl, and window particle sprites. |

### Level Data

| File | Format | Purpose |
|------|--------|---------|
| `HamsterDisaster.tmj` | Tiled JSON | Main level tilemap and object placement |
| `HamsterDisaster.tmx` | Tiled XML | Same level in XML format (not loaded by the game) |
| `WinScreen.tmj` | Tiled JSON | End/retry level tilemap |
| `WinScreen.tmx` | Tiled XML | Same in XML (not loaded) |
| `EndSet.tsj` | Tiled tileset | Tileset definition for WinScreen map |

### Other

| File | Description |
|------|-------------|
| `winScreen.png` | Full-screen win background image displayed in the Ending scene |
| `jingles_HIT14.ogg` | Impact/jingle sound effect for coin collection |

## Game State

- **No persistent state**: Score, position, and collection progress are lost on scene transition or restart.
- **No lives system**: Falling or failing immediately restarts the level.
- **No save system**: All progress is session-only.
- **No pause system**: The game runs continuously while the scene is active.

## Collision Behavior Summary

| Object Type | Collision With Player | Effect |
|-------------|---------------------|--------|
| Ground layer tiles (`collides: true`) | Solid (collider) | Player stands on them, cannot pass through |
| Danger layer tiles (`collides: true`) | Solid (collider) | Player stands on them — currently no death effect |
| Mushroom objects | Overlap (sensor) | Mushroom destroyed, score +1, sound + particles |
| Flag objects | Overlap (sensor) | Scene transition to next scene |
| World bounds | Solid | Player cannot leave map edges |
| Fall zone (y ≥ 420) | Position check | Immediate scene restart |
| Right edge (x ≥ 2200) | Position check | Scene transition to win screen |

## Important Notes for Re-Implementation

- The **tileset image** is shared between both levels, but each level's `.tmj` file references it by a different tileset name (`tilemap_packed` vs `EndSet`). Both reference the same `tilemap_packed.png` image.
- The tileset `.tsj` files contain per-tile collision properties. These must be respected when building the physics world.
- Object layers in Tiled use **glob IDs (gid)** for tile references, which are 1-indexed (gid = tileset firstgid + local tile ID). For example, a mushroom object with `gid: 129` corresponds to local tile ID 128 (firstgid is 1).
- The `createFromObjects` method maps object names to sprites — all objects named "Mushroom" become coin sprites, and objects named "flag" become goal markers.
- Animations are defined once (in the Load scene) and cached globally by Phaser's animation manager, so they persist across scenes without redefinition.
- The world pixel dimensions for each level are: `map.widthInPixels = width_tiles × tilewidth` and `map.heightInPixels = height_tiles × tileheight`.
