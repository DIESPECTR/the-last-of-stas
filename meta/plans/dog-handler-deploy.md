---
SECTION_ID: plans.dog-handler-deploy
STATUS: in_progress
TYPE: note
---

# Dog Handler and deployment

- [x] Audit existing Dog Handler assets and runtime gap
- [x] Create GitHub repository and push deploy-safe baseline
- [x] Add Dog Handler to gameplay, raid picker and spawn pool
- [x] Provide animation fallback and document missing authored sheets
- [ ] Generate Dog Handler idle/walk/attack sheets — Wan 2.7 generated 8/12 MP4 clips; 8 alpha-video conversions complete but their requested PNG secondary sprite outputs are absent. Remaining `walk_left`, `walk_up`, `attack_left`, `attack_up` wait for balance/node recovery.
- [ ] Deploy the static build to Railway — both supplied tokens return `Unauthorized`
- [ ] Browser-check public deployment — waits for Railway URL
- [x] Record local integration and validation results in chronological action log
