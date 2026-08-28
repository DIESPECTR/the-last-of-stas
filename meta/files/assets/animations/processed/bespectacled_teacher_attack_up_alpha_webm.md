---
SECTION_ID: files.assets.animations.processed.bespectacled_teacher_attack_up_alpha_webm
TYPE: file/video
---

# Teacher Attack Up Sprite Sheet

FILE: assets/animations/processed/bespectacled_teacher_attack_up_alpha.webm
DESCRIPTION: Transparent source video and fixed 4×4 game sprite sheet.
USAGE: Bespectacled Teacher runtime attack up, 16 tiles at 128×128.
PROMPT: Remove the plain background, preserve the single character and create a centered fixed 4×4 transparent sprite sheet.
UTILITY: video_background_removal
VIDEO-INPUT: assets/zombies/friends/animation-crops/bespectacled_teacher_attack_up.mp4
MODEL: bria
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/bespectacled_teacher/attack_up.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 9
SPRITE_GRID_COLUMNS: 4
