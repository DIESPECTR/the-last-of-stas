---
SECTION_ID: files.assets.environment.destructibles.car_ruined_png
TYPE: file/image
---

# Wrecked Car — Ruined State

FILE: assets/environment/destructibles/car_ruined.png
DESCRIPTION: Photoreal top-down cutout of a completely destroyed burnt-out car — collapsed roof, no glass, sitting on bare rims in a ring of ash.
UTILITY: gpt_image
WIDTH: 1536
HEIGHT: 736
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Final destruction state of the car prop. Drawn 12% wider and 28% flatter than the intact footprint, so it reads as rubble the player can shoot over.
PROMPT: |
  Goal: one isolated game asset — a single completely destroyed burnt-out car, photographed from directly overhead, for a top-down survival game.
  Subject: the gutted shell of an old European sedan after a fire. Roof collapsed and caved in toward the centre, all paint burnt away to scorched black and oxidised orange-brown metal, every window gone leaving empty blackened frames, doors twisted open or missing, bonnet torn off exposing a charred engine bay, seats reduced to blackened springs. Tyres burnt away completely, the shell resting low on bare deformed steel rims. Flakes of ash and warped metal fragments scattered tight around the wreck.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, wreck horizontal across the frame with its nose to the right, whole wreck inside the frame with a small even margin, silhouette visibly lower and more broken than an intact car, no perspective distortion.
  Style: photorealistic burnt-out wreck, believable scorched metal and carbon materials, deep warm palette — charcoal-black soot (#141009) over dark brown scorched panels (#2e2114), near-black shadow inside the gutted cabin, heavy saturated rust-orange and burnt copper across every torn and heat-blued edge, a faint dull ember glow deep in the engine bay; no bright fire, no ash grey, no overcast daylight, no desaturated cold palette.
  Constraints: uniform pure white background for clean automatic cutout, exactly one wreck, no ground, no asphalt, no cast shadow, no fire, no flames, no smoke, no people, no text, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Terminal state — it never repairs, so it must look final: collapsed roof and bare rims are the two silhouette cues that read instantly at gameplay scale.
- Stops blocking projectiles in this state, so it must sit visually LOW: nothing sticking up above the beltline.
- Same orientation and centre as the damaged/intact variants for a clean state swap.
