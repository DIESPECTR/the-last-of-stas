---
SECTION_ID: plans.sfx-pack
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# SFX pack verification

GOAL: All ten cues exist, decode, play through `audio.js`, and fire from live gameplay. Short click must shoot.

## Checklist
- [x] Generate 10 WAVs (ElevenLabs) including jam/ui/backfire
- [x] Sample-first `audio.js` + procedural fallback
- [x] Wire spawn/shot/impact/death/jam/backfire/house_hit/trap/ui/place
- [x] Fix tap-to-fire: `fire()` on mousedown, not only while held across rAF
- [ ] Browser: decode 10/10, playSound 11/11
- [ ] Browser: click fires, heat rises, jam/overheat play
- [ ] Console clean (no new errors)
- [ ] Log verification in §45
