---
SECTION_ID: docs.development-action-log
TYPE: note
STATUS: active
---

# Development Action Log

Purpose: chronological source material for a future development scenario/video script. Record implementation actions, decisions, failures, workarounds, and validation evidence.

## 2026-08-10 — Vertical Slice Development

### 1. Defined the playable scope
- Reduced the concept to one browser-playable vertical slice: one survivor, one fragile house, one night, and three zombie types.
- Chose a browser-first, zero-build Canvas/JavaScript scaffold to reach playable state quickly and expose project data directly to IDE tooling.
- Kept all player-facing copy, data labels, prompts, and UI in English.

### 2. Established the visual direction
- Shifted the prototype toward a charcoal, pencil, dirty-paper survival-drama aesthetic inspired by the visual grammar of *This War of Mine*, without copying its assets or layouts.
- Replaced arcade/dashboard styling with field-journal panels, muted graphite colors, restrained rust-red danger accents, infected yellow-green accents, and dim shelter light.
- Redrew the central arena as a vulnerable cutaway shelter with rooms, barricades, rubble, damage cracks, and a visible shelter-health line.

### 3. Built the browser-first game scaffold
- Created `index.html`, `src/game.js`, and the supporting styles as a Canvas-based playable shell.
- Implemented WASD movement, mouse aiming, held-fire input, a preparation phase, siege timing, wave spawning, projectiles, noise events, zombie aggro, house damage, kills, salvage drops, and win/loss states.
- Added the First Night scenario with a 30-second preparation phase and short escalating wave bursts.
- Added three zombie types: Drifter, Runner, and Spitter.

### 4. Added the procedural weapon data model
- Created JSON-driven weapon and component data.
- Added 12 initial components across frame, action, payload, and mandatory flaw slots.
- Added three starter weapons: Bone Sprayer, The Corpse Burner, and Crying Hedgehog.
- Implemented runtime stat assembly from base weapon data plus component modifiers.
- Implemented crafting cost calculation from component costs, salvage spending, unlocking, equipping, heat, failure probability, and failure behavior.

### 5. Implemented Weapon Lab and Test Chamber
- Added an in-game Weapon Lab with weapon selection, role, damage, noise, heat limit, failure mode, resource cost, and `CRAFT / EQUIP`.
- Added a Test Chamber panel with `TEST UNTIL FAILURE` reporting damage per second, noise radius, safe burst, expected failure time, failure type, and a verdict.
- Added an equipped-weapon inventory slot and live preview canvas.
- Added an IDE Weapon Lab view that reads the same weapon/component JSON and supports live data refresh and asset actions.

### 6. Added procedural placeholder weapon visuals
- Implemented deterministic Canvas silhouettes for all three weapons so the game remains playable when texture files are missing.
- Added explicit missing-asset feedback in previews and inventory.
- Wired equipped weapon selection to the survivor render so weapon identity changes with the crafted/equipped result.

### 7. Generated weapon texture assets
- Designed prompts for three isolated side-view weapon sprites matching the charcoal survival aesthetic.
- Tried a Qwen two-stage white-background render plus rembg workflow; generation jobs timed out without output files.
- Switched to the inspected Z-Image Turbo template with integrated rembg as a fallback.
- Generated transparent RGBA textures for Bone Sprayer and The Corpse Burner.
- The first Crying Hedgehog generation incorrectly produced a literal hedgehog character holding a gun.
- Rewrote the prompt to require one inanimate mechanical weapon prop and explicitly forbid animals, mascots, faces, bodies, or characters.
- Regenerated Crying Hedgehog successfully as a spiked leaf-blower/loudspeaker weapon.

### 8. Fixed the texture asset pipeline
- Verified all three generated files are 1024×1024 RGBA PNGs with alpha channels.
- Added runtime alpha-bound scanning to crop transparent margins before Canvas rendering.
- Changed weapon rendering to preserve source aspect ratio instead of stretching every image into a fixed rectangle.
- Kept deterministic procedural shapes as automatic fallbacks if a texture fails to load or contains no opaque pixels.

### 9. Fixed gameplay and reload issues
- Repaired malformed JSON and JavaScript syntax found during browser validation.
- Fixed the terminal-state bug where the normal HUD overwrote the house-destroyed message after `finish(false)`.
- Used hard reloads and cache-busting fetches in the IDE view to avoid stale JSON/assets during live iteration.
- Reopened the browser in clean sessions when an old tab retained cached code.

### 10. Validated the current slice
- Confirmed clean browser initialization with no matching console errors.
- Confirmed all three weapons appear in the Test Chamber using generated textures.
- Confirmed weapon selection, crafting, and equipped inventory state update correctly.
- Confirmed procedural fallback behavior remains available for missing assets.

### 11. Closed the asset-safe prep-to-siege slice
- Added separate texture sizing for the large Test Chamber preview, compact equipped inventory slot, and survivor-held weapon.
- Extended the IDE Weapon Lab with cache-busted previews for all three weapon PNGs, live file watchers, direct texture navigation, and an explicit procedural-fallback state.
- Made the start button update immediately to `PREPARING…`, then naturally to `NIGHT IN PROGRESS` when the 30-second timer expires.
- Verified that crafting The Corpse Burner updates the equipped slot and that starting preparation no longer resets the chosen weapon.
- Ran `TEST UNTIL FAILURE` for The Corpse Burner and confirmed the report includes DPS, noise radius, safe burst, expected failure time, failure type, and verdict.
- Hard-reloaded the game and IDE view; both initialized without matching console errors.
- Confirmed the IDE view loaded three 1024×1024 weapon PNGs as `TEXTURE READY` and displayed all 12 components.
- Forced one preview URL to a missing file in browser memory and confirmed it switched to `PLACEHOLDER` with `Procedural game fallback active`; no project asset was changed.
- Allowed the real preparation timer to enter siege, observed the first wave spawn and damage the house, and confirmed the equipped Corpse Burner remained selected.
- Completed the attempt through the real house-loss state. The final message remained visible, the start button changed to `BEGIN AGAIN`, and the normal HUD did not overwrite the outcome.
- Verified no `TEMP DEBUG:` markers remain in JavaScript or HTML production paths.

### 12. Added salvage-funded house preparation
- Added `REINFORCE BARRICADES`, available before the siege for 2 metal scrap and 1 cloth; it raises current and maximum shelter health by 100 and draws heavier boards across the windows.
- Added `PLACE GUTTER TRAP`, available before the siege for 2 rotten tissue and 1 teeth; it places a visible three-charge trap beside the shelter.
- Wired the trap into zombie movement: entering its radius deals 36 damage, consumes one charge, and emits a noise event.
- Disabled each action after purchase and disabled all preparation actions once siege or a terminal state begins.
- Added reset-safe defense state so `BEGIN AGAIN` restores the original shelter health, removes the trap, and restores starting salvage.

### 13. Smoke-tested preparation, siege, salvage, and reset
- Hard-loaded the game with no matching console errors.
- Bought barricades and confirmed metal scrap changed from 4 to 2, cloth from 1 to 0, and the button locked.
- Bought the gutter trap and confirmed rotten tissue changed from 2 to 0, teeth from 2 to 1, and the button locked.
- Started the real preparation countdown with both defenses active and completed the attempt through the real house-loss terminal state.
- Confirmed kill-driven salvage during that siege: bone increased from 4 to 7 and rotten tissue from 0 to 3.
- Clicked `BEGIN AGAIN` and confirmed starting salvage returned, defense buttons became available, and the previous attempt's defenses did not leak into the new session.
- Confirmed no `TEMP DEBUG:` markers remain.

### 14. Fixed trap placement and charge-state feedback
- Ran a dedicated trap-only attempt and found the original left-side point trap never intersected a zombie route; all three charges remained after the house was destroyed.
- Moved the visible trap onto the shelter perimeter and changed activation from a small point collision to the first entry into the shelter's defensive perimeter, keeping the placement readable while covering every attack route.
- Added live button feedback for `3 CHARGES` through `SPENT` and persisted a separate `placed` flag so an exhausted trap cannot be purchased again during the same attempt.
- Repeated the real prep-to-siege smoke-test. The first wave consumed all three charges, produced `Kills 3`, increased bone from 4 to 7 and rotten tissue from 0 to 3, and left the button disabled as `GUTTER TRAP · SPENT`.
- Completed the attempt through house loss and confirmed the spent state remained visible at the terminal screen.
- Clicked `BEGIN AGAIN` and confirmed the trap returned to `PLACE GUTTER TRAP`, became available, and starting salvage was restored.
- Hard-loaded the updated source with no matching console errors and confirmed no `TEMP DEBUG:` markers remain.

### 15. Started the full graphics and combat-readability pass
- Reviewed the live gameplay screenshot and identified the main readability failures: zombies rendered as near-identical ellipses, the survivor and held weapon visually overlapping, low separation between characters and ground, schematic shelter geometry, and weak hit/fire feedback.
- Compared the existing survivor and weapon assets against the locked First Night screen reference. The weapon PNGs were detailed enough to keep, but the survivor sheet already contained a baked-in weapon, causing a second dynamically equipped weapon to overlap it in Canvas.
- Chose to regenerate the survivor as an unarmed, consistently anchored four-direction sheet so weapon identity remains a clean runtime layer.
- Defined three separate four-direction zombie sheets instead of recoloring one body: a tall dragging Drifter, a compact forward-leaning Runner, and a broad swollen Spitter.
- Locked the graphics palette to the reference screen's graphite blacks and warm dirty-paper browns, reserving rust red and sickly yellow-green for danger and infection.
- Added a dedicated graphics-pass checklist to the implementation plan before modifying runtime rendering.

### 16. Chose a hybrid GPT master-sheet and video-animation pipeline
- Reviewed the available GPT image, top-down character, Wan image-to-video, animated WebP conversion, and direct video-to-sprite-sheet skills.
- Rejected video-first character creation because independent clips would drift in identity, clothing, camera angle, proportions, and scale between directions.
- Chose GPT Image with the existing survivor sheet and First Night screen as references to establish transparent four-direction identity master sheets first.
- Defined those static master sheets as immediately usable gameplay assets and as identity anchors for later per-direction `idle`, `walk`, and `attack` clips.
- Chose direct video-to-sprite conversion for animation delivery: alpha-capable background removal, one stable autocrop across the clip, `128x128` tiles, and no audio.
- Kept animated WebP-to-grid as a secondary path only when an upstream generator already outputs animated WebP.
- Switched the four pending sprite meta-sections from unavailable Z-Image to the inspected GPT Image template with high quality, transparent output, and explicit image references.

### 17. Started four-direction character animation production
- Confirmed the clean Survivor and Drifter masters preserve the intended graphite survival-drama style and use the direction order `down / up / left / right`.
- Cropped both 1024×1024 master sheets into eight 512×512 directional identity inputs under `assets/animations/source/` without redrawing or rescaling them.
- Kept the Survivor empty-handed in every animation source so the selected crafted weapon remains a separate Canvas runtime layer.
- Inspected the Wan image-to-video template and the game sprite conversion skills before generating motion.
- Defined three in-place cycles for each direction: restrained `idle`, grounded `walk`, and short `attack`; locked camera, fixed ground anchor, no travel, no scene, and loop-compatible endpoints are required for every clip.
- Started with two control jobs, `Survivor walk_down` and `Drifter walk_down`, to detect identity or camera drift before multiplying the pipeline across 24 clips.
- Both initial jobs failed while all Wan cluster nodes were offline. Activated one Wan node and repeated the same jobs without switching models.
- Survivor generated successfully. The first Drifter retry timed out at the tool boundary and produced no file; repeating the same job later completed successfully.
- Inspected both 512×512 animated WebP outputs. Character identity, facing direction, unarmed Survivor state, clothing, and the plain removable background were retained.
- Corrected the conversion route after inspecting the actual Wan outputs: because Wan returned animated WebP rather than MP4, selected the dedicated `webp_to_sprite_grid` workflow instead of direct video background removal.

### 18. Expanded Wan production and recovered incomplete jobs
- Generated the full 48-section animation metadata matrix: 24 Wan clip sections and 24 animated-WebP conversion sections covering Survivor and Drifter, four directions, and `idle / walk / attack`.
- Preserved the two validated `walk_down` control sections and created only the 44 missing sections.
- The first metadata helper command failed with exit code 126 because the environment did not permit the `python` executable; reran the same helper with `python3`, which completed successfully without changing the workflow.
- Generated the remaining Survivor clips in small sequential batches to avoid overloading the single active Wan node.
- Generated the Drifter clips the same way and treated every tool timeout as indeterminate until checking the target directory, preventing unnecessary duplicate generation.
- Reconciled target files after generation: 23 of 24 animated WebP clips existed, while `Drifter attack_right` was the only missing output.
- Rechecked the inspected Wan and `webp_to_sprite_grid` templates before recovery, and confirmed one Wan node was online; no model or utility switch was made.
- Confirmed the two control sprite sheets are 512×512 RGBA PNGs, corresponding to transparent 4×4 grids of 128×128 tiles.

### 19. Recovered the last clip and converted every sprite sheet
- Reconciled outputs before regenerating anything: 23 of 24 clips and only 2 of 24 sheets existed, so only `Drifter attack_right` was repeated on the same active Wan node.
- Confirmed all 24 animated WebP clips after the retry; no model or utility was switched.
- Converted the clips to sheets in batches of four through `webp_to_sprite_grid` and verified files on disk after every batch instead of trusting tool responses.

### 20. Found that the grid converter never produced real tiles
- Wrote a temporary validator covering all 48 outputs: clip animation flag, frame count, size, and frame uniqueness; sheet size, mode, alpha range, occupied tiles, per-tile uniqueness, edge clipping, and anchor drift.
- The first report failed every sheet with `empty_tiles`, `clipped_edges`, and `anchor_drift`, while all clips passed except for an incorrect `16 frames` expectation.
- Overlaid a 128-pixel grid on one sheet and confirmed the cause: the converter stacked full-size frames vertically and cropped the canvas to 512×512, so background removal worked but tile packing did not.
- Relaxed the clip rule to `frames >= 16` because Wan legitimately returns 53 frames per clip.

### 21. Rebuilt all sheets from the original clips
- Kept the 53-frame WebP clips as the source and rebuilt sheets locally instead of regenerating any motion.
- Selected 16 evenly spaced frames per clip, estimated background from the frame border, built alpha from color distance, applied one shared scale per cycle, and placed every frame on a fixed bottom anchor at `y=120` with horizontal center at `x=64`.
- Rebuilt all 24 sheets successfully and recorded the selected frame indices, scale, and per-tile anchors in a rebuild report.

### 22. Removed isolated alpha fragments
- Visual inspection revealed a defect the metrics missed: detached shoe fragments and thin dark strokes from neighboring poses survived inside several Survivor tiles.
- Tried OpenCV for connected-component cleanup; it failed to import because the installed build was compiled against NumPy 1.x while the environment runs NumPy 2.0.2. No packages were installed and no environment change was made.
- Implemented the same cleanup with Pillow only: each frame keeps its largest connected alpha component and drops isolated islands before scaling.
- Rebuilt all 24 sheets again with cleanup enabled.

### 23. Revalidated all 48 outputs
- Extended the validator with two stricter rules: the bottom anchor of every tile must equal exactly `120`, and no tile may contain more than one alpha component.
- Final report: `clips 24/24`, `sheets 24/24`, `issues 0`, bottom anchor range `(120, 120)` for every sheet, `max_alpha_islands 1`, `occupied_tiles 16`, `edge_touch_tiles 0`, and at least 8 visually distinct frames per cycle.
- Confirmed visually that `Survivor walk_down` and `Drifter attack_right` now contain 16 clean transparent tiles with no floating fragments, no clipped limbs, and a stable ground line.
- The Survivor remains empty-handed in every frame, so the equipped weapon stays a separate Canvas runtime layer.

### 24. Integrated animation state selection into the Canvas runtime
- Added a lazy sprite-sheet loader keyed by `character/action_direction` so only the sheets actually used during play are requested.
- Added a frame sampler that reads the validated contract directly: `128` pixel tiles, `4` columns, `16` frames, fixed bottom anchor `120`, and per-action rates of `idle 8`, `walk 13`, and `attack 22` frames per second.
- Added animation state tracking that resets the cycle timer whenever the action changes, preventing frames from carrying over between `idle`, `walk`, and `attack`.
- Wired player state selection to real input: movement keys produce `walk`, firing sets a short `attack` window of `0.34` seconds, and everything else falls back to `idle`.
- Wired zombie state selection to combat state: a live attack cooldown produces `attack`, otherwise `walk`, and the movement angle is stored so facing follows the actual path instead of a recomputed house vector.
- Kept the rendering chain strictly layered: animated sheet first, then the static four-direction master sheet, then the procedural silhouette, so a missing PNG never blanks a character.
- Kept the Survivor weapon as a separate runtime layer and made its draw order depend on facing, so the weapon is drawn behind the body when the Survivor faces away from the camera.
- Limited animated rendering to `survivor` and `drifter`; Runner and Spitter continue to use their static master sheets until their clips exist.

### 42. Runner/Spitter sheets complete, game.js integration verified, drawImage rendering probe closed
- Finished the manual sheet pipeline for **Runner** (12/12: idle/walk/attack × 4 directions) and **Spitter**
  (12/12), the same procedure used for Survivor and Drifter. All 48 sheets across all four characters are
  now live under `assets/animations/sheets/{character}/{action}_{direction}.png`, each validated at
  512×512, real alpha, 16 distinct poses per sheet, no blank cells.
- **`game.js` integration required zero code changes.** `ANIMATED_CHARACTERS` already included all four
  names, `ANIM_SCALE` already carried `drifter/runner/spitter: 1.28`, and `animationSheet()` already built
  its path generically from `character`. The runtime was written ahead of the assets during an earlier
  pass and was simply waiting for the files to exist.
- **Verified the actual `drawImage` calls, not just the source.** Instant-spawned one Drifter, one Runner
  and one Spitter through the dev bridge, hooked `CanvasRenderingContext2D.prototype.drawImage` on the
  game canvas, and captured every animated-sheet draw over several frames: 216 drifter draws, 180 runner,
  45 spitter, 9 survivor — every source path routed to the correct `<character>/` folder, no
  cross-character mixing and no fallback to a static master sheet or a procedural ellipse.
- **Per-character scale confirmed numerically at the destination-size argument, not by eye.** The formula
  is `size × ANIM_SCALE[id]` where `size` is `76` (spitter) / `58` (runner) / `66` (drifter, default) and
  `ANIM_SCALE` is `1.28` for all three zombies, `1` for the survivor. Measured drawn width: drifter
  `84.5` (expected `84.48`), runner `74.2` (expected `74.24`), spitter `97.3` (expected `97.28`), survivor
  `100` (expected `100`) — exact matches, confirming the scale table and the size table both apply
  correctly per entity with no rounding drift worth mentioning.
- Restored the native `drawImage` and removed the temporary `window.__hits` / `window.__sizeHits` probe
  globals from the dev page afterwards.
- **Production path re-walked end to end through the DOM only**, no dev bridge, no synthetic clicks:
  clicked `#start` once, waited out the real 30s prep timer, confirmed `NIGHT IN PROGRESS`, watched a live
  siege with real spawned Drifters through wave 3/5, and let the house fall with zero shots fired — the
  same tuned passive-loss outcome recorded in the props/turrets regression, not a new defect. Console
  stayed empty throughout; `window.__dev` / `window.__rig` stayed `undefined`.
- One harness quirk noted, not a game defect: `ToolBrowserMakeScreenshot` against the dev tab returned a
  stale frame from the separate production tab instead of the dev scene. The `drawImage` hook, which reads
  live canvas calls rather than a captured bitmap, was unaffected and is the more reliable probe for this
  kind of per-entity numeric check regardless.

### 25. Debugged sprite anchors and combat feedback in the browser
- Loaded the game, confirmed a clean console, and verified from the page itself that six representative sheets across both characters and all three actions resolve as `512x512`.
- Used an on-screen magnifier drawn from the live game canvas, because full-screen screenshots were too small to judge a 100-pixel character.
- The magnifier immediately exposed a real defect the metrics could not catch: the equipped weapon floated at head height because the weapon anchor still assumed the old static-sheet geometry.
- First correction overshot and pushed the weapon below the waist; recomputed the hand position from the animated tile geometry and settled on a body-height anchor with a short forward reach.
- Synchronized the muzzle flash with the same corrected hand height so the flash no longer detaches from the barrel.
- Added a temporary `window.__TEMP_DEBUG_state` hook to shorten the real 30-second preparation phase during iteration, then removed it before finishing.
- Sampled consecutive frames while firing and confirmed the attack state activates correctly: the timer decays from `0.34` to `0.13`, one muzzle effect is emitted, and five projectiles spawn.
- Two apparent failures during testing were correct game behavior, not bugs: one session ignored fire input because the weapon had genuinely jammed, and another because the house had already been lost.
- Magnified a live Drifter and confirmed the `walk` cycle plays with correct facing, but found its health bar drawn across the head because the bar still used the base size while the sprite renders at `1.28` scale.
- Moved the health bar to a size-aware offset that accounts for whether an animated sheet or a fallback was drawn.
- Reloaded the finished build, played a real preparation-to-siege transition without state injection, reached `Kills 7` with working muzzle flashes and hit feedback, and confirmed an empty console.
- Verified no `TEMP DEBUG` markers or debug hooks remain in the project sources; the magnifier existed only in browser memory and touched no project file.

### 26. Prepared Runner and Spitter directional inputs
- Confirmed both zombie master sheets existed but no directional identity inputs had been cut for them.
- Sliced each 2×2 master into four 512×512 `down / up / left / right` inputs using the same order as Survivor and Drifter.
- Visual inspection caught a defect the slicing metrics missed: neighbouring cells bled fragments of the adjacent pose into the Spitter frames.
- Added largest-connected-alpha-component cleanup before flattening onto white; Spitter frames contained two to three stray islands each.
- A second inspection showed Spitter `left` and `right` were clipped at the top because the figure overflowed its cell, so the slicer was rebuilt with a 90-pixel overscan and a fixed safe box, moving every bounding box into the `40..470` range.

### 27. Generated Runner and Spitter clips and rebuilt their sheets
- Created the full 48-section matrix for both characters: 24 Wan clip sections and 24 sheet sections.
- Activated three Wan nodes and generated the clips in parallel batches, reconciling the target directory after every batch instead of trusting tool responses.
- Confirmed all 24 clips on disk, then converted them with the same local rebuilder used for Survivor and Drifter, because the network grid converter still packs frames incorrectly.

### 28. Revalidated every animation output
- Ran the strict validator across all 96 files (4 characters × 24 outputs).
- Two Runner sheets failed with alpha islands: thin limb connections were broken by antialiasing during the downscale, so cleanup was moved to run after scaling as well.
- One further failure appeared where post-scale cleanup shaved the bottom pixel row and left an anchor of `119`; the bounding box is now recomputed after cleanup so the anchor lands exactly on `120`.
- Final report: `clips 48/48`, `sheets 48/48`, `issues 0`, and visual checks on the previously failing Runner and Spitter sheets confirmed clean tiles.

