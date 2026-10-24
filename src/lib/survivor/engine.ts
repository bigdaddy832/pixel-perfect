// @ts-nocheck -- array indexing is guarded by game invariants
// Survivor simulation engine — pure client-side state machine.
import { SEASON_TWIST_LABEL, type SeasonTwist } from "./season-titles";
import { answerJuryQuestion, eligibleJuryQuestions } from "./jury-dialogue";
export type StatKey =
  "strategy" | "social" | "loyalty" | "temperament" | "general" | "physical" | "endurance" | "mental";

export const SOCIAL_STATS: StatKey[] = ["strategy", "social", "loyalty", "temperament"];
export const CHALLENGE_STATS: StatKey[] = ["general", "physical", "endurance", "mental"];
export const STAT_LABEL: Record<StatKey, string> = {
  strategy: "Strategy",
  social: "Social",
  loyalty: "Loyalty",
  temperament: "Temperament",
  general: "General",
  physical: "Physical",
  endurance: "Endurance",
  mental: "Mental",
};

export interface Castaway {
  id: string;
  name: string;
  tribeId: string;
  originalTribeId: string;
  stats: Record<StatKey, number>;
  out: boolean;
  juror: boolean;
  idols: number;
  advantages: AdvantageKey[];
  mood: number;
  placement?: number;
  immunityWins: number;
  betrayedBy: string[];
  fakeIdol?: "own" | "planted";
  bewareTribals?: number;
  bewareTask?: string;
  lostVote?: boolean;
  edge?: boolean;
  clue?: boolean;
  shotUsed?: boolean;
  votesCast?: number;
  correctVotes?: number;
  votesAgainst?: number;
  idolsPlayed?: number;
  advPlayed?: number;
  madeMerge?: boolean;
  rewardWins?: number;
  amulet?: boolean;
  /** Idols received as a gift (Idol Halves twist); these are playable. */
  idolsGifted?: number;
}
export type AdvantageKey =
  "extra_vote" | "steal_vote" | "vote_blocker" | "safety" | "idol_nullifier" | "knowledge_is_power" | "fifty_fifty";
export const ADVANTAGES: AdvantageKey[] = [
  "extra_vote",
  "steal_vote",
  "vote_blocker",
  "safety",
  "idol_nullifier",
  "knowledge_is_power",
  "fifty_fifty",
];
export const ADVANTAGE_LABEL: Record<AdvantageKey, string> = {
  extra_vote: "Extra Vote",
  steal_vote: "Steal a Vote",
  vote_blocker: "Vote Blocker",
  safety: "Safety Without Power",
  idol_nullifier: "Idol Nullifier",
  knowledge_is_power: "Knowledge is Power",
  fifty_fifty: "50/50 Coin",
};
export const ADVANTAGE_DESC: Record<AdvantageKey, string> = {
  extra_vote: "Cast a second vote at Tribal Council.",
  steal_vote: "Take someone's vote and cast it yourself.",
  vote_blocker: "Block one person from voting.",
  safety: "Leave Tribal Council safe — but you don't vote.",
  idol_nullifier: "Cancel any idol played for the person you name.",
  knowledge_is_power: "Ask someone if they have an idol or advantage — if they do, it's yours.",
  fifty_fifty: "Flip a coin at Tribal Council: 50% chance of immunity, 50% chance it fails.",
};
export const ADVANTAGE_NEEDS_TARGET: AdvantageKey[] = [
  "steal_vote",
  "vote_blocker",
  "idol_nullifier",
  "knowledge_is_power",
];
export interface Tribe {
  id: string;
  name: string;
  color: string;
}
export interface Alliance {
  id: string;
  name: string;
  members: string[];
}
export interface Config {
  playerCount: number;
  tribeCount: number;
  jurySize: number;
  finalSize: 2 | 3;
  fireAtF4: boolean;
  swapEnabled: boolean;
  swapAt: number;
  mergeAt: number;
  mergedName: string;
  mergedColor: string;
  swapTribe?: Tribe;
  jointTribals?: boolean;
  doubleTribals?: boolean;
  edgeOfExtinction?: boolean;
  journeys?: boolean;
  exileIsland?: boolean;
  bewareAdvantages?: boolean;
  shotInTheDark?: boolean;
  demergeTwist?: boolean;
  idolGifting?: boolean;
  earnTheMerge?: boolean;
  controlledId: string | null;
  seasonTitle?: string;
  themeTwist?: SeasonTwist;
}
export interface Vote {
  voter: string;
  target: string;
  nullified?: boolean;
}
export interface LogEntry {
  kind: "camp" | "drama" | "alliance" | "idol" | "challenge" | "tribal" | "twist" | "finale" | "confessional" | "jury";
  title: string;
  text: string;
  details?: string[];
  votes?: Vote[];
  revote?: Vote[];
  quoteKey?: string;
  out?: string;
}
export interface Episode {
  n: number;
  title: string;
  entries: LogEntry[];
}
export type Phase = "camp" | "challenge" | "tribal" | "final_challenge" | "final_choice" | "ftc" | "done";
export interface GameState {
  pendingRevote?: { seed: number; decision: Decision; options: string[]; votes?: Vote[]; summary?: string[] };
  config: Config;
  castaways: Castaway[];
  tribes: Tribe[];
  alliances: Alliance[];
  rel: Record<string, number>;
  episodes: Episode[];
  day: number;
  phase: Phase;
  noTribal?: boolean;
  merged: boolean;
  swapped: boolean;
  immune: string[];
  tribalTribe: string | null;
  hiddenIdols: Record<string, number>;
  finalImmune?: string;
  usedChallenges: string[];
  rewardAdvantageGiven: boolean;
  tribalTribes?: string[];
  tribalQueue?: string[][];
  doubleElim?: boolean;
  twistsUsed?: string[];
  demergeActive?: boolean;
  challengeSearch?: boolean;
  edgeDone?: boolean;
  journeysDone?: number;
  bewareFound?: boolean;
  amuletsGiven?: boolean;
  amuletStages?: number[];
  amuletsConsumed?: boolean;
  winner?: string;
  finalists?: string[];
  juryLeans?: {
    jurorId: string;
    finalistId: string;
    score: number;
    reasons: string[];
  }[];
  juryHouseLog?: {
    arrivingJurorId: string;
    text: string;
    shifts: { jurorId: string; finalistId: string; amount: number }[];
  }[];
  juryVotes?: { juror: string; finalist: string; reason: string }[];
  fanFavorite?: string;
}
export const SEARCH_SPOTS = [
  "the tree line",
  "the water well",
  "behind the shelter",
  "the rocky outcrop",
  "the beach at dawn",
];
export const IDOL_HIDING_PLACES = [
  "inside a hollow tree knot",
  "beneath a loose stone beside the well",
  "tied under a shelter beam",
  "inside a sealed coconut shell",
  "wrapped in leaves between mangrove roots",
  "inside a split bamboo stalk",
  "under a driftwood log",
  "wedged in a narrow rock crevice",
  "behind a carved wooden camp marker",
  "beneath the roots of a fallen palm",
  "inside a woven pouch under the tree-mail box",
  "buried in sand beneath a marked shell",
  "tucked into a bird's abandoned nest",
  "under a moss-covered stump",
  "fastened to the underside of a water bucket",
  "hidden in the fork of a strangler fig",
];
const CHALLENGE_IDOL_PLACES = [
  "beneath a puzzle table",
  "inside a hollow course marker",
  "under the climbing platform",
  "tied behind a balance-beam support",
  "inside a rope basket",
  "beneath the final station's bench",
];
export type TalkTopic = "personal" | "strategy" | "chore" | "compliment" | "vent" | "joke";
export const TALK_TOPICS: Record<
  TalkTopic,
  { label: string; base: number; win: number; lose: number; ok: string; bad: string }
> = {
  personal: {
    label: "Talk about home & family",
    base: 0.7,
    win: 8,
    lose: -3,
    ok: "opened up about life back home — a real bond formed",
    bad: "seemed uncomfortable sharing anything personal",
  },
  strategy: {
    label: "Talk strategy",
    base: 0.5,
    win: 10,
    lose: -6,
    ok: "trusted you with their read on the game",
    bad: "got paranoid that you're playing too hard",
  },
  chore: {
    label: "Do a camp chore together",
    base: 0.75,
    win: 6,
    lose: -2,
    ok: "worked side by side with you and appreciated the effort",
    bad: "thought you slacked off and did most of the work themselves",
  },
  compliment: {
    label: "Compliment their game",
    base: 0.6,
    win: 7,
    lose: -4,
    ok: "lit up — they felt seen",
    bad: "smelled a suck-up and got guarded",
  },
  vent: {
    label: "Vent about someone",
    base: 0.45,
    win: 12,
    lose: -8,
    ok: "agreed completely — you've got a shared enemy now",
    bad: "didn't share your gripe and may repeat what you said",
  },
  joke: {
    label: "Joke around",
    base: 0.65,
    win: 6,
    lose: -3,
    ok: "was cracking up — the mood at camp lifted",
    bad: "didn't find it funny at all",
  },
};
export interface AdvantagePlay {
  advantage: AdvantageKey | "__instinct__";
  target?: string;
  kipItem?: "idol" | "amulet" | AdvantageKey;
}

export interface Decision {
  quit?: boolean;
  vote?: string;
  juryVote?: string;
  idol?: string;
  allyWith?: string;
  cut?: string;
  searchIdol?: boolean;
  searchSpot?: string;
  advantage?: AdvantageKey | "__instinct__";
  advantageTarget?: string;
  kipItem?: "idol" | "amulet" | AdvantageKey;
  giveImmunity?: string;
  craftFake?: boolean;
  fakeTarget?: string;
  challengeIdol?: boolean;
  playAmulet?: boolean;
  amuletTarget?: string;
  giveItem?: string;
  giveTo?: string;
  shotInDark?: boolean;
  revoteVote?: string;
  pauseOnRevote?: boolean;
  revoteDecided?: boolean;
  talks?: { with: string; topic?: TalkTopic }[];
  whisper?: string;
  bewareAttempt?: boolean;
}
const BIG_TWISTS = ["joint", "double_pre", "double_post"];
/** Joint tribals and double eliminations share a single once-per-season slot. */
export const bigTwistUsed = (s: GameState) => (s.twistsUsed ?? []).some((x) => BIG_TWISTS.includes(x));

export const TRIBE_NAMES = [
  "Veylora",
  "Kelmori",
  "Zunakai",
  "Dakal",
  "Naviti",
  "Taku",
  "Ulong",
  "Pagong",
  "Tagi",
  "Kucha",
  "Ogakor",
  "Samburu",
  "Kota",
  "Fang",
  "Kalabaw",
  "Tandang",
  "Salani",
  "Manono",
  "Nuku",
  "Malolo",
  "Vakama",
  "Luvu",
  "Yase",
  "Soka",
  "Ika",
  "Baka",
  "Gata",
  "Lavo",
  "Moto",
  "Ravu",
];
export const MERGE_NAMES = [
  "Velunara",
  "Solarrion",
  "Orivessa",
  "Tazumori",
  "Kelavora",
  "Zunaveli",
  "Lumekari",
  "Veyranoa",
];
export const TRIBE_COLORS = ["#e8662a", "#2f7fd6", "#e3c13b", "#3fae5a", "#c43d3d", "#8b5ad6", "#e45fa1", "#2bb5b0"];

