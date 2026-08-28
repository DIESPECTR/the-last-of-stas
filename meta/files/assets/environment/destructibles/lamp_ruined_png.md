---
SECTION_ID: files.assets.environment.destructibles.lamp_ruined_png
TYPE: file/image
---

# Street Lamp — Ruined State

FILE: assets/environment/destructibles/lamp_ruined.png
DESCRIPTION: Photoreal top-down cutout of a street lamp snapped off at the base and lying on the ground, its housing burst open in a field of glass.
UTILITY: gpt_image
WIDTH: 736
HEIGHT: 1536
QUALITY: high
OUTPUT_FORMAT: png
MAKE_TRANSPARENT: rembg
USAGE: Final state of the lamp. The engine kills its light pool when the lamp reaches this state, which is what puts that stretch of yard into darkness.
PROMPT: |
  Goal: one isolated game asset — a single street lamp torn down and lying on the ground, photographed from directly overhead, for a top-down survival game.
  Subject: the post is snapped off at the base, the torn steel splayed into a ragged collar of jagged metal petals. The column lies flat, dented and creased along its length, paint stripped to bare rust. At the far end the cobra-head housing has burst apart: the frame is crushed, the diffuser gone, the lamp inside shattered, the reflector torn out and twisted. A wide scatter of broken glass fragments, ceramic shards and severed cable ends sprayed around the head.
  Composition: strict orthographic top-down view, camera exactly 90 degrees overhead, the fallen post running vertically down the frame with the burst housing at the top end, the whole wreck inside the frame with a small even margin, silhouette clearly flat and broken, no perspective distortion.
  Style: photorealistic torn scrap metal, believable bare rusted steel and shattered glass materials, deep warm palette — dark brown-black steel (#1c1710, #2e2417) with near-black shadow inside the torn stump and the gutted lamp head, very heavy saturated rust-orange and burnt copper across every ripped edge and the whole collapsed arm, scattered glass reading as dark smoked amber, faint warm amber highlight on the topmost wreckage; no grey, no overcast daylight, no desaturated cold palette, no flat mid-grey metal.
  Constraints: uniform pure white background for clean automatic cutout, exactly one fallen lamp, no ground, no road, no cast shadow, no glow, no light beam, no sparks, no people, no text, no logo, no watermark, no border frame.

COMMENTS: ## Design Notes
- Losing the light is a real gameplay consequence, so the asset must read as dead metal — zero luminous cues anywhere.
- The glass field around the head marks the spot where the light used to be, which helps the player parse the darkened yard.
- Same vertical orientation and centre as damaged/intact for a clean state swap.
