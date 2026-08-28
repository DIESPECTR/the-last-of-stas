---
SECTION_ID: files.assets.animations.sheets.survivor._test3_walk_down_png
TYPE: file/video
---

# TEST3 - Survivor Walk Down via video_background_removal sprite flags (mp4 input)

FILE: assets/animations/sheets/survivor/_test3_walk_down.png
PROMPT: Remove background from the survivor walk-down clip and pack it into a 128x128 transparent sprite sheet.
UTILITY: video_background_removal
VIDEO-INPUT: .temp/walk_down.mp4
MODEL: bria
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/survivor/_test3_walk_down.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 6
