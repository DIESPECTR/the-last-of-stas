---
SECTION_ID: files.assets.environment.destructibles.fence_damaged_png
TYPE: file/image
---

# Fence Section — Damaged State

FILE: assets/environment/destructibles/fence_damaged.png
DESCRIPTION: Photoreal top-down cutout of a short picket fence section after bodies pushed through it — several pickets snapped off, the rail sagging, the line still standing.
UTILITY: gpt_image
WIDTH: 1536
HEIGHT: 512
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Single destructible fence section in front of the shelter, drawn at 74x20 world units. Distinct from the repeating yard-boundary fence strip.
PROMPT: |
  Goal: one isolated game asset — a single short section of damaged wooden picket fence, photographed from directly overhead, for a top-down survival game.
  Subject: about eight weathered dark brown timber pickets on two horizontal rails. Three pickets are snapped off low leaving jagged splintered stumps, one hangs loose at an angle held by a single bent nail, and the remaining pickets lean out of true. The upper rail is cracked through and sagging in the middle, nails pulled half out and streaked with rust. Old flaking paint, damp rain-darkened brown wood, mud spatter along the bottom.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, the fence running horizontally across the full width of the frame, both left and right ends cut cleanly at the frame edge, small vertical margin above and below, no perspective distortion.
  Style: photorealistic weathered timber, believable splintered wood grain and flaking paint materials, deep warm palette — dark damp brown pickets (#3a2a18, #241a10) with near-black shadow in every gap and behind the snapped stumps, pale warm ochre on the fresh splintered breaks so the damage reads, saturated rust-orange streaking from every pulled nail, faint amber highlight along the upper edges; no grey, no overcast daylight, no desaturated cold palette, no flat mid-grey timber.
  Constraints: uniform pure white background for clean automatic cutout, exactly one fence section, no ground, no grass, no cast shadow, no people, no text, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Gaps are the point: missing pickets have to be visible holes in the silhouette, since this prop never blocked shots and only reads through its outline.
- Runs strictly horizontally so engine rotation matches the intact and ruined variants.
- Damage is mechanical, not fire: this one is broken by bodies pushing through it.