function hslToHex(h: number, s: number, l: number) {
  const c = (1 - Math.abs((2 * l) / 100 - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  const seg: [number, number, number][] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [rr, gg, bb] = seg[Math.floor(h / 60) % 6];
  const to2 = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to2(rr)}${to2(gg)}${to2(bb)}`;
}
function hexToHue(hex: string): number | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r8 = ((n >> 16) & 255) / 255,
    g8 = ((n >> 8) & 255) / 255,
    b8 = (n & 255) / 255;
  const max = Math.max(r8, g8, b8),
    min = Math.min(r8, g8, b8),
    d = max - min;
  if (d === 0) return null;
  const h = max === r8 ? ((g8 - b8) / d) % 6 : max === g8 ? (b8 - r8) / d + 2 : (r8 - g8) / d + 4;
  return (h * 60 + 360) % 360;
}
const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d);
};

/** A fresh, vivid tribe colour that stays visually distinct from `avoid`. */
export function randomTribeColor(avoid: string[] = []): string {
  const hues = avoid.map(hexToHue).filter((h): h is number => h !== null);
  for (let i = 0; i < 30; i++) {
    const h = Math.floor(r() * 360);
    if (hues.some((a) => hueGap(a, h) < 30)) continue;
    return hslToHex(h, 62 + r() * 26, 46 + r() * 14);
  }
  return hslToHex(Math.floor(r() * 360), 72, 52);
}

const SYL_A = ["Ve", "Ka", "Zu", "Lo", "Ta", "Mi", "Ori", "Sa", "Nu", "Fe", "Ilo", "Ra", "Yu", "Ke", "Pa", "Ama"];
const SYL_B = ["ly", "mo", "na", "ri", "ve", "ka", "lu", "zo", "te", "si", "wa", "re"];
const SYL_C = ["ra", "ri", "kai", "lo", "na", "mu", "sa", "tu", "vi", "ko", "ne", "ta"];
const REAL_TRIBES = [
  "Pagong",
  "Tagi",
  "Kucha",
  "Ogakor",
  "Samburu",
  "Boran",
  "Rotu",
  "Maraamu",
  "Chuay Gahn",
  "Sook Jai",
  "Rotu",
  "Fang",
  "Kota",
  "Ulong",
  "Koror",
  "Moto",
  "Ravu",
  "Casaya",
  "La Mina",
  "Bayoneta",
  "Aitu",
  "Puka",
  "Raro",
  "Manihiki",
  "Fei Long",
  "Zhan Hu",
  "Malakal",
  "Airai",
  "Dabu",
  "Galang",
  "Tandang",
  "Kalabaw",
  "Salani",
  "Manono",
  "Nuku",
  "Vakama",
  "Yase",
  "Soka",
  "Ika",
  "Baka",
  "Gata",
  "Lavo",
  "Luvu",
  "Naviti",
  "Taku",
  "Dakal",
];
/** An invented tribe name (never a real Survivor tribe) that isn't already in `avoid`. */
export function randomTribeName(avoid: string[] = []): string {
  const lower = [...avoid, ...REAL_TRIBES, ...NAMES].map((x) => x.toLowerCase());
  for (let i = 0; i < 50; i++) {
    const n = pick(SYL_A) + pick(SYL_B) + pick(SYL_C);
    if (n.length < 6 || lower.includes(n.toLowerCase())) continue;
    return n;
  }
  return `${pick(SYL_A)}${pick(SYL_B)}${pick(SYL_C)}${Math.floor(r() * 90 + 10)}`;
}

const NAMES = [
  "Adrian",
  "Amara",
  "Anika",
  "Brielle",
  "Callum",
  "Celia",
  "Dorian",
  "Elise",
  "Emmett",
  "Esme",
  "Felix",
  "Freya",
  "Gideon",
  "Hugo",
  "Imogen",
  "Inez",
  "Jasper",
  "Jules",
  "Kieran",
  "Leona",
  "Luca",
  "Maeve",
  "Maren",
  "Micah",
  "Nadia",
  "Nico",
  "Noelle",
  "Otis",
  "Petra",
  "Rafael",
  "Rhea",
  "Ronan",
  "Sienna",
  "Silas",
  "Tessa",
  "Theo",
  "Tobias",
  "Vera",
  "Willa",
  "Zara",
  "Tony",
  "Stephanie",
  "Rob",
  "Ava",
  "Ben",
  "Daniel",
  "Emma",
  "Grace",
  "Jack",
  "Julia",
  "Mason",
  "Maya",
  "Owen",
  "Sophie",
  "Spark",
  "Patch",
  "Scooter",
  "Doc",
  "Rook",
  "Sprocket",
  "Radar",
  "Skipper",
  "Sparks",
  "Pebbles",
];
const ALLIANCE_NAMES = [
  "The Core",
  "Rogue Squad",
  "Stealth Mode",
  "The Rat Pack",
  "Sanctuary",
  "Night Owls",
  "The Underdogs",
  "Tidal Wave",
  "The Coconut Crew",
  "Shadow Council",
  "Low Tide",
  "The Hammocks",
  "Driftwood",
  "Bonfire Club",
  "The Outliers",
  "Moonlight Pact",
  "Salt & Pepper Shakers",
  "The Lagoon",
  "Kingpins",
  "The Misfits",
  "Sharks in Suits",
  "Banana Republic",
  "The Nest",
  "Coral Cartel",
  "Sunset Society",
  "The Firekeepers",
  "Machete Gang",
  "Reef Raiders",
  "The Swamp",
  "Palm Readers",
  "Wolf Pack",
  "Midnight Snacks",
  "The Lifeboat",
  "Monsoon",
  "The Shell Game",
  "Quiet Storm",
  "Treehouse Club",
  "The Cartographers",
  "Rip Current",
  "Bamboo Brigade",
  "The Breakfast Club",
  "Tiki Torches",
  "The Mangroves",
  "Sandcastle Kings",
  "Palm Pilots",
  "The Tortugas",
  "Hidden Agenda",
  "The Lighthouse",
  "Silent Partners",
  "Coconut Mafia",
  "The Hermit Crabs",
  "Second Wind",
  "The Riptide",
  "Undertow",
  "The Cove",
  "Paper Lanterns",
  "The Night Shift",
  "Island Royalty",
  "The Compass",
  "Fireflies",
  "The Lost Boys",
  "Hammerheads",
  "The Grind",
  "Camp Counselors",
  "Velvet Rope",
  "Barnacles",
  "The Shipwrights",
  "Saltwater Saints",
  "Moonshiners",
  "The Kitchen Cabinet",
  "Gold Coast",
  "The Anchors",
  "Sea Glass",
  "Volcano Club",
  "The Sundial",
  "Iron Palms",
  "Driftwood Dynasty",
  "The Jetty",
  "Coconut Telegraph",
  "The Wreckers",
];
// Numbered names only ever go to alliances with exactly that many members.
const SIZED_ALLIANCE_NAMES: Record<number, string[]> = {
  2: [
    "Dynamic Duo",
    "Double Trouble",
    "The Pair",
    "Two Peas",
    "Final Two Pact",
    "Twin Flames",
    "Tag Team",
    "Bonnie & Clyde",
  ],
  3: [
    "Three Amigos",
    "Triple Threat",
    "The Trio",
    "Triangle",
    "Three Musketeers",
    "Trident",
    "Third Wheel Club",
    "Tripod",
  ],
  4: [
    "Four Horsemen",
    "Fab Four",
    "Fantastic Four",
    "Four Corners",
    "Four Leaf Clover",
    "The Quad Squad",
    "Square Deal",
  ],
  5: ["Starting Five", "Five Guys", "High Five", "The Pentagon", "Fist of Five", "Fifth Element Crew"],
  6: ["Six Pack", "Six Shooters", "The Hex", "Sixth Sense"],
  7: ["Seven Seas", "Lucky Sevens", "Magnificent Seven"],
};
const ALL_SIZED = Object.values(SIZED_ALLIANCE_NAMES).flat();
const MORE_ALLIANCE_NAMES = [
  "Loose Cannons",
  "The Alibi",
  "Back Porch Pact",
  "Smoke & Mirrors",
  "The Decoys",
  "Pocket Aces",
  "The Weather Vane",
  "Sand Fleas",
  "The Escape Route",
  "Open Secrets",
  "The Uninvited",
  "Deep Cover",
  "Campfire Confidants",
  "The Wild Cards",
  "The Rumor Mill",
  "Last Laugh",
  "The Detour",
  "The Smokehouse",
  "The Lemon Sharks",
  "The Spare Keys",
  "The Paper Trail",
  "Under the Radar",
  "The Hatch",
  "The Hideaway",
  "The Loose Ends",
  "The Back Channel",
  "The Lookouts",
  "The Switchboard",
  "The Outsiders",
  "Off the Record",
  "The Safety Net",
  "The Stowaways",
  "The Sandpipers",
  "The Drift",
  "Crab Walk",
  "The Side Quest",
  "The Rain Check",
  "The Red Herring",
  "The Glass Ceiling",
  "The Night Watch",
  "The Bait Shop",
  "The Shortcut",
  "The Undertakers",
  "The Supply Closet",
  "The Runaways",
  "The Fire Escape",
  "The Curtain Call",
  "The Ghost Crew",
  "The Scapegoats",
  "The Ripple Effect",
  "The Blind Spot",
  "The Lockbox",
  "The Bluff",
  "The Signal",
];
const sizedFor = (name: string) =>
  Number(Object.entries(SIZED_ALLIANCE_NAMES).find(([, v]) => v.includes(name))?.[0] ?? 0);
export function allianceName(size: number, taken: string[]): string {
  const sized = (SIZED_ALLIANCE_NAMES[size] ?? []).filter((n) => !taken.includes(n));
  const plain = [...ALLIANCE_NAMES, ...MORE_ALLIANCE_NAMES].filter((n) => !taken.includes(n));
  if (sized.length && (Math.random() < 0.12 || !plain.length)) return pick(sized);
  if (plain.length) return pick(plain);
  let k = 2;
  while (taken.includes(`The Alliance ${"I".repeat(k)}`)) k++;
  return `The Alliance ${"I".repeat(k)}`;
}
// Renames any numbered alliance whose member count no longer matches its number.
export function fixAllianceNames(s: GameState) {
  for (const a of s.alliances) {
    const n = sizedFor(a.name);
    if (n && n !== a.members.length) {
      const old = a.name;
      a.name = allianceName(
        a.members.length,
        s.alliances.map((x) => x.name),
      );
      if (s.episodes.length)
        log(s, {
          kind: "alliance",
          title: "Alliance Renamed",
          text: `With ${a.members.length} members now, "${old}" regroups as "${a.name}".`,
        });
    }
  }
}
export { ALL_SIZED };
const EP_TITLES = [
  "The Island Has Spoken",
  "Sand in My Teeth",
  "Torches at Dusk",
  "Coconut Diplomacy",
  "Hold Your Fire",
  "Buffs and Bruises",
  "The Snake Pit",
  "Sunburned Strategies",
  "Rock Bottom",
  "Whispers by the Well",
  "A Storm Is Coming",
  "Paper Thin Promises",
  "Double Trouble",
  "Every Rock Has Two Sides",
  "Fire in the Belly",
  "Smoke Signals",
  "The Jungle Remembers",
  "Keep Your Enemies Closer",
  "Tree Mail Tremors",
  "Hunger Games at Camp",
  "Cracks in the Shelter",
  "No Safe Seats",
  "Chasing Shadows",
  "Last Light",
  "The Purple Rock",
  "Spilled Rice",
  "Low Tide, High Stakes",
  "Riding the Wave",
  "A Vote Is a Vote",
  "Ticking Time Bomb",
  "Dead Weight",
  "Born to Scheme",
  "The Merge Feast",
  "Cutthroat Paradise",
  "Lightning Strikes Twice",
  "I'm Not Here to Make Friends",
  "Blindside City",
  "The Tide Turns",
  "Snakes in the Grass",
  "Who Can You Trust?",
  "Playing With Fire",
  "Calm Before the Storm",
  "A Bridge Too Far",
  "Don't Get Comfortable",
  "Idol Chatter",
  "Trust Nobody",
  "Rice and Paranoia",
  "Numbers Game",
  "Out of the Frying Pan",
  "The Long Con",
  "Torch Snuffer",
  "Butterflies and Machetes",
  "Salt in the Wound",
  "Mutiny at Dawn",
  "The Coconut Telegraph",
  "Smile and Nod",
  "Nothing to Lose",
  "Bad Blood, Good Fish",
  "Read the Room",
  "Going Rogue",
  "Thin Ice in the Tropics",
  "Sleeping With One Eye Open",
  "The Fuse Is Lit",
  "Say It to My Face",
  "One Bad Day",
  "Sharks Circling",
  "Bold Moves Only",
  "A House Divided",
  "The Swing Vote",
  "Pecking Order",
  "Shifting Sands",
];

let rand: (() => number) | null = null;
const r = () => (rand ? rand() : Math.random());
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
class RevotePause {
  constructor(
    public options: string[],
    public votes: Vote[] = [],
    public summary: string[] = [],
  ) {}
}
const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
const shuffle = <T,>(a: T[]): T[] => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
export const randStat = () => 1 + Math.floor(r() * 5);
export function randomStats(): Record<StatKey, number> {
  return Object.fromEntries([...SOCIAL_STATS, ...CHALLENGE_STATS].map((k) => [k, randStat()])) as Record<
    StatKey,
    number
  >;
}
export function defaultJury(n: number) {
  return n <= 12 ? 7 : n <= 16 ? 8 : n <= 18 ? 8 : 9;
}
export function defaultMergeAt(n: number, jury: number, final: number) {
  return Math.min(final + jury + 1, n - 2);
}

export function makeRoster(
  n: number,
  tribeCount: number,
  existing?: { name: string; stats: Record<StatKey, number> }[],
  avoid: string[] = [],
) {
  // Unique names; names in `avoid` (e.g. the current cast) are used only if the pool runs out.
  const pool = [...new Set(NAMES)];
  const names = [...shuffle(pool.filter((x) => !avoid.includes(x))), ...shuffle(pool.filter((x) => avoid.includes(x)))];
  return Array.from({ length: n }, (_, i) => ({
    name: existing?.[i]?.name ?? names[i],
    stats: existing?.[i]?.stats ?? randomStats(),
    tribeIndex: i % tribeCount,
  }));
}

export function newGame(
  config: Config,
  tribes: Tribe[],
  roster: { name: string; stats: Record<StatKey, number>; tribeIndex: number }[],
): GameState {
  config = { ...config };
  if (config.themeTwist === "journey") config.journeys = true;
  if (config.themeTwist === "exile") config.exileIsland = true;
  if (config.themeTwist === "return") config.edgeOfExtinction = true;
  if (config.themeTwist === "fire" && config.finalSize === 3) config.fireAtF4 = true;
  if (config.themeTwist === "double") {
    config.doubleTribals = true;
    config.jointTribals = false;
  }
  const castaways: Castaway[] = roster.map((p, i) => ({
    id: `c${i}`,
    name: p.name,
    tribeId: tribes[p.tribeIndex].id,
    originalTribeId: tribes[p.tribeIndex].id,
    stats: { ...p.stats },
    out: false,
    juror: false,
    idols: 0,
    advantages: [],
    mood: 70,
    immunityWins: 0,
    betrayedBy: [],
  }));
  const rel: Record<string, number> = {};
  for (const a of castaways)
    for (const b of castaways)
      if (a.id < b.id) rel[key(a.id, b.id)] = Math.round((r() - 0.5) * 10 + (a.tribeId === b.tribeId ? 3 : 0));
  const hiddenIdols: Record<string, number> = {};
  tribes.forEach((t) => (hiddenIdols[t.id] = 1));
  return {
    config,
    castaways,
    tribes,
    alliances: [],
    rel,
    day: 1,
    phase: "camp",
    merged: false,
    swapped: false,
    immune: [],
    tribalTribe: null,
    hiddenIdols,
    usedChallenges: [],
    rewardAdvantageGiven: false,
    episodes: [
      {
        n: 1,
        title: pick(EP_TITLES.slice(0, 20)),
        entries: [
          {
            kind: "twist",
            title: "The Adventure Begins",
            text: `${castaways.length} castaways are marooned and divided into ${tribes.length} tribes: ${tribes.map((t) => t.name).join(", ")}.`,
          },
          ...(config.themeTwist
            ? [
                {
                  kind: "twist" as const,
                  title: "This Season’s Twist",
                  text: `${config.seasonTitle ?? "This season"}: ${SEASON_TWIST_LABEL[config.themeTwist]}.`,
                },
              ]
            : []),
        ],
      },
    ],
  };
}

// ---------- helpers ----------
export const getRel = (s: GameState, a: string, b: string) => s.rel[key(a, b)] ?? 0;
const addRel = (s: GameState, a: string, b: string, d: number) => {
  if (a !== b) s.rel[key(a, b)] = clamp(getRel(s, a, b) + d, -50, 50);
};
export const alive = (s: GameState) => s.castaways.filter((c) => !c.out);
export const canDiscoverIdol = (s: GameState) => alive(s).length > 4;
export const isIdolInPlay = (s: GameState, tid: string) =>
  alive(s).some((c) =>
    c.idolOrigins?.length
      ? c.idolOrigins.includes(tid)
      : tid === "merged"
        ? false
        : !s.merged && c.tribeId === tid && (c.idols || 0) > 0,
  );
export const advantageSearchChance = (strategy: number) => 0.004 + strategy * 0.005;
export const byId = (s: GameState, id: string) => s.castaways.find((c) => c.id === id)!;
const nm = (s: GameState, id: string) => byId(s, id).name;
const groups = (s: GameState) => {
  const m = new Map<string, Castaway[]>();
  for (const c of alive(s)) {
    if (!m.has(c.tribeId)) m.set(c.tribeId, []);
    m.get(c.tribeId)!.push(c);
  }
  return m;
};
export const tribeOf = (s: GameState, id: string) => s.tribes.find((t) => t.id === id);
const ep = (s: GameState) => s.episodes[s.episodes.length - 1];
const log = (s: GameState, e: LogEntry) => ep(s).entries.push(e);
const sharedAlliance = (s: GameState, a: string, b: string) =>
  s.alliances.some((al) => al.members.includes(a) && al.members.includes(b));
const threat = (c: Castaway) =>
  (c.stats.strategy + c.stats.social) * 0.6 +
  (c.stats.general + c.stats.physical + c.stats.endurance + c.stats.mental) * 0.25 +
  c.immunityWins * 0.8;
const missingAdv = (c: Castaway) => ADVANTAGES.filter((a) => !(c.advantages ?? []).includes(a));
const giveAdvantage = (c: Castaway, s?: GameState): AdvantageKey | null => {
  if (s && alive(s).length <= 5) return null;
  const opts = missingAdv(c);
  if (!opts.length) return null;
  const a = pick(opts);
  c.advantages = [...(c.advantages ?? []), a];
  return a;
};
export const amuletHolders = (s: GameState) => alive(s).filter((c) => c.amulet);
export function amuletDescription(s: GameState): string {
  const n = amuletHolders(s).length;
  const power = n >= 3 ? "one shared extra vote" : n === 2 ? "one shared steal-a-vote" : "a hidden immunity idol";
  return `${n} holder${n === 1 ? "" : "s"} remain: ${power}. All remaining amulets must be played together at the same Tribal Council. Valid through the final six.`;
}
function noteAmuletStage(s: GameState) {
  const n = amuletHolders(s).length;
  if (!s.amuletsGiven || s.amuletsConsumed || !n || (s.amuletStages ?? []).includes(n)) return;
  s.amuletStages = [...(s.amuletStages ?? []), n];
  log(s, {
    kind: "idol",
    title: `Advantage Amulet: ${n} Holder${n === 1 ? "" : "s"} Remain`,
    text: amuletDescription(s),
    details: amuletHolders(s).map((c) => `${c.name} — ${tribeOf(s, c.tribeId)?.name}`),
  });
}
function awardAmulets(s: GameState) {
  if (s.amuletsGiven || s.episodes.some((e) => e.entries.some((en) => en.title.startsWith("Reward Challenge:"))))
    return;
  const pools = shuffle([...groups(s).values()]).map((ms) => shuffle(ms));
  // Exactly one volunteer from every tribe, so each tribe is represented equally.
  const volunteers = pools.map((ms) => ms[0]).filter((c): c is Castaway => !!c);
  if (volunteers.length < 2 || volunteers.length !== pools.length) return;
  s.amuletsGiven = true;
  volunteers.forEach((c) => {
    c.amulet = true;
  });
  log(s, {
    kind: "twist",
    title: "First Reward: Amulet Volunteers",
    text: `${volunteers.map((c) => c.name).join(", ")} volunteer during the first reward challenge and each receive an Advantage Amulet.`,
  });
  noteAmuletStage(s);
}
const BEWARE_TASKS = [
  "secretly tie a strip of red cloth to the challenge flag without being seen",
  "sneak a marked shell into the other tribe's supply bag at a challenge",
  "swap the tribe's machete for the one hidden under the tree-mail box without anyone noticing",
  'slip the hidden token onto the challenge mat before Jeff says "Survivors ready"',
];
const BEWARE_PHRASES = ['"The tide waits for no one"', '"Coconuts are overrated"', '"Is it hot or is it just me?"'];
function bewareTask(s: GameState) {
  return new Set(alive(s).map((c) => c.tribeId)).size > 1 && r() < 0.5
    ? `get someone from every other tribe to say ${pick(BEWARE_PHRASES)} at the next challenge`
    : pick(BEWARE_TASKS);
}
function canFindBeware(s: GameState) {
  // Older saved seasons may not have the flag, so also inspect their evidence.
  return (
    s.config.bewareAdvantages &&
    !s.bewareFound &&
    !s.episodes.some((e) => e.entries.some((en) => en.title.includes("Beware Advantage"))) &&
    r() < 0.35
  );
}
const weakness = (c: Castaway) => 5 - (c.stats.general + c.stats.physical + c.stats.endurance + c.stats.mental) / 4;

// ---------- decisions needed ----------
export type Pending =
  | {
      kind: "camp";
      options: Castaway[];
      canSearchAtChallenge: boolean;
      fakeStatus?: "own" | "planted";
      plantTargets: Castaway[];
      giveables: string[];
      bewareTask?: string;
    }
  | {
      kind: "tribal";
      options: Castaway[];
      hasIdol: boolean;
      advantages: AdvantageKey[];
      idolTargets: Castaway[];
      canGiveImmunity: boolean;
      noVote: boolean;
      canPlayAmulet: boolean;
      canShoot: boolean;
    }
  | { kind: "cut"; options: Castaway[]; fire: boolean }
  | { kind: "jury"; options: Castaway[] }
  | { kind: "revote"; options: Castaway[]; votes: Vote[]; summary: string[] }
  | null;

export const tribalGroup = (s: GameState) =>
  s.tribalTribes?.length ? s.tribalTribes : s.tribalTribe ? [s.tribalTribe] : [];
export const attendees = (s: GameState) => {
  const g = tribalGroup(s);
  return alive(s).filter((c) => g.includes(c.tribeId));
};

/** KIP can take one transferable item, including amulets and idols even if the user holds one. */
export function kipItems(holder: Castaway, target: Castaway): ("idol" | "amulet" | AdvantageKey)[] {
  return [
    ...(target.idols > 0 && !(target.bewareTribals > 0) ? ["idol" as const] : []),
    ...(target.amulet ? ["amulet" as const] : []),
    ...target.advantages.filter((a) => !holder.advantages.includes(a) || a === "knowledge_is_power"),
  ];
}

const byName = (a: Castaway, b: Castaway) => a.name.localeCompare(b.name);

export function pendingDecision(s: GameState): Pending {
  const me = s.config.controlledId ? byId(s, s.config.controlledId) : null;
  if (me?.juror && s.phase === "ftc")
    return { kind: "jury", options: (s.finalists ?? alive(s).map((c) => c.id)).map((id) => byId(s, id)).sort(byName) };
  if (!me || me.out) return null;
  if (s.phase === "tribal" && s.pendingRevote)
    return {
      kind: "revote",
      options: s.pendingRevote.options.map((id) => byId(s, id)).sort(byName),
      votes: s.pendingRevote.votes ?? [],
      summary: s.pendingRevote.summary ?? [],
    };
  if (s.phase === "camp") {
    const options = alive(s)
      .filter((c) => c.tribeId === me.tribeId && c.id !== me.id)
      .sort(byName);
    return {
      kind: "camp",
      options,
      canSearchAtChallenge: (s.hiddenIdols[me.tribeId] ?? 0) > 0 && !isIdolInPlay(s, me.tribeId),
      fakeStatus: me.fakeIdol,
      plantTargets: options.filter((c) => c.idols === 0 && !c.fakeIdol),
      bewareTask: me.bewareTribals ? me.bewareTask : undefined,
      giveables: [
        ...(me.idols > 0 && !me.bewareTribals ? ["idol"] : []),
        ...(alive(s).length > 5 ? me.advantages : []),
      ],
    };
  }
  if (s.phase === "tribal" && tribalGroup(s).includes(me.tribeId)) {
    const att = attendees(s);
    return {
      kind: "tribal",
      options: att.filter((c) => c.id !== me.id && !s.immune.includes(c.id)).sort(byName),
      hasIdol: me.idols > 0 && !(me.bewareTribals > 0),
      noVote: !!me.lostVote,
      advantages: alive(s).length <= 5 ? [] : [...(me.advantages ?? [])],
      idolTargets: att.filter((c) => !s.immune.includes(c.id)).sort(byName),
      canGiveImmunity: s.merged && s.immune.includes(me.id),
      canShoot:
        s.config.shotInTheDark !== false &&
        !me.shotUsed &&
        !me.lostVote &&
        !s.immune.includes(me.id) &&
        alive(s).length > 5,
      canPlayAmulet:
        !!me.amulet && alive(s).length >= 6 && amuletHolders(s).every((c) => att.some((a) => a.id === c.id)),
    };
  }
  if (s.phase === "final_choice" && s.finalImmune === me.id) {
    return {
      kind: "cut",
      options: alive(s)
        .filter((c) => c.id !== me.id)
        .sort(byName),
      fire: isFireFinal(s),
    };
  }
  return null;
}

// ---------- step ----------
export function step(prev: GameState, d: Decision = {}): GameState {
  const s: GameState = structuredClone(prev);
  switch (s.phase) {
    case "camp": {
      doCamp(s, d);
      giftFoundIdols(s);
      if (alive(s).length <= s.config.finalSize + 1) {
        s.phase = "final_challenge";
        break;
      }
      // A quit or medevac replaces this round's vote: no challenge or Tribal Council.
      if (s.noTribal) {
        delete s.noTribal;
        s.immune = [];
        log(s, {
          kind: "twist",
          title: "No Tribal Council",
          text: "With someone already gone, Jeff calls off this round's immunity challenge and Tribal Council. Nobody is voted out.",
        });
        afterTribal(s);
        break;
      }
      s.phase = "challenge";
      break;
    }
    case "challenge":
      doChallenge(s);
      giftFoundIdols(s);
      s.phase = "tribal";
      break;
    case "tribal": {
      const pr = s.pendingRevote;
      delete s.pendingRevote;
      const seed = pr?.seed ?? Math.floor(Math.random() * 2 ** 31);
      const dd: Decision = pr ? { ...pr.decision, revoteVote: d.revoteVote, revoteDecided: true } : d;
      rand = seeded(seed);
      try {
        doTribal(s, dd);
      } catch (e) {
        if (!(e instanceof RevotePause)) throw e;
        const held = structuredClone(prev);
        held.pendingRevote = { seed, decision: d, options: e.options, votes: e.votes, summary: e.summary };
        return held;
      } finally {
        rand = null;
      }
      afterTribal(s);
      break;
    }
    case "final_challenge":
      doFinalChallenge(s);
      s.phase = "final_choice";
      break;
    case "final_choice":
      doFinalChoice(s, d);
      s.phase = "ftc";
      prepareFTC(s);
      break;
    case "ftc":
      prepareFTC(s);
      doFTC(s, d);
      s.phase = "done";
      break;
  }
  fixAllianceNames(s);
  return s;
}

export function simulateToEnd(s: GameState): GameState {
  let g = s;
  let guard = 0;
  while (g.phase !== "done" && guard++ < 500) g = step(g);
  return g;
}

// ---------- camp ----------
export const randomExitCandidates = (s: GameState) => alive(s).filter((c) => c.id !== s.config.controlledId);
export const allianceRecruitmentScore = (s: GameState, recruiter: string, candidate: string) =>
  getRel(s, recruiter, candidate) + (candidate === s.config.controlledId ? 8 : 0);

function doCamp(s: GameState, d: Decision) {
  const controlled = alive(s).find((c) => c.id === s.config.controlledId);
  if (d.quit && controlled) {
    eliminate(s, controlled, "quit");
    s.noTribal = true;
    log(s, {
      kind: "drama",
      title: "A Castaway Quits",
      text: `${controlled.name} chooses to leave and asks for their torch to be snuffed. ${controlled.name} has quit the game.`,
    });
    return;
  }
  if (
    !s.merged &&
    s.config.journeys &&
    groups(s).size >= 2 &&
    (s.journeysDone ?? 0) < 2 &&
    ((s.config.themeTwist === "journey" && !s.journeysDone) || r() < 0.3)
  )
    doJourney(s);
  for (const [tid, members] of groups(s)) {
    const t = tribeOf(s, tid)!;
    const details: string[] = [];
    // drift & bonding
    for (const a of members)
      for (const b of members)
        if (a.id < b.id) {
          const bond = (a.stats.social + b.stats.social) / 2;
          addRel(s, a.id, b.id, Math.round((r() - 0.4) * bond * 1.5));
        }
    for (const a of members) {
      if (r() < a.stats.social * 0.05 && members.length > 1) {
        const b = pick(members.filter((x) => x.id !== a.id));
        addRel(s, a.id, b.id, 7);
        details.push(
          `${a.name} and ${b.name} bonded ${pick(["over fishing", "while gathering firewood", "late at night by the fire", "talking about home", "building the shelter"])}.`,
        );
      }
    }
    // arguments
    for (const a of members) {
      if (members.length > 1 && r() < (6 - a.stats.temperament) * 0.055) {
        const b = pick(members.filter((x) => x.id !== a.id));
        const sev = 6 + Math.round(r() * 10);
        addRel(s, a.id, b.id, -sev);
        a.mood = clamp(a.mood - 8, 0, 100);
        b.mood = clamp(b.mood - 5, 0, 100);
        members.forEach((m) => m.id !== a.id && m.id !== b.id && addRel(s, m.id, a.id, -2));
        log(s, {
          kind: "drama",
          title: `${t.name}: Camp Drama`,
          text: `${a.name} blew up at ${b.name} ${pick(["over the rice rations", "for sleeping in", "about not pulling their weight", "after overhearing whispers", "over the fire going out"])}.`,
          details: [`Relationship ${a.name} ↔ ${b.name}: -${sev}`, `The tribe grows wary of ${a.name}.`],
        });
      }
    }
    // alliances
    for (const a of shuffle(members)) {
      const mine = s.alliances.filter((al) => al.members.includes(a.id));
      if (a.id === s.config.controlledId || mine.length >= 2 || members.length < 3) continue;
      if (r() < a.stats.strategy * 0.05) {
        const size = 1 + Math.floor(r() * Math.min(3, members.length - 2));
        const partners = members
          .filter((x) => x.id !== a.id)
          .sort((x, y) => allianceRecruitmentScore(s, a.id, y.id) - allianceRecruitmentScore(s, a.id, x.id))
          .slice(0, size);
        if (!partners.length || getRel(s, a.id, partners[0].id) < 0) continue;
        const al: Alliance = {
          id: `a${s.alliances.length}${Date.now() % 1000}`,
          name: allianceName(
            partners.length + 1,
            s.alliances.map((x) => x.name),
          ),
          members: [a.id, ...partners.map((p) => p.id)],
        };
        s.alliances.push(al);
        for (const x of al.members) for (const y of al.members) if (x < y) addRel(s, x, y, 6);
        log(s, {
          kind: "alliance",
          title: `${t.name}: Alliance Formed`,
          text: `${a.name} pulled ${partners.map((p) => p.name).join(", ")} aside to form "${al.name}".`,
        });
      }
    }
    // idol hunting
    const idolInPlay = isIdolInPlay(s, tid);
    if (canDiscoverIdol(s) && (s.hiddenIdols[tid] ?? 0) > 0 && !idolInPlay) {
      for (const a of shuffle(members.filter((c) => c.id !== s.config.controlledId && c.idols === 0))) {
        if (!a.clue && r() < 0.03 + a.stats.strategy * 0.01) {
          a.clue = true;
          log(s, {
            kind: "idol",
            title: `${t.name}: Idol Clue Found`,
            text: `${a.name} found a rolled-up idol clue ${pick(["tucked in the rafters", "under a rock by the well", "in the tree mail box", "taped under the bench"])}.`,
          });
          continue;
        }
        if (r() < (a.clue ? 0.25 : 0.01) + a.stats.strategy * 0.015) {
          a.idols++;
          a.idolOrigins = [...(a.idolOrigins || []), tid];
          s.hiddenIdols[tid] = 0;
          if (a.clue) a.clue = false;
          const hidingPlace = pick(IDOL_HIDING_PLACES);
          if (canFindBeware(s)) {
            s.bewareFound = true;
            a.bewareTribals = 1;
            a.bewareTask = bewareTask(s);
            log(s, {
              kind: "idol",
              title: `${t.name}: Beware Advantage!`,
              text: `${a.name} opened a note reading "BEWARE" ${hidingPlace}. The idol is locked until they ${a.bewareTask}.`,
            });
            break;
          }
          log(s, {
            kind: "idol",
            title: `${t.name}: Idol Found!`,
            text: `${a.name} snuck away and found a Hidden Immunity Idol ${hidingPlace}.`,
          });
          break;
        }
      }
    } else {
      // advantages only surface once this camp's idol has been found
      for (const a of shuffle(
        members.filter((c) => alive(s).length > 5 && c.id !== s.config.controlledId && missingAdv(c).length),
      )) {
        if (r() < advantageSearchChance(a.stats.strategy)) {
          const adv = giveAdvantage(a, s)!;
          log(s, {
            kind: "idol",
            title: `${t.name}: Advantage Found!`,
            text: `${a.name} quietly pocketed a ${ADVANTAGE_LABEL[adv]} advantage.`,
          });
          break;
        }
      }
    }
    // idols & advantages are transferable — holders sometimes pass them to their closest ally
    for (const holder of shuffle(
      members.filter((c) => c.id !== s.config.controlledId && (c.idols > 0 || c.advantages.length)),
    )) {
      const best = members
        .filter((c) => c.id !== holder.id)
        .sort((a, b) => getRel(s, holder.id, b.id) - getRel(s, holder.id, a.id))[0];
      const toMe = best?.id === s.config.controlledId;
      if (!best || getRel(s, holder.id, best.id) < (toMe ? 4 : 8) || r() >= (toMe ? 0.2 : 0.08)) continue;
      if (holder.idols > 0 && best.idols === 0 && !holder.bewareTribals) {
        holder.idols--;
        best.idols++;
        const orig = (holder.idolOrigins && holder.idolOrigins.pop()) || holder.tribeId;
        best.idolOrigins = [...(best.idolOrigins || []), orig];
        log(s, {
          kind: "idol",
          title: `${t.name}: Idol Handed Over`,
          text: `${holder.name} secretly slipped their Hidden Immunity Idol to ${best.name} for safekeeping.`,
        });
      } else if (
        holder.advantages.length &&
        alive(s).length > 5 &&
        holder.advantages.some((x) => !best.advantages.includes(x))
      ) {
        const adv = holder.advantages.find((x) => !best.advantages.includes(x))!;
        holder.advantages = holder.advantages.filter((x) => x !== adv);
        best.advantages.push(adv);
        addRel(s, holder.id, best.id, 5);
        log(s, {
          kind: "idol",
          title: `${t.name}: Advantage Handed Over`,
          text: `${holder.name} quietly passed their ${ADVANTAGE_LABEL[adv]} advantage to ${best.name}.`,
        });
      }
    }
    for (const m of members) {
      const avg =
        members.reduce((acc, o) => (o.id === m.id ? acc : acc + getRel(s, m.id, o.id)), 0) /
        Math.max(1, members.length - 1);
      m.mood = clamp(Math.round(m.mood * 0.7 + (60 + avg * 1.5) * 0.3), 5, 100);
    }
    // random camp events
    if (r() < 0.65 && members.length) {
      const ev = pick(CAMP_EVENTS);
      const a = pick(members);
      const b = pick(members.filter((x) => x.id !== a.id)) ?? a;
      ev.fx(s, a, b, members);
      log(s, { kind: ev.kind, title: `${t.name}: ${ev.title}`, text: ev.text(a.name, b.name) });
    }
    log(s, {
      kind: "camp",
      title: `${t.name}: Life at Camp`,
      text: `Day ${s.day}. ${pick(["The rain wouldn't stop.", "Spirits are high at camp.", "Hunger is setting in.", "The heat is brutal.", "Paranoia is creeping in."])}`,
      details: details.length ? details : ["A quiet day at camp."],
    });
  }
  addConfessionals(s);
  // medevacs & quits (rare, at most one per episode)
  if (alive(s).length > s.config.finalSize + 3) {
    const pool = randomExitCandidates(s);
    const med = pool.find(() => r() < 0.0008);
    const quitter = !med && pool.filter((c) => c.mood < 20 && c.stats.temperament <= 2).find(() => r() < 0.015);
    const gone = med || quitter;
    if (gone) {
      eliminate(s, gone, med ? "medevac" : "quit");
      s.noTribal = true;
      log(
        s,
        med
          ? {
              kind: "twist",
              title: "Medical Evacuation",
              text: `${gone.name} ${pick(["collapsed from dehydration", "suffered a serious infection in their leg", "dislocated a shoulder during a camp chore", "was struck by severe heat exhaustion"])}. Medical makes the call: ${gone.name} is pulled from the game${gone.juror ? " and joins the jury" : ""}.`,
            }
          : {
              kind: "drama",
              title: "A Castaway Quits",
              text: `Worn down and miserable, ${gone.name} asks for their torch to be snuffed. ${gone.name} has quit the game.`,
            },
      );
    }
  }
  // player approach
  if (s.config.controlledId && byId(s, s.config.controlledId).out) d = {};
  if (d.allyWith === "__random__" && s.config.controlledId) {
    const meC = byId(s, s.config.controlledId);
    const opts = alive(s).filter((c) => c.tribeId === meC.tribeId && c.id !== meC.id);
    d = { ...d, allyWith: opts.length ? pick(opts).id : undefined };
  }
  if (d.searchIdol && s.config.controlledId && canDiscoverIdol(s)) {
    const meC = byId(s, s.config.controlledId);
    const spot = d.searchSpot && SEARCH_SPOTS.includes(d.searchSpot) ? d.searchSpot : pick(SEARCH_SPOTS);
    const roll = r() - meC.stats.strategy * 0.02;
    const idolInPlay = isIdolInPlay(s, meC.tribeId);
    const idolHere = (s.hiddenIdols[meC.tribeId] ?? 0) > 0 && meC.idols === 0 && !idolInPlay;
    let adv: AdvantageKey | null = null;
    if (idolHere && roll < (meC.clue ? 0.55 : 0.22)) {
      meC.idols = (meC.idols || 0) + 1;
      meC.idolOrigins = [...(meC.idolOrigins || []), meC.tribeId];
      meC.clue = false;
      s.hiddenIdols[meC.tribeId] = 0;
      const hidingPlace = pick(IDOL_HIDING_PLACES);
      if (canFindBeware(s)) {
        s.bewareFound = true;
        meC.bewareTribals = 1;
        meC.bewareTask = bewareTask(s);
        log(s, {
          kind: "idol",
          title: "Your Search: Beware Advantage!",
          text: `At ${spot} you found a note marked "BEWARE" ${hidingPlace}. The idol is locked until you ${meC.bewareTask}.`,
        });
      } else
        log(s, {
          kind: "idol",
          title: "Your Search: Idol Found!",
          text: `You slipped away to search ${spot} — and found a Hidden Immunity Idol ${hidingPlace}!`,
        });
    } else if (!idolHere && roll < 0.15 && (adv = giveAdvantage(meC, s))) {
      log(s, {
        kind: "idol",
        title: "Your Search: Advantage Found!",
        text: `You searched ${spot} and found a ${ADVANTAGE_LABEL[adv]} advantage. ${ADVANTAGE_DESC[adv]}`,
      });
    } else if (idolHere && !meC.clue && roll < 0.45) {
      meC.clue = true;
      log(s, {
        kind: "idol",
        title: "Your Search: Idol Clue!",
        text: `No idol at ${spot}, but you found a clue to where it's hidden. Your next search is much more likely to succeed.`,
      });
    } else {
      for (const o of alive(s).filter((c) => c.tribeId === meC.tribeId && c.id !== meC.id))
        if (r() < 0.3) addRel(s, meC.id, o.id, -2);
      log(s, {
        kind: "idol",
        title: "Your Search: Nothing",
        text: `You searched ${spot} but came back empty-handed. A few people noticed you were gone.`,
      });
    }
  }
  if (s.config.controlledId && !byId(s, s.config.controlledId).out) {
    const meC = byId(s, s.config.controlledId);
    if (d.challengeIdol && !s.merged && canDiscoverIdol(s)) s.challengeSearch = true;
    if (d.giveItem && d.giveTo) {
      const tg = alive(s).find((c) => c.id === d.giveTo && c.tribeId === meC.tribeId && c.id !== meC.id);
      if (tg && d.giveItem === "idol" && meC.idols > 0 && tg.idols === 0 && !meC.bewareTribals) {
        meC.idols--;
        tg.idols++;
        const orig = (meC.idolOrigins && meC.idolOrigins.pop()) || meC.tribeId;
        tg.idolOrigins = [...(tg.idolOrigins || []), orig];
        addRel(s, meC.id, tg.id, 15);
        mood(tg, 8);
        log(s, {
          kind: "idol",
          title: "You Handed Over an Idol",
          text: `You secretly gave your Hidden Immunity Idol to ${tg.name}. They won't forget it.`,
        });
      } else if (
        tg &&
        d.giveItem !== "idol" &&
        meC.advantages.includes(d.giveItem as AdvantageKey) &&
        !tg.advantages.includes(d.giveItem as AdvantageKey)
      ) {
        const a = d.giveItem as AdvantageKey;
        meC.advantages = meC.advantages.filter((x) => x !== a);
        tg.advantages.push(a);
        addRel(s, meC.id, tg.id, 12);
        mood(tg, 6);
        log(s, {
          kind: "idol",
          title: "You Handed Over an Advantage",
          text: `You quietly passed your ${ADVANTAGE_LABEL[a]} to ${tg.name}.`,
        });
      }
    }
    if (d.craftFake && !meC.fakeIdol) {
      meC.fakeIdol = "own";
      log(s, {
        kind: "idol",
        title: "You Crafted a Fake Idol",
        text: "You carved a convincing fake idol from a coconut, string, and shells.",
      });
    }
    if (meC.fakeIdol === "own" && d.fakeTarget) {
      const opts = alive(s).filter((c) => c.tribeId === meC.tribeId && c.id !== meC.id && c.idols === 0 && !c.fakeIdol);
      const tg = d.fakeTarget === "__random__" ? pick(opts) : opts.find((c) => c.id === d.fakeTarget);
      if (tg) {
        tg.fakeIdol = "planted";
        meC.fakeIdol = undefined;
        log(s, {
          kind: "idol",
          title: "Fake Idol Planted",
          text: `You hid your fake idol where ${tg.name} was sure to find it. They think it's real...`,
        });
      }
    }
  }
  if (d.allyWith && s.config.controlledId) {
    const me = s.config.controlledId,
      them = d.allyWith;
    const target = byId(s, them);
    const accept = getRel(s, me, them) + target.stats.social * 3 + r() * 20 > 15;
    if (accept) {
      addRel(s, me, them, 14);
      if (!sharedAlliance(s, me, them)) {
        const al: Alliance = {
          id: `a${s.alliances.length}p`,
          name: allianceName(
            2,
            s.alliances.map((x) => x.name),
          ),
          members: [me, them],
        };
        s.alliances.push(al);
      }
      log(s, {
        kind: "alliance",
        title: "Your Move",
        text: `You approached ${target.name} — they're in. You've agreed to work together.`,
      });
    } else {
      addRel(s, me, them, -3);
      log(s, {
        kind: "alliance",
        title: "Your Move",
        text: `You approached ${target.name}, but they seemed hesitant and noncommittal.`,
      });
    }
  }
  // Beware idols unlock only when the holder completes the task on their note.
  for (const c of alive(s).filter((x) => x.bewareTribals > 0)) {
    if (c.id === s.config.controlledId && !d.bewareAttempt) continue;
    const task = c.bewareTask ?? "complete the task on the note";
    const phrase = task.includes("say");
    const ok = r() < (phrase ? 0.3 + c.stats.social * 0.06 : 0.25 + c.stats.strategy * 0.07);
    const you = c.id === s.config.controlledId;
    if (ok) {
      c.bewareTribals = 0;
      c.bewareTask = undefined;
      mood(c, 10);
      log(s, {
        kind: "idol",
        title: you ? "Your Beware Idol Is Active!" : "Beware Idol Activated",
        text: `${you ? "You" : c.name} managed to ${task}. The idol is now fully powered.`,
      });
    } else if (!phrase && r() < 0.25) {
      alive(s)
        .filter((m) => m.tribeId === c.tribeId && m.id !== c.id)
        .forEach((m) => addRel(s, m.id, c.id, -4));
      log(s, {
        kind: "drama",
        title: you ? "Caught Sneaking Around" : `${c.name} Caught Sneaking`,
        text: `${you ? "You were" : `${c.name} was`} spotted trying to ${task}. The tribe is suspicious.`,
      });
    } else if (you)
      log(s, {
        kind: "idol",
        title: "Beware Task: Not Yet",
        text: phrase
          ? "You couldn't get everyone to say the phrase this time."
          : "The coast was never clear. You'll have to try again.",
      });
  }
  // Conversations with tribemates: each can work and build the bond, or backfire.
  if (s.config.controlledId && d.talks?.length) {
    const meC = byId(s, s.config.controlledId);
    const spoken = new Set<string>();
    for (const talk of d.talks.slice(0, 2)) {
      const candidates = alive(s).filter((c) => c.tribeId === meC.tribeId && c.id !== meC.id && !spoken.has(c.id));
      const them =
        talk.with === "__random__"
          ? candidates.length
            ? pick(candidates)
            : undefined
          : candidates.find((c) => c.id === talk.with);
      const t = TALK_TOPICS[pick(Object.keys(TALK_TOPICS) as TalkTopic[])];
      if (!them || !t || meC.out) continue;
      spoken.add(them.id);
      const chance = clamp(
        t.base + getRel(s, meC.id, them.id) * 0.004 + meC.stats.social * 0.04 + them.stats.temperament * 0.02 - 0.15,
        0.1,
        0.95,
      );
      const ok = r() < chance;
      addRel(s, meC.id, them.id, ok ? t.win : t.lose);
      mood(them, ok ? 3 : -2);
      log(s, {
        kind: "camp",
        title: `Conversation with ${them.name}: ${ok ? "It Worked" : "It Backfired"}`,
        text: `You tried to ${t.label.toLowerCase()} with ${them.name}. ${them.name} ${ok ? t.ok : t.bad}.`,
        details: [`Relationship ${ok ? "+" : ""}${ok ? t.win : t.lose}`],
      });
    }
  }
  s.day += 1;
}

