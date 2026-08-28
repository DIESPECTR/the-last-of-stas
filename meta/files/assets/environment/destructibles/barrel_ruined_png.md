---
SECTION_ID: files.assets.environment.destructibles.barrel_ruined_png
TYPE: file/image
---

# Fuel Barrel — Ruined State

FILE: assets/environment/destructibles/barrel_ruined.png
DESCRIPTION: Photoreal top-down cutout of a barrel blown apart and flattened after detonation — split shell lying on its side inside a burnt scorch ring.
UTILITY: gpt_image
WIDTH: 896
HEIGHT: 1136
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Final state of the volatile barrel, drawn immediately after the explosion that damages everything around it.
PROMPT: |
  Goal: one isolated game asset — a single steel fuel barrel that has exploded, photographed from directly overhead, for a top-down survival game.
  Subject: the barrel is torn open and lying flat. The shell is split lengthwise and peeled outward like a burst can, the lid blown clear and warped, jagged shrapnel edges, all paint burnt off to scorched blue-black tempered steel with orange oxidisation. A dark greasy scorch ring and scattered soot flecks and small twisted metal shards spread tightly around the flattened shell.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, wreckage centred and clearly wider and flatter than an upright barrel, small even margin, no perspective distortion.
  Style: photorealistic scorched steel, believable burnt and heat-warped metal materials, deep warm palette — charcoal-black soot (#141009) over dark brown scorched steel (#2e2114), near-black shadow inside the burst shell, heavy saturated rust-orange and burnt copper along every torn petalled edge, a faint dull ember glow deep inside the wreck; no bright fire, no ash grey, no overcast daylight, no desaturated cold palette.
  Constraints: uniform pure white background for clean automatic cutout, exactly one destroyed barrel, no ground, no cast shadow, no fire, no flames, no smoke, no people, no text, no labels, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Must read as flat rubble: it no longer blocks projectiles, so nothing may look like a standing cylinder.
- The scorch ring belongs to the asset, not the ground layer, so it travels with the prop when the prop rotates.
- Wider silhouette than the intact/damaged states is intentional — the engine already draws ruined props 12% wider.
