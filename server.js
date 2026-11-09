"use strict";
/*
  Imposter Lineup: multiplayer server. No dependencies, needs Node 18 or newer.
  Run:  node server.js   then open http://localhost:3000
  Lobbies live in memory, so they reset when the server restarts.
*/
const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 12;
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const PACKS = {
  animals: { name: "Animals", words: ["Elephant","Penguin","Octopus","Giraffe","Kangaroo","Dolphin","Peacock","Camel","Owl","Tiger","Crocodile","Flamingo","Hedgehog","Squirrel","Cobra","Jellyfish","Panda","Bat","Rhinoceros","Parrot","Seahorse","Monkey","Buffalo","Turtle"] },
  food: { name: "Food and drink", words: ["Pizza","Sushi","Pancake","Noodles","Burger","Chocolate","Popcorn","Lemonade","Sandwich","Ice cream","Omelette","Dumpling","Pasta","Watermelon","Coffee","Cheese","Mango","Waffle","Soup","Taco","Cupcake","Pickle","Smoothie","Salad"] },
  places: { name: "Places", words: ["Airport","Library","Hospital","Cinema","Beach","Museum","Railway station","Zoo","Supermarket","Stadium","Bakery","Hotel","Farm","Lighthouse","Desert","Waterfall","Playground","Bank","Gym","Castle","Island","Jungle","School","Post office"] },
  jobs: { name: "Jobs", words: ["Doctor","Pilot","Chef","Farmer","Teacher","Plumber","Detective","Barber","Astronaut","Tailor","Lawyer","Electrician","Journalist","Dentist","Carpenter","Magician","Postman","Fisherman","Architect","Mechanic","Singer","Firefighter","Judge","Cashier"] },
  objects: { name: "Everyday objects", words: ["Umbrella","Toothbrush","Scissors","Pillow","Mirror","Backpack","Candle","Remote control","Key","Spectacles","Bucket","Kettle","Ladder","Wallet","Clock","Hammer","Broom","Sofa","Charger","Headphones","Notebook","Torch","Blanket","Comb"] },
  sports: { name: "Sports", words: ["Cricket","Football","Badminton","Tennis","Swimming","Hockey","Chess","Boxing","Cycling","Kabaddi","Archery","Basketball","Wrestling","Golf","Volleyball","Skating","Surfing","Table tennis","Marathon","Gymnastics","Rowing","Skiing","Polo","Carrom"] },
  desi: { name: "Desi life", words: ["Chai","Auto-rickshaw","Samosa","Diwali","Monsoon","Biryani","Dosa","Rangoli","Jalebi","Pani puri","Holi","Taj Mahal","Tiffin","Lassi","Cricket bat","Mehndi","Bollywood","Local train","Banyan tree","Kite","Baraat","Temple bell","Sari","Ludo","Paratha","Mango pickle","Dhaba","Ceiling fan"] },
  marvel: { name: "Marvel", words: ["Iron Man","Thor","Hulk","Black Widow","Spider-Man","Black Panther","Doctor Strange","Thanos","Loki","Captain America","Wakanda","Infinity Stones","Hawkeye","Ant-Man","Groot","Rocket Raccoon","Deadpool","Wolverine","Mjolnir","Vibranium","Avengers Tower","Scarlet Witch","Nick Fury","Captain Marvel","Ultron","Asgard"] },
  starwars: { name: "Star Wars", words: ["Lightsaber","Darth Vader","Yoda","Millennium Falcon","Death Star","Tatooine","Chewbacca","Stormtrooper","Jedi","Han Solo","R2-D2","C-3PO","Baby Yoda","Mandalorian","Princess Leia","X-wing","Jabba the Hutt","Obi-Wan","The Force","Wookiee","Ewok","Hoth","Kylo Ren","Sith","Blaster","BB-8"] },
  pokemon: { name: "Pokémon", words: ["Pikachu","Charizard","Bulbasaur","Squirtle","Eevee","Snorlax","Mewtwo","Jigglypuff","Gengar","Magikarp","Psyduck","Meowth","Lucario","Gyarados","Pokéball","Ash Ketchum","Team Rocket","Pokédex","Gym Leader","Charmander","Togepi","Onix","Mimikyu","Rayquaza","Poké Center","Machamp"] },
  anime: { name: "Anime", words: ["Naruto","Goku","Luffy","Sailor Moon","Death Note","Totoro","Attack on Titan","Demon Slayer","Doraemon","Shinchan","Spirited Away","Dragon Ball","One Piece","Pikachu","Sasuke","Light Yagami","Tanjiro","Studio Ghibli","Fullmetal Alchemist","Hunter x Hunter","Sensei","Ramen shop","Ninja","Samurai"] },
  harrypotter: { name: "Harry Potter", words: ["Hogwarts","Quidditch","Golden Snitch","Butterbeer","Dumbledore","Hermione","Voldemort","Dementor","Sorting Hat","Platform 9¾","Hagrid","Patronus","Invisibility Cloak","Gringotts","Hedwig","Polyjuice Potion","Diagon Alley","Snape","Horcrux","Hogsmeade","Marauder's Map","Dobby","Basilisk","Whomping Willow"] },
  disney: { name: "Disney and Pixar", words: ["Elsa","Simba","Woody","Buzz Lightyear","Nemo","Mickey Mouse","Aladdin","Moana","Genie","Rapunzel","Olaf","Stitch","Mulan","Cinderella","Wall-E","Lightning McQueen","Baloo","Scar","Ariel","Maui","Dory","Mike Wazowski","Belle","Pumbaa"] },
  games: { name: "Video games", words: ["Minecraft","Mario","Zelda","Fortnite","Among Us","Pac-Man","Tetris","Sonic","GTA","Roblox","Free Fire","BGMI","Candy Crush","Subway Surfers","Angry Birds","FIFA","Valorant","Call of Duty","Temple Run","Counter-Strike","Creeper","Battle royale","Joystick","Boss fight"] },
  movies: { name: "Movies and shows", words: ["Titanic","Avatar","Jurassic Park","Squid Game","Stranger Things","Sholay","3 Idiots","Baahubali","Frozen","The Lion King","Money Heist","Friends","Game of Thrones","Lord of the Rings","Batman","Inception","Interstellar","RRR","Dangal","Harry Potter","The Matrix","Breaking Bad","Naruto","Mission Impossible"] }
};

/* The imposter's look-alike word, in the same order as each pack's words above. */
const DECOYS = {
  animals: ["Hippo","Puffin","Squid","Zebra","Wallaby","Shark","Pheasant","Llama","Eagle","Lion","Alligator","Stork","Porcupine","Chipmunk","Python","Starfish","Koala","Bird","Hippo","Crow","Eel","Gorilla","Bison","Tortoise"],
  food: ["Flatbread","Sashimi","Crepe","Spaghetti","Hot dog","Caramel","Chips","Orange juice","Wrap","Frozen yogurt","Scrambled eggs","Momo","Macaroni","Melon","Tea","Butter","Papaya","Donut","Stew","Burrito","Muffin","Olive","Milkshake","Coleslaw"],
  places: ["Bus stand","Bookshop","Clinic","Theatre","Lake","Art gallery","Metro station","Aquarium","Mall","Arena","Cafe","Hostel","Ranch","Watchtower","Savannah","River","Park","Insurance office","Yoga studio","Palace","Peninsula","Forest","College","Courier office"],
  jobs: ["Nurse","Air hostess","Baker","Gardener","Professor","Welder","Police officer","Hairdresser","Scientist","Weaver","Notary","Technician","Editor","Surgeon","Mason","Clown","Courier","Sailor","Engineer","Driver","Dancer","Paramedic","Magistrate","Accountant"],
  objects: ["Raincoat","Hairbrush","Knife","Cushion","Window","Suitcase","Lamp","Game controller","Lock","Sunglasses","Mug","Pressure cooker","Stairs","Purse","Watch","Screwdriver","Mop","Armchair","Power bank","Earphones","Diary","Lantern","Quilt","Brush"],
  sports: ["Baseball","Rugby","Squash","Badminton","Diving","Ice hockey","Checkers","Kickboxing","Jogging","Kho-kho","Shooting","Netball","Judo","Mini golf","Handball","Rollerblading","Paddleboarding","Pickleball","Sprint","Yoga","Canoeing","Snowboarding","Horse racing","Billiards"],
  desi: ["Coffee","Taxi","Kachori","Navratri","Cyclone","Pulao","Uttapam","Kolam","Imarti","Bhel puri","Lohri","Red Fort","Lunchbox","Buttermilk","Hockey stick","Tattoo","Hollywood","Metro","Peepal tree","Balloon","Reception","Church bell","Lehenga","Snakes and ladders","Roti","Lemon pickle","Restaurant","Air cooler"],
  marvel: ["War Machine","Odin","Abomination","Gamora","Miles Morales","Falcon","Wong","Kang","Mysterio","Winter Soldier","Latveria","Tesseract","Star-Lord","Wasp","Drax","Cosmo","Cable","Sabretooth","Stormbreaker","Adamantium","Sanctum Sanctorum","Vision","Maria Hill","Ms Marvel","Red Skull","Xandar"],
  starwars: ["Vibroblade","Darth Maul","Mace Windu","Slave I","Starkiller Base","Jakku","Lando","Clone trooper","Padawan","Cassian Andor","Chopper","K-2SO","Porg","Boba Fett","Padme","TIE fighter","Greedo","Qui-Gon","Midichlorians","Gungan","Jawa","Endor","Anakin","Inquisitor","Bowcaster","D-O"],
  pokemon: ["Raichu","Dragonite","Ivysaur","Wartortle","Vaporeon","Slaking","Mew","Clefairy","Haunter","Feebas","Golduck","Persian","Riolu","Milotic","Great Ball","Misty","Team Aqua","Pokégear","Elite Four","Charmeleon","Pichu","Steelix","Sableye","Salamence","Poké Mart","Machop"],
  anime: ["Boruto","Vegeta","Zoro","Cardcaptor Sakura","Code Geass","Ponyo","Tokyo Ghoul","Jujutsu Kaisen","Perman","Chibi Maruko-chan","Howl's Moving Castle","Bleach","Fairy Tail","Meowth","Itachi","L","Nezuko","Pixar","Soul Eater","Yu Yu Hakusho","Senpai","Sushi bar","Assassin","Ronin"],
  harrypotter: ["Beauxbatons","Gobstones","Quaffle","Firewhisky","McGonagall","Luna","Grindelwald","Boggart","Goblet of Fire","Knight Bus","Filch","Animagus","Time-Turner","Ministry of Magic","Crookshanks","Veritaserum","Knockturn Alley","Lupin","Philosopher's Stone","Godric's Hollow","Pensieve","Kreacher","Acromantula","Forbidden Forest"],
  disney: ["Anna","Mufasa","Jessie","Woody","Marlin","Donald Duck","Hercules","Merida","Magic carpet","Tiana","Sven","Lilo","Pocahontas","Snow White","EVE","Mater","Mowgli","Jafar","Jasmine","Tamatoa","Bruce","Sulley","Aurora","Timon"],
  games: ["Terraria","Luigi","Skyrim","Apex Legends","Fall Guys","Donkey Kong","Puyo Puyo","Crash Bandicoot","Red Dead Redemption","Rec Room","PUBG","Call of Duty Mobile","Bejeweled","Jetpack Joyride","Cut the Rope","PES","Overwatch","Battlefield","Crossy Road","Rainbow Six","Enderman","Deathmatch","Gamepad","Mini boss"],
  movies: ["The Notebook","Dune","Jurassic World","Alice in Borderland","Dark","Deewar","Munna Bhai MBBS","KGF","Tangled","Jungle Book","Narcos","How I Met Your Mother","House of the Dragon","The Hobbit","Superman","Tenet","Gravity","Pushpa","Sultan","Percy Jackson","Blade Runner","Better Call Saul","Bleach","James Bond"]
};
for (const k of Object.keys(PACKS)) {
  if (!DECOYS[k] || DECOYS[k].length !== PACKS[k].words.length) throw new Error("Decoy list for " + k + " does not match its word list");
}

