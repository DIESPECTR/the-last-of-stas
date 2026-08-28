---
SECTION_ID: files.assets.zombies.new-batch-01.processed.lumberjack_attack_down_alpha_webm
TYPE: file/video
---
UTILITY: video_background_removal
FILE: assets/zombies/new-batch-01/processed/lumberjack_attack_down_alpha.webm
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/lumberjack_attack_down.mp4
MODEL: veed_fast
PROMPT: Remove only the plain background; preserve the complete lumberjack zombie, ginger hair, moustache, flannel, suspenders, both hands, complete axe and stable bottom-center feet anchor.
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/lumberjack_zombie/attack_down.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 9
SPRITE_GRID_COLUMNS: 4
