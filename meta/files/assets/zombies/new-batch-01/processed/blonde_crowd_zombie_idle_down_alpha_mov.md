---
SECTION_ID: files.assets.zombies.new-batch-01.processed.blonde_crowd_zombie_idle_down_alpha_mov
TYPE: file/video
---
# Blonde Crowd Zombie — idle down ProRes alpha probe
FILE: assets/zombies/new-batch-01/processed/blonde_crowd_zombie_idle_down_alpha.mov
DESCRIPTION: ProRes alpha video and stable 4×4 128×128 sheet probe.
USAGE: Diagnose alpha and sheet output before processing the full Blonde set.
PROMPT: Remove the background while preserving the full character, hair edges, clothing, stable scale and motion. Pack exactly sixteen transparent frames as a four-column by four-row sheet.
UTILITY: video_background_removal
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/blonde_crowd_zombie_idle_down.mp4
MODEL: bria
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: mov_proresks
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/blonde_crowd_zombie/idle_down.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 8
SPRITE_GRID_COLUMNS: 4
