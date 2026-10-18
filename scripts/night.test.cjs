'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const E = require('../public/engine.js');
const clone = value => JSON.parse(JSON.stringify(value));
const fresh = () => E.normaliseExpansion(null, {});
const roundtrip = value => E.normaliseExpansion(clone(value));
const night = (setting = 'indoor', duration = 'long', difficulty = 'gentle', seed = 'night') => {
  const e = fresh();
  e.active = E.createOuting({ theme: 'halloween', setting, duration, difficulty }, [], seed);
  e.options = e.active.options;
  return E.normaliseExpansion(e);
};
const request = e => {
  const c = E.getCurrentCard(e);
  assert.ok(c);
  return { cardId: c.id, expectedChapter: c.chapter, expectedStep: c.step, challengeKey: c.challengeKey, note: 'Our friendly moon story', at: '2026-10-18T17:00:00.000Z' };
};
const complete = e => E.completeChallenge(e, request(e)).expansion;
const chapter = e => {
  while (E.getCurrentCard(e)) e = complete(e);
  return E.finishChapter(e, e.active.chapter);
};
const full = e => {
  while (!e.active.ended) e = chapter(e).expansion;
  return e;
};
const assertNight = (outing, setting, count = 5 * E.DURATIONS[outing.options.duration]) => {
  const ids = outing.deck.flat();
  assert.equal(ids.length, count);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(outing.options.theme, 'halloween');
  assert.equal(outing.options.setting, setting);
  ids.forEach((id, index) => {
    const c = E.CARD_BY_ID[id];
    assert.equal(c.theme, 'halloween');
    assert.ok(c.settings.includes(setting), `${id} cannot appear in ${setting}`);
    if (index) assert.notEqual(c.type, E.CARD_BY_ID[ids[index - 1]].type);
  });
};

test('new options are explicit, whitelisted, additive schema-one defaults', () => {
  assert.equal(E.SCHEMA, 1);
  assert.deepEqual(E.THEMES, ['daylight', 'halloween']);
  assert.deepEqual(E.NIGHT_SETTINGS, ['indoor', 'neighbourhood', 'trail']);
  for (const input of [undefined, null, {}, { theme: '__proto__', setting: 'constructor' }, { theme: 'night', setting: 'woodland' }]) {
    assert.equal(E.normaliseOptions(input).theme, 'daylight');
    assert.equal(E.normaliseOptions(input).setting, 'indoor');
  }
  for (const setting of E.NIGHT_SETTINGS) assert.equal(E.adventureKey({ theme: 'halloween', setting }), `halloween:${setting}`);
  assert.equal(E.adventureKey({ theme: 'daylight', setting: 'trail' }), 'daylight');
  assert.ok(Object.isFrozen(E.THEMES) && Object.isFrozen(E.NIGHT_SETTINGS));
});

test('45 new cards offer five categories and 25 eligible cards per night setting', () => {
  assert.equal(E.NIGHT_CARDS.length, 45);
  assert.equal(new Set(E.CARDS.map(c => c.id)).size, E.CARDS.length);
  for (const setting of E.NIGHT_SETTINGS) {
    const cards = E.NIGHT_CARDS.filter(c => c.settings.includes(setting));
    assert.equal(cards.length, 25);
    for (const type of E.TYPES) assert.equal(cards.filter(c => c.type === type).length, 5);
    assert.equal(cards.filter(c => c.settings.length === 1).length, 10);
  }
  for (const card of E.NIGHT_CARDS) {
    assert.equal(card.theme, 'halloween');
    assert.ok(card.id.startsWith('night-'));
    assert.ok(E.TYPES.includes(card.type));
    assert.match(card.alternative, /seated indoors/i);
    assert.ok(card.title && card.prompt && card.emoji && card.specialty);
    assert.ok(Object.isFrozen(card) && Object.isFrozen(card.settings));
  }
});

