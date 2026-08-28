---
SECTION_ID: files.assets.zombies.new-batch-01.processed.injured_kuok_walk_right_alpha_webm
TYPE: file/video
---
UTILITY: video_background_removal
FILE: assets/zombies/new-batch-01/processed/injured_kuok_walk_right_alpha.webm
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/injured_kuok_walk_right.mp4
MODEL: bria
PROMPT: Remove only the plain scene background. Preserve the complete injured KUOK boss silhouette in every frame, especially all black stagewear, dark trousers, boots, tattoos, face, oversized white cast and both metal crutches. Do not treat black clothing as background.
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/injured_kuok/walk_right.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 8
SPRITE_GRID_COLUMNS: 4
