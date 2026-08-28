---
SECTION_ID: files.assets.animations.source.survivor.right_png
TYPE: file/image
---

# Survivor Master — Facing Right (Photoreal)

FILE: assets/animations/source/survivor/right.png
UTILITY: gpt_image
WIDTH: 1024
HEIGHT: 1024
DESCALE: 2
QUALITY: high
OUTPUT_FORMAT: png
IMAGE-INPUT: assets/style/first_night_screen.png
FILES: assets/style/first_night_screen.png
USAGE: Static animation master. Fed to `wan` (image-to-video) for idle/walk/attack right-facing clips, then sliced into the 128×128 4×4 sprite sheet. Must stay a clean flat cutout — game lighting (rim-light, shadow, bloom) is applied by the engine at render time, not baked in here.
PROMPT: |
  Reference image attached is the locked art-direction target for this game: photoreal, gritty,
  weathered survival-horror material rendering. Match its SURFACE TREATMENT and DESIGN LANGUAGE for the
  survivor character exactly — same patched dark work coat with visible stitching and wear, road-sign
  scrap shoulder guard, worn canvas backpack, rust-red cloth wrap on one forearm, scuffed boots, tired
  weathered face, practical dark trousers. Same exact character as the down-facing master.

  Do NOT copy the reference's scene, lighting, night grade, rain, bloom or vignette — this image is a
  clean isolated character master, not a lit scene.

  Subject: the same survivor, standing in a relaxed idle stance, body and face in full right profile
  (mirror of the left-facing master), completely unarmed — empty hands, no weapon, no prop, no gun, no
  tool.
  Camera: locked slightly-elevated top-down three-quarter game camera, orthographic-feeling, character
  centred, full body visible with even margin.
  Lighting: flat, neutral, shadowless studio lighting — even illumination on all sides, no directional
  shadow, no colour grade, no vignette, no bloom. Materials must still read photoreal (fabric weave,
  leather wear, skin texture, metal scuffing) even under flat light.
  Background: uniform pure white, for clean automatic cutout. No ground, no cast shadow, no other
  objects, no text, no watermark, no border frame, exactly one character.

COMMENTS: ## Design Notes
- Same identity/proportions/scale as down.png — only facing changes.
- This master feeds `wan` for idle/walk/attack animation and must survive rembg keying cleanly.
