---
SECTION_ID: files.assets.zombies.new-batch-01.processed.dog_handler_walk_down_alpha_webm
TYPE: file/video
---
FILE: assets/zombies/new-batch-01/processed/dog_handler_walk_down_alpha.webm
UTILITY: video_background_removal
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/dog_handler_walk_down.mp4
MODEL: bria
PROMPT: Remove the plain light background from the animated handler and dog unit, preserve leash and fur edges, then pack a stable transparent sprite sheet.
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/dog_handler/walk_down.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 8
SPRITE_GRID_COLUMNS: 4
