---
SECTION_ID: files.assets.characters.custom.down_png
TYPE: file/image
---

# Stas Master — Facing Down

FILE: assets/characters/custom/down.png
UTILITY: gpt_image
QUALITY: high
WIDTH: 1024
HEIGHT: 1024
DESCALE: 2
OUTPUT_FORMAT: png
IMAGE-INPUT: assets/characters/custom/initial.png
IMAGE-INPUT-2: assets/reference/stas_face.jpg
FILES: assets/characters/custom/initial.png, assets/reference/stas_face.jpg
USAGE: Static animation master. Fed to wan for idle/walk/attack down-facing clips, then sliced into the 128×128 4×4 sprite sheet.

PROMPT: |
  Isolated photoreal game-character master of the EXACT man from @image1, facing toward camera.

  IDENTITY: copy the man from @image1 exactly — same face as @image2, same dark curly hair,
  same black pinstripe suit worn open with no shirt, bare chest, matching pinstripe trousers,
  dark dress shoes. Recognisable likeness. Do not invent a different person.

  Pose: relaxed standing idle, full body, facing the camera / slightly toward camera from a
  locked slightly-elevated top-down three-quarter game camera (orthographic-feeling). Head,
  open jacket, bare chest and shoes all readable. Hands empty, no weapon, no prop.

  Camera: character centred, full body visible with even margin on all sides.
  Lighting: flat, neutral, shadowless studio lighting — even illumination, no directional
  shadow, no colour grade, no vignette, no bloom. Materials stay photoreal.
  Background: uniform pure white. No ground, no cast shadow, no other objects, no text,
  no watermark, no border. Exactly one character.

COMMENTS: ## Design Notes
- Must match up/left/right in identity, proportions and scale — only facing changes.
- White studio cutout for rembg. Original survivor masters are not overwritten.
