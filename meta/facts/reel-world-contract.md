---
SECTION_ID: facts.reel-world-contract
TYPE: fact
STATUS: active
---

# Reel / tall-world contract

- World is **960×960**. Do not shrink it back to 600 to "fix" desktop.
- Desktop camera: middle `960×600` at `y = (960-600)/2 = 180`.
- Reel camera: `540×960` full height, follows player X, clamped to the world.
- Toggle: `?reel=1` or `#reel`. Rollback = off. URL is the source of truth.
- House centre `(480,480)`, player start `(480,590)` — both crops frame the shelter.
- Spawn rotates `N→S→W→E` via `state.spawnSide`. Do not go back to `Math.random()*4` or four bodies stack on one edge.
- `beginReelFrame(ctx, dpr, world, focus, shake)` — `shake` must be a pair or the guard `[0,0]`.
- Facade slots: `house_left/right` (desktop crop) + `house_top/bottom` (reel letterbox).
- `gamedev_create_game_screen` is a mockup skill. Reel is live CSS/JS.