type CampEvent = {
  kind: LogEntry["kind"];
  title: string;
  text: (a: string, b: string) => string;
  fx: (s: GameState, a: Castaway, b: Castaway, ms: Castaway[]) => void;
};
const mood = (c: Castaway, d: number) => (c.mood = clamp(c.mood + d, 0, 100));
const CAMP_EVENTS: CampEvent[] = [
  {
    kind: "camp",
    title: "Big Catch",
    text: (a) => `${a} speared a huge fish and fed the whole tribe.`,
    fx: (s, a, _b, ms) =>
      ms.forEach((m) => {
        mood(m, 6);
        addRel(s, a.id, m.id, 3);
      }),
  },
  {
    kind: "camp",
    title: "Storm Hits Camp",
    text: () => "A violent storm ripped through camp overnight and flattened the shelter.",
    fx: (_s, _a, _b, ms) => ms.forEach((m) => mood(m, -10)),
  },
  {
    kind: "drama",
    title: "Missing Rice",
    text: (a) => `Rice is disappearing, and suspicion falls on ${a}.`,
    fx: (s, a, _b, ms) => ms.forEach((m) => addRel(s, m.id, a.id, -4)),
  },
  {
    kind: "camp",
    title: "Fire Starter",
    text: (a) => `${a} finally made fire with flint after hours of trying.`,
    fx: (s, a, _b, ms) => ms.forEach((m) => addRel(s, a.id, m.id, 2)),
  },
  {
    kind: "camp",
    title: "Homesick",
    text: (a) => `${a} broke down crying about missing family back home.`,
    fx: (_s, a) => mood(a, -12),
  },
  {
    kind: "drama",
    title: "Caught Scrambling",
    text: (a, b) => `${b} caught ${a} whispering game talk with the other side of the tribe.`,
    fx: (s, a, b) => addRel(s, a.id, b.id, -8),
  },
  {
    kind: "camp",
    title: "Tree Mail",
    text: () => "Tree mail arrives with cryptic hints about what's coming next.",
    fx: (_s, _a, _b, ms) => ms.forEach((m) => mood(m, 2)),
  },
  {
    kind: "camp",
    title: "Late Night Talk",
    text: (a, b) => `${a} and ${b} stayed up all night trading life stories.`,
    fx: (s, a, b) => addRel(s, a.id, b.id, 9),
  },
  {
    kind: "camp",
    title: "Injury Scare",
    text: (a) => `${a} sliced a foot on coral but insists they're fine.`,
    fx: (_s, a) => {
      mood(a, -8);
    },
  },
  {
    kind: "drama",
    title: "Lazy Accusations",
    text: (a) => `The tribe grumbles that ${a} hasn't lifted a finger all day.`,
    fx: (s, a, _b, ms) => ms.forEach((m) => addRel(s, m.id, a.id, -3)),
  },
  {
    kind: "camp",
    title: "Crab Feast",
    text: (a) => `${a} rounded up a bucket of crabs for dinner.`,
    fx: (_s, _a, _b, ms) => ms.forEach((m) => mood(m, 4)),
  },
  {
    kind: "camp",
    title: "Fake Idol Crafted",
    text: (a) => `${a} carved a fake idol out of a coconut and some beads — just in case.`,
    fx: (s, a, b) => {
      mood(a, 3);
      if (a.fakeIdol) return;
      if (b.id !== a.id && b.id !== s.config.controlledId && b.idols === 0 && !b.fakeIdol && r() < 0.6)
        b.fakeIdol = "planted";
      else a.fakeIdol = "own";
    },
  },
  {
    kind: "drama",
    title: "Fire Goes Out",
    text: (a) => `${a} was on fire duty and let the flames die overnight.`,
    fx: (s, a, _b, ms) => ms.forEach((m) => addRel(s, m.id, a.id, -5)),
  },
  {
    kind: "drama",
    title: "Food Hoarding",
    text: (a) => `${a} was caught sneaking extra coconut meat at night.`,
    fx: (s, a, _b, ms) =>
      ms.forEach((m) => {
        addRel(s, m.id, a.id, -6);
        mood(m, -3);
      }),
  },
  {
    kind: "drama",
    title: "Heated Argument",
    text: (a, b) => `${a} and ${b} got into a screaming match over who does the chores.`,
    fx: (s, a, b, ms) => {
      addRel(s, a.id, b.id, -10);
      mood(a, -6);
      mood(b, -6);
      ms.forEach((m) => mood(m, -2));
    },
  },
  {
    kind: "camp",
    title: "Nursed Back to Health",
    text: (a, b) => `${b} came down with a fever and ${a} cared for them through the night.`,
    fx: (s, a, b) => {
      addRel(s, a.id, b.id, 12);
      mood(b, 8);
    },
  },
  {
    kind: "camp",
    title: "Birthday at Camp",
    text: (a) => `It's ${a}'s birthday, and the tribe sang to them around the fire.`,
    fx: (s, a, _b, ms) => {
      mood(a, 15);
      ms.forEach((m) => addRel(s, a.id, m.id, 3));
    },
  },
  {
    kind: "drama",
    title: "Paranoia Spiral",
    text: (a) => `${a} is convinced everyone is plotting against them and can't sleep.`,
    fx: (s, a, _b, ms) => {
      mood(a, -14);
      ms.forEach((m) => addRel(s, m.id, a.id, -2));
    },
  },
  {
    kind: "camp",
    title: "Shelter Rebuilt",
    text: (a, b) => `${a} and ${b} spent the day rebuilding the shelter together.`,
    fx: (s, a, b, ms) => {
      addRel(s, a.id, b.id, 6);
      ms.forEach((m) => mood(m, 5));
    },
  },
  {
    kind: "drama",
    title: "Secret Exposed",
    text: (a, b) => `${b} told the tribe that ${a} has been promising final three deals to everyone.`,
    fx: (s, a, b, ms) => {
      ms.forEach((m) => addRel(s, m.id, a.id, -5));
      addRel(s, a.id, b.id, -12);
      mood(a, -8);
    },
  },
  {
    kind: "camp",
    title: "Shark Sighting",
    text: (a) => `${a} spotted a reef shark near the water hole and nobody wanted to swim for the rest of the day.`,
    fx: () => {},
  },
];

