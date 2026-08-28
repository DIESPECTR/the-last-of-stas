---
SECTION_ID: files.assets.zombies.new-batch-01.processed.injured_kuok_cast_charge_down_alpha_webm
TYPE: file/video
---
UTILITY: video_background_removal
FILE: assets/zombies/new-batch-01/processed/injured_kuok_cast_charge_down_alpha.webm
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/injured_kuok_cast_charge_down.mp4
MODEL: veed_fast
PROMPT: Remove the plain background from the animated injured boss; retain face, cast, crutch and body edges.
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/injured_kuok/cast_charge_down.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 8
SPRITE_GRID_COLUMNS: 4
