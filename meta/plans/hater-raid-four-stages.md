---
SECTION_ID: plans.hater-raid-four-stages
STATUS: done
TYPE: plan
---

# Hater Raid — four short stages

- [x] Add four-stage state machine: yard, fence, house, speaker
- [x] Reuse existing fence art and add destructible gate gameplay
- [x] Make Stas engage throughout the raid and scale pressure by stage
- [x] Add stage-clear boosts, combo damage and HUD feedback
- [x] Wire attack input to gate/speaker context without new animations
- [x] Browser-test full victory route, defeat, stages and boosts
- [x] Run debugging session with breakpoints/variable inspection
- [x] Check console and remove temporary debug markers
- [x] Make each visible fence section independently destructible and collidable
- [x] Add contextual idle/confusion hints for every raid stage
- [x] Record every step in chronological action log
- [x] Deploy the verified build and smoke-test production

## Post-release runtime debugging session

- [ ] Boot production with developer probes and inspect initial state
- [ ] Exercise Stas mode movement and weapon render/audio state
- [ ] Exercise Hater Raid selection, movement, animation and fence sections
- [ ] Inspect victory/defeat transitions and runtime invariants
- [ ] Check browser console and network-facing asset failures
- [ ] Fix confirmed runtime defects and rerun affected paths
- [ ] Remove temporary debug markers and record results in chronological action log
