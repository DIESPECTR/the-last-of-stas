---
SECTION_ID: files.assets.environment.house_top_png
TYPE: file/image
---

# Neighbour Houses — North

FILE: assets/environment/house_top.png
DESCRIPTION: Transparent row of burnt suburban houses for the extra north yard in the tall 9:16 map.
UTILITY: gpt_image
WIDTH: 1536
HEIGHT: 512
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Background silhouette along the top edge of the First Night yard so the reel crop is not a black letterbox.
PROMPT: |
  Goal: one isolated background building asset for a top-down survival game, extra north edge of the map.
  Subject: wide row of two burnt-out suburban houses sharing one lot, scorched roofs, collapsed chimney, boarded attic windows, charred porch, fallen satellite dish, scattered roof tiles.
  Composition: wide horizontal asset, buildings seen from a slightly elevated angle looking down at the roofs and the front walls, roofs toward the top of the frame. Buildings fill the frame width, ground line cut flat at the bottom edge.
  Style: photorealistic burnt-out architecture, believable charred timber, scorched brick and buckled metal, deep warm palette — charcoal-black scorching (#141009) over dark brown walls (#2e2114), saturated rust-orange on burnt metal, faint warm ember glow deep inside a collapsed roof; no bright fire, no grey, no desaturated charcoal-pencil look.
  Constraints: uniform pure white background for clean automatic cutout, no ground, no road, no sky, no cast shadow, no characters, no text, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Must read as a different street than house_left / house_right so the north yard is a new block, not a copy.
- Roofs dominate the silhouette — this strip sits at the very top of a 9:16 frame.
