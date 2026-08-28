---
SECTION_ID: files.assets.zombies.runner_sheet_png
TYPE: file/image
---

# Runner Four-Direction Sprite Sheet

FILE: assets/zombies/runner_sheet.png
DESCRIPTION: Transparent 2x2 four-direction sprite sheet for the fast Runner zombie.
WIDTH: 1024
HEIGHT: 1024
UTILITY: gpt_image
OUTPUT_FORMAT: png
QUALITY: high
MAKE_TRANSPARENT: rembg
IMAGE-INPUT: assets/style/first_night_screen.png
IMAGE-INPUT-2: assets/characters/survivor_sheet.png
FILES: assets/style/first_night_screen.png, assets/characters/survivor_sheet.png
USAGE: Canvas enemy identity master; each 512x512 cell maps to down, up, left, right and anchors later animation videos.
PROMPT: |
  A precise 2x2 game sprite sheet containing exactly four isolated views of the same fast undead Runner, slightly elevated top-down three-quarter camera.
  Top-left faces down toward camera. Top-right faces up away. Bottom-left faces left. Bottom-right faces right. Same scale and center in every equal cell.
  Lean feral young adult corpse in shredded hooded sweatshirt and torn work trousers, torso pitched aggressively forward, bent elbows, clawed hands, asymmetric sprint-ready stance, exposed wrapped ankle. Compact angular silhouette visibly faster and smaller than a normal zombie. No weapon. Tiny restrained sickly yellow-green infection accents in eyes and fingertips.
  Original bleak survival-drama game art: rough charcoal contour, frantic directional pencil hatching, filthy paper grain inside the body, near-monochrome graphite palette, sharp black shadow shapes, readable at 44 pixels. Not glossy, not cartoon, not pixel art, not photorealistic.
  Uniform pure white background, generous separation, no cast shadow crossing cells, no grid lines, text, labels, border, extra bodies, gore pile, logo or watermark.
