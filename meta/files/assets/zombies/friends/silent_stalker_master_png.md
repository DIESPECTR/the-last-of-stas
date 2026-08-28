---
SECTION_ID: files.assets.zombies.friends.silent_stalker_master_png
TYPE: file/image
---

# Silent Stalker Four-Direction Master

FILE: assets/zombies/friends/silent_stalker_master.png
DESCRIPTION: Transparent 2x2 four-direction master sheet for the dark-haired Silent Stalker.
WIDTH: 1024
HEIGHT: 1024
UTILITY: flux2pro
OUTPUT_FORMAT: png
QUALITY: high
MAKE_TRANSPARENT: rembg
IMAGE-INPUT: assets/zombies/friends/silent_stalker_initial.png
FILES: assets/zombies/friends/silent_stalker_initial.png
USAGE: Source master for idle, walk and attack animation clips.
PROMPT: |
  Create a precise 2x2 top-down three-quarter game sprite master using the supplied identity anchor.
  Exactly four equal cells: top-left faces down, top-right faces up, bottom-left faces left, bottom-right faces right. Same identity, scale, feet anchor and proportions in every cell.
  Preserve the oval face, long straight dark-brown hair, brown eyes, dark cardigan, practical trousers and boots. Keep the quiet precise stalking silhouette and calm unsettling expression.
  Neutral soft studio light, realistic materials, readable at small gameplay scale, no cast shadow crossing cells.
  Transparent background after removal. No text, labels, grid lines, borders, extra bodies, gore, blood or weapons.
