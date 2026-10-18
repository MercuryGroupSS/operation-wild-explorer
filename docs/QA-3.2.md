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

Combined automated checks pass: syntax/assets/cache versions, classic compatibility, 66 unit tests, 22 app-runtime integration groups, nine engine groups with 193,037 assertions and six mocked service-worker groups. Runtime additions cover more-than-five normalization, adding/cancelling/duplicate submission, the 24-player UI limit, extra-player editing/rotation, mode-specific outfits, larger imports and complete postcard rosters.

Independent additional checks passed with 1–128 normalized players, stable/deduplicated IDs, 37-player edit/import/export/postcards, 11-player leader rotation and all day/night/classic avatar surfaces. These checks use DOM stubs; preview browser observations and production verification follow below.

## Limits

DOM-stub checks do not prove layout or device behavior. No physical iPhone/Safari, disconnected-network startup, installed PWA update acceptance or real photo/GPS permission test is claimed for this content release unless specifically recorded below.
