---
SECTION_ID: plans.zombie-player-mode
TYPE: plan
STATUS: active
---

# Zombie Player Mode — «Хейтерский рейд»

## Goal
Create a separate playable mode where the player chooses a zombie, crosses the yard under AI-controlled Stas fire, selects an approved taunting comment, and destroys the speaker.

## Flow
1. Open «ИГРАТЬ ЗА ЗОМБИ» from the header.
2. Choose one of the existing animated zombie types.
3. Start outside the house; move with physical WASD.
4. Select/shout one of three random approved comments (buttons or 1/2/3).
5. Taunting raises provocation: Stas fires faster and more aggressively.
6. Reach the speaker and attack it with LMB/Space.
7. Win by destroying the speaker; lose if Stas kills the zombie.

## Implementation checklist
- [ ] Add mode-selection and zombie-roster UI.
- [ ] Add zombie-mode state and reset-safe mode switching.
- [ ] Add controlled-zombie movement, collision, animation, HP and attack.
- [ ] Add AI Stas aiming/fire and provocation scaling.
- [ ] Add selectable approved comments and speech bubble feedback.
- [ ] Add speaker HP, win/loss states, restart/exit controls.
- [ ] Add dedicated in-canvas HUD and responsive/mobile UI.
- [ ] Expose deterministic dev hooks and run browser regression.
- [ ] Record each implementation and validation step in chronological action log.
