---
SECTION_ID: files.assets.characters.custom.up_png
TYPE: file/image
---

# Stas Master — Facing Up

FILE: assets/characters/custom/up.png
UTILITY: gpt_image
QUALITY: high
WIDTH: 1024
HEIGHT: 1024
DESCALE: 2
OUTPUT_FORMAT: png
IMAGE-INPUT: assets/characters/custom/initial.png
FILES: assets/characters/custom/initial.png
USAGE: Static animation master. Fed to wan for idle/walk/attack up-facing clips.

PROMPT: |
  Isolated photoreal game-character master of the EXACT man from @image1, seen from behind.

  IDENTITY: copy the man from @image1 exactly — same dark curly hair from the back, same black
  pinstripe suit worn open with no shirt, matching pinstripe trousers, dark dress shoes.
  Same body, same proportions. Do not invent a different person or a different suit.

  Pose: relaxed standing idle, full body, walking-away / facing up, back of jacket, back of
  head and hanging open jacket tails visible. Hands empty, no weapon, no prop.

  Camera: locked slightly-elevated top-down three-quarter game camera, orthographic-feeling,
  character centred, full body visible with even margin.
  Lighting: flat, neutral, shadowless studio lighting — even illumination, no directional
  shadow, no colour grade, no vignette, no bloom. Materials stay photoreal.
  Background: uniform pure white. No ground, no cast shadow, no other objects, no text,
  no watermark, no border. Exactly one character.

COMMENTS: ## Design Notes
- Must match down/left/right in identity, proportions and scale — only facing changes.
