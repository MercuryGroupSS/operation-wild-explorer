# Interactive treasure map and magical crystal presentation

Implementation for the shared 3.3 release branch. This is an enhancement to the existing game, not a replacement save or site.

## What changed

- `public/quest-magic.js`: pure, dependency-free map model/rendering, faceted crystal rendering, and an optional Web Audio chime engine. It does not write XP, wallet, inventory, challenge checks, map pieces, or any save.
- `public/quest-magic.css`: isolated `qm-` styles. A parchment woodland map and a moonlit map have contour lines, terrain, a river, a dotted path, an animated current marker, named stops and an X/chest finale. The illustrated heroes are unchanged.
- The Map tab always reflects the current mode: five daytime chapters, the selected paused/resumable Halloween setting, or all ten original classic chapters. Completed nodes show earned discoveries; the current node continues the current challenge; locked nodes show anticipation without a reward action. Early-ended outings have no active marker and cannot reveal the finale.
- Crystals use layered angular SVG facets, restrained refraction, soft auras, slow floating/turning, moving motes and a reward entrance. Challenge progress is shown beside the crystal. Existing hands-on prompts, alternatives and one-challenge-at-a-time gameplay remain intact.
- Sounds start muted. Enabling sounds is a user action; later successful actions play soft synthesized bell partials. There are no audio downloads, microphones, camera permissions, or licensed media dependencies. Existing motion-off and system reduced-motion settings stop the presentation animations; backgrounding stops sound and animation.
- `settings.volume` is an additive 0–100 value, default 55 for older saves. Existing sound/motion values, save keys and all progression fields are preserved. Zero volume is silent. The slider and phone volume apply independently.
- The story map uses no coordinates. Existing optional daytime GPS and manual location fields remain separate and unchanged. Night mode does not introduce GPS controls.

## Automated checks actually performed

`node --test scripts/quest-magic.test.cjs`: 13 tests passed.

Covered daytime/night/classic mode selection, ten-chapter classic progress independent of expedition index, collected/current/locked nodes, paused outings, five-piece/ten-crystal finale gates, puzzle-solved display, duplicate/invalid indexes, text escaping, safe color/class attributes, unique SVG IDs, crystal progress rendering, muted/zero-volume/hidden/unsupported audio, bounded note envelopes, immediate voice cleanup, and cancellation of pending audio-resume work after mute/background.

`node scripts/qa-runtime.mjs`: the existing 38 groups plus 7 new groups passed (45 total at integration).

Added groups cover map inspection without XP/wallet changes; locked and earned dialogs; no claim action on the map; correct classic10 mode; escaped private discovery notes; early ending and finale repeat safety; each Halloween setting and return to the saved daytime outing; faceted challenge progress and awakened state; duplicate claim protection; volume clamping/persistence and preservation of roster, camp, journals and stories; silent rendering and sound/motion lifecycle.

These tests use Node DOM/audio stubs. They are not visual, real-browser, physical-device or acoustic verification.

## Browser checks and limitations

An isolated local headless Chromium test was prepared with synthetic state only. The installed browser could not launch because the executor sandbox denied its local process socket. The supported execution escalation failed before browser startup with an infrastructure filesystem error. Therefore no local Chromium screenshots, viewport pass, actual sound quality, or physical iPhone/Safari result is claimed here. The release lead owns subsequent real-browser/preview QA.

Before release, visually review:

1. 320 and 390 px portrait: day and moonlit map labels, all ten classic stops, current marker, chest and legends; no clipping or overlap. Review 844 px landscape and 200% text as well.
2. Current, earned and locked node sheets: keyboard/touch activation, close/back focus, no duplicate or premature rewards; finale puzzle and classic celebration.
3. Challenge, ready-to-claim and reward crystals: attractive facets, readable counters, gentle moving effects, opt-in audible chimes, quiet volume, mute and hidden-tab silence.
4. Reduced motion, app motion-off and background pause; visible clue information must remain understandable without movement or sound.
5. Day/night lantern effects with the independent map/crystal palette; long hero names and extended roster remain intact.
6. Offline cache includes both new assets at the matching app version; existing update/save/migration regression checks remain required.

No production data, real-family save, or physical-device claim was used in these checks.
