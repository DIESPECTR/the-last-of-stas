---
SECTION_ID: files.assets.animations.sheets.tattooed_crowd_zombie.idle_left_alpha_webm
TYPE: file/video
---
# Tattooed Crowd Zombie — idle left sheet
FILE: assets/animations/sheets/tattooed_crowd_zombie/idle_left_alpha.webm
DESCRIPTION: Transparent alpha video and a stable 4×4 128×128 sprite sheet from the approved Tattooed Crowd Zombie idle-left source clip.
USAGE: Runtime left-facing idle animation.
PROMPT: Remove the dark studio background from the Tattooed Crowd Zombie idle-left clip while preserving her full body, hair edges, wrap top, tattoo, stable visual scale and motion. Pack exactly sixteen transparent frames as a stable four-column by four-row sprite sheet.
UTILITY: video_background_removal
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/tattooed_crowd_zombie_idle_left.mp4
MODEL: bria
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/tattooed_crowd_zombie/idle_left.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 8
SPRITE_GRID_COLUMNS: 4
