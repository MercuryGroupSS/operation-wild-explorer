/* Operation Wild Explorer: dependency-free, offline expedition rules.
 * All public actions are pure: they return { expansion, changed, reason, xp,
 * crystals } and never modify their inputs. Render a card's chapter/step/id
 * into the completion button and pass those expected values back on click.
 * Names, artwork, total family XP and crystal trophies stay with app.js.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WildEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TYPES = ['Find', 'Listen', 'Move', 'Imagine', 'Solve'];
  const HABITATS = ['woodland', 'park', 'garden', 'neighbourhood'];
  const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
  const DIFFICULTIES = ['gentle', 'curious', 'challenge'];
  const CHAPTER_XP = [60, 80, 80, 100, 120];
  const DURATIONS = { short: 1, medium: 2, long: 3 };
  const clean = (value, length = 280) => typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, length) : '';
  const int = (value, min, max, fallback = min) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Math.floor(Number(value)))) : fallback;
  const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const list = value => Array.isArray(value) ? value : [];
  const unique = values => [...new Set(values)];
  const iso = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : '';
  const specialtyFor = type => type === 'Listen' ? 'listener' : type === 'Solve' || type === 'Imagine' ? 'detective' : 'scout';
  function card(id, type, title, prompt, alternative, emoji, habitats = HABITATS, seasons = SEASONS) {
    return { id, type, title, prompt, alternative, emoji, specialty: specialtyFor(type), habitats: habitats.slice(), seasons: seasons.slice() };
  }
  const CARDS = [
    card('find-treasure', 'Find', 'A treasure for our eyes', 'Spot a natural treasure from the path. Point to it and leave it exactly where it is.', 'Choose any lovely colour you can see, or imagine a sparkling pretend treasure.', '💎'),
    card('find-web', 'Find', 'A tiny silk masterpiece', 'Look for a spider web from the path. Watch without touching the web, spider or plants.', 'Imagine a web in the air and trace its shape with one finger.', '🕸️', ['woodland', 'park', 'garden']),
    card('find-hanging', 'Find', 'Something hanging', 'Spot a leaf, seed or branch hanging on a tree. Look from where you stand; do not reach, pull or climb.', 'Find any hanging shape you can see, or draw a pretend hanging leaf in the air.', '🍃', ['woodland', 'park', 'garden']),
    card('find-bug', 'Find', 'A little neighbour', 'Look for a bug from the path. Give it space, with no touching, lifting things or disturbing its home.', 'Imagine a friendly tiny bug and describe its colours.', '🐞', ['woodland', 'park', 'garden'], ['spring', 'summer', 'autumn']),
    card('find-pinecone', 'Find', 'Pinecone detective', 'See whether a pinecone is visible from the path. Leave it where it is; do not pick it up or pull one from a tree.', 'Look for any bumpy pattern, or imagine a pinecone covered in tiny scales.', '🌲', ['woodland', 'park', 'garden']),
    card('find-four-colours', 'Find', 'Four leaf colours', 'Look for four leaf colours without picking leaves. Any four colours around you count if leaves are all the same colour.', 'Point to one colour, then name or imagine three more. Your clothes count too.', '🍂', HABITATS, ['spring', 'summer', 'autumn']),
    card('find-white', 'Find', 'A splash of white', 'Find something white you can see safely, such as a cloud, a sign or your own clothing. Leave everything where it is.', 'Name something white from a pretend snowy story.', '☁️'),
    card('find-squirrel', 'Find', 'A squirrel-shaped surprise', 'If a squirrel is visible, watch quietly from far away. Never approach, feed, chase or call to it.', 'Pretend to be a still squirrel with an imaginary bushy tail. No real squirrel is needed.', '🐿️', ['woodland', 'park', 'garden']),
    card('find-round', 'Find', 'Round and wonderful', 'Point to a round shape you can see from your safe spot.', 'Make a circle with your fingers or imagine a round moon.', '⭕'),
    card('find-shadow', 'Find', 'Shadow spotting', 'While standing on safe level ground, look for a shadow near you. Keep away from roads and edges.', 'Find a dark colour, or imagine the shadow of a friendly dragon.', '🌤️'),
    card('find-tiny', 'Find', 'Tiny and mighty', 'Point to one small detail visible from the path. A mark, line or colour is enough.', 'Find a tiny detail on your own clothing.', '🔎'),
    card('find-spring', 'Find', 'A growing story', 'Look for fresh-looking green growth from the path. Leave buds and flowers untouched.', 'Spot any green colour, or imagine a new leaf opening.', '🌱', ['woodland', 'park', 'garden'], ['spring']),
    card('listen-bird', 'Listen', 'Bird-song ears', 'Pause beside a grown-up and listen for a bird sound. Stay quiet and keep your eyes open; no calls or recordings to attract birds.', 'Listen for any sound, or silently imagine a bird song.', '🐦'),
    card('listen-breeze', 'Listen', 'The breeze orchestra', 'Listen for the breeze or leaves moving while you stay safely with your team.', 'Listen to a gentle breath or imagine soft wind in a story.', '🍃'),
    card('listen-ten', 'Listen', 'Ten quiet seconds', 'Listen with your eyes open while a grown-up counts ten quiet seconds. What did you notice?', 'Try five seconds, or describe a sound you remember.', '👂'),
    card('listen-near-far', 'Listen', 'Near sound, far sound', 'From the same safe spot, notice a nearby sound and a faraway sound. No need to move toward either one.', 'Listen to your own breathing, then imagine a faraway sound.', '🎵'),
    card('listen-footsteps', 'Listen', 'Our gentle footsteps', 'If your grown-up says the level path is clear, listen to a few ordinary slow footsteps.', 'Stay seated or still and gently tap one finger on your own hand.', '👣'),
    card('listen-soft', 'Listen', 'A very soft sound', 'Stay still beside your grown-up and notice the quietest sound you can hear.', 'Remember a soft sound from home, or choose to enjoy the quiet.', '🤫'),
    card('listen-rhythm', 'Listen', 'A tiny rhythm', 'Listen for a sound with a rhythm. Keep listening from your safe spot without copying or calling to wildlife.', 'Gently tap a slow rhythm on your own knee.', '🥁'),
    card('listen-team', 'Listen', 'Our family whisper', 'One explorer whispers their favourite colour. The others listen and point to something like it.', 'Let someone point to a colour for everyone to look at together.', '💬'),
    card('listen-winter', 'Listen', 'The quiet season', 'Notice the sounds around you from a dry, safe path. Stay clear of icy areas and keep warm with your grown-ups.', 'Describe a cosy sound you remember from indoors.', '❄️', HABITATS, ['winter']),
    card('move-tree', 'Move', 'Tall as a tree', 'On safe level ground, stretch gently tall like a tree with your feet planted. No climbing or balancing on anything.', 'Stay seated and raise your hands only as far as comfortable.', '🌳'),
    card('move-climb-pretend', 'Move', 'Our pretend mountain', 'Imagine climbing a mountain while staying on the ground. Slowly reach your arms up with both feet planted; do not climb real rocks or trees.', 'Stay seated and make a tiny mountain shape with your hands.', '⛰️'),
    card('move-animal', 'Move', 'Animal actor', 'Choose a pretend animal pose on safe level ground. Stay still or move gently beside your grown-up, with no animal calls near wildlife.', 'Make a quiet animal face while seated, or describe your pretend animal.', '🦊'),
    card('move-float', 'Move', 'A tiny floating pose', 'Optional: seated on safe level ground beside a grown-up, briefly lift your toes if comfortable. No standing balance, ledges, climbing or jumping; no camera needed.', 'Keep both feet comfortably down and pretend your hands are floating leaves.', '🪶'),
    card('move-bench', 'Move', 'Our cosy rest stop', 'Let a grown-up choose a safe bench or resting spot. Rest together; a family photo is optional and never needed to complete the clue.', 'Pause comfortably where your grown-up says it is safe. A tiny seated stretch counts.', '🪑'),
    card('move-leaf', 'Move', 'Little leaf hands', 'Stay planted on safe level ground and gently wiggle your hands like leaves in a breeze.', 'Wiggle one finger, or imagine a leaf dancing.', '🌿'),
    card('move-thank-you', 'Move', 'A thank-you wave', 'Give nature a gentle thank-you wave while staying with your team.', 'Smile, nod or say a quiet thank-you instead.', '👋'),
    card('move-shape', 'Move', 'Make a branch shape', 'On safe level ground, make a gentle Y shape with your arms. Keep your feet planted and leave room around you.', 'Make a Y with two fingers, or draw it in the air while seated.', '🙌'),
    card('move-team', 'Move', 'Our team signal', 'Invent a gentle hand signal that means “we explore together.” Stay still beside your grown-up.', 'Choose a smile or a spoken word as your team signal.', '🤝'),
    card('imagine-acorn', 'Imagine', 'The acorn’s funny face', 'Imagine an acorn with a funny face and a little hat. What would it say? You do not need to find, collect or draw on a real acorn.', 'Give an imaginary pebble or leaf a friendly face.', '🌰'),
    card('imagine-cloud', 'Imagine', 'Cloud creature', 'From a safe still spot, imagine a cloud is a friendly creature. Look away from the sun.', 'Invent a cloud shape in your mind if the sky is hidden or clear.', '☁️'),
    card('imagine-guardian', 'Imagine', 'A friendly guardian', 'Imagine a kind guardian looking after this place. What is their name and special kindness?', 'Choose one kind thing your family can do for nature today.', '🧙'),
    card('imagine-leaf-boat', 'Imagine', 'A make-believe leaf boat', 'Imagine a leaf is a tiny boat in a story. Who is its captain? Stay on the path and keep away from real water.', 'Make a pretend boat shape with your hands; no leaf or water is needed.', '⛵'),
    card('imagine-story', 'Imagine', 'Three-word adventure', 'Each explorer adds a word to a silly, friendly story about something you noticed.', 'One person tells a tiny story and everyone can nod or point.', '📖'),
    card('imagine-home', 'Imagine', 'A tiny pretend home', 'Imagine a cosy home for a make-believe creature. Describe it without moving stones, sticks or living things.', 'Draw the shape in the air or describe a door in your favourite colour.', '🏡'),
    card('imagine-superpower', 'Imagine', 'Nature superpower', 'Choose a pretend superpower inspired by a colour, shape or sound you noticed.', 'Pick “super kindness” or “super listening” for the whole team.', '✨'),
    card('imagine-message', 'Imagine', 'Nature’s postcard', 'If this place could send your family a kind message, what would it say?', 'Say one thing you liked about being together today.', '💌'),
    card('imagine-summer', 'Imagine', 'A sunbeam story', 'Imagine a friendly sunbeam visiting the colours around you. Stay in your grown-up’s chosen safe spot; never look at the sun.', 'Tell a story about an imaginary golden ribbon.', '🌞', HABITATS, ['summer']),
    card('solve-colours', 'Solve', 'The colour clue', 'Pick two colours you can see. What is the same or different about them?', 'Name one favourite colour or point to something you like.', '🎨'),
    card('solve-pattern', 'Solve', 'Pattern detectives', 'Find a repeating shape or line you can see from the path. Point without touching.', 'Make a simple finger pattern together: one, two, one, two.', '🔍'),
    card('solve-count', 'Solve', 'Count our clues', 'Count up to five things visible from your safe spot. Leaves, signs, colours or your own fingers count.', 'Count up to three fingers together, or point to one thing.', '🖐️'),
    card('solve-size', 'Solve', 'Big and little', 'Point to one big shape and one little shape from where you are. How are they different?', 'Make a big circle and a tiny circle with your hands.', '🔵'),
    card('solve-memory', 'Solve', 'Remember our wonder', 'Remember something your family noticed earlier. Give one clue so the others can guess it.', 'Point to something nearby and say its colour together.', '🧩'),
    card('solve-letter', 'Solve', 'Nature’s alphabet', 'Spot a shape that looks like a letter, such as a Y-shaped branch. Keep looking from the path.', 'Make the first letter of your name with a finger in the air.', '🔠'),
    card('solve-sort', 'Solve', 'Sort with your eyes', 'Point to two things that look alike and one that looks different. Leave them all where they are.', 'Choose two matching fingers and your thumb for a pretend sorting game.', '🟢'),
    card('solve-team', 'Solve', 'Five-hero puzzle', 'How many explorers are in your team? Count everyone together and think of one way you helped each other.', 'Hold up fingers for your team or share a favourite team moment.', '⭐'),
    card('solve-autumn', 'Solve', 'Autumn colour puzzle', 'Look for two different leaf colours from the path. Which one reminds you of something cosy?', 'Use any two colours, or imagine a red and a gold leaf. No leaves need collecting.', '🍁', ['woodland', 'park', 'garden'], ['autumn'])
  ];
  const CARD_BY_ID = Object.assign(Object.create(null), Object.fromEntries(CARDS.map(c => [c.id, c])));
  const SHOP = [
    { id: 'compass', name: 'Star compass', emoji: '🧭', cost: 2, slot: 'gear', description: 'A pretend compass for your family’s story.' },
    { id: 'leaf-cape', name: 'Leaf cape', emoji: '🍃', cost: 3, slot: 'gear', description: 'A storybook cape for the whole team.' },
    { id: 'explorer-lantern', name: 'Firefly lantern', emoji: '🏮', cost: 4, slot: 'gear', description: 'A pretend glow to decorate camp.' },
    { id: 'fox-friend', name: 'Friendly fox', emoji: '🦊', cost: 3, slot: 'companion', description: 'A make-believe woodland friend for camp. Real wildlife stays wild.' },
    { id: 'bunting', name: 'Rainbow bunting', emoji: '🎏', cost: 2, slot: 'camp', description: 'Bright flags for your make-believe camp.' },
    { id: 'cosy-tent', name: 'Cosy story tent', emoji: '⛺', cost: 4, slot: 'camp', description: 'A colourful camp decoration.' },
    { id: 'guardian-flag', name: 'Guardian flag', emoji: '🚩', cost: 5, slot: 'camp', description: 'Celebrate your family’s adventures.' }
  ].map(item => ({ ...item, title: item.name }));
  const SHOP_BY_ID = Object.assign(Object.create(null), Object.fromEntries(SHOP.map(item => [item.id, item])));
  const BADGES = [
    { id: 'scout', name: 'Super Scout', emoji: '🔎', specialty: 'scout', threshold: 3 },
    { id: 'listener', name: 'Kind Listener', emoji: '👂', specialty: 'listener', threshold: 3 },
    { id: 'detective', name: 'Nature Detective', emoji: '🧩', specialty: 'detective', threshold: 3 }
  ];
  function normaliseOptions(raw) {
    raw = object(raw);
    const habitat = ({ forest: 'woodland', neighborhood: 'neighbourhood', backyard: 'garden' })[raw.habitat] || raw.habitat;
    const season = raw.season === 'fall' ? 'autumn' : raw.season;
    const difficulty = ({ easy: 'gentle', medium: 'curious', hard: 'challenge' })[raw.difficulty] || raw.difficulty;
    return { habitat: HABITATS.includes(habitat) ? habitat : 'woodland', season: SEASONS.includes(season) ? season : 'autumn', duration: Object.hasOwn(DURATIONS, raw.duration) ? raw.duration : 'long', difficulty: DIFFICULTIES.includes(difficulty) ? difficulty : 'gentle' };
  }
  function hash(value) {
    let h = 2166136261;
    for (const char of String(value)) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
    return h >>> 0;
  }
  function random(seed) {
    let a = hash(seed);
    return function () { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function shuffle(values, rng) {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  }
  function eligible(options) { return CARDS.filter(c => c.habitats.includes(options.habitat) && c.seasons.includes(options.season)); }
  function chooseCard(options, rng, used, recentIds, previousType, nextType, preferredType) {
    const pool = eligible(options).filter(c => c.type !== previousType && c.type !== nextType);
    const recent = new Map(recentIds.map((id, i) => [id, i]));
    const candidates = pool.filter(c => !used.has(c.id));
    const usable = candidates.length ? candidates : pool;
    const preferred = preferredType ? usable.filter(c => c.type === preferredType) : usable;
    const choices = preferred.length ? preferred : usable;
    const fresh = choices.filter(c => !recent.has(c.id));
    const ranked = shuffle(fresh.length ? fresh : choices, rng);
    if (!fresh.length) ranked.sort((a, b) => (recent.get(a.id) ?? -1) - (recent.get(b.id) ?? -1));
    // A context-specific card is a small bonus, never a species requirement.
    if (fresh.length) ranked.sort((a, b) => (b.habitats.length < HABITATS.length ? 1 : 0) + (b.seasons.length < SEASONS.length ? 1 : 0) - (a.habitats.length < HABITATS.length ? 1 : 0) - (a.seasons.length < SEASONS.length ? 1 : 0));
    return ranked[0] || CARDS[0];
  }
  function createOuting(rawOptions, recentIds = [], seed = 1) {
    const options = normaliseOptions(rawOptions), seedText = clean(String(seed), 100) || '1';
    const rng = random(seedText + JSON.stringify(options)), flat = [], used = new Set();
    let previousType = null, cycle = [];
    const recent = list(recentIds).filter(id => CARD_BY_ID[id]).slice(-90);
    for (let i = 0; i < 5 * DURATIONS[options.duration]; i++) {
      if (!cycle.length) { cycle = shuffle(TYPES, rng); if (cycle[0] === previousType) [cycle[0], cycle[1]] = [cycle[1], cycle[0]]; }
      const type = cycle.shift(), chosen = chooseCard(options, rng, used, recent, previousType, null, type);
      flat.push(chosen.id); used.add(chosen.id); previousType = chosen.type;
    }
    const size = DURATIONS[options.duration];
    return { id: 'outing-' + hash(seedText + JSON.stringify(options) + recent.join(',')).toString(36), options, seed: seedText, deck: Array.from({ length: 5 }, (_, i) => flat.slice(i * size, (i + 1) * size)), chapter: 0, step: 0, done: [], claimedChapters: [], ended: false, endedEarly: false, puzzleSolved: false, swaps: 0 };
  }
  function record(raw, deck) {
    raw = object(raw);
    const chapter = int(raw.chapter, 0, 4), step = int(raw.step, 0, 2);
    const cardId = clean(raw.cardId || raw.id, 80), c = CARD_BY_ID[cardId];
    if (!c || deck[chapter]?.[step] !== cardId) return null;
    return { cardId, chapter, step, note: clean(raw.note), category: clean(raw.category, 30), at: iso(raw.at), specialty: c.specialty, migrated: raw.migrated === true };
  }
  function doneAt(active, chapter, step) { return active.done.some(r => r.chapter === chapter && r.step === step); }
  function firstUnchecked(active) {
    if (active.chapter >= 5) return 0;
    const row = active.deck[active.chapter];
    const index = row.findIndex((_, i) => !doneAt(active, active.chapter, i));
    return index === -1 ? row.length : index;
  }
  function normaliseActive(raw, fallbackOptions) {
    raw = object(raw);
    const options = normaliseOptions(raw.options || fallbackOptions);
    const active = createOuting(options, [], raw.seed || 1);
    active.id = clean(raw.id, 120) || active.id;
    active.deck = active.deck.map((row, chapter) => row.map((fallback, step) => CARD_BY_ID[raw.deck?.[chapter]?.[step]] ? raw.deck[chapter][step] : fallback));
    active.done = [];
    list(raw.done).slice(0, 15).forEach(value => { const r = record(value, active.deck); if (r && !doneAt(active, r.chapter, r.step)) active.done.push(r); });
    active.claimedChapters = [];
    for (let i = 0; i < 5; i++) { if (list(raw.claimedChapters).includes(i)) active.claimedChapters.push(i); else break; }
    // Earlier claimed chapters are known finished, including legacy saves.
    active.claimedChapters.forEach(chapter => active.deck[chapter].forEach((cardId, step) => { if (!doneAt(active, chapter, step)) active.done.push({ cardId, chapter, step, note: '', category: '', at: '', specialty: CARD_BY_ID[cardId].specialty, migrated: true }); }));
    active.chapter = active.claimedChapters.length;
    active.done = active.done.filter(r => r.chapter <= active.chapter);
    active.step = firstUnchecked(active);
    active.ended = raw.ended === true || active.chapter === 5;
    active.endedEarly = active.ended && active.chapter < 5;
    active.puzzleSolved = raw.puzzleSolved === true;
    active.swaps = int(raw.swaps, 0, 100000);
    return active;
  }
  function normaliseHero(raw) {
    if (typeof raw === 'string') return clean(raw, 24);
    raw = object(raw); const look = object(raw.look || raw.looks);
    return { name: clean(raw.name, 24), role: clean(raw.role, 40), specialty: ['scout', 'listener', 'detective'].includes(raw.specialty) ? raw.specialty : 'scout', look: { skin: int(look.skin, 0, 3), hair: int(look.hair, 0, 3), colour: int(look.colour, 0, 4), long: look.long === true } };
  }
  function discoveryView(r) { const c = CARD_BY_ID[r.cardId]; return { ...r, id: r.cardId, title: c.title, type: c.type, emoji: c.emoji }; }
  function normalisePostcard(raw) {
    raw = object(raw);
    const a = normaliseActive({ ...raw, ended: true }, raw.options);
    return { id: clean(raw.id, 120) || a.id, date: iso(raw.date || raw.createdAt), createdAt: iso(raw.createdAt || raw.date), park: clean(raw.park, 100), options: a.options, deck: a.deck, done: a.done, discoveries: a.done.map(discoveryView), claimedChapters: a.claimedChapters, completedChapters: a.claimedChapters.length, challengeCount: a.done.length, endedEarly: a.claimedChapters.length < 5, puzzleSolved: raw.puzzleSolved === true, xp: a.claimedChapters.reduce((sum, i) => sum + CHAPTER_XP[i], 0), crystals: a.claimedChapters.length, favorite: clean(raw.favorite), badges: unique(list(raw.badges).map(b => clean(b, 80)).filter(Boolean)).slice(0, 20), heroes: list(raw.heroes).slice(0, 5).map(normaliseHero), photoIds: unique(list(raw.photoIds).map(p => clean(p, 100)).filter(Boolean)).slice(0, 12) };
  }
  function snapshot(expansion) {
    const a = expansion.active;
    if (expansion.postcards.some(p => p.id === a.id)) return;
    const date = [...a.done].reverse().find(r => r.at)?.at || '';
    expansion.postcards.push(normalisePostcard({ ...a, date, createdAt: date, badges: badges(expansion).map(b => b.id) }));
    // Keep every saved outing; never silently prune private memories.
    expansion.lifetime.outings += 1;
  }
  function normaliseExpansion(raw, legacyState = {}) {
    raw = object(raw); legacyState = object(legacyState);
    if (raw.schema !== 1) {
      const active = createOuting({}, [], 'legacy-v2'), completed = int(legacyState.index, 0, 5);
      active.id = 'legacy-v2';
      active.claimedChapters = Array.from({ length: completed }, (_, i) => i);
      for (let chapter = 0; chapter < 5; chapter++) active.deck[chapter].forEach((cardId, step) => { if (chapter < completed || chapter === completed && legacyState.checks?.[step] === true) active.done.push({ cardId, chapter, step, note: '', category: '', at: '', specialty: CARD_BY_ID[cardId].specialty, migrated: true }); });
      active.chapter = completed; active.step = firstUnchecked(active); active.ended = completed === 5;
      const e = { schema: 1, options: active.options, active, recentIds: active.done.map(r => r.cardId), wallet: completed, owned: [], equipped: { gear: null, camp: null, companion: null }, postcards: [], lifetime: { xp: int(legacyState.xp, 0, 10000000), crystals: completed, challenges: active.done.length, outings: 0, specialties: { scout: 0, listener: 0, detective: 0 } }, legacyFunded: true, sequence: 0 };
      active.done.forEach(r => e.lifetime.specialties[r.specialty]++);
      if (active.ended) snapshot(e);
      return e;
    }
    const options = normaliseOptions(raw.options), active = normaliseActive(raw.active, options), owned = unique(list(raw.owned).filter(id => SHOP_BY_ID[id]));
    const lifetime = object(raw.lifetime), specialties = object(lifetime.specialties);
    const e = { schema: 1, options: active.options, active, recentIds: list(raw.recentIds || raw.history?.recentIds).filter(id => CARD_BY_ID[id]).slice(-90), wallet: int(raw.wallet, 0, 1000000), owned, equipped: { gear: null, camp: null, companion: null }, postcards: [], lifetime: { xp: int(lifetime.xp, 0, 10000000), crystals: int(lifetime.crystals, 0, 1000000), challenges: int(lifetime.challenges, 0, 10000000), outings: int(lifetime.outings, 0, 1000000), specialties: { scout: int(specialties.scout, 0, 10000000), listener: int(specialties.listener, 0, 10000000), detective: int(specialties.detective, 0, 10000000) } }, legacyFunded: true, sequence: int(raw.sequence, 0, 1000000) };
    for (const slot of ['gear', 'camp', 'companion']) { const id = raw.equipped?.[slot]; if (owned.includes(id) && SHOP_BY_ID[id].slot === slot) e.equipped[slot] = id; }
    list(raw.postcards).forEach(p => { const postcard = normalisePostcard(p); if (!e.postcards.some(saved => saved.id === postcard.id)) e.postcards.push(postcard); });
    return e;
  }
  function currentKey(expansion) { const a = expansion.active; return a.id + ':' + a.chapter + ':' + a.step + ':' + a.swaps; }
  function getCurrentCard(expansion) {
    const a = expansion?.active;
    if (!a || a.ended || a.chapter >= 5) return null;
    const c = CARD_BY_ID[a.deck[a.chapter]?.[a.step]];
    if (!c) return null;
    const extra = a.options.difficulty === 'curious' ? ' If you like, share one extra detail you noticed.' : a.options.difficulty === 'challenge' ? ' If you like, explain one clue or invent a second idea for the team.' : '';
    return { ...c, prompt: c.prompt + extra, chapter: a.chapter, step: a.step, challengeKey: currentKey(expansion) };
  }
  function isChapterReady(expansion) {
    const a = expansion?.active;
    return !!a && !a.ended && a.chapter < 5 && a.deck[a.chapter].every((_, step) => doneAt(a, a.chapter, step));
  }
  const result = (expansion, changed, reason = '', extra = {}) => ({ expansion, changed, reason, xp: 0, crystals: 0, ...extra });
  function completeChallenge(expansion, discovery = {}) {
    const e = normaliseExpansion(expansion), a = e.active, c = getCurrentCard(e);
    discovery = object(discovery);
    if (!c) return result(e, false, 'No unfinished challenge.');
    if (discovery.cardId && discovery.cardId !== c.id || discovery.expectedChapter != null && discovery.expectedChapter !== a.chapter || discovery.expectedStep != null && discovery.expectedStep !== a.step || discovery.challengeKey && discovery.challengeKey !== currentKey(e)) return result(e, false, 'That challenge has already changed.');
    const r = { cardId: c.id, chapter: a.chapter, step: a.step, note: clean(discovery.note), category: clean(discovery.category, 30), at: iso(discovery.at), specialty: c.specialty, migrated: false };
    a.done.push(r); e.recentIds = [...e.recentIds, c.id].slice(-90); e.lifetime.challenges++; e.lifetime.specialties[c.specialty]++; a.step = firstUnchecked(a);
    return result(e, true, '', { card: c, discovery: discoveryView(r), chapterReady: isChapterReady(e) });
  }
  function swapChallenge(expansion, expected = {}) {
    const e = normaliseExpansion(expansion), a = e.active, c = getCurrentCard(e);
    if (!c) return result(e, false, 'No unfinished challenge.');
    if (expected.cardId && expected.cardId !== c.id || expected.challengeKey && expected.challengeKey !== currentKey(e)) return result(e, false, 'That challenge has already changed.');
    const flat = a.deck.flat(), position = a.chapter * DURATIONS[a.options.duration] + a.step;
    const previousType = CARD_BY_ID[flat[position - 1]]?.type, nextType = CARD_BY_ID[flat[position + 1]]?.type;
    const used = new Set(flat), recent = [...e.recentIds, c.id];
    const newCard = chooseCard(a.options, random(a.seed + ':swap:' + a.swaps), used, recent, previousType, nextType);
    if (newCard.id === c.id) return result(e, false, 'Try the safe alternative on this card.');
    a.deck[a.chapter][a.step] = newCard.id; a.swaps++; e.recentIds = recent.slice(-90);
    return result(e, true, '', { card: getCurrentCard(e) });
  }
  function finishChapter(expansion, expectedChapter) {
    const e = normaliseExpansion(expansion), a = e.active;
    if (expectedChapter != null && expectedChapter !== a.chapter) return result(e, false, 'That chapter has already changed.');
    if (!isChapterReady(e) || a.claimedChapters.includes(a.chapter)) return result(e, false, 'Finish this chapter’s clues first.');
    const chapter = a.chapter, xp = CHAPTER_XP[chapter];
    a.claimedChapters.push(chapter); e.wallet++; e.lifetime.crystals++; e.lifetime.xp += xp; a.chapter++; a.step = firstUnchecked(a);
    if (a.chapter === 5) { a.ended = true; snapshot(e); }
    return result(e, true, '', { xp, crystals: 1, chapter, ended: a.ended });
  }
  function finishEarly(expansion) {
    const e = normaliseExpansion(expansion);
    if (e.active.ended) return result(e, false, 'This outing is already saved.');
    e.active.ended = true; e.active.endedEarly = true; snapshot(e);
    return result(e, true, '', { ended: true });
  }
  function buyItem(expansion, id) {
    const e = normaliseExpansion(expansion), item = SHOP_BY_ID[id];
    if (!item) return result(e, false, 'Unknown camp item.');
    if (e.owned.includes(id)) return result(e, false, 'Your team already owns this.');
    if (e.wallet < item.cost) return result(e, false, 'Earn a few more camp tokens first.');
    e.wallet -= item.cost; e.owned.push(id); e.equipped[item.slot] = id;
    return result(e, true, '', { item, spent: item.cost });
  }
  function equipItem(expansion, id) {
    const e = normaliseExpansion(expansion), item = SHOP_BY_ID[id];
    if (!item || !e.owned.includes(id)) return result(e, false, 'Collect this camp item first.');
    if (e.equipped[item.slot] === id) return result(e, false, 'Already displayed at camp.');
    e.equipped[item.slot] = id;
    return result(e, true, '', { item });
  }
  function startNext(expansion, options, seed = 1) {
    const e = normaliseExpansion(expansion);
    if (!e.active.ended) return result(e, false, 'Finish or save this outing before starting another.');
    e.sequence++; e.options = normaliseOptions(options || e.options); e.active = createOuting(e.options, e.recentIds, String(seed) + ':' + e.sequence);
    return result(e, true);
  }
  function getPuzzle(expansion) {
    const a = expansion.active, seen = unique(a.done.filter(r => !r.migrated).map(r => r.cardId));
    // Legacy-only completed outings still get a gentle memory puzzle.
    const ids = seen.length >= 3 ? seen : unique(a.done.map(r => r.cardId));
    if (ids.length < 3 || a.claimedChapters.length < 5) return { available: false, prompt: 'Complete all five chapters to reveal your discovery puzzle.', choices: [], answerIds: [] };
    const answerIds = [ids[0], ids[Math.floor((ids.length - 1) / 2)], ids[ids.length - 1]];
    return { available: true, prompt: 'Put these discoveries in the order your family completed them: first, middle, then last.', choices: shuffle(answerIds.map(id => ({ ...CARD_BY_ID[id] })), random(a.id + ':puzzle')), answerIds, solved: a.puzzleSolved };
  }
  function solvePuzzle(expansion, orderedIds) {
    const e = normaliseExpansion(expansion), puzzle = getPuzzle(e);
    if (!puzzle.available) return result(e, false, 'Collect all five chapter crystals first.');
    if (e.active.puzzleSolved) return result(e, false, 'Your family already solved this puzzle.', { correct: true });
    if (!Array.isArray(orderedIds) || orderedIds.length !== 3 || orderedIds.some((id, i) => id !== puzzle.answerIds[i])) return result(e, false, 'Try again together. Think about the order you discovered them.', { correct: false });
    e.active.puzzleSolved = true;
    e.postcards.forEach(p => { if (p.id === e.active.id) p.puzzleSolved = true; });
    return result(e, true, '', { correct: true });
  }
  function badges(expansion) { return BADGES.filter(b => (expansion.lifetime?.specialties?.[b.specialty] || 0) >= b.threshold).map(b => ({ ...b })); }
  // Freezing public content keeps accidental UI changes out of future outings.
  function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  return freeze({ SCHEMA: 1, CARDS, CARD_BY_ID, SHOP, BADGES, TYPES, HABITATS, SEASONS, DIFFICULTIES, DURATIONS, CHAPTER_XP, normaliseOptions, createOuting, normaliseExpansion, getCurrentCard, currentKey, isChapterReady, completeChallenge, swapChallenge, finishChapter, finishEarly, buyItem, equipItem, startNext, getPuzzle, solvePuzzle, badges });
});
