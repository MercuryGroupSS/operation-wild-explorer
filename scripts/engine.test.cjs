'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../public/engine.js');
const fresh = legacy => E.normaliseExpansion(null, legacy || {});
const clone = value => JSON.parse(JSON.stringify(value));
const complete = (e, note = '') => {
  const card = E.getCurrentCard(e);
  assert.ok(card);
  return E.completeChallenge(e, { cardId: card.id, expectedChapter: card.chapter, expectedStep: card.step, challengeKey: card.challengeKey, note, at: '2026-10-18T10:00:00.000Z' });
};
const clearChapter = e => {
  let next = e;
  while (E.getCurrentCard(next)) next = complete(next).expansion;
  return E.finishChapter(next, next.active.chapter);
};
const full = options => {
  let e = fresh();
  if (options) e = E.startNext(E.finishEarly(e).expansion, options, 12).expansion;
  for (let i = 0; i < 5; i++) e = clearChapter(e).expansion;
  return e;
};

test('UMD installs a browser global without storage, DOM, network or dependencies', () => {
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/engine.js'), 'utf8'), context);
  assert.equal(context.WildEngine.SCHEMA, 1);
  assert.equal(context.WildEngine.createOuting({}).deck.length, 5);
});

test('all content has stable IDs, five types, safe alternative, context and specialty', () => {
  assert.ok(E.CARDS.length >= 45);
  assert.equal(new Set(E.CARDS.map(c => c.id)).size, E.CARDS.length);
  for (const card of E.CARDS) {
    assert.ok(E.TYPES.includes(card.type));
    for (const key of ['title', 'prompt', 'alternative', 'emoji']) assert.ok(card[key]);
    assert.ok(['scout', 'listener', 'detective'].includes(card.specialty));
    assert.ok(card.habitats.length && card.seasons.length);
    assert.ok(Object.isFrozen(card));
  }
});

test('required family activities have explicit safe fallbacks', () => {
  const requirements = {
    'find-treasure': /leave it exactly where/,
    'find-web': /without touching/,
    'find-hanging': /do not reach, pull or climb/,
    'imagine-acorn': /do not need to find, collect/,
    'listen-bird': /no calls or recordings/,
    'move-animal': /no animal calls near wildlife/,
    'find-bug': /no touching/,
    'find-pinecone': /do not pick it up/,
    'move-float': /seated on safe level ground/,
    'find-four-colours': /Any four colours/,
    'find-white': /something white/,
    'move-bench': /photo is optional/,
    'find-squirrel': /far away/,
    'move-climb-pretend': /do not climb real rocks or trees/
  };
  for (const [id, pattern] of Object.entries(requirements)) assert.match(E.CARD_BY_ID[id].prompt, pattern);
});

test('options normalize aliases, invalid values and durations safely', () => {
  assert.deepEqual(E.normaliseOptions({ habitat: 'forest', season: 'fall', difficulty: 'hard', duration: 'medium' }), { habitat: 'woodland', season: 'autumn', difficulty: 'challenge', duration: 'medium' });
  assert.equal(E.normaliseOptions({ duration: '__proto__' }).duration, 'long');
  assert.equal(E.normaliseOptions(null).duration, 'long');
});

test('generation is deterministic, defaults long and changes with seed/options', () => {
  const first = E.createOuting({}, [], 'sunshine');
  assert.deepEqual(first, E.createOuting({}, [], 'sunshine'));
  assert.equal(first.deck.flat().length, 15);
  assert.notDeepEqual(first.deck, E.createOuting({}, [], 'rainbow').deck);
  for (const [duration, perChapter] of Object.entries(E.DURATIONS)) {
    const outing = E.createOuting({ duration });
    assert.equal(outing.deck.length, 5);
    assert.ok(outing.deck.every(row => row.length === perChapter));
  }
});

test('all habitat/season/duration/difficulty combinations have unique cards and no adjacent categories', () => {
  for (const habitat of E.HABITATS) for (const season of E.SEASONS) for (const duration of Object.keys(E.DURATIONS)) for (const difficulty of E.DIFFICULTIES) for (let seed = 0; seed < 12; seed++) {
    const outing = E.createOuting({ habitat, season, duration, difficulty }, [], seed), ids = outing.deck.flat();
    assert.equal(new Set(ids).size, ids.length);
    ids.forEach((id, i) => {
      const c = E.CARD_BY_ID[id];
      assert.ok(c.habitats.includes(habitat));
      assert.ok(c.seasons.includes(season));
      if (i) assert.notEqual(c.type, E.CARD_BY_ID[ids[i - 1]].type);
    });
  }
});

