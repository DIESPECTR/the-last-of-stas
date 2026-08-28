---
SECTION_ID: files.assets.zombies.friends.heavy_spitter_master_png
TYPE: file/image
---

# Heavy Spitter Four-Direction Master

FILE: assets/zombies/friends/heavy_spitter_master.png
DESCRIPTION: Transparent 2x2 four-direction master sheet for the bearded Heavy Spitter.
WIDTH: 1024
HEIGHT: 1024
UTILITY: flux2pro
OUTPUT_FORMAT: png
QUALITY: high
MAKE_TRANSPARENT: rembg
IMAGE-INPUT: assets/zombies/friends/heavy_spitter_initial.png
FILES: assets/zombies/friends/heavy_spitter_initial.png
USAGE: Source master for idle, walk and attack animation clips.
PROMPT: |
  Create a precise 2x2 top-down three-quarter game sprite master using the supplied identity anchor.
  Exactly four equal cells: top-left faces down, top-right faces up, bottom-left faces left, bottom-right faces right. Same identity, large body scale and feet anchor in every cell.
  Preserve the broad bearded face, short dark hair, heavy build, oversized worn black jacket, loose trousers and heavy boots. Keep a slow confused theatrical zombie silhouette, visibly larger than the other types.
  Neutral soft studio light, realistic fabric and skin, readable at small gameplay scale, no cast shadow crossing cells.
  Transparent background after removal. No text, labels, grid lines, borders, extra bodies, gore, blood or weapons.