// ---------- challenges ----------
const CH_TYPES: { type: StatKey; names: string[] }[] = [
  {
    type: "physical",
    names: [
      "Sea Crates",
      "Battering Ram",
      "Shipwrecked",
      "Tug of War Brawl",
      "Crate Smash",
      "Log Roll Rumble",
      "Sumo at Sea",
      "Barrel Haul",
      "Cargo Net Climb",
      "Sled Drag",
      "Wrecking Crew",
      "Ball Brawl",
      "Anchor Drag",
      "Raft Wrangle",
      "Tire Flip Frenzy",
      "Boulder Push",
      "Chain Gang",
      "Plank Carry",
      "Mud Pit Melee",
      "Totem Topple",
      "Ramming Speed",
      "Hammer Down",
      "Rope Burn",
      "Dragging Anchor",
    ],
  },
  {
    type: "endurance",
    names: [
      "Hang Time",
      "Last Gasp",
      "Balance Beam Hold",
      "Water Bucket Stand",
      "Pole Hang",
      "Statue Still",
      "Tidal Hold",
      "Weight of the Tribe",
      "Foothold",
      "Sunset Perch",
      "Pole Position",
      "Stand Your Ground",
      "Arm Lock",
      "Drip Drop",
      "Crate Squat",
      "Tiki Lean",
      "Hold the Line",
      "Rising Tide",
      "Ledge Hang",
      "Basket Hold",
      "Long Night",
      "Stillwater",
    ],
  },
  {
    type: "mental",
    names: [
      "Slide Puzzle",
      "Memory Mayhem",
      "Combination Lock",
      "Word Scramble",
      "Tile Twister",
      "Totem Riddle",
      "Mirror Maze",
      "Number Cipher",
      "Knot Unravel",
      "Map Fragments",
      "Tangram Tower",
      "Symbol Sequence",
      "Lantern Logic",
      "Stacking Stones",
      "Rune Reader",
      "Glyph Grid",
      "Shell Sorter",
      "Ladder Logic",
      "Tide Chart",
      "Puzzle Pyramid",
      "Clock Cracker",
      "Compass Code",
      "Mask Match",
      "Star Chart",
    ],
  },
  {
    type: "general",
    names: [
      "Obstacle Gauntlet",
      "Swim & Dive",
      "Ring Toss Relay",
      "Sandbag Throw",
      "Coconut Bowling",
      "Spear Throw",
      "Slingshot Targets",
      "Paddle Relay",
      "Key Hunt",
      "Bridge Builder",
      "Sand Dig Relay",
      "Torch Run",
      "Blowgun Bullseye",
      "Grappling Hook",
      "Wheel of Fortune",
      "Barrel Roll",
      "Lagoon Lunge",
      "Bamboo Maze",
      "Sand Castle Sprint",
      "Bucket Brigade",
      "Net Diver",
      "Chop Chop",
      "Fish Basket Relay",
      "Canoe Scramble",
    ],
  },
];
const indScore = (c: Castaway, t: StatKey) => c.stats.general * 0.5 + c.stats[t] * 1.2 + r() * 3.5;

const seasonChallengeScore = (s: GameState, c: Castaway, t: StatKey) => indScore(c, t);

// Picks a never-before-used challenge; endurance stays locked until the merge.
function freshTitle(s: GameState) {
  const used = s.episodes.map((e) => e.title);
  const opts = EP_TITLES.filter((t) => !used.includes(t));
  if (opts.length) return pick(opts);
  let k = 2;
  const base = pick(EP_TITLES);
  while (used.includes(`${base} (Part ${k})`)) k++;
  return `${base} (Part ${k})`;
}

function pickChallenge(s: GameState, avoidType?: StatKey) {
  s.usedChallenges ??= [];
  let types = CH_TYPES.filter((t) => (s.merged || t.type !== "endurance") && t.type !== avoidType);
  if (!types.length) types = CH_TYPES.filter((t) => s.merged || t.type !== "endurance");
  const fresh = types.flatMap((t) =>
    t.names.filter((n) => !s.usedChallenges.includes(n)).map((name) => ({ type: t.type, name })),
  );
  let choice = fresh.length ? pick(fresh) : null;
  if (!choice) {
    const t = pick(types);
    let k = 2;
    while (s.usedChallenges.includes(`${t.names[0]} ${k}`)) k++;
    choice = { type: t.type, name: `${t.names[0]} ${k}` };
  }
  s.usedChallenges.push(choice.name);
  return choice;
}

function rewardAdvantage(s: GameState, winners: Castaway[]) {
  const clueable = canDiscoverIdol(s)
    ? winners.filter(
        (c) => !c.clue && c.idols === 0 && (s.hiddenIdols[c.tribeId] ?? 0) > 0 && !isIdolInPlay(s, c.tribeId),
      )
    : [];

  if (clueable.length && r() < 0.35) {
    const c = pick(clueable);
    c.clue = true;
    log(s, {
      kind: "idol",
      title: "Reward: Idol Clue!",
      text: `Along with the reward, ${c.name} was handed a sealed clue to the hidden immunity idol.`,
    });
  }
  if (s.rewardAdvantageGiven || !(s.merged || r() < 0.3)) return;
  const eligible = alive(s).length > 5 ? winners.filter((c) => missingAdv(c).length) : [];
  if (!eligible.length) return;
  const c = pick(eligible);
  const adv = giveAdvantage(c, s)!;
  s.rewardAdvantageGiven = true;
  log(s, {
    kind: "idol",
    title: "Reward Advantage!",
    text: `Hidden in the reward basket, ${c.name} discovers a ${ADVANTAGE_LABEL[adv]} advantage. ${ADVANTAGE_DESC[adv]}`,
  });
}

function doChallenge(s: GameState) {
  s.immune = [];
  awardAmulets(s);
  const rew = pickChallenge(s);
  const ch = pickChallenge(s, rew.type);
  if (!s.merged) {
    const g = [...groups(s).entries()];
    const tscore = (ms: Castaway[], t: StatKey) =>
      ms.reduce((a, c) => a + seasonChallengeScore(s, c, t), 0) / ms.length + r() * 3.5;
    const rs = g.map(([tid, ms]) => ({ tid, sc: tscore(ms, rew.type) })).sort((a, b) => b.sc - a.sc);
    log(s, {
      kind: "challenge",
      title: `Reward Challenge: ${rew.name} (${STAT_LABEL[rew.type]})`,
      text: `${tribeOf(s, rs[0].tid)!.name} win reward — ${pick(["fishing gear", "a feast of pizza", "tarp and blankets", "chickens"])}!`,
      details: rs.map((x, i) => `${i + 1}. ${tribeOf(s, x.tid)!.name} — ${x.sc.toFixed(2)}`),
    });
    rs[0] &&
      groups(s)
        .get(rs[0].tid)!
        .forEach((c) => (c.mood = clamp(c.mood + 8, 0, 100)));
    rewardAdvantage(s, groups(s).get(rs[0].tid)!);
    if (
      s.config.exileIsland &&
      ((s.config.themeTwist === "exile" &&
        !s.episodes.some((e) => e.entries.some((x) => x.title === "Exile Island"))) ||
        r() < 0.3)
    )
      doExile(s, rs[0].tid);
    let penTid: string | null = null;
    const ctrlC = s.config.controlledId ? byId(s, s.config.controlledId) : null;
    if (canDiscoverIdol(s) && s.challengeSearch && ctrlC && !ctrlC.out) {
      penTid = ctrlC.tribeId;
      const tid = ctrlC.tribeId;
      if (
        (s.hiddenIdols[tid] ?? 0) > 0 &&
        !isIdolInPlay(s, tid) &&
        ctrlC.idols === 0 &&
        r() - ctrlC.stats.strategy * 0.03 < 0.3
      ) {
        ctrlC.idols = (ctrlC.idols || 0) + 1;
        ctrlC.idolOrigins = [...(ctrlC.idolOrigins || []), tid];
        s.hiddenIdols[tid] = 0;
        log(s, {
          kind: "idol",
          title: "Challenge Idol Grab!",
          text: `Mid-challenge you spotted an idol ${pick(CHALLENGE_IDOL_PLACES)} and snatched it — at a cost to your tribe's time.`,
        });
      } else
        log(s, {
          kind: "idol",
          title: "Challenge Search: Nothing",
          text: "You scanned the course for a hidden idol but found nothing, and your tribe lost precious seconds.",
        });
    } else {
      const lucky = canDiscoverIdol(s)
        ? shuffle(
            alive(s).filter(
              (c) =>
                c.id !== s.config.controlledId &&
                c.idols === 0 &&
                (s.hiddenIdols[c.tribeId] ?? 0) > 0 &&
                !isIdolInPlay(s, c.tribeId),
            ),
          ).find(() => r() < 0.03)
        : undefined;
      if (lucky) {
        lucky.idols = (lucky.idols || 0) + 1;
        lucky.idolOrigins = [...(lucky.idolOrigins || []), lucky.tribeId];
        s.hiddenIdols[lucky.tribeId] = 0;
        penTid = lucky.tribeId;
        log(s, {
          kind: "idol",
          title: "Idol at the Challenge!",
          text: `${lucky.name} spotted an idol ${pick(CHALLENGE_IDOL_PLACES)} and grabbed it mid-challenge.`,
        });
      }
    }
    s.challengeSearch = false;
    // reward winners are worn out from the feast, so the same tribe doesn't sweep every day
    const is = g
      .map(([tid, ms]) => ({
        tid,
        sc: tscore(ms, ch.type) - (tid === rs[0].tid ? 0.8 : 0) - (tid === penTid ? 0.6 : 0),
        mvp: [...ms].sort((a, b) => indScore(b, ch.type) - indScore(a, ch.type))[0],
      }))
      .sort((a, b) => b.sc - a.sc);
    const loser = is[is.length - 1];
    s.tribalTribe = loser.tid;
    s.tribalTribes = [loser.tid];
    s.tribalQueue = [];
    s.twistsUsed ??= [];
    const big = (tid: string) => (groups(s).get(tid)?.length ?? 0) >= 3;
    const immLog = (text: string) =>
      log(s, {
        kind: "challenge",
        title: `Immunity Challenge: ${ch.name} (${STAT_LABEL[ch.type]})`,
        text,
        details: [
          ...is.map((x, i) => `${i + 1}. ${tribeOf(s, x.tid)!.name} — ${x.sc.toFixed(2)} (MVP: ${x.mvp.name})`),
          `${loser.mvp.name} tried to carry, but it wasn't enough.`,
        ],
      });
    const lastTwo = is.length === 2 ? is : is.slice(-2);
    if (is.length >= 2 && s.config.jointTribals !== false && !bigTwistUsed(s) && r() < 0.14) {
      const losing = lastTwo;
      s.twistsUsed.push("joint");
      s.tribalTribes = losing.map((x) => x.tid);
      const pool = losing.flatMap((x) => groups(s).get(x.tid)!);
      const champ = pool.map((c) => ({ c, sc: indScore(c, ch.type) })).sort((a, b) => b.sc - a.sc)[0].c;
      s.immune = [champ.id];
      champ.immunityWins++;
      log(s, {
        kind: "twist",
        title: "Joint Tribal Council!",
        text: `Before the challenge, Jeff reveals a twist: only one tribe wins immunity, and everyone else goes to one Tribal Council together. The best individual performer from the losing tribes wins individual immunity.`,
      });
      immLog(
        `${is[0] && tribeOf(s, is[0].tid)!.name} win${is.length > 2 ? "" : "s"} immunity! ${losing.map((x) => tribeOf(s, x.tid)!.name).join(" and ")} will attend Tribal Council together and vote out one person. ${champ.name} earned individual immunity.`,
      );
    } else if (
      is.length >= 2 &&
      s.config.themeTwist !== "double" &&
      s.config.doubleTribals !== false &&
      !bigTwistUsed(s) &&
      lastTwo.every((x) => big(x.tid)) &&
      r() < 0.12
    ) {
      const losing = lastTwo;
      s.twistsUsed.push("double_pre");
      s.tribalTribes = [losing[1].tid];
      s.tribalQueue = [[losing[0].tid]];
      log(s, {
        kind: "twist",
        title: "Double Tribal Council!",
        text: `Before the challenge, Jeff reveals a twist: ${is.length > 2 ? "only the winning tribes are safe — the last two tribes" : "only the winning tribe is safe — the losing tribe and the runner-up"} will both go to Tribal Council tonight. Two people are going home.`,
      });
      immLog(
        `${
          is
            .slice(0, -2)
            .map((x) => tribeOf(s, x.tid)!.name)
            .join(" & ") || tribeOf(s, is[0].tid)!.name
        } win immunity! ${losing.map((x) => tribeOf(s, x.tid)!.name).join(" and ")} will both face Tribal Council tonight.`,
      );
    } else
      immLog(
        `${is
          .slice(0, -1)
          .map((x) => tribeOf(s, x.tid)!.name)
          .join(" & ")} win immunity! ${tribeOf(s, loser.tid)!.name} will face Tribal Council.`,
      );
  } else {
    const ms = alive(s);
    if (earnTheMergeRound(s, ms, ch)) return;
    // Demerge twist: at Final 10 (or F8 if merged earlier), split into two groups
    const targetSize = s.config.mergeAt < 10 ? 8 : 10;
    if (
      s.config.demergeTwist &&
      ms.length === targetSize &&
      !s.demergeActive &&
      !(s.twistsUsed ?? []).includes("demerge")
    ) {
      const half = Math.floor(ms.length / 2);
      const shuffled = shuffle(ms);
      const groupA = shuffled.slice(0, half);
      const groupB = shuffled.slice(half);
      groupA.forEach((c) => (c.tribeId = "demerge-a"));
      groupB.forEach((c) => (c.tribeId = "demerge-b"));
      const base = tribeOf(s, "merged")?.name ?? "Merged";
      s.tribes = [
        ...s.tribes,
        { id: "demerge-a", name: `${base} A`, color: tribeOf(s, "merged")?.color ?? "#888" },
        { id: "demerge-b", name: `${base} B`, color: tribeOf(s, "merged")?.color ?? "#888" },
      ];
      s.twistsUsed ??= [];
      s.twistsUsed.push("demerge");
      s.demergeActive = true;
      log(s, {
        kind: "twist",
        title: "Demerge Twist!",
        text: `Jeff stuns the Final ${ms.length}: the merged tribe is splitting into two groups of ${half}! Each group will compete for its own individual immunity and attend its own Tribal Council tonight. Two people are going home.`,
        details: [
          `Group A: ${groupA.map((c) => c.name).join(", ")}`,
          `Group B: ${groupB.map((c) => c.name).join(", ")}`,
        ],
      });
      const winA = [...groupA].sort((a, b) => indScore(b, ch.type) - indScore(a, ch.type))[0];
      const winB = [...groupB].sort((a, b) => indScore(b, ch.type) - indScore(a, ch.type))[0];
      winA.immunityWins++;
      winB.immunityWins++;
      s.immune = [winA.id, winB.id];
      s.tribalTribes = ["demerge-a"];
      s.tribalTribe = "demerge-a";
      s.tribalQueue = [["demerge-b"]];
      log(s, {
        kind: "challenge",
        title: `Individual Immunity: ${ch.name} (${STAT_LABEL[ch.type]})`,
        text: `${winA.name} wins immunity for Group A, and ${winB.name} wins immunity for Group B! Each group heads to its own Tribal Council.`,
      });
      return;
    }
    const rr = ms.map((c) => ({ c, sc: seasonChallengeScore(s, c, rew.type) })).sort((a, b) => b.sc - a.sc);
    rr[0].c.mood = clamp(rr[0].c.mood + 10, 0, 100);
    rr[0].c.rewardWins = (rr[0].c.rewardWins ?? 0) + 1;
    const buddy = ms
      .filter((x) => x.id !== rr[0].c.id)
      .sort((a, b) => getRel(s, rr[0].c.id, b.id) - getRel(s, rr[0].c.id, a.id))[0];
    if (buddy) addRel(s, rr[0].c.id, buddy.id, 6);
    log(s, {
      kind: "challenge",
      title: `Reward Challenge: ${rew.name} (${STAT_LABEL[rew.type]})`,
      text: `${rr[0].c.name} wins reward${buddy ? ` and brings ${buddy.name} along` : ""}.`,
      details: rr.slice(0, 5).map((x, i) => `${i + 1}. ${x.c.name} — ${x.sc.toFixed(2)}`),
    });
    rewardAdvantage(s, [rr[0].c]);
    const ir = ms
      .map((c) => ({
        c,
        sc:
          seasonChallengeScore(s, c, ch.type) -
          (c.id === rr[0].c.id ? 1.5 : 0) -
          (buddy && c.id === buddy.id ? 0.7 : 0),
      }))
      .sort((a, b) => b.sc - a.sc);
    ir[0].c.immunityWins++;
    s.immune = [ir[0].c.id];
    s.tribalTribe = ms[0].tribeId;
    s.tribalTribes = [ms[0].tribeId];
    s.tribalQueue = [];
    s.twistsUsed ??= [];
    if (
      s.config.doubleTribals !== false &&
      !bigTwistUsed(s) &&
      ms.length >= s.config.finalSize + 4 &&
      (s.config.themeTwist === "double" || r() < 0.15)
    ) {
      s.twistsUsed.push("double_post");
      s.doubleElim = true;
      log(s, {
        kind: "twist",
        title: "Double Elimination!",
        text: "Before the challenge, Jeff drops a bomb: everyone is fighting for individual immunity, and tonight two people will be voted out. A second immunity challenge follows the first vote.",
      });
    }
    log(s, {
      kind: "challenge",
      title: `Individual Immunity: ${ch.name} (${STAT_LABEL[ch.type]})`,
      text: `${ir[0].c.name} wins individual immunity and is safe tonight!`,
      details: ir.map((x, i) => `${i + 1}. ${x.c.name} — ${x.sc.toFixed(2)}`),
    });
  }
}

// ---------- tribal ----------
function aiVote(s: GameState, voter: Castaway, cands: Castaway[], attendees: Castaway[]): string {
  if (!cands.length) return voter.id;
  if (cands.length === 1) return cands[0].id;

  const baseScore = (v: Castaway, c: Castaway) =>
    -getRel(s, v.id, c.id) * 0.1 +
    (s.merged ? threat(c) * v.stats.strategy * 0.08 : weakness(c) * 0.8) -
    (sharedAlliance(s, v.id, c.id) ? 3.0 : 0);

  // 1. Alliance voting bloc: allies stick together on the same target
  const mine = s.alliances
    .filter((a) => a.members.includes(voter.id))
    .map((a) => ({ a, present: a.members.filter((m) => attendees.some((x) => x.id === m)) }))
    .filter((x) => x.present.length >= 2)
    .sort((x, y) => y.present.length - x.present.length)[0];

  if (mine && r() < 0.75 + voter.stats.loyalty * 0.06) {
    const tc = cands.filter((c) => !mine.a.members.includes(c.id));
    if (tc.length) {
      return tc
        .map((c) => ({
          c,
          sc: mine.present.reduce((acc, m) => acc + baseScore(byId(s, m), c), 0) + (r() - 0.5) * 0.8,
        }))
        .sort((a, b) => b.sc - a.sc)[0].c.id;
    }
  }

  // 2. Determine Plan A and Plan B: the two highest-heat targets on the chopping block tonight
  const allEligible = attendees.filter((c) => !s.immune.includes(c.id));
  const heatMap = allEligible
    .map((c) => ({
      c,
      heat: attendees.filter((a) => a.id !== c.id).reduce((sum, a) => sum + baseScore(a, c), 0),
    }))
    .sort((a, b) => b.heat - a.heat);

  const topTwo = heatMap
    .slice(0, 2)
    .map((h) => h.c)
    .filter((c) => cands.some((can) => can.id === c.id));

  // 3. 85% of unaligned votes funnel between Plan A and Plan B; 15% can throw a stray rogue vote
  const options = topTwo.length >= 2 && r() < 0.85 ? topTwo : cands;

  return options
    .map((c) => ({
      c,
      sc: baseScore(voter, c) + (r() - 0.5) * 0.6,
    }))
    .sort((a, b) => b.sc - a.sc)[0].c.id;
}

