---
SECTION_ID: plans.dog-handler-deploy
STATUS: done
TYPE: note
---

# Dog Handler and deployment

- [x] Audit existing Dog Handler assets and runtime gap
- [x] Create GitHub repository and push deploy-safe baseline
- [x] Add Dog Handler to gameplay, raid picker and spawn pool
- [x] Provide animation fallback and document missing authored sheets
- [x] Generate Dog Handler idle/walk/attack sheets — Wan 2.7 generated all 12 MP4 clips. Final RGBA 4×4 sheets are at `assets/animations/sheets/dog_handler_zombie/`; 512×512, transparent alpha, 16 occupied 128×128 cells each.
- [x] Deploy the static build to Railway — connected GitHub `DIESPECTR/the-last-of-stas` (`main`) to Railway service `the-last-of-stas-web`; Docker/Caddy build deployed successfully.
- [x] Browser-check public deployment — verified `https://the-last-of-stas-web-production.up.railway.app`, including the Dog Handler picker/runtime sheets and a clean production console.
- [x] Record local integration and validation results in chronological action log