test('a second long outing avoids recent cards when fresh category choices exist', () => {
  const previous = E.createOuting({}, [], 1).deck.flat();
  const next = E.createOuting({}, previous, 2).deck.flat();
  assert.ok(next.every(id => !previous.includes(id)));
});

test('exhausted recent history still generates varied, valid cards', () => {
  const ids = E.CARDS.map(c => c.id), outing = E.createOuting({}, ids, 3);
  assert.equal(new Set(outing.deck.flat()).size, 15);
  assert.equal(outing.deck.length, 5);
});

test('migration preserves noncontiguous checks and does not mutate legacy state', () => {
  const legacy = { index: 2, xp: 140, checks: [true, false, true], names: ['A'], looks: [{ skin: 2 }], journal: [{ note: 'saved' }] }, before = clone(legacy);
  let e = fresh(legacy);
  assert.equal(e.active.chapter, 2);
  assert.equal(e.active.step, 1);
  assert.equal(e.active.done.length, 8);
  assert.equal(e.wallet, 2);
  assert.equal(e.lifetime.xp, 140);
  assert.deepEqual(legacy, before);
  e = complete(e).expansion;
  assert.equal(e.active.step, 3);
  assert.equal(E.isChapterReady(e), true);
  assert.equal(E.finishChapter(e, 2).xp, 80);
});

test('legacy funds once and normalization never refunds spent tokens', () => {
  let e = fresh({ index: 5, xp: 440 });
  assert.equal(e.wallet, 5);
  assert.equal(e.postcards.length, 1);
  e = E.buyItem(e, 'compass').expansion;
  assert.equal(e.wallet, 3);
  e = E.normaliseExpansion(clone(e), { index: 5, xp: 440 });
  assert.equal(e.wallet, 3);
  assert.deepEqual(e.owned, ['compass']);
  assert.equal(e.lifetime.xp, 440);
  assert.equal(e.lifetime.outings, 1);
});

test('a completed legacy save gets a postcard, and partial saves do not fabricate completion', () => {
  const e = fresh({ index: 5, checks: [true, true, true], xp: 440 });
  assert.equal(e.active.ended, true);
  assert.equal(e.postcards[0].completedChapters, 5);
  assert.equal(e.postcards[0].challengeCount, 15);
  assert.equal(fresh({ index: 0 }).postcards.length, 0);
});

test('challenge actions are pure and stale repeated completion cannot advance another card', () => {
  const e = fresh(), before = clone(e), card = E.getCurrentCard(e);
  const request = { cardId: card.id, expectedChapter: card.chapter, expectedStep: card.step, challengeKey: card.challengeKey, note: 'green leaf' };
  const first = E.completeChallenge(e, request), second = E.completeChallenge(first.expansion, request);
  assert.deepEqual(e, before);
  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.equal(second.expansion.active.done.length, 1);
  assert.equal(second.expansion.lifetime.challenges, 1);
  assert.equal(first.xp, 0);
  assert.equal(first.expansion.wallet, 0);
});

test('chapter rewards require all clues and are granted once, including stale event', () => {
  const e = fresh();
  assert.equal(E.finishChapter(e, 0).changed, false);
  let done = e;
  for (let i = 0; i < 3; i++) done = complete(done).expansion;
  const first = E.finishChapter(done, 0), again = E.finishChapter(first.expansion, 0);
  assert.equal(first.xp, 60);
  assert.equal(first.crystals, 1);
  assert.equal(first.expansion.wallet, 1);
  assert.equal(first.expansion.active.chapter, 1);
  assert.equal(again.changed, false);
  assert.equal(again.expansion.lifetime.xp, 60);
  assert.equal(again.expansion.wallet, 1);
});

test('swap does not award anything, change completed slots or repeat adjacent category', () => {
  let e = complete(fresh()).expansion;
  const completedCard = e.active.done[0].cardId, originalKey = E.currentKey(e);
  for (let i = 0; i < 20; i++) {
    const swapped = E.swapChallenge(e);
    assert.equal(swapped.changed, true);
    e = swapped.expansion;
    assert.equal(e.active.deck[0][0], completedCard);
    assert.equal(e.active.done.length, 1);
    assert.equal(e.wallet, 0);
    assert.equal(e.lifetime.xp, 0);
    const flat = e.active.deck.flat();
    for (let j = 1; j < flat.length; j++) assert.notEqual(E.CARD_BY_ID[flat[j]].type, E.CARD_BY_ID[flat[j - 1]].type);
  }
  assert.equal(E.swapChallenge(e, { challengeKey: originalKey }).changed, false);
});

