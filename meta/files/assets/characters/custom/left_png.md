---
SECTION_ID: files.assets.characters.custom.left_png
TYPE: file/image
---

# Stas Master — Facing Left

FILE: assets/characters/custom/left.png
UTILITY: gpt_image
QUALITY: high
WIDTH: 1024
HEIGHT: 1024
DESCALE: 2
OUTPUT_FORMAT: png
IMAGE-INPUT: assets/characters/custom/initial.png
IMAGE-INPUT-2: assets/reference/stas_face.jpg
FILES: assets/characters/custom/initial.png, assets/reference/stas_face.jpg
USAGE: Static animation master. Fed to wan for idle/walk/attack left-facing clips.

PROMPT: |
  Isolated photoreal game-character master of the EXACT man from @image1, full-body left profile.

  IDENTITY: copy the man from @image1 exactly — same face in profile as @image2, same dark curly
  hair, same black pinstripe suit worn open with no shirt, bare chest in profile, matching
  pinstripe trousers, dark dress shoes. Recognisable likeness. Do not invent a different person.

  Pose: relaxed standing idle, full body profile facing left. Hands empty, no weapon, no prop.

  Camera: locked slightly-elevated top-down three-quarter game camera, orthographic-feeling,
  character centred, full body visible with even margin.
  Lighting: flat, neutral, shadowless studio lighting — even illumination, no directional
  shadow, no colour grade, no vignette, no bloom. Materials stay photoreal.
  Background: uniform pure white. No ground, no cast shadow, no other objects, no text,
  no watermark, no border. Exactly one character.

COMMENTS: ## Design Notes
- Must match down/up/right in identity, proportions and scale — only facing changes.
