---
SECTION_ID: facts.defence-layer-contract
TYPE: fact
STATUS: active
---

# Defence Layer Contract (props, turrets, traps)

Invariants established by the full prop/turret/trap regression. Each one was measured at its own
boundary, not near it. Breaking any of these is a regression, not a tuning change.

## Placement rules (`interaction.js`)

- Reach is a single constant, `REACH = 90`. A drop is accepted at exactly `90` and refused at `90.1`.
  The radius is no longer duplicated as a literal anywhere.
- Spacing is compared against the *sum of radii* of the two objects involved:
  - trap vs trap refuses `53.9`, accepts `54`;
  - turret vs turret refuses `61.9`, accepts `62`;
  - cross-kind checks honour the other kind's radius, so a turret respects trap spacing and back.
- Placement is deliberately **asymmetric**: a trap indoors is refused (`NOT INSIDE THE HOUSE`) and
  the carry count does not move, while a turret may be deployed indoors so a tripod can cover a
  doorway. This is intended, not an oversight.
- Rules are evaluated in order and the first refusal wins. A probe standing near a trap will be
  refused by the trap rule before the turret rule is ever consulted — a common source of false
  failures when measuring.

## Pick-up

- A turret is offered when the distance is `< REACH + turretRadius` (`= 62`). `60` offers
  `F · PICK UP TURRET`, `62` offers nothing. The comparison is strictly-less-than.
- Wear survives the round trip: a trap with `2` charges returns with `2` and redeploys with `2`;
  an `11`-round sentry returns as an `11`-round machine and an untouched one stays full.
- A destroyed sentry pays exactly `1 metal_scrap` and **never** returns a working machine to the
  bag. A wreck is salvage, not a free rebuild.

## Traps

- A freshly placed trap has a `0.4s` arming delay. No charge can be spent while `armed > 0`, even
  with a body already standing on it; the spend lands on the exact frame `armed` reaches zero.
- `trappedBy` latches one body per trap: a held zombie consumes no further charges for as long as
  it is held.
- A trap removes itself from the yard when its last charge is spent.

## Turrets

- Ammo accounting is exact, never rounded: `18` rounds at `9` damage killed three drifters with
  `156` total health.
- Turret health is tuned so one attack round from four drifters destroys it (`12` damage taken),
  keeping placement a real decision. A drifter deals `3` damage per `2.2s` swing.

## Destructible props (`destructibles.js`)

- Five kinds (`car`, `barrel`, `crate`, `fence`, `lamp`) × three states
  (`intact`, `damaged`, `ruined`) = **15** texture slots, keyed `<kind>_<state>`.
- Salvage is paid **per step**, not on destruction: a crate pays `2` metal scrap across its two
  steps.
- A `ruined` prop stops blocking shots. `blocksShot` is state-dependent by design.
- All fifteen states load as photographic cutouts with white-key transparency, and each still has a
  deterministic procedural fallback.
- Bodies take projectile collision priority over props behind them, so a barrel shielded by a
  zombie legitimately takes no damage. This is not a broken explosion chain.

## Prompt state

- There is **no** stored `prompt` / `promptKind`. Both once existed, were never written to, and
  reported a permanent `'none'` while a real prompt was on screen. The contextual prompt is
  recomputed once per frame; the dev bridge exposes `contextAction` and that is the only honest way
  to assert what `F` would do.

## Measurement rules learned the hard way

- The canvas is letterboxed at `1.5385`, so one client pixel is `1.54` world pixels. Synthetic
  clicks can never land on a threshold — measure radii through the dev bridge instead.
- Helpers injected into browser memory are not fixtures. A reload wipes them, so every probe must
  be self-contained.
- `update()` stops once the night reaches `duration`. Damage tests that appear to record zero are
  usually running against a stopped clock.
- A keyed texture slot hands `drawImage` a canvas, which has no `.src`. Count draws by object
  identity; a filename regex will report a false zero.
- Prop bounds fields are `width` / `height`, not `w` / `h`.
- Night tint and vignette crush exactly the mid-tones these cutouts live in. Capture art checks at
  the dawn end of the grade.
