---
SECTION_ID: files.assets.zombies.new-batch-01.processed.brunette_crowd_zombie_idle_up_alpha_webm
TYPE: file/video
---
# Brunette Crowd Zombie — idle up transparent sheet
FILE: assets/zombies/new-batch-01/processed/brunette_crowd_zombie_idle_up_alpha.webm
DESCRIPTION: Transparent source video and 4×4 sheet.
USAGE: Runtime Brunette Crowd Zombie idle_up, 16 tiles at 128×128.
PROMPT: Remove only the plain background; preserve the complete Brunette Crowd Zombie, hair, face, pale top, hands, boots and stable bottom-center feet anchor; then pack sampled frames into a transparent four-column sheet.
UTILITY: video_background_removal
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/brunette_crowd_zombie_idle_up.mp4
MODEL: bria
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/brunette_crowd_zombie/idle_up.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 8
SPRITE_GRID_COLUMNS: 4
