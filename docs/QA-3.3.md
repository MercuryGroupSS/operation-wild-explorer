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

Final map/crystal and browser evidence is recorded after integration below.
