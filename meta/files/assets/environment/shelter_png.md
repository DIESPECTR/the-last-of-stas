---
SECTION_ID: files.assets.environment.shelter_png
TYPE: file/image
---

# Player Shelter — Top-Down Cutaway

FILE: assets/environment/shelter.png
DESCRIPTION: Transparent top-down cutaway of the survivor's own house — roof removed, four rooms, barricaded windows, scavenged furniture, visible interior floor.
UTILITY: gpt_image
WIDTH: 1536
HEIGHT: 1152
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: The defended shelter at the centre of the First Night yard; damage cracks, shelter-health bar and barricades are drawn over it in Canvas.
PROMPT: |
  Goal: one isolated top-down cutaway building asset for a survival game map.
  Subject: small suburban house seen from directly above with the roof removed, revealing four rooms — a living room with a torn sofa and overturned table, a kitchen with a stove and a cupboard, a narrow hallway, and a back room with a mattress and stacked crates. Interior walls are thick and clearly readable, doorways are open gaps, every window opening is boarded with crossed planks.
  Key details: dusty wooden floorboards, cracked tiles in the kitchen, scattered debris, a lit oil lamp casting a small warm pool on the floor, sandbags near one wall, a rolled carpet, buckets and jars.
  Composition: strict orthographic top-down view, building centred and filling the frame, outer walls forming a clean rectangular footprint, clear empty margin on every side.
  Style: photorealistic gritty survival-game art, deep warm palette — dark aged wood floorboards in rich browns (#3a2a18, #4a3520), near-black shadows in room corners, one strong saturated amber oil-lamp glow (#e8a050) pooling across the floor, restrained rust-red on metal, walls in readable warm mid-brown that survives a dark night colour grade; no grey, no desaturated charcoal-pencil look.
  Constraints: uniform pure white background for clean automatic cutout, exactly one building, no roof, no ground, no yard, no road, no cast shadow outside the walls, no characters, no text, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Rendered at roughly 232×176 px in game — room layout must survive heavy downscaling.
- Mid-tone values are mandatory: the night grade multiplies over it, and dark artwork collapses to a black rectangle.
- Interior must read as inhabited so the shelter feels worth defending.
