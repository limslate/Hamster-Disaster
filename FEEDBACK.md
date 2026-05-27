# FEEDBACK.md — HamsterDisaster Code Review

This review covers the five areas requested, with specific code references and refactoring suggestions.

---

## 1. Effective Use of Phaser & Arcade Physics

### What's working

- **Tilemap integration is solid**: `addTilesetImage`, `createLayer`, and `setCollisionByProperty({ collides: true })` are the correct approach for Tiled-based levels. The object layer pattern with `createFromObjects` for coins and the flag is the right way to place interactive items.
- **Camera setup is good**: `startFollow` with lerp values and a deadzone creates smooth, natural camera tracking. `setZoom(this.SCALE)` is correctly applied after bounds.
- **Particle emitters** are created with reasonable configs and toggled with `start()`/`stop()` in `update()`, which is the correct Phaser 3 pattern.

### Issues to address

**A. Danger layer has collision but no death logic** (`Platformer.js:27-30`)

```js
this.dangerLayer = this.map.createLayer("Danger", this.tileset, 0, 0);
this.dangerLayer.setCollisionByProperty({ collides: true });
```

The player *collides* with danger tiles (stands on them like ground) instead of *dying* on contact. You set up a collider, which makes danger act as solid ground. You likely want an overlap instead, or a collider that triggers a death:

```js
this.physics.add.overlap(my.sprite.player, this.dangerLayer, () => {
    this.scene.start("loadScene");
});
```

If danger tiles should still be solid (like spikes on a wall), keep the collider but add a separate overlap check, or use the collider callback to detect the contact and trigger death.

**B. Gravity is set in two conflicting places** (`main.js:15-17` vs `Platformer.js:10`)

In the config, gravity is `{ x: 0, y: 0 }`, but `init()` immediately overrides it to `1500`. This is confusing — the config value is never used. Either set gravity in the config directly, or remove it from the config and rely solely on `init()`. Setting it in `init()` is actually the better practice (each scene can have different gravity), so remove it from the config:

```js
physics: {
    default: 'arcade',
    arcade: {
        debug: false
    }
}
```

**C. Debug mode is on by default** (`main.js:14`)

`debug: true` draws collision shapes over your entire game. This should be `false` in production. You already have a runtime toggle on the `D` key — that's great. Just flip the default.

**D. Coin particle emitter uses `setConfig` to reposition** (`Platformer.js:73-84`)

Every time a coin is collected, you call `setConfig` with the full emitter configuration just to move the emitter's position. This is inefficient and fragile — if you change the initial config, you have to update it in two places. Use `emitAt` instead:

```js
this.coinParticle.emitAt(obj2.x, obj2.y);
```

This fires a burst at the given position without reconfiguring the entire emitter.

**E. Score text doesn't follow the camera** (`Platformer.js:129`)

```js
this.scoreText = this.add.text(my.sprite.player.x + 565, my.sprite.player.y - 325, ...);
```

This positions the text at the player's initial coordinates with a hardcoded offset, but as the camera scrolls, the text stays behind in world space. The standard Phaser solution is to pin HUD elements to the camera:

```js
this.scoreText = this.add.text(20, 20, 'Score: 0', { ... }).setScrollFactor(0);
```

`setScrollFactor(0)` makes the text ignore camera scrolling — it stays fixed on screen.

**F. Death and win conditions are position-based** (`Platformer.js:143-149`)

```js
if (my.sprite.player.y >= 420) {
    this.scene.start("loadScene");
}
if (my.sprite.player.x >= 2200) {
    this.scene.start("endCopy");
}
```

Hardcoding pixel positions for game logic is brittle — if you resize the map, move the flag, or change the camera, these break. You already have overlap checks for the flag, which is the right approach. The position-based checks should be removed or replaced with a "fall zone" object layer in Tiled.

**G. Two competing win transitions exist**

The flag overlap transitions to `"end"` (line 91), and the position check transitions to `"endCopy"` (line 147). These create two different win paths that lead to different scenes, which is almost certainly unintentional. Decide on one win condition and remove the other.

---

## 2. Effective Use of JavaScript

### What's working

- Arrow functions in overlap callbacks are appropriate and keep `this` bound correctly.
- `forEach` in `End.js:49` for building the flag group is clean.
- `const` is used for `SCALE` in `main.js`.

### Issues to address

**A. Inconsistent variable declarations** — `var`, `let`, and `const` are mixed without clear intent:

```js
var cursors;               // global var
const SCALE = 2.0;         // global const
var my = {sprite: {}, text: {}, vfx: {}};  // global var
```

Prefer `const` for values that never change and `let` for those that do. Avoid `var` entirely in modern JavaScript — it has function scoping and hoisting behavior that can cause subtle bugs. This should be:

```js
let cursors;
const SCALE = 2.0;
const my = { sprite: {}, text: {}, vfx: {} };
```

**B. Duplicate code in the `update()` else-branch** (`Platformer.js:178-188`)

