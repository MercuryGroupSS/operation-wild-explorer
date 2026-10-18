# Operation Wild Explorer

A bright, mobile-first family nature RPG for two adults and three young children. Start with five customizable heroes and add players in Heroes. The whole team shares lifetime XP, five story chapters and a family base camp. Deterministic, bundled content runs without accounts, APIs, telemetry or runtime dependencies.

Production: https://operation-wild-explorer.netlify.app
Netlify project: `142205d8-6800-49d7-996f-5e0ee5094ee7`

## Release 3.2.0: more explorers, real little adventures

Activities across Halloween, daytime and the classic hunt now lead to something children actually make, notice, compare or do. The fantasy stays in the story and rewards. Stable card IDs, clue positions, saved progress and all existing modes are retained.

- Add players in Heroes, with names, adult/child choice and independent appearance. The creation screen supports up to 24 players; existing larger imported teams are retained.
- Every explorer automatically wears a friendly wizard, ghost, pumpkin or bat costume in Halloween mode. Costume choices are separate from daytime outfits, which return when switching back.
- Indoor Halloween examples include folded paper wizard hats, short loose seated capes, low cushion palaces, tiny folded storybooks and a real shadow-size experiment.
- Use household materials already available, with no purchases needed. Simpler seated options, child-directed grown-up help and no-material alternatives keep everyone involved. Outdoor activities need no craft supplies or collecting.
- Grown-ups handle any cutting and fit costumes safely: clear faces, no neck ties, short fabric removed before moving, no candles or climbing.
- “Make & tell” is the visible label for creative activity cards; saved category values remain compatible.
- See `docs/QA-3.2.md` for the checks and device-test limits.

## Halloween night adventures

Choose **Halloween night adventures** on Play, then **Cozy house**, **Neighbourhood walk**, or **Nearby trail**. Each setting has a separate, resumable story; return to the daytime expedition or original ten-crystal hunt at any time. All modes share the same explorer team, lifetime XP, earned camp crystals and private memories.

- 45 friendly night challenges, with 25 eligible per setting, filtered again on swaps and saved-game reloads. Every card has a simpler seated/indoor alternative, including a no-material action when craft supplies are unavailable.
- Five little lantern chapters and a cozy pumpkin-party finale, a warm nonflashing night palette, illustrated moon/bat/pumpkin cover, a wearable Moon cape, a pretend bat companion and a pumpkin lantern for camp.
- New night settings start with 5 gentle challenges. The planner still supports 5 / 10 / 15 and three challenge styles.
- A grown-up readiness check before entering a night setting. Indoors stays comfortably lit; sidewalk tasks do not require road crossings or door visits; the trail requires the grown-up to verify it is open and suitable after dark. Stop in a safe place before looking at the phone. The game does not operate the phone flashlight, research routes or opening times, or attract real animals.
- Existing 3.0.2, 2.1, v2 and legacy progress is retained with additive mode/context fields and three paused outing slots. See `docs/QA-3.1.md` for release checks and remaining device-test limitations.

## Daytime adventures retained

- A varied Find / Listen / Move / Make & tell / Solve deck; adjacent categories differ and recent cards are avoided when possible.
- Safe alternatives for every card, swaps, breaks and a shorter ending without losing earned progress.
- Five linked map pieces and a final ordering puzzle using the family's discoveries.
- Scout / Listener / Detective specialties, rotating pretend lead and shared-phone play.
- Persistent camp crystals, tents, flags, a wearable leaf cape and pretend animal companions.
- Habitat, season, length and challenge-style builder with 5 / 10 / 15 challenges.
- Private text postcards with favourite moments, badges and optional device-local photos. Explicit HTML download embeds available photos; nothing is posted online.
- Offline-ready cache verification, automatic save after each challenge, optional browser read-aloud and one large mobile challenge at a time.

## Local development and checks

Serve `public/` with any local static server, such as `python3 -m http.server 8080 --directory public`.

Run:

```
node scripts/check.mjs
node scripts/check-hunt.mjs
node --test scripts/engine.test.cjs scripts/postcards.test.cjs scripts/night.test.cjs
node scripts/qa-engine.mjs
node scripts/qa-runtime.mjs
node scripts/qa-worker.mjs
```

Only `public/` is deployed. Netlify runs these checks and serves that folder. Source is unpacked at repository root. This release reconciles the concurrently published 2.1.0 hunt: all ten original chapters and seventeen added activities remain playable alongside the new varied adventures.

## Saved progress and privacy

The application keeps the original `wildExplorerSaveV2` and `wildExplorerSave` keys. Version 2/legacy and 2.1 names, customization, XP, completed crystals, journal and unfinished checked clues migrate without resetting progress. All ten 2.1 crystals and five-part Rainbow progress are retained. Each existing completed crystal funds one spendable camp crystal once. Camp spending does not remove collectible trophies. New outings retain lifetime XP, camp, heroes, journal and previous postcards.

Progress is stored only in this browser/device. Other open game windows refresh when progress changes; an action from an outdated window is cancelled so it cannot replace the newer adventure. The same HTTPS origin is required to retain access; previews have separate storage. JSON backups contain text, progress and photo references, not photo pixels. Optional JPEG/PNG/WebP selections are resized and re-encoded locally, removing source metadata, then stored in IndexedDB. Photos are never sent to Netlify. Download individual HTML postcards to retain their embedded photos. Clearing site data, browser eviction or changing browsers can remove local data. Photos from another browser's backup need to be added again.

GPS is opt-in, one-shot and not persisted or uploaded. No camera or microphone APIs, remote scripts, analytics, advertising, accounts or recurring AI calls are used. Read-aloud depends on available browser/device voices and may be unavailable offline.

## Offline and updates

Open online and choose **Download adventure for offline play**. The app confirms every required game/artwork file is present in the current service-worker cache. It cannot prevent the operating system or browser from later clearing storage. An installed release keeps serving its matching cached HTML until the user accepts **Update game**; progress survives the reload. Update app, worker and every JS/CSS query version together.

## Release workflow

Use a feature branch, draft pull request and Netlify Deploy Preview. Test before merging the user-approved release to `main`; production deploys are Git-backed. Never replace this project or deploy real saved-family fixtures. Keep `.netlify`, secrets and private exports out of Git. Fix production mistakes forward with another commit. Physical iPhone/Safari verification must be reported separately from automated Chromium or source tests.

See `docs/QA-3.0.md` for final release evidence and limitations.
