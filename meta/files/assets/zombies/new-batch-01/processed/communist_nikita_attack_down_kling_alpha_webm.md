---
SECTION_ID: files.assets.zombies.new-batch-01.processed.communist_nikita_attack_down_kling_alpha_webm
TYPE: file/video
---

# Communist Nikita Kling attack_down transparent sheet

FILE: assets/zombies/new-batch-01/processed/communist_nikita_attack_down_kling_alpha.webm
DESCRIPTION: Transparent Kling source video and fixed 4×4 game sprite sheet for Communist Nikita's down-facing attack.
USAGE: Runtime attack_down pilot, exactly 16 tiles at 128×128.
PROMPT: Remove only the plain background from the Kling MP4, preserve the complete moving character and stable feet anchor, and pack sampled frames into a transparent fixed four-column sprite sheet.
UTILITY: video_background_removal
VIDEO-INPUT: assets/zombies/new-batch-01/animation-api/communist_nikita_attack_down.mp4
MODEL: bria
BACKGROUND_COLOR: Transparent
OUTPUT_CONTAINER_AND_CODEC: webm_vp9
PRESERVE_AUDIO: false
AUTOCROP: true
AUTOCROP_PADDING: 8
AUTOCROP_CENTERED: true
MAKE_SPRITE_SHEET_FILE: assets/animations/sheets/communist_nikita/attack_down_kling.png
SPRITE_TILE_SIZE: 128x128
SPRITE_FRAME_STEP: 8
SPRITE_GRID_COLUMNS: 4