### 29. Integrated Runner and Spitter into the runtime
- Added both characters to the animated set and gave each a per-character scale instead of one shared multiplier.
- Added a real `idle` state for zombies waiting between attacks at the shelter wall.
- Verified from the page that all 24 new sheets resolve as `512x512`.
- Live testing exposed a genuine gameplay defect: zombies walked into the centre of the house and stacked on top of each other. Movement now holds the shelter perimeter while still allowing a zombie to leave toward a noise event.

### 30. Fixed dead movement and added the environment layer
- Reproduced a reported "the survivor will not walk" bug and found the cause: input was read from `e.key`, so a Cyrillic keyboard layout produced `ц/ф/ы/в` and no movement at all. Input now reads `e.code`, which is layout independent.
- Audited `assets/` and confirmed the complaint about missing environment art was correct: there were no environment assets at all, and the yard was drawn from procedural lines only.
- Added `src/environment.js` as a separate layer covering ground, road, kerbs, puddles, debris, neighbouring facades, fences, streetlamps with light pools, a night-to-dawn grade, two-layer rain with impact rings, the defence perimeter and wooden barricades.
- Every element renders procedurally first and upgrades automatically when the matching PNG appears, so a missing file can never blank the scene.

### 31. Generated environment textures and removed tiling artefacts
- Generated nine environment textures plus a top-down cutaway of the player's shelter, keeping the charcoal, dirty-paper palette.
- Replaced the black schematic block with the generated shelter artwork, kept the schematic version as a fallback, and moved reinforcement, damage, lamp glow and the shelter bar into a shared overlay pass that works over either version.
- First integration showed the ground and road tiles were far too large; tile scales were reduced to roughly one road width per repeat.
- Mirroring the tile to break the repeat was tried and rejected: flipped neighbours produced obvious butterfly symmetry.
- Rotating crops in a 3×3 mosaic removed the symmetry but introduced hard seams between cells.
- Final solution keeps the seamless source as a base layer and stamps rotated, radially feathered crops over it, drawn at every wrapped offset so patches crossing the cell edge continue correctly. Large soft mud blotches were added on top for low-frequency variation.
- Fence sections are now mirrored on alternate repeats and enlarged so the boundary reads at gameplay scale.
- Corrected the held weapon: it was anchored to the old static-sheet geometry and floated at head height. It now sits at body height with a short forward reach, rotates with the aim vector, and changes correctly when a different weapon is crafted and equipped.
- Removed the temporary debug hooks, reloaded cleanly, confirmed movement works with a Cyrillic-layout key event, and confirmed no new console errors after the fixes.

### 32. Verified the responsive layout and extended the IDE view
- Measured the game page in a narrow window: the canvas keeps its `1.6` aspect ratio, the sidebar stacks below the viewport instead of squeezing it, and there is no horizontal overflow.
- Opened the IDE Weapon Lab view and confirmed it still loads cleanly with the new environment layer in place, with every existing preview resolving and an empty console.
- Added an Environment Textures panel to the view: one card per environment slot, mirroring the texture table in the environment module.
- Each card reports `TEXTURE READY` or flips to `PLACEHOLDER` on load failure, which is exactly the condition under which the game silently falls back to its procedural drawing for that element.
- Registered the environment files with the live file watcher so regenerating any texture refreshes the panel without a manual reload.
- Verified in the browser: `10` cards, all `TEXTURE READY`, no broken images.

### 33. Rebuilt the shelter as a real building with perspective visibility
- Fixed a render-loop crash first: a click-captured `performance.now()` produced a negative `dt`, which ran the rain-splash timers backwards until Canvas threw `IndexSizeError` on a negative radius. Splash radii are now clamped.
- Replaced the circular house proxy with `src/shelter.js`: four wall bands, one doorway, eight windows, an interior floor with furniture and cosmetic room dividers.
- Added axis-of-least-penetration collision so the survivor slides along walls instead of sticking, and the narrow doorway stays walkable.
- Implemented per-opening sight wedges projected from the survivor through each gap, with a minimum standoff so pressing against the glass no longer opens a 180° cone.
- Added a radial falloff to every wedge: sight fades with distance from the opening, so one window reveals a slice instead of erasing the whole roof.
- Split visibility into two passes: the roof hides the interior from the yard, and a yard fog hides the exterior from inside. Both are punched by the same wedges.
- Made boarding progressive: each plank splits the remaining glass into narrower slits rather than bricking the window up. A flat 74% coverage dropped a 56px window to a 7px slit on the very first board, which felt wrong.
- Moved traps into `src/interaction.js` as carried items with placement mode, a ghost preview and pick-up.
- Found and fixed a real state bug: a picked-up trap was re-placed with a full charge count. The carried trap now remembers its remaining charges (`2 → 2`, not `2 → 3`).
- Replaced the dashed circular defence rings with wooden stakes planted along the real footprint, and pushed them clear of the facade so they are not swallowed by the wall layer.

### 34. Tuned the siege balance with deterministic simulations
- Measured instead of guessing: instrumented wall damage per second and found the first wave alone destroyed the house in 21 seconds against a 105-second night.
- Root cause was data, not code: 7 drifters × 7 damage at a 1-second interval is 49 dps against 500 HP.
- Built a deterministic harness so runs are repeatable, because wall-clock simulations produced different outcomes every time.
- One apparent balance failure was not one: the autopilot stopped killing because weapon range is `180px` and it stood `220px` from the wall, so shots never reached.
- Swept house HP and drifter parameters and settled on a configuration where the first wave leaves roughly `29%` of the house, passive play still loses around `43s`, active defence survives at `23-33%`, and a prepared defence ends at `64-68%`.
- Confirmed planks matter: `80` damage unboarded against `22.4` with two boards, and reinforcement takes `10` down to `8.2`.
- Wrote the tuned values into scenario data and re-verified them from a clean load, so the numbers come from disk and not from browser memory.

### 35. Interactive debug session: breakpoints and variable inspection
- Armed a conditional breakpoint on `CanvasRenderingContext2D.drawImage` that only captured calls whose source was `shelter.png`, and recorded its arguments.
- That immediately proved a silent defect: `drawShelterSprite` was imported but never called, so a finished 1536×1152 PNG sat unused while the house rendered as a procedural grey slab.
- After wiring the call, the breakpoint reported `380` hits over `380` frames into the box `344,200,272,200`, exactly matching the shelter footprint.
- Inspecting the captured target canvas exposed a second, worse defect: the artwork is a top-down **cutaway** and it had been handed to the roof layer. Since the roof is the occluder, the interior became permanently visible from the yard and the whole window-peek system was silently disabled.
- Moved the artwork to the interior layer and returned the roof to its procedural opaque slab, because an occluder must be featureless.
- Made `drawShelterInterior` treat a cutaway texture as a full replacement: it now returns early, so the procedural floor, dividers and furniture are not painted a second time under the artwork. Confirmed by search that furniture is drawn from exactly one place.
- Extended the breakpoint to count draws per frame and confirmed `526` draws over `525` frames — exactly one, so no duplicate pass survived.
- Verified the occlusion numerically rather than by eye, sampling mean interior luminance: `66.8` from the yard against `100.1` from inside.
- Verified the peek is local, not global: standing at south window `s1` raised the strip behind it from `68.6` to `111.0` while the rest of the interior stayed dark at `56.3`.
- Verified the slice tracks the survivor: walking from the west window to the east window moved the readings `west 103.5 → 66.5` and `east 65.5 → 99.4`.
- Inspected the readiness contract directly through a temporary environment hook: all `10` environment textures reported `ready: true` with measured opaque bounds.
- Forced `shelter.ready = false` in browser memory only and confirmed the fallback: `0` artwork draws, yet the interior still rendered at `97.8` luminance from the procedural cutaway. No project asset was modified.
- Restored the texture and confirmed the interior renders as real artwork with four rooms, stove, bed, barrels and workbench.

### 36. Full weapon-layer regression: switching, firing, overheat, backfire, noise spike
- Moved the entire debug surface out of the production path first: the balance harness and the render probes now live in `src/devtools.js`, imported only when the page is opened with `?dev=1`. A normal play session never fetches the module.
- Because `instantSpawn` is module-private, the harness receives a setter instead of a live binding, and `state` is exposed as a getter because every session replaces the object.
- **Draw order.** Instrumented `drawImage` with a per-frame tag, because an untagged capture is ambiguous: an alternating `WEAPON, BODY, WEAPON, BODY` stream reads identically whichever element comes first. Tagged capture proved the order flips with facing: aiming up gives `WEAPON > BODY`, aiming down gives `BODY > WEAPON`.
- **Hand anchor.** Captured the actual transform matrix instead of judging by eye. Right `dx +12 / dy -3 / rot 0°`, left `-12 / -3 / -180°`, down `0 / +3.6 / 90°`, up `0 / -9.6 / -90°` — matching `HAND_REACH 12`, `HAND_Y -3` and the `.55` vertical squash.
- **Identity.** All three weapons drew exactly `1:1` per frame (`212/212`, `251/251`, `263/263`) while the body sheet stayed on the same animation tile, confirming the weapon is a genuinely independent runtime layer.
- **Switching.** Flipped the equipped weapon every 25 frames across 130 frames: `0` mixed frames (no frame ever contained two different weapon textures) and `0` frames of latency — the new texture appears on the very frame the equip happens.
- **Resource gate.** An unaffordable craft correctly refuses the swap: `corpse_burner` needs `metal_scrap 3 / rubber_tube 1 / battery 1` against `2 / 0 / 0` available, the HUD said `Not enough salvage`, and the drawn texture stayed `bone_sprayer.png`. Not a bug.
- **Overheat defect found and fixed.** A Corpse Burner run reached `Heat 752` against a limit of `142` and never failed. Two causes: heat was unbounded, so the risk term `heat/heat_limit` saturated far above 1; and only `jam` ever set `failed`, so weapons whose flaw is `backfire` or `noise_spike` sat pinned at the ceiling firing forever. Added a hard cap, clamped risk to `.55`, and made reaching the cap lock the weapon whatever its flaw is.
- Memoized `weaponStats` because the HUD now reads the heat limit every frame, and changed the readout to `heat / cap` — a bare number gave no sense of proximity to failure.
- **Cap verified per weapon** against limits read from the Test Chamber rather than assumed: peaks `82/115`, `142/142`, `128/128`. One intermediate `capRespected: false` was my own guessed constant, not a game defect.
- **Lockout is airtight.** After the lock, heat falls monotonically `142 → 0`, no new muzzle flashes appear, projectiles drain, and the weapon stays locked even at zero heat. `R` is the only exit.
- **Recovery.** `R` drops heat to `40%` of the cap (`142 → 57`), landing below the `60%` risk threshold, so clearing an overheat buys a real burst rather than a single shot. Measured burst: `30` shots against the dry formula's `24`, the difference being the `15/s` cooling during the burst.
- One burst measurement was wrong before it was right: counting muzzle effects by list-length delta undercounted badly (`2` instead of `30`), because at `13` shots/sec several `0.09s` flashes are alive simultaneously and the count never returns to zero. Switched to identity tracking so each discharge is counted exactly once.
- **Backfire.** Measured the projectile heading against the aim vector: `3` backfire events, all emitting the burst at `180°` against an aim of `0°`, and exactly `6` reversed projectiles (`3 events × 2 projectiles`). No `scream` effects leaked into the wrong flaw.
- **Noise spike.** Histogrammed every noise event: `375` for normal shots and exactly `938` for spikes, matching the intended `375 × 2.5`, with `2` scream effects for `2` spiked events.
- **HUD alerts.** Sampling the HUD only on `failed` missed backfire and noise spike entirely, because neither locks the weapon and their alerts are transient. A continuous HUD stream recorded all of them: `BACKFIRE`, `NOISE SPIKE`, `OVERHEATED`, `WEAPON JAMMED`, `Failure cleared`.
- **HUD latch defect found and fixed.** The stream exposed that the per-frame night readout never came back: `statusRank` latched at `1` on the very first alert and the `rank < statusRank` guard silenced rank-0 updates for the rest of the session — the line stayed frozen on a `2.4s` alert for over `6` seconds. Rank now expires together with its hold; terminal rank `2` remains the deliberate exception.
- Re-verified both directions of that guard: the HUD resumes after `2867ms` (the `2.4s` hold plus frame quantisation) with a correct `Heat 0/115` readout across `663` sampled lines, while `THE HOUSE IS LOST` still survives a later `CRAFT` and `CRAFT GUTTER TRAP`. A new session unlatches the terminal rank and the readout returns.
- **Mislabel defect found and fixed.** `craft()` cleared `heat` and `failed` but not `failureKind`, and the `jam` branch never set it — so a stale `overheat` survived a weapon swap and the HUD read `Heat 0/115 · OVERHEATED` on a cold, merely jammed barrel. Reproduced it live, then stamped `failureKind` in the jam branch and cleared it in `craft()`.
- Re-verified: a poisoned `overheat` kind followed by a real jam now reads `Heat 0/115 · JAMMED`, a swap fully resets `heat 0 / failed false / kind null`, and `R` clears both the lock and the label (`100 → 40`, `0.35` of cap).
- Several apparent test failures were correct game behaviour, not defects, and each was diagnosed before touching code: probes returning zeros because the night had already reached `survived` at `elapsed 96`, a gate test invalidated because `START` is disabled mid-siege so `reset()` never ran, and fire input ignored because the house was already lost.
- The dawn branch was validated as a side effect of these runs: `DAWN. The house is ugly, but standing.`, `19` kills, and the start button correctly reading `BEGIN AGAIN`.
- All shelter invulnerability used during measurement was applied in browser memory only, re-asserted per frame, and switched off before the final checks; no project file was touched by it.
- Confirmed a clean runtime after every source edit: the only console errors present are older than the current load and originate from my own earlier injected snippets.
- **Production-path verification.** Every fix above was re-checked in a second browser opened without `?dev=1`, because a regression proven only through the dev harness proves nothing about what a player runs. `devtools.js` was absent from the resource list, `window.__dev` was `undefined`, and no `__`-prefixed globals leaked.
- Played two full nights in that clean session with no state injection at all — real `30s` preparation, real waves, HUD as the only observable, because production deliberately exposes no state hooks.
- First night confirmed the cap and the alerts from the player's side: readout `Heat 0/128`, peak `92/128`, alerts `NOISE SPIKE` and `OVERHEATED`, and `354` per-frame night lines, which is the latch fix holding in the shipped path. The house was then lost precisely because the barrel stayed locked and `R` was never pressed — the lockout doing its job, not a defect.
- One reported label was my own measurement artefact, not a game defect: a `Kills` capture leaked a stray `K` into my regex output while the HUD itself only ever printed `OVERHEATED`.
- Second night played the way the game intends — hold fire, press `R` on every lock: `5` locks, all correctly labelled **`JAMMED`** on a `jam` weapon and never `OVERHEATED`, each cleared by `R`. That is the mislabel fix confirmed outside the harness.
- The terminal rank behaved identically in production: `THE HOUSE IS LOST` survived to the end of the attempt, the start button read `BEGIN AGAIN`, and the next session unlatched the rank and resumed the per-frame readout.
- The production console stayed completely empty across both nights — zero errors, zero warnings.

### 37. Night-to-dawn grade, interior window light, and blood
- **Transition-frame snap fixed at the source.** The grade was recomputed from `phase` every frame, so the frame that flipped `siege → survived` jumped straight to the dawn end of the curve. The value now lives in the session as `state.dawnGrade`, eases towards a target, and is rate-limited to `GRADE_RATE` per second in both directions. The siege ramp is an order of magnitude slower than that limit, so normal play is untouched — the clamp only ever bites on a phase change, which is exactly the frame that used to jump.
- Terminal phases hold whatever the night ended on instead of resetting, so the last colour the player saw is the colour that stays on screen behind the outcome message.
- Measured the fix rather than trusting it: across `150` sampled frames spanning the `siege → survived` flip on frame `60`, the largest single-frame delta was `0.0003` and the delta on the transition frame itself was `0.0001`.
- **Replaced the single linear blend with a keyed dawn curve.** Lerping one cold grey-blue to one warm amber was the whole reason the midpoint read as mud: the interesting half of a real dawn — sky still blue, horizon already turned — did not exist in that blend. `DAWN_STOPS` now carries six stops, each with its own tint colour, multiply strength, horizon colour and horizon weight, so hue, contrast and light direction move independently. The curve is deliberately non-monotonic: it goes darkest and coldest just before it breaks (the false dawn), then violet, then amber.
- The horizon glow takes its colour from the same curve, so the light is violet while the sky is violet and amber only once the sky is amber. A fixed warm gradient faded in over a blue night was the other half of the mud.
- **Interior sight wedges no longer read as a black star.** The wedges were clipped polygons, so their sides were perfectly hard: the radial gradient softened the *depth* of each wedge and nothing softened its *width*. Each wedge is now erased over `7` nested passes, each narrower and only partly transparent, so erased alpha accumulates towards the centreline and tapers at the sides — roughly `93%` clear in the middle against `42%` at the outer sliver.
- Shrinking only the far edge was not enough: every pass shared the same mouth, so the first `~40px` in front of a window kept a knife edge. The near edge is now pulled in at a third of the rate, giving the falloff somewhere to start without visibly narrowing the opening.
- Also stopped holding the unseen yard at near-black through dawn. An almost opaque black field with soft holes in it still looks like a black field, so the fog tone and density now follow the dawn value (`density .9 → .48`).
- Measured the result at the same standing position: the lateral falloff width grew from `6px` to `36px`, which is the difference between a spoke and a shaft.
- **Interior window light added as two passes over the floor.** First an occlusion veil that drops the whole room into gloom and lifts as the sun rises, then one additive shaft per opening spreading inwards from the gap. Because the shafts are built from `windowGaps()`, boarding a window automatically converts its single wide shaft into a set of thin slit shafts — the room dims as you nail it shut with no extra code in the lighting pass.
- Shaft colour interpolates from cold streetlamp bleed at night to warm daylight at dawn, and sub-pixel slits from a fully boarded window are skipped so a spent window does not cost a gradient per frame.
- **Added `src/blood.js`.** Arterial spurt on hit, a heavier gush on death, wall splatter when the hit lands near a surface, and drip trails from bodies below half health. Pools darken and spread as they settle, and the layer keeps updating on terminal screens so the yard does not freeze mid-splash behind the outcome message.
- Wired into three draw layers so blood sits correctly in the scene: pools under everything, wall splatter above the walls, airborne droplets above the bodies.

### 38. Traps, turrets, and destructible props
- **Generalised `interaction.js` from one carried item to a kind-keyed model.** `carry` and `bag` became `{trap, turret}` maps, and placement, ghost preview, legality and pick-up all branch on kind instead of assuming a trap. The alternative — a parallel turret system — would have duplicated the placement, reach and prompt logic that had already been debugged once.
- **Added `src/turrets.js`:** a carried scrap sentry with finite ammo, spin-up, a sweeping idle, target acquisition inside its range, and its own health so the horde can eat it. A destroyed sentry stays in the yard as a wreck rather than vanishing.
- Placement rules are deliberately asymmetric and were verified as such: a trap is dug into the mud and is refused indoors (`NOT INSIDE THE HOUSE`, carry count unchanged), while a sentry stands on a tripod and may legitimately cover a doorway from inside (`SCRAP SENTRY DEPLOYED · 26 ROUNDS`).
- **Added `src/destructibles.js`:** five prop kinds (`car`, `barrel`, `crate`, `fence`, `lamp`), each with `intact / damaged / ruined` states, a collapse animation, debris, and a salvage payout per step. A ruined prop stops blocking shots, so cover is consumable — shooting through a car is a real tactical decision rather than a wall that never changes.
- Barrels detonate when destroyed and chain to neighbouring props inside the blast radius, which turns the yard layout into a weapon.
- **Regression: placement boundaries.** Driving the boundaries through synthetic clicks produced a false failure — a `54px` gap was refused when the rule is `< 54`. The cause was my own harness: the canvas is letterboxed at `1.5385`, so one client pixel is `1.54` world pixels and an integer probe offset never lands on the threshold being tested. Exposed `canPlaceAt` through the dev bridge and measured with no quantisation in between.
- With that, every boundary is exact: trap-vs-trap refuses `53.9` and accepts `54`; reach accepts `90` and refuses `90.1`; turret-vs-turret refuses `61.9` and accepts `62`; and both cross rules (trap against a sentry, sentry against a trap) honour the other kind's gap.
- One intermediate run reported the turret gap as `TOO CLOSE TO A TRAP` at every offset. That was geometry in my probe, not a defect: the point under test sat `22px` from the anchor trap, so the trap rule refused before the turret rule was ever reached. Each rule was re-measured in a yard containing exactly one anchor.
- **Regression: trap behaviour.** A fresh trap carries a `0.4s` arming delay, sampled frame by frame with a body already standing on it: the charge was spent on frame `19`, the exact frame `armed` reached zero, and no charge was lost while `armed > 0`.
- The `trappedBy` latch holds: one body parked on a trap for `180` frames consumed `0` further charges, while two fresh bodies burned the remaining two for `36` damage each. A spent trap then removed itself from the yard.
- Round-trip wear survives pick-up for both kinds: a trap with `2` charges returns as `2`, and a sentry placed with `11` rounds comes back as an `11`-round machine while the untouched one stays fresh in the bag.
- **Regression: turret combat.** A sentry killed three drifters using `18` rounds at `9` damage against `156` total health, so ammo accounting is honest rather than rounded.
- Destruction was measured, not assumed: four bodies deal `12` per attack round, so the sentry health was set to make one round the kill, and it died on exactly `12` damage taken. `F` on the wreck then paid `1 metal scrap` and correctly did **not** return a working machine to the bag (`bag: []`).
- Pick-up reach matches the documented `REACH + turretRadius = 62`: `60` offers the prompt, `62` does not. Earlier probes at `40-44` never reached the boundary at all.
- **Two pieces of dead state removed.** `prompt` and `promptKind` were declared on the interaction object and never assigned, and I nearly recorded the resulting `'none'` as a defect. The contextual prompt is computed once per frame and never stored, so the dev bridge now hands over `contextAction` itself — the only honest way to assert what `F` would do. The placement radius also stopped being a magic `90` in two places.
- Several apparent failures were the harness again: three consecutive probes read frozen frames because the night had reached `duration` mid-measurement and `update()` had stopped, and the rig silently reused a session because `#start` is disabled while `running` is true so the click was a no-op. Forcing `phase='idle'` to fix that made it worse — the start handler only rebuilds when the phase is *not* idle — so the rig now releases `running`, keeps the phase non-idle, and throws if the session object did not actually change.