export interface TargetPlan {
  voter: string;
  target: string;
  reason: string;
  alliance?: string;
}
export interface GroupPlan {
  alliance: string;
  members: string[];
  target: string;
  reason: string;
}
// Deterministic preview of who each attendee plans to vote for and why.
export function tribalTargets(s: GameState): { individual: TargetPlan[]; groups: GroupPlan[] } {
  const att = attendees(s);
  const cands = (v: Castaway) => att.filter((c) => c.id !== v.id && !s.immune.includes(c.id));
  const parts = (v: Castaway, c: Castaway) => ({
    rel: -getRel(s, v.id, c.id) * 0.08,
    game: s.merged ? threat(c) * v.stats.strategy * 0.06 : weakness(c) * 0.6,
    ally: sharedAlliance(s, v.id, c.id) ? -2.5 : 0,
  });
  const sc = (v: Castaway, c: Castaway) => {
    const p = parts(v, c);
    return p.rel + p.game + p.ally;
  };
  const why = (v: Castaway, c: Castaway) => {
    const p = parts(v, c);
    if (p.rel > p.game && getRel(s, v.id, c.id) < 0) return `bad blood with ${c.name} at camp`;
    if (s.merged)
      return c.immunityWins > 1
        ? `${c.name} has won ${c.immunityWins} immunities`
        : c.stats.social + c.stats.strategy >= 8
          ? `${c.name} is a social and strategic threat`
          : `${c.name} is a jury threat`;
    return `${c.name} is the weakest link in challenges`;
  };
  const groups: GroupPlan[] = [];
  for (const a of s.alliances) {
    const present = a.members.filter((m) => att.some((x) => x.id === m));
    if (present.length < 2) continue;
    const tc = att.filter((c) => !a.members.includes(c.id) && !s.immune.includes(c.id));
    if (!tc.length) continue;
    const best = tc
      .map((c) => ({ c, v: present.reduce((acc, m) => acc + sc(byId(s, m), c), 0) }))
      .sort((x, y) => y.v - x.v)[0].c;
    groups.push({ alliance: a.name, members: present, target: best.id, reason: why(byId(s, present[0]), best) });
  }
  const individual = att
    .map((v) => {
      const g = groups.filter((x) => x.members.includes(v.id)).sort((a, b) => b.members.length - a.members.length)[0];
      if (g && v.stats.loyalty >= 3 && g.target !== v.id)
        return {
          voter: v.id,
          target: g.target,
          alliance: g.alliance,
          reason: `sticking with ${g.alliance}: ${g.reason}`,
        };
      const cs = cands(v);
      if (!cs.length) return null;
      const best = cs.sort((a, b) => sc(v, b) - sc(v, a))[0];
      return {
        voter: v.id,
        target: best.id,
        reason: g ? `going rogue from ${g.alliance}: ${why(v, best)}` : why(v, best),
      };
    })
    .filter(Boolean) as TargetPlan[];
  return { individual, groups };
}

function tally(votes: Vote[]) {
  const m: Record<string, number> = {};
  votes.forEach((v) => !v.nullified && (m[v.target] = (m[v.target] ?? 0) + 1));
  return m;
}

function doTribal(s: GameState, d: Decision) {
  const att = attendees(s);
  const tname = tribalGroup(s)
    .map((id) => tribeOf(s, id)?.name ?? "")
    .join(" & ");
  const ctrl = s.config.controlledId;
  const immLog: string[] = [];
  // giving up individual immunity
  const holderId = s.merged ? s.immune[0] : undefined;
  if (holderId && att.some((c) => c.id === holderId)) {
    const holder = byId(s, holderId);
    let to: string | undefined;
    if (holder.id === ctrl)
      to =
        d.giveImmunity && att.some((c) => c.id === d.giveImmunity && c.id !== holder.id) ? d.giveImmunity : undefined;
    else if (r() < 0.04)
      to = att
        .filter((c) => c.id !== holder.id && getRel(s, holder.id, c.id) > 25)
        .sort((a, b) => getRel(s, holder.id, b.id) - getRel(s, holder.id, a.id))[0]?.id;
    if (to) {
      s.immune = [to];
      addRel(s, holder.id, to, 15);
      immLog.push(`${holder.name} shocks everyone by giving up individual immunity to ${nm(s, to)}!`);
    }
  }
  // advantage plays (before votes are cast)
  const plays: { who: Castaway; adv: AdvantageKey; target?: string }[] = [];
  const kipLog: string[] = [];
  for (const h of att.filter((c) => (c.advantages ?? []).length)) {
    if (!h.advantages.length || alive(s).length <= 5) continue;
    const foes = att.filter((c) => c.id !== h.id).sort((x, y) => getRel(s, h.id, x.id) - getRel(s, h.id, y.id));

    // Gather plays: multiple if controlled player specified advantagePlays, or fallback to single / AI
    const playsToRun: { adv: AdvantageKey; target?: string; kipItem?: "idol" | "amulet" | AdvantageKey }[] = [];

    if (h.id === ctrl && d.advantagePlays && d.advantagePlays.length > 0) {
      for (const p of d.advantagePlays) {
        if (!p.advantage || p.advantage === "__instinct__") continue;
        if (!h.advantages.includes(p.advantage)) continue;
        const tgt =
          p.target === "__random__"
            ? pick(foes)?.id
            : p.target === "__instinct__"
              ? (p.advantage === "knowledge_is_power" ? (foes.find((c) => kipItems(h, c).length) ?? foes[0]) : foes[0])
                  ?.id
              : p.target;
        playsToRun.push({ adv: p.advantage, target: tgt, kipItem: p.kipItem });
      }
    } else if (h.id === ctrl && d.advantage && d.advantage !== "__instinct__") {
      if (h.advantages.includes(d.advantage)) {
        const tgt =
          d.advantageTarget === "__random__"
            ? pick(foes)?.id
            : d.advantageTarget === "__instinct__"
              ? (d.advantage === "knowledge_is_power" ? (foes.find((c) => kipItems(h, c).length) ?? foes[0]) : foes[0])
                  ?.id
              : d.advantageTarget;
        playsToRun.push({ adv: d.advantage, target: tgt, kipItem: d.kipItem });
      }
    } else if ((h.id !== ctrl || d.advantage === "__instinct__") && r() < 0.25 + h.stats.strategy * 0.06) {
      const adv = pick(h.advantages);
      const target =
        adv === "knowledge_is_power"
          ? (foes.find((c) => c.idols > 0 || c.advantages.length) ?? foes[0])?.id
          : foes[0]?.id;
      if (adv) playsToRun.push({ adv, target });
    }

    for (const { adv, target, kipItem: chosenKip } of playsToRun) {
      if (adv === "safety" && att.length <= 4) continue;
      if (ADVANTAGE_NEEDS_TARGET.includes(adv) && (!target || target === h.id || !att.some((c) => c.id === target)))
        continue;
      h.advantages = h.advantages.filter((x) => x !== adv);
      h.advPlayed = (h.advPlayed ?? 0) + 1;
      if (adv === "knowledge_is_power") {
        const t = att.find((c) => c.id === target);
        if (!t) continue;
        const available = kipItems(h, t);
        const item = h.id === ctrl && chosenKip ? chosenKip : (available[0] ?? "idol");
        let got = "";
        if (item && available.includes(item)) {
          if (item === "idol") {
            t.idols--;
            h.idols = (h.idols ?? 0) + 1;
            const orig = (t.idolOrigins && t.idolOrigins.pop()) || t.tribeId;
            h.idolOrigins = [...(h.idolOrigins || []), orig];
            got = "a Hidden Immunity Idol";
          } else if (item === "amulet") {
            t.amulet = false;
            h.amulet = true;
            got = "an Advantage Amulet";
          } else {
            t.advantages = t.advantages.filter((x) => x !== item);
            h.advantages.push(item);
            got = `a ${ADVANTAGE_LABEL[item]}`;
          }
        }
        addRel(s, t.id, h.id, got ? -15 : -5);
        kipLog.push(
          `${h.name} plays Knowledge is Power on ${t.name}: "Do you have ${
            item === "idol"
              ? "a Hidden Immunity Idol"
              : item === "amulet"
                ? "an Advantage Amulet"
                : `${/^[aeiou]/i.test(ADVANTAGE_LABEL[item]) ? "an" : "a"} ${ADVANTAGE_LABEL[item]}`
          }?" ${got ? `${t.name} must hand over ${got}!` : `${t.name} cannot hand over the requested item.`}`,
        );
        continue;
      }
      plays.push({ who: h, adv, target });
    }
  }

  const safe = plays.filter((p) => p.adv === "safety").map((p) => p.who.id);
  // Shot in the Dark: one per castaway per season, 1-in-6 safety, vote forfeited either way
  const shooters: string[] = [];
  const shotLog: string[] = [];
  if (s.config.shotInTheDark !== false && alive(s).length > 5)
    for (const c of att) {
      if (c.shotUsed || c.lostVote || s.immune.includes(c.id) || safe.includes(c.id)) continue;
      const others = att.filter((o) => o.id !== c.id);
      const warmth = others.reduce((a, o) => a + getRel(s, c.id, o.id), 0) / Math.max(1, others.length);
      const wants = c.id === ctrl ? !!d.shotInDark : warmth < -3 && r() < 0.18;
      if (!wants) continue;
      c.shotUsed = true;
      shooters.push(c.id);
      const hit = r() < 1 / 6;
      if (hit) safe.push(c.id);
      shotLog.push(
        `${c.name} plays their Shot in the Dark, giving up their vote... ${hit ? "SAFE! They cannot receive votes tonight." : "Not safe."}`,
      );
    }
  const holders = amuletHolders(s);
  const amuletLog: string[] = [];
  let amuletIdolTarget: string | undefined;
  const amuletUser = holders.find((c) => c.id === ctrl) ?? holders[0];
  const allPresent = holders.length > 0 && holders.every((c) => att.some((a) => a.id === c.id) && !safe.includes(c.id));
  if (
    amuletUser &&
    allPresent &&
    alive(s).length >= 6 &&
    (holders.some((c) => c.id === ctrl) ? d.playAmulet : r() < (alive(s).length === 6 ? 1 : 0.22))
  ) {
    const options = att.filter(
      (c) => !safe.includes(c.id) && !s.immune.includes(c.id) && (holders.length === 1 || c.id !== amuletUser.id),
    );
    const target = holders.some((c) => c.id === ctrl)
      ? d.amuletTarget === "__random__"
        ? pick(options)?.id
        : d.amuletTarget
      : holders.length === 1
        ? amuletUser.id
        : options.sort((a, b) => getRel(s, amuletUser.id, a.id) - getRel(s, amuletUser.id, b.id))[0]?.id;
    if (holders.length === 3 || options.some((c) => c.id === target)) {
      holders.forEach((c) => {
        c.amulet = false;
        c.advPlayed = (c.advPlayed ?? 0) + 1;
      });
      s.amuletsConsumed = true;
      if (holders.length === 1) amuletIdolTarget = target;
      else plays.push({ who: amuletUser, adv: holders.length === 3 ? "extra_vote" : "steal_vote", target });
      amuletLog.push(
        `${holders.map((c) => c.name).join(" and ")} play all remaining Advantage Amulets together: ${holders.length === 3 ? "one extra vote" : holders.length === 2 ? `steal ${nm(s, target)}'s vote` : `an immunity idol for ${nm(s, target)}`}! The amulets are now spent.`,
      );
    }
  }
  const blocked = plays.filter((p) => p.adv === "steal_vote" || p.adv === "vote_blocker").map((p) => p.target!);
  const nullifyFor = plays.filter((p) => p.adv === "idol_nullifier").map((p) => p.target!);
  const advLog = plays
    .filter((p) => p.adv !== "fifty_fifty")
    .map((p) =>
      p.adv === "safety"
        ? `${p.who.name} plays Safety Without Power and leaves Tribal Council.`
        : p.adv === "extra_vote"
          ? `${p.who.name} plays an Extra Vote advantage and casts a second vote.`
          : p.adv === "steal_vote"
            ? `${p.who.name} plays Steal a Vote — ${nm(s, p.target!)} loses their vote.`
            : p.adv === "vote_blocker"
              ? `${p.who.name} plays a Vote Blocker on ${nm(s, p.target!)}.`
              : `${p.who.name} secretly plays an Idol Nullifier on ${nm(s, p.target!)}.`,
    );
  const cands = (v: Castaway, excl: string[] = []) =>
    att.filter((c) => c.id !== v.id && !s.immune.includes(c.id) && !safe.includes(c.id) && !excl.includes(c.id));
  const noVote = att.filter((v) => v.lostVote || shooters.includes(v.id)).map((v) => v.id);
  let voters = att.filter((v) => !safe.includes(v.id) && !noVote.includes(v.id));
  if (!voters.length) voters = att.filter((v) => !safe.includes(v.id));
  const nvLog = noVote.map((id) => `${nm(s, id)} has no vote tonight.`);
  // Live tribal: whispering before the vote can flip votes onto a new name.
  const overrides: Record<string, string> = {};
  const liveLog: string[] = [];
  const canVoteFor = (v: Castaway, id: string) => cands(v).some((c) => c.id === id);
  if (att.length >= 4) {
    const counts: Record<string, number> = {};
    tribalTargets(s).individual.forEach((p) => (counts[p.target] = (counts[p.target] ?? 0) + 1));
    const hot = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const P = hot ? byId(s, hot) : undefined;
    if (
      P &&
      P.id !== ctrl &&
      !P.out &&
      !safe.includes(P.id) &&
      !s.immune.includes(P.id) &&
      r() < 0.22 + P.stats.strategy * 0.03
    ) {
      const alt = att
        .filter((c) => c.id !== P.id && !s.immune.includes(c.id) && !safe.includes(c.id))
        .sort((a, b) => getRel(s, P.id, a.id) - getRel(s, P.id, b.id))[0];
      if (alt) {
        const flipped = voters.filter(
          (v) =>
            v.id !== ctrl &&
            v.id !== P.id &&
            v.id !== alt.id &&
            canVoteFor(v, alt.id) &&
            r() <
              0.1 +
                Math.max(0, getRel(s, v.id, P.id)) * 0.01 +
                P.stats.social * 0.03 -
                (sharedAlliance(s, v.id, alt.id) ? 0.3 : 0),
        );
        flipped.forEach((v) => {
          overrides[v.id] = alt.id;
          addRel(s, v.id, P.id, 3);
        });
        addRel(s, alt.id, P.id, -8);
        liveLog.push(
          `Live Tribal! ${P.name} stands up and starts whispering, trying to swing the vote onto ${alt.name}. ${flipped.length ? `${flipped.map((f) => f.name).join(", ")} ${flipped.length === 1 ? "looks" : "look"} convinced.` : "Nobody budges."}`,
        );
      }
    }
  }
  if (ctrl && d.whisper && att.some((c) => c.id === ctrl)) {
    const me = byId(s, ctrl);
    const tg = att.find((c) => c.id === d.whisper);
    if (tg && canVoteFor(me, tg.id)) {
      const flipped = voters.filter(
        (v) =>
          v.id !== ctrl &&
          v.id !== tg.id &&
          !overrides[v.id] &&
          canVoteFor(v, tg.id) &&
          r() <
            0.1 +
              Math.max(0, getRel(s, v.id, ctrl)) * 0.012 +
              me.stats.social * 0.04 -
              (sharedAlliance(s, v.id, tg.id) ? 0.35 : 0),
      );
      flipped.forEach((v) => {
        overrides[v.id] = tg.id;
        addRel(s, v.id, ctrl, 2);
      });
      addRel(s, tg.id, ctrl, -8);
      liveLog.push(
        `You start whispering at Tribal, pushing votes onto ${tg.name}. ${flipped.length ? `${flipped.map((f) => f.name).join(", ")} ${flipped.length === 1 ? "nods" : "nod"} along.` : "Nobody seems to bite."}`,
      );
    }
  }
  const castFor = (v: Castaway) =>
    v.id === ctrl && d.vote && cands(v).some((c) => c.id === d.vote)
      ? d.vote
      : overrides[v.id] && canVoteFor(v, overrides[v.id])
        ? overrides[v.id]
        : aiVote(s, v, cands(v), att);
  let votes: Vote[] = voters.filter((v) => !blocked.includes(v.id)).map((v) => ({ voter: v.id, target: castFor(v) }));
  for (const p of plays)
    if ((p.adv === "extra_vote" || p.adv === "steal_vote") && !safe.includes(p.who.id)) {
      const own = votes.find((v) => v.voter === p.who.id);
      votes.push({ voter: p.who.id, target: own?.target ?? castFor(p.who) });
    }
  // Split vote: a majority alliance that fears an idol divides its votes between two names.
  if (att.length >= 5) {
    const t1 = tally(votes);
    const ranked = Object.entries(t1).sort((a, b) => b[1] - a[1]);
    const P = ranked[0] ? byId(s, ranked[0][0]) : undefined;
    const grp = P
      ? s.alliances
          .map((a) => ({
            a,
            vs: votes.filter((v) => v.target === P.id && v.voter !== ctrl && a.members.includes(v.voter)),
          }))
          .sort((x, y) => y.vs.length - x.vs.length)[0]
      : undefined;
    // High chance to split if primary target has an idol/clue, plus strategic splits when numbers allow
    const fearsIdol = P && (P.idols > 0 || P.clue ? r() < 0.85 : r() < 0.45);
    if (P && grp && grp.vs.length >= 3 && fearsIdol) {
      const k = Math.floor(grp.vs.length / 2);
      const B = att
        .filter(
          (c) =>
            c.id !== P.id && !grp.a.members.includes(c.id) && grp.vs.every((v) => canVoteFor(byId(s, v.voter), c.id)),
        )
        .sort(
          (x, y) =>
            grp.vs.reduce((n, v) => n + getRel(s, v.voter, x.id), 0) -
            grp.vs.reduce((n, v) => n + getRel(s, v.voter, y.id), 0),
        )[0];
      const others = B
        ? Math.max(0, ...ranked.filter(([id]) => id !== P.id && id !== B.id).map(([, n]) => n))
        : Infinity;
      // Allow split if alliance still ties or beats opposition (e.g. 2-2 vs 2 or 3-2 vs 2)
      if (B && k >= 1 && Math.min(ranked[0][1] - k, (t1[B.id] ?? 0) + k) >= others) {
        grp.vs.slice(0, k).forEach((v) => (v.target = B.id));
        liveLog.push(`${grp.a.name} splits their votes between ${P.name} and ${B.name} to flush out a possible idol.`);
      }
    }
  }
  // idol plays
  const protectedIds: string[] = [];
  const idolLog: string[] = [];
  if (amuletIdolTarget) {
    if (nullifyFor.includes(amuletIdolTarget))
      amuletLog.push(`The amulet idol for ${nm(s, amuletIdolTarget)} is nullified; their votes still count.`);
    else protectedIds.push(amuletIdolTarget);
  }
  const t0 = tally(votes);
  const max = Math.max(0, ...Object.values(t0));
  for (const h of att.filter((c) => c.fakeIdol === "planted" && c.id !== ctrl)) {
    const mine = t0[h.id] ?? 0;
    if (mine > 0 && mine >= max - 1 && r() < 0.75) {
      h.fakeIdol = undefined;
      idolLog.push(`${h.name} confidently plays an "idol"... Jeff: "This is NOT a hidden immunity idol." It's a fake!`);
      att.forEach((c) => c.id !== h.id && addRel(s, c.id, h.id, -2));
    }
  }
  for (const h of att.filter((c) => c.idols > 0 && !(c.bewareTribals > 0))) {
    let target: string | null = null;
    if (h.id === ctrl && d.idol !== "__instinct__")
      target =
        d.idol === "__random__"
          ? (pick(att.filter((c) => !s.immune.includes(c.id)))?.id ?? null)
          : att.some((c) => c.id === d.idol && !s.immune.includes(c.id))
            ? d.idol
            : null;
    else {
      const mine = t0[h.id] ?? 0;
      const finalTribal = alive(s).length <= 5;
      // Realistic chance of feeling safe or saving the idol for later (going out with it in pocket)
      const playChance = 0.18 + h.stats.strategy * 0.08; // ~26% to 58% play rate instead of ~95%
      const shouldPlaySelf =
        (mine >= max - 1 && mine > 0 && r() < playChance) || (finalTribal && mine > 0 && r() < 0.82);
      if (shouldPlaySelf) target = h.id;
      else {
        const ally = att
          .filter(
            (c) => c.id !== h.id && getRel(s, h.id, c.id) > 8 && (t0[c.id] ?? 0) >= max - 1 && (t0[c.id] ?? 0) > 0,
          )
          .sort((a, b) => getRel(s, h.id, b.id) - getRel(s, h.id, a.id))[0];
        if (ally && r() < 0.22 + h.stats.strategy * 0.06) target = ally.id;
      }
    }
    if (target) {
      h.idols--;
      h.idolsPlayed = (h.idolsPlayed ?? 0) + 1;
      const playedOrig = (h.idolOrigins && h.idolOrigins.pop()) || (s.merged ? "merged" : h.tribeId);
      if (canDiscoverIdol(s)) {
        if (s.merged) {
          // At merge, only re-hide the merge idol if the played idol was from merge and no other merge idol exists
          if (playedOrig === "merged" && !isIdolInPlay(s, "merged")) {
            s.hiddenIdols.merged = 1;
          }
        } else if (!isIdolInPlay(s, playedOrig)) {
          s.hiddenIdols[playedOrig] = 1;
        }
      }
      if (target !== h.id) addRel(s, h.id, target, 20);
      idolLog.push(
        target === h.id
          ? `${h.name} stands up and plays a Hidden Immunity Idol for themselves!`
          : `${h.name} plays a Hidden Immunity Idol for ${nm(s, target)}!`,
      );
      if (nullifyFor.includes(target))
        idolLog.push(`But the idol was nullified! Votes against ${nm(s, target)} still count.`);
      else protectedIds.push(target);
    }
  }

  // 50/50 Coin plays
  for (const p of plays.filter((x) => x.adv === "fifty_fifty")) {
    const isSafe = r() < 0.5;
    if (isSafe) {
      protectedIds.push(p.who.id);
      idolLog.push(`${p.who.name} flips their 50/50 Coin... It lands on SAFE! All votes against them are negated!`);
    } else {
      idolLog.push(`${p.who.name} flips their 50/50 Coin... It lands on NOT SAFE! The coin has no power.`);
    }
  }

  votes = votes.map((v) => (protectedIds.includes(v.target) ? { ...v, nullified: true } : v));
  let t = tally(votes);
  const details: string[] = [
    ...immLog,
    ...kipLog,
    ...advLog,
    ...amuletLog,
    ...shotLog,
    ...nvLog,
    ...liveLog,
    ...idolLog,
  ];
  let revote: Vote[] | undefined;
  if (!Object.keys(t).length) {
    details.push("Every vote was nullified! A revote is held.");
    const ask = (o: string[]) => {
      if (ctrl && d.pauseOnRevote && !d.revoteDecided && voters.some((v) => v.id === ctrl))
        throw new RevotePause(o, votes, [
          ...details,
          `Votes cast: ${votes.length} — all ${votes.length} negated by idols.`,
        ]);
    };
    ask(voters.flatMap((v) => (v.id === ctrl ? cands(v, protectedIds).map((c) => c.id) : [])));
    revote = voters.map((v) => {
      const cs = cands(v, protectedIds);
      return {
        voter: v.id,
        target:
          v.id === ctrl && d.revoteVote && cs.some((c) => c.id === d.revoteVote) ? d.revoteVote : aiVote(s, v, cs, att),
      };
    });
    t = tally(revote);
  }
  let top = Math.max(...Object.values(t));
  let tied = Object.keys(t).filter((k) => t[k] === top);
  let out: string;
  let rocks = false;
  if (tied.length > 1) {
    details.push(`Tie between ${tied.map((x) => nm(s, x)).join(" and ")}. Revote!`);
    if (ctrl && d.pauseOnRevote && !d.revoteDecided && voters.some((v) => v.id === ctrl) && !tied.includes(ctrl)) {
      const e = Object.entries(t).sort((a, b) => b[1] - a[1]);
      throw new RevotePause(tied, votes, [
        `Count: ${e.map(([, n]) => n).join("-")} (${e.map(([k, n]) => `${nm(s, k)}: ${n}`).join(", ")})`,
        ...details,
      ]);
    }
    revote = voters
      .filter((v) => !tied.includes(v.id))
      .map((v) => ({
        voter: v.id,
        target:
          v.id === ctrl && d.revoteVote && tied.includes(d.revoteVote)
            ? d.revoteVote
            : v.id === ctrl && !d.revoteDecided && d.vote && tied.includes(d.vote)
              ? d.vote
              : aiVote(
                  s,
                  v,
                  att.filter((c) => tied.includes(c.id)),
                  att,
                ),
      }));
    const rt = tally(revote);
    const rtop = Math.max(0, ...Object.values(rt));
    const rtied = Object.keys(rt).filter((k) => rt[k] === rtop);
    if (rtied.length === 1) out = rtied[0];
    else {
      const pool = att.filter(
        (c) => !tied.includes(c.id) && !s.immune.includes(c.id) && !safe.includes(c.id) && !protectedIds.includes(c.id),
      );
      if (!pool.length || r() < 0.3) {
        out = [...tied].sort(
          (a, b) =>
            voters.reduce((acc, v) => acc + getRel(s, v.id, a), 0) -
            voters.reduce((acc, v) => acc + getRel(s, v.id, b), 0),
        )[0];
        details.push(
          `Deadlock! Rather than draw rocks, the tribe reaches a unanimous decision to send ${nm(s, out)} home.`,
        );
      } else {
        out = pick(pool).id;
        rocks = true;
        details.push(
          `Deadlock! Nobody budges, so ${pool.map((c) => c.name).join(", ")} must draw rocks... ${nm(s, out)} draws the purple rock.`,
        );
      }
    }
  } else out = tied[0];
  const loser = byId(s, out);
  const allVotes = [...votes, ...(revote ?? [])];
  for (const v of voters) {
    const last = revote?.find((x) => x.voter === v.id) ?? votes.find((x) => x.voter === v.id);
    if (last) {
      v.votesCast = (v.votesCast ?? 0) + 1;
      if (last.target === out) v.correctVotes = (v.correctVotes ?? 0) + 1;
    }
  }
  for (const v of allVotes)
    if (!v.nullified) {
      const c = byId(s, v.target);
      c.votesAgainst = (c.votesAgainst ?? 0) + 1;
    }
  for (const c of att) c.lostVote = false;
  // relationship fallout
  const against = allVotes.filter((v) => v.target === out && !v.nullified).map((v) => v.voter);
  for (const v of against) {
    addRel(s, out, v, -12);
    if (sharedAlliance(s, out, v) || getRel(s, out, v) > 5) loser.betrayedBy.push(v);
  }
  for (const a of against) for (const b of against) if (a < b) addRel(s, a, b, 3);
  // tribal fallout on everyone's mental state
  for (const c of att.filter((x) => x.id !== out)) {
    const closeToBoot = sharedAlliance(s, c.id, out) || getRel(s, c.id, out) > 8;
    if (closeToBoot) {
      mood(c, -10);
      for (const v of against) if (v !== c.id) addRel(s, c.id, v, -6);
    } else if (against.includes(c.id)) mood(c, 4);
    else mood(c, -5);
  }
  const blindside = loser.idols > 0 && !allVotes.some((v) => v.voter === out && against.includes(v.target));
  eliminate(s, loser, `voted out`);
  const fmt = (tt: Record<string, number>) => {
    const e = Object.entries(tt).sort((a, b) => b[1] - a[1]);
    return `${e.map(([, n]) => n).join("-")} (${e.map(([k, n]) => `${nm(s, k)}: ${n}`).join(", ")})`;
  };
  const negated = votes.filter((v) => v.nullified);
  const originalCount = Object.keys(tally(votes)).length ? fmt(tally(votes)) : "0 counted";
  const negatedCount = negated.length
    ? ` · Idol-negated: ${negated.length} (${fmt(tally(negated.map((v) => ({ ...v, nullified: false }))))})`
    : "";
  const vc = `${originalCount}${negatedCount}${revote ? ` · Revote: ${Object.keys(tally(revote)).length ? fmt(tally(revote)) : "deadlocked"}${rocks ? " · Rocks" : ""}` : ""}`;
  log(s, {
    kind: "tribal",
    title: `Tribal Council — ${tname}`,
    text: `${loser.name} has been ${rocks ? "eliminated by drawing the wrong rock" : "voted out"}${loser.juror ? " and becomes a member of the jury" : ""}${loser.edge ? " — and heads to the Edge of Extinction, still fighting for a way back" : ""}. ${blindside ? "A massive blindside — with an idol in their pocket!" : ""} Jeff snuffs their torch: "The tribe has spoken." ${
      blindside
        ? `"${loser.name}: 'Ouch... I literally had an idol in my pocket. Good blindside guys!'"`
        : [
            `"${loser.name}: 'Well played, you got me good!'"`,
            `"${loser.name}: 'Keep playing ruthless, don't let the snakes win.'"`,
            `"${loser.name}: 'I should've trusted my gut tonight.'"`,
            `"${loser.name}: 'Good luck to whoever is left, go win this thing.'"`,
          ][Math.floor(r() * 4)]
    }`,
    details: [
      `Final count: ${vc}`,
      ...details,
      ...(loser.betrayedBy.length
        ? [`${loser.name} feels betrayed by ${[...new Set(loser.betrayedBy)].map((x) => nm(s, x)).join(", ")}.`]
        : []),
    ],
    votes,
    revote,
    out: loser.id,
  });
  if (loser.juror && !loser.edge) ponderosa(s, loser);
  // Keep immunity while another Tribal is queued tonight (e.g. demerge Group B still has to vote).
  if (!s.tribalQueue?.length) s.immune = [];
}

