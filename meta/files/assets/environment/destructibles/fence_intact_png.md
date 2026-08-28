---
SECTION_ID: files.assets.environment.destructibles.fence_intact_png
TYPE: file/image
---

# Fence Section — Intact State

FILE: assets/environment/destructibles/fence_intact.png
DESCRIPTION: Photoreal top-down cutout of a standing picket fence section, weathered but with every picket in place.
UTILITY: gpt_image
WIDTH: 1536
HEIGHT: 512
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Starting state of a destructible fence section in front of the shelter, drawn at 74x20 world units.
PROMPT: |
  Goal: one isolated game asset — a single short section of standing wooden picket fence, photographed from directly overhead, for a top-down survival game.
  Subject: about eight weathered dark brown timber pickets evenly spaced on two horizontal rails, every picket present and upright, tops cut square. Old paint flaked down to bare damp rain-darkened wood, visible grain and knots, flat nail heads with faint rust halos, damp patches and a little moss near the bottom rail.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, the fence running horizontally across the full width of the frame, both left and right ends cut cleanly at the frame edge, small vertical margin above and below, no perspective distortion.
  Style: photorealistic weathered timber, believable wood grain and flaking paint materials, deep warm palette — dark damp brown pickets (#3a2a18, #241a10) with near-black shadow gaps between them, saturated rust-orange bleeding from every nail, faint warm amber highlight along the upper picket edges as if lit by a distant streetlamp; no grey, no overcast daylight, no desaturated cold palette, no flat mid-grey timber.
  Constraints: uniform pure white background for clean automatic cutout, exactly one fence section, no ground, no grass, no cast shadow, no people, no damage, no missing pickets, no text, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Even picket spacing is what makes the damaged state's gaps read at a glance.
- Strictly horizontal and centred like the damaged/ruined variants so engine rotation matches.
- Weathered, not new: this is a pre-collapse suburb, not a maintained garden.
