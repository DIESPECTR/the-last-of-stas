---
SECTION_ID: facts.weapon-layer-contract
TYPE: note
STATUS: active
---

# Weapon Layer Contract

Facts established by the full weapon-layer regression. Treat these as invariants: each one was a real
defect before it was a rule, so breaking them silently reintroduces a shipped bug.

## Heat and failure

- Heat is **hard-capped** at the weapon's `heat_limit`. It was unbounded once, which let a Corpse Burner
  reach `752` against a limit of `142` and saturated the `heat/heat_limit` risk term far above `1`.
- Failure risk is clamped to `.55`, so no weapon becomes unusable by arithmetic alone.
- Reaching the cap **locks the weapon regardless of its flaw**. Previously only `jam` set `failed`, so
  `backfire` and `noise_spike` weapons sat pinned at the ceiling and fired forever.
- Every lock path must stamp `failureKind`. `jam` did not, so a stale `overheat` from a previous lock
  mislabelled a cold jammed barrel as `OVERHEATED` in the HUD.
- `craft()` must clear `heat`, `failed` **and** `failureKind`. Swapping weapons is a legitimate escape
  from a lock, and a surviving `failureKind` mislabels the next one.
- `R` sets heat to at most `40%` of the cap and clears both `failed` and `failureKind`. That lands below the
  `60%` risk threshold on purpose, so clearing a failure buys a real burst rather than one shot.
  `R` works in `idle`, `break` and `wave` — locking it to `wave` left a cold overheated barrel stuck in
  the yard after free-roam firing.

### Measured limits and peaks

| weapon | flaw | heat limit | measured peak |
|---|---|---|---|
| `bone_sprayer` | `jam` | `115` | `82`–`90` |
| `corpse_burner` | `backfire` | `142` | `142` (cap) |
| `crying_hedgehog` | `noise_spike` | `128` | `128` (cap) |

Read limits from the Test Chamber, never from a guessed constant — one "cap violated" result during
testing was a wrong assumed number, not a game defect.

## Flaw behaviours

- `backfire` reverses the shot by exactly `180°` from the aim vector and emits `s.projectiles` reversed
  projectiles per event.
- `noise_spike` emits a noise event of exactly `noise × 2.5` (measured `375 → 938`) plus one `scream` effect.
- Neither `backfire` nor `noise_spike` locks the weapon; only a `jam` roll or reaching the heat cap does.

## HUD

- Readout format is `heat / cap`, because a bare heat number gives no sense of proximity to failure.
- `statusRank` **expires together with its hold**. Latching it permanently silenced the per-frame night
  readout after the very first alert. Terminal rank `2` is the deliberate exception and survives every
  later alert, but a new session must unlatch it.
- Transient alerts (`BACKFIRE`, `NOISE SPIKE`) cannot be observed by sampling on `failed` — they never
  set it. Capture the HUD as a continuous stream instead.

## Rendering

- The weapon is an **independent runtime layer**, drawn exactly `1:1` per frame against the body sheet.
- Draw order flips with facing: aiming up gives `WEAPON > BODY`, aiming down gives `BODY > WEAPON`.
- Hand anchor: `HAND_REACH 12`, `HAND_Y -3`, with a `.55` vertical squash — right `+12/-3` at `0°`,
  left `-12/-3` at `-180°`, down `0/+3.6` at `90°`, up `0/-9.6` at `-90°`.
- Switching produces `0` mixed frames and `0` frames of latency: the new texture appears on the very
  frame the equip happens.

## Debug surface

- All probes and the balance harness live in `src/devtools.js`, imported **only** with `?dev=1`.
  A clean load fetches no such module and leaves `window.__dev` undefined.
- `instantSpawn` is module-private, so the harness receives a setter; `state` is exposed as a getter
  because every session replaces the object.
- Production has no state hooks by design. Verify player-facing behaviour through the HUD only.

## Testing pitfalls found the hard way

- Counting muzzle effects by list-length delta undercounts badly (`2` instead of `30`): at `13` shots/s
  several `0.09s` flashes overlap and the count never returns to zero. Track effect identity instead.
- A probe returning zeros usually means the session already reached a terminal phase (`survived` or
  `lost`), not that the feature is broken. Check `phase` before rewriting the probe.
- `START` is disabled mid-siege, so clicking it does not run `reset()` and a "gate" test silently
  measures stale `unlocked` state.
- Shelter invulnerability used while measuring must be memory-only, re-asserted per frame, and switched
  off before final checks.