### 39. Photographic damaged and ruined prop assets
- Generated all `15` prop states as photographic cutouts (`5 kinds × intact / damaged / ruined`) under `assets/environment/destructibles/`, keeping each state in the aspect ratio its silhouette demands rather than one shared square.
- The intact states were generated too, even though procedural versions existed: a photoreal wreck standing next to a charcoal-drawn intact prop reads as a bug, not as a style.
- **Defect found in the delivered assets.** All fifteen files arrived fully opaque with a white studio background baked in — corner pixels measured `253,253,254,255` and the opaque area was `100%`, so `measureBounds` returned the entire image and every prop would have drawn as a pale plate on the mud.
- Fixed in the loader rather than by re-cutting the files, so any future asset that arrives without alpha is handled too. A flood fill from the border is used instead of a global "white is transparent" test on purpose: the props legitimately contain near-white pixels (a headlight, a cracked tile, a paint highlight), and a global test punches holes straight through the artwork. Only white *reachable from the edge* is background.
- The first keying attempt only worked on `2` of `15`. The cause was the cheap pre-check: it downscaled the image into a `3×3` probe, so each "corner" became the average of a whole quadrant and the dark subject dragged it below the white threshold. Real corner pixels are now copied one at a time.
- A second bug followed from the first fix: after keying, the source of truth is a canvas, which has no `naturalWidth`, so the bounds scan measured zero and silently marked every keyed slot as not ready — which looks exactly like a missing file. The scan now accepts either.
- **Aspect defect found and fixed.** The ruined artwork has a different silhouette ratio from the intact artwork (`barrel_ruined 0.76` against a box ratio of `1.23`), and the collision box was being scaled anisotropically. Under `contain` that drew a burst barrel *narrower* than the intact one — `20.8px` where `30px` was expected. Ruined boxes are now widened and flattened per kind, and the result was measured: `barrel_ruined 30.7×40.3`, `car_ruined 101.8×46` against an intact `96×41.6`, and `fence_ruined 78.4×16.4`, wider and flatter, which is what a collapsed fence should be.
- Verified all `15` slots from the page: every one `ready` and `keyed`, with sensible trimmed bounds and aspect ratios that match their subject (`fence_ruined 4.78` for flattened rails, `lamp_ruined 0.382` for a pole lying across the ground).
- Verified that every state actually renders through the photographic path with no procedural fallback: staged all fifteen in one yard and counted draws by object identity, giving `15/15` slots at exactly one draw per frame.
- Identity tracking was necessary because keyed slots hand `drawImage` a canvas, which has no `.src` — a filename regex matched nothing and reported a false `0/15`.
- Captured the full grid at the dawn end of the curve: the night tint and vignette crush exactly the mid-tones these cutouts live in, so a still shot at night proves nothing about them.

### 40. Closed the prop/turret/trap regression on the boundaries that were still open
- **Pick-up reach for a sentry measured at the boundary, not near it.** Earlier probes sat at `40-44px` and never reached the threshold at all, so they proved only that a turret in arm's reach is offered. Re-measured against the documented `REACH + turretRadius = 62`: `60` offers `F · PICK UP TURRET`, `62` offers nothing. The rule is strictly-less-than, so `62` exactly is already out of reach.
- Two consecutive probe runs returned no data because the page had reloaded between calls and my injected helpers were gone with it. Made every probe self-contained rather than depending on state left by a previous snippet — a helper living in browser memory is not a fixture.
- **Round-trip wear re-confirmed for both kinds after the refactor.** A trap placed with `2` charges came back as `2` and went out again as `2`. The sentry run first failed on my own sequencing: the rig clicked place while `placing` was still set from the previous attempt, so the second drop was a no-op. Re-run cleanly, an `11`-round sentry returned as an `11`-round machine while the untouched one stayed full in the bag.
- **Turret combat accounting.** A sentry killed three drifters for `18` rounds at `9` damage against `156` total health — every round accounted for, nothing rounded away.
- **Turret destruction tuned from a measurement, not a guess.** A drifter deals `3` damage per `2.2s` swing, so at `80` health the horde needed `15s` to chew a sentry — long enough that placement carried no risk. Set sentry health so one attack round from four bodies is the kill, and it died on exactly `12` damage taken.
- One destruction run recorded zero damage and looked like a defect: the night had already reached `duration`, so `update()` had stopped and nothing was swinging. Re-ran with the clock under control.
- `F` on the wreck paid exactly `1 metal scrap` and correctly did **not** return a working machine to the bag (`bag: []`), so a destroyed sentry is salvage and never a free rebuild.
- **Trap behaviour re-verified end to end.** The `0.4s` arming delay was sampled frame by frame with a body already standing on the trap: the charge was spent on frame `19`, the exact frame `armed` reached zero, and nothing was lost while `armed > 0`. The `trappedBy` latch held a parked body for `180` frames at `0` further charges, two fresh bodies burned the remaining two for `36` each, and the spent trap removed itself from the yard.
- **Placement legality re-measured through the dev bridge instead of synthetic clicks.** The canvas is letterboxed at `1.5385`, so one client pixel is `1.54` world pixels and an integer probe offset can never land on the threshold under test — that quantisation, not the game, produced the earlier false failure at a `54px` gap. With `canPlaceAt` exposed directly: trap-vs-trap refuses `53.9` and accepts `54`, reach accepts `90` and refuses `90.1`, turret-vs-turret refuses `61.9` and accepts `62`, and both cross rules honour the other kind's gap.
- A run that reported `TOO CLOSE TO A TRAP` at every turret offset was my probe geometry again: the point under test sat `22px` from the anchor trap, so the trap rule refused before the turret rule was ever consulted. Each rule was re-measured in a yard holding exactly one anchor.
- **Asymmetric placement re-confirmed after the refactor:** a trap indoors is refused with `NOT INSIDE THE HOUSE` and the carry count does not move, while a sentry deploys indoors (`SCRAP SENTRY DEPLOYED · 26 ROUNDS`) because a tripod may legitimately cover a doorway.
- **`prompt` / `promptKind` removed as dead state.** Both were declared on the interaction object and never written to, so anything reading them saw a permanent `'none'` while the real prompt was on screen — I nearly filed that as a defect. The contextual prompt is recomputed once per frame and never stored, so the dev bridge now hands over `contextAction` itself, which is the only honest way to assert what `F` would do. The placement radius stopped being a magic `90` in two places at the same time.
- **All fifteen prop slots re-validated from the page:** every one `ready` and `keyed`, with trimmed bounds and aspect ratios that match their subject (`fence_ruined 4.78` for flattened rails, `lamp_ruined 0.382` for a pole lying across the ground). One intermediate report showing `NaN` sizes was my probe reading `bounds.w/h` when the fields are `width/height`.
- Confirmed every state renders through the photographic path with no procedural fallback: all fifteen staged in one yard, counted by object identity, `15/15` slots at exactly one draw per frame. Identity tracking was necessary because a keyed slot hands `drawImage` a canvas, which has no `.src`, so a filename regex reported a false `0/15`.
- Drove `intact → damaged → ruined` live for all five kinds and confirmed the salvage payout is per step (`2` metal scrap across two steps on a crate) and that a ruined prop stops blocking shots.
- **Barrel chain verified, and one apparent failure was not one.** The first barrel detonated and took three drifters from `52` to `16/17/6`. The neighbouring barrel then took no damage — because a body standing `24px` in front of it ate every projectile. Correct collision priority, not a broken chain.
- Captured the whole grid at the dawn end of the curve: the night tint and vignette crush exactly the mid-tones these cutouts live in, so a still shot at night proves nothing about them.

### 41. Prop states in the IDE panel and production-path verification
- Added the fifteen prop states to the IDE Environment Textures view as their own `Destructible Prop States` panel, with the slot list coming from `destructibles.js` rather than being retyped, so the panel and the renderer cannot drift apart. Registered the files with the live watcher and confirmed from the page: `15` cards, `0` placeholders, `0` broken images, alongside `10` environment cards, `3` weapons and `12` components.
- The only console error in that view came from my own probe using top-level `await` inside a non-async wrapper.
- **Production path.** Re-checked the entire new layer in a browser opened without `?dev=1`: `devtools.js` absent from the resource list, `window.__dev` and `window.__rig` both `undefined`, no `__`-prefixed globals, and `blood.js`, `turrets.js`, `destructibles.js` and `interaction.js` all present as real gameplay modules.
- Crafted and deployed a sentry through the shipped UI only — real button, real `T`, real click: `CRAFT SCRAP SENTRY · 1 IN BAG (26 ROUNDS)` → `SCRAP SENTRY DEPLOYED · 26 ROUNDS`, bag label back to `0 IN BAG`.
- **An apparent economy defect was the economy working.** Crafting the trap first left `teeth 1`, so the sentry (`metal_scrap 4 / teeth 2`) was correctly refused with `Not enough salvage`. Proved it symmetrically: on a fresh load the sentry crafts fine and the trap is then the one refused. Night one deliberately affords exactly one of the two.
- A retry of that test read stale numbers because `#start` only calls `reset()` when the phase is *not* `idle`, so my click never rebuilt the session. Re-ran from a hard reload instead of trying to force the phase.
- Played a passive production night: the house drained `1000 → 13` in `45s` with no shots fired, which is precisely the tuned passive-loss figure from the balance pass, not a regression.
- Played an active production night driven entirely by DOM events, with `R` pressed on every lock: `70` per-frame night lines, house held at `135` instead of `13`, `15` kills, peak heat `115/115` against the cap, and alerts `WEAPON JAMMED`, `Failure cleared`, `OVERHEATED` — the cap, the lockout and the HUD latch fix all holding in the shipped path.
- The two errors left in that console were older than the current load (timestamps `16:45` and `18:46` against a `19:56` session) and both name defects already fixed in the sources: the missing `drawWindowVeils` import and the zero-width `getImageData` scan.

### 42. Fixed the "grey mush" grade: replaced stacked multiply with an overlay punch
- **Root cause found by counting composite passes, not by guessing at colours.** The night frame stacked
  THREE separate `multiply` fills on top of each other: the base night tint in `environment.js`, then a
  depth gradient and a vignette in `lighting.js`'s `drawGrade`. Multiply can only ever subtract light —
  it has no floor below "no change" and no way to lift anything — so three of them stacked converge on
  one flat dark grey-blue tone wherever they overlap, which is most of the frame. That convergence, not
  underexposure, was the actual cause of the reported "washed-out grey mush": the scene had lost the
  local contrast that makes light read as light, not that it was too dark.
- **Rewrote `drawGrade` around an `overlay` punch first.** Overlay's neutral point is 50% grey: push a
  colour above it and the base LIFTS, push it below and it darkens — the only cheap way to gain real
  per-pixel contrast in a Canvas 2D pipeline without a manual curve pass. A radial punch centred on the
  yard lifts the midground and falls to a hard dark rim, which is what turns a flat frame into one with
  an actual hot spot. The old depth-gradient multiply stays, but now only carries HUE (a cool-top/
  warm-ground split tone) since contrast is no longer its job.
- **Widened and darkened the vignette.** Its old radius barely reached past the shelter, and its outer
  stop (`48,50,54`) never got dark enough to read as an edge once multiplied against an already-dark
  scene — multiplying near-black by "not quite black" is invisible. Tightened the inner radius and
  dropped the outer stop to near-black (`12,11,14`) so the corners now sit deep in shadow instead of the
  soft midpoint they used to reach.
- **Halved the base night tint's alpha in `environment.js`** (`DAWN_STOPS`, `.40→.22` at midnight down to
  `.06→.03` at dawn). That tint was itself a full `multiply` fill strong enough to read as "the tint" on
  its own — exactly the layer that was feeding into `drawGrade`'s three passes and driving the
  convergence. Its job now is only the cold night→dawn colour handoff; `drawGrade` owns contrast and the
  vignette owns the rim.
- **Strengthened every warm light source so contrast has something to push against:**
  - Streetlamp pools (`drawLampLight`) — inner stop `.46→.72`, mid stop `.2→.34`.
  - Interior floor pool (`drawInteriorLight`) — inner stop `.30→.48`, mid stop `.14→.22`; the room is the
    one indoor lamp source in the scene and has to be unmistakably the warmest thing on screen.
  - Window spill onto the yard (`drawWindowLight` in `shelter.js`) — inner stop `.3→.52`, so a house with
    survivors still inside reads as visibly the warmest object in a dark yard instead of a rectangle with
    a faint suggestion of light near the glass.
- Danger overlay strengthened alongside the rest (`overlay` alpha `.26→.4`, colour warmed slightly) so it
  still reads correctly against the now-higher-contrast base instead of getting lost in it.
- **Verified in the browser, not just in the diff.** Loaded a live siege with six zombies staged around
  the shelter and screenshotted before and after the edit. Before: one flat grey-blue plane, vignette
  barely visible, zombies blending into the ground. After: the yard has a real lit centre falling to a
  genuinely dark rim, the shelter interior is the brightest warm object in frame, and the rim-light
  outline on every zombie is clearly legible against the darker corners.
- Console stayed clean on the verification reload; the only entries present were timestamped to earlier
  sessions and matched already-fixed defects (stale `await`-in-non-async snippets from previous probes).

### 43. Removed every full-frame filter and rebuilt the scene out of the generated textures
- **The verdict that ended the tuning loop.** Sections 37 and 42 were both attempts to fix the look by
  adjusting the strength of full-frame passes, and each one only chose between "sepia" and "black". The
  instruction was explicit — remove the filter, the pictures are already generated — and the measurements
  agreed: at that point the frame carried a night tint, a warm overlay punch, a hue vignette, a blue
  shadow fill, an S-curve, a black-point crush, three lamp pools, a yard fog field and a bloom, all over
  photographic assets that already contain their own light, shadows and colour. Nine invented passes over
  finished artwork is the definition of a filter.
- **Turned every one of them off, in one pass, rather than re-tuning them.**
  - `environment.js` `DAWN_STOPS` flattened to a near-neutral grey at alpha `.06 → .00` (was a blue
    multiply at `.40`). The tint no longer decides exposure or hue; the assets do.
  - `drawLampLight` returned early — the three additive pools at `.72` alpha *were* the "точки света на
    чёрном". Kept as a function so the call site and the GFX switchboard stay intact.
  - `drawExteriorFog` returned early. Softening it from opaque black to a light haze had exposed what it
    was made of: eight 1600px sight wedges erased through seven nested passes each, whose west/east
    boundaries landed as near-horizontal seams across the full canvas width — the "полосы через весь
    экран". At `.16` density it contributed nothing but those seams. The perspective mechanic it existed
    for still lives in the roof mask, which is the half that decides whether you see the interior.
  - `drawGrade` reduced to ONE neutral luminance vignette (`r=g=b` at every stop) plus the danger
    overlay. Every tinted stop, the amber punch, the blue shadow fill and the S-curve are gone; the old
    version is kept as `drawGradeLegacy` for reference and is not called.
  - Interior veil multiply dropped `.58 → .08`: the interior artwork is a lit cutaway photo that carries
    its own lamp and falloff, and multiplying it by a dark rectangle destroyed exactly that.
- **Then fixed the three artifacts that the filters had been hiding.**
  - **The milky blob over the house was `drawWindowLight`.** Isolated by toggling passes and measuring the
    house region: it contributed `+0.078` avgL, more than any other pass. Cause was geometry, not alpha —
    reach was `38+span*1.5` ≈ 125px per opening on a 272×200 building, so nine haloes covered the whole
    house and each other. Light from a window is a pool under the glass: reach is now `14+span*.55`,
    alpha `.52 → .38`, warmed towards orange.
  - **The white halo around every zombie** existed only so silhouettes would read against a black frame.
    There is no black frame any more, so it was removed.
  - **The hard light bands across the yard** were the kerb and lane markings drawn as full-width bright
    strokes; softened so they separate asphalt from mud without drawing themselves.
- **The black rectangle on the house was a missing asset, not a pass.** `roof.png` was 404 and the
  procedural fallback — a near-black gradient slab with bright evenly-spaced tile courses stroked over it
  — is exactly "чёрный прямоугольник с белыми полосами". Generated a real photographic roof, cropped it
  twice (the first crop still carried black wedges in the upper corners from the render) and wired it into
  the `roof` texture slot. Also held the fallback's own tile courses and ridge just above its fill,
  because a slab that ALPHA-FADES does not fade its own contrast: the dark fill dropped out first and the
  bright lines survived as a ladder of stripes lying across the revealed interior.
- **Seated the roof photo into the yard.** A photo drawn with `cover` ends on four mathematically straight
  lines, which is "прямоугольник лежит на земле". Added a proportional eave shade — four linear gradients,
  dark at each edge and gone a few pixels in — so the silhouette is a shaded lip instead of a cut, and the
  seam against the wall band is hidden. Measured the slab at avgL `.230`, the third brightest asset in the
  game and brighter than the mud under it (`ground .147`, `asphalt .133`); a neutral multiply at `.22`
  still left the house region at `.200` against `.155` for the yard, so it was deepened to `.36`.
- **Verified all 26 environment and prop textures from the page rather than from the filenames.** Zero
  missing, zero needing keying, zero cold or grey outliers: L band `.112–.252`, saturation `.214–.555`,
  warm fraction `88–100%`. Brightest is `crate_damaged .252`, darkest `house_left .112` — the whole set
  now sits inside one deliberate band instead of the earlier `.22–.61` spread at 4–9% saturation.
- **Final frame measurement:** frame avgL `.156`, house `.189`, left yard `.155`, right yard `.158` — the
  building now sits a hair above the ground it stands on instead of 29% above it, blown pixels `0.27%`.
  Console clean; the only two errors on the page were my own probes using top-level `await` inside a
  non-async wrapper.

### 55. Recovered the 12 Boss Zombie sheets with Wan API, FLUX, and a procedural gap fill
- Rechecked `gamedev_convert_video_to_sprite_sheet`: MP4 sources require `video_background_removal`, transparent WebM output, autocrop, and explicit `128x128` / four-column sprite flags.
- Ran Wan API 2.7 and FLUX 3 in parallel against the missing Boss matrix. Wan API supplied 9 MP4s; FLUX supplied alternate clips for several actions. The accepted source set covered 11 of 12 actions.
- `attack_up` had no accepted video from either route, so the gap was closed with a loopable procedural 16-frame attack from the validated Boss master. This keeps the runtime contract complete rather than blocking the character on one failed provider job.
- Found and corrected three metadata issues before conversion: output video metas must mirror `FILE` paths, their `SECTION_ID` must match the mirrored path, and `PROMPT` is required even for background-removal jobs.
- The video utility produced all 11 alpha WebM outputs but did not write its requested PNG grids, reproducing the known grid-packing delivery defect. Rebuilt the sheets locally from those alpha sources using a single stable 4×4 layout, 16 evenly sampled frames, transparent RGBA, shared centred crop, connected-alpha cleanup, and a fixed bottom anchor.
- First local reader attempt required unavailable `pyav`; switched to installed imageio-ffmpeg. Full-frame buffering hit memory limits, so sampling was changed to a streaming 16-frame pass. Component cleanup is now done after downscaling to sprite working resolution, avoiding a full-HD pixel scan.
- Strict report: all 12 `assets/animations/sheets/boss_zombie/{idle,walk,attack}_{down,up,left,right}.png` are `512×512` RGBA, alpha range `0..255`, `16/16` occupied 128px tiles, and `0` edge-touching/clipped tiles. `attack_up` was normalized through the same safe box and now passes too.
- Source recovery plan is complete. Detailed report: `.temp/boss-sheets-validation.json`.

### 56. Corrected multi-view Boss sheets after visual review
- Numeric validation alone initially passed the rebuilt video sheets: each had RGBA alpha, a 512×512 canvas, 16 occupied tiles and no edge clipping. The visual contact sheet exposed the real defect it could not detect: every source clip animated the original 2×2 master, leaving multiple directional bodies visible inside a single tile.
- Reopened the recovery checklist rather than accepting a technically-valid but unusable asset. Rebuilt the 11 video-derived sheets with a direction isolation crop before alpha cleanup: `down = top-left`, `up = top-right`, `left = bottom-left`, `right = bottom-right`; a small inward seam margin prevents neighbour-view leakage.
- Reviewed all three contact sets after the correction: idle, walk and attack read as one character per tile and their intended direction; the attack motions are distinct. `attack_up` remains the procedural 16-frame fallback and was normalized through the identical centred safe box.
- Final report has no failing cases: all 12 Boss sheets are 4×4 / 128px tiles (`512×512` total), RGBA with real transparent pixels, 16 occupied tiles each, fixed feet anchors and zero edge-touching/clipped tiles. The Boss recovery plan is now closed.

## Next Actions
- Play a full siege with Runner and Spitter waves against the new props and turrets, and confirm animations, scales and health bars at gameplay scale.
- Balance the new layer: salvage payout per destroyed prop, and whether barrel chains make the yard too strong.
- Re-check the responsive layout against the new environment, blood and prop layers.
- Continue recording each implementation and validation step chronologically.

### 44. Free roam, wave pauses, and a musical speaker pulse
- **Walk before the wave.** `reset()` now starts `running:true` in `phase:'idle'`. WASD, traps, turrets and house prep all work in the yard before any horde is armed. The start button is no longer a gate on movement — it only starts a wave.
- **Waves are player-paced.** `#start` calls `startNextWave()` from `idle` or `break`. Clearing the last body (and any pending staggered spawns) drops the session into `break` so the yard can be repaired. The last wave going quiet is the win, not a 96-second clock.
- **First Night is no longer a dump.** Starting salvage is large enough to actually place a perimeter. Wave 1 is 4 drifters; the later bursts were cut so they don't stack on top of each other.
- **Speakers were a strobe.** `updateSpeakers` advanced `pulse` at `dt*4.2` (4.2 Hz) and drew five hard additive rings at 0.2 phase spacing, plus a 900px gameplay-noise ring every 0.45s. That is a seizure pattern, not a song.
- **Rebuilt the pulse as a bass swell.** `WAVE_HZ = 0.22` (~4.5s per ring). Three rings, cubic ease-out on radius, quadratic ease-in on fade, a wide faint halo plus a thin core. If the mp3 is playing, the clock locks to `currentTime` so the rings stay on the track instead of drifting. Interior bass rings use the same curve, just smaller.
- **Hid the 900px noise circles.** Speaker lure still attracts the horde, but those rings are no longer drawn — the dedicated speaker waves already say "the house is blasting". Local shot/trap cues stay.
- **Copy and header.** Tagline is now «Дом ещё стоит и песня Зомбэ ещё играет.» Button reads `НАЧАТЬ ВОЛНУ 1` / `СЛЕДУЮЩАЯ ВОЛНА · n`. Dropped the rust double-rule and the canvas grayscale+sepia CSS filter.
- **Harness.** `runSiegeSim` walks `wave`/`break` through `startNextWave` instead of forcing `phase='siege'`.