The idle branch sets acceleration, drag, and animation *twice*:

```js
} else {
    my.sprite.player.setAccelerationX(0);
    my.sprite.player.setDragX(this.DRAG);
    my.sprite.player.anims.play('idle');

    my.sprite.player.setAccelerationX(0);       // duplicate
    my.sprite.player.setDragX(this.DRAG);       // duplicate
    my.sprite.player.anims.play('idle');         // duplicate
    my.vfx.walking.stop();
}
```

Remove the duplicate three lines.

**C. Walk animation only plays when moving right** (`Platformer.js:151-175`)

The right-branch calls `my.sprite.player.anims.play('walk', true)` (line 167), but the left-branch never plays the walk animation — it only resets the flip. Add `my.sprite.player.anims.play('walk', true)` to the left-branch as well.

**D. Flip logic appears reversed** (`Platformer.js:152-153` vs `165-166`)

```js
// Moving left:
my.sprite.player.resetFlip();

// Moving right:
my.sprite.player.setFlip(true, false);
```

`setFlip(true, false)` flips the sprite horizontally. If your default sprite faces right, moving right should use `resetFlip()` and moving left should use `setFlip(true, false)`. Currently it's inverted. Test which direction your character faces by default and adjust accordingly.

---

## 3. Functions & Classes — Modularization

### What's working

- Each scene is a separate class extending `Phaser.Scene` — this is the standard pattern.
- The scene key system (constructor → `super("sceneKey")`) is used correctly throughout.
- Physics constants are scoped to each scene's `init()` rather than global — good.

### Issues to address

**A. LoadTwo.js is a near-complete duplicate of Load.js**

`LoadTwo.js` copies `Load.js` almost verbatim — same asset loading, same animation definitions, just a different scene key and different target scene. This violates DRY and will cause maintenance headaches. If you need a second load scene, the animations should be defined once and shared. A better approach is a single Load scene that accepts parameters:

```js
class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    init(data) {
        this.nextScene = data.nextScene || "platformerScene";
        this.tilemapKey = data.tilemapKey || "HamsterDisaster";
    }

    create() {
        // ... animation definitions ...
        this.scene.start(this.nextScene);
    }
}
```

Then start it with `this.scene.start("loadScene", { nextScene: "end", tilemapKey: "WinScreen" })`.

Even better: since Phaser caches loaded assets globally, you only need to load assets *once*. Animations are also global. A single Load scene that preloads everything is simpler and avoids re-loading.

**B. Player movement logic is duplicated between Platformer and End**

Both scenes contain nearly identical `update()` logic for handling left/right/jump input, acceleration, drag, animation, and flip. Extract this into a reusable method or a shared base class:

```js
class PlatformerBase extends Phaser.Scene {
    init() {
        this.ACCELERATION = 300;
        this.DRAG = 1000;
        this.JUMP_VELOCITY = -600;
        this.SCALE = 2.0;
    }

    handlePlayerInput() {
        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            if (my.sprite.player.body.blocked.down) {
                my.sprite.player.anims.play('walk', true);
            }
        } else if (cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.resetFlip();
            if (my.sprite.player.body.blocked.down) {
                my.sprite.player.anims.play('walk', true);
            }
        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
        }

        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }

        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }
    }
}

class Platformer extends PlatformerBase { /* ... */ }
class End extends PlatformerBase { /* ... */ }
```

**C. Physics constants are duplicated across scenes**

`ACCELERATION`, `DRAG`, `JUMP_VELOCITY`, and `SCALE` are redefined identically in both `Platformer.init()` and `End.init()`. The base class approach above solves this. Alternatively, define them in a shared config object:

```js
const PHYSICS_CONFIG = {
    ACCELERATION: 300,
    DRAG: 1000,
    JUMP_VELOCITY: -600,
    GRAVITY: 1500,
    SCALE: 2.0
};
```

**D. Consider a Player class**

All player logic — movement, animation state, flip handling — lives inline in the scene. For a game of any complexity, a custom `Player` class that wraps the sprite and encapsulates its behavior is cleaner:

```js
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, "platformer_characters", "tile_0002.png");
        this.sprite.setCollideWorldBounds(true);
    }

    update(cursors) { /* movement, animation, particles */ }

    die() { /* death logic, effects */ }
}
```

This lets each scene just call `this.player.update(cursors)` instead of duplicating 40 lines of input handling.

---

## 4. Variables & Data Structures

### What's working

- The `my` namespace object (`{sprite: {}, text: {}, vfx: {}}`) groups related references — the intent to organize is good.
- Tilemap layers and groups are stored as scene instance properties — correct for Phaser.
- Physics groups for coins and the end goal are appropriate data structures for overlap detection.

### Issues to address

**A. The `my` object is global and shared across scenes**

`my.sprite.player` is overwritten each time a scene creates a player (in both `Platformer` and `End`). This means if you ever have multiple scenes running simultaneously (Phaser supports this), they'd clobber each other's references. Scene state should live on the scene instance (`this.player`, `this.vfx`, etc.). The `my` object pattern comes from the starter template — it works for a single-scene demo, but doesn't scale.

