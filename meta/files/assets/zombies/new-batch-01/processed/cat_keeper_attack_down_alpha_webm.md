---
SECTION_ID: files.assets.zombies.new-batch-01.processed.cat_keeper_attack_down_alpha_webm
TYPE: file/video
---
FILE: assets/zombies/new-batch-01/processed/cat_keeper_attack_down_alpha.webm
UTILITY: video_background_removal
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/cat_keeper_attack_down.mp4
MODEL: bria
PROMPT: Remove only the plain background; preserve the complete woman zombie, glasses, hair, hands, boots, single black cat and stable bottom-center feet anchor.
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/cat_keeper/attack_down.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 8
SPRITE_GRID_COLUMNS: 4