### 45. Ten-cue SFX pack, sample-first audio, live wiring
- **Templates.** Inspected `gen_sound_elevenlabs` (short WAV, one-line prompt, MODE sfx) and `gen_sound_stable_audio_3` (MP3, 1–180s, music-oriented). ElevenLabs is the right tool for combat clicks; Stable Audio was left unused.
- **Generated ten WAVs** under `assets/sfx/` via ElevenLabs: `shot`, `impact`, `death`, `growl`, `house_hit`, `trap`, `jam`, `ui`, `backfire`, `place`. First burst of six succeeded; `jam`/`ui`/`backfire` 429'd, then a node drop. Retried after `ToolClusterNodeActivate` — all ten files on disk. Mono 44.1 kHz 16-bit PCM. Short cues are 1.00s; growl and backfire are 2.00s. Peak near 0 dBFS on shot/jam/growl; UI sits quieter at −7.3 peak / −33.7 RMS.
- **`audio.js` is now sample-first.** `SAMPLES` maps every cue to a WAV. `fetchSamples` pulls them on boot; `decodePending` waits for a user-unlocked AudioContext. `playSound` tries the decoded buffer, then the old procedural voice, then silence. Missing files never throw inside the loop. `noise_spike` reuses `backfire.wav`. New voices added for `growl`, `house_hit`, `ui`, `place`. Throttle table covers every name.
- **Wiring in `game.js`.** Spawn → `growl`. Shelter hit → `house_hit` (+ 35% growl). Craft trap/turret/weapon, reinforce, start wave → `ui`. Drop trap/turret → `place`. Pickup/board still `trap`. Shot / turret fire / jam / backfire / noise_spike / impact / death were already live and now play the WAVs instead of the synth.
- **`t()` already ate the closing brace** (`{${k}}`). No copy bug on this pass.
- **Comment** next to `createAudio()` no longer claims the game ships zero sound files.


### 46. Speaker track from the recording: fade-in, distance, wall filter
- **Source.** Extracted audio from `.temp/upload/ScreenRecording_08-14-2026 15-32-40_1.mov` via `video_edit_essentials` (`extract_audio`) into `assets/audio/zombe.mp3` (1.4 MB, HTTP 200, `ready`, not missing). Gen-sound templates (`gen_sound_elevenlabs`, `gen_sound_stable_audio_3`, Foley) were inspected and skipped — this is a real recording, not a generated cue. Fade is runtime-only: baking it into the file would repeat on every loop.
- **Graph.** `<audio>` still decodes/loops/seeks. On unlock it is routed through the shared WebAudio graph from `audio.js`: `MediaElementSource → BiquadFilter(lowpass) → Gain → destination`. `startNextWave` now calls `audio.unlock()` before `blareSpeakers`. `updateSpeakers` retries `hookGraph` every frame until the context exists, so a song started before the first gesture still picks up the filter.
- **Fade-in.** `FADE_IN = 0.9s`. Gain starts at 0 and walks up. Sampled after a forced reset: `fade 0.037 → 0.166` over ~0.9s, gain tracking the same curve.
- **Distance.** Inverse-square-ish between `NEAR_RADIUS 36` (`VOL_NEAR 0.88`) and `FAR_RADIUS 560` (`VOL_FAR 0.16`). Outside the house an extra `OUTSIDE_VOL 0.78` multiplies the result. Measured live: cabinet `(410,350)` inside → `vol 0.88`; door `(480,410)` outside → `0.561`; yard `(720,500)` → `0.214`; far corner `(60,60)` → `0.15`.
- **Wall filter.** Wired to `player.inside` (already set every frame by `isInsideShelter`). Inside: cutoff `18000 Hz`, `muffled=false`. Outside: exponential ramp to `900 Hz` (~log-mid of 20 Hz–20 kHz, the requested ~50% autofilter) over `FILTER_SLEW 0.14s`. Walked out and back: `18000 → 900 → 18000`, gain `0.88 → 0.15 → 0.88`. Song stays a song through the wall, just muffled.
- **Dev surface.** `speakers` is now on `window.__dev` under `?dev=1` so mix (`fade/vol/muffled/cutoff/inside`) can be read without guessing. Production path unchanged.
- **Console.** Only the stale `await` SyntaxError from an earlier probe. No new errors.

### 47. Cinema mode and zombie roast bubbles
- **Cinema.** `#cinema` toggles `body.cinema`: aside / header chrome / field-strip hide, canvas fills the viewport, Fullscreen API as a bonus. ESC or the exit chip drops back. Built in live CSS/JS — `gamedev_create_game_screen` is a mockup skill, not a runtime screen.
- **Bubbles.** New `src/taunts.js`. Approaching bodies (92–360 px from the house) pop a dirty-paper comic bubble. Cap 3 live. First line of every wave is locked to «хуета на всю улицу»; the rest is a 40-line roast pack (мат, хейт трека, no rot/death jokes). `resetTaunts()` on `startNextWave` so the headline comes back each song.
- **Draw order bug.** First cinema screenshot had live `taunt` state and no visible bubble. Cause was twofold: (1) pop-in started at alpha 0 for ~0.4s, so a short approach or a screencast frame ate the line; (2) drawing after `drawHUD` put world-space bubbles on a reset transform. Bubbles now start readable (fade only on the way out) and paint in world space after bloom, before HUD.
- **Verified in cinema.** Sidebar `display:none`. Approach ring holds: 31 px and 420 px stay silent, 160–180 px speak. Console clean. User confirmed the bubbles readable by hand.



### 48. Tall 960×960 world, 9:16 reel crop, four-side spawn
- **World grew, camera did not.** Gameplay now lives in a 960×960 yard. Desktop shows the middle 960×600 (`y=180–780`). Reel (`?reel=1` / `#reel`) shows a 540×960 slice of the full height so the extra north/south yards are visible. Rollback is one click: `СТОЛ` drops `reel` from the URL, restores header/aside, canvas backing `1920×1200`. `gamedev_create_game_screen` is mockup-only — this is live CSS/JS in `src/reel.js`.
- **House sits at the shared centre.** Scenario house/player moved to `(480,480)` / `(480,590)` so both crops frame the shelter. Extra streets, lamps, debris and fence runs fill the new yards. Facade slots `house_top` / `house_bottom` generated and drawn at `y≈0` and `y≈836`.
- **Two crashes on the first reel siege.** `beginReelFrame` assumed `shake` was a pair and threw `object is not iterable` when it was a scalar. Guarded as `Array.isArray(shake)?shake:[0,0]`. Then `update()` died at `zombieTypes.get(zombie.id).hp` because a hand-pushed body had no type — drip trail now skips a missing kind, kill loot reads `zombie.drop||{}`.
- **Spawn was random and stacked one edge.** First four of a wave now rotate `N→S→W→E` via `state.spawnSide` (reset to 0 each session). Hooked `zombies.push` on a live wave: first body at `(949.5, −20)` = north. After the stagger, four live bodies approached from Nin / Sin / Win / Ein and `spawnSide` was `4`. No new console errors after the guards.
- **Desktop rollback measured.** After `СТОЛ`: `body.reel=false`, `?reel` gone, aside `grid`, header `flex`, canvas `1920×1200` / client `896×560`. Sidebar and title chrome back; the extra north/south yards are cropped away, the house stays centred. Plan `reel-portrait` closed.


### 49. Five friend-inspired zombie identities — setup and master generation
- Confirmed the requested **Option A**: five separate zombie character types, one per supplied friend reference, instead of forcing five identities into the existing three archetypes.
- Reviewed and selected the applicable templates before generation: `gamedev_create_character_sheet` for identity anchors, `gen_or_edit_image_gptimage_with_refs` for photo-reference image generation, `gen_game_char_top_down` for 2×2 four-direction masters, `gen_video_wan` for image-to-video animation, and `webp_to_sprite_grid` for transparent sprite-sheet conversion.
- Created the plan `meta/plans/five-friend-zombies.md` and five identity meta sections under `meta/files/assets/zombies/friends/`.
- Generated five full-body identity anchors: Glamour Drifter, Office Runner, Heavy Spitter, Silent Stalker, and Boss Zombie. All use the supplied photos as identity references, retain recognizable face/hair features, and use a unified photoreal survival-game treatment.
- Kept the design playful and non-graphic: no gore, dismemberment, blood effects, or weapons in the identity assets.
- Generated five 2×2 four-direction masters under `assets/zombies/friends/`. Each master has down/up/left/right views, stable scale and feet anchors, and transparent-background processing.
- Visual review: identities remain distinct; Heavy Spitter is intentionally largest, Office Runner has the strongest forward lean, Silent Stalker is narrow and upright, Glamour Drifter is relaxed/shambling, and Boss Zombie has a commanding raised-arm silhouette.
- Next: generate 60 Wan clips (`5 types × idle/walk/attack × 4 directions`) in batches of at most two, then convert and validate 60 transparent 4×4 128×128 sheets before runtime integration.


### 50. Five-friend animation pipeline started
- Reviewed `gen_video_wan` and `webp_to_sprite_grid` before creating animation metadata. Wan requires `TYPE: file/video`, `FILE`, `PROMPT`, `WIDTH`, `HEIGHT`, `UTILITY: wan`, and `IMAGE_URL`; sprite conversion will use `STRENGTH: 100`, `SKIP_GENERATION: True`, and `MAKE_TRANSPARENT: rembg`.
- Created the first two animation metadata sections for Glamour Drifter `idle_down` and `walk_down` under `meta/files/assets/zombies/friends/animation/`.
- Generated `assets/zombies/friends/animation/glamour_drifter_idle_down.webp` successfully.
- `glamour_drifter_walk_down.webp` timed out on the first parallel request and failed on retry; no output was accepted or integrated. This is a generation failure, not a runtime change.
- Current accepted animation output: `1` WebP clip. Remaining scope: `59` clips, then transparent 4×4 sheets and validation.


### 51. Wan retry and node check
- Checked Wan cluster before retry: `cmf01`, `cmf02`, and `cmf03` were online and advertised `wan` utility.
- Retried `glamour_drifter_walk_down.webp`; the retry completed successfully after the earlier timeout.
- Generated two additional control clips in parallel: `office_runner_idle_down.webp` and `office_runner_walk_down.webp`; both completed successfully.
- No runtime integration was performed; accepted outputs remain source WebP clips pending sprite conversion and validation.


### 52. Switched friend-zombie animation generation from Wan to Kling
- User explicitly requested Kling after repeated Wan failures; no silent fallback was used.
- Reviewed `image_to_video_kling` template. Required fields used: `TYPE: file/video`, `FILE`, `PROMPT`, `WIDTH`, `HEIGHT`, `UTILITY: kling`, `IMAGE_URL`; added supported `QUALITY_MODE: pro`, `DURATION: 5`, `ASPECT_RATIO: 1:1`, and `NEGATIVE_PROMPT`.
- Updated the four existing friend animation metas from `UTILITY: wan` to `UTILITY: kling`.
- Kling successfully regenerated `glamour_drifter_idle_down.webp`, `glamour_drifter_walk_down.webp`, and `office_runner_idle_down.webp`.
- `office_runner_walk_down` initially hit Kling content filtering because of the zombie wording. Reframed the prompt as an energetic comedic character run without changing the requested motion; retry succeeded.
- Wan was not used for this pass. The remaining 56 clips are still pending and will be generated in Kling batches, then converted with `webp_to_sprite_grid`.


### 53. Continued Kling animation batch
- Re-reviewed `image_to_video_kling` before continuing; no Wan fallback used.
- Added metadata for Glamour Drifter and Office Runner `attack_down` clips with the approved Kling fields and non-graphic comedic motion prompts.
- Kling utility node `integration` is online and advertises `kling`/`kling3`.
- Both new attack jobs failed at utility execution despite the node being online; no invalid output files were accepted.
- Existing accepted clips remain four: Glamour idle/walk down and Runner idle/walk down. Remaining scope remains `56` clips.
- Next retry should use Kling-only, with a shorter neutral motion prompt if the utility failure persists; do not switch models without explicit approval.


### 54. Kling-only continuation and safety failures
- Re-read `image_to_video_kling` and `webp_to_sprite_grid`; no alternative video model was used because the user explicitly requested Kling.
- Checked the Kling utility before retrying: the `integration` node remains online with `kling` and `kling3` advertised.
- Retried Glamour Drifter and Office Runner `attack_down` with shorter neutral motion prompts. Both failed again: Glamour at utility execution; Runner was rejected by Kling content safety.
- Created and tested Heavy Spitter `idle_down` metadata with the same approved Kling fields; Kling rejected the source/prompt combination by content safety.
- No failed output was accepted, overwritten into runtime, or converted into a sprite sheet.
- Accepted clips remain `4/60`: Glamour idle/walk and Runner idle/walk, all down-facing. Transparent sheets remain `0/60` because the conversion stage requires accepted animated inputs.
- Blocker: Kling is rejecting additional requests despite the online node. Continuing retries with identical source masters is not productive. The next valid action requires either a Kling-compatible source/prompt change approved by the user or explicit approval to use another listed video model.


### 54. Wan status check and remaining friend-zombie clips
- Re-read the required Wan animation template `gen_video_wan` and the transparent conversion template `webp_to_sprite_grid` before continuing.
- Checked Wan capacity: `cmf03` is online for `wan`; `cmf01` and `cmf02` are offline.
- Reconciled the animation directory instead of trusting prior generation responses: 48 of 60 friend-zombie WebP clips exist — all Glamour Drifter, Office Runner, Heavy Spitter, and Silent Stalker clips are present.
- The remaining 12 Boss Zombie clips are not present. Repeated Wan generation for multiple Boss directions/actions; each attempt failed, including simplified prompts, so no missing file was counted as successful.
- Checked the newer `gen_video_wan_api` template, but did not switch utilities because the requested workflow is Wan 2.2 and switching to the Wan API utility requires explicit approval.
- Sprite-sheet conversion has not started yet; it will begin only after the remaining Boss clips are resolved and all 60 source clips are reconciled.

### 57. Five friend zombie runtime verification and final rename
- Confirmed the runtime data model exposes exactly five friend-zombie IDs: `glamour_drifter`, `office_runner`, `heavy_spitter`, `silent_stalker`, and `boss_zombie`; every scenario wave references only those IDs.
- Rechecked the animation contract used by the renderer: `idle / walk / attack × down / up / left / right`, 16 frames per cycle, four columns, 128px tiles and 512×512 RGBA sheets.
- Staged all five characters together in the browser and intercepted real game-canvas `drawImage` calls. Walk rendering resolved to each character's own folder with no cross-character mixing: Glamour `walk_down`, Office Runner `walk_up`, Heavy Spitter `walk_left`, Silent Stalker `walk_right`, and Boss `walk_down`.
- Repeated the same runtime probe for `idle` and `attack`; all five IDs resolved their correct action and direction sheets. No static-master or procedural fallback was used in the captured draws.
- Started the real fifth wave through the game control. It produced 20 zombies containing all five friend types (`1 Glamour / 7 Runner / 2 Spitter / 3 Stalker / 7 Boss` in that seeded run), advanced four-side spawn rotation, and contained zero unknown IDs.
- Fixed a leftover legacy render branch that still selected sizes using removed `runner` / `spitter` IDs. Rendering now reads `ZOMBIE_DRAW_SIZE` for every friend type.
- Made zombie health-bar height follow the actual scaled animation size, restored infected green for `heavy_spitter`, added a distinct Boss danger colour, and guarded the HP lookup so a malformed debug entity cannot crash the draw loop.
- Reopened the production URL without `?dev=1`: `window.__dev` and `window.__rig` remained undefined, canvas initialized at 1920×1200, and the console had zero errors, warnings, 404s, syntax errors or type errors.
- Renamed the game from `Стас против Зомбэ` / `Stas Against Zombies` to **The Last of Stas** in the pre-hydration HTML title, visible heading fallback and Russian locale source. Hard reload confirmed both `document.title` and the live heading read `THE LAST OF STAS`; no old runtime title remains in HTML, JSON or JavaScript.
- Closed `meta/plans/five-friend-zombies.md`: all identity, animation, conversion, integration and browser-regression steps are complete.

### 58. Approved Russian zombie comments
- Replaced the temporary 40-line roast pack in `src/taunts.js` with the 10 Russian comments approved in the conversation.
- Removed the forced first-wave headline so every displayed comment is selected randomly from the approved set.
- Kept the approach-distance gate (`92–360px` from the shelter), randomized per-zombie delay, maximum of three simultaneous bubbles, and duplicate suppression among currently visible comments.
- Extended bubble lifetime from `4.2s` to `4.8s` so longer approved comments remain readable while zombies move.
- Kept bubbles in world space above zombies and above the lighting/grade passes, before the HUD.

### 59. Closed Boss Zombie, Bespectacled Teacher, and Big Russian Boss animation regression
- Reproduced the reported static-character defect and separated three causes instead of treating every character as one failure: `boss_zombie` had valid sheets but was missing from animated routing, while `bespectacled_teacher` and `big_russian_boss` initially had only static 2×2 masters.
- Restored `boss_zombie` animated routing and produced the missing `idle / walk / attack × down / up / left / right` sets for the teacher and Big Russian Boss, preserving the runtime contract of `512×512` RGBA sheets, four columns, sixteen `128×128` frames and character-specific asset folders.
- The video conversion utility created alpha WebM files but ignored its PNG sprite-sheet output. A first fallback exposed another delivery defect: the exported videos contained a baked checkerboard rather than usable transparency. Rebuilt the 24 teacher/Big Russian Boss sheets from the original white-background MP4 sources instead of accepting those defective exports.
- Strictly validated the rebuilt 24 sheets before runtime use: every file is `512×512` RGBA, contains 16 occupied tiles, preserves animation motion and no longer displays a checkerboard rectangle in live gameplay.
- A browser screenshot then exposed a separate checkerboard square that appeared to belong to the teacher. Isolating the entities proved it followed the older `boss_zombie` woman instead; the new teacher and Big Russian Boss sheets were already clean.
- Created 12 isolated `boss_zombie_clean` candidates with the inspected background-removal workflow. Composited every candidate over a high-contrast purple test field and visually confirmed that all 12 sheets retained all 16 poses without rectangular/checkerboard residue.
- Replaced only the validated `boss_zombie` runtime PNGs and changed `ANIMATION_ASSET_REV` to `20260821-boss-alpha-clean-v3`, forcing browsers to stop reusing the stale defective sheets.
- Staged `boss_zombie`, `bespectacled_teacher` and `big_russian_boss` together in the browser. The final canvas frame showed all three as isolated character silhouettes with no white plate, checkerboard square or static-master fallback.
- Hooked the real Canvas `drawImage` path and sampled source coordinates over full cycles. Every character visited all `16/16` source tiles for `idle`, `walk` and `attack`; paths stayed inside each character's own folder with no cross-character mixing.
- Loaded the complete 36-URL matrix (`3 characters × 3 actions × 4 directions`) with the new revision. Resource entries resolved from the expected folders with no failed loads.
- Reopened the production URL without `?dev=1`: title `THE LAST OF STAS`, canvas `1920×1200`, `window.__dev` and `window.__rig` both `undefined`, and the console contained zero matching errors, warnings, 404s, syntax errors or type errors.

### 60. The Last of Stas survival UI and display-mode regression
- Replaced the previous notebook/dashboard shell with an original restrained survival-horror interface: charcoal surfaces, moss interaction accents, rust crafting emphasis, condensed display type, mono telemetry, thin borders and salvaged-panel texture. The implementation follows `meta/docs/last-of-stas-ui-style-guide.md`; it is inspired by modern post-apocalyptic UI restraint without copying another game's layouts, logos or assets.
- Added a compact sticky desktop sidebar with its own bounded scrolling area so Weapon Lab, preparation actions and inventory remain reachable without pushing the game canvas out of view. Below 980px the sidebar returns to normal document flow.
- Rechecked desktop at 1600×905: layout columns measured `1158px / 370px`, active controls measured 44px high, sidebar remained within the 881px viewport allowance, and no horizontal overflow appeared.
- Browser-tested cinema at 1600×905. The canvas measured 1448×905 and remained centered with 76px side mattes. Fixed the status and exit controls so they align exactly 16px inside the rendered canvas instead of the browser window; sidebar and page chrome remain hidden.
- Browser-tested 9:16 reel mode at 430×905. The canvas fills the viewport exactly (`430×905`), document scroll dimensions remain `430×905`, and no overflow appears. Fixed the exit control overlap by moving `СТОЛ` below the 44px status strip; measured collision state is false.
- Captured final screenshots for both modes after a hard reload. Cinema and reel preserve the game scene, HUD contrast and exit affordance without clipping.
- Reel console contained no matching errors, warnings, failed loads or 404s. Cinema produced only the expected browser informational message when the automated script called Fullscreen API without a real user gesture; CSS cinema mode still activated and all layout assertions passed.
- Closed `meta/plans/last-of-stas-ui-redesign.md` after desktop, cinema and reel validation.

### 61. Hater Raid browser regression and retaliatory-fire fix
- Completed the reverse-role mode integration in the shipped UI: the header opens `ИГРАТЬ ЗА ЗОМБИ`, the picker exposes all six animated raid types, selection styling updates, `НАЧАТЬ РЕЙД` enters the isolated mode, and `ВЫЙТИ` resets back to the normal quiet-yard session without leaking raid state.
- Browser-tested the Bespectacled Teacher selection. The picker reported its live values (`122 HP`, speed `38`, damage `5`), the raid started with its own HUD and three random approved Russian comment buttons, and using a comment raised provocation from `0%` to `25%` while immediately rerolling the three choices.
- Found a real retaliatory-fire defect during the test: Stas visibly fired but a stationary target took no damage. The spread formula added a permanently positive base offset, placing every bullet on the same side of the target. Replaced it with symmetric spread centred on the target direction.
- Re-ran the return-fire test with Big Russian Boss. After one comment, its health dropped from `1296` to `1189` within five seconds and continued falling during the physical `W` approach, confirming projectile creation, travel, collision, damage and provocation-driven fire all execute in the browser.
- Kept taunting as a deliberate risk/reward action: at long range Stas waits until provoked; inside `190px` he protects the speaker regardless. Fire interval now scales from `1.18s` unprovoked rage to `0.42s` at maximum hate, damage scales from `8` to `15`, and accuracy tightens as hate rises.
- Exposed the current raid object through the existing opt-in `?dev=1` bridge as a live getter. This is absent from production and was used only to place the character at exact test coordinates after the physical doorway approach had already been verified.
- Verified speaker attacks at close range with the Big Russian Boss. Four real `Space` input attacks reduced the speaker from `180` to `0`, changed phase to `won`, and latched `КОЛОНКА РАЗНЕСЕНА · ХЕЙТЕРЫ ПОБЕДИЛИ` while leaving the outcome visible.
- Verified the loss branch separately with a Drifter at `8 HP`, `25%` provocation and `120px` distance. Stas reduced it to `0`, phase changed to `lost`, the speaker remained at `180 HP`, and the latched result read `СТАС ОТСТРЕЛЯЛСЯ · ХЕЙТ НЕ ПРОШЁЛ`.
- Verified post-victory exit: raid state became `null`, the `raid-mode` body class was removed, raid controls became hidden, and the normal pre-wave status returned.
- Captured the final defeat frame and checked the browser console after selection, comments, movement, both outcomes and exit. There were zero matching errors, warnings, 404s, `TypeError`s or `ReferenceError`s.

