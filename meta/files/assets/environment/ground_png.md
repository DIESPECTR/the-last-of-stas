---
SECTION_ID: files.assets.environment.ground_png
TYPE: file/image
---

# Yard Ground Tile

FILE: assets/environment/ground.png
DESCRIPTION: Seamless top-down tile of wet abandoned yard dirt — packed mud, dead grass patches, gravel, cracked concrete slabs.
UTILITY: ideogram
MODE: tiling
TILING_MODE: both
WIDTH: 1024
HEIGHT: 1024
OUTPUT_FORMAT: png
RENDERING_SPEED: BALANCED
USAGE: Canvas ground layer of the First Night yard, repeated as a pattern under every entity.
PROMPT: |
  Seamless tileable top-down texture of wet neglected yard ground at night, photorealistic.
  Material: packed damp dark-brown mud, near-black wet soil, patches of dead flattened grass, scattered gravel, one cracked earth fissure, faint tyre ruts filled with dark water.
  Palette: deep saturated warm earth tones — near-black shadow base (#14100a), rich dark browns (#2e2114, #3a2a18), subtle warm amber wet sheen on the dampest patches; absolutely no grey, no desaturated tones.
  Mood: low-key moody night ground for a survival horror game, dark but with readable warm texture detail.
  Flat even lighting, orthographic top-down, no cast shadows, no vignette, no objects, no characters, no text, no watermark, no border.

COMMENTS: ## Design Notes
- Locked style reference: assets/style/first_night_screen.png — near-black base (L 4–12%) with warm amber accents (saturation 38–53%).
- Previous version was charcoal-pencil grey (L 22–61%, sat 4–9%) — the direct cause of the "grey mush" look; never return to a desaturated palette.
- Texture base should sit around L 12–28% warm brown so the night grade lands it at the reference's L 5–15% without crushing detail.
- No strong repeating landmark — a single bright element would visibly tile across the yard.
