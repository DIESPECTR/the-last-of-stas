---
SECTION_ID: docs.props-turrets-traps-regression-report
TYPE: note
STATUS: active
---

# Props / Turrets / Traps — Chronological Action Log & Final Regression Summary

Export of sections **§37–41** of `meta/docs/development-action-log.md`, plus the final regression
summary for the destructible defence layer: 15 photorealistic prop assets with
`intact / damaged / ruined` states, rendering and bounds, placement rules, the `prompt` / `promptKind`
fix, radii, and turret/trap interactions and fixes.

- **Source log:** `meta/docs/development-action-log.md` (41 sections; §1–36 cover earlier passes)
- **Plan checklist:** `meta/plans/weapon-lab-mvp.md`
- **Invariants:** `meta/facts/defence-layer-contract.md`
- **Modules touched:** `src/blood.js`, `src/turrets.js`, `src/destructibles.js`,
  `src/interaction.js`, `src/environment.js`, `src/shelter.js`, `src/game.js`, `src/devtools.js`

---

## Part 1 — Chronological action log

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

---

## Part 2 — Final regression summary

### Verification matrix

| Area | Measurement | Result |
|---|---|---|
| Prop assets | `15` slots (`5 kinds × intact/damaged/ruined`), all `ready` and `keyed` | ✅ |
| Photographic path | all `15` staged in one yard, counted by object identity | ✅ `15/15`, 1 draw per frame, no procedural fallback |
| Bounds / aspect | trimmed bounds match subject: `fence_ruined 4.78`, `lamp_ruined 0.382` | ✅ |
| Ruined box sizing | `barrel_ruined 30.7×40.3` (was `20.8`), `car_ruined 101.8×46` vs intact `96×41.6`, `fence_ruined 78.4×16.4` | ✅ fixed |
| State progression | `intact → damaged → ruined` driven live for all five kinds | ✅ salvage per step (`2` scrap over two crate steps) |
| Shot blocking | ruined prop stops blocking projectiles | ✅ state-dependent by design |
| Barrel chain | first barrel detonated: drifters `52 → 16/17/6` | ✅ (neighbour shielded by a body — correct priority) |
| Reach radius | accepts exactly `90`, refuses `90.1`, single `REACH` constant | ✅ magic number removed |
| Spacing | trap↔trap `53.9`✗ / `54`✓; turret↔turret `61.9`✗ / `62`✓; both cross rules | ✅ |
| Indoor asymmetry | trap refused (`NOT INSIDE THE HOUSE`, carry unchanged); sentry deployed | ✅ intended |
| Pick-up reach | `60` offers `F · PICK UP TURRET`, `62` offers nothing (strictly-less-than) | ✅ |
| Carried wear | trap `2 → 2 → 2`; sentry `11 → 11`; untouched one stays full | ✅ |
| Wreck salvage | `F` on wreck pays `1 metal_scrap`, `bag: []` | ✅ never a free rebuild |
| Trap arming | `0.4s` delay, charge spent on frame `19` = the frame `armed` hit zero | ✅ nothing lost while `armed > 0` |
| `trappedBy` latch | parked body `180` frames → `0` further charges | ✅ |
| Trap exhaustion | two fresh bodies burn remaining two for `36` each, trap self-removes | ✅ |
| Turret ammo | `18` rounds × `9` damage vs `156` total drifter health | ✅ exact, nothing rounded |
| Turret destruction | one attack round from four bodies = kill; died on exactly `12` damage | ✅ health tuned from measurement |
| `prompt` / `promptKind` | removed as dead state; dev bridge exposes `contextAction` | ✅ |
| IDE panel | `15` cards, `0` placeholders, `0` broken images (slot list from `destructibles.js`) | ✅ |
| Production path | no `devtools.js`, `window.__dev` / `window.__rig` `undefined`, no `__` globals | ✅ |
| Production night (passive) | house `1000 → 13` in `45s`, no shots | ✅ matches tuned passive loss |
| Production night (active) | house held at `135`, `15` kills, peak heat `115/115`, `70` night lines | ✅ cap + lockout + HUD latch hold |
| Final clean load | `15/15` prop assets requested, `0` failures, loop advancing | ✅ |

### Real defects found and fixed — 6

1. **All 15 delivered assets fully opaque** with a white studio background baked in
   (`253,253,254,255` corners, `100%` opaque). Fixed in the loader with an edge-reachable flood-fill
   key, not by re-cutting files, so future alpha-less assets are covered too.
2. **Keying pre-check failed on 13 of 15 files** — a `3×3` downscaled probe averaged whole quadrants
   and the dark subject dragged the "corner" below the white threshold. Corner pixels are now copied
   one at a time.
3. **Bounds scan read `naturalWidth` on a canvas.** After keying the source of truth is a canvas, so
   the scan measured zero and marked every keyed slot not ready — indistinguishable from a missing
   file. The scan now accepts either.
4. **Anisotropic ruined box** drew a burst barrel *narrower* than the intact one (`20.8px` where
   `30px` was expected). Ruined boxes are now widened and flattened per kind.
5. **Dead `prompt` / `promptKind` state** reported a permanent `'none'` while the real prompt was on
   screen. Removed; `contextAction` is exposed instead.
6. **Placement radius duplicated as a magic `90`** in two places. Collapsed into one `REACH`
   constant.

### False failures traced to the harness, not the game — 8

1. Canvas letterboxed at `1.5385`: one client pixel is `1.54` world pixels, so integer synthetic
   clicks can never land on the threshold under test (produced the false `54px` refusal).
2. Probe geometry: the point under test sat `22px` from an anchor trap, so the trap rule refused
   before the turret rule was consulted.
3. `update()` stops once the night reaches `duration` — damage probes read frozen frames and zero
   damage.
4. `#start` only calls `reset()` when the phase is **not** `idle`, so a click silently reused the
   old session and leaked stale inventory.
5. Injected helpers are wiped by a reload; probes must be self-contained, not fixtures.
6. Prop bounds fields are `width` / `height`, not `w` / `h` (produced `NaN` sizes).
7. A keyed slot hands `drawImage` a canvas with no `.src`, so a filename regex reported a false
   `0/15`.
8. A body standing `24px` in front of the second barrel ate every projectile — correct collision
   priority, not a broken chain.

Two further apparent defects were the design working: the economy refusing the second craft on night
one (`teeth` spent on the trap), and the passive-night house drain matching the tuned figure exactly.

### Artefacts

- `meta/docs/development-action-log.md` — §37–41 recorded chronologically
- `meta/plans/weapon-lab-mvp.md` — `Atmosphere, Blood, and Destructible Defences` and
  `Prop / Turret / Trap Regression` checklists closed
- `meta/facts/defence-layer-contract.md` — invariants pinned so the boundaries are not re-measured
  next session

### Still open

- Full siege with Runner and Spitter waves against the new props and turrets, confirming animations,
  scales and health bars at gameplay scale.
- Balance the new layer: salvage payout per destroyed prop, and whether barrel chains make the yard
  too strong.
- Re-check the responsive layout against the new environment, blood and prop layers.
