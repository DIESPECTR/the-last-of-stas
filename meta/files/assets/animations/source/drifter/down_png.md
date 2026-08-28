---
SECTION_ID: files.assets.animations.source.drifter.down_png
TYPE: file/image
---

# Drifter Master — Facing Down (Photoreal)

FILE: assets/animations/source/drifter/down.png
UTILITY: gpt_image
WIDTH: 1024
HEIGHT: 1024
DESCALE: 2
QUALITY: high
OUTPUT_FORMAT: png
IMAGE-INPUT: assets/style/first_night_screen.png
FILES: assets/style/first_night_screen.png
USAGE: Static animation master. Fed to `wan` (image-to-video) for idle/walk/attack down-facing clips, then sliced into the 128×128 4×4 sprite sheet. Must stay a clean flat cutout — game lighting is applied by the engine at render time, not baked in here.
PROMPT: |
  Reference image attached is the locked art-direction target for this game: photoreal, gritty,
  weathered survival-horror material rendering. Match its SURFACE TREATMENT exactly for this zombie —
  do NOT copy the reference's scene, lighting, night grade, rain, bloom or vignette; this is a clean
  isolated character master, not a lit scene.

  Subject: a slow undead Drifter zombie — tall, thin adult corpse in a torn long civilian coat, one
  shoulder hanging low, slack crooked neck, dragging left foot, long loose arms, cracked pale skin,
  gaunt exhausted face. Small restrained desaturated olive infection stains around the collar and hands
  only, never neon. Narrow readable silhouette. No weapon, no prop, no tool.
  Pose: relaxed exhausted standing shamble stance, facing directly down toward the camera (top of head
  barely visible, mostly seeing the top of shoulders/chest/face from above).
  Camera: locked slightly-elevated top-down three-quarter game camera, orthographic-feeling, character
  centred, full body visible with even margin.
  Lighting: flat, neutral, shadowless studio lighting — even illumination on all sides, no directional
  shadow, no colour grade, no vignette, no bloom. Materials must still read photoreal (torn fabric weave,
  decayed skin texture, dirt) even under flat light.
  Background: uniform pure white, for clean automatic cutout. No ground, no cast shadow, no other
  objects, no text, no watermark, no border frame, exactly one character.

COMMENTS: ## Design Notes
- Same identity/proportions/scale must be reused for up.png, left.png, right.png — only facing changes.
- Photoreal replacement of the old charcoal-sketch Drifter; preserve the same silhouette and design cues
  (dragging foot, low shoulder, long coat) so gameplay readability does not regress.
- This master feeds `wan` for idle/walk/attack animation and must survive rembg keying cleanly.
