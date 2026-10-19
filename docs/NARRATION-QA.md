# Bella narration: implementation and verification

## Selected voice

The family selected the second audition, stock Kokoro `af_bella`, on 18 October
2026. The game uses the same 0.9 speaking speed, CPU fp32 model, 24 kHz mono,
uniform −2 dB gain and libmp3lame quality-2 encoding. There are no pitch changes,
paid services, accounts, voice cloning, runtime model downloads or AI requests.

All content is the game's bundled public text. Names, location, journal entries,
postcards and selected photos are never narration inputs. The local generator
uses the already approved and cached Kokoro installation. Rebuilding requires
that developer environment; the deployed game has no synthesis dependencies.

## Files and coverage

- `narration-content.js` derives fixed text from the existing adventure/classic
  content. Changes to game text must regenerate the corresponding recording.
- `narration-manifest.js` maps text to SHA-256 text keys, immutable MP3 paths,
  file hashes, byte counts and durations.
- `narration.js` handles playback and the opt-in offline pack.
- `narration-worker.js` serves the separate pack cache, including byte ranges.
- `assets/narration/NOTICE.txt` preserves official provenance and attribution.
  The adjacent Apache-2.0 license is copied from the official implementation.

The release contains 299 deduplicated clips totaling 26,590,804 bytes, displayed
as **26.6 MB** before downloading. Total audio is 2,951.175 seconds (49.2 minutes).
Shared difficulty/safety lines and separate alternatives avoid generating every
combination as a full recording. The tests cover 478 actual fixed read-aloud
paths: all 93 cards, all three difficulties, each supported night setting, all
10 classic missions and clue variants, crystal-ready and completed states.

Manifest fingerprint:
`08cddd711eab324d9e9631b772731f9ca8507f508451ca390902c71905141b48`

## Playback and offline behavior

- No autoplay. The initial `Audio.play()` is called synchronously from the tap;
  later segments reuse that same media element for browser gesture policies.
- Tap the speaker again to stop. Tab/sheet changes, challenge swaps, updated
  saves, hiding, page exit and game update cancel active speech and stale events.
- Starting speech stops crystal chimes; chimes are suppressed during speech.
  Phone volume controls narration, independently of the optional chime slider.
- Missing/unavailable recordings use a local English device voice only when
  available, with an explicit “Device voice” label. Otherwise the game explains
  that a grown-up can read the card. Browser gesture denial asks for a new tap.
- The normal adventure cache contains the small narration code/manifest and
  attribution, never the full MP3 pack. Settings offers a separate, visible-size
  download with progress and pause. Partial downloads can resume.
- Downloaded files are verified by size and SHA-256 when Web Crypto is available.
  The cache uses content-hashed files and survives ordinary game-version cleanup.
  Safari-style byte ranges are served from complete cached files. Missing files
  request the network without automatically storing a large pack.
- Cache denial does not prevent online playback. Quota/download failures show
  useful messages; failed final verification never claims offline readiness.
  Browser/OS eviction can still remove downloaded data.

## Verification performed

`node --test scripts/narration.test.cjs scripts/narration-app.test.mjs`

All 16 groups pass: fixed-content coverage, manifests/assets, one-element queue,
repeat/stop/stale-event protection, fallback and gesture denial, opt-in download,
pause/resume/hash checks, range responses, cache denial, and actual app hooks.
The app-specific groups reuse synthetic DOM stubs, with no private family save.

`python3 scripts/verify-narration-audio.py`

All 299 MP3s decode and match their expected SHA-256, bytes and durations. Every
waveform is finite and non-silent, with no full-scale clipping. Maximum decoded
peak is 0.871534; minimum decoded RMS is 0.047248. The machine-readable report is
`narration-audio-validation.json`. No WAVs or synthesis model files are deployed.

`node scripts/check.mjs` also passes syntax, asset and release/cache validation.
The release lead owns final aggregate checks, deployed-file verification and
real browser QA, including offline/update lifecycle.

## Explicit limits

Technical waveform checks are not listening, speech-transcription or
pronunciation review. The audition was selected by the user; no claim is made
that all game clips were auditioned. Mock gesture/range tests do not establish
physical iPhone/Safari playback. Target-device checks should cover initial tap,
segment continuation, interruption, device fallback and offline replay.
