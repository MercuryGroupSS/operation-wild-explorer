# 3.2.0 hands-on activities, players and costumes QA

Date: 2026-10-18. Synthetic fixtures only; no family data or photos are deployed.

## Scope

- Review the 45 Halloween and 48 daytime cards, original hunt activities, discovery-journal suggestions and activity helper text. Replace imagination-only completion with making, noticing, comparing, experimenting or a real family action. Fantasy characters, plot and virtual rewards remain.
- Indoor crafts use available paper, cloth, cushions or books with grown-up help. Material-free seated options remain available. Outdoor play never requires craft supplies, collecting natural objects or approaching people/homes/roads/wildlife.
- Keep all card IDs, category values, context/season/habitat eligibility, classic clue positions, reward logic, save keys and schema. The creative category is displayed as “Make & tell.” No dependencies, APIs, permissions, uploads or site changes.
- Advance application, service worker and all cache query versions together to 3.2.0. Existing installations receive the ordinary user-accepted update flow; no storage clearing.

## Content review completed

- Independent review covered all 48 daytime cards and alternatives, all 45 Halloween cards and alternatives, all 96 classic clue variants and the journal discovery suggestions.
- No blocking safety issues. Fantasy that remains is either story/reward language or accompanies a concrete action. Craft alternatives have no-material options; adult cutting help, untied short fabric, clear faces, no flames/climbing, path boundaries and untouched wildlife remain explicit.
- All 93 card IDs, categories, theme/context/season/habitat eligibility and specialties remain compatible. Classic mission order, task/variant dimensions and rewards match the previous release.
- Content-stage unit tests: 66 passed. Classic compatibility passed. The final combined player/costume checks are recorded below after integration.

## Player and costume verification

Combined automated checks pass: syntax/assets/cache versions, classic compatibility, 66 unit tests, 32 app-runtime integration groups, nine engine groups with 193,037 assertions and six mocked service-worker groups. Runtime additions cover more-than-five normalization, adding/cancelling/duplicate submission, the 24-player UI limit, extra-player editing/rotation, mode-specific outfits, larger imports and complete postcard rosters.

Independent additional checks passed with 1–128 normalized players, stable/deduplicated IDs, 37-player edit/import/export/postcards, 11-player leader rotation and all day/night/classic avatar surfaces. These checks use DOM stubs; preview browser observations and production verification follow below.

A browser-discovered stale-window save bug was fixed before release. Independent review and ten additional runtime groups cover lifecycle saves, current-storage refresh, stale reward/edit cancellation, malformed changed saves, deliberate restores, delayed import/photo dialogs and queued close events.

## Limits

DOM-stub checks do not prove layout or device behavior. No physical iPhone/Safari, disconnected-network startup, installed PWA update acceptance or real photo/GPS permission test is claimed for this content release unless specifically recorded below.

## Browser preview observations

Real cloud Chromium pop-up windows were measured at 320 × 740 and 390 × 844 portrait, and 844 × 390 landscape. These are browser viewports, not physical phones. Synthetic teams only.

- Five default heroes, add/cancel, required-name validation, adult/child preview, extra-player customization and automatic costumes were exercised with up to eight players. All five main sections fit without horizontal overflow at the ordinary text size in all three viewports.
- Halloween entry correctly required the grown-up readiness check. Every player received the selected wizard, ghost, pumpkin or bat outfit. Daytime and classic modes restored the saved daylight appearance for all eight players.
- A real challenge completion and claim awarded 60 XP and one crystal, advanced the story and rotated the eighth leader back to the first. The next wizard-hat card and expanded hands-on alternatives displayed correctly.
- The browser reported the game and artwork cache checked on the preview origin. This is not a disconnected-network or installed-PWA test.
- A 200% computed-font-size stress test exposed a header overflow; the corrected brand wraps while keeping Settings visible. All five sections then fit the 320-pixel browser viewport. This authored stress test is not a claim about a physical phone’s text-size setting.
- Final fresh-preview two-window test passed: a sixth adult ghost was retained, changing the adventure in one window dismissed the other window’s stale editor, and both displayed 60 XP / one crystal. Reloading both windows preserved the same progress and all six players.
- Final 320-pixel player dialog at 200% text (38px heading) had no document or internal dialog/form overflow; portrait and details wrapped into a readable column.
- Final tested application preview: commit `b1114af787a39b7835d8656e4df84def285e5f02`, Netlify deploy `6ad52496f189cf79be108a92`. The following release commit removes only the temporary browser-test harness and completes this QA record.
