---
SECTION_ID: files.assets.zombies.spitter_sheet_png
TYPE: file/image
---

# Spitter Four-Direction Sprite Sheet

FILE: assets/zombies/spitter_sheet.png
DESCRIPTION: Transparent 2x2 four-direction sprite sheet for the heavy infected Spitter zombie.
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
  A precise 2x2 game sprite sheet containing exactly four isolated views of the same heavy infected Spitter, slightly elevated top-down three-quarter camera.
  Top-left faces down toward camera. Top-right faces up away. Bottom-left faces left. Bottom-right faces right. Same scale and center in every equal cell.
  Broad hunched adult corpse in ruined worker overalls, swollen upper torso, distended throat and jaw, one oversized shoulder, thick planted legs, dangling heavy arms. Bulky unmistakable silhouette larger than other zombies. No weapon. Restrained sickly yellow-green seepage only at mouth, throat and torn chest, never neon.
  Original bleak survival-drama game art: rough charcoal contour, dense crosshatched pencil shadows, filthy paper grain inside the body, near-monochrome graphite and brown-black palette, readable at 54 pixels. Not glossy, not cartoon, not pixel art, not photorealistic.
  Uniform pure white background, generous separation, no cast shadow crossing cells, no grid lines, text, labels, border, extra bodies, gore pile, logo or watermark.
