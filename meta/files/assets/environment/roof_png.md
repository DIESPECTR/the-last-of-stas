---
SECTION_ID: files.assets.environment.roof_png
TYPE: file/image
UTILITY: gpt_image
---

# Shelter Roof — top-down photographic slab

FILE: assets/environment/roof.png
WIDTH: 1536
HEIGHT: 1024
QUALITY: high
OUTPUT_FORMAT: png

DESCRIPTION: |
  Straight top-down aerial view of the roof of a small single-storey survivor house.
  It is the occluder drawn over the building footprint: while the survivor is outside, this is
  the whole building as seen from above, so it has to read as a real roof at a glance and it has
  to survive being alpha-faded to nothing when the survivor steps through the door.

PROMPT: |
  Goal: a game texture — the roof of a small abandoned house, seen straight down from directly above.

  Scene: nothing but the roof surface itself, filling the entire frame edge to edge. No ground, no
  yard, no sky, no surrounding buildings, no border, no margin.

  Subject: a weathered pitched roof of corrugated iron sheets over old timber, on a poor rural
  house in an abandoned town. A single ridge line runs horizontally across the middle of the frame,
  with the two slopes falling away from it towards the top and bottom edges. The sheets run
  perpendicular to the ridge, overlapping, with visible fixing bolts and rust bleeding down from them.

  Key details: deep rust in warm iron-oxide browns and burnt orange over dark grey-brown metal;
  patches where sheets have been replaced with mismatched salvage; a small tarpaulin lashed over a
  hole near one corner; moss and wet leaf litter caught in the seams; a short brick chimney stack
  slightly off-centre; damp patches from recent rain. Real material texture — pitted metal, grain in
  the exposed timber battens, grit.

  Composition: perfectly orthographic top-down, camera dead overhead, no perspective convergence,
  no vanishing point, no visible walls or eaves overhang. The roof plane is parallel to the frame.

  Lighting: overall dark, as at night, but lit warmly and unevenly, as if by a nearby street lamp
  low to one side — a warm falloff across the surface rather than flat even light. Deep shadow in the
  seams. Rich colour must survive in the darkness: warm rust and brown, never a flat grey slab.

  Constraints: photorealistic, not illustrated, not a diagram, not isometric, not 3/4 view.
  No people, no text, no watermark, no logo, no UI, no frame, no drop shadow, no vignette.
  No hard bright evenly-spaced lines across the surface — the plank and sheet detail must read as
  material, not as a ladder of high-contrast stripes.

USAGE: |
  Drawn by drawShelterRoof() in src/shelter.js, scaled to cover the shelter footprint
  (272×200 world units). Replaces the procedural near-black slab that currently reads as a black
  rectangle over the house. It is alpha-faded from 1 to 0 as the survivor walks inside, so its own
  internal contrast has to be low-frequency and material-based: any hard bright line painted into it
  will survive the fade and read as an artifact lying across the revealed interior.

COMMENTS: ## Design Notes
- Must match the palette of assets/environment/shelter.png (the warm lit top-down cutaway interior)
  and the regenerated warm environment set — deep warm browns, rust, lamp-lit falloff.
- Aspect is 3:2 against a 1.36:1 footprint; the renderer covers the footprint and crops the
  overflow, so the ridge must sit at the vertical centre to survive the crop.
- No baked-in vignette or drop shadow: the frame already has its own grade, and a second one
  painted into the asset is what previously made the building read as a dark blob.
