---
SECTION_ID: files.assets.environment.destructibles.crate_ruined_png
TYPE: file/image
---

# Crate Stack — Ruined State

FILE: assets/environment/destructibles/crate_ruined.png
DESCRIPTION: Photoreal top-down cutout of a crate smashed flat into a loose pile of broken planks and spilled scrap.
UTILITY: gpt_image
WIDTH: 1024
HEIGHT: 1024
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Final state of the crate prop, drawn after it releases its salvage. It no longer blocks projectiles.
PROMPT: |
  Goal: one isolated game asset — a single wooden supply crate smashed completely apart, photographed from directly overhead, for a top-down survival game.
  Subject: a loose flat pile of shattered pine boards lying across each other at random angles, jagged splintered ends, bent rusty nails still standing proud of the timber, one twisted steel corner bracket thrown clear. Between the planks lie spilled contents: a few dull metal offcuts, a crushed tin, coils of wire, wood chips and sawdust. Everything grey, damp and weathered, collapsed to roughly the height of a single plank.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, debris pile centred and spread noticeably wider and flatter than an intact crate, small even margin, no perspective distortion.
  Style: photorealistic wreckage, believable splintered timber and scrap metal materials, deep warm palette — dark damp brown boards (#3a2a18, #241a10) with near-black shadow in the gaps between the planks, pale warm ochre on the fresh splintered ends, heavy saturated rust-orange on the bent nails, bracket and scrap offcuts, faint warm amber highlight on the topmost planks; no grey, no overcast daylight, no desaturated cold palette, no pale bleached wood.
  Constraints: uniform pure white background for clean automatic cutout, exactly one debris pile, no ground, no cast shadow, no people, no intact box, no text, no printed markings, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- The silhouette must break the square completely — that irregular outline is what tells the player the cover is gone.
- Keep it low and flat: this prop stops blocking shots in this state.
- Spilled scrap justifies the salvage the crate pays out when it is destroyed.
