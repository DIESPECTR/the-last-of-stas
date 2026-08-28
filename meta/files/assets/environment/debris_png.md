---
SECTION_ID: files.assets.environment.debris_png
TYPE: file/image
---

# Yard Debris Pile

FILE: assets/environment/debris.png
DESCRIPTION: Transparent top-down pile of scavenged wreckage — broken furniture, corrugated sheet metal, crates and rubble.
UTILITY: gpt_image
WIDTH: 1024
HEIGHT: 640
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Corner clutter in the First Night yard, placed away from the defended shelter footprint.
PROMPT: |
  Goal: one isolated game prop — a single pile of yard wreckage for a top-down survival game.
  Subject: collapsed heap of a broken wooden chair, splintered crate, bent corrugated metal sheet, torn tarpaulin, concrete chunks, a rusted bucket and scattered bricks.
  Composition: horizontal asset, one compact pile centred, viewed from directly above at a slight tilt, clear empty margin on every side.
  Style: photorealistic wreckage, believable splintered timber, corroded sheet metal and damp concrete materials, deep warm palette — dark brown wood (#3a2a18) and near-black shadow gaps inside the heap, saturated rust-orange corrosion across the metal, faint warm amber highlight on the topmost edges; no grey, no desaturated charcoal-pencil look.
  Constraints: uniform pure white background for clean automatic cutout, exactly one pile, no ground, no grass, no cast shadow, no characters, no scene, no text, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Reads at roughly 100×60 px — silhouette must survive heavy downscaling.
- Keeps the yard corners occupied without hiding zombie approach routes.
