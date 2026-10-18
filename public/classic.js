/* Classic ten-crystal hunt, preserved from the approved 2.1.0 release.
 * All actions are pure and never alter XP, wallet, expedition or hero state.
 * The app applies a successful claim's reward once and persists result.state.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WildClassic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MISSIONS = [
    {id:'emerald',title:'The Emerald Crystal',short:'Forest colours',icon:'leaf',colour:'#36b879',light:'#8ff2ac',dark:'#117459',xp:60,gem:'💚 Emerald Crystal',
      story:'Our first crystal is sleeping! Three forest colours will wake it up. Look with your eyes and point from the path.',
      tasks:[['Spot something green','Spot a green leaf on a tree','Point to any colour you can see'],['Spot yellow or orange','Look for a yellow or orange leaf','Find something lighter than a tree trunk'],['Spot something brown','Look for a brown tree trunk','Find a darker colour in nature']],
      symbols:['🍃','🍂','🪵'],celebrate:'Your colour-finding magic woke up the Emerald Crystal!'},
    {id:'stone',title:'The Ancient Stone Kingdom',short:'Stone shapes',icon:'stone',colour:'#9874d6',light:'#d4b8ff',dark:'#684697',xp:80,gem:'💜 Stone Crystal',
      story:'A gentle stone giant has a riddle. Find shapes and patterns you can see safely from the path. No picking up rocks or climbing!',
      tasks:[['Spot a rock with a pattern','Find a patterned tree trunk','Look for something with stripes or spots'],['Find a round-looking stone','Find a round shape in nature','Make a pretend round stone with your hands'],['Point to a rock bigger than your shoe','Find a tree trunk wider than your shoe','Make a big shape with your arms']],
      symbols:['🪨','⭕','👟'],celebrate:'You solved the stone giant’s riddle. The Stone Crystal is yours!'},
    {id:'sound',title:'The Whispering Woodland',short:'Forest sounds',icon:'bird',colour:'#eaba31',light:'#fff096',dark:'#a27812',xp:80,gem:'💛 Sound Crystal',
      story:'Shhh… the forest has a message. Stand safely beside a grown-up, use your listening ears, and keep your eyes open.',
      tasks:[['Listen for a bird call','Listen for any quiet outdoor sound','Silently imagine a gentle bird sound'],['Listen for rustling leaves','Listen to the breeze','Listen to your own gentle footsteps'],['Listen quietly for 10 seconds','Count to five together in whispers','Name one sound you heard today']],
      symbols:['🐦','🍃','👂'],celebrate:'Your super listening unlocked the shimmering Sound Crystal!'},
    {id:'sky',title:'The Escarpment Lookout',short:'Treetop wonders',icon:'tree',colour:'#329dcd',light:'#97eaff',dark:'#2469a0',xp:100,gem:'💙 Sky Crystal',
      story:'Our lookout is right here on the safe path! Look for tall trees and funny branch shapes. No stairs, edges, or climbing needed.',
      tasks:[['Spot a tree taller than a house','Find the tallest tree you can see','Stretch up tall like a tree'],['Find interesting tree bark','Find a tree with two colours','Look for a bumpy pattern in nature'],['Spot a branch shaped like a letter','Find a branch that makes a Y','Make a Y with your arms']],
      symbols:['🌳','🔍','🙌'],celebrate:'Your wonderful noticing brought the Sky Crystal back to life!'},
    {id:'guardian',title:'The Guardian’s Final Spell',short:'Our magic finale',icon:'sparkles',colour:'#ed967b',light:'#ffdf9e',dark:'#b75c8d',xp:120,gem:'🌈 Guardian Crystal',
      story:'One final crystal needs all five heroes! Share your favourite discoveries and give the forest a friendly thank-you.',
      tasks:[['Everyone shares a favourite find','Everyone points to something they like','Each explorer chooses a favourite colour'],['Count five trees together','Count five leaves without picking them','Hold up five fingers for your five heroes'],['Give the forest a thank-you wave','Give your team a gentle high-five','Say a quiet thank-you to the forest']],
      symbols:['💬','🌳','👋'],celebrate:'Your first five crystals are home! A new rainbow treasure hunt is waiting for your Forest Guardians.'},
    {id:'rainbow',title:'The Rainbow Leaf Quest',short:'Rainbow leaf hunt',icon:'leaf',colour:'#df729b',light:'#ffd1e7',dark:'#974876',xp:100,gem:'🌈 Rainbow Crystal',
      story:'The Guardian has a new adventure for you! Find a rainbow from your safe path: green, yellow, orange, red, then white. A missing colour? Swap that clue. Looking and pointing are enough!',
      tasks:[['Find a green leaf','Find something else green in nature','Name a green thing you remember'],['Find a yellow leaf','Find something else yellow in nature','Make a pretend sunshine with your hands'],['Find an orange leaf','Find something else orange in nature','Pretend to be a little orange fox'],['Find a red leaf','Find something else red in nature','Name a red thing you remember'],['Find something white','Spot a white cloud without looking at the sun','Imagine a tiny white cloud']],
      symbols:['💚','💛','🧡','❤️','🤍'],celebrate:'Five colours, one wonderful team! You woke up the Rainbow Crystal.'},
    {id:'treasure',title:'The Forest Treasure Hunt',short:'Nature treasures',icon:'chest',colour:'#bc854b',light:'#ffdf9c',dark:'#865327',xp:60,gem:'🌰 Acorn Crystal',
      story:'The best treasures are the things that make you smile. Look for little forest wonders, give one a funny face in your imagination, and leave every real treasure where it belongs.',
      tasks:[['Find a pine cone','Spot a cone on a tree from the path','Make a pretend pine cone shape with your hands'],['Find a nut or an acorn with a face','Imagine a funny face on a nut or acorn','Make your own silly acorn face'],['Find something you think is a treasure','Point to your favourite nature discovery','Tell your family about a pretend treasure']],
      hints:['Look without picking it up.','Imagine eyes and a smile, or notice a natural pattern. Do not draw on it, pick it up or put nuts in your mouth.','Your treasure stays in nature; the crystal is the treasure you collect in the game.'],
      symbols:['🌲','🌰','💎'],celebrate:'Your imagination found a priceless treasure: the Acorn Crystal!'},
    {id:'tiny',title:'The Tiny World Detectives',short:'Tiny forest clues',icon:'compass',colour:'#65afa5',light:'#baf9e2',dark:'#377973',xp:60,gem:'🕸️ Wonder Crystal',
      story:'Put on your pretend detective hats! Look for a spider web, a little bug, and something hanging in a tree. Tiny homes and creatures need lots of space.',
      tasks:[['Find a spider web','Find a web-like pattern on bark','Draw a pretend web in the air'],['Find a bug','Look for a tiny leaf or twig instead','Pretend a finger is a bug walking on your other hand'],['Find something hanging in a tree','Spot a dangling leaf or seed from the path','Make your arm a gently swaying branch']],
      hints:['Look from a distance. Do not touch the web or its spider.','No handling, poking, lifting logs or disturbing insects.','Look only from the path. Do not pull branches, climb, or approach nests or hanging objects.'],
      symbols:['🕸️','🐞','🌳'],celebrate:'Your careful detective eyes unlocked the Wonder Crystal!'},
    {id:'wildlife',title:'The Squirrel’s Secret Song',short:'Wildlife & make-believe',icon:'bird',colour:'#db9941',light:'#ffe6aa',dark:'#9a661e',xp:60,gem:'🐿️ Woodland Crystal',
      story:'Listen first, then watch quietly. Can you hear a bird and spot a squirrel? Now act like an animal you saw, without moving closer to it. No animal today? Make-believe counts too!',
      tasks:[['Listen for a bird sound','Listen for any gentle outdoor sound','Silently imagine a gentle bird song'],['Find a squirrel','Look at a tree a squirrel might visit','Pretend you spotted a squirrel'],['Act like an animal you see','Act like an animal you remember seeing','Choose a favourite animal and pretend']],
      hints:['Listen with your ears; no microphone or recording is needed.','Watch from far away. Do not feed, call, follow or chase it.','Use little gestures while seated or with feet planted beside your grown-up. No animal calls near wildlife, chasing, running off, climbing, or frightening animals.'],
      symbols:['🐦','🐿️','🦊'],celebrate:'Kind wildlife watching and silly acting earned your Woodland Crystal!'},
    {id:'photos',title:'The Explorer Photo Party',short:'Our picture-perfect finale',icon:'sparkles',colour:'#7b9ddb',light:'#d2e3ff',dark:'#4d68a1',xp:60,gem:'📸 Memory Crystal',
      story:'Time for some explorer poses! A grown-up chooses each safe spot and may use the phone’s normal camera. The game never opens a camera or asks for photos. Pointing, pretending and keeping both feet down earn the same reward.',
      tasks:[['Imagine a climbing adventure with both feet on the ground','Point to a pretend climbing spot and stay on the ground','Reach up like a climber with both feet planted'],['Find a bench and pose for a picture','Pose beside a safe place to rest','Make a seated superhero pose without a photo'],['Optional seated flying pose on safe level ground; a photo is not needed','Make a superhero pose with both feet on the ground','Reach up with your arms for a pretend flying picture']],
      hints:['Make a pretend climbing stretch while seated or with both feet planted on safe level ground. Do not climb trees, fences, rocks, benches or steps, and stay away from heights and edges.','Sit normally on a bench or stand beside it. A grown-up can take the photo; posing without a photo counts.','If comfortable, sit on safe level ground beside a grown-up and briefly lift your toes. Keeping both feet down or floating your hands counts equally. No jumping, climbing, ledges or balancing. No camera is needed.'],
      symbols:['🧗','🪑','📸'],celebrate:'What a team! Your Memory Crystal completes all ten chapters of this family adventure.'}
  ];
  const int = (value, min, max, fallback = min) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Math.floor(Number(value)))) : fallback;
  const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  function normalise(rawClassic, legacyRaw) {
    const own = object(rawClassic);
    const legacy = object(legacyRaw) || {};
    const source = own || legacy;
    const fromExpedition = !own && !!object(legacy.expedition);
    const oldFive = !own && (fromExpedition || legacy.version !== 3);
    const expeditionClaims = fromExpedition && Array.isArray(legacy.expedition.active?.claimedChapters) ? legacy.expedition.active.claimedChapters.length : 0;
    const requestedIndex = fromExpedition ? Math.max(int(legacy.index, 0, 5), Math.min(expeditionClaims, 5)) : source.index;
    const index = int(requestedIndex, 0, oldFive ? 5 : 10);
    const tasks = MISSIONS[index]?.tasks || [];
    // In old releases, index 5 meant finished. Its stale check flags must never
    // mark any of the five new Rainbow tasks. 2.1.0 version 3 flags are real.
    const clearFlags = oldFive && index >= 5;
    return {
      schema: 1,
      index,
      checks: tasks.map((_, i) => !clearFlags && source.checks?.[i] === true),
      variants: tasks.map((choices, i) => clearFlags ? 0 : int(source.variants?.[i], 0, choices.length - 1)),
      claimed: MISSIONS.map((_, i) => i < index)
    };
  }
  const result = (state, changed, xp = 0, crystals = 0) => ({ state, changed, xp, crystals });
  function mark(raw, taskIndex, expectedMissionIndex) {
    const state = normalise(raw);
    if (expectedMissionIndex != null && expectedMissionIndex !== state.index) return result(state, false);
    if (!Number.isInteger(taskIndex) || taskIndex < 0 || taskIndex >= state.checks.length || state.checks[taskIndex]) return result(state, false);
    state.checks[taskIndex] = true;
    return result(state, true);
  }
  function swap(raw, taskIndex, expectedMissionIndex) {
    const state = normalise(raw);
    if (expectedMissionIndex != null && expectedMissionIndex !== state.index) return result(state, false);
    if (!Number.isInteger(taskIndex) || taskIndex < 0 || taskIndex >= state.checks.length || state.checks[taskIndex]) return result(state, false);
    const choices = MISSIONS[state.index].tasks[taskIndex];
    state.variants[taskIndex] = (state.variants[taskIndex] + 1) % choices.length;
    return result(state, true);
  }
  function claim(raw, expectedIndex) {
    const state = normalise(raw);
    if (expectedIndex != null && expectedIndex !== state.index) return result(state, false);
    const mission = MISSIONS[state.index];
    if (!mission || state.claimed[state.index] || !state.checks.length || !state.checks.every(Boolean)) return result(state, false);
    const xp = mission.xp;
    state.claimed[state.index] = true;
    state.index++;
    const nextTasks = MISSIONS[state.index]?.tasks || [];
    state.checks = nextTasks.map(() => false);
    state.variants = nextTasks.map(() => 0);
    return result(state, true, xp, 1);
  }
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  return freeze({ MISSIONS, normalise, mark, swap, claim });
});