test('difficulty changes displayed prompt without creating species or movement requirements', () => {
  const e = fresh();
  e.active.options.difficulty = 'curious';
  assert.match(E.getCurrentCard(e).prompt, /extra detail/);
  e.active.options.difficulty = 'challenge';
  assert.match(E.getCurrentCard(e).prompt, /explain one clue/);
});

test('full long outing awards exactly 440 XP, five tokens, one postcard and badges', () => {
  const e = full();
  assert.equal(e.lifetime.xp, 440);
  assert.equal(e.lifetime.crystals, 5);
  assert.equal(e.wallet, 5);
  assert.equal(e.active.ended, true);
  assert.equal(e.active.done.length, 15);
  assert.equal(e.postcards.length, 1);
  assert.equal(e.postcards[0].endedEarly, false);
  assert.equal(e.postcards[0].discoveries.length, 15);
  assert.equal(E.badges(e).length, 3);
  assert.equal(E.finishChapter(e, 4).changed, false);
  assert.equal(E.finishEarly(e).changed, false);
});

test('short and medium outings grant the same chapter rewards without mandatory extra effort', () => {
  for (const duration of ['short', 'medium']) {
    const e = full({ duration });
    assert.equal(e.lifetime.xp, 440);
    assert.equal(e.wallet, 5);
    assert.equal(e.active.done.length, 5 * E.DURATIONS[duration]);
    assert.equal(e.postcards.at(-1).challengeCount, e.active.done.length);
  }
});

test('finish early keeps completed and partial discoveries without awarding unfinished crystal', () => {
  let e = clearChapter(fresh()).expansion;
  e = complete(e, 'Our lovely find').expansion;
  const ended = E.finishEarly(e);
  assert.equal(ended.changed, true);
  assert.equal(ended.expansion.wallet, 1);
  assert.equal(ended.expansion.lifetime.xp, 60);
  const postcard = ended.expansion.postcards[0];
  assert.equal(postcard.endedEarly, true);
  assert.equal(postcard.completedChapters, 1);
  assert.equal(postcard.challengeCount, 4);
  assert.equal(postcard.discoveries.at(-1).note, 'Our lovely find');
  assert.equal(E.completeChallenge(ended.expansion, {}).changed, false);
  assert.equal(E.finishEarly(ended.expansion).changed, false);
});

test('camp purchase requires earned funds and never double-spends or loses trophies', () => {
  assert.equal(E.buyItem(fresh(), 'compass').changed, false);
  const e = full(), bought = E.buyItem(e, 'compass');
  assert.equal(bought.expansion.wallet, 3);
  assert.equal(e.wallet, 5);
  assert.equal(bought.expansion.active.claimedChapters.length, 5);
  assert.equal(bought.expansion.lifetime.crystals, 5);
  assert.equal(E.buyItem(bought.expansion, 'compass').changed, false);
  assert.equal(E.buyItem(bought.expansion, 'compass').expansion.wallet, 3);
  const fox = E.buyItem(bought.expansion, 'fox-friend');
  assert.equal(fox.expansion.wallet, 0);
  assert.equal(fox.expansion.equipped.companion, 'fox-friend');
  assert.equal(E.buyItem(fox.expansion, 'leaf-cape').changed, false);
  assert.equal(E.equipItem(fox.expansion, 'leaf-cape').changed, false);
});

test('next outing keeps lifetime progress, owned camp items and postcards', () => {
  assert.equal(E.startNext(fresh(), {}, 1).changed, false);
  let e = E.buyItem(full(), 'compass').expansion;
  const priorIDs = e.active.deck.flat();
  const next = E.startNext(e, { duration: 'short', habitat: 'garden' }, 'next');
  assert.equal(next.changed, true);
  e = next.expansion;
  assert.equal(e.active.chapter, 0);
  assert.equal(e.active.done.length, 0);
  assert.equal(e.active.deck.flat().length, 5);
  assert.equal(e.lifetime.xp, 440);
  assert.equal(e.wallet, 3);
  assert.equal(e.equipped.gear, 'compass');
  assert.equal(e.postcards.length, 1);
  assert.ok(e.active.deck.flat().every(id => !priorIDs.includes(id)));
});

