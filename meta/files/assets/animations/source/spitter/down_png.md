---
SECTION_ID: files.assets.animations.source.spitter.down_png
TYPE: file/image
---

# Spitter Master — Facing Down (Photoreal)

FILE: assets/animations/source/spitter/down.png
UTILITY: gpt_image
WIDTH: 1024
HEIGHT: 1024
DESCALE: 2
QUALITY: high
OUTPUT_FORMAT: png
IMAGE-INPUT: assets/style/first_night_screen.png
FILES: assets/style/first_night_screen.png
USAGE: Static animation master. Fed to `wan` (image-to-video) for idle/walk/attack down-facing clips, then sliced into the 128×128 4×4 sprite sheet.
PROMPT: |
  Reference image attached is the locked art-direction target for this game: photoreal, gritty,
  weathered survival-horror material rendering. Match its SURFACE TREATMENT exactly for this zombie —
  do NOT copy the reference's scene, lighting, night grade, rain, bloom or vignette; this is a clean
  isolated character master, not a lit scene.

  Subject: a heavy hunched Spitter zombie — broad adult corpse in ruined worker overalls, swollen
  upper torso, distended throat and jaw, one oversized shoulder, thick planted legs, dangling heavy
  arms. Bulky silhouette, visibly larger and heavier than a normal zombie. Restrained sickly
  yellow-green seepage limited to mouth, throat and torn chest area only, never a large glow. No
  weapon, no prop, no tool.
  Pose: heavy hunched standing stance, facing directly down toward the camera (top of head, swollen
  shoulders, distended throat visible from above).
  Camera: locked slightly-elevated top-down three-quarter game camera, orthographic-feeling, character
  centred, full body visible with even margin.
  Lighting: flat, neutral, shadowless studio lighting — even illumination on all sides, no directional
  shadow, no colour grade, no vignette, no bloom. Materials must still read photoreal (torn fabric weave,
  decayed swollen skin texture, dirt) even under flat light.
  Background: uniform pure white, for clean automatic cutout. No ground, no cast shadow, no other
  objects, no text, no watermark, no border frame, exactly one character.

COMMENTS: ## Design Notes
- Same identity/proportions/scale must be reused for up.png, left.png, right.png — only facing changes.
- Photoreal replacement of the old charcoal-sketch Spitter; keep silhouette clearly bulkier/larger than
  Drifter and Runner so its role reads instantly in gameplay.
