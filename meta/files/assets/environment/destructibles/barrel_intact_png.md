---
SECTION_ID: files.assets.environment.destructibles.barrel_intact_png
TYPE: file/image
---

# Fuel Barrel — Intact State

FILE: assets/environment/destructibles/barrel_intact.png
DESCRIPTION: Photoreal top-down cutout of a sealed steel fuel barrel standing upright, rusty but unbreached.
UTILITY: gpt_image
WIDTH: 896
HEIGHT: 1136
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Starting state of the volatile yard prop. Two of these sit beside the shelter; a stray shot starts the chain that ends in the explosion.
PROMPT: |
  Goal: one isolated game asset — a single sealed steel fuel barrel, photographed from directly overhead, for a top-down survival game.
  Subject: a 200 litre steel drum standing upright and closed. Faded olive-grey paint worn thin, heavy rust across the rolling hoops and around the rim, pitting and old scrapes down the ribbed sides. The lid is flat and unbroken with both bung caps screwed tight, a shallow ring of rainwater and grit standing on top, damp streaks running off the rim.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, barrel centred, the circular lid filling most of the frame with the ribbed body just visible around it, small even margin, no perspective distortion.
  Style: photorealistic corroded steel, believable pitted metal and flaking paint materials, deep warm palette — dark oxidised brown-olive drum body (#2e2a18, #241a10) with near-black shadow around the rim and inside the hoop channels, heavy saturated rust-orange blooming across the hoops and lid, faint warm amber highlight along the rim as if lit by a distant streetlamp; no grey, no overcast daylight, no desaturated cold palette, no flat mid-grey metal.
  Constraints: uniform pure white background for clean automatic cutout, exactly one barrel, no ground, no cast shadow, no leaks, no holes, no dents, no fire, no people, no text, no hazard labels, no printed lettering, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Sealed and clean-edged so the damaged state's puncture and leak read as a clear, sudden change.
- Same centre and diameter as damaged/ruined; the swap must not shift the prop by a pixel.
- No hazard labels: the barrel must not look like a scripted explosive crate.
