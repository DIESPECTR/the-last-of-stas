---
SECTION_ID: plans.last-of-stas-production-audit
STATUS: complete
TYPE: plan
---

# The Last of Stas — production audit and polish

## Baseline audit
- [x] Inspect runtime architecture, data, UI and display modes
- [x] Capture desktop, cinema, reel and Hater Raid baselines
- [x] Check console, missing assets, overflow, focus and input behavior

## Production fixes
- [x] Fix P0 crashes, broken interactions and terminal-state defects
- [x] Fix P1 readability, overlap, responsive and control-discovery issues
- [x] Polish gameplay feedback, pacing, balance and mode transitions
- [x] Improve accessibility, reduced-motion behavior and touch/readability safety
- [x] Remove stale debug/dead production paths and obvious data defects

## Post-fullscreen display-mode regression
- [x] Recheck normal desktop shell and quiet-yard gameplay
- [x] Recheck normal cinema mode, HUD anchoring and exit
- [x] Recheck normal 9:16 reel mode, HUD anchoring and desktop rollback
- [x] Recheck raid picker before active viewport takeover
- [x] Check console, overflow, production globals and mode-state leakage
- [x] Record discovered issues chronologically

## Start and ending presentation
- [x] Generate Stas and zombie mode-selection artwork from locked character refs
- [x] Generate character-specific victory and defeat artwork for both modes
- [x] Replace the direct-start shell with an accessible two-card mode picker
- [x] Show the correct ending artwork and actions for all four terminal states
- [x] Validate desktop, cinema and 9:16 reel layouts and log evidence

## Custom-only zombie picker regression
- [x] Remove default Drifter, Runner and Spitter from picker and scenario waves
- [x] Add visual previews and accessible selected-state semantics for all custom skins
- [x] Start Hater Raid with the selected runtime skin and preserve canvas focus
- [x] Validate physical-key movement in desktop and reel
- [x] Fix and validate the 9:16 reel picker layout
- [x] Verify production console and record chronological evidence

## Release validation
- [x] Validate normal mode end-to-end and Hater Raid win/loss
- [x] Validate desktop, cinema and 9:16 reel layouts
- [x] Verify production path has no dev globals, errors, warnings or failed loads
- [x] Record chronological implementation evidence
- [x] Write production-readiness report with remaining risks