function eliminate(s: GameState, c: Castaway, _how: string) {
  const left = alive(s).length;
  c.out = true;
  c.placement = left;
  if (_how === "voted out" && s.config.edgeOfExtinction && !s.merged && !s.edgeDone) c.edge = true;
  c.juror = left <= s.config.finalSize + s.config.jurySize;
  s.alliances.forEach((a) => (a.members = a.members.filter((m) => m !== c.id)));
  s.alliances = s.alliances.filter((a) => a.members.length >= 2);
  c.alliances = s.alliances.filter((a) => a.members.length >= 2);
  if (c.idols > 0) {
    const origs = c.idolOrigins?.length ? c.idolOrigins : [s.merged ? "merged" : c.tribeId];
    c.alliances = s.alliances.filter((a) => a.members.length >= 2);
    if (c.idols > 0) {
      const origs = c.idolOrigins?.length ? c.idolOrigins : [s.merged ? "merged" : c.tribeId];
      c.idols = 0;
      c.idolOrigins = [];
      if (canDiscoverIdol(s)) {
        origs.forEach((orig) => {
          if (s.merged) {
            if (orig === "merged" && !isIdolInPlay(s, "merged")) s.hiddenIdols.merged = 1;
          } else if (!isIdolInPlay(s, orig)) {
            s.hiddenIdols[orig] = 1;
          }
        });
      }
    } else {
      c.idols = 0;
      c.idolOrigins = [];
    }
    c.advantages = [];
    c.idolOrigins = [];
    if (canDiscoverIdol(s)) {
      origs.forEach((orig) => {
        if (s.merged) {
          if (orig === "merged" && !isIdolInPlay(s, "merged")) s.hiddenIdols.merged = 1;
        } else if (!isIdolInPlay(s, orig)) {
          s.hiddenIdols[orig] = 1;
        }
      });
    }
  } else {
    c.idols = 0;
    c.idolOrigins = [];
  }
  c.advantages = [];

  c.advantages = [];
  c.amulet = false;
  noteAmuletStage(s);
}

function afterTribal(s: GameState) {
  // 1. If a second Tribal Council is queued up (Group B), run it next
  if (s.tribalQueue?.length) {
    s.tribalTribes = s.tribalQueue.shift();
    s.tribalTribe = s.tribalTribes[0];
    s.phase = "tribal";
    return;
  }

  // 2. Once both tribals have finished, reunite the castaways
  if (s.demergeActive) {
    s.demergeActive = false;
    alive(s).forEach((c) => (c.tribeId = "merged"));
    s.tribes = s.tribes.filter((t) => t.id !== "demerge-a" && t.id !== "demerge-b");
    log(s, {
      kind: "twist",
      title: "Reunited",
      text: "With both votes completed, the remaining castaways reunite as a single tribe.",
    });
  }
  if (s.doubleElim) {
    s.doubleElim = false;
    const ms = alive(s);
    if (s.merged && ms.length >= s.config.finalSize + 2) {
      const ch = pickChallenge(s);
      const ir = ms.map((c) => ({ c, sc: indScore(c, ch.type) })).sort((a, b) => b.sc - a.sc);
      ir[0].c.immunityWins++;
      s.immune = [ir[0].c.id];
      log(s, {
        kind: "challenge",
        title: `Second Immunity: ${ch.name} (${STAT_LABEL[ch.type]})`,
        text: `No time to breathe — ${ir[0].c.name} wins the second immunity of the night!`,
        details: ir.map((x, i) => `${i + 1}. ${x.c.name} — ${x.sc.toFixed(2)}`),
      });
      s.phase = "tribal";
      return;
    }
  }
  const n = alive(s).length;
  s.episodes.push({ n: s.episodes.length + 1, title: freshTitle(s), entries: [] });
  // Dissolve any pre-merge tribe down to 2 people during a 3-tribe stage
  if (!s.merged) {
    const activeTribes = s.tribes.filter((t) => t.id !== "merged");
    const living = alive(s);
    if (activeTribes.length === 3 && living.length > s.config.mergeAt) {
      const counts = activeTribes.map((t) => ({
        tribe: t,
        members: living.filter((c) => c.tribeId === t.id),
      }));
      const small = counts.find((c) => c.members.length === 2);
      if (small) {
        const others = counts.filter((c) => c.tribe.id !== small.tribe.id);
        if (others.length === 2) {
          const [p1, p2] = small.members.sort(() => r() - 0.5);
          p1.tribeId = others[0].tribe.id;
          p2.tribeId = others[1].tribe.id;
          s.tribes = s.tribes.filter((t) => t.id !== small.tribe.id);
          log(s, {
            kind: "twist",
            title: "Tribe Dissolved!",
            text: `🚨 ${small.tribe.name} is down to 2 members and has dissolved! ${p1.name} joins ${others[0].tribe.name}, and ${p2.name} joins ${others[1].tribe.name}.`,
          });
        }
      }
    }
  }
  if (!s.merged) {
    const g = groups(s);
    const tiny = [...g.values()].some((m) => m.length <= 1) || g.size < 2;
    if (s.config.swapEnabled && !s.swapped && n <= s.config.swapAt && n > s.config.mergeAt && !tiny) doSwap(s);
    else if (n <= s.config.mergeAt || tiny) doMerge(s);
  }
  s.phase = "camp";
}

function doSwap(s: GameState) {
  s.swapped = true;
  let tids = [...new Set(alive(s).map((c) => c.tribeId))];
  // An even number of castaways always swaps into two equal tribes; only an odd count can use three.
  if (alive(s).length % 2 === 0) tids = tids.slice(0, 2);
  else if (s.config.swapTribe && tids.length === 2) {
    const third = { ...s.config.swapTribe };
    s.tribes.push(third);
    tids.push(third.id);
    s.hiddenIdols[third.id] = 1;
  }
  // Only tribes that existed before the swap get "2.0" names; a newly introduced tribe keeps its plain name.
  const before = new Set(alive(s).map((c) => c.tribeId));
  s.tribes = s.tribes.map((t) =>
    tids.includes(t.id) && before.has(t.id) && !t.name.endsWith(" 2.0") ? { ...t, name: `${t.name} 2.0` } : t,
  );
  const prev: Record<string, string> = {};
  alive(s).forEach((c) => (prev[c.id] = c.tribeId));
  shuffle(alive(s)).forEach((c, i) => {
    c.tribeId = tids[i % tids.length];
    c.clue = false;
  });
  const details = tids.map(
    (tid) =>
      `${tribeOf(s, tid)!.name}: ${alive(s)
        .filter((c) => c.tribeId === tid)
        .map((c) => `${c.name} (formerly ${tribeOf(s, prev[c.id])?.name ?? "?"})`)
        .join(", ")}`,
  );
  for (const tid of Object.keys(s.hiddenIdols)) s.hiddenIdols[tid] = isIdolInPlay(s, tid) ? 0 : 1;
  log(s, {
    kind: "twist",
    title: "Drop Your Buffs! Tribe Swap",
    text: "The castaways are shocked as Jeff announces a tribe swap. Loyalties will be tested.",
    details,
  });
}

/**
 * Idol Halves twist: a found idol is only half an idol. The finder must hand the
 * other half to a tribemate, who completes it and becomes its holder.
 */
export function giftFoundIdols(s: GameState) {
  if (!s.config.idolGifting) return;
  for (const c of alive(s)) {
    const gifted = Math.min(c.idolsGifted ?? 0, c.idols ?? 0);
    c.idolsGifted = gifted;
    let unGifted = (c.idols ?? 0) - gifted;
    while (unGifted > 0) {
      const mates = alive(s).filter((x) => x.id !== c.id && x.tribeId === c.tribeId);
      if (!mates.length) return;
      const to = [...mates].sort((a, b) => getRel(s, c.id, b.id) - getRel(s, c.id, a.id))[0];
      const orig = (c.idolOrigins && c.idolOrigins.pop()) || c.tribeId;
      c.idols--;
      unGifted--;
      to.idols = (to.idols ?? 0) + 1;
      to.idolsGifted = (to.idolsGifted ?? 0) + 1;
      to.idolOrigins = [...(to.idolOrigins || []), orig];
      addRel(s, c.id, to.id, 10);
      log(s, {
        kind: "idol",
        title: "Idol Halves",
        text: `${c.name} found half of a hidden immunity idol — but it only works when joined. ${c.name} secretly hands the other half to ${to.name}, who now holds the completed idol.`,
      });
    }
  }
}

/** Earn the Merge: the first merged immunity is a team challenge; the losing team is vulnerable. */
function earnTheMergeRound(s: GameState, ms: Castaway[], ch: { name: string; type: StatKey }): boolean {
  if (!s.config.earnTheMerge || (s.twistsUsed ?? []).includes("earn-merge") || ms.length < 6) return false;
  s.twistsUsed ??= [];
  s.twistsUsed.push("earn-merge");
  const shuffled = shuffle(ms);
  const half = Math.ceil(ms.length / 2);
  const teams = [shuffled.slice(0, half), shuffled.slice(half)];
  const score = (team: Castaway[]) => team.reduce((a, c) => a + indScore(c, ch.type), 0) / team.length;
  const [win, lose] = score(teams[0]) >= score(teams[1]) ? teams : [teams[1], teams[0]];
  win.forEach((c) => {
    c.immunityWins++;
    c.mood = clamp(c.mood + 10, 0, 100);
  });
  s.immune = win.map((c) => c.id);
  log(s, {
    kind: "twist",
    title: "Earn the Merge!",
    text: `There's no merge feast yet. Jeff splits the ${ms.length} castaways into two random teams for ${ch.name} (${STAT_LABEL[ch.type]}). The winners earn the merge feast and immunity; the losers are vulnerable — but everyone votes tonight.`,
    details: [
      `Winners (immune): ${win.map((c) => c.name).join(", ")}`,
      `Vulnerable: ${lose.map((c) => c.name).join(", ")}`,
    ],
  });
  return true;
}

function doMerge(s: GameState) {
  s.merged = true;
  const t: Tribe = { id: "merged", name: s.config.mergedName, color: s.config.mergedColor };
  if (!s.tribes.some((x) => x.id === "merged")) s.tribes.push(t);
  const edgers = s.castaways.filter((c) => c.out && c.edge);
  if (edgers.length && !s.edgeDone) {
    s.edgeDone = true;
    const res = edgers
      .map((c) => ({ c, sc: indScore(c, pick(["endurance", "physical", "mental"])) + c.stats.endurance * 0.3 }))
      .sort((a, b) => b.sc - a.sc);
    const back = res[0].c;
    back.out = false;
    back.juror = false;
    back.placement = undefined;
    edgers.forEach((c) => (c.edge = false));
    log(s, {
      kind: "twist",
      title: "Return from the Edge!",
      text: `The castaways on the Edge of Extinction battle for a way back into the game... ${back.name} wins and re-enters the game at the merge!`,
      details: res.map((x, i) => `${i + 1}. ${x.c.name} — ${x.sc.toFixed(2)}`),
    });
  }
  const oldTribes = (c: Castaway) => {
    const o = tribeOf(s, c.originalTribeId)?.name ?? "?";
    const cur = c.tribeId !== "merged" ? tribeOf(s, c.tribeId)?.name : undefined;
    return cur && cur !== o ? `${o} → ${cur}` : o;
  };
  const mergeDetails = alive(s).map((c) => `${c.name} (${oldTribes(c)})`);
  s.castaways.forEach((c) => {
    c.madeMerge = !c.out;
  });
  alive(s).forEach((c) => {
    c.tribeId = "merged";
    c.clue = false;
  });
  s.hiddenIdols.merged = isIdolInPlay(s, "merged") ? 0 : 1;
  log(s, {
    kind: "twist",
    title: `The Merge — ${t.name}`,
    text: `The ${alive(s).length} remaining castaways merge into a single tribe, ${t.name}. It's now an individual game.`,
    details: [`Remaining: ${mergeDetails.join(", ")}`, `Jury of ${s.config.jurySize} begins soon.`],
  });
}