test('night guidance explicitly retains adult leadership, lighting and context-specific boundaries', () => {
  for (const setting of E.NIGHT_SETTINGS) {
    const c = E.getCurrentCard(night(setting));
    assert.equal(c.safety, E.NIGHT_GUIDANCE[setting]);
    assert.match(c.safety, /Grown-ups lead/);
    assert.match(c.safety, /lit/);
    assert.match(c.safety, /screen/);
  }
  assert.match(E.NIGHT_GUIDANCE.trail, /checked is open and safe after dark/);
  assert.match(E.NIGHT_GUIDANCE.trail, /stay together on the path/);
  assert.match(E.NIGHT_GUIDANCE.trail, /Never approach, shine lights at or call to wildlife/);
  assert.match(E.NIGHT_GUIDANCE.neighbourhood, /No road crossing, approaching homes or talking to strangers/);
  assert.match(E.CARD_BY_ID['night-find-torch-detail'].prompt, /grown-up.*handheld torch.*never aim a light at eyes or animals/);
  assert.match(E.CARD_BY_ID['night-indoor-find-wall'].prompt, /comfortably lit room/);
  assert.match(E.CARD_BY_ID['night-find-friendly-shadow'].prompt, /Keep the lights on/);
  for (const c of E.NIGHT_CARDS.filter(c => c.settings.length === 1 && c.settings[0] === 'trail')) assert.match(c.prompt, /open and safe after dark/);
});

test('all 48 daytime cards retain IDs, categories, specialties and eligibility after content refresh', () => {
  const originalFields = ['id', 'type', 'emoji', 'specialty', 'habitats', 'seasons'];
  const cards = E.CARDS.filter(c => c.theme === 'daylight').map(c => Object.fromEntries(originalFields.map(key => [key, c[key]])));
  assert.equal(cards.length, 48);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(cards)).digest('hex'), '896fe3c6d3dd482f50bf1d79780f1aa214d2ec8efeb77205bd0d548d944466cc');
});

test('pre-night deterministic daytime decks and IDs do not change with additive defaults', () => {
  const cases = [
    [{}, 'outing-xpgggp', [['listen-soft', 'solve-autumn', 'move-leaf'], ['find-bug', 'imagine-guardian', 'listen-team'], ['imagine-home', 'solve-sort', 'find-four-colours'], ['move-thank-you', 'find-pinecone', 'move-tree'], ['listen-ten', 'imagine-message', 'solve-team']]],
    [{ habitat: 'garden', season: 'spring', duration: 'short', difficulty: 'challenge' }, 'outing-5bfmnd', [['solve-pattern'], ['find-bug'], ['move-climb-pretend'], ['listen-breeze'], ['imagine-message']]],
    [{ habitat: 'neighbourhood', season: 'winter', duration: 'medium', difficulty: 'curious' }, 'outing-166wfgf', [['move-climb-pretend', 'find-tiny'], ['listen-winter', 'imagine-leaf-boat'], ['solve-size', 'imagine-story'], ['find-treasure', 'listen-near-far'], ['move-animal', 'solve-team']]]
  ];
  for (const [options, id, deck] of cases) {
    const outing = E.createOuting(options, [], 'legacy-v2');
    assert.equal(outing.id, id);
    assert.deepEqual(outing.deck, deck);
    assert.deepEqual(E.createOuting({ ...options, theme: 'daylight', setting: 'trail' }, [], 'legacy-v2').deck, deck);
  }
});

test('every night setting, habitat, season, length and style generates unique mode-safe decks', () => {
  for (const setting of E.NIGHT_SETTINGS) for (const habitat of E.HABITATS) for (const season of E.SEASONS) for (const duration of Object.keys(E.DURATIONS)) for (const difficulty of E.DIFFICULTIES) for (let seed = 0; seed < 6; seed++) {
    const options = { theme: 'halloween', setting, habitat, season, duration, difficulty };
    const outing = E.createOuting(options, [], seed);
    assertNight(outing, setting);
    assert.deepEqual(outing, E.createOuting(options, [], seed));
    assert.equal(new Set(outing.deck.flat().map(id => E.CARD_BY_ID[id].type)).size, 5);
  }
});

