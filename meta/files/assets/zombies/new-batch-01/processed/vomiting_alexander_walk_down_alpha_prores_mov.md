---
SECTION_ID: files.assets.zombies.new-batch-01.processed.vomiting_alexander_walk_down_alpha_prores_mov
TYPE: file/video
---
FILE: assets/zombies/new-batch-01/processed/vomiting_alexander_walk_down_alpha_prores.mov
UTILITY: video_background_removal
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/vomiting_alexander_walk_down.mp4
MODEL: bria
PROMPT: Remove the plain light background from the isolated animated zombie, retain clean hair and clothing edges, then pack the motion into a stable transparent sprite sheet.
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: mov_proresks
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/zombies/new-batch-01/processed/vomiting_alexander_walk_down_sheet.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 8
SPRITE_GRID_COLUMNS: 4