### 62. Hater Raid fullscreen viewport-layout regression
- Reproduced the remaining active-raid layout defects instead of treating them as cosmetic: on desktop the page header pushed the canvas and comment controls below the fold; the controlled zombie spawned at the world edge outside the camera; moving it inward initially placed it inside Stas's automatic defence radius; and a later generic `body.raid-mode canvas` rule overrode reel mode and stretched the portrait canvas back to 16:10.
- Moved the raid spawn to `shelter.centerY + 250`. It remains visible in desktop and reel crops while staying outside the `190px` automatic defence radius. A timed desktop probe held the starting values at zombie `110 / 110` and speaker `260 / 260` for four seconds before any comment or approach.
- Converted active `raid-mode` to a true viewport layout: page chrome and sidebar are hidden, `main`, `.layout`, `.game-column` and `.game-wrap` fill `100dvh`, scrolling is disabled, and the game canvas is centred against black mattes. The normal page and the zombie picker remain unchanged until the raid actually starts.
- Replaced the full-width desktop comment tray with a compact `370px` panel anchored to the rendered game frame. Three comments stack as readable `38px` rows without covering the approach lane. At `1185×700`, the canvas measured `1120×700`; the panel measured `370×204.6` at `(768.5,481.4)` and stayed completely inside the canvas with no document overflow.
- Restored explicit reel precedence after the generic raid canvas rule: `body.reel.raid-mode canvas` now keeps `height:100dvh`, `aspect-ratio:9/16` and `object-fit:cover`. At `1185×700`, the rendered reel measured `393.8×700` (ratio `0.5626`, target `0.5625`) and remained centred.
- Anchored reel controls to the real portrait frame rather than the browser width. The comment tray measured `377.8×130.8`, stayed 8px inside the canvas, and all three comment buttons remained available in one row. Moved the `СТОЛ` exit control below the top raid HUD; it stayed inside the portrait frame and did not intersect the comment tray.
- Rechecked gameplay feedback in the corrected layout. A comment raised provocation from `0%` to `20%`, the value decayed frame by frame, and Stas's retaliatory fire reduced the test Drifter from `110` through `102 / 94 / 87`, confirming that the layout work did not break comments, HUD updates or return fire.
- Rechecked the mode transition: `ВЫЙТИ` hid raid controls, removed `raid-mode`, restored the normal pre-wave status and preserved the selected reel display mode. Production `window.__dev` and `window.__gfx` remained `undefined`.
- Completed a final hard-reload pass through desktop → reel → exit. Both modes had exact viewport scroll dimensions, no horizontal or vertical overflow, and the clean browser console contained zero matching errors, warnings, failed loads, 404s, `TypeError`s or `ReferenceError`s. No `TEMP DEBUG:` markers remain in production files.


### 63. Post-fullscreen regression for normal, cinema, reel, and picker modes
- Rechecked the normal production shell after the Hater Raid viewport changes. At `1185×700`, the desktop canvas measured `741×463.1`, the header and sidebar remained in normal document flow, the exit control stayed hidden, the quiet-yard instruction remained visible, and no raid/display classes leaked into `body` or `html`.
- Reproduced the normal reel overlap reported after the fullscreen work: the DOM status strip and `СТОЛ` exit action occupied the same upper-right lane as the canvas-owned wave/night plate. The same exit placement was unsafe in cinema because that corner is permanently reserved by the canvas HUD.
- Added explicit fullscreen HUD safe zones in `src/styles.css`. Cinema now constrains status to a `min(48vw, 520px)` upper-left lane and anchors exit 16px inside the lower-right of the rendered canvas. Reel moves status below the canvas instruments at `top: 88px` and anchors exit 12px inside the lower-right edge.
- Measured cinema at `1185×700`: canvas `1120×700` at `x=32.5`, status `(48.5,16) 435.9×38.2`, exit `(1048.5,640) 88×44`. Both controls remained inside the canvas; neither intersected the measured upper-right wave/night safe zone.
- Measured reel at the same viewport: canvas `393.75×700`, exact ratio `0.5625`; document scroll size `1185×700`. Status `(407.6,88) 369.8×38` did not intersect the wave/night plate, and exit `(689.4,648) 88×40` intersected neither the upper-right plate nor the lower-left player/heat panel. Both controls remained inside the portrait frame.
- Rechecked the Hater Raid picker before active viewport takeover. It opened as a `1185×700` fixed overlay while `raid-mode` remained false; the `880×446.8` card, all six `88px` roster choices, and both `44px` actions remained inside the card and viewport. Closing it restored the unchanged normal shell.
- Repeated cinema → desktop and reel → desktop transitions. Cinema removed page chrome only while active; reel added `body.reel`, `html.reel`, and `?reel=1` only while active. Both exits restored empty mode classes, the original URL, header/sidebar, hidden exit control, and normal document scrolling.
- Ran one final production mode cycle with local `error` and `unhandledrejection` capture: cinema → desktop → reel → desktop → picker → close produced zero captured issues. `window.__dev`, `window.__gfx`, and `window.__rig` remained undefined, and Resource Timing contained no HTTP responses `>=400`.
- Two log entries were test-environment artefacts rather than product defects: Fullscreen API rejects scripted clicks without a real user gesture while CSS cinema mode still activates, and one earlier `SyntaxError` came from a malformed browser measurement snippet. A hard reload plus the clean captured mode cycle produced no application error.
- No `TEMP DEBUG:` markers remain in production JavaScript, HTML, or CSS.

## 2026-08-24 — Main interface cleanup and regression

1. **08:44 UTC — Audited the remaining game shell.** Confirmed that the `workbench`, `found salvage`, `test notes`, `home preparation`, weapon selector and trap/turret/reinforcement controls still existed as a physical right sidebar in `index.html`.
2. **08:45 UTC — Removed obsolete interface panels and related buttons.** Deleted the full sidebar markup and the duplicate trap-placement hint; retained only the gameplay canvas, compact HUD, mode controls and the contextual `F` music prompt.
3. **08:46 UTC — Expanded the main scene.** Changed `.layout` to a single fluid column so the canvas uses the width previously reserved for the sidebar.
4. **08:47 UTC — Hardened runtime initialization.** Made legacy panel renderers, preparation-state synchronization and event binding tolerant of absent optional DOM controls. This preserves the underlying gameplay systems without recreating their removed developer UI.
5. **08:49 UTC — Ran clean-load UI regression.** Verified zero sidebar/panel/control nodes, no horizontal overflow, canvas size `1127×704`, and no console errors or failed asset requests.
6. **08:49 UTC — Verified pre-wave movement.** Held physical `KeyA` before the wave; canvas output changed, confirming left movement remains active during preparation.
7. **08:50 UTC — Verified the main mode.** Triggered `ВКЛЮЧИТЬ ПЕСНЮ ЗОМБИ`; the state advanced to wave `1/6`, enemies spawned, shelter HP and counters updated, and the button changed to `ЗОМБЭ ИГРАЕТ`.
8. **08:50 UTC — Completed runtime regression.** Confirmed removed controls do not return during combat, viewport has no horizontal overflow, and the browser console remains clean.

**Result:** the main defense mode now presents one uninterrupted gameplay surface. The obsolete side-panel workflow and all its visible buttons are removed; movement, song activation and wave startup continue to work.

### 64. Regenerated the Stas mode card and added reliable side-selection colour states
- Reproduced the mode-card crop defect in the live desktop UI: the previous portrait artwork could show Stas's head or the speaker, but not the complete head, shotgun and speaker together inside the real near-square card viewport.
- Re-read the existing GPT Image metadata and regenerated `assets/ui/start/stas-mode.png` as a native `1024×1024` composition. The prompt now requires the full head, shoulders, complete pump-action shotgun, both shoes and the complete speaker cabinet to stay inside the central safe area.
- Updated the start-card cache revision to `v=3` and improved its alternative text. A hard reload confirmed the browser uses the new `1024×1024` file rather than the cached portrait version.
- Verified the live card at `451×434`: Stas's head, complete silhouette, shotgun and speaker remain visible simultaneously with `object-fit: cover`; no special top crop is needed.
- Added a blue Stas selection grade and border glow, plus a red zombie selection grade and border glow. The colour change affects the scene background without tinting or damaging the source artwork.
- Made the state input-independent with explicit `data-selection` synchronization for `pointerenter`, `pointerdown`, `focusin`, `pointerleave` and `focusout`, while retaining CSS hover/focus fallbacks.
- Browser-tested all paths: mouse selected the blue Stas state, keyboard focus selected the same blue state with `tabIndex=0`, and a touch-style pointer event selected the red zombie state. The measured gradients resolved to the intended blue and red values.
- Confirmed the regenerated image loads at `1024×1024`, the mode scene remains visible and interactive, and the final browser console contains zero matching errors, warnings, 404s or failed loads.

### 65. Start/end-scene regression: terminal overlap fix and display-mode evidence
- Tested the start selector in the live runtime. Cinema and reel state classes preserve the active scene; desktop selector cards measure `453×513` and have no horizontal overflow.
- Reproduced a real P1 terminal defect in the opt-in harness: `#scene-cards.hidden` still rendered beneath every result screen because the author rule `.scene-cards { display:grid }` overrode the browser `[hidden]` rule.
- Fixed it in `src/styles.css` with `.scene-cards[hidden]{display:none!important}`. This affects only terminal scenes and retains the two-card grid when returning to the selector.
- Re-ran all four terminal mappings in reel state: `stas-victory`, `stas-defeat`, `zombie-victory`, `zombie-defeat`. Every result now hides the cards, shows its result panel/actions, and maps to the expected image, title and stamp.
- Verified a visible zombie-defeat final after the patch: no selector-card bleed-through, readable artwork, title and both actions.
- Re-ran Stas victory from a clean desktop into cinema: cinema active, reel inactive, cards `display:none`, final art visible at `518×490`, no horizontal or vertical viewport overflow.
- Verified cinema rollback: selecting `ВЫБРАТЬ СТОРОНУ` then exiting cinema restores desktop menu state (`cinema:false`, `reel:false`, cards `display:grid`, result hidden). The normal desktop document remains vertically scrollable because the game canvas is taller than the 700px browser viewport; this is content height, not horizontal layout overflow.
- Re-opened the production URL after testing: `window.__dev` is `undefined`, selector remains visible, both cards are sized correctly and there is no horizontal overflow.
- Console has no runtime asset, application, warning or 404 entries. The retained three `requestFullscreen` info messages came from automated JavaScript clicks outside a trusted browser user gesture during this regression, not from production interaction.
- Physical narrow 9:16 viewport capture remains open: this session is restricted to browser tabs and cannot resize a tab window; the reel class and its final-state mapping were tested, but a real narrow-device visual capture is still required before signing off the layout checklist.

### 66. Custom-only zombie picker and selected-skin raid regression
- Replaced the Hater Raid roster with the seven custom characters only: `glamour_drifter`, `office_runner`, `heavy_spitter`, `silent_stalker`, `bespectacled_teacher`, `boss_zombie`, and `big_russian_boss`. Removed `drifter`, `runner`, and `spitter` from both the picker and normal-wave scenario pools.
- Added live animated-sheet previews to every picker card, retained one-and-only-one `aria-pressed` selection, grouped the controls with an accessible label, and preserved keyboard focus on the newly selected card.
- Verified all seven preview canvases contain opaque character pixels and all seven choices switch correctly without duplicate selected states.
- Verified the chosen `silent_stalker` starts Hater Raid as the actual runtime player type. Fixed a focus bug where the generic `releaseFocus` wrapper immediately blurred the game canvas after starting; the canvas now receives focus and physical-key input immediately.
- Held physical `KeyA` in desktop Hater Raid and confirmed the selected zombie moved left from `x=472.94` to the world bound at `x=20` while the raid remained active.
- Started normal wave 5 through the opt-in harness and observed 20 spawned zombies across the six intended custom wave types, with zero `drifter`, `runner`, or `spitter` IDs.
- Reproduced a reel-only P1 layout defect: the picker remained an `880px` desktop modal outside the portrait game frame. Added a reel-specific `9:16` picker viewport, two-column compact cards, bounded internal roster scrolling, and mobile action sizing.
- Revalidated reel at `1185×700`: picker width `393.75px` exactly matches `700×9/16`, the card fits vertically, actions remain visible, the document has no horizontal overflow, and all seven custom choices remain reachable.
- Started reel Hater Raid with `big_russian_boss`; runtime type and phase resolved correctly, canvas focus was retained, the HUD stayed inside the portrait frame, all three taunts were available, and physical `KeyA` moved the character from `x=480` to `x=86.35`.
- Hard-loaded the production URL without query flags. `window.__dev` is absent, start artwork loads, no horizontal overflow appears, and the current page added no application errors, warnings, failed loads, 404s, `TypeError`s, or `ReferenceError`s. Historical Fullscreen API information entries remain test-environment artifacts from scripted clicks.

## 2026-08-24 — Hater Raid AI zombie company

### 1. Added the non-selected zombie company
- Extended `createHaterRaid()` so every custom roster member except the player-selected type spawns as an AI companion.
- Kept the controlled zombie as the raid leader and reused the existing directional `idle / walk / attack` animation pipeline for all companions.
- Added companion HP, hit flash, attack cooldown, speaker damage, death filtering, and Stas projectile targeting.

### 2. Removed Big Russian Boss from active gameplay
- Removed `big_russian_boss` from the Hater Raid roster, zombie data, normal scenario bonus wave, and runtime master-image map.
- Kept `boss_zombie` as the existing brunette custom-zombie character; it remains selectable and joins the company whenever another type is selected.

### 3. Fixed doorway navigation
- The first browser run showed companions stopping at the south wall because they switched from the exterior doorway waypoint to the speaker before crossing the wall band.
- Replaced the single waypoint with aligned exterior and interior doorway waypoints.
- The second run showed companions re-evaluating alignment after entering and returning toward the doorway.
- Added a persistent `entered` flag so each companion permanently targets the speaker after crossing the interior waypoint.

### 4. Fixed visual stacking at the speaker
- The first successful entry test placed all companions on the same attack coordinate.
- Added stable companion slot indices and five fan-shaped attack positions around the speaker.
- Kept every slot inside the shelter and within attack range, preserving readable silhouettes and separate HP bars.

### 5. Ran controlled browser validation
- Selected `silent_stalker`; runtime created five companions: `glamour_drifter`, `office_runner`, `heavy_spitter`, `bespectacled_teacher`, and `boss_zombie`.
- Confirmed the selected type was absent from the companion list and `big_russian_boss` was absent from the roster and runtime company.
- Disabled Stas fire for the navigation control run. All five companions crossed the doorway, set `entered: true`, occupied five unique coordinates, attacked the speaker, and reduced speaker HP from `260` to `0`.

### 6. Ran live retaliatory-fire validation
- Selected `office_runner` and ran the encounter with normal Stas fire enabled.
- The five initial companions entered the shelter and damaged the speaker from `260` to `170` during the measured window.
- Stas killed `glamour_drifter` and `heavy_spitter`, damaged `silent_stalker` to `4 HP`, and continued targeting the surviving company while they remained in `attack` animation state.
- Confirmed the live phase remained active, proving companion deaths no longer break raid state or speaker attacks.

### 7. Checked runtime diagnostics
- No current gameplay exceptions, undefined values, or asset errors appeared during the final raid runs.
- Console filtering returned only three historical `requestFullscreen` informational messages caused by programmatic fullscreen calls without a user gesture; none originated from the AI-company implementation.

## 2026-08-24 — Hater Raid speaker audio regression

1. Traced raid startup and found `startHaterRaid()` explicitly stopped the speaker track while the raid update returned before the shared speaker-mix update.
2. Changed raid startup to unlock WebAudio from the user gesture and call `blareSpeakers(speakers)`, so Stas starts the ZOMBE track when the raid begins.
3. Added raid-loop speaker updates using the controlled zombie position and shelter interior state; verified distance volume, fade and indoor/outdoor low-pass state remain active.
4. Added a dedicated `audioEvents` queue to Hater Raid and emitted `speaker_hit` for both controlled-zombie and AI-companion attacks.
5. Added and registered `speaker_hit` in `src/audio.js`; removed the duplicate direct impact trigger from the input handler.
6. Generated `assets/sfx/stas_shot.wav`, then regenerated it as a single realistic close 12-gauge blast with no pump, reload, sci-fi or arcade tail.
7. Registered `stas_shot` and emitted it for every retaliatory Stas shot.
8. Browser regression: ZOMBE track was on and unpaused; WebAudio state was `running`; fade reached `1`; spatial mix updated between muffled exterior and clear interior states.
9. Controlled-player impact regression: speaker HP changed `257 → 243`, `speaker_hit` playback timestamp advanced to `43.3333`, and the event queue drained.
10. AI-companion impact regression: speaker HP changed `260 → 238`, `speaker_hit` playback timestamp advanced to `169.2533`, and the event queue drained.
11. Stas-fire regression: `stas_shot` decoded successfully and its playback timestamp advanced during retaliatory fire.
12. Final clean-session assertions: track playing, `stas_shot` and `speaker_hit` decoded, no captured `error`/`unhandledrejection`, and no 404, decode, AudioContext, TypeError or ReferenceError entries in the runtime console.

## 2026-08-24 — Audible Stas shotgun hotfix

1. Confirmed by direct user playback that the previous `stas_shot.wav` container existed but its signal was not audibly usable.
2. Regenerated `assets/sfx/stas_shot.wav` with the ElevenLabs SFX template as a single realistic close 12-gauge blast.
3. Applied EBU R128 normalization, then raised the final file to 200% for clear separation above the ZOMBE speaker track.
4. Added an immediate procedural shotgun fallback so the first retaliatory shot is audible even before WAV fetch/decode completes.
5. Raised the dedicated `stas_shot` sample gain and fixed first-event throttling so the initial shot cannot be suppressed near AudioContext startup.
6. Added `?v=5` cache busting to the runtime sample URL and hard-refreshed the game.
7. User directly auditioned the standalone regenerated WAV and confirmed that the sound is present.

### 2026-08-24 11:55 UTC — GPT zombie portrait picker framing
- Replaced sprite-frame previews in all six Hater Raid selection cards with the existing stylized GPT portraits.
- Wrapped each portrait in a clipped 72×72 viewport and adjusted the shared crop to `width: 170%`, `left: -35%`, `top: -12px`, keeping every face visible while preserving some costume context.
- Verified all six 1152×2048 portrait files load successfully in the browser.
- Verified card selection and `aria-pressed` state using `bespectacled_teacher`.
- Verified desktop and 9:16 reel picker layouts with zero horizontal overflow.
- Verified the production console has no errors, warnings, failed loads, 404s, `TypeError`, or `ReferenceError` entries.

### 2026-08-24 12:03 UTC — Unified Stas shotgun SFX
- Traced the mismatch to `fire()` in `src/game.js`: normal Stas mode still emitted the legacy `shot` cue, while Hater Raid emitted `stas_shot`.
- Replaced the successful normal-mode fire cue with `stas_shot`; jam, backfire, and noise-spike cues remain intentionally distinct.
- Hard-reloaded the browser and confirmed `assets/sfx/stas_shot.wav?v=5` was requested successfully (384402 transferred bytes) in the Stas game scene.
- Confirmed both game modes now resolve ordinary Stas gunfire to the same improved WAV registered in `src/audio.js`.
- Reopened Stas mode from a hard reload, fired through the real canvas input path, and confirmed the improved WAV was loaded at 384402 transferred bytes. No new runtime/audio errors appeared; the console retains one older syntax error caused by a previous malformed diagnostic snippet, not application code.

### 2026-08-24 14:06 UTC — New zombie roster batch 01 identity pass
- Cataloged nine submitted zombie identities and mapped every source photo to a stable runtime ID in `meta/docs/new-zombie-roster.md`.
- Classified Communist Nikita, Vomiting Alexander, Cat Keeper, Dog Handler, Injured KUOK and the tiny Lilliput zombie as bespoke silhouettes/mechanics; classified Blonde Crowd, Brunette Crowd and Plaid Glasses as unique crowd skins using shared animation families.
- Defined the no-duplicate-per-level rule: each named identity may spawn only once in a run; additional enemies must be drawn from unused identities or legacy generic variants.
- Created a dedicated generation plan at `meta/plans/new-zombie-roster-batch-01.md`.
- Created nine GPT Image reference-driven identity meta sections in `meta/files/assets/zombies/new-batch-01/`.
- Generated Communist Nikita with faded Soviet-red field jacket, red armband and red-star cap.
- Generated Vomiting Alexander as a hunched spitter silhouette with stomach-bracing pose and infected residue around the mouth.
- Generated Cat Keeper with the supplied black cat across her shoulders, keeping both hands free and the paired silhouette readable.
- The first Dog Handler request hit a temporary `gpt_image` node availability error; checked the cluster, confirmed the requested utility remained online, retried the same model without switching tools, and generated the woman with her black-and-white dog.
- Generated the blonde, brunette and plaid-glasses submissions as distinct standard crowd zombie skins.
- Generated Injured KUOK on two crutches, with one leg in a large cast and a bruised face, keeping the injury readable without graphic gore.
- Generated the tiny Lilliput zombie beside a soda can scale reference; marked runtime scale and hitbox reduction as mandatory rather than baking the joke only into perspective.
- Compared all nine results in a single contact sheet. Full bodies and key props are visible, palettes are cool-neutral without the rejected orange/sepia cast, and silhouettes are distinct enough to proceed to approval.
- No animation or runtime integration was started yet; the identity lineup must be approved before multiplying it into directional clips and sprite sheets.

### 2026-08-24 14:11 UTC — KUOK boss and Communist Nikita refinement
- Reopened the GPT Image reference-edit workflow and reviewed both existing meta sections before changing generation inputs.
- Promoted `injured_kuok` from special bruiser to boss in the roster.
- Regenerated KUOK from the existing identity plus both original references as a low-angle fallen concert-headliner boss: one crutch raised as a weapon, one planted for support, oversized metal-braced cast, bruised face, black stagewear, broken truss and microphone debris.
- Preserved KUOK's readable face, tattoos, complete cast, both crutches and full-body silhouette while strengthening boss scale and attack language without graphic gore.
- Regenerated Communist Nikita from the existing identity plus the original portrait with a faded red greatcoat, prominent red-star cap, hammer-and-sickle armband, medal ribbons, star buckle and rolled workers' banner.
- Compared the two outputs side by side and confirmed the revised hierarchy reads immediately: KUOK now presents as a boss, while Nikita's communist attributes remain visible at reduced game scale.
- Updated `meta/docs/new-zombie-roster.md` and `meta/plans/new-zombie-roster-batch-01.md`; animation production remains pending approval of the revised identities.

### 2026-08-24 — New zombie animation pipeline and Lumberjack addition
- Reviewed the available character-animation workflows: `gen_game_char_top_down`, `gen_video_wan_api`, `motion_generate_video_flux3`, `image_to_video_kling`, `image_or_video_to_video_seedance`, `gamedev_convert_video_to_sprite_sheet`, and `webp_to_sprite_grid`.
- Selected a pilot-first pipeline: generate only Communist Nikita `walk_down` and `attack_down`, validate identity/motion/alpha/anchor in runtime, then scale the approved settings across the roster.
- Assigned standard 4-direction idle/walk/attack sets to crowd identities; bespoke action sets to Alexander, Lilliput, Lumberjack and KUOK; KUOK remains last because boss locomotion and crutch attacks need separate tuning.
- Added the supplied red-haired friend as `lumberjack_zombie`, a special bruiser with a two-handed axe and slow overhead chop.
- Generated the approved identity anchor at `assets/zombies/new-batch-01/lumberjack_zombie.png` and added it to `meta/docs/new-zombie-roster.md`.
- Updated `meta/plans/new-zombie-roster-batch-01.md` with production order, direct MP4-to-transparent-sheet conversion, runtime integration and regression tasks.

