---
SECTION_ID: files.assets.zombies.new-batch-01.processed.plaid_glasses_zombie_idle_right_alpha_webm
TYPE: file/video
---
# Plaid idle right transparent sheet
FILE: assets/zombies/new-batch-01/processed/plaid_glasses_zombie_idle_right_alpha.webm
DESCRIPTION: Transparent source video and 4×4 sheet.
USAGE: Runtime Plaid idle_right, 16 tiles at 128×128.
PROMPT: Remove only the plain background, preserve the complete Plaid Glasses Zombie, glasses, hair, hands, boots and stable feet anchor, then pack sampled frames into a transparent four-column sheet.
UTILITY: video_background_removal
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/plaid_glasses_zombie_idle_right.mp4
MODEL: bria
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/plaid_glasses_zombie/idle_right.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 8
SPRITE_GRID_COLUMNS: 4
