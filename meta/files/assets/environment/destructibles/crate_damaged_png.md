---
SECTION_ID: files.assets.environment.destructibles.crate_damaged_png
TYPE: file/image
---

# Crate Stack — Damaged State

FILE: assets/environment/destructibles/crate_damaged.png
DESCRIPTION: Photoreal top-down cutout of a wooden supply crate with its lid staved in and one corner splintered open, still stacked and standing.
UTILITY: gpt_image
WIDTH: 1024
HEIGHT: 1024
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Salvage-bearing cover prop. Shown after the crate stack takes its first destruction step; it still blocks projectiles in this state.
PROMPT: |
  Goal: one isolated game asset — a single damaged wooden supply crate, photographed from directly overhead, for a top-down survival game.
  Subject: a square rough-sawn pine crate with rusted steel corner brackets and bent nails. The lid planks are staved inward, two boards cracked along the grain and one snapped clean leaving a dark gap into the interior, splinters standing up around the break. One corner bracket is torn loose and peeled back. Grey weathered timber, damp patches, mud smears and old water staining across the boards.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, crate centred and square to the frame, small even margin, no perspective distortion, only the lid and the very top edges of the sides visible.
  Style: photorealistic weathered timber, believable splintered wood grain and rusted steel banding, deep warm palette — dark damp brown planks (#3a2a18, #241a10), near-black shadow inside the broken gap and under the peeled bracket, saturated rust-orange on the bent nails and torn banding, pale warm ochre on the fresh splintered breaks so the damage reads, faint amber highlight along the top edges; no grey, no overcast daylight, no desaturated cold palette, no pale bleached wood.
  Constraints: uniform pure white background for clean automatic cutout, exactly one crate, no ground, no cast shadow, no people, no other objects, no stencilled text, no printed markings, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- The broken board and the dark gap are the readable damage cues at ~38px; surface staining alone would vanish at gameplay scale.
- Square to the frame, same centre as the intact state, because the engine rotates crates individually.
- Still solid cover, so the outline must stay an unbroken square.