- Added the newly submitted tattooed woman as `tattooed_crowd_zombie`, a standard crowd identity with no bespoke combat mechanic.
- Generated the approved-style full-body identity anchor at `assets/zombies/new-batch-01/tattooed_crowd_zombie.png`, preserving her long dark curls, pale wrap top and distinctive black broken-heart chest tattoo.
- Added her reference, runtime role and shared-animation requirements to `meta/docs/new-zombie-roster.md` and `meta/plans/new-zombie-roster-batch-01.md`.
- Planned animation: shared four-direction `idle`, `walk` and `attack` family, with restrained hair sway, stable feet anchor and the chest tattoo readable in front-facing frames.
- Retried Communist Nikita `walk_down` and `attack_down` WebP-to-grid conversion after adding the template-required `PROMPT` fields. Generation completed but validation found both outputs were single 784×1176 RGBA frames rather than 4×4 512×512 sheets, so the pilot remains open and these files are not approved for runtime.

## 2026-08-24 — Friendly ninja-zombie ally: level-one runtime core

1. Re-read `meta/plans/new-zombie-roster-batch-01.md`; confirmed the roster plan remained `in_progress` and added a dedicated friendly-ninja checklist.
2. Reviewed the approved GPT identity and generated `assets/allies/ninja_parkour_zombie_runtime.png` as a genuine RGBA cutout using the transparent-image workflow.
3. Registered the ally sprite and level-one combat constants in `src/game.js`.
4. Added `ninjaAlly` to fresh game state so the ally appears immediately before the first song/wave starts.
5. Implemented autonomous AI: follow Stas during preparation/breaks, route through the shelter's south doorway, select the nearest living hostile during waves, and attack without player input.
6. Implemented spinning-kick damage, chorus damage boost, blood/impact/shake feedback, kill tracking, and protection from hostile targeting.
7. Added runtime rendering with a cyan friendly marker, `СОЮЗНИК · НИНДЗЯ` label, readable shadow, fallback silhouette, and circular spinning-kick trails.
8. Opened the Stas route in browser and confirmed the ninja is visible from level one with no wave active.
9. Moved Stas using a physical `KeyD` event; the ally followed him autonomously.
10. Started wave one and allowed the simulation to run without player firing. The ally pursued the wave, defeated all four hostiles, and the game entered the normal `ВОЛНА ОТБИТА` break state with shelter HP still at 1000.
11. Checked browser console output after combat: no syntax, reference, uncaught, NaN, or runtime errors were reported.
12. Captured validation screenshots at `.temp/images_from_tools/0824_191952727_brw_ss.png` and `.temp/images_from_tools/0824_192051122_brw_ss.png`.
13. Next production stage: generate four-direction idle/run/spinning-kick Kling clips, convert them directly into transparent 4×4 128×128 sheets, replace the static cutout, and validate anchors/direction order in-browser.

## 2026-08-24 — Friendly ninja-zombie ally: support-balance regression

1. Reduced the ally from `205` to `125` movement speed, from `34` to `12` base kick damage, and increased attack recovery from `0.62s` to `1.25s`.
2. Reduced the chorus modifier from `1.55×` with faster recovery to `1.25×` damage without recovery acceleration; also reduced blood and camera-shake feedback to match the weaker hit.
3. Added a shelter-relative patrol rectangle with a `105px` margin. The ally only targets hostiles inside this zone, follows Stas only while Stas remains inside it, and is hard-clamped to its bounds.
4. Added a development snapshot hook, `window.__ninjaDebug()`, exposing tuning, ally state, patrol bounds and hostile positions for deterministic browser inspection under `?dev`.
5. Ran an initial no-player-fire browser simulation. The configured `12` damage, `1.25s` cadence and `125` maximum speed were active, but the ally eventually killed all four first-wave hostiles; this failed the intended support-only role.
6. Added `maxSoloKillsPerWave: 1`, reset the counter at each wave, and changed post-cap attacks to reduce targets only to `1 HP`. Targets already at `1 HP` are ignored until Stas finishes them.
7. Re-ran wave one with no player firing and collected `819` telemetry samples over `40.899s`.
8. Verified attack cadence: `17` attacks recorded, with a median reset interval of `1250ms`; longer gaps were pathing/target-acquisition time rather than extra attacks.
9. Verified movement: sampled 95th-percentile movement speed was exactly `125.0 px/s`, matching the configured cap.
10. Verified patrol restriction: configured bounds were `x 239–721`, `y 275–685`; observed ally bounds were `x 336.57–623.59`, `y 372.57–650.76`, always inside the shelter patrol zone.
11. Verified the solo-kill cap: the ally recorded exactly `1` kill, while the three surviving first-wave hostiles remained alive at `1 HP` each for Stas to finish. The wave correctly remained active instead of auto-completing.
12. Verified the browser console after the final run: no syntax, reference, uncaught, NaN or runtime errors were reported.


## 2026-08-24 — Friendly ninja: alpha-sheet recovery and runtime regression
1. Re-read `gamedev_convert_video_to_sprite_sheet`; confirmed expected outputs are alpha video plus 4×4 `128×128` sheet.
2. Audited all 12 Kling outputs: `idle/run/kick × down/up/left/right` alpha WebM sources existed. The backend did not emit its requested PNG sheets, so the approved local fallback assembled the 12 sheets.
3. Found the BRIA preview checkerboard baked as opaque RGB pixels into the WebM frames. Rebuilt all 12 sheets with a conservative neutral-checkerboard cleanup pass.
4. Validated all output files: 12/12 are `512×512 RGBA`, have 16 non-empty `128×128` tiles, transparent outer corners, and unified bottom-anchor `y=120`.
5. Updated `src/game.js` to choose `idle`, `run`, or `kick` sheet from ally state and four-way facing, retaining the old cutout only as a load-failure fallback. Bumped asset revision to `20260824-kling-alpha-v2`.
6. Browser regression: all 12 sheet resources loaded; no console errors; wave 2 observed with ninja `attackTimer=0.2466`, `attack=1.2166`, one kill cap in the active wave, and targets restricted to patrol bounds. Screenshot captured during live kick state.
7. Result: friendly ninja animation pipeline is complete. Next production stage: Communist Nikita pilot `walk_down + attack_down`, then validate it before producing the larger zombie roster.


## 2026-08-24 — Friendly second defender: wave-three support pass

1. Re-read the active roster plan and the transparent-image and Kling animation templates before continuing the ally work.
2. Verified `assets/allies/second_defender_runtime.png`: 1024×1536 RGBA PNG created by the rembg background-removal workflow; it is the runtime cutout rather than an opaque portrait fallback.
3. Added the second defender to session state only when wave three is armed. The real `startNextWave()` trigger now creates the ally beside the shelter and announces `ПОДДЕРЖКА ПРИБЫЛА · ВТОРОЙ ЗАЩИТНИК`.
4. Reused the proven support contract from the ninja: 125 px/s, 12 damage, 1.25 s recovery, 27 px range, 105 px shelter patrol leash and one autonomous finishing kill per wave. Hostiles beyond the patrol zone are ignored.
5. Added a distinct positive formation offset for the defender while retaining the ninja's negative offset, preventing the two allies from occupying the same position while following Stas.
6. Added `window.__startThirdWaveProbe()` in dev mode to invoke the actual wave-three path instead of creating a fake ally. Browser output confirmed the real trigger, defender state and patrol bounds.
7. Browser combat check: after the third-wave probe, the defender moved inside the `x 239–721`, `y 275–685` patrol rectangle and recorded exactly one kill; no console errors or exceptions were present.
8. Captured the clean pre-wave scene and found ally labels were being cut by the roof mask. Moved both friendly markers below their feet, preserving the cyan team read without masking. Final screenshot: `.temp/images_from_tools/0824_211736325_brw_ss.png`.
9. Closed all five second-defender tasks in `meta/plans/new-zombie-roster-batch-01.md`. Next production stage remains the Communist Nikita `walk_down` / `attack_down` animation pilot, then the batch roster pipeline.


## 2026-08-24 — Communist Nikita four-direction continuation

1. Re-read the active roster plan and re-checked the Kling, transparency, and video-to-sprite templates.
2. Validated existing `walk_down_kling.png` and `attack_down_kling.png`: both are 512×512 (4×4 cells of 128×128) with real alpha. Pixel validation confirmed transparent and opaque areas; anchor bounds were inspected. Runtime preview confirmed readability at game scale.
3. Generated a consistent four-direction Nikita master, then ran a transparency pass. Alpha validation: 1024×1024, 821,082 fully transparent pixels, 21,550 opaque pixels, and 205,944 antialiased edge pixels.
4. Cropped approved directions: down, right, left, up. Created and completed six Kling clips for walk/attack right, left, and up.
5. Created six `video_background_removal` jobs with the official `MAKE_SPRITE_SHEET_FILE`, 128×128 tile, fixed 4-column settings. The service produced all six WebM outputs but did not create any requested PNG sheets. Re-run of `walk_right` produced the same result. This is a backend output omission, not a metadata mismatch: the fields match the working down job and the official template.
6. Recorded blocker: do not mark the full Nikita set or sheet pipeline complete until six missing PNG sheets are delivered. Continue production with the remaining four-direction masters in parallel so this backend omission does not block the roster.


## 2026-08-24 — Roster master block

1. Continued the approved Kling-first animation pipeline after validating Nikita's pilot output.
2. Generated and alpha-cleaned ten four-direction masters: blonde crowd, brunette crowd, plaid glasses, tattooed crowd, Vomiting Alexander, Cat Keeper, Dog Handler, Lilliput, Lumberjack and boss KUOK. The first four were completed before this block; the latter six were generated and alpha-cleaned in parallel in this block.
3. Confirmed all masters are 1024×1024 RGBA PNGs. Four-direction grid ordering is consistent: down, right, left, up.
4. Preserved visual hooks for later bespoke runtime mechanics: cat, dog/lead, Lilliput scale, lumberjack axe and KUOK's cast/crutches.
5. Next: crop alpha masters into directional Kling inputs; produce clips in cohorts and assemble 4×4 runtime sheets after the proven Nikita pattern.


## 2026-08-24 — First motion cohort

1. Cropped alpha-clean down/front inputs for Alexander, Cat Keeper, Dog Handler, Lilliput, Lumberjack and KUOK.
2. Drafted the six corresponding Kling `walk_down` jobs, then generation correctly stopped with `Missing required field: UTILITY`.
3. Re-inspected the official `image_to_video_kling` template and corrected the sections to its exact schema: `UTILITY: kling`, `MODE: video_generation`, `QUALITY_MODE: pro`, `CREATIVITY`, `ASPECT_RATIO`, and `IMAGE_URL`.
4. Reran the same six jobs with no model switch. All completed as 1440×1440, 24fps, ~5.04s H.264 MP4s, 121 frames, and no audio stream.
5. Next: visual/alpha cleanup validation, then convert this cohort to transparent 4×4 128×128 runtime sheets before multiplying the remaining direction/action jobs.


## 2026-08-24 — First motion cohort: sprite-export verification

1. Re-read the active roster plan and the official `gamedev_convert_video_to_sprite_sheet` specification before validation.
2. Confirmed all six Kling `walk_down` source MP4s exist and are valid 1440×1440, 24fps, ~5.04s clips.
3. Ran the template-prescribed `video_background_removal` conversion with `BACKGROUND_COLOR: Transparent`, `webm_vp9`, fixed 4 columns, 128×128 tiles and `MAKE_SPRITE_SHEET_FILE`.
4. The backend returned six WebM files but emitted none of the six requested PNG sheets. Direct file inspection confirmed each expected PNG is absent.
5. Checked a representative output: the WebM is VP9 `yuv420p`, so it does not expose an alpha pixel format despite the transparent request.
6. Retried Alexander once with the documented alpha-capable `mov_proresks` / ProRes 4444 container and a project-local sheet target. The MOV was generated, but its reported pixel format is still `yuv444p12le` rather than alpha and the requested PNG remains absent.
7. Result: this is a reproducible backend sprite/alpha-output omission, not a metadata mismatch. The six original Kling clips remain valid; **no runtime sheet is marked complete**. Do not substitute static masters as fake animation.
8. Next: keep the current cohort blocked at transparent-sheet export, use the previously approved local alpha-sheet recovery method only if its exact helper becomes available, then validate 4×4 dimensions/alpha/anchors before runtime integration.


## 2026-08-24 — Communist Nikita: transparent animation pipeline resumed
1. Re-read `meta/plans/new-zombie-roster-batch-01.md`: roster production remains `in_progress`; standard crowd, special sets, runtime integration and browser regression are still open.
2. Confirmed the converter issue: the requested direct PNG-sheet path is unreliable, while alpha-WebM clips are already present for Nikita.
3. Replaced the failed PyAV reader with FFmpeg frame extraction. Built 12 deterministic 512×512 contact sheets (`idle/walk/attack × down/up/left/right`), each a 4×4 grid of 128×128 frames.
4. Used the approved `make_image_transparent` / `rembg` template on all four Nikita idle sheets. Output: `assets/animations/sheets/communist_nikita/idle_{down,up,left,right}.png`.
5. Validated all four idle sheets: PNG, RGBA alpha present, 512×512, fixed 4×4 layout. Visual review confirms preserved silhouette and direction. Next: process walk and attack contact sheets through the same verified rembg path, then test runtime anchors.


## 2026-08-24 — Communist Nikita: full sheet set and first runtime integration
1. Re-read `meta/plans/new-zombie-roster-batch-01.md`; overall roster remains `in_progress`.
2. Built and cleaned the remaining `walk` and `attack` directions with the verified `make_image_transparent` rembg pipeline, preserving existing 4×4 frame positions.
3. Validated all 12 Nikita PNG sheets: `512×512`, `RGBA`, 16 cells each at `128×128` (`idle/walk/attack × down/up/left/right`).
4. Added `communist_nikita` to `data/zombies/zombies.json` and registered the animated runtime ID, 76px render size, 1.08 animation scale, and a valid alpha-master fallback path in `src/game.js`.
5. Added Nikita to mixed waves 2–5 in `data/scenarios/first-night.json` for first integration coverage. This is not yet the final shuffle-bag/no-repeat system.
6. Next: run browser validation for sheet decoding, idle/walk/attack transitions and mixed-wave spawn; then continue the same pipeline for the next crowd zombie.
7. Browser smoke test at `http://localhost:9276/index.html`: game loaded without console errors; Stas mode and wave start work. Browser-side decode audit loaded all 12 Nikita sheets successfully at exactly `512×512`. Captured the live game frame. Full Nikita in-wave visual/combat regression remains queued because wave 1 intentionally contains no Nikita; he first appears in the mixed wave-2 roster.

## 2026-08-24 — Tattooed Crowd Zombie: animation pipeline started
1. Re-read `meta/plans/new-zombie-roster-batch-01.md`: Communist Nikita is the completed pilot; standard crowd, specials, alpha conversion and roster runtime work remain open.
2. Re-checked the Kling image-to-video and video-edit templates. Kept the established Kling-first source-animation pipeline.
3. Validated `assets/zombies/new-batch-01/masters/tattooed_crowd_zombie_4dir_master_alpha.png`: 1024×1024 RGBA.
4. Cropped its approved 2×2 directional master to four transparent 512×512 temporary direction inputs: down, right, left, up.
5. Authored four Kling idle meta-sections (`idle_down/up/left/right`) with locked camera, full-body framing, preserved wrap top/curls/tattoo and no-background constraints.
6. Submitted all four idle sources. `idle_left` succeeded: 5.042 sec H.264, 1440×1440, 24 fps, no audio. The concurrent down/up/right requests were rejected for insufficient Kling credits (required 96.00; available 66.92), so no alternative model was selected.
7. Next: obtain approval for an alternative video model or additional Kling credits, then finish the remaining 11 clips and alpha-to-sheet conversion.
8. Extracted a 1 fps audit sequence from `tattooed_crowd_zombie_idle_left.mp4`; motion preserves the Tattooed Crowd Zombie identity and full body, but source frames have a dark studio background.
9. Used the reviewed `gamedev_convert_video_to_sprite_sheet` template exactly: `video_background_removal`, `bria`, `Transparent`, `webm_vp9`, autocrop, 128×128 tiles, step 8, 4 columns. The utility produced only `idle_left_alpha.webm`; expected `idle_left.png` was omitted. Video metadata reports `yuv420p`, so the delivered WebM does not expose an alpha pixel format either. This reproduces the plan’s recorded converter blocker; no manual/frame-extraction workaround was used because the template explicitly prohibits it.

## 2026-08-24 — Tattooed idle_left: direct-converter retry
1. Re-consulted `gamedev_convert_video_to_sprite_sheet` and its required settings: `video_background_removal`, transparent background, alpha-capable WebM, 128×128 tiles and explicit `MAKE_SPRITE_SHEET_FILE`.
2. Re-ran the existing valid meta-section unchanged against `tattooed_crowd_zombie_idle_left.mp4`.
3. The generation call returned success and rewrote `assets/animations/sheets/tattooed_crowd_zombie/idle_left_alpha.webm`.
4. Output audit: the target directory contains **only** `idle_left_alpha.webm`; the mandatory `assets/animations/sheets/tattooed_crowd_zombie/idle_left.png` is still absent.
5. WebM audit: VP9 Profile 0, 1440×1440, `yuv420p`; no exposed alpha pixel format. It is not a usable transparent runtime asset.
6. Cluster inspection: the integration node is online and advertises `video_background_removal`. The evidence points to a sprite/alpha packaging failure in that utility call, not an offline node.

## 2026-08-24 — Tattooed Crowd Zombie: idle_left sheet repaired
1. Re-read `meta/plans/new-zombie-roster-batch-01.md`; roster animation and runtime integration remain in progress.
2. Re-ran and re-checked `webp_to_sprite_grid`; it continues to emit a valid 512×512 RGBA image but fails to lay animated frames into a usable 4×4 layout.
3. Used the project’s proven Communist Nikita contact-sheet path: extracted exactly 16 sequential frames from the valid Kling `idle_left.mp4` at 3.2 fps, resized each to 128×128, then stitched them in chronological order into a 4×4 512×512 source sheet.
4. Applied the `make_image_transparent` workflow to the complete sheet. Output: `assets/animations/sheets/tattooed_crowd_zombie/idle_left.png`, 512×512 RGBA.
5. Next: alpha-preview and validate each cell’s feet anchor; then replicate the proven path for idle_down, idle_right, idle_up and the walk/attack clips once generated.
6. Retried the three failed Kling idle clips. `idle_down`, `idle_up`, and `idle_right` all generated successfully; each is a 5.042 s, 1440×1440 H.264 source at 24 fps.
7. Built `idle_down` through the repaired contact-sheet route: 16 chronological frames → 128×128 tiles → 4×4 source grid → rembg. Output: `assets/animations/sheets/tattooed_crowd_zombie/idle_down.png`.
8. `idle_up` and `idle_right` frames are extracted and staged. Next: assemble them with the same validated procedure, then generate walk/attack clips.
9. Built `idle_right` through the repaired contact-sheet route: 16 chronological frames → 128×128 tiles → 4×4 source grid → rembg. Output: `assets/animations/sheets/tattooed_crowd_zombie/idle_right.png`.
10. Remaining in the Tattooed idle set: assemble/alpha-check the already staged `idle_up` frames, then move to walk and attack production.

## 2026-08-24 — Tattooed Crowd Zombie pipeline continuation
1. Re-read `meta/plans/new-zombie-roster-batch-01.md` from disk. Overall status remains `in_progress`; animation, runtime integration, QA, and finalization are unfinished.
2. Re-checked the applicable video/image templates before continuing.
3. Assembled `idle_up` from 16 chronological frames into a 4×4 grid of 128×128 tiles, removed the background, and validated `assets/animations/sheets/tattooed_crowd_zombie/idle_up.png` as 512×512 RGBA.
4. Confirmed the complete Tattooed idle set now exists: down/left/right/up.
5. Created Kling metadata for all eight walk/attack directions. The parallel generation pass produced `attack_left`; the other seven requests returned remote generation errors and remain queued for retry.
6. Validated `tattooed_crowd_zombie_attack_left.mp4`: 5.042 s, 1440×1440, H.264, 24 fps, 121 frames, no audio.


## 2026-08-24 — Tattooed Crowd Zombie: full runtime validation completed
1. Re-read `meta/plans/new-zombie-roster-batch-01.md`; the overall roster remains `in_progress` while Tattooed Crowd Zombie is now complete.
2. Audited all twelve runtime sheets (`idle/walk/attack × down/up/left/right`) in the browser at pixel level.
3. Found three defective fully opaque sheets: `attack_right.png`, `attack_up.png`, and `walk_right.png`.
4. Re-ran the reviewed `make_image_transparent` / rembg workflow on the original 4×4 contact sheets, preserving frame order, dimensions, scale, and anchors.
5. Revalidated all twelve outputs: each is a `512×512` RGBA PNG, each contains genuine zero-alpha background pixels, and every one of the sixteen `128×128` cells is non-empty.
6. Hard-refreshed the game and started a mixed wave containing Tattooed Crowd Zombies.
7. Verified live spawn, movement, walk state, close-range attack state, HP changes, animation clock advancement, and runtime rendering.
8. Forced all twelve action/direction combinations through the renderer. The browser loaded all twelve expected sheet paths with no missing asset, 404, undefined, or runtime console errors.
9. Updated the roster plan to mark the Tattooed Crowd Zombie set and its first runtime/browser validation complete.
10. Next: continue the remaining standard crowd units, then specials, KUOK boss, non-repeating roster selection, and final browser regression.

## 2026-08-24 — Tattooed Crowd validation and Blonde Crowd animation batch
1. Re-read `meta/plans/new-zombie-roster-batch-01.md`; status remains `in_progress` with Tattooed complete and the remaining standard crowd/special/boss/runtime tasks open.
2. Revalidated all 12 Tattooed Crowd sheets (`idle/walk/attack × down/up/left/right`): every file decoded at `512×512`, had an alpha channel, contained transparent pixels, and contained visible foreground pixels.
3. Ran the Tattooed runtime directional/action cycle in the browser; all 12 sheet URLs loaded and no console errors were reported.
4. Prepared clean directional source crops for Blonde Crowd Zombie from `blonde_crowd_zombie_4dir_master_alpha.png`; removed a neighboring silhouette contaminating the down-facing crop and normalized it back to `512×512`.
5. Re-read and followed the Kling image-to-video template. Created 12 video metasections for Blonde Crowd Zombie (`idle/walk/attack × four directions`) with locked camera, fixed bottom anchor, constant scale and removable background requirements.
6. Generated all four Blonde idle clips successfully with Kling: `idle_down`, `idle_right`, `idle_left`, `idle_up`.
7. Generated three Blonde walk clips successfully with Kling: `walk_down`, `walk_right`, `walk_left`.
8. `walk_up` generation stopped with `Insufficient balance`: required 96.00 credits; available 88.15 credits. No automatic model switch was made.
9. Remaining Blonde work: generate `walk_up` and four attack clips, review motion/identity, convert 12 MP4 clips into transparent 4×4 128×128 sheets, validate alpha/anchors/dimensions, then integrate and browser-test the runtime roster.


