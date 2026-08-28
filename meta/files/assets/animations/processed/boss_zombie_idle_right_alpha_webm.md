---
SECTION_ID: files.assets.animations.processed.boss_zombie_idle_right_alpha_webm
TYPE: file/video
---

# Boss Zombie Idle Right Sprite Sheet

FILE: assets/animations/processed/boss_zombie_idle_right_alpha.webm
DESCRIPTION: Transparent source video and fixed 4×4 game sprite sheet from FLUX 3.
USAGE: Boss Zombie runtime animation, 16 tiles at 128×128.
PROMPT: Remove the plain background, preserve the single character and create a centered fixed 4×4 transparent sprite sheet.
UTILITY: video_background_removal
VIDEO-INPUT: assets/zombies/friends/animation-flux/boss_zombie_idle_right.mp4
MODEL: bria
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/boss_zombie/idle_right.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 9
SPRITE_GRID_COLUMNS: 4
