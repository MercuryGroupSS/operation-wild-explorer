# Wild Explorer 3.0.2 release evidence

Date: 2026-10-18. All fixtures used for testing were synthetic. No real family exports or photographs were uploaded.

## Source and deployment

- Preserves main release 2.1.0 at `1d50253ecaea4a8e52cb9286d3e3553331bd1f7c` as a parent of the reconciled release commit `0c9efb507dfb4272ecf30bf0185cc44bf20f79e6`.
- Existing Netlify project and public origin are retained.
- Preview deploy `6ad4f1aee220af52afd4c903` completed successfully. App, classic, engine, postcard, stylesheet, service-worker and original artwork bytes matched the local release. Immutable preview HTML matched too; the friendly preview URL injects Netlify's review drawer.
- Deployed CSP and Permissions-Policy were checked. Camera/microphone access is disabled; game assets are same-origin. No accounts, analytics, external AI calls, or photo uploads were added.

## Automated checks on current 3.0.2

All commands in `netlify.toml` passed locally, and the preview build succeeded:

- `scripts/check.mjs`: syntax, assets, manifest, synchronized 3.0.2 versions and original save keys.
- `scripts/check-hunt.mjs`: ten classic chapters, seventeen bonus activities, thirty-two clues, 780 XP; legacy/2.1 migration at every chapter position; five Rainbow check flags; stale action and duplicate reward guards.
- Engine and postcard unit tests: 43 passed. Includes deterministic selection, rewards, spending, snapshot retention, photo formats/size limits, storage failure, escaping and export cleanup.
- `scripts/qa-engine.mjs`: 9 groups, including 4,320 habitat/season/length/difficulty/seed decks, no adjacent repeated types, recent-card avoidance when alternatives exist, swaps, short endings, puzzle retry, legacy migration and malformed data. The 193,037 assertions are programmatic checks, not independent browser sessions.
- `scripts/qa-runtime.mjs`: 13 minimal-DOM integration groups. Full outing rewards, leader rotation, double-tap/stale action protection, hero changes, planner/camp persistence, GPS refusal/stale callbacks, unsupported speech, blocked storage, backup confirmation, escaping, completed legacy postcards, all eleven 2.1 positions, classic remaining seventeen clues and full ten-crystal restore.
- `scripts/qa-worker.mjs`: 6 mock-cache/network groups. Thirteen required cache entries, first install versus staged update, cache-only offline responses, owned-cache cleanup, missing-asset reporting, and repair only when the installed and remote release match.

These runtime/worker checks use stubs and mocks. They do not replace Safari, real browser storage or disconnected-browser testing.

## Actual cloud Chromium workflows

The independent browser pass was performed against the earlier 3.0.0 preview. Later 3.0.1/3.0.2 changes were validated by the automated checks above, review and deployed byte comparison. The following were observed in the browser:

- Original illustrated home and five visible heroes loaded.
- Garden/winter/short/curious builder produced a five-challenge outing.
- Safe alternative, challenge substitution, lead rotation, complete outing and deliberate repeated challenge/reward clicks worked. The full outing ended at exactly 440 XP and five crystals.
- Final discovery-order puzzle accepted a correct answer and allowed a wrong-answer retry without penalty.
- Favorite postcard text containing markup characters remained escaped.
- A synthetic PNG was selected, re-encoded locally and displayed as an optional postcard photo.
- Downloaded HTML postcard contained an embedded JPEG, escaped text, restrictive CSP and no remote resource references. JSON export contained progress and photo references, not photo pixels or GPS.
- Leaf-cape purchase with a deliberate double click spent three crystals once; compass purchase spent two. Wallet reached zero while XP/trophies were retained.
- Hero name, role, specialty, outfit, skin, hair and lead selection appeared in exported progress.
- GPS refusal showed the manual-park fallback.
- DOM geometry checks at 320px and 390px CSS viewport widths, including 200% browser zoom, reported no horizontal overflow across the five screens and reachable navigation. These are layout measurements, not a physical-device test.

## Review and limitations

Independent source review identified fixes for failed/shared photo deletion, postcard history retention, completed-save postcard dates, safe-alternative narration and explicit offline repair. Those fixes are incorporated and tested. The final 2.1 compatibility regression also caught and fixed postcard normalization differences across reload. No remaining material application defect was identified in the checks completed.

Unverified items:

- Physical iPhone, Safari/Home Screen installation, iOS image-picker behavior, real GPS accuracy and device narration voices.
- Actual disconnected-browser reload. Developer Tools/network emulation was unavailable in the cloud browser; offline branches were tested with mocks and the installed earlier preview reported cache readiness.
- Final 3.0.2 staged service-worker update, current-version browser persistence and browser backup restore. A file-chooser call stalled and was aborted. A subsequent read-only accessibility/screenshot inspection also stalled and was aborted. Neither operation was retried through another route.
- Corrected full-width mobile screenshots. Earlier zoomed page screenshots were cropped by the capture tool and are explicitly excluded from visual-pass evidence. The desktop home capture was usable; the grey overlay there was Netlify's preview-only drawer blocked by the app CSP, not a game image. The CSP was not weakened.

## User-facing storage limits

Progress and photos stay in the current browser on the same origin. Clearing/evicting site data can remove them. JSON backups include text/progress/photo IDs but not photo pixels. Individual downloaded HTML postcards embed available photos. JPEG/PNG/WebP are supported; HEIC may need conversion first. Optional photos are limited to four per postcard and 15 MiB per selected image, then resized and re-encoded to remove original metadata. No photo is needed for any reward. Browser speech may be unavailable, especially offline.

Before an outing, open online, use Download and verify offline adventure, and keep browser site data. Existing installations should use Check for a game update and accept Update game when offered; never clear storage to update.