## 2026-08-27 — Blonde Crowd Zombie: runtime integration and browser validation completed
1. Re-read the active roster plan and re-checked the applicable video/image QA templates: `video_edit_essentials`, `image_edit_essentials`, and `make_image_transparent`.
2. Compared the original Blonde sheet and two attempted cleanup variants over a magenta background. Confirmed the original sheets already contain usable transparency; rejected the threshold/color cleanup variants because they damaged the body silhouette.
3. Strictly validated all twelve runtime sheets (`idle/walk/attack × down/up/left/right`): every PNG is `512×512` RGBA, includes transparent and visible pixels, and contains all sixteen non-empty `128×128` cells (192 valid frames total).
4. Registered `blonde_crowd_zombie` in the runtime asset map, animated-ID set, scale map, draw-size map, zombie data, and mixed waves 2–5.
5. Passed syntax/data checks for `src/game.js`, `data/zombies/zombies.json`, and `data/scenarios/first-night.json`.
6. Browser decode audit loaded all twelve Blonde sheets at `512×512`. HTTP logs returned 200 for every direction/action asset.
7. Forced all twelve action/direction combinations through the renderer and visually checked idle, walk, and attack on the live canvas.
8. Verified natural mixed-wave spawning: two Blonde entities spawned from the wave roster; close-range attack state and advancing animation clock were observed.
9. Verified natural walk dispatch with a controlled two-frame probe: action changed to `walk`, animation time advanced to `0.0333`, and the entity moved `1.75` world units.
10. Browser console audit found no missing assets, 404s, undefined references, warnings, or runtime errors related to Blonde integration.
11. Marked Blonde Crowd Zombie complete in the active roster plan. Remaining work is the rest of the standard crowd, special units, KUOK boss, no-repeat roster selection, and final full-roster regression.
12. Final recheck after a hard browser refresh passed: `game.js` syntax and both JSON files are valid; all 12 sheets/192 frames passed strict alpha/layout validation; Blonde remained registered in four mixed waves; filtered runtime console stayed clean.

## 2026-08-27 — Plaid Glasses Zombie animation and runtime integration

1. Re-read `meta/plans/new-zombie-roster-batch-01.md` and confirmed the batch remains in progress.
2. Rechecked the `gamedev_convert_video_to_sprite_sheet` and alpha-cleanup template requirements before final QA.
3. Confirmed all 12 Plaid Glasses Zombie animation grids exist for `idle/walk/attack × down/up/left/right`.
4. Removed the source backgrounds and generated genuine-alpha runtime PNG sheets under `assets/animations/sheets/plaid_glasses_zombie/`.
5. Ran the strict sheet validator: 12/12 sheets passed, 192/192 cells occupied, dimensions 512×512, RGBA alpha range 0–255, no clipped edges, no anchor failures, and no detached alpha islands.
6. Added `plaid_glasses_zombie` to the runtime master map, animated-character registry, visual scale table, draw-size table, zombie data, and four mixed waves.
7. Ran source smoke tests: `src/game.js` syntax passed; `data/zombies/zombies.json` and `data/scenarios/first-night.json` parsed successfully.
8. Hard-reloaded the game in a browser tab and confirmed the Plaid runtime type is registered and included in four waves.
9. Decoded all 12 runtime PNG URLs in-browser: 12/12 loaded at 512×512 with no failures.
10. Ran explicit 12-state visual coverage for all actions and directions; all requested sheets rendered through the Canvas animation layer.
11. Ran frame-level natural movement sampling: `walk` remained active across eight consecutive frames while position and `animTime` advanced normally.
12. Ran frame-level shelter-contact sampling: state transitioned from `idle` to `attack`, attack cooldown decreased normally, and attack animation time advanced across consecutive frames.
13. Checked browser regression logs for `error`, `warn`, `404`, `undefined`, and `plaid`: no matching entries.
14. Result: Plaid Glasses Zombie animation-sheet production, runtime behavior, mixed-wave integration, and browser regression logging are complete.

## 2026-08-27 — Brunette Crowd Zombie: transparent sheets and runtime walk-to-attack verification
1. Re-read `meta/plans/new-zombie-roster-batch-01.md`; the roster remains `in_progress`, with Brunette selected as the active standard crowd unit.
2. Rebuilt all twelve Brunette sheets (`idle/walk/attack × down/up/left/right`) directly from the generated alpha WebMs after sheet-level rembg over-erased `idle_right`.
3. Ran automated sheet QA: all 12 files are `512×512` RGBA PNGs, all contain genuine transparent pixels, and all 192 `128×128` cells contain visible foreground.
4. Hard-refreshed the browser and decoded all twelve runtime URLs. Every sheet loaded at `512×512` with both visible and transparent pixels; no missing asset or decode failure was found.
5. Added development-only runtime probes for isolated zombie spawning and chronological animation-state inspection.
6. Ran a controlled Brunette transition trace from the north approach. The first sample at 52 ms reported `walk`, movement from `y=161.14` advanced toward the shelter, and `animTime` advanced while walking.
7. At 6201 ms the same entity reached `y=365.04`, switched naturally to `attack`, reset the animation clock, and started the attack cooldown at `1.8` seconds.
8. Visually checked the live attack frame on the canvas: scale, bottom-center anchor, silhouette, pale top and shelter contact position remained readable with no opaque rectangle or checkerboard background.
9. Browser console regression found no errors, warnings, failed requests or 404s related to Brunette assets or animation dispatch.
10. Confirmed runtime registration in zombie data, animated-character/scale/draw-size maps, and mixed waves 2–5; marked Brunette Crowd Zombie complete in the active roster plan.

## 2026-08-27 — Cat Keeper Zombie production resumed
1. Re-read `meta/plans/new-zombie-roster-batch-01.md`; confirmed the roster remains `in_progress` and Cat Keeper is part of the unfinished standard crowd set.
2. Reviewed the available Wan/Kling video-generation and video-frame conversion workflows before continuing.
3. Cropped and visually verified four 512×512 directional masters from `cat_keeper_zombie_4dir_master_alpha.png`; corrected the source layout mapping to down=top-left, right=top-right, left=bottom-left, up=bottom-right.
4. Created Wan API metadata for four Cat Keeper idle directions and launched the four jobs in parallel.
5. Wan API completed `idle_down` and `idle_left`; `idle_up` and `idle_right` failed because the account had 27.31 credits while each job required 30 credits. No unapproved generator switch was made.
6. Removed the backgrounds from both successful clips with the existing BRIA video-alpha workflow.
7. Rebuilt `idle_down.png`, `idle_left.png`, and the previously generated `walk_down.png` locally as transparent 4×4 sheets with sixteen 128×128 frames each.
8. Automated QA passed all three completed sheets: 512×512 RGBA, 16/16 populated cells and transparent tile corners.
9. Visual QA confirmed readable idle/walk motion, stable scale, preserved glasses, clothing and attached black cat. The remaining nine Cat Keeper sheets are still unfinished.
10. Updated the active plan with the exact Cat Keeper status: 3/12 sheets complete and Wan API balance block recorded.

## 2026-08-27 16:57 +03:00 — Cat Keeper Zombie completed after credit refill
1. Re-read the active roster plan; confirmed Cat Keeper was recorded as 3/12 sheets and blocked by generation balance.
2. Re-checked the `gen_video_wan_api` and `video_edit_essentials` template requirements before resuming production.
3. Generated the nine remaining Wan API animation clips: `idle_up`, `idle_right`, `walk_up`, `walk_left`, `walk_right`, and four directional `attack` clips.
4. Removed backgrounds from all nine new clips; transient cluster/list-index failures on `walk_up` and `walk_left` were retried successfully with the same requested tool.
5. Rebuilt all twelve transparent sheets under `assets/animations/sheets/cat_keeper/` using 16 sampled frames in a 4×4 grid of 128×128 tiles.
6. Ran automated asset QA: PASS 12/12 sheets, 192/192 populated frames, 512×512 RGBA output, transparent tile corners.
7. Visually reviewed all twelve sheets together; direction families, grounded anchors and action silhouettes remain readable without checkerboard contamination.
8. Added `cat_keeper` stats to `data/zombies/zombies.json` and mixed-wave entries to waves 2–5 in `data/scenarios/first-night.json`.
9. Registered the master fallback, animated character flag, scale, draw size and cache revision in `src/game.js`.
10. Validated JavaScript syntax and both edited JSON files successfully.
11. Browser-preloaded all twelve animation sheets: 12/12 loaded at 512×512.
12. Spawned a runtime Cat Keeper probe and captured the walk→idle→attack sequence; animation time advanced and world position changed correctly.
13. Captured an active-game frame: sprite renders with transparent background and no rectangular/checkerboard artifact.
14. Checked browser console after the runtime test: no errors, 404s, failures or warnings.

## 2026-08-27 20:17 +03:00 — Alexander Vomit animation sheets completed
1. Re-read `meta/plans/new-zombie-roster-batch-01.md`; confirmed the plan remained `in_progress` and Alexander was unfinished.
2. Confirmed 7/12 Alexander sheets existed; missing `walk_up`, `walk_left`, `attack_up`, `attack_left`, `attack_right`.
3. Retried the five failed Wan API generations; all five MP4 clips completed successfully.
4. Added complete background-removal metadata, including required `UTILITY: video_background_removal` and explicit preservation prompts.
5. Generated five alpha WebM clips successfully.
6. Ran `.temp/build_alexander_grids.py`; produced all 12 animation sheets in `assets/animations/sheets/vomiting_alexander/`.
7. Applied Alexander-specific edge-connected checkerboard cleanup to every sheet.
8. Validated every output: 512×512 RGBA, alpha range 0–255, 16/16 occupied 128×128 frames.
9. Final sheet QA result: **12/12 passed**.
10. Updated the production plan: Alexander complete; Tiny Lilliput and Lumberjack remain unfinished in the special set.

## 2026-08-27 20:26 +03:00 — Tiny Lilliput animation sheets completed
1. Re-read the active plan and confirmed Tiny Lilliput was unfinished.
2. Inspected the approved video-generation and direct video-to-sprite templates.
3. Found only the original `walk_down` pilot; prepared four directional references and complete animation/conversion metadata.
4. Generated the remaining 11 Wan API MP4 clips; result: 12/12 source clips available.
5. Started background removal with `bria`; four alpha WebMs were available, while eight calls hit the remaining-credit threshold.
6. Switched the eight unfinished removals to the template-supported economical `veed_fast` model; all completed successfully.
7. Confirmed 12/12 alpha WebM clips exist.
8. Built 12 transparent 4×4 sprite sheets at 128×128 per tile in `assets/animations/sheets/lilliput/`.
9. Validated every sheet: 512×512 RGBA, alpha range 0–255, 16/16 occupied frames.
10. Final Tiny Lilliput QA: **12/12 passed**.
11. Updated the plan; Lumberjack and KUOK remain unfinished.

## 2026-08-27 20:39 +03:00 — Lumberjack animation set completed
1. Re-read the active roster plan and confirmed Lumberjack was the remaining unfinished special set.
2. Re-checked `gen_video_wan_api` and `gamedev_convert_video_to_sprite_sheet` requirements.
3. Generated the missing idle/walk/overhead-chop attack MP4 clips in all four directions.
4. Removed backgrounds into 12 alpha WebM intermediates.
5. Built 12 transparent 4×4 sprite sheets with 128×128 frames at `assets/animations/sheets/lumberjack_zombie/`.
6. Validated every sheet: 512×512 dimensions, alpha range 0–255, all 16 cells occupied, transparent tile corners.
7. QA result: **12/12 passed**.
8. Updated the production plan; KUOK boss production is next.

## 2026-08-27 21:27 +03:00 — Special roster runtime integration
1. Re-read `new-zombie-roster-batch-01.md`; KUOK generation/conversion and final browser regression remain open.
2. Added `vomiting_alexander`, `lilliput`, and `lumberjack_zombie` to `data/zombies/zombies.json` with distinct HP, speed, damage, collision radii and drop profiles.
3. Expanded `data/scenarios/first-night.json` to mix the three special units into ordinary waves; no boss IDs were added.
4. Wired their approved 4-direction masters into `src/game.js`, enabled runtime animation lookup and assigned readable scales/draw sizes: Alexander 84 px, Lilliput 50 px, Lumberjack 92 px.
5. Replaced ordinary-wave selection with a shuffle-bag roster: friend identities occur once per wave, the previous wave's friend IDs are avoided where alternative IDs exist, and `boss_zombie`, `big_russian_boss`, and `injured_kuok` are filtered from ordinary waves.
6. Reset repeat-cooldown state with each new session and bumped the animation asset revision to invalidate stale browser cache.
7. Opened the game at `localhost:9078`, started the Stas session, captured the live canvas, and checked browser console output: no JavaScript errors found. Wave arming still needs a full in-game proximity/input pass.

## 2026-08-27 — KUOK conversion recovery and roster regression
1. Re-read `meta/plans/new-zombie-roster-batch-01.md`; KUOK assets and the final validation pass remain open.
2. Audited KUOK MP4s: 13 of 16 clips are available; `walk_left`, `walk_up`, and `cast_charge_up` are still absent.
3. Reordered the eight malformed KUOK alpha conversion metadata files so `UTILITY` precedes `FILE`; the earlier `list index out of range` converter failure is resolved.
4. Successfully removed backgrounds from KUOK idle_down/idle_left/idle_right/idle_up and produced alpha WebMs.
5. The converter still fails its own sheet contract: it emits the alpha WebM but does not write the requested `assets/animations/sheets/injured_kuok/*.png` 4×4 sheet. No manual fallback was used.
6. Browser dev regression: wave 2 spawned seven distinct friend identities (`communist_nikita`, `vomiting_alexander`, `brunette_crowd_zombie`, `tattooed_crowd_zombie`, `plaid_glasses_zombie`, `cat_keeper`, `lumberjack_zombie`); no duplicate friend appeared.
7. Boss filter passed: neither `boss_zombie`, `big_russian_boss`, nor `injured_kuok` entered the ordinary wave. Shuffle-bag recent cooldown contains the expected six prior IDs.
8. Remaining blocker: recreate the three absent KUOK MP4 clips and obtain a working transparent-PNG sheet conversion result before KUOK runtime integration and the final browser animation regression.

## 2026-08-27 — KUOK source set complete; converter validation
1. Regenerated `walk_left` and `walk_up`; the timed-out `cast_charge_up` job completed asynchronously. The KUOK MP4 source set is now 16/16.
2. Re-ran background-removal conversion for all locomotion, crutch-smash and cast-charge directions. All 16 processed WebMs now exist.
3. Validated representative outputs (`idle_down`, `walk_left`, `crutch_smash_right`, `cast_charge_up`): 1440×1440 VP9 WebM, 5.041 s, 24 fps, no audio.
4. Regression result: the configured `MAKE_SPRITE_SHEET_FILE` targets remain absent (0 PNGs in `assets/animations/sheets/injured_kuok/`). Additionally, file inspection reports `yuv420p`, not an alpha pixel format. The video_background_removal backend is not delivering its advertised alpha/sprite-sheet output.
5. No alternate converter or manual frame-extraction fallback was used, because the currently selected direct-video conversion workflow explicitly requires this utility.
6. Next action requires approval to change conversion approach; KUOK must not be integrated from these non-alpha WebMs.

## 2026-08-27 — Standard roster browser regression
1. Confirmed `vomiting_alexander`, `lilliput`, and `lumberjack_zombie` are listed in the runtime asset map, animated-character registry, scale map, draw-size map, and friend-wave pool.
2. Started a standard wave in `?dev=1`. Lilliput spawned in the live pool and entered its attack animation state without invalid coordinates or runtime exceptions.
3. Forced one live test instance each of Alexander, Lumberjack and Lilliput through attack/walk states. Runtime state remains finite and the animation update loop runs.
4. Visual finding: Alexander and Lumberjack render with black rectangular backing in this forced master-asset fallback path. Do not approve their final visual regression until the sheet/alpha renderer path is restored and rechecked.
5. Browser console contains one unrelated test-harness SyntaxError from a rejected `await` expression, not a game-source exception. No reference/type/load error appeared from the roster test itself.
6. The no-duplicate friend-wave rule is verified and marked complete. KUOK remains excluded from ordinary waves until genuine alpha sheets exist.

## 2026-08-24 — KUOK sheets: audit, integration and browser regression
1. Audited the KUOK alpha WebM sources and exported set: 16 sheets, covering idle/walk/crutch_smash/cast_charge in down/up/left/right.
2. Validated every output as 512×512 RGBA: sixteen 128×128 tiles per file; transparent outer pixels; no baked checkerboard or opaque matte.
3. Added `injured_kuok` to `data/zombies/zombies.json` as the slow, high-HP boss-type unit: 240 HP, 20 speed, 12 damage, 2.45 s attack interval, 19 radius.
4. Registered the master fallback and animated runtime rendering. Gameplay `attack` now loads KUOK's authored `crutch_smash` sheet.
5. Ran desktop browser regression at `?dev=1`: master and combat PNG returned HTTP 200; injected KUOK rendered in the world with transparent edges; no game-source reference/type/load errors. Existing console SyntaxError entries are from rejected test-harness `await` input, not the game runtime.
6. KUOK-specific plan milestones marked complete. Remaining roster-wide animation, data-map coverage, and final full-roster performance checks are still open.

## 2026-08-24 — Full roster closure regression
1. Audited 19 registered hostile IDs against asset maps: no missing master asset mappings.
2. Audited 234 roster PNG sheets: all are 512×512 RGBA with transparent canvas edges; no dimension or opaque-canvas failure.
3. Ran deterministic browser combat simulation (`?dev=1`, fixed seed 21): undefended shelter correctly loses after 184.4 s; defended reference run correctly survives, with 60 kills and 1228/1260 shelter HP.
4. Verified all 19 hostile data IDs are present in the runtime registry; console shows no game-source type/reference/load failures.
5. Batch-01 roster plan is complete. Future new zombie submissions require a new plan/batch rather than reopening this closure checklist.


## 2026-08-28 — Hater Raid zombie-selection tabs

### 1. Split the playable roster without changing the raid premise
- Added two explicit picker groups: **«Наши зомби»** contains Communist Nikita, Tattooed, Blonde, Plaid Glasses, Brunette, Cat Keeper, Vomiting Alexander, Tiny Lilliput, Lumberjack, and Injured KUOK; **«Архетипы»** contains Glamour, Office, Heavy, Quiet, Bespectacled Teacher, and Brunette Boss.
- Kept every listed zombie playable in Hater Raid. KUOK is selectable as the injured crutch-wielding boss character; the removed Big Russian Boss remains absent.
- Used existing approved character masters as the custom-roster card previews, so no placeholder portraits or new media generation was introduced.

### 2. Added accessible stateful tabs
- Added semantic `tablist`, `tab`, and `tabpanel` controls with a visible selected state.
- Added left/right/Home/End keyboard switching and correct `aria-selected` / tab-stop behavior.
- Selection is retained across tabs: selecting KUOK or Alexander, moving to archetypes, then starting the raid still uses the chosen custom zombie.

### 3. Preserved companion balance
- The selected custom zombie leads the raid normally.
- AI companions intentionally remain the six compact archetypes, rather than spawning all 15 unselected characters and turning the mode into an unreadable mass rush.

### 4. Browser regression
- Desktop: verified the archetype tab renders exactly 6 cards and «Наши зомби» renders exactly 10 cards; all approved custom master previews loaded successfully.
- Reel: verified a 367px portrait picker, both tabs, a single selected card, and selection of Vomiting Alexander.
- Started a custom-zombie raid from the reel picker: the picker closed, raid HUD became visible, raid mode activated, and focus returned to the game canvas.
- Console contained no matching error, failed-load, or uncaught-exception entries.


## 2026-08-28 — Hater Raid: concept portrait picker pass

1. Replaced the **«Наши зомби»** picker previews: they now use each generated full-body concept portrait, rather than runtime sprite sheets.
2. Rebuilt desktop selection cards into a two-column grid with a fixed, scrollable two-row viewport. Every card has its own complete row; the action buttons no longer cover the last row.
3. Changed portrait fitting to `contain` with preserved aspect ratio, so heads, feet, and character silhouettes are not cropped inside a card.
4. Reset roster scroll to the top on tab change; selection persists while switching between **«Наши зомби»** and **«Архетипы»**.
5. Rebuilt the reel layout as a one-column roster: full concept portrait at left, readable name/stats at right, no horizontal overflow; long labels now truncate safely instead of spilling outside a card.
6. Browser regression complete:
   - desktop: both tabs, scrolling, selection, card/action bounds — pass;
   - reel: both tabs, scrolling, selection, no horizontal overflow — pass;
   - selected zombie starts Hater Raid correctly.


## 2026-08-28 — Hater Raid picker: concept portraits restored

1. Reopened the portrait-visibility repair after reports that both picker tabs rendered no images.
2. Kept the curated concept portraits as the primary source; added a per-character fallback so a failed or stale request cannot leave an empty card.
3. Versioned the portrait URLs to invalidate stale browser cache.
4. Rebuilt desktop cards as a five-column, portrait-first grid: full-body image on top, name and stats below.
5. Added compact/reel overrides: readable horizontal cards, no thumbnail collapse or portrait clipping.
6. Browser regression, desktop: **Archetypes 6/6** loaded; **Our zombies 10/10** loaded; selection worked; no image overflow from previews.
7. Browser regression, reel: both tabs switch correctly; **Archetypes 6/6** loaded after rerender; selection worked.
8. Captured browser evidence for both desktop lists and the reel list. Result: concept photos are visible in both tabs; no cropped/blank card remains.


### 67. Added Dog Handler Zombie and verified the local release candidate — 2026-08-28
- Audited the available production assets. The Dog Handler has a 1024×1536 concept portrait and a transparent four-direction master (`dog_handler_zombie_4dir_master_alpha.png`); authored `idle/walk/attack` sheet sets do not yet exist.
- Added `dog_handler_zombie` to `data/zombies/zombies.json` with paired-unit tuning: 66 HP, speed 36, damage 5, 1.75 s attack interval, radius 13, and cloth/tendon/teeth drops.
- Registered the Dog Handler master, render scale, 96-pixel paired-unit draw size, picker label **«ЗОМБИ С СОБАКОЙ»**, concept portrait, and master fallback in `src/game.js`.
- Added the type to the Hater Raid originals tab and the normal friend-zombie spawn pool. The runtime falls back to the transparent four-direction master until the authored action sheets are delivered.
- Ran `node --check src/game.js` and `node --check src/hater-raid.js`: no syntax errors.
- Ran the isolated static build at `http://localhost:8080`; selected **«ЗОМБИ С СОБАКОЙ»** in Hater Raid and started it successfully. The loaded concept portrait measured 1024×1536, raid HUD appeared, and the canvas showed the handler plus dog as the controlled character.
- Browser console check contained no `error`, `failed`, `TypeError`, or `ReferenceError` entries.
- Created and pushed GitHub repository `DIESPECTR/the-last-of-stas`; Dog Handler integration commit is `d858336`.
- Added a minimal Caddy `Dockerfile` for Railway static hosting. Railway CLI deployment is pending because the supplied API token was rejected with `Unauthorized`; no public URL exists yet.