/* ---------- helpers ---------- */
const PACK_EMOJI = { animals: "🐘", food: "🍕", places: "🏛️", jobs: "🧑‍🍳", objects: "🔑", sports: "🏏", desi: "🪔", marvel: "🦸", starwars: "⚔️", pokemon: "⚡", anime: "🍥", harrypotter: "🪄", disney: "🏰", games: "🎮", movies: "🎬" };
const PACK_LIST = [{ key: "mix", name: "Mixed", emoji: "🎲" }].concat(Object.keys(PACKS).map((k) => ({ key: k, name: PACKS[k].name, emoji: PACK_EMOJI[k] || "🎯" })));
const AVATARS = ["🦊","🐼","🐸","🦉","🐙","🦄","🐲","🐯","🦁","🐵","🐧","🦈","🐺","🦅","🐢","🦋","🐝","🦖","🐻","🦇","🧙","🧛","🥷","🤖","👽","🔥","⚡","💀"];
const VOTE_TIMES = [0, 45, 90, 120];
const CLOSE_DELAY = 3000;

const lobbies = new Map();
const rid = (n) => crypto.randomBytes(n).toString("hex");
const pick = (a) => a[crypto.randomInt(a.length)];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const sameWord = (a, b) => { const x = norm(a), y = norm(b); return !!x && (x === y || x + "s" === y || y + "s" === x); };
const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);

function genCode() {
  for (let t = 0; t < 50; t++) {
    let c = ""; for (let i = 0; i < 5; i++) c += ALPHA[crypto.randomInt(ALPHA.length)];
    if (!lobbies.has(c)) return c;
  }
  return null;
}
class Fail extends Error { constructor(m, status) { super(m); this.status = status || 400; } }

function newLobby(code, hostId, hostName) {
  const l = {
    code, hostId, players: new Map(), phase: "lobby", round: 0, category: "", word: "", decoy: "",
    imposters: [], order: [], clues: {}, clueEdited: {}, votes: {}, guesses: {},
    vote: { stage: 1, candidates: null, deadline: 0, totalMs: 0, closeAt: 0 }, voteLog: [],
    settings: { pack: "mix", imposters: 1, voteTime: 90 }, result: null, scores: {}, used: [],
    chat: [], chatSeq: 0, lastChat: {}, clients: new Map(), touched: Date.now(), timer: null
  };
  l.players.set(hostId, { id: hostId, name: hostName, avatar: freeAvatar(l), joinedAt: Date.now() });
  lobbies.set(code, l);
  sys(l, hostName + " opened the lobby");
  return l;
}
function freeAvatar(l) {
  const used = new Set([...l.players.values()].map((p) => p.avatar));
  const open = AVATARS.filter((a) => !used.has(a));
  return pick(open.length ? open : AVATARS);
}
const present = (l, ids) => ids.filter((id) => l.players.has(id));
const sortedPlayers = (l) => [...l.players.values()].sort((a, b) => a.joinedAt - b.joinedAt || (a.id < b.id ? -1 : 1));
const clearTimer = (l) => { if (l.timer) { clearTimeout(l.timer); l.timer = null; } };

function trimChat(l) { if (l.chat.length > 150) l.chat.splice(0, l.chat.length - 150); }
function sys(l, text) { l.chat.push({ id: ++l.chatSeq, sys: true, text, ts: Date.now() }); trimChat(l); }
function addChat(l, pid, text) {
  const p = l.players.get(pid);
  l.chat.push({ id: ++l.chatSeq, pid, name: p.name, avatar: p.avatar, text, ts: Date.now(), edited: false });
  trimChat(l);
}

/* ---------- views: each player only gets what they may see ---------- */
function view(l, pid) {
  const inGame = l.phase !== "lobby";
  const isImp = l.imposters.includes(pid);
  const now = Date.now();
  const v = {
    code: l.code, me: pid, hostId: l.hostId, phase: l.phase, round: l.round,
    settings: l.settings, packs: PACK_LIST, avatars: AVATARS, voteTimes: VOTE_TIMES, max: MAX_PLAYERS,
    players: sortedPlayers(l).map((p) => ({
      id: p.id, name: p.name, avatar: p.avatar, score: l.scores[p.id] || 0,
      guessed: l.guesses[p.id] !== undefined, voted: !!l.votes[p.id]
    })),
    chat: l.chat.slice(-80).map((m) => ({ id: m.id, sys: !!m.sys, pid: m.pid || null, name: m.name || "", avatar: m.avatar || "", text: m.text, ts: m.ts, edited: !!m.edited }))
  };
  if (inGame) {
    v.category = l.category;
    // Nobody is told they are the imposter until the vote is in.
    v.isImposter = isImp && (l.phase === "guess" || l.phase === "reveal");
    v.word = isImp ? l.decoy : l.word;
    v.order = present(l, l.order);
    v.clues = {};
    for (const id of v.order) if (l.clues[id]) v.clues[id] = l.clues[id];
    v.edited = Object.keys(l.clueEdited).filter((id) => l.clues[id] && l.players.has(id));
    v.myVote = l.votes[pid] || null;
    v.votesIn = [...l.players.keys()].filter((id) => l.votes[id]).length;
    if (l.phase === "vote") {
      v.vote = {
        stage: l.vote.stage, candidates: l.vote.candidates, totalMs: l.vote.totalMs,
        deadlineIn: l.vote.deadline ? Math.max(0, l.vote.deadline - now) : 0,
        closingIn: l.vote.closeAt ? Math.max(0, l.vote.closeAt - now) : 0
      };
    }
    if (l.phase === "guess" && l.result) v.top = l.result.top;
    if (l.phase === "reveal" && l.result) {
      v.reveal = Object.assign({}, l.result, {
        word: l.word, decoy: l.decoy, imposters: l.imposters,
        log: l.voteLog.map((e) => ({ stage: e.stage, candidates: e.candidates, votes: e.votes, tally: e.tally }))
      });
    }
  }
  return v;
}
function send(res, event, data) {
  if (event) res.write("event: " + event + "\n");
  res.write("data: " + JSON.stringify(data) + "\n\n");
}
function broadcast(l) {
  for (const [pid, set] of l.clients) {
    if (!l.players.has(pid)) continue;
    const v = view(l, pid);
    for (const res of set) send(res, null, v);
  }
}
function closeClients(l, pid, event) {
  const set = l.clients.get(pid); if (!set) return;
  for (const res of set) { try { send(res, event, {}); res.end(); } catch (e) {} }
  l.clients.delete(pid);
}

/* ---------- game logic ---------- */
function startRound(l) {
  const ids = sortedPlayers(l).map((p) => p.id);
  if (ids.length < 3) throw new Fail("You need at least 3 players.");
  clearTimer(l);
  let key = l.settings.pack;
  if (key === "mix" || !PACKS[key]) key = pick(Object.keys(PACKS));
  const pack = PACKS[key];
  let pool = pack.words.filter((w) => !l.used.includes(w));
  if (!pool.length) pool = pack.words;
  const word = pick(pool);
  const k = ids.length >= 6 ? Math.min(2, l.settings.imposters || 1) : 1;
  l.used = l.used.slice(-60).concat([word]);
  l.phase = "clues"; l.round += 1; l.category = pack.name; l.word = word;
  l.decoy = DECOYS[key][pack.words.indexOf(word)];
  l.imposters = shuffle(ids.slice()).slice(0, k);
  l.order = shuffle(ids.slice());
  l.clues = {}; l.clueEdited = {}; l.votes = {}; l.guesses = {}; l.result = null; l.voteLog = [];
  l.vote = { stage: 1, candidates: null, deadline: 0, totalMs: 0, closeAt: 0 };
  sys(l, "Round " + l.round + " begins. Category: " + pack.name + ".");
}
function openVoting(l) {
  l.phase = "vote"; l.votes = {}; l.voteLog = [];
  l.vote = { stage: 1, candidates: null, deadline: 0, totalMs: 0, closeAt: 0 };
  armVote(l);
  sys(l, "Voting is open. Choose wisely.");
}
function armVote(l) {
  clearTimer(l);
  l.vote.closeAt = 0;
  const t = l.settings.voteTime || 0;
  const secs = l.vote.stage === 2 ? (t ? Math.min(t, 45) : 0) : t;
  l.vote.totalMs = secs * 1000;
  l.vote.deadline = secs ? Date.now() + secs * 1000 : 0;
  if (secs) l.timer = setTimeout(() => autoClose(l), secs * 1000);
}
function autoClose(l) {
  l.timer = null;
  if (!lobbies.has(l.code) || l.phase !== "vote") return;
  try { closeVoting(l); } catch (e) { console.error(e); }
  broadcast(l);
}
function checkAllVoted(l) {
  if (l.phase !== "vote" || l.vote.closeAt) return;
  const ids = [...l.players.keys()];
  if (ids.length && ids.every((id) => l.votes[id])) {
    clearTimer(l);
    l.vote.deadline = 0;
    l.vote.closeAt = Date.now() + CLOSE_DELAY;
    l.timer = setTimeout(() => autoClose(l), CLOSE_DELAY);
  }
}
function closeVoting(l) {
  clearTimer(l);
  l.vote.closeAt = 0; l.vote.deadline = 0;
  const tally = {};
  for (const [voter, target] of Object.entries(l.votes)) {
    if (l.players.has(voter) && target !== "skip" && l.players.has(target) && voter !== target) tally[target] = (tally[target] || 0) + 1;
  }
  l.voteLog.push({ stage: l.vote.stage, candidates: l.vote.candidates, votes: Object.assign({}, l.votes), tally });
  const e = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  let top = null, tied = [];
  if (e.length) {
    if (e.length === 1 || e[0][1] > e[1][1]) top = e[0][0];
    else tied = e.filter((x) => x[1] === e[0][1]).map((x) => x[0]);
  }
  if (!top && tied.length > 1 && l.vote.stage === 1) {
    l.vote = { stage: 2, candidates: tied, deadline: 0, totalMs: 0, closeAt: 0 };
    l.votes = {};
    armVote(l);
    sys(l, "Tie! Runoff vote between " + tied.map((id) => l.players.get(id).name).join(" and ") + ".");
    return;
  }
  const caught = !!top && l.imposters.includes(top);
  l.result = { tally, top, caught };
  if (caught && present(l, l.imposters).length) { l.phase = "guess"; sys(l, l.players.get(top).name + " was caught. One last guess..."); }
  else finalize(l);
}
function finalize(l) {
  clearTimer(l);
  const res = l.result || { tally: {}, top: null, caught: false };
  const guesses = {};
  for (const id of l.imposters) if (l.guesses[id]) guesses[id] = l.guesses[id];
  const guessCorrect = !!res.caught && Object.values(guesses).some((g) => sameWord(g, l.word));
  const winner = res.caught && !guessCorrect ? "crew" : "imposters";
  const delta = {};
  for (const id of l.players.keys()) {
    const imp = l.imposters.includes(id);
    delta[id] = winner === "crew" ? (imp ? 0 : 2) : (imp ? 3 : 0);
    l.scores[id] = (l.scores[id] || 0) + delta[id];
  }
  l.result = { tally: res.tally || {}, top: res.top || null, caught: !!res.caught, guesses, guessCorrect, winner, delta };
  l.phase = "reveal";
  sys(l, winner === "crew" ? "The crew wins round " + l.round + "!" : "The imposters win round " + l.round + "!");
}
function maybeFinishGuess(l) {
  if (l.phase !== "guess") return;
  const imps = present(l, l.imposters);
  if (!imps.length || imps.every((id) => l.guesses[id] !== undefined)) finalize(l);
}

