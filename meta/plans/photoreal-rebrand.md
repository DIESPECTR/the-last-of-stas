---
SECTION_ID: plans.photoreal-rebrand
TYPE: note
STATUS: active
---

# Full Photoreal Rebranding

Trigger: new `first_night_screen.png` concept (photoreal, rim-light, bloom, punch-vignette) looked
dramatically better than the charcoal-sketch art direction used everywhere else in the project. Decision:
go all-in on photoreal, not a hybrid — mixing charcoal sprites with a photoreal HUD/concept reads as a bug.

## Locked style reference
- `assets/style/first_night_screen.png` — palette, grade, rim-light/bloom/vignette contract
- Rendering already supports this grade: `src/lighting.js` `drawGrade` (overlay punch + vignette),
  `applyBloom()` in `src/game.js` (screen-space bloom), per-sprite rim-light in `drawAnimatedSprite`/
  `drawDirectionSprite`. Only the ART ASSETS are still charcoal — engine is ready.

## Scope (each item = regenerate master(s) → animate (wan) → sprite sheet → integrate → validate)
- [ ] Survivor: 4-direction unarmed master → idle/walk/attack × 4 dir (12 clips → 12 sheets)
- [ ] Drifter: 4-direction master → idle/walk/attack × 4 dir (12 clips → 12 sheets)
- [ ] Runner: 4-direction master → idle/walk/attack × 4 dir (12 clips → 12 sheets)
- [ ] Spitter: 4-direction master → idle/walk/attack × 4 dir (12 clips → 12 sheets)
- [ ] Weapons (3 types): world_sprite regen in photoreal
- [ ] Destructible props ×5 kinds × intact/damaged/ruined (15 assets) — regen photoreal (already
      photoreal from earlier pass, but palette/grade must match new reference — review, regen if needed)
- [ ] Environment textures (ground, streets, lamps, shelter walls/roof/windows) — review against new
      grade, regen where charcoal style clashes
- [ ] HUD: confirm live HUD (HOUSE hp bar, HEAT gauge, wave-pips, salvage counters) matches concept
      layout/readability — this is CODE work (src/game.js drawHUD), not asset regen; verify only

## Order of execution
1. Survivor (this session) — proves the pipeline end to end in the new style before committing to the
   other 3 characters + 15 props.
2. Drifter, Runner, Spitter (parallel once survivor pipeline confirmed)
3. Props (batch regen, 15 assets)
4. Environment textures
5. Weapons
6. Full-game visual regression: live siege screenshot vs concept, HUD readability check

## Notes
- Same animation runtime contract applies (see pin `anim-runtime-contract`): 512×512 masters →
  wan video per action/direction → `webp_to_sprite_grid` → 128×128 tile, 4×4 grid, 16 frames,
  bottom anchor y=120, idle/walk/attack FPS 8/13/22.
- Every regenerated master must be checked against `first_night_screen.png` for palette/lighting
  consistency before animating — animating a wrong-style master wastes the wan generation.