test('puzzle uses actual discovered card order and remains available after finale', () => {
  const e = full(), puzzle = E.getPuzzle(e);
  assert.equal(puzzle.available, true);
  assert.equal(puzzle.answerIds.length, 3);
  const ids = e.active.done.map(r => r.cardId);
  assert.deepEqual(puzzle.answerIds, [ids[0], ids[7], ids[14]]);
  const wrong = E.solvePuzzle(e, puzzle.answerIds.slice().reverse());
  assert.equal(wrong.correct, false);
  assert.equal(wrong.changed, false);
  const solved = E.solvePuzzle(e, puzzle.answerIds);
  assert.equal(solved.correct, true);
  assert.equal(solved.expansion.active.puzzleSolved, true);
  assert.equal(solved.expansion.postcards[0].puzzleSolved, true);
  assert.equal(solved.expansion.wallet, 5);
  assert.equal(solved.xp, 0);
  assert.equal(E.solvePuzzle(solved.expansion, puzzle.answerIds).changed, false);
});

test('postcard favorite, park, heroes, dates and bounded photo IDs survive roundtrip', () => {
  const e = full();
  Object.assign(e.postcards[0], { park: 'Test park', favorite: 'Our green leaf', photoIds: ['local-photo-1', 'local-photo-2'], heroes: [{ name: 'Test hero', role: 'ranger', specialty: 'scout', look: { skin: 2, hair: 1, colour: 4, long: true } }], date: '2026-10-18T10:00:00.000Z' });
  const roundtrip = E.normaliseExpansion(clone(e));
  assert.equal(roundtrip.postcards[0].favorite, 'Our green leaf');
  assert.equal(roundtrip.postcards[0].park, 'Test park');
  assert.deepEqual(roundtrip.postcards[0].photoIds, ['local-photo-1', 'local-photo-2']);
  assert.equal(roundtrip.postcards[0].heroes[0].look.colour, 4);
  assert.deepEqual(E.normaliseExpansion(clone(roundtrip)), roundtrip);
});

test('malformed imports cannot create negative funds, invalid purchases, duplicate records or prototype card IDs', () => {
  const e = fresh();
  e.wallet = -999;
  e.owned = ['__proto__', 'compass', 'compass', 'constructor'];
  e.equipped.gear = 'constructor';
  e.active.deck[0][0] = '__proto__';
  e.active.done = [{ cardId: 'constructor', chapter: 0, step: 0 }];
  const normalized = E.normaliseExpansion(e);
  assert.equal(normalized.wallet, 0);
  assert.deepEqual(normalized.owned, ['compass']);
  assert.equal(normalized.equipped.gear, null);
  assert.notEqual(normalized.active.deck[0][0], '__proto__');
  assert.equal(normalized.active.done.length, 0);
  assert.equal(E.buyItem(normalized, '__proto__').changed, false);
});

test('every API action accepts serialised state and returns serialisable, stable schema', () => {
  let e = fresh({ index: 1, xp: 60, checks: [false, true, false] });
  for (let i = 0; i < 2; i++) e = complete(E.normaliseExpansion(clone(e))).expansion;
  e = E.finishChapter(e, 1).expansion;
  e = E.buyItem(e, 'bunting').expansion;
  e = E.finishEarly(e).expansion;
  e = E.startNext(e, { duration: 'medium', season: 'winter' }, 11).expansion;
  assert.deepEqual(E.normaliseExpansion(clone(e)), e);
  assert.equal(e.wallet, 0);
  assert.equal(e.lifetime.xp, 140);
});

test('more than sixty outings retain older postcard text and photo references', () => {
  let e = E.normaliseExpansion(null, {});
  e = E.finishEarly(e).expansion;
  e.postcards[0].favorite = 'Our oldest memory';
  e.postcards[0].photoIds = ['photo-oldest'];
  for (let i = 0; i < 61; i++) {
    e = E.startNext(e, {duration:'short'}, 'archive-'+i).expansion;
    e = E.finishEarly(e).expansion;
  }
  e = E.normaliseExpansion(JSON.parse(JSON.stringify(e)));
  assert.equal(e.postcards.length, 62);
  assert.equal(e.postcards[0].favorite, 'Our oldest memory');
  assert.deepEqual(e.postcards[0].photoIds, ['photo-oldest']);
});
