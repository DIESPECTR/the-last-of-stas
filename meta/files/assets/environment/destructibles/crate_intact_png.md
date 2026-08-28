---
SECTION_ID: files.assets.environment.destructibles.crate_intact_png
TYPE: file/image
---

# Crate Stack — Intact State

FILE: assets/environment/destructibles/crate_intact.png
DESCRIPTION: Photoreal top-down cutout of a closed wooden supply crate, weathered but whole.
UTILITY: gpt_image
WIDTH: 1024
HEIGHT: 1024
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Starting state of the salvage-bearing cover prop, drawn at 38x38 world units and rotated per instance.
PROMPT: |
  Goal: one isolated game asset — a single closed wooden supply crate, photographed from directly overhead, for a top-down survival game.
  Subject: a square rough-sawn pine crate with rusted steel corner brackets and rows of flat nail heads. The lid is closed and flat, five parallel boards with visible saw marks and open grain, narrow dark gaps between them. Grey weathered timber, damp patches, old water staining, a little moss in one corner and dried mud along the edges.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, crate centred and square to the frame, small even margin, no perspective distortion, only the lid and the very top edges of the sides visible.
  Style: photorealistic weathered timber, believable wood grain and rusted steel banding, deep warm palette — dark damp brown planks (#3a2a18, #241a10) with near-black shadow in every plank gap, saturated rust-orange on the banding and nail heads, faint warm amber highlight along the top edges as if lit by a distant streetlamp; no grey, no overcast daylight, no desaturated cold palette, no pale bleached wood.
  Constraints: uniform pure white background for clean automatic cutout, exactly one crate, no ground, no cast shadow, no people, no damage, no broken boards, no stencilled text, no printed markings, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Flat closed lid gives the damaged state's staved-in boards maximum contrast.
- Square and centred like the other two states; the engine rotates each crate instance individually.
- Solid unbroken outline, since this state blocks projectiles.
