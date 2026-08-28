---
SECTION_ID: files.assets.characters.custom.initial_png
TYPE: file/image
---

# Stas — Initial Identity Portrait

FILE: assets/characters/custom/initial.png
UTILITY: gpt_image
QUALITY: high
WIDTH: 1024
HEIGHT: 1536
OUTPUT_FORMAT: png
IMAGE-INPUT: assets/reference/stas_face.jpg
IMAGE-INPUT-2: assets/reference/stas_costume.jpg
FILES: assets/reference/stas_face.jpg, assets/reference/stas_costume.jpg
USAGE: Canonical identity anchor for the player hero Stas. Feeds the character sheet and all 4-direction game masters. Face from @image1, costume from @image2.

PROMPT: |
  Create a single full-body character portrait for a game character named Stas.

  IMAGE ROLES:
  - @image1 is the IDENTITY PHOTO. Copy this man's EXACT face: bone structure, hazel-brown eyes,
    dark wavy/curly hair, hairline, brow, nose, mouth, jaw, skin tone, age. This must be a
    recognisable likeness of the person in @image1, not a generic lookalike.
  - @image2 is the COSTUME PHOTO. Dress him in this exact outfit: black pinstripe suit
    (thin white vertical stripes), jacket worn open with no shirt underneath, bare chest visible,
    matching pinstripe trousers, dark dress shoes. Keep the music-video "zombie crooner" look —
    a faint pale theatrical makeup wash on the face (not a full white mask — the real face from
    @image1 must stay readable).

  CHARACTER: Adult man, mid-40s, compact athletic build, dark curly hair, hazel eyes, clean-shaven
  with light stubble. Black pinstripe suit, jacket unbuttoned, no shirt, bare chest, matching
  trousers, dark shoes. Hands empty — no weapon, no microphone, no prop. He is the survivor
  defending his house.

  STYLE CONTEXT: photoreal survival-horror game character, This War of Mine / Project Zomboid
  grit, photographic material rendering, not illustration, not cartoon, not CGI plastic.

  COMPOSITION: full body, head to toe, neutral three-quarter stance facing camera, character
  centered, even margin around the figure. Face clearly readable and large enough to recognise.
  All clothing visible. Single character only.

  Lighting: flat, even studio lighting, no hard directional shadow, no colour grade, no vignette,
  no bloom. Photoreal materials under neutral light.

  Background: uniform pure white, for clean cutout. No ground, no cast shadow, no hallway, no
  furniture, no text, no watermark, no border, no panels, no grid, no nameplate, no UI.

  This is the canonical identity reference — render with high fidelity.
  No panels, no grid, no nameplate, no UI. Single image only.

COMMENTS: ## Design Notes
- Likeness from the subject's own provided photo. Costume from the music-video still.
- White studio background so rembg/cutout later is clean.
- Do not invent a different face. Do not invent a different suit.
