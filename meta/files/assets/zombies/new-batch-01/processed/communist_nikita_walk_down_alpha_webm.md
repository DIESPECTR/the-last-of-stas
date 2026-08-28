---
SECTION_ID: files.assets.zombies.new-batch-01.processed.communist_nikita_walk_down_alpha_webm
TYPE: file/video
---

# Communist Nikita walk_down transparent sheet

FILE: assets/zombies/new-batch-01/processed/communist_nikita_walk_down_alpha.webm
DESCRIPTION: Transparent source video and fixed 4×4 game sprite sheet for Communist Nikita's down-facing walk.
USAGE: Runtime walk_down animation, 16 tiles at 128×128.
PROMPT: Remove the neutral studio background, preserve the complete single character and stable feet anchor, then create a centered fixed 4×4 transparent sprite sheet.
UTILITY: video_background_removal
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/communist_nikita_walk_down.mp4
MODEL: bria
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/communist_nikita/walk_down_kling.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 9
SPRITE_GRID_COLUMNS: 4