function act(l, pid, body) {
  const host = l.hostId === pid;
  const me = l.players.get(pid);
  const need = (ok, msg) => { if (!ok) throw new Fail(msg || "Not allowed right now.", 403); };
  switch (body.type) {
    case "settings": {
      need(host && l.phase === "lobby");
      const p = String(body.pack || "mix"), vt = Number(body.voteTime);
      l.settings = { pack: p === "mix" || PACKS[p] ? p : "mix", imposters: Number(body.imposters) === 2 ? 2 : 1, voteTime: VOTE_TIMES.includes(vt) ? vt : 90 };
      break;
    }
    case "kick": {
      need(host && l.phase === "lobby");
      const t = String(body.target || "");
      need(t !== pid && l.players.has(t));
      sys(l, l.players.get(t).name + " was removed");
      l.players.delete(t); delete l.scores[t];
      closeClients(l, t, "kicked");
      break;
    }
    case "rename": {
      const name = clean(body.name, 16);
      if (!name) throw new Fail("Names can't be empty.");
      me.name = name;
      l.chat.forEach((m) => { if (m.pid === pid) m.name = name; });
      break;
    }
    case "avatar": {
      const a = String(body.avatar || "");
      need(AVATARS.includes(a));
      me.avatar = a;
      l.chat.forEach((m) => { if (m.pid === pid) m.avatar = a; });
      break;
    }
    case "resetScores": need(host); l.scores = {}; break;
    case "start": need(host && (l.phase === "lobby" || l.phase === "reveal")); startRound(l); break;
    case "clue": {
      need(l.phase === "clues");
      const text = clean(body.text, 24);
      if (!text) throw new Fail("Type a clue first.");
      if (sameWord(text, l.imposters.includes(pid) ? l.decoy : l.word)) throw new Fail("That's your secret word. Pick a different clue.");
      if (l.clues[pid]) { l.clues[pid] = text; l.clueEdited[pid] = true; break; }
      const next = present(l, l.order).find((id) => !l.clues[id]);
      need(next === pid, "It's not your turn yet.");
      l.clues[pid] = text;
      break;
    }
    case "toVote": need(host && l.phase === "clues"); openVoting(l); break;
    case "vote": {
      need(l.phase === "vote");
      const t = String(body.target || "");
      if (t !== "skip") {
        need(t !== pid && l.players.has(t));
        need(!l.vote.candidates || l.vote.candidates.includes(t), "Vote for one of the tied players.");
      }
      l.votes[pid] = t;
      checkAllVoted(l);
      break;
    }
    case "closeVote": need(host && l.phase === "vote"); closeVoting(l); break;
    case "guess": {
      need(l.phase === "guess" && l.imposters.includes(pid) && l.guesses[pid] === undefined);
      const text = clean(body.text, 30);
      if (!text) throw new Fail("Type your guess first.");
      l.guesses[pid] = text;
      maybeFinishGuess(l);
      break;
    }
    case "skipGuess": need(host && l.phase === "guess"); finalize(l); break;
    case "backLobby": need(host && l.phase === "reveal"); l.phase = "lobby"; break;
    case "chat": {
      const text = clean(body.text, 200);
      if (!text) throw new Fail("Type a message first.");
      const now = Date.now();
      if (now - (l.lastChat[pid] || 0) < 500) throw new Fail("Slow down a little.", 429);
      l.lastChat[pid] = now;
      addChat(l, pid, text);
      break;
    }
    case "chatEdit": {
      const m = l.chat.find((x) => x.id === Number(body.id) && x.pid === pid);
      need(!!m);
      const text = clean(body.text, 200);
      if (!text) throw new Fail("A message can't be empty. Delete it instead.");
      m.text = text; m.edited = true;
      break;
    }
    case "chatDel": {
      const i = l.chat.findIndex((x) => x.id === Number(body.id) && x.pid === pid);
      need(i >= 0);
      l.chat.splice(i, 1);
      break;
    }
    case "leave": {
      if (host) {
        clearTimer(l);
        for (const id of [...l.clients.keys()]) closeClients(l, id, "closed");
        lobbies.delete(l.code);
        return false;
      }
      sys(l, me.name + " left");
      l.players.delete(pid); delete l.votes[pid];
      closeClients(l, pid, "left");
      maybeFinishGuess(l);
      checkAllVoted(l);
      break;
    }
    default: throw new Fail("Unknown action.");
  }
  return true;
}

/* ---------- http ---------- */
function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > 10000) { reject(new Fail("Request too large.", 413)); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || "{}")); } catch (e) { reject(new Fail("Bad request.")); } });
    req.on("error", reject);
  });
}
function json(res, status, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(s);
}
function getLobby(code) { const l = lobbies.get(String(code || "").toUpperCase()); if (!l) throw new Fail("No lobby with that code.", 404); l.touched = Date.now(); return l; }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
      return res.end(HTML);
    }
    if (req.method === "GET" && url.pathname === "/healthz") return json(res, 200, { ok: true, lobbies: lobbies.size });

    if (req.method === "GET" && url.pathname === "/events") {
      const l = getLobby(url.searchParams.get("code")); const pid = url.searchParams.get("pid") || "";
      if (!l.players.has(pid)) throw new Fail("You are not in this lobby.", 404);
      res.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "Connection": "keep-alive", "X-Accel-Buffering": "no" });
      res.write("retry: 2000\n\n");
      if (!l.clients.has(pid)) l.clients.set(pid, new Set());
      l.clients.get(pid).add(res);
      send(res, null, view(l, pid));
      const beat = setInterval(() => { try { res.write(": ping\n\n"); } catch (e) {} }, 15000);
      req.on("close", () => { clearInterval(beat); const set = l.clients.get(pid); if (set) { set.delete(res); if (!set.size) l.clients.delete(pid); } });
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/state") {
      const l = getLobby(url.searchParams.get("code")); const pid = url.searchParams.get("pid") || "";
      if (!l.players.has(pid)) throw new Fail("You are not in this lobby.", 404);
      return json(res, 200, view(l, pid));
    }
    if (req.method === "POST" && url.pathname === "/api/create") {
      const b = await readJson(req); const name = clean(b.name, 16);
      if (!name) throw new Fail("Enter your name first.");
      if (lobbies.size >= 500) throw new Fail("The server is busy. Try again in a few minutes.", 503);
      const code = genCode(); if (!code) throw new Fail("Couldn't find a free code. Try again.", 503);
      const pid = rid(12); newLobby(code, pid, name);
      return json(res, 200, { code, pid });
    }
    if (req.method === "POST" && url.pathname === "/api/join") {
      const b = await readJson(req); const name = clean(b.name, 16);
      if (!name) throw new Fail("Enter your name first.");
      const l = getLobby(b.code);
      if (b.pid && l.players.has(b.pid)) { l.players.get(b.pid).name = name; broadcast(l); return json(res, 200, { code: l.code, pid: b.pid }); }
      if (l.phase !== "lobby") throw new Fail("That game already started. Ask the host to go back to the lobby.", 409);
      if (l.players.size >= MAX_PLAYERS) throw new Fail("That lobby is full (" + MAX_PLAYERS + " players).", 409);
      const pid = rid(12);
      l.players.set(pid, { id: pid, name, avatar: freeAvatar(l), joinedAt: Date.now() });
      sys(l, name + " joined the lobby");
      broadcast(l);
      return json(res, 200, { code: l.code, pid });
    }
    if (req.method === "POST" && url.pathname === "/api/act") {
      const b = await readJson(req); const l = getLobby(b.code);
      if (!l.players.has(String(b.pid))) throw new Fail("You are not in this lobby.", 404);
      const alive = act(l, String(b.pid), b);
      if (alive !== false) broadcast(l);
      return json(res, 200, { ok: true });
    }
    json(res, 404, { error: "Not found." });
  } catch (e) {
    const status = e instanceof Fail ? e.status : 500;
    if (!(e instanceof Fail)) console.error(e);
    if (res.headersSent) { try { res.end(); } catch (x) {} return; }
    json(res, status, { error: e instanceof Fail ? e.message : "Something went wrong." });
  }
});

setInterval(() => {
  const cutoff = Date.now() - 8 * 3600 * 1000;
  for (const [code, l] of lobbies) if (l.touched < cutoff && !l.clients.size) { clearTimer(l); lobbies.delete(code); }
}, 600000).unref();

server.listen(PORT, () => console.log("Imposter Lineup is running on port " + PORT));

