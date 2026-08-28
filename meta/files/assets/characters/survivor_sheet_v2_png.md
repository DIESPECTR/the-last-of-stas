---
SECTION_ID: files.assets.characters.survivor_sheet_v2_png
TYPE: file/image
---

FILE: assets/characters/survivor_sheet_v2.png
WIDTH: 1024
HEIGHT: 1024
PROMPT: |
  A precise 2x2 game sprite sheet containing exactly four isolated views of the same exhausted adult survivor, slightly elevated top-down three-quarter camera.
  Top-left faces down toward the camera. Top-right faces up away from camera. Bottom-left faces left. Bottom-right faces right.
  Same identity, body scale, anchor point, clothing and neutral standing pose in every equal 512x512 cell. Patched charcoal work coat, faded gray trousers, road-sign shoulder guard, worn boots, small canvas backpack, restrained dark rust-red cloth tied around left forearm. Empty hands held naturally near the waist. NO weapon, gun, tool, floating object or duplicated limb.
  Original bleak survival-drama game art: rough charcoal contours, dry pencil hatching, dirty paper texture inside the figure, near-monochrome graphite and warm gray palette, sharp readable silhouette at 64 pixels, grounded and vulnerable rather than heroic. Strong overhead readability with head, shoulders, arms and feet clearly separated.
  Uniform pure white background, generous clearance around every figure, no shadows crossing cell boundaries, no grid lines, text, labels, border, scenery, blood, logo or watermark.
NEGATIVE PROMPT:
UTILITY: gpt_image
IMAGE-INPUT: assets/characters/survivor_sheet.png
IMAGE-INPUT-2: assets/style/first_night_screen.png
OUTPUT_FORMAT: png
QUALITY: high
# Survivor Clean Four-Direction Sheet

DESCRIPTION: Transparent 2x2 four-direction sheet of the playable survivor, intentionally unarmed for dynamic Canvas weapon overlays.
MAKE_TRANSPARENT: rembg
FILES: assets/characters/survivor_sheet.png, assets/style/first_night_screen.png
USAGE: Canvas player sprite identity master; each 512x512 cell maps to down, up, left, right and anchors later animation videos.