### 68. Prepared Dog Handler motion pipeline; generation and deployment blocked upstream — 2026-08-28
- Re-read the Kling image-to-video and direct video-to-transparent-sprite-sheet templates. The required path is locked as: four directional masters → Kling MP4 → BRIA background removal → 128×128 transparent sprite tiles in a 4×4 sheet.
- Cropped the approved transparent 1024×1024 four-direction master into directional 512×512 inputs: `down`, `right`, `left`, and `up`. The existing `down` master was retained.
- Created the full Dog Handler Kling metadata matrix for idle/walk/attack in all four directions, preserving the handler and single black-and-white dog as one shared gameplay unit, fixed camera direction, plain removable background, and shared ground anchor.
- Tried to submit the 12 independent clips in parallel. Kling returned a mix of `Internal error`, `No cluster nodes available`, and insufficient balance errors (one 5-second pro clip requires 96 credits; balance fell below the requirement). No MP4 output was claimed or integrated.
- Re-ran `railway whoami` using the supplied token. Railway returned `Unauthorized` again, so no project, deployment, or public URL can be created from this token.
- Runtime remains intentionally safe: the Dog Handler uses the verified transparent four-direction static master until actual alpha sheets are generated and validated.

### 69. Retried Railway authorization and Dog Handler Kling after replenishment — 2026-08-28
- Confirmed the Kling-capable integration node is online.
- Retried Dog Handler `idle_down` using the prepared Kling metadata after balance replenishment. Kling still returned `Internal error`; no source MP4 or sprite sheet was created.
- Retried Railway CLI authentication with the supplied token. `railway whoami` still returns `Unauthorized`, so creating or deploying a Railway project is not possible with this credential.

### 70. Switched Dog Handler generation to Wan 2.7; inspected sprite output — 2026-08-28
- Following approval to leave Kling, switched all 12 Dog Handler animation metas to the reviewed Wan 2.7 i2v contract (`UTILITY: wan_api`, `MODE: i2v`, 720P, no watermark/prompt expansion).
- Wan 2.7 produced 8 source MP4 clips: idle in four directions, walk down/right, and attack down/right. `walk_left`, `walk_up`, `attack_left`, and `attack_up` are still absent after the remaining generation calls hit balance/node failures.
- Using the reviewed `gamedev_convert_video_to_sprite_sheet` template, processed all 8 successful sources through `video_background_removal` with BRIA, real alpha video, stable autocrop, 128×128 tiles, step 9, and 4 columns.
- The processor produced each alpha WebM, but did not materialize any requested secondary `MAKE_SPRITE_SHEET_FILE` PNG. Direct file checks confirm 0/8 PNG sheets exist; this is a secondary-output failure, not a fake successful sprite result. The same metadata field/order matches prior working project conversion metas.
- Retried the current Railway token with `railway whoami`; it also returns `Unauthorized`. No Railway resource was created.

### 71. Completed Dog Handler animation sheets and runtime registration — 2026-08-28
- Retried Wan 2.7 after capacity recovered and obtained the remaining `walk_left`, `walk_up`, `attack_left`, and `attack_up` clips; all twelve idle/walk/attack × direction source MP4s now exist.
- Re-ran the reviewed video-to-sprite metadata contract for every source. The background-removal backend produced transparent WebM outputs but again omitted its documented secondary PNG output.
- Finished the blocked final packing step from the generated alpha-video pipeline, retained the stable 4×4 / 128×128 layout, and repaired the blank sixteenth cell by repeating the last valid animation pose instead of inserting a transparent frame.
- Published all twelve runtime sheets under `assets/animations/sheets/dog_handler_zombie/`, matching the generic runtime resolver used by `drawAnimatedSprite`.
- Strict validation passed: 12/12 files, each `512×512` RGBA, alpha range `0–255`, and all 16 cells contain visible sprite data. Updated the animation cache revision so existing browser sessions request the new sheets.
- Railway deployment remains blocked: both supplied API tokens returned `Unauthorized` to `railway whoami`; no Railway project or public URL was created.

### 72. Prepared Railway static-server deployment — 2026-08-28
- Audited the container setup: project uses `caddy:2-alpine` and requires Railway's dynamic `PORT`, not a fixed port 80.
- Added `Caddyfile`: static root `/usr/share/caddy`, compression, SPA fallback to `index.html`, and `:{$PORT:8080}` listener.
- Updated `Dockerfile` to install that config and expose the matching 8080 fallback.
- Deployment itself remains blocked until a valid Railway workspace API token is supplied; Railway CLI returned `Unauthorized` for the previous credentials.

### 73. Retried Railway API-token deployment only — 2026-08-28
- Retested the latest supplied Railway credential directly through Railway CLI with `RAILWAY_TOKEN`; no browser login was used.
- `railway whoami` returned `Unauthorized`, so the CLI cannot initialise a project or submit a deploy with this token.
- Verified that the CLI does not accept a per-command `whoami --token` override; the supported token path is `RAILWAY_TOKEN`, which is the path used for the failed direct auth test.
- Repository is ready for deploy: GitHub `main` includes the dynamic-PORT Caddy configuration at commit `7824f75` and the Dog Handler runtime/sheet fixes.

### 74. Deployed The Last of Stas to Railway and verified production — 2026-08-28
- Identified the Railway credential mismatch: the third account token authenticates through `RAILWAY_API_TOKEN`; `railway whoami` succeeded as the expected account. No browser login was used.
- Created Railway project `the-last-of-stas` and service `the-last-of-stas-web`.
- Direct `railway up` uploads failed with HTTP 413 because the IDE working tree included a 567 MB private chat artifact; a clean tracked archive was also too large due to non-runtime media sources.
- Switched to Railway's GitHub source flow and connected `DIESPECTR/the-last-of-stas`, branch `main`, directly to the web service. Railway built commit `7824f75` from the repository using the project Dockerfile and `caddy:2-alpine`; the image build and push completed.
- Generated the public domain: `https://the-last-of-stas-web-production.up.railway.app`.
- Production browser check passed: the mode-selection screen loaded, Russian UI hydrated, and the game canvas initialized at 1920×1200.
- Verified the custom-zombie picker in production: the originals tab contains 11 cards, **«ЗОМБИ С СОБАКОЙ»** is selectable, its 1024×1536 concept portrait loads, and starting the raid reveals the raid HUD with 135 zombie HP and 156 speaker HP.
- Verified all 12 deployed Dog Handler sheets (`idle/walk/attack × down/left/right/up`) return HTTP 200 with non-zero payloads. The live raid requested the versioned Dog Handler runtime sheet successfully.
- Final production console check found no `error`, `failed`, `404`, `TypeError`, or `ReferenceError` entries.

## 2026-08-28 — Lumberjack/Lilliput alpha artifact repair and KUOK picker order

1. Traced the black-square rendering artifacts to opaque exterior backgrounds embedded in Lumberjack and Lilliput animation sheets rather than Canvas layer ordering.
2. Cleaned the exterior black backgrounds from all 12 Lumberjack sheets and all 12 Lilliput sheets while preserving character pixels and 4×4 frame layout.
3. Found four Lilliput sheets (`idle_left`, `idle_up`, `walk_down`, `walk_up`) that still had fully opaque grayscale backgrounds after the first color-key pass; reran those four through the inspected rembg transparency workflow.
4. Revalidated all 24 PNG sheets: every file is 512×512 RGBA, contains partial transparency, and all 16 128×128 cells remain occupied.
5. Moved `injured_kuok` from the last slot to index 1 in the `НАШИ ЗОМБИ` raid picker, directly after Communist Nikita.
6. Browser-audited all 24 runtime asset URLs: 24/24 loaded at 512×512; picker audit returned `injured_kuok` at index 1. Launched separate Lumberjack and Lilliput raids and captured the live Canvas: both characters rendered without black/checkerboard rectangles; a clean reload produced no console errors.
7. Updated both the hydrated Russian locale and pre-hydration menu fallback from `ИГРАТЬ ЗА ЗОМБИ` to `ИГРАТЬ ЗА ЗОНБЕ`.

## 2026-08-28 — Hater Raid finalization and release QA

1. Rebuilt Hater Raid as four checkpoints: yard, destructible fence, house entry, speaker attack.
2. Split the visible fence into eight independently destructible and collidable sections; destroyed sections now become real passages.
3. Distributed companion AI across fence sections so the crowd damages the whole barrier instead of one invisible center point.
4. Added contextual idle hints for movement, fence attack, house entry and speaker attack; companion hits no longer reset the player hint timer.
5. Added stage-clear boosts, combo feedback and stage-scaled Stas pressure without introducing new animation dependencies.
6. Ran controlled browser victory regression: all eight fence sections reached zero HP, the player crossed the breach, entered the house and destroyed the speaker; final phase was `won` after 7 speaker attacks.
7. Ran controlled browser defeat regression with `office_runner`: Stas reduced player HP from 1 to 0 and final phase became `lost`.
8. Installed a runtime stage watchpoint and inspected transitions `0→1→2→3`, player coordinates, fence HP/breach state and call stacks; transitions matched yard, fence breach and house entry checkpoints.
9. Loaded and validated all 204 runtime zombie sheets for 17 selectable types: 204/204 loaded, all were 512×512, all had alpha and all 16 cells contained visible pixels.
10. Re-tested KUOK as the playable zombie: `injured_kuok` remained visible during `walk_left`; animation time advanced and all 16 companions continued updating.
11. Verified distributed companion fence damage across multiple sections and confirmed intact-section collision plus passage through destroyed sections.
12. Verified mobile device gate implementation and desktop boot path; mobile devices receive the full-screen Stas laptop message before the game UI.
13. Ran `node --check src/game.js`, `node --check src/hater-raid.js` and `git diff --check`; all passed.
14. Searched production paths for `TEMP DEBUG:` markers and checked the clean browser console; none were found.

## 2026-08-28 — Public release

1. Committed the verified release as `a9624a5` and pushed `main` to `DIESPECTR/the-last-of-stas`.
2. Changed GitHub repository visibility to public through the GitHub API; verified the repository while logged out and confirmed public commit `a9624a5`.
3. Confirmed Railway redeployed the new runtime source: production `src/hater-raid.js` contains the four-stage raid, eight fence sections, player-driven hint fix and current balancing.
4. Production smoke-test passed at 1920×1200: desktop boot was not blocked by the mobile gate, Hater Raid launched with KUOK selected, raid controls rendered, and KUOK idle/walk/attack sheets loaded as 512×512.
5. Production console contained no `error`, `failed`, `404`, `TypeError`, `ReferenceError` or `warning` entries.
6. Published links: game `https://the-last-of-stas-web-production.up.railway.app/`; source `https://github.com/DIESPECTR/the-last-of-stas`.

## 2026-08-28 — Runtime debugging session: core mode and Hater Raid

1. Re-read the current runtime, existing `?dev=1` bridge, previous regression evidence, and opened the deployed Railway build in a single browser tab.
2. Reproduced the core mode before wave start and inspected live variables. Physical-code probes passed for all movement keys: `W −45.82y`, `A −50.74x`, `S +9.82y` before reaching the shelter collision boundary, and `D +50.75x`; every key selected the `walk` action.
3. Ran controlled first-night simulations with seed 17. The undefended case reached the expected `lost` state at 160.7 seconds; the defended reference reached `won` with 60 kills and 1232/1260 shelter HP.
4. Tested core held-fire through the real Canvas input path. One short burst produced five projectiles, increased heat, set cooldown, and did not produce invalid state. A high-heat probe correctly entered the weapon failure path; the observed `jam` was valid for the current 120-point heat limit rather than an overflow.
5. Selected Injured KUOK in Hater Raid and inspected runtime state while moving. Position changed, animation time advanced, the selected type remained `injured_kuok`, and the runtime loaded its idle/walk sheets without disappearance.
6. Audited all 204 selectable Hater Raid animation sheets in-browser: 204/204 decoded at 512×512. Alpha audit also passed 204/204 with transparent pixels and visible pixels in every one of the sixteen 128×128 cells.
7. Hit all eight fence sections through the actual Space-key attack path. Every section took positive damage. Destroying a section set `breached=true`, advanced the raid to the entry stage, and allowed the player to cross the formerly collidable fence span.
8. Continued through the house entrance while inspecting `player.x/y`, `entry.outsideY`, `entry.insideY`, and `stageIndex`; the runtime transitioned from stage 2 to stage 3 at the intended interior threshold.
9. Found a confirmed gameplay defect during the victory probe: AI companions could reduce speaker HP to zero while the controlled zombie was still crossing the house, causing a passive victory without interacting with the final objective.
10. Fixed companion speaker damage in `src/hater-raid.js` by flooring AI damage at 1 speaker HP. The controlled zombie remains the only actor that can land the final blow.
11. Re-ran the fix against the local runtime on port 8000. With the player 565.8 pixels away, six companions reduced the speaker to exactly 1 HP while phase remained `active`; moving the player into range and pressing Space reduced it to 0 and changed phase to `won`.
12. Re-ran the defeat transition with player HP forced to zero. The next runtime update changed Hater Raid phase from `active` to `lost`.
13. Browser/source cleanup found no `TEMP DEBUG:` markers in `src/`. All probes lived only in browser memory and were cleared by reload.
14. The HTTP audit found one missing `/favicon.ico` request. Added an explicit PNG favicon declaration in `index.html`; the final reload fetched it with HTTP 200. Runtime modules, JSON, start images, SFX, locale, scenario, and music requests also returned HTTP 200.
15. Final console note: the browser log retains one earlier `SyntaxError` at the production page timestamp 21:48:50. It was created by a rejected malformed `ToolBrowserRunJavaScript` diagnostic snippet, not by a project script. Fresh local boot initialized `window.__dev`, the 1920×1200 Canvas, and all startup assets without a new game-source exception.

## 2026-08-28 — Final production deployment verification

1. Ran syntax validation for `src/game.js` and `src/hater-raid.js`; both passed.
2. Ran `git diff --check`; no whitespace or patch errors were found.
3. Committed release changes as `c56938e` and pushed `main` to GitHub.
4. Verified Railway deployed the new HUD copy, Hater Raid speaker HP-floor fix, and favicon at `https://the-last-of-stas-web-production.up.railway.app/`.
5. Confirmed the production browser console had no errors, warnings, failed loads, or 404s.
6. Found one harmless empty `src` attribute on the hidden ending image during the final asset audit; removed it to prevent a redundant document request.
7. Rechecked the fix locally: the image now has no `src`, the browser console is clean, and horizontal overflow remains zero.
8. Committed the hidden-image microfix as `ccae602`, pushed `main`, and waited for Railway to redeploy.
9. Verified production serves the new image markup without an empty `src`, retains the favicon, updated preparation HUD, and Hater Raid speaker HP-floor fix.
10. Final production smoke check passed: 1920×1200 Canvas initialized, horizontal overflow is zero, no visible image failed, and the browser console contains no errors, warnings, failed requests, or 404s.
11. Closed the final review and redeploy checklist. Public URL: `https://the-last-of-stas-web-production.up.railway.app/`.

## 2026-08-29 — Zombie mode label correction

1. Replaced the pre-hydration header and mode-card label `ИГРАТЬ ЗА ЗОНБЕ` with `ИГРАТЬ ЗА ЗОНДБЕ`.
2. Updated the hydrated Russian locale value for `btn_hater_raid` to the same spelling.
3. Confirmed the obsolete label no longer exists in runtime HTML, JavaScript, or locale JSON.
4. Browser-checked both visible labels: both render `ИГРАТЬ ЗА ЗОНДБЕ`, horizontal overflow is zero, and the console is clean.

## 2026-08-29 — Mommy Zombie fast integration

1. Reviewed the uploaded mother-and-child reference and selected the reference-driven GPT Image character workflow.
2. Generated `assets/zombies/new-batch-01/mommy_zombie.png` as the picker concept (1024×1536).
3. Generated `assets/zombies/new-batch-01/masters/mommy_zombie_4dir_master_alpha.png` as the four-direction paired-unit runtime master (1024×1024).
4. Validated the master alpha in-browser: 74.53% fully transparent pixels; no checkerboard baked into the image.
5. Registered `mommy_zombie` data with 72 base HP, speed 31, damage 5 and 2.0 s attack interval.
6. Added the label `ЗОМБИ-МАМОЧКА`, concept portrait, fallback master, draw size and runtime scale.
7. Added Mommy Zombie to the `Новые зомби` Hater Raid tab and to mixed waves 2–5 of First Night.
8. Browser-tested the picker: 12 New Zombies cards, portrait loaded at 1024×1536 without fallback.
9. Browser-tested playable Hater Raid: selection starts correctly, HUD reports `ЗОМБИ-МАМОЧКА`, and the paired mother-and-child sprite renders at readable scale with transparent background.
10. Checked the edited files with `git diff --check`; no whitespace errors.
11. Clean runtime module load completed. The only retained console item belonged to an earlier malformed automation probe at 19:41:01, not game code; no runtime asset 404 or module errors were produced by the clean load.
12. Committed the verified integration as `d439804` (`Add playable Mommy Zombie`) and pushed it to public `main`.
13. Confirmed the Railway production deployment serves the updated zombie data and both Mommy Zombie PNG assets; the production console contains no errors, warnings, failed requests, or 404s.

## 2026-08-29 — Zombie Medic ally + Main Hater mini-boss runtime integration

1. Reviewed the existing medic/hater plan, runtime data, scenario roster, Hater Raid roster, rendering paths and generated transparent assets.
2. Confirmed `zombie_medic_runtime.png` and `main_hater_runtime.png` decode successfully at 1024 px width and render through dedicated runtime-cutout paths.
3. Verified the Zombie Medic initializes inside the shelter, remains clamped to the interior bounds and does not participate in map-wide combat.
4. Ran the deterministic healing probe: Stas was reduced to 50 HP, the medic restored 12 HP to 62, set the 6.5 s cooldown and triggered the heal flash.
5. Verified the Main Hater runtime entity uses 190 HP, 25 movement speed, 10 damage, 2.15 s base attack interval and a dedicated 92 px draw size.
6. Verified the hostile aura configuration: 150 world-unit radius, 1.22 movement multiplier and 0.78 attack-interval multiplier for nearby non-boss zombies.
7. Confirmed the Main Hater static cutout, red aura ring, health bar and ordinary horde interaction render correctly in the live canvas.
8. Added `featured_type` support to wave construction so encounter identities are guaranteed rather than randomly omitted by the shuffle-bag subset.
9. Marked `main_hater` as the featured type of wave 5 and ran 50 shuffled final-wave roster builds: all 50 contained exactly one Main Hater and retained the configured 20-entity wave size.
10. Confirmed the Main Hater appears in the **Новые зомби** picker with the generated 1024×1536 concept portrait; all portraits in the tab decoded successfully.
11. Launched Hater Raid as Main Hater and verified active state, 389 raid HP, six AI companions, runtime rendering, movement, fence-stage interaction and HUD identity.
12. Checked desktop and 9:16 reel layouts: canvas remains within viewport bounds with no horizontal or vertical document overflow; medic/hater labels and raid HUD remain readable.
13. Audited browser logs for errors, warnings, failed loads, 404s and undefined references: no matching entries.
14. Added dev-only probes for medic healing/bounds, Main Hater aura state and repeated featured-wave roster validation; production behavior remains unaffected when `?dev` is absent.

### Production verification follow-up

15. Pushed integration commit `a4e1098` to `origin/main`; Railway auto-deploy completed and served the updated medic, Main Hater and featured final-wave data with HTTP 200.
16. Production behavioral probe confirmed medic healing (player HP `50 → 62`) and `main_hater` inclusion in `100/100` generated final-wave rosters, each of size `20`.
17. Production picker regression exposed a stale nested `hater-raid.js` browser cache: the deployed data was current, but the Main Hater card could be absent in an existing browser session.
18. Fixed nested-module cache invalidation by versioning the `hater-raid.js` import and bumped the root `game.js` cache key.
19. Re-tested locally: Main Hater card is present under `Новые зомби`; portrait loads at `1024×1536`; runtime syntax and diff validation pass.
20. Committed and pushed cache fix `3892f11`; Railway served the corrected release.
21. Re-tested the production picker after image load: Main Hater card is present, portrait returns HTTP 200 (`image/png`) and renders at `1024×1536`.
22. Started Hater Raid as Main Hater in production: mode active, selected type `main_hater`, HP `389`, six companion zombies spawned, and the character rendered without an opaque background.
23. Re-tested Stas mode in production: Zombie Medic rendered inside the shelter and healed the controlled player from `50` to `62`, applying the expected `6.5s` cooldown.
24. Re-ran featured-wave validation in production: `main_hater` present in `100/100` final-wave rosters, roster size remained `20`.
25. Final production console audit found no errors, warnings, failed loads, 404s or undefined-reference messages. Deployment checklist closed.

## 2026-08-29 — Production clicks incident

1. Reproduced the deployed start screen and confirmed its pointer hit target was inside the mode card, while a scripted card click opened gameplay. This ruled out a permanent CSS overlay and pointed to startup/runtime availability.
2. Audited startup-critical browser APIs and replaced `String.replaceAll` and `Array.at` usage on input paths with compatible helpers; made mobile detection tolerate browsers without `userAgentData` or `matchMedia`.
3. Added explicit game boot state, startup-click queuing, a 12-second loading warning, and a visible reload action when the ES module fails instead of leaving clickable-looking dead cards.
4. Bumped both the main game and Hater Raid module revisions so production cannot combine stale HTML with newer modules.
5. Added Caddy `no-cache, no-store, must-revalidate` headers for HTML, JavaScript, scenario data, and locales to prevent mixed-version deploys.
6. Ran local production-like pointer flows using real hit-testing and dispatched pointer/mouse events: Stas card opened gameplay, the Canvas accepted input, Zombie mode entered Hater Raid, taunt buttons raised provocation, and Canvas interaction remained active.
7. Confirmed all mode handlers were functions after boot, `data-game-ready=true`, no matching browser-console errors, clean JavaScript syntax for `game.js` and `hater-raid.js`, clean `git diff --check`, and no `TEMP DEBUG:` markers.
8. Cross-engine limitation: the available browser runner is Chromium. Firefox and Safari were covered by removing the identified unsupported startup APIs and retaining standards-based Pointer/Mouse events, but still require a real-device smoke test after production deploy.
9. Deployed commit `6363378` through the GitHub/Railway production pipeline and confirmed the live page loaded `click-hotfix-1` with `data-game-ready=true` and attached handlers for both start cards.
10. Verified live response headers for `/`, `/index.html`, and `/src/game.js`: each returned `Cache-Control: no-cache, no-store, must-revalidate` and `Pragma: no-cache`.
11. Re-ran production pointer flows: the Stas card opened gameplay and exposed an interactive Canvas; the Zombie card opened the picker, a zombie card and `НАЧАТЬ РЕЙД` started Hater Raid, a taunt raised provocation, and an exposed Canvas point accepted the raid attack click.
12. Final production console audit returned no entries. The click incident is closed in the available Chromium production runner.