**B. No player state object**

The game tracks `score` as a bare integer on the scene, but there's no structured representation of player state. As you add features (health, lives, power-ups), a state object becomes essential:

```js
this.playerState = {
    score: 0,
    lives: 3,
    isDead: false,
    isInvincible: false
};
```

**C. `cursors` is a global variable**

Keyboard cursors are created per-scene but stored in a global. If two scenes are active, only the last one's cursors would be accessible. Store them as `this.cursors` on the scene.

**D. Coin particle emitter mixes responsibilities**

`this.coinParticle` is created in `create()` with a full config, then in the overlap callback, `setConfig` replaces the entire config just to change position. The emitter's "identity" (frame, speed, blend mode) and its "instance" (where to emit) are conflated. Separate these: configure the emitter once, and use positional methods (`emitAt`) for per-coin placement.

---

## 5. Visual Effects, Particles & Sound

### What's working

- **Walking particles** with dirt frames and alpha fadeout are a nice touch — they make movement feel grounded.
- **Coin collection particles** with additive blending (`'ADD'`) and star frames create a satisfying pickup effect.
- **Jump particles** communicate vertical movement.
- The **bang sound** on coin collection provides audio feedback.
- Particle `startFollow` tracking the player sprite is correct.

### Issues to address

**A. Walking particles always emit to the right** (`Platformer.js:158, 171`)

```js
my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
```

This is called identically for both left and right movement. `PARTICLE_VELOCITY` is `50`, so particles always fly to the right. When walking left, they should emit to the left:

```js
// When moving left:
my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);

// When moving right:
my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
```

**B. Walking particle gravity is inverted** (`Platformer.js:108`)

```js
gravityY: -400,
```

Negative gravity makes particles float *upward*, which doesn't read as kicked-up dust. For dust kicked off the ground, use positive gravity (or zero) so particles settle downward:

```js
gravityY: 200,
```

**C. Only one sound effect for the entire game**

A single `bang` sound plays on coin collection. A platformer should have distinct audio cues for at least:
- Jump (whoosh)
- Death/fall (thud or scream)
- Landing (soft impact)
- Background music or ambience

Even 3–4 additional Kenney sound effects would dramatically improve feedback. Phaser's audio system supports multiple simultaneous sounds via `this.sound.add()`.

**D. No death visual or audio feedback**

When the player falls (`y >= 420`) or touches danger, the scene just immediately restarts. There's no visual indication of what happened — no camera shake, no flash, no death animation, no sound. Even a brief screen flash and a 0.5-second delay before restart would communicate the failure:

```js
this.cameras.main.flash(500, 255, 0, 0);
this.time.delayedCall(500, () => this.scene.start("loadScene"));
```

**E. No visual feedback on danger tiles**

Danger tiles are visually identical to ground tiles to the player. In a polished platformer, dangerous areas communicate their threat through visual cues — red tinting, animated spikes, a glow effect, or pulsing. Even a simple tint on the danger layer would help:

```js
this.dangerLayer.forEachTile(tile => {
    if (tile.properties.collides) {
        tile.tint = 0xff4444;
    }
});
```

**F. Jump particles don't communicate "jumping" effectively**

The jump emitter uses `circle_01`/`circle_02` frames, which are generic. Consider using `smoke` or `dust` frames to suggest a launch impact from the ground, and position them at the player's feet. Currently the jump particles follow the player through the air, which looks odd — they should be a one-time burst at the launch point.

**G. No camera effects**

Camera shake on death, a subtle zoom pulse on coin collection, and a slow zoom-in on the win screen are standard platformer juice that make the game feel responsive. Phaser supports this easily:

```js
this.cameras.main.shake(250, 0.01);  // on death
this.cameras.main.flash(200, 255, 255, 255, true);  // on coin
```

---

## Summary of Priority Improvements

| Priority | Area | Improvement |
|----------|------|-------------|
| High | Physics | Add death logic to danger layer (overlap, not collider) |
| High | Physics | Fix score text with `setScrollFactor(0)` |
| High | Physics | Remove position-based win/death, use tilemap objects |
| High | VFX | Fix walking particle direction (negate for left) |
| High | JavaScript | Remove duplicate code in `update()` else-branch |
| High | JavaScript | Fix walk animation not playing when moving left |
| High | Modularization | Extract shared player logic into base class or Player class |
| Medium | Modularization | Remove or properly integrate LoadTwo.js |
| Medium | Physics | Turn off debug mode by default |
| Medium | VFX | Add death/impact feedback (camera shake, flash, sound) |
| Medium | VFX | Add more sound effects (jump, death, landing) |
| Medium | Data | Move `cursors` and `my` off global scope |
| Low | VFX | Fix walking particle gravity direction |
| Low | VFX | Make jump particles a one-time ground burst |
| Low | VFX | Add visual danger indicators on tiles |