// ---------- confessionals ----------
// Each quote has a stable key (its template) so no line is ever reused in a season, even with different names.
// Event quotes carry a short phrase that can become the episode title.
type Quote = { key: string; text: string; phrase?: string };
const EVENT_QUOTES: Record<string, ((o: string) => [string, string])[]> = {
  idol: [
    () => ["A Gift From God", `"Oh wow. This is a gift from God. I'm holding my whole game in my hand right now."`],
    () => [
      "Hands Shaking",
      `"My hands are shaking. I just found the idol and I have to walk back to camp like nothing happened."`,
    ],
    () => ["Power in My Pocket", `"Power in my pocket. Nobody knows, and nobody is going to know until it matters."`],
    () => ["Christmas Came Early", `"Christmas came early this year! I literally screamed into my buff."`],
    () => ["The Island Chose Me", `"I genuinely believe the island chose me. That idol was waiting for me."`],
    () => ["Insurance Policy", `"That's my insurance policy. Now I can play a little bit bolder."`],
    () => ["Finders Keepers", `"Finders keepers. I'm not telling a soul — not even my alliance."`],
  ],
  advantage: [
    () => ["A Secret Weapon", `"This is a secret weapon. One play and the whole vote flips."`],
    () => ["Ace Up My Sleeve", `"I've got an ace up my sleeve, and I'm going to wait for the perfect moment."`],
    () => [
      "Not Just Along for the Ride",
      `"Everyone thinks I'm just along for the ride. This advantage says otherwise."`,
    ],
    () => ["Tools of the Trade", `"In this game you need tools of the trade. Today I picked one up."`],
  ],
  clue: [
    () => [
      "Treasure Map",
      `"It's basically a treasure map. I just have to get away from camp without anyone noticing."`,
    ],
    () => ["Hot on the Trail", `"I'm hot on the trail. That idol is close, I can feel it."`],
  ],
  drama: [
    (o) => ["I'm Not Here for Your Drama", `"I'm not here for your drama, ${o}. Keep my name out of your mouth."`],
    (o) => ["Lines Were Crossed", `"Lines were crossed today. ${o} showed me exactly who they are."`],
    () => ["Camp Is a Pressure Cooker", `"Camp is a pressure cooker, and somebody's lid just blew off."`],
    (o) => ["Bite My Tongue", `"I had to bite my tongue so hard with ${o}. But I'll get the last word at Tribal."`],
    () => ["Pass the Popcorn", `"I just sat back and watched. Somebody pass the popcorn."`],
  ],
  alliance: [
    (o) => ["Shake On It", `"${o} and I shook on it. Whether that handshake means anything... we'll see."`],
    () => ["Strength in Numbers", `"Strength in numbers. We've got them now, and the others don't even know it."`],
    () => ["Ride or Die", `"This is my ride or die crew. If one of us goes, we all go down swinging."`],
    () => ["A Pact Under the Stars", `"We made a pact under the stars. Feels a little dramatic, but I'm all in."`],
    (o) => ["Partners in Crime", `"${o} and I are partners in crime now. Nobody would ever suspect us."`],
  ],
  gift: [
    (o) => ["Ultimate Trust", `"I gave ${o} my most valuable thing. That's the ultimate trust in this game."`],
    () => ["Paying It Forward", `"Paying it forward. One day that favor comes back to me."`],
  ],
  camp: [
    () => ["Fed the Tribe", `"I fed the tribe today. Nobody votes out the person keeping them alive."`],
    () => ["Hunger Hurts", `"Hunger hurts. I'd trade my shoes for a plate of pancakes right now."`],
    (o) => ["A Real Friend", `"${o} might be a real friend. That's dangerous out here — and kind of beautiful."`],
    () => ["Mother Nature Hates Us", `"Mother Nature hates us. The shelter's gone and so is my patience."`],
    () => ["Small Wins", `"You take the small wins out here. Fire, fish, a dry shirt."`],
  ],
};
const GENERIC_QUOTES = [
  "Day {day}. I'm still here, and that's all that matters.",
  "People underestimate me. Good. Let them.",
  "Every vote from here on out is a chess move, and I'm three steps ahead.",
  "I came here to play, not to make friends. Well... maybe a few friends.",
  "The rain hasn't stopped in two days and my patience is about as thin as the shelter roof.",
  "I keep smiling at camp, but in my head I'm counting votes every second.",
  "Nobody out here is your friend after the merge. Nobody.",
  "I miss my family so much, and that's exactly why I can't let up now.",
  "Sometimes the best move is no move at all. I'm sitting tight.",
  "I can feel the target shifting. I just need it to land on someone else tonight.",
  "Being in the middle is dangerous, but it also means everyone needs me.",
  "Losing weight, losing sleep, but I am not losing this game.",
  "I've been lying so much I need a spreadsheet, and we don't have paper.",
  "My mom told me not to trust anybody out here. Hi Mom, you were right.",
  "If I go home tonight, at least I go home with a great tan.",
  "The sand gets everywhere. Everywhere. And so do the rumors.",
  "I'm a nice person back home. Out here? I'm whoever I need to be.",
  "You don't win this game by playing scared, so I'm done being scared.",
  "I can hear people whispering from the shelter. They think the waves cover it. They don't.",
  "I've eaten a bug today. That's who I am now.",
  "Being on the bottom gives you clarity. You see everything.",
  "Trust is a currency out here, and I'm spending mine carefully.",
  "I'm playing checkers while they argue over chess.",
  "It's not personal. Well... it's a little personal.",
  "Somebody's getting blindsided this week, and I'd love for it not to be me.",
  "I'd give anything for a cheeseburger and eight hours of sleep.",
  "The game never stops. Even when you're asleep, somebody's plotting.",
  "I'm keeping my head down and my ears open.",
  "This island humbles you. One day you're on top, the next you're crawling.",
  "Loyalty is great until it gets you voted out.",
  "Every conversation out here is an audition for the jury.",
  "I'm tired of being the swing vote. Actually, no — I love it.",
  "I keep thinking about my kids. They're why I fight for every single day.",
  "My strategy is simple: be everybody's second-favorite person.",
  "When people stop talking when I walk up, I know I'm in trouble.",
  "The bigger they are, the louder the blindside.",
  "I haven't stopped shaking since the last Tribal. That was way too close.",
  "I'm a fan of this show, but nothing prepares you for the real thing.",
];
const PERSONAL_QUOTES: ((
  s: GameState,
  c: Castaway,
  x: { best?: Castaway; worst?: Castaway; al?: Alliance },
) => Quote | null)[] = [
  (_s, c) =>
    c.idols > 0
      ? { key: "p-idol", text: `"I have an idol and nobody suspects a thing. That feeling? Pure power."` }
      : null,
  (_s, c) =>
    c.advantages.length
      ? {
          key: "p-adv",
          text: `"I'm sitting on a ${ADVANTAGE_LABEL[c.advantages[0]]}. When I play it, this game flips upside down."`,
        }
      : null,
  (_s, _c, x) =>
    x.al
      ? {
          key: "p-al",
          text: `"${x.al.name} is my lifeline right now. As long as we stick together, nobody can touch us."`,
        }
      : null,
  (s, c, x) =>
    x.best && getRel(s, c.id, x.best.id) > 10
      ? {
          key: "p-best",
          text: `"${x.best.name} is the one person I truly trust out here. I'd go to the end with them."`,
        }
      : null,
  (s, c, x) =>
    x.worst && getRel(s, c.id, x.worst.id) < -8
      ? {
          key: "p-worst",
          text: `"If ${x.worst.name} is still here tomorrow, something has gone very wrong. They have to go."`,
        }
      : null,
  (_s, c) =>
    c.mood < 35
      ? {
          key: "p-low",
          text: `"I'm exhausted, I'm starving, and honestly... I don't know how much more of this I have in me."`,
        }
      : null,
  (_s, c) =>
    c.mood > 80
      ? {
          key: "p-high",
          text: `"Everything is clicking. The tribe loves me, I'm eating well — this is my game to lose."`,
        }
      : null,
  (_s, c) =>
    c.immunityWins > 0
      ? { key: "p-imm", text: `"Winning immunity feels great, but I know it paints a target on my back."` }
      : null,
  (s, c) =>
    c.betrayedBy.length
      ? { key: "p-betray", text: `"I haven't forgotten what ${nm(s, c.betrayedBy[0])} did to me. Payback is coming."` }
      : null,
];
function eventKind(e: LogEntry): string | null {
  if (e.kind === "confessional") return null;
  if (/Idol Found|Beware Advantage/.test(e.title)) return "idol";
  if (/Advantage Found/.test(e.title)) return "advantage";
  if (/Idol Clue/.test(e.title)) return "clue";
  if (/Handed Over/.test(e.title)) return "gift";
  if (/Alliance Formed|Your Move/.test(e.title) && !/hesitant/.test(e.text)) return "alliance";
  if (e.kind === "drama") return "drama";
  if (e.kind === "camp" && !/Life at Camp/.test(e.title)) return "camp";
  return null;
}
const PRIORITY = ["idol", "advantage", "gift", "drama", "alliance", "clue", "camp"];
function addConfessionals(s: GameState) {
  const ms = alive(s);
  if (ms.length < 3) return;
  const all = s.episodes.flatMap((e) => e.entries).filter((e) => e.kind === "confessional");
  const usedKeys = new Set(all.map((e) => e.quoteKey ?? e.text));
  const usedText = new Set(all.map((e) => e.text));
  const ep = s.episodes[s.episodes.length - 1];
  const usedTitles = new Set(s.episodes.slice(0, -1).map((e) => e.title));
  const speakers: Castaway[] = [];
  const say = (c: Castaway, q: Quote) => {
    usedKeys.add(q.key);
    usedText.add(q.text);
    speakers.push(c);
    log(s, { kind: "confessional", title: `Confessional — ${c.name}`, text: q.text, quoteKey: q.key });
  };
  // 1) Event-driven confessional, which also names the episode.
  const events = (ep?.entries ?? [])
    .map((e) => ({ e, k: eventKind(e) }))
    .filter((x) => x.k)
    .sort((a, b) => PRIORITY.indexOf(a.k!) - PRIORITY.indexOf(b.k!));
  let titled = false;
  for (const { e, k } of events) {
    const mentioned = ms
      .filter((c) => e.text.includes(c.name))
      .sort((a, b) => e.text.indexOf(a.name) - e.text.indexOf(b.name));
    const actor =
      e.title.startsWith("Your") || e.title.startsWith("You ")
        ? ms.find((c) => c.id === s.config.controlledId)
        : mentioned[0];
    if (!actor || speakers.includes(actor)) continue;
    const other =
      mentioned.find((c) => c.id !== actor.id) ?? ms.find((c) => c.id !== actor.id && c.tribeId === actor.tribeId);
    const opts = EVENT_QUOTES[k!]
      .map((f, i) => ({ i, r: f(other?.name ?? "them") }))
      .filter((o) => !usedKeys.has(`${k}-${o.i}`) && !usedTitles.has(o.r[0]));
    if (!opts.length) continue;
    const o = pick(opts);
    say(actor, { key: `${k}-${o.i}`, text: o.r[1], phrase: o.r[0] });
    if (ep && !titled) {
      ep.title = o.r[0];
      titled = true;
    }
    if (speakers.length >= 2) break;
  }
  // 2) Fill with personal or generic confessionals.
  const want = Math.max(speakers.length, r() < 0.5 ? 1 : 2);
  for (const c of shuffle(ms.filter((m) => !speakers.includes(m)))) {
    if (speakers.length >= want) break;
    const others = ms.filter((o) => o.id !== c.id);
    const best = [...others].sort((a, b) => getRel(s, c.id, b.id) - getRel(s, c.id, a.id))[0];
    const worst = [...others].sort((a, b) => getRel(s, c.id, a.id) - getRel(s, c.id, b.id))[0];
    const al = s.alliances.find((a) => a.members.includes(c.id));
    const pool: Quote[] = [
      ...PERSONAL_QUOTES.map((f) => f(s, c, { best, worst, al })).filter((q): q is Quote => !!q),
      ...GENERIC_QUOTES.map((t, i) => ({ key: `g-${i}`, text: `"${t.replace("{day}", String(s.day))}"` })),
    ].filter((q) => !usedKeys.has(q.key) && !usedText.has(q.text));
    if (!pool.length) continue;
    say(c, pick(pool));
  }
}

// ---------- finale ----------
const isFireFinal = (s: GameState) => s.config.finalSize === 3 && s.config.fireAtF4 && alive(s).length === 4;
function doFinalChallenge(s: GameState) {
  const ms = alive(s);
  const ch = pickChallenge(s);
  const ir = ms.map((c) => ({ c, sc: indScore(c, ch.type) + c.stats.endurance * 0.3 })).sort((a, b) => b.sc - a.sc);
  const w = ir[0].c;
  w.immunityWins++;
  s.finalImmune = w.id;
  log(s, {
    kind: "finale",
    title: `Final Immunity Challenge: ${ch.name}`,
    text: `${w.name} wins the final immunity challenge and a guaranteed seat at Final Tribal Council!`,
    details: ir.map((x, i) => `${i + 1}. ${x.c.name} — ${x.sc.toFixed(2)}`),
  });
}

function doFinalChoice(s: GameState, d: Decision) {
  const ms = alive(s);
  const w = byId(s, s.finalImmune!);
  const others = ms.filter((c) => c.id !== w.id);
  const mine = w.id === s.config.controlledId && others.some((c) => c.id === d.cut) ? byId(s, d.cut!) : null;
  const pickCut = () =>
    w.id === s.config.controlledId && d.cut
      ? byId(s, d.cut)
      : [...others].sort(
          (a, b) => threat(b) - getRel(s, w.id, b.id) * 0.1 - (threat(a) - getRel(s, w.id, a.id) * 0.1),
        )[0];
  if (isFireFinal(s)) {
    // Rare bold move: the immune player gives up the necklace to face the biggest threat at fire themselves.
    const biggestThreat = [...others].sort((a, b) => threat(b) - threat(a))[0];
    const givesUp =
      !mine &&
      w.id !== s.config.controlledId &&
      biggestThreat &&
      threat(biggestThreat) > threat(w) &&
      r() < 0.06 + w.stats.endurance * 0.02;
    if (givesUp) {
      const through = others.filter((c) => c.id !== biggestThreat.id);
      const fs = [w, biggestThreat]
        .map((c) => ({ c, sc: c.stats.endurance * 0.6 + c.stats.mental * 0.4 + r() * 4 }))
        .sort((a, b) => b.sc - a.sc);
      eliminate(s, fs[1].c, "fire");
      log(s, {
        kind: "finale",
        title: "Immunity Given Up — Fire-Making Showdown",
        text: `In a stunning move, ${w.name} gives up the immunity necklace and volunteers for fire-making against ${biggestThreat.name}, sending ${through.map((c) => c.name).join(" and ")} straight to the end. "I didn't come here to sneak into the finals — I came to take out the biggest threat myself." ${fs[0].c.name}'s flame burns through the rope! ${fs[1].c.name} becomes the final juror.`,
        details: [
          `Why: ${w.name} believed ${biggestThreat.name} was the one player they couldn't beat in front of the jury, and wanted the credit for ending their game.`,
          ...fs.map((x) => `${x.c.name} — ${x.sc.toFixed(2)}`),
        ],
      });
    } else {
      const safe = mine ?? [...others].sort((a, b) => getRel(s, w.id, b.id) - getRel(s, w.id, a.id))[0];
      const fire = others.filter((c) => c.id !== safe.id);
      const fs = fire
        .map((c) => ({ c, sc: c.stats.endurance * 0.6 + c.stats.mental * 0.4 + r() * 4 }))
        .sort((a, b) => b.sc - a.sc);
      eliminate(s, fs[1].c, "fire");
      const bond = getRel(s, w.id, safe.id);
      const whySafe = mine
        ? "your call as the immunity winner"
        : bond > 10
          ? `${safe.name} has been their most loyal ally all season — loyalty matters more than jury math`
          : bond < -5
            ? `they want ${safe.name} beside them precisely because the jury dislikes them`
            : `${safe.name} is the weakest jury threat of the three, the easiest seatmate for Final Tribal`;
      const whyFire = fire.map(
        (c) =>
          `${c.name}: ${threat(c) > threat(safe) ? "too big a jury threat to hand a free finalist seat" : "no free rides — make them earn it at fire"}`,
      );
      log(s, {
        kind: "finale",
        title: "Forced Fire-Making Challenge",
        text: `${w.name} takes ${safe.name} to the end. ${fs[0].c.name} and ${fs[1].c.name} battle at fire-making... ${fs[0].c.name}'s flame burns through the rope! ${fs[1].c.name} becomes the final juror.`,
        details: [
          `Why ${w.name} saved ${safe.name}: ${whySafe}.`,
          ...whyFire,
          ...fs.map((x) => `${x.c.name} — ${x.sc.toFixed(2)}`),
        ],
      });
    }
  } else {
    const cut = pickCut();
    eliminate(s, cut, "cut");
    for (const o of others) if (o.id !== cut.id) addRel(s, w.id, o.id, 2);
    log(s, {
      kind: "finale",
      title: "Final Tribal Vote",
      text: `With the sole vote, ${w.name} votes out ${cut.name}${cut.juror ? ", who becomes the final juror" : ""}.`,
      votes: [{ voter: w.id, target: cut.id }],
    });
  }
  s.finalists = alive(s).map((c) => c.id);
}

export function finalistSpeeches(s: GameState): string[] {
  const fin = (s.finalists ?? alive(s).map((c) => c.id)).map((id) => byId(s, id));
  const entries = s.episodes.flatMap((e) => e.entries);
  const jury = s.castaways.filter((c) => c.juror);
  const list = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
  return fin.map((f) => {
    const pts: string[] = [];
    const rewardWins = entries.filter(
      (e) => e.title.startsWith("Reward Challenge:") && e.text.startsWith(`${f.name} wins reward`),
    ).length;
    const negated = entries
      .filter((e) => e.kind === "tribal")
      .reduce((n, e) => n + (e.votes ?? []).filter((v) => v.target === f.id && v.nullified).length, 0);
    const allySaves = entries
      .flatMap((e) => e.details ?? [])
      .filter((d) => d.startsWith(`${f.name} plays a Hidden Immunity Idol for `)).length;
    const bonds = jury.filter((j) => getRel(s, f.id, j.id) > 8).length;
    if (
      entries.some(
        (e) => e.title === "Forced Fire-Making Challenge" && e.text.includes(`${f.name}'s flame burns through`),
      )
    )
      pts.push("earned my seat by winning fire-making");
    if (entries.some((e) => e.title === "Return from the Edge!" && e.text.includes(`${f.name} wins and re-enters`)))
      pts.push("fought my way back from the Edge and reached the end");
    if (negated) pts.push(`survived by negating ${negated} vote${negated === 1 ? "" : "s"} with idols`);
    if (allySaves) pts.push(`played idols for allies ${allySaves} time${allySaves === 1 ? "" : "s"}`);
    if (f.immunityWins) pts.push(`won ${f.immunityWins} immunit${f.immunityWins > 1 ? "ies" : "y"}`);
    if (f.votesCast) pts.push(`voted correctly at ${f.correctVotes ?? 0} of ${f.votesCast} Tribal Councils`);
    if (rewardWins) pts.push(`won ${rewardWins} individual reward${rewardWins === 1 ? "" : "s"}`);
    if (f.idolsPlayed) pts.push(`played ${f.idolsPlayed} idol${f.idolsPlayed > 1 ? "s" : ""}`);
    if (f.advPlayed) pts.push(`used ${f.advPlayed} advantage${f.advPlayed > 1 ? "s" : ""}`);
    if (!f.votesAgainst) pts.push("never had a single vote cast against me");
    else if (f.votesAgainst >= 3) pts.push(`survived ${f.votesAgainst} votes against me`);
    const al = s.alliances.find((a) => a.members.includes(f.id));
    if (al) pts.push(`kept ${al.name} together through the final stretch`);
    if (bonds) pts.push(`built strong bonds with ${bonds} member${bonds === 1 ? "" : "s"} of this jury`);
    if (f.id === s.finalImmune) pts.push("secured my place by winning final immunity");
    if (!pts.length) pts.push("outlasted everyone who wrote me off");
    return `${f.name}: "My case for winning: I ${list(pts)}."`;
  });
}

function prepareFTC(s: GameState) {
  if (s.episodes.some((e) => e.entries.some((entry) => entry.title === "Opening Statements"))) return;
  const fin = (s.finalists ?? alive(s).map((c) => c.id)).map((id) => byId(s, id));
  const jury = s.castaways.filter((c) => c.juror);
  log(s, {
    kind: "finale",
    title: "Opening Statements",
    text: "Each finalist makes their case to the jury.",
    details: finalistSpeeches(s),
  });
  const qa: string[] = [];
  const used = new Set<string>();
  for (const j of jury) {
    const f = [...fin].sort((a, b) => getRel(s, j.id, a.id) - getRel(s, j.id, b.id))[r() < 0.6 ? 0 : fin.length - 1];
    const all = eligibleJuryQuestions(j, f).filter((q) => !used.has(q.id));
    const prefs = all.filter(
      (q) =>
        (q.topic === "betrayed" && j.betrayedBy.includes(f.id)) ||
        (q.topic === "strategy" && j.stats.strategy >= 4) ||
        (q.topic === "angry" && j.stats.temperament <= 2) ||
        (q.topic === "social" && j.stats.social >= 4) ||
        (q.topic === "challenge" && f.immunityWins > 0),
    );
    const question = pick(prefs) ?? pick(all);
    if (!question) continue;
    used.add(question.id);
    const { reply, reaction, answerQuality, directlyAnswered } = answerJuryQuestion(s, f, j, question);

    s.juryLeans ??= [];

    let lean = s.juryLeans.find((item) => item.jurorId === j.id && item.finalistId === f.id);

    if (!lean) {
      lean = {
        jurorId: j.id,
        finalistId: f.id,
        score: 0,
        reasons: [],
      };
      s.juryLeans.push(lean);
    }

    const answerShift = answerQuality === "strong" ? 3 : answerQuality === "mixed" ? 1 : -3;

    lean.score += answerShift;

    lean.reasons.push(
      answerShift > 0
        ? `${f.name}'s ${answerQuality} answer to "${question.text}" improved their Final Tribal standing`
        : `${f.name} failed to directly answer "${question.text}", hurting their Final Tribal standing`,
    );
    qa.push(
      `${j.name} asks ${f.name}: "${question.text}"\n↳ ${f.name}: "${reply}" (${reaction}; ${answerQuality} answer${
        directlyAnswered ? "" : ", did not directly answer the question"
      }; jury lean ${answerShift > 0 ? "+" : ""}${answerShift})`,
    );
  }
  log(s, {
    kind: "finale",
    title: `Final Tribal Council — Day ${s.day}`,
    text: `${fin.map((f) => f.name).join(", ")} face the jury of ${jury.length}.`,
    details: qa,
  });
}

