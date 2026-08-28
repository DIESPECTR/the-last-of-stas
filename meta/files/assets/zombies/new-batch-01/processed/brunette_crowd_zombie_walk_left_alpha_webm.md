---
SECTION_ID: files.assets.zombies.new-batch-01.processed.brunette_crowd_zombie_walk_left_alpha_webm
TYPE: file/video
---
# Brunette Crowd Zombie — walk left transparent sheet
FILE: assets/zombies/new-batch-01/processed/brunette_crowd_zombie_walk_left_alpha.webm
DESCRIPTION: Transparent source video and 4×4 sheet.
USAGE: Runtime Brunette Crowd Zombie walk_left, 16 tiles at 128×128.
PROMPT: Remove only the plain background; preserve the complete Brunette Crowd Zombie, hair, face, pale top, hands, boots and stable bottom-center feet anchor; then pack sampled frames into a transparent four-column sheet.
UTILITY: video_background_removal
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/brunette_crowd_zombie_walk_left.mp4
MODEL: bria
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/brunette_crowd_zombie/walk_left.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 8
SPRITE_GRID_COLUMNS: 4
