# 3.1.0 Halloween/night release QA

Date: 2026-10-18. All fixtures are synthetic; no family saves or private photos are deployed.

## Implemented

- 45 bundled night cards, 25 eligible in each of indoor / neighbourhood / trail. Cards and swaps are filtered by theme and context. Daylight card contents and seeded decks/IDs remain unchanged.
- Three independent paused night stories plus the existing daytime story, sharing heroes, XP, crystals, camp, journal and postcards. No save-key change or storage reset. Expansion schema 1 is extended additively with theme, setting and paused outing fields.
- A five-lantern storyline and cozy finale, separate nonflashing warm night styling and SVG cover artwork, Moon cape, friendly pretend bat and pumpkin-lantern camp decoration.
- Grown-up readiness gate with lit-room checks, safe sidewalk guidance and explicit trail opening/suitability verification. Night map is only a story map and does not show daytime park/GPS controls. Screen use is only while stopped; all cards provide seated/indoor alternatives.

## Automated checks passed

- `node scripts/check.mjs`: syntax, local assets, matching 3.1.0 cache versions, manifest and save keys.
- `node scripts/check-hunt.mjs`: original ten chapters, 17 bonus activities, 32 clues, 780 XP, legacy/v3 positions and duplicate rewards.
- `node --test scripts/engine.test.cjs scripts/postcards.test.cjs scripts/night.test.cjs`: 63 tests passed. Night tests cover 2,592 context/season/habitat/style/length cases, 1,080 swap/roundtrip cases, legacy compatibility, all four resumable stories, stale actions and new camp purchases.
- `node scripts/qa-engine.mjs`: nine groups, 193,037 assertions for daytime generation, rewards, saves, swaps, puzzle and postcards.
- `node scripts/qa-runtime.mjs`: 16 app-integration groups with DOM stubs. Includes all three night settings, readiness refusal, five-chapter completion, duplicate rewards, lantern puzzle, cape display, 5/10/15 planner behavior, day/classic switching, JSON roundtrip and existing GPS/refusal/import flows.
- `node scripts/qa-worker.mjs`: six mocked lifecycle groups. All 14 required offline files include the night SVG. Explicit update waiting, cache isolation, offline asset serving and same-release repair passed.
- Independent review additionally completed 450 night outings with reloads and stale actions. Mode-specific decks, exactly 440 XP / five crystals / one postcard, readiness gate and save preservation passed. Four small-text/focus contrast omissions were corrected after review.

## Browser and device limits

Static/source review and DOM stubs do not prove visual layout, real focus behavior or phone APIs. The shell workspace's localhost server is not reachable from the separate cloud browser. A deployment preview is used for available browser checks. Physical iPhone/Safari, real disconnected reload, installed PWA update acceptance, real GPS permission and IndexedDB photo persistence are not claimed unless explicitly recorded below.

## Release verification

Final preview and production verification are recorded with the release handoff. The public site remains the existing https://operation-wild-explorer.netlify.app origin. Existing installations should accept **Update game** when ready; do not clear site data.
