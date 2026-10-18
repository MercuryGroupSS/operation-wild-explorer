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
  const THEMES = ['daylight', 'halloween'];
  const NIGHT_SETTINGS = ['indoor', 'neighbourhood', 'trail'];
  const ADVENTURE_KEYS = ['daylight', ...NIGHT_SETTINGS.map(setting => 'halloween:' + setting)];
  const NIGHT_GUIDANCE = {
    indoor: 'Grown-ups lead. Keep the room comfortably lit and stop before looking at the screen. Use materials you already have; grown-ups handle any cutting. Keep faces clear, fabric short and necks free of ties. Remove loose costumes before moving. No flames or climbing.',
    neighbourhood: 'Grown-ups lead. Stop together in a well-lit safe spot away from roads and edges; put the screen away before moving. No road crossing, approaching homes or talking to strangers is part of a challenge.',
    trail: 'Only use a trail a grown-up has checked is open and safe after dark. Grown-ups lead; stay together on the path in a well-lit, level spot. Stop before looking at the screen. Never approach, shine lights at or call to wildlife.'
  };
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
    return { id, type, title, prompt, alternative, emoji, theme: 'daylight', specialty: specialtyFor(type), habitats: habitats.slice(), seasons: seasons.slice() };
  }
  const CARDS = [
    card('find-treasure', 'Find', 'A treasure for our eyes', 'Spot a natural treasure from the path. Point to it and leave it exactly where it is.', 'Point to a colour you can see on your clothes, then help a grown-up find a matching patch.', '💎'),
    card('find-web', 'Find', 'A tiny silk masterpiece', 'Look for a spider web from the path. Watch without touching the web, spider or plants.', 'Look at the lines on your own palm. Follow one with a fingertip, or choose a line for a grown-up to follow on their palm.', '🕸️', ['woodland', 'park', 'garden']),
    card('find-hanging', 'Find', 'Something hanging', 'Spot a leaf, seed or branch hanging on a tree. Look from where you stand; do not reach, pull or climb.', 'Hold one hand comfortably out and let your fingers hang down, or ask a grown-up to do it. Count the hanging fingers.', '🍃', ['woodland', 'park', 'garden']),
    card('find-bug', 'Find', 'A little neighbour', 'Look for a bug from the path. Give it space, with no touching, lifting things or disturbing its home.', 'Spread one hand and watch two fingers gently walk across your other palm, or choose which two fingers a grown-up uses on their palm.', '🐞', ['woodland', 'park', 'garden'], ['spring', 'summer', 'autumn']),
    card('find-pinecone', 'Find', 'Pinecone detective', 'See whether a pinecone is visible from the path. Leave it where it is; do not pick it up or pull one from a tree.', 'Look at the bumps and lines on your own knuckles. Point to a repeating detail without touching anything outdoors.', '🌲', ['woodland', 'park', 'garden']),
    card('find-four-colours', 'Find', 'Four leaf colours', 'Look for four leaf colours without picking leaves. Any four colours around you count if leaves are all the same colour.', 'Point to up to four colours on your family’s clothes. Finding just one colour together counts too.', '🍂', HABITATS, ['spring', 'summer', 'autumn']),
    card('find-white', 'Find', 'A splash of white', 'Find something white you can see safely, such as a cloud, a sign or your own clothing. Leave everything where it is.', 'Point to the lightest colour on your clothes, then compare it with a darker patch. Any colours count.', '☁️'),
    card('find-squirrel', 'Find', 'A squirrel-shaped surprise', 'If a squirrel is visible, watch quietly from far away. Never approach, feed, chase or call to it.', 'Seated or with feet planted, gently hold your hands near your chest like squirrel paws for three quiet seconds, or choose a grown-up to copy.', '🐿️', ['woodland', 'park', 'garden']),
    card('find-round', 'Find', 'Round and wonderful', 'Point to a round shape you can see from your safe spot.', 'Make a circle with your fingers, or ask a grown-up to make a big circle and a small one for you to compare.', '⭕'),
    card('find-shadow', 'Find', 'Shadow spotting', 'While standing on safe level ground, look for a shadow near you. Keep away from roads and edges.', 'Point to a dark patch on your clothes and follow its edge with your eyes or a fingertip.', '🌤️'),
    card('find-tiny', 'Find', 'Tiny and mighty', 'Point to one small detail visible from the path. A mark, line or colour is enough.', 'Find a tiny detail on your own clothing.', '🔎'),
    card('find-spring', 'Find', 'A growing story', 'Look for fresh-looking green growth from the path. Leave buds and flowers untouched.', 'Gently close then open your hand like an opening leaf, or count the fingers as a grown-up slowly opens theirs.', '🌱', ['woodland', 'park', 'garden'], ['spring']),
    card('listen-bird', 'Listen', 'Bird-song ears', 'Pause beside a grown-up and listen for a bird sound. Stay quiet and keep your eyes open; no calls or recordings to attract birds.', 'Listen quietly for any sound with eyes open. Share what you hear, or give a small nod if all is quiet; stay in your safe spot.', '🐦'),
    card('listen-breeze', 'Listen', 'The breeze orchestra', 'Listen for the breeze or leaves moving while you stay safely with your team.', 'Gently rub your own sleeve and listen to its rustle, or choose when a grown-up starts and stops rubbing theirs.', '🍃'),
    card('listen-ten', 'Listen', 'Ten quiet seconds', 'Listen with your eyes open while a grown-up counts ten quiet seconds. What did you notice?', 'Listen with eyes open for five quiet seconds. Say what you heard or give a little nod if it stayed quiet.', '👂'),
    card('listen-near-far', 'Listen', 'Near sound, far sound', 'From the same safe spot, notice a nearby sound and a faraway sound. No need to move toward either one.', 'Stay still and listen as a grown-up gently taps their palm beside you, then softly rubs their sleeve. Which sound is quieter?', '🎵'),
    card('listen-footsteps', 'Listen', 'Our gentle footsteps', 'If your grown-up says the level path is clear, listen to a few ordinary slow footsteps.', 'Stay seated or still and gently tap one finger on your own hand.', '👣'),
    card('listen-soft', 'Listen', 'A very soft sound', 'Stay still beside your grown-up and notice the quietest sound you can hear.', 'Listen as a grown-up gently rubs their sleeve or taps their palm, then stops. Say or show when the soft sound stops.', '🤫'),
    card('listen-rhythm', 'Listen', 'A tiny rhythm', 'Listen for a sound with a rhythm. Keep listening from your safe spot without copying or calling to wildlife.', 'Gently tap a slow rhythm on your own knee.', '🥁'),
    card('listen-team', 'Listen', 'Our family whisper', 'One explorer whispers their favourite colour. The others listen and point to something like it.', 'Let someone point to a colour for everyone to look at together.', '💬'),
    card('listen-winter', 'Listen', 'The quiet season', 'Notice the sounds around you from a dry, safe path. Stay clear of icy areas and keep warm with your grown-ups.', 'In a warm, safe spot, listen as a grown-up gently pats then rubs their own sleeve. Choose which sound to hear again.', '❄️', HABITATS, ['winter']),
    card('move-tree', 'Move', 'Tall as a tree', 'On safe level ground, stretch gently tall like a tree with your feet planted. No climbing or balancing on anything.', 'Stay seated and raise your hands only as far as comfortable.', '🌳'),
    card('move-climb-pretend', 'Move', 'Our pretend mountain', 'Imagine climbing a mountain while staying on the ground. Slowly reach your arms up with both feet planted; do not climb real rocks or trees.', 'Stay seated and make a tiny mountain shape with your hands.', '⛰️'),
    card('move-animal', 'Move', 'Animal actor', 'Choose a pretend animal pose on safe level ground. Stay still or move gently beside your grown-up, with no animal calls near wildlife.', 'Make a quiet animal face while seated, or choose which animal face a grown-up makes for everyone to copy.', '🦊'),
    card('move-float', 'Move', 'A tiny floating pose', 'Optional: seated on safe level ground beside a grown-up, briefly lift your toes if comfortable. No standing balance, ledges, climbing or jumping; no camera needed.', 'Keep both feet comfortably down and slowly raise and lower one hand like a floating leaf, or direct a grown-up’s hand up and down.', '🪶'),
    card('move-bench', 'Move', 'Our cosy rest stop', 'Let a grown-up choose a safe bench or resting spot. Rest together; a family photo is optional and never needed to complete the clue.', 'Pause comfortably where your grown-up says it is safe. A tiny seated stretch counts.', '🪑'),
    card('move-leaf', 'Move', 'Little leaf hands', 'Stay planted on safe level ground and gently wiggle your hands like leaves in a breeze.', 'Wiggle one finger, or choose when a grown-up wiggles their fingers and when they stop.', '🌿'),
    card('move-thank-you', 'Move', 'A thank-you wave', 'Give nature a gentle thank-you wave while staying with your team.', 'Smile, nod or say a quiet thank-you instead.', '👋'),
    card('move-shape', 'Move', 'Make a branch shape', 'On safe level ground, make a gentle Y shape with your arms. Keep your feet planted and leave room around you.', 'Make a Y with two fingers, or draw it in the air while seated.', '🙌'),
    card('move-team', 'Move', 'Our team signal', 'Invent a gentle hand signal that means “we explore together.” Stay still beside your grown-up.', 'Choose a smile or a spoken word as your team signal.', '🤝'),
    card('imagine-acorn', 'Imagine', 'Make an acorn character', 'Stay still beside your grown-up. Cup your hands into a round acorn shape, then show a funny smiling face for the family to copy. Give your character a name. You do not need to find, collect or draw on a real acorn; leave them untouched.', 'Choose a smile or a surprised face for a grown-up to make, then copy it if comfortable.', '🌰'),
    card('imagine-cloud', 'Imagine', 'Copy a cloud creature', 'From a safe still spot, notice a cloud shape while looking away from the sun. Trace its outline with a finger, then shape your hands to match. Give it a creature name. If no cloud is visible, copy a shape on your sleeve.', 'Point to a shape on your clothes and ask a grown-up to trace its outline in the air. Choose a name for the shape together.', '☁️'),
    card('imagine-guardian', 'Imagine', 'Be a friendly guardian', 'Stay beside your grown-up and check that your team is together. Give them a kind reminder to leave nature untouched, then make a small hand signal for everyone to copy. Your guardian story can have a name too.', 'Choose a quiet wave, nod or kind word, and teach it to your family while everyone stays in their safe spot.', '🧙'),
    card('imagine-leaf-boat', 'Imagine', 'Build a hand-shaped boat', 'Stay on the path away from water. Cup your hands into a little boat shape, then gently open and close your fingers. Compare the gaps and choose a shape for your story boat. Leave real leaves untouched.', 'Ask a grown-up to cup their hands, then spread their fingers. Point or say which shape has bigger gaps.', '⛵'),
    card('imagine-story', 'Imagine', 'Our three-clue adventure', 'From your safe spot, point to a real colour, a line and a round shape. Clothes and hands count. Copy one shape with a finger, then let each explorer add a word about the clues to a friendly story.', 'Choose one visible detail on your clothes. Ask a grown-up to copy its shape with a finger, then name what you found together.', '📖'),
    card('imagine-home', 'Imagine', 'Build a tiny hand roof', 'Stay comfortably still and touch your fingertips together to make a little roof. Change it from wide to narrow and compare the shapes. Give your hand-house a story name; do not move stones, sticks or living things.', 'Choose a wide or narrow roof for a grown-up to make with their hands, then ask them to change it and spot the difference.', '🏡'),
    card('imagine-superpower', 'Imagine', 'Try a looking superpower', 'Use your super-looking power from a safe still spot: find a colour, a line and a tiny detail on your own clothes. Point them out, then help another explorer find the same details on theirs.', 'Choose one detail on your sleeve for a grown-up to look at, then point to a similar detail they find on their own clothes.', '✨'),
    card('imagine-message', 'Imagine', 'Frame nature’s postcard', 'Stay in your grown-up’s safe stopping spot. Make a small picture frame with your fingers and look through it at a detail already visible, away from the sun. Tell the family what your real-life postcard shows.', 'Ask a grown-up to make a finger frame around a detail on their own sleeve. Choose a colour or shape you can see inside it.', '💌'),
    card('imagine-summer', 'Imagine', 'A little shade experiment', 'Stay in your grown-up’s safe stopping spot. Hold one hand a little above your other palm, then move it aside. Can you see a patch of shade change? Keep looking at your hands, never at the sun. If no shade shows, compare the colours on the front and back of your hand.', 'Ask a grown-up to show their palm and the back of their hand. Point to a colour or line that looks different.', '🌞', HABITATS, ['summer']),
    card('solve-colours', 'Solve', 'The colour clue', 'Pick two colours you can see. What is the same or different about them?', 'Point to a colour on your clothes, then help a grown-up look for a matching patch on theirs.', '🎨'),
    card('solve-pattern', 'Solve', 'Pattern detectives', 'Find a repeating shape or line you can see from the path. Point without touching.', 'Make a simple finger pattern together: one, two, one, two.', '🔍'),
    card('solve-count', 'Solve', 'Count our clues', 'Count up to five things visible from your safe spot. Leaves, signs, colours or your own fingers count.', 'Count up to three fingers together, or point to one thing.', '🖐️'),
    card('solve-size', 'Solve', 'Big and little', 'Point to one big shape and one little shape from where you are. How are they different?', 'Make a big circle and a tiny circle with your hands.', '🔵'),
    card('solve-memory', 'Solve', 'Remember our wonder', 'Remember something your family noticed earlier. Give one clue so the others can guess it.', 'Point to something nearby and say its colour together.', '🧩'),
    card('solve-letter', 'Solve', 'Nature’s alphabet', 'Spot a shape that looks like a letter, such as a Y-shaped branch. Keep looking from the path.', 'Make the first letter of your name with a finger in the air.', '🔠'),
    card('solve-sort', 'Solve', 'Sort with your eyes', 'Point to two things that look alike and one that looks different. Leave them all where they are.', 'Look at two fingers and your thumb, or a grown-up’s hand. Point to the shortest one and compare their shapes.', '🟢'),
    card('solve-team', 'Solve', 'Our explorer-team puzzle', 'How many explorers are in your team? Count everyone together and think of one way you helped each other.', 'Count each explorer together, pointing or saying a number as you go. A grown-up can help keep count.', '⭐'),
    card('solve-autumn', 'Solve', 'Autumn colour puzzle', 'Look for two different leaf colours from the path. Which one reminds you of something cosy?', 'Point to two colours on your clothes and compare them with a grown-up. Leave every leaf where it is.', '🍁', ['woodland', 'park', 'garden'], ['autumn'])
  ];
  function nightCard(id, type, title, prompt, alternative, emoji, settings = NIGHT_SETTINGS) {
    return { ...card(id, type, title, prompt, alternative, emoji), theme: 'halloween', settings: settings.slice() };
  }
  const NIGHT_CARDS = [
    // Shared night activities need no carried equipment; alternatives remain real actions.
    nightCard("night-find-moon-colour", "Find", "Moonbeam colour match", "Stay still beside your grown-up and find a moon-like colour on your own clothes: white, silver or yellow. Point to a second patch that matches. Any colour you can actually see works.", "Seated indoors, point to a colour on your clothes and ask a grown-up to help find a match.", "🌙"),
    nightCard("night-find-friendly-shadow", "Find", "A friendly shadow shape", "From your grown-up’s well-lit stopping spot, find a shadow already nearby and trace its outline with a finger in the air. Give the shape a friendly name. Keep the lights on; if no shadow is clear, trace a shape on your own sleeve.", "Seated indoors in a lit room, trace a visible shape on your own clothes, or guide a grown-up’s finger with words.", "🐾"),
    nightCard("night-find-torch-detail", "Find", "Tiny torch detective", "Stay still while a grown-up optionally aims a handheld torch down at your own shoe. Find a line and follow it with your eyes. Use ordinary lighting instead if you prefer; never aim a light at eyes or animals.", "Seated indoors, point to a line or colour on your sleeve using the room light.", "🔦"),
    nightCard("night-listen-ten", "Listen", "The cosy quiet count", "Stay still with your grown-up, eyes open, while they count five quiet seconds. Listen, then share one sound you heard or show a quiet thumbs-up if it was peaceful. Stay in your spot.", "Seated indoors, listen while a grown-up gently taps their palm once, then show or say when you hear it.", "👂"),
    nightCard("night-listen-two", "Listen", "Two little sound clues", "Beside your grown-up, listen for one sound, then softly rub your own sleeve to make a second. Which is quieter? Stay in the same safe stopping spot; never follow sounds or copy animal calls.", "Seated indoors, listen to a grown-up quietly tap then rub their own palm. Point or say which sounds softer.", "🎵"),
    nightCard("night-listen-finger", "Listen", "The pumpkin’s tiny beat", "Stay still and gently tap one finger on your own palm: tap, tap, pause. Let the next explorer copy your tiny beat. Keep it quiet around wildlife.", "Seated indoors, tap once if comfortable, or listen and choose whether a grown-up taps once or twice next.", "🥁"),
    nightCard("night-move-bat-hands", "Move", "Make little bat wings", "Beside your grown-up on level ground, keep both feet planted. Bring your thumbs near each other and gently spread your fingers into two bat wings. Open and close them slowly, with space around you.", "Seated indoors, open one hand gently, or ask a grown-up to make a wing shape for you to choose and copy.", "🦇"),
    nightCard("night-move-pumpkin", "Move", "Shape a pumpkin", "Stay planted beside your grown-up and make a comfortable round pumpkin shape with your arms. Ask a family member to make a smaller one. Compare your two shapes without stretching or reaching far.", "Seated indoors, make a small circle with one hand, or choose the larger of two circles a grown-up makes.", "🎃"),
    nightCard("night-move-moon-fingers", "Move", "Crescent-moon fingers", "Stay still with your grown-up and make a crescent shape with one hand. Slowly change it into a round moon. Keep your feet comfortably down and movements small.", "Seated indoors, curl one finger comfortably, or direct a grown-up to make a crescent then a circle.", "🌙"),
    nightCard("night-imagine-sock-dragon", "Imagine", "Make a hand dragon", "From your safe stopping spot, turn one hand into a dragon puppet: curl your fingers gently, then open and close its little mouth. Use a colour on your own sleeve to name your dragon and show the family its quiet hello.", "Seated indoors, move one finger as a puppet, or choose a colour and direct a grown-up’s hand dragon.", "🐉"),
    nightCard("night-imagine-moon-picnic", "Imagine", "Design our moon badge", "Stay beside your grown-up in your safe stopping spot. Use a fingertip to trace a circle, crescent or star on your own open palm. Let the family copy your design and choose a name for your explorer badge.", "Seated indoors, trace a little line on your palm, or choose a shape for a grown-up to trace on their own palm.", "🧺"),
    nightCard("night-imagine-kind-star", "Imagine", "Give a real star thank-you", "Stay in your safe spot and thank an explorer for something they actually did tonight, such as helping with a hat or waiting together. Make a small hand signal to go with your thank-you and teach it to the family.", "Seated indoors, point to someone who helped, then give them a smile or choose a thank-you word.", "💌"),
    nightCard("night-solve-pumpkin-pattern", "Solve", "Make a pumpkin-moon pattern", "Beside your grown-up, make a round pumpkin with your hands, then a crescent moon with one hand. Repeat: round, crescent, round. Ask the family to make the shape that comes next. Keep movements small.", "Seated indoors, watch a grown-up make a circle then a crescent twice. Choose which shape comes next.", "🧩"),
    nightCard("night-solve-moon-sizes", "Solve", "Big moon, little moon", "Stay still with your grown-up. Each make a comfortable circle with your hands. Compare them: which circle is bigger? Make one circle smaller and check again.", "Seated indoors, point to the bigger of two hand circles a grown-up makes, then help them make it smaller.", "🔵"),
    nightCard("night-solve-lantern-riddle", "Solve", "Our real mystery clue", "Beside your grown-up, choose something already visible on your own clothes, such as a stripe, pocket or shoe. Give one colour or shape clue for your family to guess, then point out the answer. Stay in your safe spot.", "Seated indoors, let a grown-up describe a colour on your clothes and point to the matching place together.", "🎃"),
    // Indoor making uses available household materials and grown-up help.
    nightCard("night-indoor-find-wall", "Find", "Make a wall creature", "In a comfortably lit room, let a grown-up aim an optional handheld torch at a clear wall, away from eyes. Put your hand in the beam to make a creature’s shadow and change its ears with your fingers. Keep room lights on. Without a torch, make and compare hand shapes in the room light.", "Seated indoors with the lights on, make a hand shape for the family to copy, or choose one for a grown-up to make.", "🔦", ["indoor"]),
    nightCard("night-indoor-find-costume", "Find", "Make your wizard hat", "In your lit room, ask a grown-up for scrap paper and tape if you have them. Fold a pointed triangle or roll a little cone to hold as your wizard hat; add stars with an available crayon. Wear it only if the paper is large enough and a grown-up fits it above your eyes. Grown-ups handle any cutting; no neck ties. No paper? Choose an existing hat together.", "Seated indoors, help fold a paper triangle to hold as a wizard badge, or choose an existing hat for a grown-up to show you. No paper or hat? Match two colours on your clothes for your wizard outfit, or swap this card.", "🧙", ["indoor"]),
    nightCard("night-indoor-listen-home", "Listen", "The house’s quiet music", "Stay seated or still beside your grown-up and listen for a familiar house sound, such as a clock or gentle hum. Tap its rhythm quietly on your own knee, or count three sounds together. Keep the room lit and leave appliances alone.", "Seated indoors, listen as a grown-up gently taps their palm three times, then copy one tap or count together.", "🏡", ["indoor"]),
    nightCard("night-indoor-listen-password", "Listen", "Make a pumpkin password", "In your lit room, choose a familiar object your grown-up has placed beside you, such as a cushion or book. Softly say its name as the club password. The next explorer repeats it and points to the object.", "Seated indoors, choose between two nearby objects a grown-up names. Pointing or looking at your choice counts.", "💬", ["indoor"]),
    nightCard("night-indoor-move-cape", "Move", "Make a little moon cape", "Stay seated in your lit room. With a grown-up, choose a small tea towel or short piece of fabric and drape it over your shoulders. Hold its corners loosely and gently show its colours. Never tie or fasten it around your neck; keep your face clear and fabric off the floor. Take it off before moving.", "Seated indoors, spread a small cloth on your lap and smooth it into a cape shape, or direct a grown-up to do it. No cloth? Fold scrap paper into a little cape shape to hold. Without either, compare the colours and patterns of your own sleeves.", "✨", ["indoor"]),
    nightCard("night-indoor-move-statue", "Move", "Copy our creature poses", "Beside your grown-up in your lit room, sit or keep both feet on the clear floor. Make a friendly creature pose using your hands and face. Let the family copy it for three seconds, then swap leaders. Stay off furniture.", "Seated indoors, make a smile or tiny finger pose for someone to copy, or choose which of their poses to repeat.", "😊", ["indoor"]),
    nightCard("night-indoor-imagine-palace", "Imagine", "Build a pumpkin palace", "In your lit room, ask a grown-up to bring two cushions or folded towels to a clear floor or tabletop. Place them side by side as palace walls and leave a doorway between them. Add a large soft toy if you have one. Build low: no roofs, climbing or furniture moving.", "Seated indoors, arrange two folded cloths or pieces of scrap paper with a gap between them, or tell a grown-up where to place them. Without materials, make two hand shapes with a doorway gap between them.", "🏰", ["indoor"]),
    nightCard("night-indoor-imagine-mouse", "Imagine", "Make a tiny storybook", "In your lit room, fold a sheet of scrap paper in half with a grown-up to make a little book. Draw a friendly mouse or pumpkin on the cover with a crayon you already have. Give it a title and tell one sentence about tonight. No paper? Choose a picture in an existing book and tell its next sentence.", "Seated indoors, choose a cover colour while a grown-up folds or draws for you, or point to a picture in an existing book and name one thing you see. Without either, take turns naming three real things in the room.", "📚", ["indoor"]),
    nightCard("night-indoor-solve-shadow", "Solve", "Try the shadow-size experiment", "Stay seated beside your grown-up in a lit room. They can aim a handheld torch at a clear wall, away from eyes, while you hold a hand in the beam. Move your hand a little nearer the torch, then away. Which shadow gets bigger? Keep the room lights on. No torch? Compare your hand with a grown-up’s.", "Seated indoors, compare your hand and a grown-up’s side by side without touching. Point to the larger one and count fingers together.", "🔍", ["indoor"]),
    nightCard("night-indoor-solve-room", "Solve", "Build a cosy reading spot", "In your lit room, solve this clue: “A soft place where we may sit and read.” Point to a safe chair, sofa or floor cushion. Let a grown-up bring an available book or cushion, then help arrange your cosy spot and share a page. No climbing or moving furniture.", "Seated indoors, choose a book or cushion already within reach, or tell a grown-up where you would like it placed. Without either, settle comfortably and point to two shapes in the room.", "🪑", ["indoor"]),
    // Neighbourhood discovery uses visible clues from a safe stopping spot.
    nightCard("night-neighbourhood-find-window", "Find", "Window-shape detective", "Stop beside your grown-up in their chosen well-lit spot away from roads and edges. Notice a window shape already visible and count its sides together. Stay in your spot; do not approach homes or peer inside.", "Seated indoors, point to a window or door shape you can see and count its corners together.", "🪟", ["neighbourhood"]),
    nightCard("night-neighbourhood-find-colour", "Find", "A cosy street colour", "From your grown-up’s well-lit stopping spot away from roads, find a colour on a decoration already visible and match it to your clothes. If no decoration is visible, compare two clothing colours. No crossing, touching decorations or approaching a home.", "Seated indoors, match a colour on your clothes to something already visible in the room.", "🎨", ["neighbourhood"]),
    nightCard("night-neighbourhood-listen-soft", "Listen", "Our street sound postcard", "Stay still with your grown-up in a well-lit safe spot away from roads. Listen to one everyday sound and describe it softly in two words, such as “soft rustle.” Let the family choose a word too. Do not follow sounds, approach anyone or make animal calls.", "Seated indoors, listen as someone softly rubs their sleeve, then choose a word that describes the sound.", "👂", ["neighbourhood"]),
    nightCard("night-neighbourhood-listen-leaves", "Listen", "A leafy sound experiment", "From your grown-up’s safe, well-lit stopping spot, listen for leaves rustling without moving towards them. Then gently rub your own sleeve once and compare the sounds. If leaves are quiet, compare rubbing and tapping your sleeve. Leave plants alone.", "Seated indoors, gently rub then tap your sleeve, or listen to a grown-up do it. Which sound is softer?", "🍂", ["neighbourhood"]),
    nightCard("night-neighbourhood-move-wave", "Move", "Make our family signal", "In your grown-up’s well-lit safe stopping spot away from roads, keep your feet planted and make a tiny hand signal that means “ready together.” Teach it to your family and have them copy it. Keep looking ahead; only signal to your own team.", "Seated indoors, choose a small wave, nod or word for your family to copy.", "👋", ["neighbourhood"]),
    nightCard("night-neighbourhood-move-lantern", "Move", "A lantern-face game", "Stay planted beside your grown-up in a well-lit, level spot clear of passers-by and roads. Show your family a gentle smiling pumpkin face, then a surprised one. Ask them to copy the face you choose.", "Seated indoors, make a small smile or choose which face a grown-up makes next.", "🏮", ["neighbourhood"]),
    nightCard("night-neighbourhood-imagine-moth", "Imagine", "Design from real patterns", "From your grown-up’s safe, well-lit stopping spot away from roads, find a stripe or shape on your own clothing. Trace it lightly with a finger and show the family how to copy it on their own sleeves. Give your pattern a moth-wing name; leave real moths alone.", "Seated indoors, point to a pattern on your clothes, or choose a line for a grown-up to trace on their own sleeve.", "🧣", ["neighbourhood"]),
    nightCard("night-neighbourhood-imagine-street", "Imagine", "Tell our three-clue story", "Stay beside your grown-up in your well-lit stopping spot. Point to a colour, a shape and something that glows already visible from there. Use those three real clues in one friendly Halloween sentence. A colour on your clothes can stand in for a missing clue. No home visits or stranger conversations.", "Seated indoors, point to two things you see and help a grown-up put their names into one funny sentence.", "🎃", ["neighbourhood"]),
    nightCard("night-neighbourhood-solve-shapes", "Solve", "Match two real shapes", "From your grown-up’s well-lit stopping spot away from roads, point to two shapes already visible. Are they the same or different? Windows, signs and your own clothing count. If only one is clear, copy its outline with a finger. Stay still and leave everything in place.", "Seated indoors, compare the shapes of a visible door and window, or two shapes on your clothes.", "🔷", ["neighbourhood"]),
    nightCard("night-neighbourhood-solve-lanterns", "Solve", "Count the glowing clues", "Stay still beside your grown-up in their safe, well-lit stopping spot away from roads. Count up to three decorations or lights already visible without looking into bright beams. Hold up a finger for each. If none are visible, count three fingers together. No door visits.", "Seated indoors, count up to three colours on your clothes or count three fingers together.", "🖐️", ["neighbourhood"]),
    // Trail activities leave nature untouched on an adult-verified route.
    nightCard("night-trail-find-line", "Find", "The path’s little lines", "On a route your grown-up has checked is open and safe after dark, stop together in a well-lit, level place on the path. Point to a line already visible on the path and copy its direction with one finger in the air. Never leave the path to search.", "Seated indoors, follow a visible line on your sleeve with your eyes or a fingertip.", "🔎", ["trail"]),
    nightCard("night-trail-find-branch", "Find", "Copy a branch-shaped letter", "On an adult-checked route open and safe after dark, stay still together on the well-lit path. Notice a branch shape already visible ahead and copy it with two fingers. Do not touch or approach it. If none is clear, copy a line on your own sleeve.", "Seated indoors, make a tiny Y shape with two fingers, or choose a visible line for a grown-up to copy.", "🌳", ["trail"]),
    nightCard("night-trail-listen-trees", "Listen", "The trees’ quiet chapter", "On an adult-checked route open and safe after dark, pause together in a well-lit safe place on the path. Listen quietly for five seconds, then say whether you heard a rustle, another sound or quiet. Stay put; never follow sounds or copy animal calls.", "Seated indoors, enjoy five quiet seconds, then point to your ear for a sound or give a quiet thumbs-up.", "🍃", ["trail"]),
    nightCard("night-trail-listen-coat", "Listen", "Our cosy coat rustle", "On an adult-checked route open and safe after dark, stay still together on the well-lit path. Gently rub then tap your own sleeve. Listen for the difference and choose the softer sound. Keep it tiny and quiet around wildlife.", "Seated indoors, gently touch your own sleeve or listen to a grown-up rub theirs, then describe what you notice.", "🧥", ["trail"]),
    nightCard("night-trail-move-seed", "Move", "Open a little seed hand", "On an adult-checked route open and safe after dark, stay beside your grown-up on a well-lit, level path with both feet planted. Gently close one hand, then slowly open it like a seed sprouting. Count the fingers as they open. Leave plants untouched.", "Seated indoors, open one finger comfortably, or count as a grown-up slowly opens their hand.", "🌱", ["trail"]),
    nightCard("night-trail-move-owl", "Move", "Make an owl-wing shape", "On an adult-checked route open and safe after dark, stay still together on the well-lit path with both feet planted. Gently spread your fingers into a small owl-wing shape and let the family copy it. No hooting, balancing or seeking real owls.", "Seated indoors, open one hand if comfortable, or choose which hand a grown-up opens into a wing.", "🦉", ["trail"]),
    nightCard("night-trail-imagine-guardian", "Imagine", "Be our kind path guardian", "On an adult-checked route open and safe after dark, pause together on the well-lit path. Give your family a kind reminder to stay together and leave nature untouched. Make a small “together” hand signal for everyone to copy, then let your grown-up lead onward.", "Seated indoors, choose a kind explorer reminder and teach the family a small hand signal or word for it.", "🧙", ["trail"]),
    nightCard("night-trail-imagine-boat", "Imagine", "Make a leaf-shaped design", "On an adult-checked route open and safe after dark, stay together in a well-lit stopping spot on the path. Look at a leaf already visible, leaving it untouched. Copy its shape with your hands and give the design a moon-boat name. If no leaf is clear, use the shape of your own hand. Stay away from water.", "Seated indoors, spread one hand and trace its outline with a finger from your other hand, or direct a grown-up to trace their own.", "⛵", ["trail"]),
    nightCard("night-trail-solve-pairs", "Solve", "Find a matching pair", "On an adult-checked route open and safe after dark, stop together on the well-lit path. Point to two leaves with similar shapes already visible from your spot. Leave every leaf and living thing untouched. If none are clear, compare the two sleeves of your own coat instead.", "Seated indoors, compare your own two sleeves or shoes. Find one thing that matches.", "🍁", ["trail"]),
    nightCard("night-trail-solve-pause", "Solve", "Practise our safe-stop plan", "On an adult-checked route open and safe after dark, stay together on the well-lit path. Tell your grown-up the order: stop safely together, look at the card, put the screen away before moving. After this challenge, help check the screen is away and wait for your grown-up’s lead.", "Seated indoors, tell a grown-up the three steps, then practise putting the screen down while everyone stays seated.", "🧩", ["trail"])
  ];
  CARDS.push(...NIGHT_CARDS);
  const CARD_BY_ID = Object.assign(Object.create(null), Object.fromEntries(CARDS.map(c => [c.id, c])));
  const SHOP = [
    { id: 'compass', name: 'Star compass', emoji: '🧭', cost: 2, slot: 'gear', description: 'A pretend compass for your family’s story.' },
    { id: 'leaf-cape', name: 'Leaf cape', emoji: '🍃', cost: 3, slot: 'gear', description: 'A storybook cape for the whole team.' },
    { id: 'explorer-lantern', name: 'Firefly lantern', emoji: '🏮', cost: 4, slot: 'gear', description: 'A pretend glow to decorate camp.' },
    { id: 'fox-friend', name: 'Friendly fox', emoji: '🦊', cost: 3, slot: 'companion', description: 'A make-believe woodland friend for camp. Real wildlife stays wild.' },
    { id: 'bunting', name: 'Rainbow bunting', emoji: '🎏', cost: 2, slot: 'camp', description: 'Bright flags for your make-believe camp.' },
    { id: 'cosy-tent', name: 'Cosy story tent', emoji: '⛺', cost: 4, slot: 'camp', description: 'A colourful camp decoration.' },
    { id: 'moon-cape', name: 'Moon cape', emoji: '🌙', cost: 3, slot: 'gear', description: 'A silvery make-believe cape for your night-adventure team.' },
    { id: 'bat-friend', name: 'Friendly bat', emoji: '🦇', cost: 2, slot: 'companion', description: 'A cheerful storybook bat for camp. Real wildlife stays wild.' },
    { id: 'pumpkin-lantern', name: 'Pumpkin lantern', emoji: '🎃', cost: 4, slot: 'camp', description: 'A smiling pretend lantern for camp; no flame or real equipment.' },
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
    return { habitat: HABITATS.includes(habitat) ? habitat : 'woodland', season: SEASONS.includes(season) ? season : 'autumn', duration: Object.hasOwn(DURATIONS, raw.duration) ? raw.duration : 'long', difficulty: DIFFICULTIES.includes(difficulty) ? difficulty : 'gentle', theme: THEMES.includes(raw.theme) ? raw.theme : 'daylight', setting: NIGHT_SETTINGS.includes(raw.setting) ? raw.setting : 'indoor' };
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
  function adventureKey(rawOptions) {
    const options = normaliseOptions(rawOptions);
    return options.theme === 'halloween' ? 'halloween:' + options.setting : 'daylight';
  }
  function matchesMode(c, options) {
    return c && (options.theme === 'halloween' ? c.theme === 'halloween' && c.settings.includes(options.setting) : c.theme === 'daylight');
  }
  function eligible(options) {
    return CARDS.filter(c => matchesMode(c, options) && (options.theme === 'halloween' || c.habitats.includes(options.habitat) && c.seasons.includes(options.season)));
  }
  function seedOptions(options) {
    // Retain the exact pre-night seed payload for every daytime adventure.
    const { habitat, season, duration, difficulty } = options;
    return JSON.stringify(options.theme === 'daylight' ? { habitat, season, duration, difficulty } : options);
  }
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
    if (fresh.length && options.theme === 'halloween') ranked.sort((a, b) => a.settings.length - b.settings.length);
    else if (fresh.length) ranked.sort((a, b) => (b.habitats.length < HABITATS.length ? 1 : 0) + (b.seasons.length < SEASONS.length ? 1 : 0) - (a.habitats.length < HABITATS.length ? 1 : 0) - (a.seasons.length < SEASONS.length ? 1 : 0));
    return ranked[0] || eligible(options)[0];
  }
  function createOuting(rawOptions, recentIds = [], seed = 1) {
    const options = normaliseOptions(rawOptions), seedText = clean(String(seed), 100) || '1';
    const rng = random(seedText + seedOptions(options)), flat = [], used = new Set();
    let previousType = null, cycle = [];
    const recent = list(recentIds).filter(id => CARD_BY_ID[id]).slice(-90);
    for (let i = 0; i < 5 * DURATIONS[options.duration]; i++) {
      if (!cycle.length) { cycle = shuffle(TYPES, rng); if (cycle[0] === previousType) [cycle[0], cycle[1]] = [cycle[1], cycle[0]]; }
      const type = cycle.shift(), chosen = chooseCard(options, rng, used, recent, previousType, null, type);
      flat.push(chosen.id); used.add(chosen.id); previousType = chosen.type;
    }
    const size = DURATIONS[options.duration];
    return { id: 'outing-' + hash(seedText + seedOptions(options) + recent.join(',')).toString(36), options, seed: seedText, deck: Array.from({ length: 5 }, (_, i) => flat.slice(i * size, (i + 1) * size)), chapter: 0, step: 0, done: [], claimedChapters: [], ended: false, endedEarly: false, puzzleSolved: false, swaps: 0 };
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
    active.deck = active.deck.map((row, chapter) => row.map((fallback, step) => matchesMode(CARD_BY_ID[raw.deck?.[chapter]?.[step]], options) ? raw.deck[chapter][step] : fallback));
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
  function normaliseParked(raw, activeKey) {
    const parked = {}, source = object(raw);
    ADVENTURE_KEYS.forEach(key => {
      const saved = source[key];
      if (key !== activeKey && saved && typeof saved === 'object' && !Array.isArray(saved) && adventureKey(saved.options) === key) parked[key] = normaliseActive(saved);
    });
    return parked;
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
    return { id: clean(raw.id, 120) || a.id, date: iso(raw.date || raw.createdAt), createdAt: iso(raw.createdAt || raw.date), park: clean(raw.park, 100), options: a.options, deck: a.deck, done: a.done, discoveries: a.done.map(discoveryView), claimedChapters: a.claimedChapters, completedChapters: a.claimedChapters.length, challengeCount: a.done.length, endedEarly: a.claimedChapters.length < 5, puzzleSolved: raw.puzzleSolved === true, xp: a.claimedChapters.reduce((sum, i) => sum + CHAPTER_XP[i], 0), crystals: a.claimedChapters.length, favorite: clean(raw.favorite), badges: unique(list(raw.badges).map(b => clean(b, 80)).filter(Boolean)).slice(0, 20), heroes: list(raw.heroes).map(normaliseHero), photoIds: unique(list(raw.photoIds).map(p => clean(p, 100)).filter(Boolean)).slice(0, 12) };
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
      const e = { schema: 1, options: active.options, active, parkedOutings: {}, recentIds: active.done.map(r => r.cardId), wallet: completed, owned: [], equipped: { gear: null, camp: null, companion: null }, postcards: [], lifetime: { xp: int(legacyState.xp, 0, 10000000), crystals: completed, challenges: active.done.length, outings: 0, specialties: { scout: 0, listener: 0, detective: 0 } }, legacyFunded: true, sequence: 0 };
      active.done.forEach(r => e.lifetime.specialties[r.specialty]++);
      if (active.ended) snapshot(e);
      return e;
    }
    const options = normaliseOptions(raw.options), active = normaliseActive(raw.active, options), owned = unique(list(raw.owned).filter(id => SHOP_BY_ID[id]));
    const lifetime = object(raw.lifetime), specialties = object(lifetime.specialties);
    const e = { schema: 1, options: active.options, active, parkedOutings: normaliseParked(raw.parkedOutings, adventureKey(active.options)), recentIds: list(raw.recentIds || raw.history?.recentIds).filter(id => CARD_BY_ID[id]).slice(-90), wallet: int(raw.wallet, 0, 1000000), owned, equipped: { gear: null, camp: null, companion: null }, postcards: [], lifetime: { xp: int(lifetime.xp, 0, 10000000), crystals: int(lifetime.crystals, 0, 1000000), challenges: int(lifetime.challenges, 0, 10000000), outings: int(lifetime.outings, 0, 1000000), specialties: { scout: int(specialties.scout, 0, 10000000), listener: int(specialties.listener, 0, 10000000), detective: int(specialties.detective, 0, 10000000) } }, legacyFunded: true, sequence: int(raw.sequence, 0, 1000000) };
    for (const slot of ['gear', 'camp', 'companion']) { const id = raw.equipped?.[slot]; if (owned.includes(id) && SHOP_BY_ID[id].slot === slot) e.equipped[slot] = id; }
    list(raw.postcards).forEach(p => { const postcard = normalisePostcard(p); if (!e.postcards.some(saved => saved.id === postcard.id)) e.postcards.push(postcard); });
    return e;
  }
  function currentKey(expansion) { const a = expansion.active; return a.id + ':' + a.chapter + ':' + a.step + ':' + a.swaps; }
  function getCurrentCard(expansion) {
    const a = expansion?.active;
    if (!a || a.ended || a.chapter >= 5) return null;
    const c = CARD_BY_ID[a.deck[a.chapter]?.[a.step]];
    if (!matchesMode(c, normaliseOptions(a.options))) return null;
    const extra = a.options.difficulty === 'curious' ? ' If you like, share one extra detail you noticed.' : a.options.difficulty === 'challenge' ? ' If you like, explain one clue or invent a second idea for the team.' : '';
    return { ...c, prompt: c.prompt + extra, safety: a.options.theme === 'halloween' ? NIGHT_GUIDANCE[a.options.setting] : '', chapter: a.chapter, step: a.step, challengeKey: currentKey(expansion) };
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
  function switchAdventure(expansion, theme, setting = 'indoor', seed = 1) {
    const e = normaliseExpansion(expansion);
    if (!THEMES.includes(theme) || !NIGHT_SETTINGS.includes(setting)) return result(e, false, 'Choose a supported adventure and setting.');
    const options = normaliseOptions({ ...e.options, theme, setting }), target = adventureKey(options), current = adventureKey(e.active.options);
    if (target === current) return result(e, false, 'This adventure is already open.');
    e.parkedOutings[current] = e.active;
    if (e.parkedOutings[target]) {
      e.active = e.parkedOutings[target];
      delete e.parkedOutings[target];
    } else {
      e.sequence++;
      e.active = createOuting(theme === 'halloween' ? { ...options, duration: 'short', difficulty: 'gentle' } : options, e.recentIds, String(seed) + ':' + e.sequence);
    }
    e.options = e.active.options;
    return result(e, true);
  }
  function startNext(expansion, options, seed = 1) {
    const e = normaliseExpansion(expansion);
    if (!e.active.ended) return result(e, false, 'Finish or save this outing before starting another.');
    const nextOptions = normaliseOptions({ theme: e.options.theme, setting: e.options.setting, ...object(options || e.options) });
    const target = adventureKey(nextOptions), current = adventureKey(e.active.options);
    if (target !== current) {
      // A mode change must never erase an unfinished parked family adventure.
      if (e.parkedOutings[target] && !e.parkedOutings[target].ended) return switchAdventure(e, nextOptions.theme, nextOptions.setting, seed);
      e.parkedOutings[current] = e.active;
      delete e.parkedOutings[target];
    }
    e.sequence++; e.options = nextOptions; e.active = createOuting(e.options, e.recentIds, String(seed) + ':' + e.sequence);
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
  return freeze({ SCHEMA: 1, CARDS, NIGHT_CARDS, CARD_BY_ID, SHOP, BADGES, TYPES, THEMES, NIGHT_SETTINGS, NIGHT_GUIDANCE, HABITATS, SEASONS, DIFFICULTIES, DURATIONS, CHAPTER_XP, normaliseOptions, adventureKey, switchAdventure, createOuting, normaliseExpansion, getCurrentCard, currentKey, isChapterReady, completeChallenge, swapChallenge, finishChapter, finishEarly, buyItem, equipItem, startNext, getPuzzle, solvePuzzle, badges });
});
