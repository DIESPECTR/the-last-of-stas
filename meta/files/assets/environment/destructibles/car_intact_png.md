---
SECTION_ID: files.assets.environment.destructibles.car_intact_png
TYPE: file/image
---

# Wrecked Car — Intact State

FILE: assets/environment/destructibles/car_intact.png
DESCRIPTION: Photoreal top-down cutout of an abandoned sedan before any siege damage — dirty and long-abandoned, but whole.
UTILITY: gpt_image
WIDTH: 1536
HEIGHT: 736
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Starting state of the car cover prop, drawn at 96x46 world units. Must sit in the same footprint and orientation as the damaged and ruined variants.
PROMPT: |
  Goal: one isolated game asset — a single abandoned but undamaged car, photographed from directly overhead, for a top-down survival game.
  Subject: an old European sedan, dull grey-green faded paint, thin rust blooms starting along the roof seams and door edges. All glass intact but filthy, windscreen covered in dried rain streaks and grime. Every panel closed and straight, both wing mirrors present, roof coated in road dust, dried mud spatter and a scatter of wet leaves. Tyres inflated, car sitting level on all four wheels.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, car horizontal across the frame with its nose to the right, whole vehicle inside the frame with a small even margin, no perspective distortion.
  Style: photorealistic abandoned vehicle, believable painted metal and grimy glass materials, deep warm palette — dark oxidised brown-green bodywork (#2a2a1e, #3a3526) with near-black shadow under the arches and in the window recesses, heavy saturated rust-orange blooming along every seam and wheel arch, faint warm amber highlight along the roof and bonnet edges as if lit by a distant streetlamp, glass reading as dark smoked amber rather than pale grey; no grey, no overcast daylight, no desaturated cold palette, no flat mid-grey metal.
  Constraints: uniform pure white background for clean automatic cutout, exactly one car, no ground, no asphalt, no cast shadow, no people, no other objects, no damage, no broken glass, no text, no number plate lettering, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Baseline for the destruction chain: it must look abandoned, not maintained, or the later states read as an unrelated vehicle.
- Nose to the right and centred exactly like the damaged/ruined variants — the engine swaps textures in place.
- Closed silhouette, since this state blocks projectiles.
