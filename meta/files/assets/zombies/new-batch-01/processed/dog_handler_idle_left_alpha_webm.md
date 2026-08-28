---
SECTION_ID: files.assets.zombies.new-batch-01.processed.dog_handler_idle_left_alpha_webm
TYPE: file/video
---
FILE: assets/zombies/new-batch-01/processed/dog_handler_idle_left_alpha.webm
UTILITY: video_background_removal
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/dog_handler_idle_left.mp4
MODEL: bria
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/dog_handler/idle_left.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 9
SPRITE_GRID_COLUMNS: 4
PROMPT: Remove the plain background, preserve clean alpha edges around the handler and her single black-and-white dog, use one stable centered crop, then pack sampled frames into a transparent 4 by 4 128 pixel PNG sprite sheet.
FILES: assets/zombies/new-batch-01/animation-api/dog_handler_idle_left.mp4