function doFTC(s: GameState, d: Decision) {
  const fin = (s.finalists ?? alive(s).map((c) => c.id)).map((id) => byId(s, id));
  const jury = s.castaways.filter((c) => c.juror);
  s.juryVotes = jury.map((j) => {
    if (j.id === s.config.controlledId && fin.some((f) => f.id === d.juryVote))
      return { juror: j.id, finalist: d.juryVote, reason: "your jury vote - chose to reward their game" };
    const scored = fin
      .map((f) => {
        const savedLean = s.juryLeans?.find((lean) => lean.jurorId === j.id && lean.finalistId === f.id)?.score ?? 0;

        const relT = getRel(s, j.id, f.id) * 0.09;
        const strat = f.stats.strategy * 0.55 + f.immunityWins * 0.35 + (f.correctVotes ?? 0) * 0.12;
        const soc = f.stats.social * 0.7;
        const bitter = j.betrayedBy.includes(f.id) ? -(1 + (6 - j.stats.temperament) * 0.6) : 0;

        return {
          f,
          sc: savedLean + relT + strat + soc + bitter + r() * 1.5,
          parts: { savedLean, relT, strat, soc, bitter },
        };
      })
      .sort((a, b) => b.sc - a.sc);
    const best = scored[0];
    const p = best.parts;
    const top = Math.max(p.savedLean, p.relT, p.strat, p.soc);

    const leanReasons =
      s.juryLeans?.find((lean) => lean.jurorId === j.id && lean.finalistId === best.f.id)?.reasons.slice(-2) ?? [];

    const reason =
      top === p.savedLean
        ? (leanReasons[leanReasons.length - 1] ?? "was swayed by the jury-house and Final Tribal process")
        : top === p.strat
          ? "respected their strategic game"
          : top === p.soc
            ? "valued their social game"
            : "had a strong personal bond";
    return {
      juror: j.id,
      finalist: best.f.id,
      reason: `${reason}${scored.some((x) => x.parts.bitter < 0) ? " (bitter toward a betrayer)" : ""}`,
    };
  });

  const counts: Record<string, number> = {};
  s.juryVotes.forEach((v) => (counts[v.finalist] = (counts[v.finalist] ?? 0) + 1));

  const sorted = [...fin].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
  const topVoteCount = counts[sorted[0].id] ?? 0;
  const tiedForFirst = sorted.filter((f) => (counts[f.id] ?? 0) === topVoteCount);

  if (tiedForFirst.length === 1) {
    s.winner = tiedForFirst[0].id;
  } else if (fin.length === 3 && tiedForFirst.length === 2) {
    const tiebreakerFinalist = fin.find((f) => !tiedForFirst.some((tf) => tf.id === f.id))!;
    const tiebreakerScore = tiedForFirst
      .map((f) => {
        const relT = getRel(s, tiebreakerFinalist.id, f.id) * 0.09;
        const strat = f.stats.strategy * 0.55 + f.immunityWins * 0.35 + (f.correctVotes ?? 0) * 0.12;
        const soc = f.stats.social * 0.7;
        const bitter = tiebreakerFinalist.betrayedBy?.includes(f.id)
          ? -(1 + (6 - tiebreakerFinalist.stats.temperament) * 0.6)
          : 0;
        return {
          finalist: f,
          score: relT + strat + soc + bitter + r() * 1.5,
          parts: { relT, strat, soc, bitter },
        };
      })
      .sort((a, b) => b.score - a.score);

    const best = tiebreakerScore[0];
    const userChoice = tiedForFirst.find((f) => f.id === d.juryVote);
    const tiebrokenWinner = tiebreakerFinalist.id === s.config.controlledId && userChoice ? userChoice : best.finalist;

    counts[tiebrokenWinner.id] = (counts[tiebrokenWinner.id] ?? 0) + 1;
    s.winner = tiebrokenWinner.id;

    // Determine why the 3rd place finalist chose this finalist
    const p = best.parts;
    const top = Math.max(p.relT, p.strat, p.soc);
    const whyReason =
      top === p.strat
        ? "respected their strategic gameplay and resume"
        : top === p.soc
          ? "valued their stronger social connections"
          : "shared a closer personal bond";
    const reason =
      tiebreakerFinalist.id === s.config.controlledId
        ? "your tie-breaking vote — chose to reward their game"
        : `broke the tie — ${whyReason}${p.bitter < 0 ? " (bitter toward a betrayer)" : ""}`;

    // Add their vote to juryVotes so it displays in the Jury Votes chart and vote details
    s.juryVotes.push({
      juror: tiebreakerFinalist.id,
      finalist: tiebrokenWinner.id,
      reason,
    });

    log(s, {
      kind: "twist",
      title: "FTC Tiebreaker",
      text: `It's a ${topVoteCount}-${topVoteCount} tie between ${tiedForFirst[0].name} and ${tiedForFirst[1].name}! As the finalist with the fewest votes, ${tiebreakerFinalist.name} casts the sole tie-breaking vote for ${tiebrokenWinner.name}!`,
      details: [`${tiebreakerFinalist.name} voted for ${tiebrokenWinner.name} — ${reason}`],
    });
  } else {
    const fallbackWinner = sorted.sort((a, b) => threat(b) - threat(a))[0];
    s.winner = fallbackWinner.id;
  }

  log(s, {
    kind: "finale",
    title: "The Reunion — Sole Survivor",
    text: `${byId(s, s.winner).name} wins Survivor by a vote of ${fin
      .map((f) => counts[f.id] ?? 0)
      .sort((a, b) => b - a)
      .join("-")}!`,
    details: s.juryVotes.map((v) => `${nm(s, v.juror)} voted for ${nm(s, v.finalist)} — ${v.reason}`),
    votes: s.juryVotes.map((v) => ({ voter: v.juror, target: v.finalist })),
  });
  const eligible = s.castaways.filter((c) => c.madeMerge ?? c.tribeId === "merged");
  const favorite = eligible
    .map((c) => ({
      c,
      score:
        c.stats.social * 2 +
        c.stats.temperament * 0.5 +
        c.immunityWins * 0.6 +
        (c.idolsPlayed ?? 0) * 0.8 +
        s.castaways.reduce((n, other) => n + Math.max(0, getRel(s, c.id, other.id)), 0) * 0.025 +
        r() * 8,
    }))
    .sort((a, b) => b.score - a.score)[0]?.c;
  if (favorite) {
    s.fanFavorite = favorite.id;
    log(s, {
      kind: "finale",
      title: "Fan Favorite Award",
      text: `${favorite.name} wins the simulated fan vote! Their personality, bonds, and memorable moments won over the audience.`,
      details: ["Only castaways who reached the merge were eligible."],
    });
  }
  // Season recap: a closing summary of the whole game.
  const allEntries = s.episodes.flatMap((e) => e.entries);
  const tribalEntries = allEntries.filter((e) => e.kind === "tribal");
  const blindsides = tribalEntries.filter((e) => e.text.includes("massive blindside")).length;
  const idolsPlayedTotal = s.castaways.reduce((n, c) => n + (c.idolsPlayed ?? 0), 0);
  const advPlayedTotal = s.castaways.reduce((n, c) => n + (c.advPlayed ?? 0), 0);
  const quits = allEntries.filter((e) => e.title === "A Castaway Quits").length;
  const medevacs = allEntries.filter((e) => e.title === "Medical Evacuation").length;
  const rocks = tribalEntries.filter((e) => e.text.includes("drawing the wrong rock")).length;
  const fireWinners = allEntries.filter((e) => e.title.includes("Fire-Making")).length;
  const winnerC = byId(s, s.winner!);
  const details = [
    `${s.episodes.length} episodes, ${tribalEntries.length} Tribal Councils, ${s.castaways.length} castaways.`,
    `${idolsPlayedTotal} idol${idolsPlayedTotal === 1 ? "" : "s"} played, ${advPlayedTotal} advantage${advPlayedTotal === 1 ? "" : "s"} used, ${blindsides} blindside${blindsides === 1 ? "" : "s"} with an idol in someone's pocket.`,
    ...(quits || medevacs
      ? [
          `Unusual exits: ${[quits ? `${quits} quit${quits > 1 ? "s" : ""}` : "", medevacs ? `${medevacs} medevac${medevacs > 1 ? "s" : ""}` : ""].filter(Boolean).join(" and ")}.`,
        ]
      : []),
    ...(rocks ? [`${rocks} Tribal Council${rocks > 1 ? "s" : ""} went all the way to rocks.`] : []),
    ...(fireWinners ? [`The final four was decided by fire-making.`] : []),
    `${winnerC.name} walked away as Sole Survivor${favorite ? `, and ${favorite.name} took home the Fan Favorite award` : ""}.`,
  ];
  const sups = superlatives(s);
  if (sups.length)
    log(s, {
      kind: "finale",
      title: "Season Superlatives",
      text: "The season's standout performances, by the numbers.",
      details: sups.map((x) => `${x.award}: ${nm(s, x.id)} — ${x.why}`),
    });
  log(s, {
    kind: "finale",
    title: "Season Recap",
    text: `That's a wrap on the season! ${winnerC.name} outwit, outplayed and outlasted ${s.castaways.length - 1} others over ${s.day} days.`,
    details,
  });
}

export function superlatives(s: GameState): { award: string; id: string; why: string }[] {
  const cs = s.castaways;
  const betrayals = (c: Castaway) => cs.reduce((n, o) => n + (new Set(o.betrayedBy).has(c.id) ? 1 : 0), 0);
  const warmth = (c: Castaway) => cs.reduce((n, o) => n + (o.id === c.id ? 0 : Math.max(0, getRel(s, c.id, o.id))), 0);
  const blindsided = new Set(
    s.episodes
      .flatMap((e) => e.entries)
      .filter((e) => e.kind === "tribal" && e.text.includes("massive blindside") && e.out)
      .map((e) => e.out!),
  );
  const defs: [string, (c: Castaway) => number, (n: number) => string][] = [
    [
      "Challenge Beast",
      (c) => c.immunityWins + (c.rewardWins ?? 0),
      (n) => `${n} individual challenge win${n === 1 ? "" : "s"}`,
    ],
    [
      "Strategic Mastermind",
      (c) => c.correctVotes ?? 0,
      (n) => `voted with the majority ${n} time${n === 1 ? "" : "s"}`,
    ],
    ["Idol Magnet", (c) => (c.idolsPlayed ?? 0) * 2 + (c.advPlayed ?? 0), () => "played the most idols and advantages"],
    ["Chaos Agent", betrayals, (n) => `betrayed ${n} former ally${n === 1 ? "" : "s"}`],
    ["Biggest Target", (c) => c.votesAgainst ?? 0, (n) => `received ${n} vote${n === 1 ? "" : "s"}`],
    ["Social Butterfly", (c) => Math.round(warmth(c)), () => "built the warmest bonds across the cast"],
    [
      "Blindside Victim of the Season",
      (c) => (blindsided.has(c.id) ? 100 - (c.placement ?? 0) : 0),
      () => "went home with an idol in their pocket",
    ],
  ];
  return defs.flatMap(([award, f, why]) => {
    const best = [...cs].sort((a, b) => f(b) - f(a) || a.name.localeCompare(b.name))[0];
    const n = best ? f(best) : 0;
    return best && n > 0 ? [{ award, id: best.id, why: why(n) }] : [];
  });
}

function ponderosa(s: GameState, c: Castaway) {
  const jurors = s.castaways.filter((j) => j.juror && j.out && j.id !== c.id && !j.edge);
  const remaining = alive(s);
  const bitter = [...new Set(c.betrayedBy)].filter((id) => remaining.some((x) => x.id === id));
  const details: string[] = [];
  const text = bitter.length
    ? `${c.name} arrives at Ponderosa fuming about ${bitter.map((id) => nm(s, id)).join(" and ")}.`
    : pick([
        `${c.name} arrives at Ponderosa and heads straight for a hot shower and a real meal.`,
        `${c.name} walks into Ponderosa with their head held high.`,
        `${c.name} arrives at Ponderosa still in shock from the vote.`,
      ]);
  if (jurors.length) {
    const o = pick(jurors);
    if (getRel(s, c.id, o.id) < -5 && r() < 0.5) {
      addRel(s, c.id, o.id, 8);
      details.push(`${c.name} and ${o.name} finally clear the air over breakfast.`);
    } else {
      addRel(s, c.id, o.id, 3);
      details.push(`${o.name} fills ${c.name} in on what the jury has been saying.`);
    }
  }
  for (const j of [c, ...jurors])
    for (const id of new Set(j.betrayedBy))
      if (remaining.some((x) => x.id === id) && r() < 0.15) {
        addRel(s, j.id, id, 4);
        details.push(`${j.name} is starting to respect how ${nm(s, id)} played them.`);
      }
  const lean: Record<string, number> = {};
  for (const j of [c, ...jurors]) {
    const fav = [...remaining].sort(
      (a, b) =>
        getRel(s, j.id, b.id) -
        (j.betrayedBy.includes(b.id) ? 15 : 0) +
        threat(b) * 0.5 -
        (getRel(s, j.id, a.id) - (j.betrayedBy.includes(a.id) ? 15 : 0) + threat(a) * 0.5),
    )[0];
    if (fav) lean[fav.id] = (lean[fav.id] ?? 0) + 1;
  }
  const e = Object.entries(lean).sort((a, b) => b[1] - a[1]);
  if (e.length)
    details.push(
      `Jury lean (${jurors.length + 1} juror${jurors.length ? "s" : ""}): ${e.map(([id, n]) => `${nm(s, id)} ${n}`).join(", ")}.`,
    );
  // Save this juror's starting opinion of every remaining possible finalist.
  s.juryLeans ??= [];

  for (const finalist of remaining) {
    const existing = s.juryLeans.find((lean) => lean.jurorId === c.id && lean.finalistId === finalist.id);

    if (existing) continue;

    const relationship = getRel(s, c.id, finalist.id) * 0.12;
    const strategy = finalist.stats.strategy * 0.45;
    const social = finalist.stats.social * 0.35;
    const challenge = finalist.immunityWins * 0.3;
    const betrayal = c.betrayedBy.includes(finalist.id) ? -(2 + (6 - c.stats.temperament) * 0.45) : 0;

    const score = relationship + strategy + social + challenge + betrayal;

    const reasons = [
      relationship > 0.8
        ? `has a strong personal bond with ${finalist.name}`
        : relationship < -0.8
          ? `has unresolved tension with ${finalist.name}`
          : `has a neutral personal relationship with ${finalist.name}`,
      strategy + challenge > 2.5
        ? `respects ${finalist.name}'s visible game résumé`
        : `is still unsure about ${finalist.name}'s game résumé`,
      ...(betrayal < 0 ? [`still feels betrayed by ${finalist.name}`] : []),
    ];

    s.juryLeans.push({
      jurorId: c.id,
      finalistId: finalist.id,
      score,
      reasons,
    });
  }
  // Ponderosa discussions can shift opinions, but only a little at a time.
  const shifts: { jurorId: string; finalistId: string; amount: number }[] = [];

  for (const juror of [c, ...jurors]) {
    const possibleFinalists = remaining.filter((finalist) => finalist.id !== juror.id);
    if (!possibleFinalists.length || r() >= 0.38) continue;

    const finalist = pick(possibleFinalists);
    const lean = s.juryLeans?.find((item) => item.jurorId === juror.id && item.finalistId === finalist.id);

    if (!lean) continue;

    const betrayed = juror.betrayedBy.includes(finalist.id);
    const amount = betrayed ? (r() < 0.55 ? 1 : -2) : r() < 0.65 ? 1 : -1;

    lean.score += amount;
    lean.reasons.push(
      amount > 0
        ? `Ponderosa discussion made ${juror.name} appreciate ${finalist.name}'s game more`
        : `Ponderosa discussion made ${juror.name} question ${finalist.name}'s game`,
    );

    shifts.push({
      jurorId: juror.id,
      finalistId: finalist.id,
      amount,
    });

    details.push(
      `${juror.name}'s opinion of ${finalist.name} ${amount > 0 ? "rose" : "fell"} after the Ponderosa conversation.`,
    );
  }

  s.juryHouseLog ??= [];
  s.juryHouseLog.push({
    arrivingJurorId: c.id,
    text,
    shifts,
  });
  log(s, { kind: "jury", title: `Ponderosa — ${c.name} Arrives`, text, details });
}

function doJourney(s: GameState) {
  s.journeysDone = (s.journeysDone ?? 0) + 1;
  const picks = [...groups(s).values()].map((ms) => pick(ms));
  const risk = picks.map((c) => ({ c, risk: r() < 0.3 + c.stats.strategy * 0.08 }));
  const takers = risk.filter((x) => x.risk);
  const details = risk.map((x) => `${x.c.name} chose to ${x.risk ? "RISK their vote" : "protect their vote"}.`);
  let text: string;
  if (takers.length === risk.length) {
    takers.forEach((x) => (x.c.lostVote = true));
    text = "Everyone got greedy — all of them lose their vote at their next Tribal Council.";
  } else if (takers.length) {
    takers.forEach((x) => {
      const a = giveAdvantage(x.c, s);
      details.push(a ? `${x.c.name} earns a ${ADVANTAGE_LABEL[a]}.` : `${x.c.name} already holds everything on offer.`);
    });
    text = "The gamble paid off for the risk-takers.";
  } else text = "Everyone played it safe and returns to camp empty-handed but with their vote.";
  picks.forEach((a) => picks.forEach((b) => a.id < b.id && addRel(s, a.id, b.id, 6)));
  log(s, {
    kind: "twist",
    title: pick(["Journey to the Summit", "A Secret Journey", "The Summit"]),
    text: `${picks.map((c) => c.name).join(", ")} are sent on a journey and face a dilemma: protect your vote or risk it for an advantage. ${text}`,
    details,
  });
}

function doExile(s: GameState, winTid: string) {
  const losers = alive(s).filter((c) => c.tribeId !== winTid);
  if (!losers.length) return;
  const winners = groups(s).get(winTid) ?? [];
  const ex = [...losers].sort(
    (a, b) =>
      winners.reduce((acc, w) => acc + getRel(s, w.id, a.id), 0) -
      winners.reduce((acc, w) => acc + getRel(s, w.id, b.id), 0),
  )[0];
  mood(ex, -10);
  let found = "";
  if (
    canDiscoverIdol(s) &&
    (s.hiddenIdols[ex.tribeId] ?? 0) > 0 &&
    ex.idols === 0 &&
    r() < 0.3 + ex.stats.strategy * 0.04
  ) {
    ex.idols = 1;
    s.hiddenIdols[ex.tribeId]--;
    found = ` Following a clue, ${ex.name} finds a Hidden Immunity Idol ${pick(IDOL_HIDING_PLACES)}!`;
  }
  log(s, {
    kind: "twist",
    title: "Exile Island",
    text: `${tribeOf(s, winTid)!.name} send ${ex.name} to Exile Island for the night — alone, hungry, and out of the loop.${found || " The clue leads nowhere."}`,
  });
}

export interface Castaway {
  id: string;
  name: string;
  tribeId: string;
  isEliminated: boolean;
}

export interface Tribe {
  id: string;
  name: string;
  color: string;
}

export interface GameState {
  tribes: Tribe[];
  castaways: Castaway[];
  isPreMerge: boolean;
  mergeThreshold: number; // e.g. 11 or 12
  log: string[];
}

/**
 * Dissolves a tribe if its active membership drops to 2 during a 3-tribe pre-merge,
 * absorbing those 2 remaining players into the other 2 surviving tribes.
 */
export function checkAndDissolveSmallTribe(state: GameState): GameState {
  const { tribes, castaways, isPreMerge, mergeThreshold } = state;

  // 1. Only run during pre-merge with exactly 3 tribes, above merge threshold
  const activeCastaways = castaways.filter((c) => !c.isEliminated);
  if (!isPreMerge || tribes.length !== 3 || activeCastaways.length <= mergeThreshold) {
    return state;
  }

  // 2. Count active players per tribe
  const tribeMemberCounts = tribes.map((tribe) => {
    const members = activeCastaways.filter((c) => c.tribeId === tribe.id);
    return { tribe, members, count: members.length };
  });

  // 3. Find if any tribe has reached 2 members
  const tribeToDissolve = tribeMemberCounts.find((t) => t.count === 2);
  if (!tribeToDissolve) return state;

  const receivingTribes = tribeMemberCounts.filter((t) => t.tribe.id !== tribeToDissolve.tribe.id);
  if (receivingTribes.length !== 2) return state;

  // 4. Randomly assign 1 member to each of the 2 remaining tribes
  const playersToReassign = [...tribeToDissolve.members].sort(() => Math.random() - 0.5);

  const updatedCastaways = castaways.map((castaway) => {
    if (castaway.id === playersToReassign[0].id) {
      return { ...castaway, tribeId: receivingTribes[0].tribe.id };
    }
    if (castaway.id === playersToReassign[1].id) {
      return { ...castaway, tribeId: receivingTribes[1].tribe.id };
    }
    return castaway;
  });

  const updatedTribes = tribes.filter((t) => t.id !== tribeToDissolve.tribe.id);

  const logEntry = `🚨 TRIBE DISSOLUTION: ${tribeToDissolve.tribe.name} has dissolved! ${playersToReassign[0].name} joins ${receivingTribes[0].tribe.name}, and ${playersToReassign[1].name} joins ${receivingTribes[1].tribe.name}.`;

  return {
    ...state,
    tribes: updatedTribes,
    castaways: updatedCastaways,
    log: [...state.log, logEntry],
  };
}

/**
 * Resolves a player's 50/50 Coin play at Tribal Council.
 * Gives a 50% chance of granting immunity for that vote.
 */
export function resolveFiftyFiftyCoin(castaway: {
  name: string;
  hasFiftyFiftyCoin?: boolean;
  playedFiftyFiftyCoin?: boolean;
}) {
  if (!castaway.hasFiftyFiftyCoin || !castaway.playedFiftyFiftyCoin) {
    return { isSafe: false, message: "" };
  }

  // 50% chance (Math.random < 0.5)
  const isSafe = Math.random() < 0.5;

  if (isSafe) {
    return {
      isSafe: true,
      message: `🪙 **50/50 COIN:** ${castaway.name} plays their 50/50 coin, flips it, and hits **SAFE**! Any votes cast against them will not count!`,
    };
  } else {
    return {
      isSafe: false,
      message: `🪙 **50/50 COIN:** ${castaway.name} plays their 50/50 coin, flips it, and hits **NOT SAFE**! Their votes will count normally.`,
    };
  }
}