test('night swaps and repeated JSON normalization retain context, neighbours and completed records', () => {
  for (const setting of E.NIGHT_SETTINGS) for (const duration of Object.keys(E.DURATIONS)) for (let seed = 0; seed < 6; seed++) {
    let e = night(setting, duration, 'curious', seed);
    // Short chapters have one card, so complete the first chapter before swapping.
    e = chapter(e).expansion;
    const done = clone(e.active.done), rewards = clone(e.lifetime), wallet = e.wallet;
    for (let swap = 0; swap < 20; swap++) {
      const r = E.swapChallenge(e, { challengeKey: E.currentKey(e) });
      assert.equal(r.changed, true);
      assert.equal(r.xp, 0);
      assert.equal(r.crystals, 0);
      e = roundtrip(r.expansion);
      assertNight(e.active, setting);
      assert.deepEqual(e.active.done, done);
      assert.deepEqual(e.lifetime, rewards);
      assert.equal(e.wallet, wallet);
      assert.deepEqual(roundtrip(e), e);
    }
  }
});

test('full recent history never allows daylight or another setting into a night deck', () => {
  const history = E.CARDS.map(c => c.id);
  for (const setting of E.NIGHT_SETTINGS) for (let seed = 0; seed < 30; seed++) assertNight(E.createOuting({ theme: 'halloween', setting }, history, seed), setting);
});

test('normalization rejects imported cards from the wrong mode or night setting', () => {
  for (const setting of E.NIGHT_SETTINGS) {
    const e = night(setting), wrongContext = E.NIGHT_SETTINGS.find(s => s !== setting);
    e.active.deck[0][0] = 'find-treasure';
    e.active.deck[0][1] = E.NIGHT_CARDS.find(c => c.settings.length === 1 && c.settings[0] === wrongContext).id;
    e.active.done = [{ cardId: 'find-treasure', chapter: 0, step: 0, note: 'Wrong mode' }];
    const fixed = roundtrip(e);
    for (const id of fixed.active.deck.flat()) {
      assert.equal(E.CARD_BY_ID[id].theme, 'halloween');
      assert.ok(E.CARD_BY_ID[id].settings.includes(setting));
    }
    assert.equal(fixed.active.done.length, 0);
    assert.equal(fixed.wallet, 0);
  }
  const e = fresh();
  e.active.deck[0][0] = E.NIGHT_CARDS[0].id;
  assert.equal(E.CARD_BY_ID[roundtrip(e).active.deck[0][0]].theme, 'daylight');
  assert.equal(E.getCurrentCard(e), null);
});

test('older daytime saves retain intentionally broad historical deck eligibility', () => {
  const e = fresh();
  e.active.options.habitat = 'neighbourhood';
  e.active.options.season = 'winter';
  e.active.deck[0][0] = 'find-spring';
  e.active.done = [{ cardId: 'find-spring', chapter: 0, step: 0, note: 'An old spring memory', category: 'colour', at: '2026-03-01T10:00:00.000Z' }];
  for (const options of [e.options, e.active.options]) { delete options.theme; delete options.setting; }
  delete e.parkedOutings;
  const migrated = roundtrip(e);
  assert.equal(migrated.active.deck[0][0], 'find-spring');
  assert.equal(migrated.active.done[0].note, 'An old spring memory');
  assert.equal(migrated.active.options.theme, 'daylight');
  assert.deepEqual(migrated.parkedOutings, {});
  assert.deepEqual(roundtrip(migrated), migrated);
});

test('older schema-one active and postcard text, ownership and rewards survive added defaults', () => {
  let e = full(fresh());
  e = E.buyItem(e, 'leaf-cape').expansion;
  e.postcards[0].favorite = 'Our oldest story';
  e.postcards[0].photoIds = ['private-local-photo'];
  for (const options of [e.options, e.active.options, ...e.postcards.map(p => p.options)]) { delete options.theme; delete options.setting; }
  delete e.parkedOutings;
  const before = clone(e), migrated = roundtrip(e);
  assert.deepEqual(e, before);
  assert.equal(migrated.schema, 1);
  assert.equal(migrated.wallet, 2);
  assert.deepEqual(migrated.lifetime, before.lifetime);
  assert.deepEqual(migrated.owned, before.owned);
  assert.deepEqual(migrated.equipped, before.equipped);
  assert.deepEqual(migrated.active.deck, before.active.deck);
  assert.deepEqual(migrated.active.done, before.active.done);
  assert.deepEqual(migrated.postcards[0].deck, before.postcards[0].deck);
  assert.deepEqual(migrated.postcards[0].done, before.postcards[0].done);
  assert.equal(migrated.postcards[0].favorite, 'Our oldest story');
  assert.deepEqual(migrated.postcards[0].photoIds, ['private-local-photo']);
  assert.equal(migrated.postcards[0].options.theme, 'daylight');
  assert.deepEqual(roundtrip(migrated), migrated);
});

