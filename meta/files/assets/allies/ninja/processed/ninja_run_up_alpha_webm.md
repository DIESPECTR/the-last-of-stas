---
SECTION_ID: files.assets.allies.ninja.processed.ninja_run_up_alpha_webm
TYPE: file/video
---

# Ninja run up transparent sheet

FILE: assets/allies/ninja/processed/ninja_run_up_alpha.webm
DESCRIPTION: Transparent source video and fixed 4×4 sprite sheet for the friendly ninja ally run up animation.
USAGE: Runtime run_up animation, exactly 16 tiles at 128×128.
PROMPT: Remove only the white studio background, preserve the complete moving character and stable feet anchor, and pack sampled frames into a transparent fixed four-column sprite sheet.
UTILITY: video_background_removal
VIDEO-INPUT: assets/allies/ninja/clips/ninja_run_up.mp4
MODEL: bria
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/allies/ninja/sheets/ninja_run_up.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 8
SPRITE_GRID_COLUMNS: 4
