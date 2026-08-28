---
SECTION_ID: files.assets.zombies.drifter_sheet_png
TYPE: file/image
---

# Drifter Four-Direction Sprite Sheet

FILE: assets/zombies/drifter_sheet.png
DESCRIPTION: Transparent 2x2 four-direction sprite sheet for the slow Drifter zombie.
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
  A precise 2x2 game sprite sheet containing exactly four isolated views of the same slow undead Drifter, slightly elevated top-down three-quarter camera.
  Top-left faces down toward camera. Top-right faces up away. Bottom-left faces left. Bottom-right faces right. Same scale and center in every equal cell.
  Tall thin adult corpse in a torn long civilian coat, one shoulder hanging low, slack crooked neck, dragging left foot, long loose arms, cracked pale hands. Narrow readable silhouette, exhausted shamble, no weapon. Small restrained desaturated olive infection stains only around collar and hands.
  Original bleak survival-drama game art: rough charcoal contour, dry pencil hatching, filthy paper grain inside the body, near-monochrome graphite and warm gray palette, harsh black shadow shapes, readable at 48 pixels. Not glossy, not cartoon, not pixel art, not photorealistic.
  Uniform pure white background, generous separation, no cast shadow crossing cells, no grid lines, text, labels, border, extra bodies, gore pile, logo or watermark.
