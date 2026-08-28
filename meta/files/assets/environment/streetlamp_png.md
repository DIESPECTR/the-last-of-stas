---
SECTION_ID: files.assets.environment.streetlamp_png
TYPE: file/image
---

# Street Lamp Post

FILE: assets/environment/streetlamp.png
DESCRIPTION: Transparent leaning street lamp post with a bent arm and a dirty glass head, seen from a slightly elevated angle.
UTILITY: gpt_image
WIDTH: 768
HEIGHT: 1536
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Scenery lamp posts along the street; the light pool itself is drawn procedurally in Canvas.
PROMPT: |
  Goal: one isolated game prop — a single street lamp post for a top-down survival game.
  Subject: tall rusted metal lamp post leaning slightly, bent horizontal arm at the top, dented lamp head with cracked dirty glass, peeling paint, cable taped along the pole, small handwritten warning tag tied near the base.
  Composition: vertical asset, post centred, base at the bottom edge, lamp head at the top, viewed from a slightly elevated angle so the arm points away from the viewer.
  Style: photorealistic corroded metal, believable peeling paint and pitted steel, deep warm palette — dark brown-black pole (#1c1710, #2e2417), heavy saturated rust-orange corrosion blooming along the arm and base, unlit glass reading as dark smoked amber; no grey, no desaturated charcoal-pencil look, no cold flat grey metal.
  Constraints: uniform pure white background for clean automatic cutout, no light glow, no ground, no cast shadow, no scene, no characters, no text, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- The lamp must be rendered UNLIT: the warm pool and flicker are a separate additive Canvas layer.
- Base sits at the bottom edge so the sprite can be anchored on the ground line.