test('legacy migration retains original deck, partial checks and one-time funds', () => {
  const legacy = { index: 2, xp: 140, checks: [true, false, true] }, before = clone(legacy);
  let e = E.normaliseExpansion(null, legacy);
  assert.equal(e.active.deck[0][0], 'listen-soft');
  assert.equal(e.active.deck[2][1], 'solve-sort');
  assert.equal(e.active.step, 1);
  assert.equal(e.active.done.length, 8);
  assert.equal(e.wallet, 2);
  assert.deepEqual(e.parkedOutings, {});
  e = E.buyItem(e, 'bat-friend').expansion;
  e = E.normaliseExpansion(clone(e), legacy);
  assert.equal(e.wallet, 0);
  assert.deepEqual(e.owned, ['bat-friend']);
  assert.deepEqual(legacy, before);
});

test('switching every context restores exact deck, step, completed notes and difficulty', () => {
  let e = complete(fresh());
  const snapshots = { daylight: clone(e.active) }, lifetime = clone(e.lifetime);
  const original = clone(e);
  const first = E.switchAdventure(e, 'halloween', 'indoor', 44);
  assert.equal(first.changed, true);
  assert.deepEqual(e, original);
  e = first.expansion;
  for (const setting of E.NIGHT_SETTINGS) {
    e = E.switchAdventure(e, 'halloween', setting, 44).expansion;
    assertNight(e.active, setting, 5);
    assert.equal(e.active.options.duration, 'short');
    assert.equal(e.active.options.difficulty, 'gentle');
    e = complete(e);
    snapshots[E.adventureKey(e.options)] = clone(e.active);
  }
  const earned = clone(e.lifetime), wallet = e.wallet;
  for (let cycle = 0; cycle < 3; cycle++) for (const [key, snapshot] of Object.entries(snapshots)) {
    const [theme, setting = 'indoor'] = key.split(':');
    const switched = E.switchAdventure(e, theme, setting, 'ignored-new-seed');
    e = roundtrip(switched.expansion);
    assert.deepEqual(e.active, snapshot);
    assert.deepEqual(e.lifetime, earned);
    assert.equal(e.wallet, wallet);
    assert.equal(Object.keys(e.parkedOutings).length, 3);
    assert.equal(e.parkedOutings[key], undefined);
  }
  assert.equal(earned.challenges, lifetime.challenges + 3);
  assert.equal(earned.xp, lifetime.xp);
});

test('switching same adventure or invalid modes is a pure no-op', () => {
  const e = fresh();
  for (const [theme, setting] of [['daylight', 'indoor'], ['daylight', 'trail'], ['__proto__', 'indoor'], ['halloween', '__proto__']]) {
    const r = E.switchAdventure(e, theme, setting, 99);
    assert.equal(r.changed, false);
    assert.equal(r.xp, 0);
    assert.equal(r.crystals, 0);
    assert.deepEqual(r.expansion, e);
  }
});

test('parked outings normalize only known matching keys and reject mode-inappropriate cards', () => {
  const e = fresh(), indoor = night('indoor').active, trail = night('trail').active;
  indoor.deck[0][0] = 'find-white';
  e.parkedOutings = JSON.parse('{"__proto__":{"polluted":true},"constructor":{},"halloween:unknown":{}}');
  e.parkedOutings['halloween:indoor'] = indoor;
  e.parkedOutings['halloween:neighbourhood'] = trail;
  e.parkedOutings['halloween:trail'] = trail;
  e.parkedOutings.daylight = clone(e.active);
  const fixed = roundtrip(e);
  assert.deepEqual(Object.keys(fixed.parkedOutings), ['halloween:indoor', 'halloween:trail']);
  assert.equal(E.CARD_BY_ID[fixed.parkedOutings['halloween:indoor'].deck[0][0]].theme, 'halloween');
  assert.equal({}.polluted, undefined);
  assert.deepEqual(roundtrip(fixed), fixed);
});

