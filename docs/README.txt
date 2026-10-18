OPERATION WILD EXPLORER — MOBILE EDITION 2.0.0
================================================
A complete static game folder. No build step, API keys, paid AI service,
GitHub repository or Supabase database is needed for this version.

UPLOAD TO YOUR EXISTING NETLIFY PROJECT
1. Extract the ZIP. Open the operation-wild-explorer folder.
2. In Netlify, open your EXISTING operation-wild-explorer project.
3. Open Deploys. Drop this whole folder into that project's manual
   deploy area. The folder contains index.html at its top level.
4. Wait for the production deploy to finish, then open your usual
   HTTPS site address and refresh. Do not create another project.
5. For later releases, an in-game Update game banner may appear.

IPHONE / SAFARI
Open the published site in Safari. Use Share > Add to Home Screen.
Enable Open as Web App when shown, then Add. Launch the leaf icon.
This is the standalone, browser-bar-free experience, not an App Store app.
Portrait is the primary layout. Landscape and tablet widths also adapt.
There is no automatic iPhone installation or browser fullscreen hack.

HOW TO PLAY
- Play: illustrated forest friends, your five heroes and the next quest.
- Quest: one mission at a time, three big tappable clues, then a crystal.
  "Can't find it?" swaps to a safe alternative without losing progress.
  The speaker reads the quest on demand using browser/device speech.
- Heroes: two grown-ups and three children. Edit names, roles, outfit,
  skin and hair; choose the pretend quest leader. A grown-up leads the
  actual walk. Avatars are fictional and are not portraits of your family.
- Treasure: five collectible crystals, total family XP and a discovery
  journal. Journal ideas are offline story prompts, not AI recognition.
- Trail: a clearly labelled STORY MAP, plus an editable park name and
  optional one-time GPS readings. The story map is NOT a real route.
- Settings: optional gentle sounds, reduced animation, install help,
  progress export/restore, game update check and confirmed adventure reset.

SAVES / UPDATES
- Version 2 imports the original "wildExplorerSave" localStorage format
  on the same origin and in the same browser storage. The original site's
  names, roles, XP, earned crystals and checked clues are retained.
- New saves use "wildExplorerSaveV2" and mirror the original known fields
  to "wildExplorerSave". A malformed save is normalised where possible.
- Installing as a Home Screen web app or changing browser/origin may use
  a separate storage area. Settings > Export progress backup and Restore
  a progress backup let you move game progress with a JSON file.
- Backups include names, park, journal and progress; store them privately.
- Clearing website data removes saves. Saving errors are shown in-game.
- A new adventure resets mission XP/crystals but keeps heroes and journal.
- Rewards are granted once per mission, after all three clues are checked.
  Five missions award 60 + 80 + 80 + 100 + 120 = 440 family XP.

OFFLINE
Open the deployed app with internet and let the service worker finish
installing before the hike. Settings shows whether an active offline
cache is present. The game, graphics and journal work offline afterward,
subject to the browser retaining its storage. GPS and speech availability
still depend on the device. No external images, fonts or scripts are used.

PRIVACY / SAFETY / LIMITATIONS
No camera, microphone, tracking SDK, analytics or account connection.
GPS is requested only after tapping Use my GPS. It is a single reading,
kept in memory and never saved or uploaded. Clear removes the reading;
refresh also removes it. GPS does not choose missions or verify safe paths.
Hosting itself has standard hosting request logs. No child/family data is
sent by this game's application code.

The park name personalises the story; quests are pre-written. There is
no live AI, autonomous park research, plant/animal identification, real
trail navigation, cross-device sync, or multiplayer networking.

Stay together on marked paths. Avoid edges, water, wildlife and closed
trails. No touching/tasting unknown plants, mushrooms or animals. Leave
nature in place. Clue alternatives mean no one has to take a risk to win.
Stop walking before handing the phone to a young child.

UPDATING THE SOURCE LATER
Edit app.js / styles.css / assets. For each release increment VERSION in
app.js and sw.js, as well as both ?v= references in index.html and sw.js.
Use new versioned asset filenames when artwork changes. Upload the whole
folder. The new service worker waits for Update game on subsequent releases.
Do not include credentials in any public game files. Keep .netlify ignored.

REFERENCE DOCUMENTATION
Netlify manual updates:
https://docs.netlify.com/deploy/create-deploys/#drag-and-drop
Apple Home Screen web apps:
https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios
Geolocation permission and HTTPS:
https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition

BUILD NOTES
The forest-friends banner is cropped from the approved illustration in
this conversation. Its decorative characters are storybook friends; the
five editable family heroes are separate lightweight vector characters.
No real family photos, coordinates or names are embedded in the package.
