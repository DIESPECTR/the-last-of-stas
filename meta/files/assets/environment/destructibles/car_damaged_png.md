---
SECTION_ID: files.assets.environment.destructibles.car_damaged_png
TYPE: file/image
---

# Wrecked Car — Damaged State

FILE: assets/environment/destructibles/car_damaged.png
DESCRIPTION: Photoreal top-down cutout of an abandoned sedan after the first stage of destruction — smashed glass, buckled panels, still standing on its wheels.
UTILITY: gpt_image
WIDTH: 1536
HEIGHT: 736
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Yard cover prop in the top-down siege scene. Replaces the procedural car drawing when the prop reaches the `damaged` state; the engine stretches it to 96x46 world units and rotates it around its centre.
PROMPT: |
  Goal: one isolated game asset — a single damaged abandoned car, photographed from directly overhead, for a top-down survival game.
  Subject: an old European sedan, dull grey-green faded paint, long rust blooms along the roof seams and door edges. Windscreen and rear window shattered into opaque crazed glass, driver door dented inward and hanging slightly open, bonnet buckled upward with a visible crease, one wing mirror torn off, wipers bent. Roof covered in road grime, dried mud spatter and a few dark dried stains. Tyres still inflated, car sitting level on all four wheels.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, car horizontal across the frame with its nose to the right, whole vehicle inside the frame with a small even margin, no perspective distortion, no visible sides of the body beyond what an overhead camera sees.
  Style: photorealistic battered vehicle, believable buckled metal and shattered glass materials, deep warm palette — dark oxidised brown-green bodywork (#2a2a1e, #3a3526), near-black shadow inside every dent, tear and smashed window, heavy saturated rust-orange along the torn edges and exposed bare steel, faint warm amber highlight on the raised crumple ridges; no grey, no overcast daylight, no desaturated cold palette, no flat mid-grey metal.
  Constraints: uniform pure white background for clean automatic cutout, exactly one car, no ground, no asphalt, no cast shadow, no people, no other objects, no text, no number plate lettering, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Must stay readable at ~96px wide: damage has to change the SILHOUETTE (open door, torn mirror, buckled bonnet), not only the texture.
- Nose points right so the engine rotation matches the intact/ruined variants — all three states must share the same orientation and footprint.
- Still blocks projectiles in this state, so the body must read as solid.
