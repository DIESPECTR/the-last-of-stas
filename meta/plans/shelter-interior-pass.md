---
SECTION_ID: plans.shelter-interior-pass
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# Shelter Interior & Perspective Pass

GOAL: Turn the schematic house block into a real building the survivor can enter, board up and defend,
with window visibility that changes as the survivor moves (This War of Mine reading), carried traps,
and a lighting pass that replaces the flat grey wash with real contrast.

## Task Checklist

### 1. Stability
- [x] Fix the render-loop crash: negative `dt` from a click-captured `performance.now()` ran timers backwards
- [x] Clamp rain splash radii so Canvas can never throw `IndexSizeError`

### 2. Shelter as a real building (`src/shelter.js`)
- [ ] Replace the circular `house` proxy with a rectangular building: walls, one door, six windows
- [ ] Separate interior floor, furniture and exterior yard into distinct render layers
- [ ] Let the survivor walk through the door, collide with walls, and stand inside
- [ ] Fade the roof away while inside and back in while outside
- [ ] Keep zombies attacking walls/windows instead of stacking at a circle radius

### 3. Perspective window rendering
- [ ] Compute a per-window sight cone from the survivor's position through the opening
- [ ] Reveal the exterior only inside those cones while inside, and the interior only inside them while outside
- [ ] Update the visible slice every frame so moving sideways sweeps the view across the yard
- [ ] Boarded windows narrow the cone to gaps between planks
- [ ] Cast warm interior light out of every unboarded window onto the yard

### 4. Interaction system (`src/interaction.js`)
- [ ] Add a carried-item model: traps live in the inventory, not as a one-shot purchase
- [ ] Placement mode with a ghost preview, valid/invalid placement feedback, and click-to-place
- [ ] Pick a placed trap back up and return its charges to the inventory
- [ ] Board a window from either side for salvage, and pry the boards off again
- [ ] Contextual on-screen prompt for whatever is under the survivor's reach

### 5. Lighting & visual polish (`src/lighting.js`)
- [ ] Cast wall shadows from streetlamps and the survivor's lamp
- [ ] Warm interior pools, cold exterior night, and a vignette to kill the flat grey wash
- [ ] Raise contrast and reserve saturation for danger, fire and infection

### 6. Assets
- [ ] Interior floor, wall, roof, door, window and plank textures (delegated)
- [ ] Furniture props readable at gameplay scale (delegated)

### 7. Validation
- [ ] Enter and exit the house, confirm collision and roof fade
- [ ] Confirm the window view sweeps while walking along an interior wall
- [ ] Place, pick up and re-place a trap; confirm charges survive the round trip
- [ ] Board and unboard a window; confirm zombie behaviour and view cone both change
- [ ] Full siege with a clean console
- [ ] Record every step in `meta/docs/development-action-log.md`