test('all challenge lengths and contexts award exactly 440 XP and five crystals once', () => {
  for (const setting of E.NIGHT_SETTINGS) for (const duration of Object.keys(E.DURATIONS)) {
    let e = night(setting, duration);
    for (let index = 0; index < 5; index++) {
      assert.equal(E.finishChapter(e, index).changed, false);
      const req = request(e), done = E.completeChallenge(e, req);
      assert.equal(E.completeChallenge(done.expansion, req).changed, false);
      e = done.expansion;
      while (E.getCurrentCard(e)) e = complete(e);
      const claimed = E.finishChapter(e, index);
      assert.equal(claimed.xp, E.CHAPTER_XP[index]);
      assert.equal(claimed.crystals, 1);
      assert.equal(E.finishChapter(claimed.expansion, index).changed, false);
      e = roundtrip(claimed.expansion);
    }
    assert.equal(e.wallet, 5);
    assert.equal(e.lifetime.xp, 440);
    assert.equal(e.lifetime.crystals, 5);
    assert.equal(e.lifetime.challenges, 5 * E.DURATIONS[duration]);
    assert.equal(e.postcards.length, 1);
    assert.equal(e.postcards[0].options.theme, 'halloween');
    assert.equal(e.postcards[0].options.setting, setting);
    assertNight(e.postcards[0], setting);
    assert.equal(E.finishEarly(e).changed, false);
    const puzzle = E.getPuzzle(e), solved = E.solvePuzzle(e, puzzle.answerIds);
    assert.equal(solved.correct, true);
    assert.equal(solved.expansion.wallet, 5);
    assert.equal(solved.xp, 0);
    assert.equal(E.solvePuzzle(solved.expansion, puzzle.answerIds).changed, false);
  }
});

test('stale day completion cannot complete a night card and switching cannot mint rewards', () => {
  let e = fresh();
  const dayRequest = request(e), before = clone(e.lifetime);
  e = E.switchAdventure(e, 'halloween', 'trail', 'stars').expansion;
  assert.equal(E.completeChallenge(e, dayRequest).changed, false);
  for (let i = 0; i < 10; i++) {
    e = E.switchAdventure(e, 'daylight').expansion;
    e = E.switchAdventure(e, 'halloween', 'trail').expansion;
    assert.equal(E.finishChapter(e, 0).changed, false);
  }
  assert.deepEqual(e.lifetime, before);
  assert.equal(e.wallet, 0);
  assert.equal(e.postcards.length, 0);
});

test('ordinary actions, early finish and next outing all retain paused adventures', () => {
  let e = complete(fresh());
  const daylight = clone(e.active);
  e = E.switchAdventure(e, 'halloween', 'indoor').expansion;
  e = E.swapChallenge(e).expansion;
  e = chapter(e).expansion;
  e = chapter(e).expansion;
  e = E.buyItem(e, 'bat-friend').expansion;
  e = E.equipItem(e, 'bat-friend').expansion;
  e = E.finishEarly(e).expansion;
  assert.equal(e.postcards[0].challengeCount, 2);
  assert.equal(e.postcards[0].completedChapters, 2);
  assert.equal(e.wallet, 0);
  e = E.startNext(e, { duration: 'medium', difficulty: 'challenge' }, 'longer-night').expansion;
  assertNight(e.active, 'indoor', 10);
  assert.equal(e.active.options.difficulty, 'challenge');
  assert.deepEqual(e.parkedOutings.daylight, daylight);
  const indoor = clone(e.active);
  e = E.switchAdventure(e, 'daylight').expansion;
  assert.deepEqual(e.active, daylight);
  e = E.switchAdventure(e, 'halloween', 'indoor').expansion;
  assert.deepEqual(e.active, indoor);
  assert.equal(e.wallet, 0);
  assert.deepEqual(e.owned, ['bat-friend']);
});

