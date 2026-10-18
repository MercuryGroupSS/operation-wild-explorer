# Operation Wild Explorer

A bright, mobile-first family nature RPG for two adults and three young children. Five customizable heroes share lifetime XP, five story chapters and a family base camp. Deterministic, bundled content runs without accounts, APIs, telemetry or runtime dependencies.

Production: https://operation-wild-explorer.netlify.app
Netlify project: `142205d8-6800-49d7-996f-5e0ee5094ee7`

## Release 3.0.0

- A varied Find / Listen / Move / Imagine / Solve deck; adjacent categories differ and recent cards are avoided when possible.
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
node --test scripts/engine.test.cjs scripts/postcards.test.cjs
```

Only `public/` is deployed. Netlify runs these checks and serves that folder. The original ZIP is retained as a source baseline; its contents are now correctly unpacked at repository root. Production previously pointed at a ZIP-only commit and returned 404.

## Saved progress and privacy

The application keeps the original `wildExplorerSaveV2` and `wildExplorerSave` keys. Version 2/legacy names, customization, XP, completed crystals, journal and unfinished checked clues migrate without resetting progress. Each existing completed crystal funds one spendable camp crystal once. Camp spending does not remove collectible trophies. New outings retain lifetime XP, camp, heroes, journal and previous postcards.

Progress is stored only in this browser/device. The same HTTPS origin is required to retain access; previews have separate storage. JSON backups contain text, progress and photo references, not photo pixels. Optional JPEG/PNG/WebP selections are resized and re-encoded locally, removing source metadata, then stored in IndexedDB. Photos are never sent to Netlify. Download individual HTML postcards to retain their embedded photos. Clearing site data, browser eviction or changing browsers can remove local data. Photos from another browser's backup need to be added again.

GPS is opt-in, one-shot and not persisted or uploaded. No camera or microphone APIs, remote scripts, analytics, advertising, accounts or recurring AI calls are used. Read-aloud depends on available browser/device voices and may be unavailable offline.

## Offline and updates

Open online and choose **Download adventure for offline play**. The app confirms every required game/artwork file is present in the current service-worker cache. It cannot prevent the operating system or browser from later clearing storage. An installed release keeps serving its matching cached HTML until the user accepts **Update game**; progress survives the reload. Update app, worker and every JS/CSS query version together.

## Release workflow

Use a feature branch, draft pull request and Netlify Deploy Preview. Test before merging the user-approved release to `main`; production deploys are Git-backed. Never replace this project or deploy real saved-family fixtures. Keep `.netlify`, secrets and private exports out of Git. Fix production mistakes forward with another commit. Physical iPhone/Safari verification must be reported separately from automated Chromium or source tests.

See `docs/QA-3.0.md` for final release evidence and limitations.
