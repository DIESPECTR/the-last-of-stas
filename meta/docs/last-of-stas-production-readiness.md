---
SECTION_ID: docs.last-of-stas-production-readiness
TYPE: note
STATUS: complete
---

# The Last of Stas — Production Readiness

## Decision

**Ready for controlled production deployment.** No open P0/P1 runtime blocker was found in the validated browser paths. The latest pass closes the custom-only zombie picker, selected-skin raid startup, physical-key movement, custom-only waves, desktop/reel presentation, production globals, console checks, and chronological evidence.

## Validated release paths

- Normal Stas mode: preparation, physical-key movement, song/wave startup, custom zombie waves, combat, victory and defeat presentation.
- Hater Raid: seven custom skins, visual selection, selected runtime identity, comments, provocation, Stas return fire, speaker attack, victory, defeat and exit.
- Display modes: desktop, cinema and 9:16 reel; HUD safe zones, terminal scenes, picker, active raid and rollback.
- Production path: no `window.__dev`, `window.__gfx`, or `window.__rig`; no current application errors, warnings, failed loads, 404s, `TypeError`s, or `ReferenceError`s.
- Accessibility: semantic mode buttons, grouped zombie picker, one `aria-pressed` selection, visible focus behavior and focus transfer to the canvas at raid start.

## Latest fixes

- Removed default `drifter`, `runner`, and `spitter` from the picker and scenario wave pools.
- Added animated visual previews for all seven custom zombie skins.
- Fixed raid-start focus being immediately removed by the generic button wrapper.
- Fixed the zombie picker rendering as an `880px` desktop modal in reel mode; it now occupies the real centred 9:16 frame.
- Confirmed physical `KeyA` movement in both desktop and reel Hater Raid.

## Remaining non-blocking risks

1. **Physical-device coverage:** reel mode was measured at an exact 9:16 CSS frame inside the browser tab, but a final pass on at least one real iOS and one Android device is still recommended for browser chrome, touch latency and audio routing.
2. **Fullscreen automation noise:** scripted Fullscreen API calls produce informational rejections because automation is not a trusted user gesture. Real button interaction is the supported path.
3. **External fonts:** Google Fonts remain a network dependency. The CSS fallback stack keeps the game usable, but self-hosting the WOFF2 files would improve offline reliability.
4. **Performance envelope:** validate sustained frame pacing on a mid-range phone with the maximum live zombie count and audio enabled before broad promotion.

## Deployment checklist

- Serve over HTTPS with correct MIME types for JavaScript, JSON, PNG, WebP, MP3 and MP4 assets.
- Disable stale CDN caching for `index.html`; keep long-lived immutable caching only for revisioned assets.
- Run one real-device smoke test: choose Stas, start song, move, shoot, finish; then choose a custom zombie, taunt, attack speaker and exit.
- Confirm production telemetry does not expose the opt-in `?dev=1` harness.
- Keep `meta/docs/development-action-log.md` as the evidence trail for this release.

## Evidence

Detailed chronological evidence is recorded in `meta/docs/development-action-log.md`, especially sections 61–66.
