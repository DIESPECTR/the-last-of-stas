---
SECTION_ID: files.assets.environment.destructibles.lamp_intact_png
TYPE: file/image
---

# Street Lamp — Intact State

FILE: assets/environment/destructibles/lamp_intact.png
DESCRIPTION: Photoreal top-down cutout of an upright street lamp with its housing and diffuser whole.
UTILITY: gpt_image
WIDTH: 736
HEIGHT: 1536
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Starting state of the yard light source. The engine draws its steady light pool as a separate procedural layer.
PROMPT: |
  Goal: one isolated game asset — a single intact street lamp seen from above, for a top-down survival game.
  Subject: a straight steel lamp post with a rectangular cobra-head housing at the top. The post is vertical and true, grey galvanised paint dulled and chalky with rust creeping along the seams and around the mounting collar. The housing is closed, its flat glass diffuser intact but dusty and fogged, the lamp visible dimly behind it, the cable entry sealed with a weathered rubber gland.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, the post running vertically down the frame with the lamp housing at the top end, whole lamp inside the frame with a small even margin, foreshortened as a genuine overhead shot, no perspective distortion.
  Style: photorealistic corroded metal, believable pitted steel, peeling paint and dusty glass materials, deep warm palette — dark brown-black pole and housing (#1c1710, #2e2417) with near-black shadow under the arm and inside the lamp head, heavy saturated rust-orange corrosion blooming along the arm, base and every bolt, glass reading as dark smoked amber, faint warm amber highlight along the upper edges as if lit from a neighbouring lamp; no grey, no overcast daylight, no desaturated cold palette, no flat mid-grey metal.
  Constraints: uniform pure white background for clean automatic cutout, exactly one lamp, no ground, no road, no cast shadow, no glow, no lens flare, no light beam, no damage, no broken glass, no people, no text, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Absolutely no baked glow — the light pool is procedural, so a lit asset would shine in daylight and during the blackout.
- Perfectly vertical post so the damaged state's lean reads as damage, not as art variation.
- Same orientation and centre as damaged/ruined for a clean state swap.
