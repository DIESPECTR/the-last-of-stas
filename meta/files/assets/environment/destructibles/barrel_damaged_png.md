---
SECTION_ID: files.assets.environment.destructibles.barrel_damaged_png
TYPE: file/image
---

# Fuel Barrel — Damaged State

FILE: assets/environment/destructibles/barrel_damaged.png
DESCRIPTION: Photoreal top-down cutout of a punctured steel fuel barrel, still upright, leaking from a bullet hole in its side.
UTILITY: gpt_image
WIDTH: 896
HEIGHT: 1136
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Volatile yard prop. Shown when the barrel takes its first destruction step; the leak is the visual warning that the next hit detonates it.
PROMPT: |
  Goal: one isolated game asset — a single punctured steel fuel barrel, photographed from directly overhead, for a top-down survival game.
  Subject: a 200 litre steel drum standing upright, faded olive-grey paint almost gone, deep rust across the rolling hoops and the rim. The lid is dented and bowed, one bung cap missing leaving a dark open hole, a ragged torn puncture in the upper body with the metal petalled outward, thick dark fuel weeping from the puncture and running down the ribbed side in a glossy black streak.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, barrel centred, the circular lid filling most of the frame with the ribbed body just visible around it, small even margin, no perspective distortion.
  Style: photorealistic corroded steel, believable pitted metal and glossy wet fuel materials, deep warm palette — dark oxidised brown-olive drum body (#2e2a18, #241a10), near-black shadow inside the open bung hole and the torn puncture, heavy saturated rust-orange across the hoops and around the tear, the leaking fuel reading as a glossy near-black streak catching one warm amber specular highlight; no grey, no overcast daylight, no desaturated cold palette, no flat mid-grey metal.
  Constraints: uniform pure white background for clean automatic cutout, exactly one barrel, no ground, no cast shadow, no fire, no flames, no people, no text, no hazard labels, no printed lettering, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- The leak is a gameplay tell, not decoration: it must be the most contrasty element in the asset so the player reads "this one is about to go".
- Still upright and still blocking shots — silhouette stays a full circle.
- Same centre and diameter as the intact variant so the state swap does not shift the prop.
