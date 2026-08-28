---
SECTION_ID: files.assets.environment.destructibles.lamp_damaged_png
TYPE: file/image
---

# Street Lamp — Damaged State

FILE: assets/environment/destructibles/lamp_damaged.png
DESCRIPTION: Photoreal top-down cutout of a street lamp still standing but bent, its housing cracked and the diffuser shattered.
UTILITY: gpt_image
WIDTH: 736
HEIGHT: 1536
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Yard light source. In this state the lamp still casts a pool of light, but the engine drives it with a hard flicker to sell the damaged wiring.
PROMPT: |
  Goal: one isolated game asset — a single damaged street lamp seen from above, for a top-down survival game.
  Subject: a bent steel lamp post with a rectangular cobra-head housing at the top. The post is buckled and leaning noticeably out of vertical, grey galvanised paint peeling to rust along the seams. The housing is cracked open at one corner, the glass diffuser shattered into a jagged hole with fragments still clinging in the frame, the exposed lamp inside blackened and cracked, a chewed-open cable hanging loose from the joint.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, the post running vertically down the frame with the lamp housing at the top end, whole lamp inside the frame with a small even margin, foreshortened as a genuine overhead shot, no perspective distortion.
  Style: photorealistic corroded metal, believable pitted steel, buckled housing and shattered glass materials, deep warm palette — dark brown-black pole (#1c1710, #2e2417) with near-black shadow inside the smashed lamp head and every dent, heavy saturated rust-orange corrosion and fresh bare-metal tearing where the housing is split, broken glass reading as dark smoked amber shards, faint warm amber highlight on the bent upper edges; no grey, no overcast daylight, no desaturated cold palette, no flat mid-grey metal.
  Constraints: uniform pure white background for clean automatic cutout, exactly one lamp, no ground, no road, no cast shadow, no glow, no lens flare, no light beam, no people, no text, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- No glow baked into the asset: the light pool is a procedural Canvas layer, otherwise the lamp would shine at noon.
- The lean and the broken diffuser are the readable cues; the loose cable justifies the flicker.
- Post runs vertically so the engine rotation matches the intact and ruined variants.
