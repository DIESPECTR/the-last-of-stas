---
SECTION_ID: files.assets.zombies.friends.office_runner_master_png
TYPE: file/image
---

# Office Runner Four-Direction Master

FILE: assets/zombies/friends/office_runner_master.png
DESCRIPTION: Transparent 2x2 four-direction master sheet for the moustached Office Runner.
WIDTH: 1024
HEIGHT: 1024
UTILITY: flux2pro
OUTPUT_FORMAT: png
QUALITY: high
MAKE_TRANSPARENT: rembg
IMAGE-INPUT: assets/zombies/friends/office_runner_initial.png
FILES: assets/zombies/friends/office_runner_initial.png
USAGE: Source master for idle, walk and attack animation clips.
PROMPT: |
  Create a precise 2x2 top-down three-quarter game sprite master using the supplied identity anchor.
  Exactly four equal cells: top-left faces down, top-right faces up, bottom-left faces left, bottom-right faces right. Same identity, scale, feet anchor and proportions in every cell.
  Preserve the man's swept-back dark hair, thick moustache, black hoodie, cargo trousers and worn sneakers. Keep the exaggerated forward-leaning frantic Runner silhouette.
  Neutral soft studio light, realistic materials, readable at small gameplay scale, no cast shadow crossing cells.
  Transparent background after removal. No text, labels, grid lines, borders, extra bodies, gore, blood or weapons.
