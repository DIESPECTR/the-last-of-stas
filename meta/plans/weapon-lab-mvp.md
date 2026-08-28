---
SECTION_ID: plans.weapon-lab-mvp
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# Weapon Lab MVP

GOAL: Ship a browser-playable first night proving movement, noise-driven zombies, salvage drops, modular weapons, failures, and live IDE tooling.
TIMELINE: Start now; first vertical slice before expanding content.

## Task Checklist

### Foundation
- [x] Create browser-first game shell and English localization
- [x] Add JSON schemas and first 12 weapon components
- [x] Add three zombies, three weapons, and First Night scenario
- [x] Establish charcoal, dirty-paper, muted-color visual grammar

### Playable Loop
- [x] Implement movement, aiming, firing, noise, horde AI, salvage, house health, and weapon failure
- [x] Add preparation phase before the siege
- [x] Add Weapon Lab and Test Chamber in the game
- [x] Integrate generated survivor sprites and reusable UI frame texture
- [x] Add IDE Weapon Lab view over live project data
- [x] Add live asset pipeline actions for regeneration, WebP grids, and video sprite sheets

### Charcoal Shelter Pass
- [x] Replace arcade stripes and dashboard styling with dirty-paper field-journal UI
- [x] Redraw the arena as a fragile cutaway shelter with rooms, rubble, and barricades
- [x] Retune First Night into long preparation and short violent wave bursts
- [x] Reserve color for danger, fire, infected salvage, and critical state only

### Weapon Visuals & Asset Safety
- [x] Change the survivor-held weapon when the equipped crafting result changes
- [x] Load optional weapon textures with deterministic procedural fallbacks
- [x] Show weapon previews and missing-asset state in Weapon Lab, Test Chamber, inventory, and IDE tooling
- [x] Validate fallback rendering and live texture replacement in browser

### House Preparation
- [x] Add salvage-funded barricade reinforcement and one visible trap
- [x] Validate defense costs, siege availability, reset behavior, and terminal states
- [x] Validate all three gutter-trap triggers against live zombies

### Graphics & Combat Readability Pass
- [x] Regenerate the survivor as a clean unarmed four-direction sheet
- [x] Generate distinct transparent four-direction sheets for Drifter, Runner, and Spitter
- [x] Replace procedural zombie ellipses with alpha-cropped sprite rendering and safe fallbacks
- [x] Add muzzle flash, projectile trails, hit flash, impact marks, and death residue
- [x] Improve shelter, ground, trap, and nighttime lighting readability
- [x] Generate environment textures and remove tiling seams and symmetry artefacts
- [x] Fix layout-independent movement input and weapon anchoring in the survivor's hands
- [x] Validate responsive layout and the IDE view against the new environment layer
- [x] Record every graphics implementation and validation step chronologically

### Character Animation Pipeline
- [x] Split Survivor and Drifter masters into four directional identity inputs
- [x] Generate and inspect control `walk_down` Wan clips for both characters
- [x] Generate `idle / walk / attack` clips for all four directions
- [x] Convert animated WebP clips into transparent `128x128` sprite sheets
- [x] Validate alpha, stable anchors, loop continuity, identity, and empty Survivor hands
- [x] Integrate animation state selection while keeping weapons as a separate runtime layer
- [x] Record generation failures, workarounds, outputs, and validation chronologically
- [x] Generate Runner and Spitter animation clips and sheets
- [x] Integrate Runner and Spitter animation states with per-character scale

### Validation
- [x] Run the game in browser and inspect console
- [x] Verify English-only player-facing text and JSON validity
- [x] Recheck desktop layout, gameplay start, and browser console after shelter pass
- [x] Smoke-test prep → siege, weapon equip, Test Chamber, asset loading, and house-loss terminal state
- [x] Record validation evidence and close completed checklist items

### Weapon Layer Regression
- [x] Move the balance harness and render probes out of the production path into `?dev=1` only
- [x] Verify weapon draw order, hand anchor, and identity per frame for all three weapons
- [x] Verify switching produces no mixed frames and no latency, and that the resource gate blocks the swap
- [x] Add a hard heat cap and an overheat lockout that applies to every flaw
- [x] Verify overheat, jam, backfire, and noise spike numerically, including the `2.5x` spiked noise radius
- [x] Fix the HUD rank latch so the per-frame readout resumes while the terminal outcome stays protected
- [x] Fix the stale `failureKind` mislabel across weapon swaps and jams
- [x] Re-verify every fix on the production path (no `?dev=1`, no state injection, HUD as the only observable)
- [x] Record every regression step chronologically

### Atmosphere, Blood, and Destructible Defences
- [x] Latch the night→dawn grade so the transition frame no longer jumps
- [x] Soften the interior window sight wedges so they stop reading as a harsh black star
- [x] Add the blood layer: spurts, death gushes, wall splatter, and wounded drip trails
- [x] Add carryable, destructible turrets alongside traps with shared placement rules
- [x] Add destructible props with `intact → damaged → ruined` states and per-step salvage
- [x] Generate photographic damaged and ruined art for all five prop kinds
- [x] Integrate the fifteen prop states with white-key transparency and procedural fallbacks

### Prop / Turret / Trap Regression
- [x] Verify all fifteen prop slots render photographically with trimmed bounds and correct aspect
- [x] Drive `intact → damaged → ruined` live for every kind, including salvage payout and shot blocking
- [x] Measure placement legality at the thresholds through the dev bridge, not synthetic clicks
- [x] Verify pick-up reach, carried-wear round trips, turret combat accounting, and wreck salvage
- [x] Verify trap arming delay, the `trappedBy` latch, charge spend, and self-removal
- [x] Remove dead `prompt` / `promptKind` state and expose `contextAction` for honest assertions
- [x] Add the fifteen prop states to the IDE Environment Textures view from the renderer's own slot list
- [x] Re-verify the whole layer on the production path with the DOM as the only observable
- [x] Record every regression step chronologically

## Success Criteria
- [x] Player can complete a night attempt; both the house-loss and the dawn-survival terminal states are validated
- [x] Weapon behavior is assembled from component data
- [x] Zombie kills increase the salvage inventory during a real siege
- [x] Test Chamber reports damage, noise, heat, and failure
- [x] Weapon data is viewable from the Quadcode.ai IDE
