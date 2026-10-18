# Project rules

Read README.md and docs/TESTING.txt before changing the game.

Preserve the approved bright illustrated children's RPG and mobile-first interaction. The family has two adults and three children aged 3–5. Keep five visible customizable heroes, one mission at a time, shared family XP, crystals, journal and optional GPS. No camera APIs or AR. A grown-up may optionally choose an existing local image for a private postcard; this never affects rewards and never uploads it.

Keep the existing Netlify project and public address. Do not add authentication, a database, telemetry, paid APIs or dependencies without a concrete requirement and user approval. Do not imply static missions are live AI-generated. GPS data stays on-device and is not persisted or uploaded. Mission illustrations are not navigational instructions.

Keep wildExplorerSaveV2 and wildExplorerSave compatibility. Never clear storage to fix a release. Supply explicit tested migrations for any save-schema change. Update app and service worker VERSION constants and JS/CSS cache URLs together for each game release.

Use a feature branch and focused commits. Run node scripts/check.mjs and node --test scripts/engine.test.cjs scripts/postcards.test.cjs, review the diff, and test phone layouts (including 320px and 390px portrait), landscape, large text, character customization, mission completion, duplicate XP prevention, saved progress, export/import, GPS refusal, offline startup and the update prompt. Static checks do not cover these behaviors. Do not claim physical-device testing unless performed.

Keep credentials, personal exports and .netlify/ out of Git. Only public/ is deployed. Never upload a replacement app just to perform this repository migration. Do not create a different site or reset the working version.

Future updates: preview through a pull request, obtain approval for the specific release, then merge to main. Git-backed deployment replaces manual production uploads. Fix published mistakes forward through a new commit.
