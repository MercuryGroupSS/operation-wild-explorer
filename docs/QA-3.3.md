# 3.3.0 playable gear and treasure-quest presentation QA

Date: 2026-10-18. Synthetic fixtures only. No private family saves are bundled.

## Purchased gear

All ten existing items have an obvious, repeatable Use or Wear & play control. Ownership, prices, currency, equipment slots and reward logic are unchanged. Buying an owned item is rejected without a second charge. Gear games never award extra XP or crystals.

- Star compass: interactive practice dial; optional real phone heading through an explicit Enable phone compass button. `requestPermission(true)` is called directly from that tap when supported. Otherwise the page waits for genuine absolute orientation. Relative alpha is never represented as north.
- Live compass deliberately requires a flat, screen-up, portrait phone. Finite Safari `webkitCompassHeading` or `absolute === true` alpha is accepted; invalid/uncalibrated, tilted and landscape readings are hidden. Direction is approximate, never suitable for route finding or safety.
- No sensor support, denied permission, errors, seven-second no-data timeout and stale readings leave the clearly labeled manual practice dial usable. Sensors and delayed callbacks are invalidated on closing/replacing the sheet, manual mode, hiding the page, page exit or changed saved state. Raw headings/accuracy never enter saves, backups or network calls.
- Both purchased lanterns turn the game screen warm orange with a steady 20–100% glow control, readable high-contrast surfaces and visible off controls. This changes screen colours, not hardware flashlight or device brightness. It remains on while reading quests or using other gear. Keep room lighting on and bring a separate real light outdoors.
- Capes dress the team and offer three gentle hand-shape games. Companions offer colour, listening, rhythm and kindness play. Bunting has a repeating colour pattern, the tent has a three-part storytelling game, and the flag has a family hand-signal game. All are optional, seated/still activities.

## Save migration and privacy

The schema and original `wildExplorerSaveV2` / `wildExplorerSave` keys are retained. The additive `tools` field defaults to lantern off, 60% glow, no selected lantern; only owned lantern IDs can enable the effect. Existing names, IDs, customizations, Halloween costumes, classic progress, each paused adventure, journal, postcards, XP and crystal ownership are retained. Lantern preference survives reload, export/import, modes and new outings. No compass permission or heading is persisted.

No accounts, dependencies, paid services, telemetry or new server storage. Existing GPS behavior stays independent. No location is requested by the compass.

## Automated gear coverage

- Static syntax/assets/cache/save-key check and classic compatibility check.
- Ten pure compass-helper unit tests, combined with the existing 66 unit tests.
- Existing 32 app-runtime groups plus six purchased-gear groups: duplicate purchase guard; all ten item flows; glow persistence and ownership validation; manual/unsupported/denied sensor; genuine north/relative/invalid orientation; timeout, stale reading and pending permission cleanup; roster/story preservation.
- Nine engine groups with 193,037 assertions.
- Six service-worker groups now derive the required asset count from the release CORE list, covering all versioned presentation scripts/styles and offline/update matching.

## Device limits

Real iPhone/Safari headings, native permission UI, magnetic accuracy, installed Home Screen/PWA behavior and physical-device outdoor use have not been tested. DOM stubs and synthetic orientation events are not physical-device testing. The app clearly labels unavailable sensor fallback and approximate readings.

## Sources for compass behavior

- [W3C Device Orientation and Motion](https://www.w3.org/TR/orientation-event/)
- [Apple DeviceOrientationEvent](https://developer.apple.com/documentation/webkitjs/deviceorientationevent)
- [Apple compass heading](https://developer.apple.com/documentation/webkitjs/deviceorientationevent/1804777-webkitcompassheading)
- [Apple compass accuracy](https://developer.apple.com/documentation/webkitjs/deviceorientationevent/1804769-webkitcompassaccuracy)
- [Chrome absolute versus relative orientation](https://developer.chrome.com/blog/device-orientation-changes/)
- [W3C Screen Orientation](https://www.w3.org/TR/screen-orientation/)

## Integrated verification and browser evidence

- 100 unit tests, 46 app-runtime groups, 5 Bella/app groups, 9 engine groups (193,037 assertions), and 7 service-worker groups pass. Narration additionally covers all 478 fixed readQuest paths and verifies 299 MP3 files by size, SHA-256, decode, finite samples, non-silence and clipping checks.
- Cloud Chromium on the actual Deploy Preview exercised the live app in true 320×740, 390×844 and 844×390 iframe viewports, plus doubled computed text. The browser ignored requested popup dimensions, so no phone-device emulation claim is made. No horizontal overflow in the checked home, compass, map, reward, night and gear sheets; large-text map and story-tent layouts remained readable.
- Observed steady orange lantern effect, on/off restoration of the night palette, persistent glow after reload and mode changes, and unchanged six-player synthetic roster. Quantitative minimum body/helper contrast across the full background gradient: 9.04/6.71 at 20%, 7.77/5.77 at 60%, 7.03/5.22 at 100%.
- Compass manual turn changed 0° N to 45° NE with the practice label. With no genuine browser sensor, seven-second timeout returned an explicit unavailable explanation and usable practice dial. No actual heading was claimed. A rapid purchase double-tap exposed click-through to Enable; a 600ms fresh-sheet permission guard was added with a regression test.
- Opened locked/current/earned map nodes, followed current node to quest, completed all three discoveries, double-clicked claim, and verified exactly +60 XP and +1 crystal. Reload preserved that progress, the private synthetic discovery note and earned marker; locked inspection changed no rewards.
- Crystal SVG has a running six-second float; switching Animations off removes the CSS animation. Optional sound setting and volume controls are reachable. Audio lifecycle/envelopes are automated-tested; acoustic quality is not inferred from screenshots.
- Bought a compass from 12 synthetic crystals with a double-click: wallet became 10, one ownership entry. Existing-item activity playback never charges additional crystals or grants XP.
- No real family data, physical device or outdoor navigation was used. Native iPhone compass, Safari media unlock, installed Home Screen update, and physical sound playback remain explicit device-test limits.

See `QUEST-MAGIC-QA.md` and narration documentation for focused implementation/test details. Final Bella browser playback checks are recorded after preview integration.