/* ---------- the game page ---------- */
const HTML = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#090514">
<title>Imposter Lineup</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800;900&family=Exo+2:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>
/* Legendary vault: a midnight violet world with gold foil, loot-card rarity and ember glow. One committed dark theme. */
@property --ang { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
:root {
  --void: #090514; --abyss: #120a26; --panel: #1a1033; --panel-2: #251548; --line: #3b2a6b;
  --text: #f4eeff; --muted: #a99bd1; --gold: #f7c948; --gold-2: #ffe08a; --gold-deep: #a8741a;
  --ember: #ff6b3d; --arcane: #8a6bff; --ice: #55e0ff; --ok: #4de2a0; --danger: #ff4d6d; --focus: #55e0ff;
  --display: "Cinzel", "Trajan Pro", "Times New Roman", serif;
  --body: "Exo 2", system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "Share Tech Mono", ui-monospace, Menlo, Consolas, monospace;
  color-scheme: dark;
}
* { box-sizing: border-box; }
html { background: var(--void); }
body {
  margin: 0; color: var(--text); font: 500 16px/1.45 var(--body); background: transparent; min-height: 100vh;
  padding-block: 0 56px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));
}
body::before {
  content: ""; position: fixed; inset: 0; z-index: -2;
  background:
    radial-gradient(900px 520px at 12% -8%, rgba(138,107,255,.38), transparent 60%),
    radial-gradient(700px 520px at 105% 8%, rgba(255,107,61,.20), transparent 60%),
    radial-gradient(900px 600px at 50% 125%, rgba(85,224,255,.15), transparent 60%),
    var(--void);
}
body::after {
  content: ""; position: fixed; inset: -200px 0 0 0; z-index: -1; opacity: .6; pointer-events: none;
  background-image:
    radial-gradient(1.5px 1.5px at 20px 30px, #fff, transparent),
    radial-gradient(1px 1px at 90px 120px, #cbbcff, transparent),
    radial-gradient(1.5px 1.5px at 150px 60px, #ffe08a, transparent),
    radial-gradient(1px 1px at 60px 170px, #fff, transparent);
  background-size: 200px 200px; animation: drift 140s linear infinite;
}
@keyframes drift { to { background-position: 0 200px; } }
[hidden] { display: none !important; }
.wrap { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
button, input, select { font: inherit; color: inherit; }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

/* crest */
.crest { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 26px 0 14px; position: relative; }
.crest.compact { padding: 14px 0 8px; }
.crest .name { display: flex; flex-direction: column; gap: 4px; }
.crest h1 {
  margin: 0; font: 900 40px/1 var(--display); letter-spacing: .06em; text-transform: uppercase;
  background: linear-gradient(180deg, #fff3bf 0%, #f7c948 48%, #a8741a 100%); -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 2px 14px rgba(247,201,72,.35));
}
.crest.compact h1 { font-size: 24px; }
.crest .motto { margin: 0; font: 600 12px/1 var(--mono); letter-spacing: .22em; text-transform: uppercase; color: var(--muted); }
.crest.compact .motto { display: none; }
.crest::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--gold), transparent); }
#roomchip { display: flex; align-items: center; gap: 8px; }
#roomchip .mono { font: 400 16px var(--mono); letter-spacing: .18em; color: var(--gold-2); border: 1px solid var(--gold-deep); background: rgba(247,201,72,.08); padding: 6px 10px; border-radius: 8px; }

/* panels */
.panel {
  position: relative; display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 14px;
  background: linear-gradient(180deg, rgba(37,21,72,.88), rgba(26,16,51,.94)); border: 1px solid var(--line);
  box-shadow: 0 12px 32px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06);
}
.panel::before {
  content: ""; position: absolute; inset: -1px; border-radius: 14px; padding: 1px; pointer-events: none;
  background: linear-gradient(135deg, rgba(247,201,72,.75), transparent 28%, transparent 72%, rgba(138,107,255,.75));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
}
.panel h2 { margin: 0; font: 800 22px/1.1 var(--display); letter-spacing: .05em; text-transform: uppercase; color: var(--gold-2); }
.eyebrow { margin: 0; font: 400 13px/1 var(--mono); letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
.hint { margin: 0; color: var(--muted); font-size: 15px; }
.err { margin: 0; color: var(--danger); font-weight: 600; min-height: 1.45em; }
.view { display: flex; flex-direction: column; gap: 16px; }

/* controls */
label.fld { display: flex; flex-direction: column; gap: 6px; font: 400 12px/1 var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
input[type=text], select {
  width: 100%; min-height: 48px; padding: 10px 12px; font-size: 17px; color: var(--text);
  background: rgba(9,5,20,.7); border: 1px solid var(--line); border-radius: 10px;
}
input[type=text]:focus, select:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(247,201,72,.2); outline: none; }
input.codein { font: 400 26px var(--mono); letter-spacing: .3em; text-transform: uppercase; text-align: center; }
select option { background: var(--panel); color: var(--text); }
.row { display: flex; gap: 10px; flex-wrap: wrap; }
.row > * { flex: 1 1 0; min-width: 0; }
.btn {
  position: relative; overflow: hidden; min-height: 48px; padding: 10px 18px; cursor: pointer; border-radius: 10px;
  font: 800 15px/1.1 var(--display); letter-spacing: .1em; text-transform: uppercase; color: var(--text);
  background: linear-gradient(180deg, #2d1b57, #1f1240); border: 1px solid var(--line);
  transition: transform .12s, box-shadow .2s, border-color .2s;
}
.btn:hover:not(:disabled) { border-color: var(--gold); box-shadow: 0 0 18px rgba(247,201,72,.25); }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn.primary { color: #2a1700; border-color: #ffe9a8; background: linear-gradient(180deg, #ffe08a, #f7c948 55%, #d89b1d); box-shadow: 0 4px 0 var(--gold-deep), 0 10px 26px rgba(247,201,72,.28); }
.btn.primary:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 var(--gold-deep); }
.btn.primary::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,.55) 50%, transparent 65%); transform: translateX(-120%); animation: shine 3.4s ease-in-out infinite; }
@keyframes shine { 0%, 55% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
.btn.small { min-height: 38px; padding: 7px 12px; font-size: 13px; }
.btn.danger { background: linear-gradient(180deg, #ff6f87, #d2354f); border-color: transparent; color: #fff; }
.or { display: flex; align-items: center; gap: 10px; color: var(--muted); font: 400 12px var(--mono); letter-spacing: .16em; text-transform: uppercase; }
.or::before, .or::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--line)); }
.or::after { transform: scaleX(-1); }
details.how { border-top: 1px solid var(--line); padding-top: 12px; }
details.how summary { cursor: pointer; font: 400 13px var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
details.how ol { margin: 10px 0 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; color: var(--text); }

/* lobby */
.codebox { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.plaque { margin: 0; font: 400 54px/1 var(--mono); letter-spacing: .2em; color: var(--gold-2); text-shadow: 0 0 22px rgba(247,201,72,.55); }
ul.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.slot {
  display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center; gap: 10px; width: 100%; text-align: left;
  padding: 8px 12px 8px 8px; background: rgba(9,5,20,.55); border: 1px solid var(--line); border-radius: 12px; animation: rise .3s ease-out;
}
.slot .no { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; font: 800 20px/1 var(--display); color: var(--gold-2); background: radial-gradient(circle at 30% 25%, #3a2570, #170c33); border: 1px solid var(--gold-deep); }
.slot .no.av { font-size: 24px; }
.slot .who { min-width: 0; overflow-wrap: anywhere; font-weight: 600; }
.slot .end, .slot .clue { font-weight: 500; text-align: right; overflow-wrap: anywhere; }
.slot .clue { font: 700 17px var(--body); color: var(--gold-2); }
.slot .clue i { color: var(--muted); font-weight: 400; }
.slot small { display: block; color: var(--muted); font-weight: 400; font-size: 13px; }
.slot.cur { border-color: var(--gold); background: rgba(247,201,72,.1); box-shadow: 0 0 20px rgba(247,201,72,.2); }
.slot.imp { border-color: var(--danger); background: rgba(255,77,109,.1); }
.tag { display: inline-block; font: 400 10px/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; padding: 3px 6px; margin-left: 6px; border-radius: 6px; border: 1px solid var(--gold-deep); color: var(--gold-2); background: rgba(247,201,72,.08); vertical-align: middle; font-style: normal; }
.tier { display: inline-block; font: 700 11px/1 var(--display); letter-spacing: .08em; text-transform: uppercase; padding: 4px 8px; border-radius: 99px; margin-right: 6px; }
.tier.rookie { color: var(--muted); border: 1px solid var(--line); }
.tier.rare { color: #bff1ff; border: 1px solid #3aa9c9; background: rgba(85,224,255,.12); }
.tier.epic { color: #dccfff; border: 1px solid var(--arcane); background: rgba(138,107,255,.2); }
.tier.legend { color: #3a2200; border: 1px solid #fff0b0; background: linear-gradient(180deg, #ffe08a, #f7c948); box-shadow: 0 0 14px rgba(247,201,72,.5); }
.x { width: 34px; height: 34px; margin-left: 8px; border: 1px solid var(--line); background: rgba(255,255,255,.05); border-radius: 8px; cursor: pointer; font-size: 15px; line-height: 1; }
.x:hover { border-color: var(--gold); }
.pts { font: 800 18px var(--display); color: var(--gold-2); }
.pts em { font-style: normal; color: var(--ok); margin-right: 6px; }
.avgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 6px; }
.avgrid button { height: 44px; font-size: 24px; border-radius: 10px; border: 1px solid var(--line); background: rgba(9,5,20,.6); cursor: pointer; }
.avgrid button[aria-pressed=true] { border-color: var(--gold); background: rgba(247,201,72,.15); box-shadow: 0 0 14px rgba(247,201,72,.35); }

/* game */
.phase { display: flex; gap: 8px; flex-wrap: wrap; }
.chip { font: 400 13px/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; padding: 8px 11px; border: 1px solid var(--line); border-radius: 99px; background: rgba(9,5,20,.6); color: var(--muted); }
.chip.hot { color: #2a1700; border-color: #ffe9a8; background: linear-gradient(180deg, #ffe08a, #f7c948); font-weight: 700; }
.relic { display: block; width: 100%; padding: 3px; border: 0; border-radius: 20px; cursor: pointer; text-align: left; color: inherit; background: conic-gradient(from var(--ang), #f7c948, #8a6bff, #55e0ff, #ff6b3d, #f7c948); animation: spin 7s linear infinite; box-shadow: 0 0 34px rgba(138,107,255,.4); }
@keyframes spin { to { --ang: 360deg; } }
.relic-in {
  position: relative; overflow: hidden; min-height: 200px; padding: 20px; border-radius: 17px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center;
  background: radial-gradient(circle at 30% 0%, rgba(138,107,255,.4), transparent 55%), radial-gradient(circle at 80% 100%, rgba(255,107,61,.22), transparent 55%), linear-gradient(180deg, #1c1038, #0f0723);
}
.relic-in::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(115deg, transparent 38%, rgba(255,255,255,.14) 50%, transparent 62%); transform: translateX(-130%); animation: shine 4.5s ease-in-out infinite; }
.relic.covered .relic-in { background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(138,107,255,.18) 0 15deg, transparent 15deg 30deg), linear-gradient(180deg, #1c1038, #0f0723); }
.relic .sigil { font-size: 54px; line-height: 1; filter: drop-shadow(0 0 14px rgba(138,107,255,.8)); }
.relic .cover { font: 800 22px/1.15 var(--display); letter-spacing: .08em; text-transform: uppercase; color: var(--gold-2); }
.relic .sub { color: var(--muted); font-size: 14px; }
.relic .lbl { font: 400 12px var(--mono); letter-spacing: .2em; text-transform: uppercase; color: var(--muted); }
.relic .word { font: 900 44px/1.05 var(--display); letter-spacing: .04em; text-transform: uppercase; overflow-wrap: anywhere; background: linear-gradient(180deg, #fff3bf, #f7c948 55%, #c98a1c); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 2px 12px rgba(247,201,72,.4)); }
.relic .cat { font-size: 14px; color: var(--text); }

/* voting */
.timer { display: flex; flex-direction: column; gap: 6px; }
.timer .track { height: 10px; border-radius: 99px; background: rgba(255,255,255,.1); overflow: hidden; }
.timer .track i { display: block; height: 100%; width: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--ember), var(--gold)); transition: width .25s linear; }
.timer span { font: 400 13px var(--mono); letter-spacing: .08em; color: var(--gold-2); }
.suspect {
  display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center; gap: 10px; width: 100%; text-align: left; cursor: pointer;
  padding: 10px 12px 10px 8px; border-radius: 12px; border: 1px solid var(--line); background: rgba(9,5,20,.55); transition: border-color .2s, box-shadow .2s, transform .12s;
}
.suspect:hover { border-color: var(--gold); }
.suspect:active { transform: scale(.985); }
.suspect .no { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; font-size: 24px; background: radial-gradient(circle at 30% 25%, #3a2570, #170c33); border: 1px solid var(--gold-deep); }
.suspect .who { min-width: 0; overflow-wrap: anywhere; font-weight: 700; }
.suspect .who small { display: block; margin-top: 2px; font-weight: 500; color: var(--gold-2); font-size: 14px; }
.suspect.picked { border-color: var(--danger); background: rgba(255,77,109,.14); box-shadow: 0 0 22px rgba(255,77,109,.35); }
.stamp { display: inline-block; font: 900 13px/1.1 var(--display); letter-spacing: .1em; text-transform: uppercase; padding: 4px 8px; border: 2px solid var(--danger); color: var(--danger); border-radius: 6px; transform: rotate(-5deg); }
.stamp.gold { border-color: var(--gold); color: var(--gold-2); }
.stamp.ok { border-color: var(--ok); color: var(--ok); }
.ballot { display: flex; flex-wrap: wrap; gap: 10px; }
.ballot .b { display: flex; flex-direction: column; align-items: center; gap: 3px; width: 54px; font-size: 11px; color: var(--muted); text-align: center; overflow: hidden; }
.ballot .circ { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; font-size: 21px; border: 2px solid var(--line); filter: grayscale(1); opacity: .55; transition: all .3s; }
.ballot .b.done .circ { filter: none; opacity: 1; border-color: var(--ok); box-shadow: 0 0 14px rgba(77,226,160,.55); }
.ballot .b.done { color: var(--ok); }
.rbar { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 10px; align-items: center; }
.rbar .no { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; font-size: 24px; background: radial-gradient(circle at 30% 25%, #3a2570, #170c33); border: 1px solid var(--gold-deep); }
.rbar .meta { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.rbar .top { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-weight: 700; }
.rbar .top span { overflow-wrap: anywhere; min-width: 0; }
.rbar .track { height: 10px; border-radius: 99px; background: rgba(255,255,255,.08); overflow: hidden; }
.rbar .track i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--arcane), var(--ice)); }
.rbar.is-imp .track i { background: linear-gradient(90deg, var(--ember), var(--danger)); }
.rbar .voters { font-size: 18px; letter-spacing: 2px; min-height: 22px; }

/* result */
.verdict { margin: 0; font: 900 46px/.95 var(--display); letter-spacing: .05em; text-transform: uppercase; }
.verdict.crew { color: var(--ok); text-shadow: 0 0 28px rgba(77,226,160,.5); }
.verdict.imp { color: var(--danger); text-shadow: 0 0 28px rgba(255,77,109,.5); }
dl.facts { margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
dl.facts div { border-top: 1px solid var(--gold-deep); padding-top: 6px; min-width: 0; }
dl.facts dt { font: 400 11px var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
dl.facts dd { margin: 2px 0 0; font: 800 22px/1.1 var(--display); letter-spacing: .03em; text-transform: uppercase; overflow-wrap: anywhere; color: var(--gold-2); }

/* chat */
.chat-head { display: flex; align-items: center; gap: 8px; width: 100%; background: none; border: 0; padding: 0; cursor: pointer; text-align: left; }
.chat-head .t { flex: 1; font: 800 20px/1 var(--display); letter-spacing: .05em; text-transform: uppercase; color: var(--gold-2); }
.badge { min-width: 24px; padding: 4px 7px; border-radius: 99px; text-align: center; font: 700 12px/1 var(--body); color: #fff; background: var(--danger); }
.chev { transition: transform .2s; color: var(--muted); }
.chat-head[aria-expanded=false] .chev { transform: rotate(-90deg); }
.msgs { list-style: none; margin: 0; padding: 4px 2px; display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; overscroll-behavior: contain; }
.msg { display: flex; gap: 8px; align-items: flex-start; }
.msg .av { flex: none; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; font-size: 19px; background: radial-gradient(circle at 30% 25%, #3a2570, #170c33); border: 1px solid var(--gold-deep); }
.msg .bub { min-width: 0; max-width: calc(100% - 44px); padding: 7px 11px; border-radius: 4px 14px 14px 14px; background: rgba(255,255,255,.07); border: 1px solid var(--line); }
.msg.mine { flex-direction: row-reverse; }
.msg.mine .bub { border-radius: 14px 4px 14px 14px; background: rgba(247,201,72,.12); border-color: var(--gold-deep); }
.msg .nm { font-size: 12px; font-weight: 700; color: var(--gold-2); }
.msg time { font-size: 11px; color: var(--muted); margin-left: 6px; }
.msg p { margin: 2px 0 0; overflow-wrap: anywhere; }
.msg em { color: var(--muted); font-size: 12px; font-style: normal; }
.msg .tools { display: inline-flex; gap: 2px; margin-left: 6px; }
.msg .tools button { border: 0; background: none; cursor: pointer; font-size: 13px; padding: 2px 4px; opacity: .75; }
.msg .tools button:hover { opacity: 1; }
.msg.sys { justify-content: center; color: var(--muted); font-size: 13px; font-style: italic; text-align: center; }
.emojis { display: flex; gap: 4px; flex-wrap: wrap; }
.emojis button { font-size: 20px; width: 40px; height: 36px; border-radius: 8px; border: 1px solid var(--line); background: rgba(9,5,20,.5); cursor: pointer; }
.emojis button:hover { border-color: var(--gold); }

#toast { position: fixed; left: 50%; bottom: calc(18px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); max-width: min(92vw, 420px); padding: 11px 18px; border-radius: 12px; font-weight: 600; z-index: 40; color: #2a1700; background: linear-gradient(180deg, #ffe08a, #f7c948); box-shadow: 0 10px 30px rgba(0,0,0,.5); }
@keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@media (max-width: 420px) { .crest h1 { font-size: 31px; } .plaque { font-size: 42px; } .verdict { font-size: 38px; } .relic .word { font-size: 36px; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
</style>
</head>
<body>
<div class="wrap">
  <header class="crest" id="top">
    <div class="name">
      <h1>Imposter Lineup</h1>
      <p class="motto">Trust no one. Become a legend.</p>
    </div>
    <div id="roomchip" hidden>
      <span class="mono" id="chipcode"></span>
      <button type="button" class="btn small" id="leaveBtn">Leave</button>
    </div>
  </header>

  <section class="view" id="v-home">
    <div class="panel">
      <label class="fld" for="name">Your name
        <input type="text" id="name" maxlength="16" autocomplete="nickname" placeholder="Name your legend">
      </label>
      <button type="button" class="btn primary" id="createBtn">⚔️ Create a lobby</button>
      <div class="or">or join your party</div>
      <div class="row">
        <input type="text" class="codein" id="joincode" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="CODE" aria-label="Lobby code" style="flex: 2 1 0;">
        <button type="button" class="btn" id="joinBtn" style="flex: 1 1 0;">🚪 Join</button>
      </div>
      <p class="err" id="homeErr" role="alert"></p>
      <details class="how">
        <summary>📜 How to play</summary>
        <ol>
          <li>One player creates a lobby and shares the 5-letter code. Everyone else joins with it.</li>
          <li>Everyone gets a secret word from the same category. Most players share one word, but the imposter gets a similar one and doesn't know it.</li>
          <li>Take turns giving a one-word clue. Made a typo? Tap ✏️ to fix it until voting opens.</li>
          <li>Chat freely, then vote. A tie triggers a runoff. If the imposter is caught, they get one guess at the crew's word.</li>
          <li>Crew scores 2 points each for a clean catch. Imposters score 3 for escaping or guessing the word. Climb from Rookie to Legendary.</li>
        </ol>
      </details>
    </div>
  </section>

  <section class="view" id="v-lobby" hidden>
    <div class="panel">
      <p class="eyebrow">🏰 Lobby code</p>
      <div class="codebox">
        <p class="plaque" id="codeText"></p>
        <button type="button" class="btn small" id="copyBtn">📋 Copy code</button>
      </div>
      <p class="hint">Friends open this page, enter the code and tap Join.</p>
      <button type="button" class="btn small" id="copyLink">🔗 Copy page link</button>
    </div>

    <div class="panel">
      <div class="codebox">
        <h2>🛡️ The party</h2>
        <p class="eyebrow" id="pcount"></p>
      </div>
      <ul class="list" id="plist"></ul>
    </div>

    <div class="panel">
      <h2>🎭 Your card</h2>
      <p class="hint">Pick your emblem and fix your name any time before the round starts.</p>
      <div class="avgrid" id="avgrid" role="group" aria-label="Choose your emblem"></div>
      <form id="nameForm" class="row" autocomplete="off">
        <input type="text" id="myname" maxlength="16" aria-label="Your name" style="flex: 3 1 0;">
        <button type="submit" class="btn" style="flex: 1 1 0;">✏️ Save</button>
      </form>
    </div>

    <div class="panel" id="hostset" hidden>
      <h2>👑 Host controls</h2>
      <div class="row">
        <label class="fld" for="packSel">Word pack <select id="packSel"></select></label>
        <label class="fld" for="impSel">Imposters
          <select id="impSel"><option value="1">1 imposter</option><option value="2" id="imp2">2 imposters (6+ players)</option></select>
        </label>
      </div>
      <label class="fld" for="timeSel">Voting timer
        <select id="timeSel"></select>
      </label>
      <button type="button" class="btn primary" id="startBtn">⚡ Start round</button>
      <p class="hint" id="startHint">You need at least 3 players.</p>
      <button type="button" class="btn small" id="resetScores">♻️ Reset scores</button>
    </div>
    <p class="hint" id="waitHost" hidden>⏳ Waiting for the host to start the round.</p>
  </section>

  <section class="view" id="v-game" hidden>
    <div class="phase" id="phaseLine"></div>
    <button type="button" class="relic covered" id="role" aria-pressed="false"></button>

    <div class="panel" id="p-board">
      <p class="eyebrow">🕵️ Clues, in speaking order</p>
      <ul class="list" id="board"></ul>
    </div>

    <div class="panel" id="p-clues">
      <h2>✍️ Your clue</h2>
      <p class="hint" id="clueNote"></p>
      <form id="clueForm" class="row" autocomplete="off" hidden>
        <input type="text" id="clue" maxlength="24" placeholder="One word" aria-label="Your clue" style="flex: 3 1 0;">
        <button type="submit" class="btn primary" id="clueSend" style="flex: 1 1 0;">Send</button>
      </form>
      <button type="button" class="btn small" id="clueCancel" hidden>Cancel edit</button>
      <button type="button" class="btn" id="toVote">🗳️ Open voting</button>
    </div>

    <div class="panel" id="p-vote">
      <h2>🗳️ Cast your vote</h2>
      <p class="hint" id="voteStage"></p>
      <div class="timer" id="vtimer" hidden><div class="track"><i id="vbar"></i></div><span id="vsec"></span></div>
      <ul class="list" id="suspects"></ul>
      <button type="button" class="btn small" id="skipVote">🤷 Not sure, skip my vote</button>
      <p class="eyebrow">Ballot box</p>
      <div class="ballot" id="ballot"></div>
      <button type="button" class="btn" id="closeVote">Reveal result</button>
    </div>

    <div class="panel" id="p-guess">
      <h2>🎯 Last guess</h2>
      <p class="hint" id="guessMsg"></p>
      <form id="guessForm" class="row" autocomplete="off" hidden>
        <input type="text" id="guess" maxlength="30" placeholder="The crew's word" aria-label="Your guess at the crew's word" style="flex: 3 1 0;">
        <button type="submit" class="btn primary" style="flex: 1 1 0;">Guess</button>
      </form>
      <button type="button" class="btn" id="skipGuess">Skip guess</button>
    </div>

    <div class="panel" id="p-reveal">
      <div id="revealBody"></div>
      <div class="row" id="revealHost">
        <button type="button" class="btn primary" id="nextRound">⚡ Next round</button>
        <button type="button" class="btn" id="backLobby">🏰 Back to lobby</button>
      </div>
      <p class="hint" id="waitNext">⏳ Waiting for the host to start the next round.</p>
    </div>
  </section>

  <section class="panel" id="chatPanel" hidden>
    <button type="button" class="chat-head" id="chatToggle" aria-expanded="true" aria-controls="chatBody">
      <span class="t">💬 Table talk</span><span class="badge" id="chatBadge" hidden>0</span><span class="chev">▾</span>
    </button>
    <div id="chatBody" style="display:flex;flex-direction:column;gap:10px">
      <ul class="msgs" id="chatList" aria-live="polite"></ul>
      <div class="emojis" id="emojiBar"></div>
      <form id="chatForm" class="row" autocomplete="off">
        <input type="text" id="chatInput" maxlength="200" placeholder="Say something..." aria-label="Chat message" style="flex: 3 1 0;">
        <button type="submit" class="btn primary" id="chatSend" style="flex: 1 1 0;">Send</button>
      </form>
      <button type="button" class="btn small" id="chatCancel" hidden>Cancel edit</button>
    </div>
  </section>
</div>
<div id="toast" role="status" hidden></div>

<script>
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); };
  var QUICK = ["😂", "🔥", "👀", "🤔", "😈", "💀", "🤝", "👍", "😱", "🫡"];

  var S = null, es = null, sess = null, roleShown = false, roleKey = "", toastTimer = null, armed = null;
  var packsBuilt = false, avBuilt = false, clueEditing = false, chatEditing = null, chatOpen = true, chatSeen = 0, lastChatSig = "";
  var voteEndAt = 0, closeEndAt = 0, lastConfetti = 0, nameInit = false;

  var isHost = function () { return !!S && S.hostId === S.me; };
  var P = function (id) { if (!S) return null; for (var i = 0; i < S.players.length; i++) if (S.players[i].id === id) return S.players[i]; return null; };
  var nm = function (id) { var p = P(id); return p ? p.name : "Someone"; };
  var av = function (id) { var p = P(id); return p ? p.avatar : "👤"; };
  function tier(score) {
    if (score >= 8) return '<span class="tier legend">👑 Legendary</span>';
    if (score >= 4) return '<span class="tier epic">💜 Epic</span>';
    if (score >= 1) return '<span class="tier rare">💎 Rare</span>';
    return '<span class="tier rookie">🌱 Rookie</span>';
  }

  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2800);
  }
  function api(path, body) {
    return fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || "Something went wrong."); return j; }); });
  }
  function act(type, extra) {
    var b = { code: sess.code, pid: sess.pid, type: type };
    for (var k in (extra || {})) b[k] = extra[k];
    return api("/api/act", b).then(function () { return true; }).catch(function (e) { toast(e.message); return false; });
  }

  /* ---------- connect ---------- */
  function connect(code, pid) {
    sess = { code: code, pid: pid };
    try { localStorage.setItem("imp.session", JSON.stringify(sess)); } catch (e) {}
    if (es) es.close();
    es = new EventSource("/events?code=" + encodeURIComponent(code) + "&pid=" + encodeURIComponent(pid));
    es.onmessage = function (e) {
      S = JSON.parse(e.data);
      var now = Date.now();
      voteEndAt = S.vote && S.vote.deadlineIn ? now + S.vote.deadlineIn : 0;
      closeEndAt = S.vote && S.vote.closingIn ? now + S.vote.closingIn : 0;
      render();
    };
    es.addEventListener("closed", function () { toast("The host closed the lobby."); drop(); });
    es.addEventListener("kicked", function () { toast("You were removed from the lobby."); drop(); });
    es.addEventListener("left", function () { drop(); });
    es.onerror = function () { if (es && es.readyState === 2) { toast("That lobby has ended."); drop(); } };
  }
  function drop() {
    if (es) { es.close(); es = null; }
    S = null; sess = null; armed = null; nameInit = false; chatSeen = 0; lastChatSig = ""; clueEditing = false; chatEditing = null;
    try { localStorage.removeItem("imp.session"); } catch (e) {}
    render();
  }
  function readName() {
    var n = $("#name").value.trim().slice(0, 16);
    if (!n) { $("#homeErr").textContent = "Enter your name first."; $("#name").focus(); return null; }
    try { localStorage.setItem("imp.name", n); } catch (e) {}
    return n;
  }
  function createLobby() {
    $("#homeErr").textContent = ""; var name = readName(); if (!name) return;
    $("#createBtn").disabled = true;
    api("/api/create", { name: name }).then(function (r) { connect(r.code, r.pid); })
      .catch(function (e) { $("#homeErr").textContent = e.message; })
      .then(function () { $("#createBtn").disabled = false; });
  }
  function joinLobby() {
    $("#homeErr").textContent = ""; var name = readName(); if (!name) return;
    var c = $("#joincode").value.trim().toUpperCase();
    if (c.length !== 5) { $("#homeErr").textContent = "Lobby codes have 5 characters."; $("#joincode").focus(); return; }
    var old = null; try { var s = JSON.parse(localStorage.getItem("imp.session") || "null"); if (s && s.code === c) old = s.pid; } catch (e) {}
    $("#joinBtn").disabled = true;
    api("/api/join", { code: c, name: name, pid: old }).then(function (r) { connect(r.code, r.pid); })
      .catch(function (e) { $("#homeErr").textContent = e.message; })
      .then(function () { $("#joinBtn").disabled = false; });
  }

  /* ---------- render ---------- */
  function render() {
    var inRoom = !!S;
    $("#v-home").hidden = inRoom;
    $("#roomchip").hidden = !inRoom;
    $("#top").classList.toggle("compact", inRoom);
    $("#v-lobby").hidden = !(inRoom && S.phase === "lobby");
    $("#v-game").hidden = !(inRoom && S.phase !== "lobby");
    $("#chatPanel").hidden = !inRoom;
    if (!inRoom) return;
    $("#chipcode").textContent = S.code;
    if (armed !== "leave") $("#leaveBtn").textContent = isHost() ? "Close lobby" : "Leave";
    if (S.phase === "lobby") renderLobby(); else renderGame();
    renderChat();
  }

  function renderLobby() {
    var list = S.players, host = isHost();
    $("#codeText").textContent = S.code;
    $("#pcount").textContent = list.length + " of " + S.max;
    $("#plist").innerHTML = list.map(function (p) {
      return '<li class="slot"><span class="no av">' + esc(p.avatar) + '</span><span class="who">' + esc(p.name) +
        (p.id === S.hostId ? '<em class="tag">👑 Host</em>' : "") + (p.id === S.me ? '<em class="tag">You</em>' : "") +
        '</span><span class="end">' + tier(p.score) + (p.score ? '<span class="pts">' + p.score + "</span>" : "") +
        (host && p.id !== S.me ? '<button type="button" class="x" data-kick="' + esc(p.id) + '" aria-label="Remove ' + esc(p.name) + '">✖</button>' : "") + "</span></li>";
    }).join("");

    var me = P(S.me);
    if (!avBuilt) {
      $("#avgrid").innerHTML = S.avatars.map(function (a) { return '<button type="button" data-av="' + esc(a) + '" aria-pressed="false" aria-label="Emblem ' + esc(a) + '">' + esc(a) + "</button>"; }).join("");
      avBuilt = true;
    }
    Array.prototype.forEach.call($("#avgrid").children, function (b) { b.setAttribute("aria-pressed", String(me && b.getAttribute("data-av") === me.avatar)); });
    if (!nameInit && me) { $("#myname").value = me.name; nameInit = true; }

    $("#hostset").hidden = !host;
    $("#waitHost").hidden = host;
    if (!host) return;
    if (!packsBuilt) {
      $("#packSel").innerHTML = S.packs.map(function (k) { return '<option value="' + esc(k.key) + '">' + esc(k.emoji + " " + k.name) + "</option>"; }).join("");
      $("#timeSel").innerHTML = S.voteTimes.map(function (t) { return '<option value="' + t + '">' + (t ? "⏱️ " + t + " seconds" : "♾️ No timer") + "</option>"; }).join("");
      packsBuilt = true;
    }
    if (document.activeElement !== $("#packSel")) $("#packSel").value = S.settings.pack;
    if (document.activeElement !== $("#timeSel")) $("#timeSel").value = String(S.settings.voteTime);
    $("#imp2").disabled = list.length < 6;
    if (document.activeElement !== $("#impSel")) $("#impSel").value = list.length < 6 ? "1" : String(S.settings.imposters);
    $("#startBtn").disabled = list.length < 3;
    $("#startHint").textContent = list.length < 3 ? "You need at least 3 players. Share the code above." : list.length + " heroes ready.";
    $("#resetScores").hidden = !list.some(function (p) { return p.score; });
  }

  function renderRole() {
    var b = $("#role");
    b.setAttribute("aria-pressed", String(roleShown));
    b.classList.toggle("covered", !roleShown);
    var pk = null; for (var i = 0; i < S.packs.length; i++) if (S.packs[i].name === S.category) pk = S.packs[i];
    var emo = pk ? pk.emoji : "🎯";
    if (!roleShown) {
      b.innerHTML = '<span class="relic-in"><span class="sigil">🔮</span><span class="cover">Tap to reveal your fate</span><span class="sub">Keep your screen hidden. Tap again to hide it.</span></span>';
    } else {
      b.innerHTML = '<span class="relic-in"><span class="lbl">Your secret word</span><span class="word">' + esc(S.word) + '</span><span class="cat">' + esc(emo) + " " + esc(S.category) + '</span><span class="sub">Hint at it without saying it. Someone holds a similar but different word.</span></span>';
    }
  }

  function renderGame() {
    var ph = S.phase, r = S.round, host = isHost(), imp = S.isImposter;
    var labels = { clues: "🕵️ Clues", vote: "🗳️ Voting", guess: "🎯 Last guess", reveal: "🏆 Result" };
    $("#phaseLine").innerHTML = '<span class="chip">Round ' + r + '</span><span class="chip hot">' + labels[ph] + "</span>";
    var key = r + ":" + S.me; if (key !== roleKey) { roleKey = key; roleShown = false; clueEditing = false; }
    $("#role").hidden = ph === "reveal";
    if (ph !== "reveal") renderRole();
    if (ph !== "clues") clueEditing = false;

    var order = S.order, turnId = null;
    for (var i = 0; i < order.length; i++) if (!S.clues[order[i]]) { turnId = order[i]; break; }
    $("#p-board").hidden = ph === "reveal";
    $("#board").innerHTML = order.map(function (id) {
      var cur = ph === "clues" && id === turnId, mineClue = id === S.me && S.clues[id] && ph === "clues";
      return '<li class="slot' + (cur ? " cur" : "") + '"><span class="no av">' + esc(av(id)) + '</span><span class="who">' + esc(nm(id)) +
        (id === S.me ? '<em class="tag">You</em>' : "") + '</span><span class="clue">' +
        (S.clues[id] ? esc(S.clues[id]) + (S.edited.indexOf(id) >= 0 ? ' <small style="color:var(--muted)">(edited)</small>' : "") : cur ? "<i>thinking…</i>" : "<i>waiting</i>") +
        (mineClue ? ' <button type="button" class="x" data-editclue aria-label="Edit my clue">✏️</button>' : "") + "</span></li>";
    }).join("");

    $("#p-clues").hidden = ph !== "clues";
    if (ph === "clues") {
      var mine = turnId === S.me, show = mine || clueEditing;
      $("#clueForm").hidden = !show;
      $("#clueSend").textContent = clueEditing ? "Save" : "Send";
      $("#clueCancel").hidden = !clueEditing;
      $("#clueNote").textContent = clueEditing ? "Fix the spelling and tap Save. Everyone sees the change."
        : turnId ? (mine ? "Your turn. Give one word that hints at your secret word without saying it." : "Waiting for " + nm(turnId) + "…")
        : "All clues are in. Chat it over, then the host opens voting.";
      $("#toVote").hidden = !host;
      $("#toVote").textContent = turnId ? "🗳️ Skip to voting" : "🗳️ Open voting";
      $("#toVote").classList.toggle("primary", !turnId);
    }

    $("#p-vote").hidden = ph !== "vote";
    if (ph === "vote") renderVote(host);

    $("#p-guess").hidden = ph !== "guess";
    if (ph === "guess") {
      var me = P(S.me), guessed = me && me.guessed;
      $("#guessForm").hidden = !(imp && !guessed);
      $("#guessMsg").textContent = imp
        ? (guessed ? "Guess locked in. Waiting for the others." : "You were the imposter. Everyone else had a different word. Guess theirs to steal the win.")
        : "The crew caught " + nm(S.top) + ", the imposter. They now get one guess at the crew's word.";
      $("#skipGuess").hidden = !host;
    }

    $("#p-reveal").hidden = ph !== "reveal";
    if (ph === "reveal") renderReveal(host);
  }

  function renderVote(host) {
    var V = S.vote, cands = V.candidates, mine = S.myVote;
    $("#voteStage").textContent = V.stage === 2
      ? "⚔️ Runoff! The vote was tied. Pick between the tied players. You can change your vote until it closes."
      : "Tap who you think the imposter is. You can change your vote until it closes.";
    $("#suspects").innerHTML = S.players.filter(function (p) { return p.id !== S.me && (!cands || cands.indexOf(p.id) >= 0); }).map(function (p) {
      var on = p.id === mine;
      return '<li><button type="button" class="suspect' + (on ? " picked" : "") + '" data-vote="' + esc(p.id) + '" aria-pressed="' + on + '"><span class="no">' + esc(p.avatar) + '</span><span class="who">' + esc(p.name) +
        "<small>" + (S.clues[p.id] ? "Clue: " + esc(S.clues[p.id]) : "No clue given") + '</small></span><span>' + (on ? '<b class="stamp">Accused</b>' : "") + "</span></button></li>";
    }).join("");
    $("#skipVote").classList.toggle("primary", mine === "skip");
    $("#skipVote").textContent = mine === "skip" ? "🤷 You skipped (tap a player to change)" : "🤷 Not sure, skip my vote";
    $("#ballot").innerHTML = S.players.map(function (p) {
      return '<div class="b' + (p.voted ? " done" : "") + '"><span class="circ">' + esc(p.avatar) + "</span>" + (p.voted ? "✅" : "⏳") + "</div>";
    }).join("");
    var all = S.votesIn === S.players.length;
    $("#closeVote").hidden = !host;
    $("#closeVote").classList.toggle("primary", all);
    $("#closeVote").textContent = all ? "⚖️ Reveal result" : "⚖️ Reveal now (" + S.votesIn + "/" + S.players.length + " voted)";
    tick();
  }

  function renderReveal(host) {
    var res = S.reveal, crew = res.winner === "crew", imps = res.imposters;
    var iWasImp = imps.indexOf(S.me) >= 0, iWon = (iWasImp && !crew) || (!iWasImp && crew);
    var why;
    if (res.caught) why = esc(nm(res.top)) + (res.guessCorrect ? " was caught, but the imposters guessed the word." : " was caught and the guess missed.");
    else if (res.top) why = "The crew voted out " + esc(nm(res.top)) + ", who was innocent.";
    else why = "The vote was tied, so nobody was caught.";
    var guessLine = Object.keys(res.guesses || {}).map(function (id) { return esc(nm(id)) + " guessed “" + esc(res.guesses[id]) + "”"; }).join(". ");

    var logHtml = res.log.map(function (entry) {
      var pool = entry.candidates ? S.players.filter(function (p) { return entry.candidates.indexOf(p.id) >= 0; }) : S.players;
      var mx = 1; pool.forEach(function (p) { mx = Math.max(mx, entry.tally[p.id] || 0); });
      var rows = pool.map(function (p) { return { p: p, n: entry.tally[p.id] || 0 }; }).sort(function (a, b) { return b.n - a.n; });
      var skipped = S.players.filter(function (q) { return entry.votes[q.id] === "skip"; });
      return '<p class="eyebrow">' + (entry.stage === 2 ? "⚔️ Runoff vote" : "🗳️ The vote") + "</p>" +
        '<ul class="list">' + rows.map(function (x) {
          var voters = S.players.filter(function (q) { return entry.votes[q.id] === x.p.id; }).map(function (q) { return esc(q.avatar); }).join("");
          var isImp = imps.indexOf(x.p.id) >= 0;
          return '<li class="rbar' + (isImp ? " is-imp" : "") + '"><span class="no">' + esc(x.p.avatar) + '</span><span class="meta"><span class="top"><span>' + esc(x.p.name) + "</span><span>" +
            (isImp ? '<b class="stamp">Imposter</b> ' : "") + x.n + '</span></span><span class="track"><i style="width:' + Math.max(x.n ? 8 : 0, Math.round(x.n / mx * 100)) + '%"></i></span><span class="voters">' + (voters || '<span style="color:var(--muted);font-size:13px;letter-spacing:0">No votes</span>') + "</span></span></li>";
        }).join("") + "</ul>" + (skipped.length ? '<p class="hint">🤷 Skipped: ' + skipped.map(function (q) { return esc(q.avatar + " " + q.name); }).join(", ") + "</p>" : "");
    }).join("");

    var ranked = S.players.slice().sort(function (a, b) { return b.score - a.score; });
    var medals = ["🥇", "🥈", "🥉"];
    $("#revealBody").innerHTML =
      '<div style="display:flex;flex-direction:column;gap:14px">' +
      '<p class="eyebrow">Round ' + S.round + " · " + esc(S.category) + "</p>" +
      '<h2 class="verdict ' + (crew ? "crew" : "imp") + '" style="color:inherit">' + (crew ? "🛡️ Crew wins" : "🎭 Imposters win") + "</h2>" +
      '<p class="hint">' + (iWon ? "🏆 You won this round! " : "") + why + (guessLine ? " " + guessLine + "." : "") + "</p>" +
      '<dl class="facts"><div><dt>Crew word</dt><dd>' + esc(res.word) + "</dd></div><div><dt>Imposter word</dt><dd>" + esc(res.decoy) + "</dd></div><div><dt>Imposter" + (imps.length > 1 ? "s" : "") + "</dt><dd>" + imps.map(function (id) { return esc(av(id) + " " + nm(id)); }).join(", ") + "</dd></div></dl>" +
      logHtml +
      '<p class="eyebrow">🏆 Scoreboard</p><ul class="list">' + ranked.map(function (p, i) {
        var d = res.delta && res.delta[p.id];
        return '<li class="slot"><span class="no av">' + (medals[i] || esc(p.avatar)) + '</span><span class="who">' + esc(p.avatar + " " + p.name) + '</span><span class="end">' + tier(p.score) + '<span class="pts">' + (d ? "<em>+" + d + "</em>" : "") + p.score + "</span></span></li>";
      }).join("") + "</ul></div>";
    $("#revealHost").hidden = !host;
    $("#waitNext").hidden = host;
    if (iWon && lastConfetti !== S.round) { lastConfetti = S.round; confetti(); }
  }

  /* ---------- chat ---------- */
  function renderChat() {
    var list = $("#chatList"), msgs = S.chat;
    var sig = msgs.map(function (m) { return m.id + ":" + (m.edited ? 1 : 0) + ":" + m.name + m.avatar + ":" + m.text.length; }).join("|") + "|" + S.me + "|" + chatEditing;
    if (sig !== lastChatSig) {
      var near = list.scrollHeight - list.scrollTop - list.clientHeight < 70, hadAny = !!lastChatSig;
      lastChatSig = sig;
      list.innerHTML = msgs.map(function (m) {
        if (m.sys) return '<li class="msg sys">✨ ' + esc(m.text) + "</li>";
        var mine = m.pid === S.me, t = new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return '<li class="msg' + (mine ? " mine" : "") + '"><span class="av">' + esc(m.avatar) + '</span><div class="bub"><span class="nm">' + esc(m.name) + "</span><time>" + esc(t) + "</time>" +
          (mine ? '<span class="tools"><button type="button" data-cedit="' + m.id + '" aria-label="Edit message">✏️</button><button type="button" data-cdel="' + m.id + '" aria-label="Delete message">🗑️</button></span>' : "") +
          "<p>" + esc(m.text) + (m.edited ? " <em>(edited)</em>" : "") + "</p></div></li>";
      }).join("") || '<li class="msg sys">No messages yet. Say hello 👋</li>';
      if (near || !hadAny) list.scrollTop = list.scrollHeight;
    }
    var last = msgs.length ? msgs[msgs.length - 1].id : 0;
    if (chatOpen) { chatSeen = last; }
    var unread = chatOpen ? 0 : msgs.filter(function (m) { return !m.sys && m.pid !== S.me && m.id > chatSeen; }).length;
    $("#chatBadge").hidden = unread === 0; $("#chatBadge").textContent = unread;
    $("#chatBody").style.display = chatOpen ? "flex" : "none";
    $("#chatToggle").setAttribute("aria-expanded", String(chatOpen));
    $("#chatSend").textContent = chatEditing ? "Save" : "Send";
    $("#chatCancel").hidden = !chatEditing;
  }

  /* ---------- timers and confetti ---------- */
  function tick() {
    if (!S || S.phase !== "vote" || !S.vote) return;
    var now = Date.now(), box = $("#vtimer"), bar = $("#vbar"), txt = $("#vsec");
    if (closeEndAt) {
      var rem = Math.max(0, closeEndAt - now);
      bar.style.width = (rem / 3000 * 100) + "%";
      txt.textContent = "✅ Everyone voted. Revealing in " + Math.ceil(rem / 1000) + "…"; box.hidden = false;
    } else if (voteEndAt) {
      var rem2 = Math.max(0, voteEndAt - now), tot = S.vote.totalMs || 1;
      bar.style.width = Math.min(100, rem2 / tot * 100) + "%";
      txt.textContent = "⏱️ Voting closes in " + Math.ceil(rem2 / 1000) + "s"; box.hidden = false;
    } else box.hidden = true;
  }
  setInterval(tick, 250);

  function confetti() {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var c = document.createElement("canvas");
    c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:30";
    document.body.appendChild(c);
    var w = c.width = window.innerWidth, h = c.height = window.innerHeight, ctx = c.getContext("2d");
    var cols = ["#f7c948", "#8a6bff", "#55e0ff", "#ff6b3d", "#4de2a0", "#ff4d6d"], ps = [];
    for (var i = 0; i < 150; i++) ps.push({ x: w / 2, y: h * 0.35, vx: (Math.random() - 0.5) * 15, vy: -Math.random() * 15 - 4, r: Math.random() * 6 + 3, c: cols[i % cols.length], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4 });
    var t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, w, h);
      ps.forEach(function (p) { p.vy += 0.36; p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); });
      if (t - t0 < 2800) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }

  /* ---------- events ---------- */
  $("#createBtn").addEventListener("click", createLobby);
  $("#joinBtn").addEventListener("click", joinLobby);
  $("#joincode").addEventListener("input", function (e) { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
  $("#joincode").addEventListener("keydown", function (e) { if (e.key === "Enter") joinLobby(); });
  $("#name").addEventListener("keydown", function (e) { if (e.key === "Enter") { if ($("#joincode").value.trim()) joinLobby(); else createLobby(); } });

  $("#leaveBtn").addEventListener("click", function () {
    var b = $("#leaveBtn");
    if (isHost() && armed !== "leave") {
      armed = "leave"; b.textContent = "Tap to confirm"; b.classList.add("danger");
      setTimeout(function () { if (armed === "leave") { armed = null; b.classList.remove("danger"); if (S) b.textContent = isHost() ? "Close lobby" : "Leave"; } }, 3000);
      return;
    }
    b.classList.remove("danger"); armed = null;
    var s = sess; if (s) api("/api/act", { code: s.code, pid: s.pid, type: "leave" }).catch(function () {});
    drop();
  });
  function copy(text, okMsg) {
    try { navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, function () { toast("Copy failed. It is " + text); }); }
    catch (e) { toast("Copy failed. It is " + text); }
  }
  $("#copyBtn").addEventListener("click", function () { copy(S.code, "Code copied"); });
  $("#copyLink").addEventListener("click", function () { copy(location.origin + "/", "Link copied"); });
  $("#plist").addEventListener("click", function (e) {
    var k = e.target.closest("[data-kick]"); if (k && isHost()) act("kick", { target: k.getAttribute("data-kick") });
  });
  $("#avgrid").addEventListener("click", function (e) {
    var b = e.target.closest("[data-av]"); if (b) act("avatar", { avatar: b.getAttribute("data-av") });
  });
  $("#nameForm").addEventListener("submit", function (e) {
    e.preventDefault(); var n = $("#myname").value.trim(); if (!n) { toast("Names can't be empty."); return; }
    act("rename", { name: n }).then(function (ok) { if (ok) toast("Name saved"); });
  });
  function saveSettings() { if (isHost()) act("settings", { pack: $("#packSel").value, imposters: +$("#impSel").value, voteTime: +$("#timeSel").value }); }
  $("#packSel").addEventListener("change", saveSettings);
  $("#impSel").addEventListener("change", saveSettings);
  $("#timeSel").addEventListener("change", saveSettings);
  $("#startBtn").addEventListener("click", function () { if (isHost()) act("start"); });
  $("#resetScores").addEventListener("click", function () { if (isHost()) act("resetScores"); });

  $("#role").addEventListener("click", function () { roleShown = !roleShown; renderRole(); });

  $("#board").addEventListener("click", function (e) {
    if (!e.target.closest("[data-editclue]")) return;
    clueEditing = true; renderGame(); $("#clue").value = S.clues[S.me] || ""; $("#clue").focus();
  });
  $("#clueForm").addEventListener("submit", function (e) {
    e.preventDefault(); var t = $("#clue").value.trim(); if (!t) return;
    act("clue", { text: t }).then(function (ok) { if (ok) { clueEditing = false; $("#clue").value = ""; if (S) renderGame(); } });
  });
  $("#clueCancel").addEventListener("click", function () { clueEditing = false; $("#clue").value = ""; renderGame(); });
  $("#toVote").addEventListener("click", function () { if (isHost()) act("toVote"); });

  $("#suspects").addEventListener("click", function (e) {
    var b = e.target.closest("[data-vote]"); if (b) act("vote", { target: b.getAttribute("data-vote") });
  });
  $("#skipVote").addEventListener("click", function () { act("vote", { target: "skip" }); });
  $("#closeVote").addEventListener("click", function () { if (isHost()) act("closeVote"); });

  $("#guessForm").addEventListener("submit", function (e) {
    e.preventDefault(); var t = $("#guess").value.trim(); if (!t) return;
    act("guess", { text: t }).then(function (ok) { if (ok) $("#guess").value = ""; });
  });
  $("#skipGuess").addEventListener("click", function () { if (isHost()) act("skipGuess"); });
  $("#nextRound").addEventListener("click", function () { if (isHost()) act("start"); });
  $("#backLobby").addEventListener("click", function () { if (isHost()) act("backLobby"); });

  /* chat */
  $("#emojiBar").innerHTML = QUICK.map(function (q) { return '<button type="button" data-emo="' + q + '" aria-label="Add ' + q + '">' + q + "</button>"; }).join("");
  $("#emojiBar").addEventListener("click", function (e) {
    var b = e.target.closest("[data-emo]"); if (!b) return;
    var i = $("#chatInput"); i.value = (i.value + b.getAttribute("data-emo")).slice(0, 200); i.focus();
  });
  $("#chatToggle").addEventListener("click", function () { chatOpen = !chatOpen; if (S) renderChat(); });
  $("#chatForm").addEventListener("submit", function (e) {
    e.preventDefault(); var t = $("#chatInput").value.trim(); if (!t) return;
    var editing = chatEditing;
    var p = editing ? act("chatEdit", { id: editing, text: t }) : act("chat", { text: t });
    p.then(function (ok) { if (ok) { $("#chatInput").value = ""; chatEditing = null; lastChatSig = ""; if (S) renderChat(); var l = $("#chatList"); l.scrollTop = l.scrollHeight; } });
  });
  $("#chatCancel").addEventListener("click", function () { chatEditing = null; $("#chatInput").value = ""; lastChatSig = ""; renderChat(); });
  $("#chatList").addEventListener("click", function (e) {
    var ed = e.target.closest("[data-cedit]"), del = e.target.closest("[data-cdel]");
    if (ed) {
      var id = +ed.getAttribute("data-cedit"), m = S.chat.filter(function (x) { return x.id === id; })[0];
      if (m) { chatEditing = id; $("#chatInput").value = m.text; lastChatSig = ""; renderChat(); $("#chatInput").focus(); }
    } else if (del) {
      var did = +del.getAttribute("data-cdel"); if (chatEditing === did) { chatEditing = null; $("#chatInput").value = ""; }
      act("chatDel", { id: did });
    }
  });

  try { var n = localStorage.getItem("imp.name"); if (n) $("#name").value = n; } catch (e) {}
  try { var s = JSON.parse(localStorage.getItem("imp.session") || "null"); if (s && s.code && s.pid) connect(s.code, s.pid); } catch (e) {}
  render();
})();
</script>
</body>
</html>
`;
