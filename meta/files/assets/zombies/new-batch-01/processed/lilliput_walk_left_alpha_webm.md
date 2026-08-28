---
SECTION_ID: files.assets.zombies.new-batch-01.processed.lilliput_walk_left_alpha_webm
TYPE: file/video
---
UTILITY: video_background_removal
FILE: assets/zombies/new-batch-01/processed/lilliput_walk_left_alpha.webm
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/lilliput_walk_left.mp4
MODEL: veed_fast
PROMPT: Remove only the background; preserve the complete tiny zombie and stable bottom-center feet anchor.
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/lilliput/walk_left.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 9
SPRITE_GRID_COLUMNS: 4
