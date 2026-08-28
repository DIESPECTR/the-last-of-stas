---
SECTION_ID: files.assets.style.first_night_screen_png
TYPE: file/image
---

# First Night Combat Screen

FILE: assets/style/first_night_screen.png
DESCRIPTION: Full 16:9 visual target for the First Night house-defense game screen, used as the locked style reference for the Canvas implementation and later UI extraction.
WIDTH: 1536
HEIGHT: 864
UTILITY: gpt_image
OUTPUT_FORMAT: png
QUALITY: high
USAGE: Art-direction reference for gameplay scene, HUD, Weapon Lab and future extracted textures.
PROMPT: |
  Create a shipped-looking, CINEMATIC 16:9 game combat screen for an original post-apocalyptic house-defense
  game. This is a "wow-effect" art-direction pass — the previous version read as flat grey mush; this one must
  have real depth, a hot lit centre and a genuinely dark rim, exactly like a graded night photograph.

  Scene: slightly elevated top-down / cutaway view of a fragile two-room survivor house at night beside a
  cracked road. A lone survivor stands outside, rim-lit by a warm amber glow bleeding from the house behind
  them, aiming a bizarre homemade bone-shard gun mid-muzzle-flash (small bright core + soft bloom halo) at a
  small horde closing in from the darkness. Barricaded windows glowing amber at the seams, scavenged furniture
  visible through a torn wall, rain streaks catching the lamp light, drifting smoke, handmade traps, blood
  spatter on the mud and one wall. One zombie mid-hit-flash (pale rim outline, slightly desaturated). The
  house is a vulnerable improvised home, not a military fortress.

  Lighting / grade (this is the main ask): one dominant warm light source — the house interior and its window
  spill — pushed bright enough to visibly bloom and bleed light into the dark air around it; every other light
  (streetlamp, muzzle flash, embers) is a small warm accent, never competing with it. Everything outside those
  pools falls to a genuinely dark, cold, near-black rim — real contrast between lit and unlit, not a uniform
  grey wash. A tight vignette crushes the corners. Every silhouette (survivor, zombies, house edge) carries a
  thin pale rim-light separating it from the dark ground behind it.

  Visual direction: charcoal drawing, dirty paper grain, rough pencil hatching, muted graphite-black and warm
  gray palette — BUT with much stronger local contrast and a richer amber/rust accent than a flat sketch.
  Restrained color, reserved for meaning: rust-red for danger, damage and blood, sickly yellow-green for
  infected salvage, hot amber for shelter light and muzzle flash. Human, bleak, tactile, handmade. Strong
  silhouettes readable at gameplay scale. Original visual language; do not reproduce any existing game's
  characters, UI, layouts, or logos.

  UI (must look like a real shipped HUD, not a decorative sketch — legible numbers, not just icons):
  - Upper-left status strip, dark stained metal plate: "NIGHT 1" with a thin horizontal progress bar beneath
    it; "HOUSE" with a bold numeric HP readout (e.g. "HOUSE 640/1000") on a two-tone bar that is mostly green/
    amber but visibly reads red and cracked once low; "HEAT" as a short gauge that fills toward a red
    overheat zone with a numeric readout; "KILLS" with a plain number. A row of small wave-progress pips
    (filled rust-red squares vs hollow outlines) directly under the strip.
  - A short red damage-flash vignette pulse implied at the frame edge, as if the house just took a hit.
  - A vertical Weapon Lab panel on the right: dark stained sheet metal, torn paper labels, pencil annotations,
    rust-red action buttons, one weapon silhouette with a small stat readout (Damage / Heat / Noise).
  - Bottom-right compact salvage inventory: bone, tendon, infected fluid and metal scrap icons each paired
    with a small numeric count, not bare icons.
  Clear hierarchy, playable spacing, no decorative empty panels — every element must look like it reports a
  real number.

  Exact readable English labels only: "FIRST NIGHT", "WEAPON LAB", "TEST CHAMBER", "SALVAGE", "HOUSE", "HEAT",
  "KILLS", "NIGHT 1". Numeric HUD values may be any plausible in-game numbers. No other readable text, no
  logos, no watermark.
  Treat this as a single composited screenshot, not concept art. Keep the center gameplay field unobstructed.
  High contrast, accessible UI, real bloom on the brightest lights.