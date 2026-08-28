---
SECTION_ID: files.assets.environment.house_bottom_png
TYPE: file/image
---

# Neighbour Sheds — South

FILE: assets/environment/house_bottom.png
DESCRIPTION: Transparent row of burnt garages, sheds and backyard fences for the extra south yard in the tall 9:16 map.
UTILITY: gpt_image
WIDTH: 1536
HEIGHT: 512
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Background silhouette along the bottom edge of the First Night yard so the reel crop is not a black letterbox.
PROMPT: |
  Goal: one isolated background building asset for a top-down survival game, extra south edge of the map.
  Subject: wide backyard strip — two burnt single-car garages and a collapsed wooden shed, buckled garage doors, charred fence panels, a rusted water tank, fallen gutter, stacked burnt pallets.
  Composition: wide horizontal asset, buildings seen from a slightly elevated angle looking down at the roofs and the back walls, roofs toward the top of the frame. Buildings fill the frame width, ground line cut flat at the bottom edge.
  Style: photorealistic burnt-out backyard architecture, believable charred timber, scorched brick and buckled corrugated metal, deep warm palette — charcoal-black scorching (#141009) over dark brown walls (#2e2114), saturated rust-orange on burnt metal and garage doors, faint warm ember glow inside one open garage; no bright fire, no grey, no desaturated charcoal-pencil look.
  Constraints: uniform pure white background for clean automatic cutout, no ground, no road, no sky, no cast shadow, no characters, no text, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Must clearly differ from house_top / house_left / house_right: this is the BACK of the block, sheds and garages, not another street facade.
- Sits at the bottom of a 9:16 frame so the silhouette should be chunky and readable at ~110px tall.