test('cross-mode startNext resumes a parked unfinished adventure without overwriting it', () => {
  let e = complete(fresh());
  const daylight = clone(e.active);
  e = E.switchAdventure(e, 'halloween', 'indoor').expansion;
  e = E.finishEarly(e).expansion;
  e = E.startNext(e, { theme: 'daylight', duration: 'short' }, 'new').expansion;
  assert.deepEqual(e.active, daylight);
  assert.equal(e.parkedOutings['halloween:indoor'].ended, true);
  assert.equal(e.postcards.length, 1);
});

test('new camp items share existing crystals, preserve trophies and reject duplicate spending', () => {
  const expected = { 'moon-cape': ['gear', 3], 'bat-friend': ['companion', 2], 'pumpkin-lantern': ['camp', 4] };
  for (const [id, [slot, cost]] of Object.entries(expected)) {
    const item = E.SHOP.find(c => c.id === id);
    assert.equal(item.slot, slot);
    assert.equal(item.cost, cost);
    assert.equal(E.buyItem(fresh(), id).changed, false);
    const e = full(night('indoor', 'short'));
    const bought = E.buyItem(e, id), saved = roundtrip(bought.expansion);
    assert.equal(bought.changed, true);
    assert.equal(bought.spent, cost);
    assert.equal(saved.wallet, 5 - cost);
    assert.equal(saved.equipped[slot], id);
    assert.deepEqual(saved.owned, [id]);
    assert.equal(saved.lifetime.crystals, 5);
    assert.equal(saved.lifetime.xp, 440);
    assert.equal(saved.active.claimedChapters.length, 5);
    assert.equal(E.buyItem(saved, id).changed, false);
    assert.equal(E.buyItem(saved, id).expansion.wallet, 5 - cost);
    const switched = E.switchAdventure(saved, 'daylight').expansion;
    assert.equal(switched.equipped[slot], id);
    assert.equal(switched.wallet, 5 - cost);
  }
  const originals = ['compass', 'leaf-cape', 'explorer-lantern', 'fox-friend', 'bunting', 'cosy-tent', 'guardian-flag'];
  for (const id of originals) assert.ok(E.SHOP.some(c => c.id === id));
});


test('hands-on release preserves all 45 night card identities and eligibility', () => {
  const metadata = E.NIGHT_CARDS.map(({ id, type, theme, settings }) => ({ id, type, theme, settings }));
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(metadata)).digest('hex'), '9f0af6b12b452db6ec8eec028732dc6327b1218dd03ffd149eb605f4662267a5');
});

test('indoor crafts use real materials with adult help and practical fallbacks', () => {
  const hat = E.CARD_BY_ID['night-indoor-find-costume'];
  assert.match(hat.prompt, /scrap paper/);
  assert.match(hat.prompt, /large enough.*grown-up fits it above your eyes/);
  assert.match(hat.prompt, /Grown-ups handle any cutting; no neck ties/);
  assert.match(hat.alternative, /No paper or hat/);
  const cape = E.CARD_BY_ID['night-indoor-move-cape'];
  assert.match(cape.prompt, /tea towel.*drape it over your shoulders/);
  assert.match(cape.prompt, /Never tie or fasten it around your neck/);
  assert.match(cape.prompt, /Take it off before moving/);
  assert.match(cape.alternative, /Without either/);
  assert.match(E.CARD_BY_ID['night-indoor-imagine-palace'].prompt, /Place them side by side/);
  assert.match(E.CARD_BY_ID['night-indoor-imagine-mouse'].prompt, /fold a sheet of scrap paper/i);
  assert.match(E.CARD_BY_ID['night-indoor-solve-shadow'].prompt, /Move your hand a little nearer/);
  assert.match(E.NIGHT_GUIDANCE.indoor, /materials you already have/);
  assert.match(E.NIGHT_GUIDANCE.indoor, /No flames or climbing/);
});

test('daytime and night activities no longer offer imagination-only completion', () => {
  for (const c of E.CARDS) {
    assert.doesNotMatch(c.prompt + ' ' + c.alternative, /silently imagine|or imagine|or picture|only in your story|No costume|No real cape|pretend alternative/i, c.id);
  }
});
