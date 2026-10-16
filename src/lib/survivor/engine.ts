// @ts-nocheck -- array indexing is guarded by game invariants
// Survivor simulation engine — pure client-side state machine.
export type StatKey =
  | "strategy" | "social" | "loyalty" | "temperament"
  | "general" | "physical" | "endurance" | "mental";

export const SOCIAL_STATS: StatKey[] = ["strategy", "social", "loyalty", "temperament"];
export const CHALLENGE_STATS: StatKey[] = ["general", "physical", "endurance", "mental"];
export const STAT_LABEL: Record<StatKey, string> = {
  strategy: "Strategy", social: "Social", loyalty: "Loyalty", temperament: "Temperament",
  general: "General", physical: "Physical", endurance: "Endurance", mental: "Mental",
};

export interface Castaway {
  id: string; name: string; tribeId: string; originalTribeId: string;
  stats: Record<StatKey, number>;
  out: boolean; juror: boolean; idols: number; advantages: AdvantageKey[]; mood: number;
  placement?: number; immunityWins: number; betrayedBy: string[];
  fakeIdol?: "own" | "planted"; bewareTribals?: number; lostVote?: boolean; edge?: boolean;
  votesCast?: number; correctVotes?: number; votesAgainst?: number; idolsPlayed?: number; advPlayed?: number;
}
export type AdvantageKey = "extra_vote" | "steal_vote" | "vote_blocker" | "safety" | "idol_nullifier" | "knowledge_is_power";
export const ADVANTAGES: AdvantageKey[] = ["extra_vote", "steal_vote", "vote_blocker", "safety", "idol_nullifier", "knowledge_is_power"];
export const ADVANTAGE_LABEL: Record<AdvantageKey, string> = { extra_vote: "Extra Vote", steal_vote: "Steal a Vote", vote_blocker: "Vote Blocker", safety: "Safety Without Power", idol_nullifier: "Idol Nullifier", knowledge_is_power: "Knowledge is Power" };
export const ADVANTAGE_DESC: Record<AdvantageKey, string> = {
  extra_vote: "Cast a second vote at Tribal Council.",
  steal_vote: "Take someone's vote and cast it yourself.",
  vote_blocker: "Block one person from voting.",
  safety: "Leave Tribal Council safe — but you don't vote.",
  idol_nullifier: "Cancel any idol played for the person you name.",
  knowledge_is_power: "Ask someone if they have an idol or advantage — if they do, it's yours.",
};
export const ADVANTAGE_NEEDS_TARGET: AdvantageKey[] = ["steal_vote", "vote_blocker", "idol_nullifier", "knowledge_is_power"];
export interface Tribe { id: string; name: string; color: string }
export interface Alliance { id: string; name: string; members: string[] }
export interface Config {
  playerCount: number; tribeCount: number; jurySize: number;
  finalSize: 2 | 3; fireAtF4: boolean;
  swapEnabled: boolean; swapAt: number; mergeAt: number;
  mergedName: string; mergedColor: string;
  swapTribe?: Tribe;
  jointTribals?: boolean; doubleTribals?: boolean;
  controlledId: string | null;
}
export interface Vote { voter: string; target: string; nullified?: boolean }
export interface LogEntry {
  kind: "camp" | "drama" | "alliance" | "idol" | "challenge" | "tribal" | "twist" | "finale";
  title: string; text: string; details?: string[]; votes?: Vote[]; revote?: Vote[];
}
export interface Episode { n: number; title: string; entries: LogEntry[] }
export type Phase = "camp" | "challenge" | "tribal" | "final_challenge" | "final_choice" | "ftc" | "done";
export interface GameState {
  config: Config; castaways: Castaway[]; tribes: Tribe[]; alliances: Alliance[];
  rel: Record<string, number>; episodes: Episode[]; day: number; phase: Phase;
  merged: boolean; swapped: boolean; immune: string[]; tribalTribe: string | null;
  hiddenIdols: Record<string, number>; finalImmune?: string; usedChallenges: string[]; rewardAdvantageGiven: boolean;
  tribalTribes?: string[]; tribalQueue?: string[][]; doubleElim?: boolean; twistsUsed?: string[];
  winner?: string; finalists?: string[]; juryVotes?: { juror: string; finalist: string; reason: string }[];
}
export const SEARCH_SPOTS = ["the tree line", "the water well", "behind the shelter", "the rocky outcrop", "the beach at dawn"];
export interface Decision { vote?: string; idol?: string; allyWith?: string; cut?: string; searchIdol?: boolean; searchSpot?: string; advantage?: AdvantageKey; advantageTarget?: string; giveImmunity?: string }

export const TRIBE_NAMES = [
  "Veylora", "Kelmori", "Zunakai", "Dakal", "Naviti", "Taku", "Ulong", "Pagong", "Tagi", "Kucha",
  "Ogakor", "Samburu", "Kota", "Fang", "Kalabaw", "Tandang", "Salani", "Manono", "Nuku",
  "Malolo", "Vakama", "Luvu", "Yase", "Soka", "Ika", "Baka", "Gata", "Lavo", "Moto", "Ravu",
];
export const MERGE_NAMES = ["Velunara", "Solarrion", "Orivessa", "Tazumori", "Kelavora", "Zunaveli", "Lumekari", "Veyranoa"];
export const TRIBE_COLORS = ["#e8662a", "#2f7fd6", "#e3c13b", "#3fae5a", "#c43d3d", "#8b5ad6", "#e45fa1", "#2bb5b0"];

function hslToHex(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  const seg: [number, number, number][] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]];
  const [rr, gg, bb] = seg[Math.floor(h / 60) % 6];
  const to2 = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to2(rr)}${to2(gg)}${to2(bb)}`;
}
function hexToHue(hex: string): number | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r8 = ((n >> 16) & 255) / 255, g8 = ((n >> 8) & 255) / 255, b8 = (n & 255) / 255;
  const max = Math.max(r8, g8, b8), min = Math.min(r8, g8, b8), d = max - min;
  if (d === 0) return null;
  const h = max === r8 ? ((g8 - b8) / d) % 6 : max === g8 ? (b8 - r8) / d + 2 : (r8 - g8) / d + 4;
  return (h * 60 + 360) % 360;
}
const hueGap = (a: number, b: number) => { const d = Math.abs(a - b); return Math.min(d, 360 - d); };

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
const REAL_TRIBES = ["Pagong", "Tagi", "Kucha", "Ogakor", "Samburu", "Boran", "Rotu", "Maraamu", "Chuay Gahn", "Sook Jai", "Rotu", "Fang", "Kota", "Ulong", "Koror", "Moto", "Ravu", "Casaya", "La Mina", "Bayoneta", "Aitu", "Puka", "Raro", "Manihiki", "Fei Long", "Zhan Hu", "Malakal", "Airai", "Dabu", "Galang", "Tandang", "Kalabaw", "Salani", "Manono", "Nuku", "Vakama", "Yase", "Soka", "Ika", "Baka", "Gata", "Lavo", "Luvu", "Naviti", "Taku", "Dakal"];
/** An invented tribe name (never a real Survivor tribe) that isn't already in `avoid`. */
export function randomTribeName(avoid: string[] = []): string {
  const lower = [...avoid, ...REAL_TRIBES].map((x) => x.toLowerCase());
  for (let i = 0; i < 50; i++) {
    const n = pick(SYL_A) + (r() < 0.6 ? pick(SYL_B) : "") + pick(SYL_C);
    if (!lower.includes(n.toLowerCase())) return n;
  }
  return `${pick(SYL_A)}${pick(SYL_C)}${Math.floor(r() * 90 + 10)}`;
}

const NAMES = [
  "Adrian", "Amara", "Anika", "Brielle", "Callum", "Celia", "Dorian", "Elise", "Emmett", "Esme",
  "Felix", "Freya", "Gideon", "Hugo", "Imogen", "Inez", "Jasper", "Jules", "Kieran", "Leona",
  "Luca", "Maeve", "Maren", "Micah", "Nadia", "Nico", "Noelle", "Otis", "Petra", "Rafael",
  "Rhea", "Ronan", "Sienna", "Silas", "Tessa", "Theo", "Tobias", "Vera", "Willa", "Zara",
  "Tony", "Stephanie", "Rob", "Ava", "Ben", "Daniel", "Emma", "Grace", "Jack", "Julia",
  "Mason", "Maya", "Owen", "Sophie", "Spark", "Patch", "Scooter", "Doc", "Rook", "Sprocket",
  "Radar", "Skipper", "Sparks", "Pebbles",
];
const ALLIANCE_NAMES = ["The Core", "Four Horsemen", "Rogue Squad", "Black Widow Brigade", "Stealth R Us", "The Rat Pack", "Sanctuary", "Night Owls", "The Underdogs", "Tidal Wave", "The Coconut Crew", "Shadow Council"];
const EP_TITLES = ["The Island Has Spoken", "Sand in My Teeth", "Torches at Dusk", "Coconut Diplomacy", "Hold Your Fire", "Buffs and Bruises", "The Snake Pit", "Sunburned Strategies", "Rock Bottom", "Whispers by the Well", "A Storm Is Coming", "Paper Thin Promises", "Double Trouble", "Every Rock Has Two Sides", "Fire in the Belly", "Smoke Signals", "The Jungle Remembers", "Keep Your Enemies Closer", "Tree Mail Tremors", "Hunger Games at Camp", "Cracks in the Shelter", "No Safe Seats", "Chasing Shadows", "Last Light", "The Purple Rock", "Spilled Rice", "Low Tide, High Stakes", "Riding the Wave", "A Vote Is a Vote", "Ticking Time Bomb", "Dead Weight", "Born to Scheme", "The Merge Feast", "Cutthroat Paradise", "Lightning Strikes Twice", "I'm Not Here to Make Friends", "Blindside City", "The Tide Turns", "Snakes in the Grass", "Who Can You Trust?", "Playing With Fire", "Calm Before the Storm", "A Bridge Too Far", "Don't Get Comfortable", "Idol Chatter", "Trust Nobody", "Rice and Paranoia", "Numbers Game", "Out of the Frying Pan", "The Long Con", "Torch Snuffer"];

const r = () => Math.random();
const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
export const randStat = () => 1 + Math.floor(r() * 5);
export function randomStats(): Record<StatKey, number> {
  return Object.fromEntries([...SOCIAL_STATS, ...CHALLENGE_STATS].map((k) => [k, randStat()])) as Record<StatKey, number>;
}
export function defaultJury(n: number) { return n <= 12 ? 7 : n <= 16 ? 8 : n <= 18 ? 8 : 9; }
export function defaultMergeAt(n: number, jury: number, final: number) { return Math.min(final + jury + 1, n - 2); }

export function makeRoster(n: number, tribeCount: number, existing?: { name: string; stats: Record<StatKey, number> }[]) {
  const names = shuffle(NAMES);
  return Array.from({ length: n }, (_, i) => ({
    name: existing?.[i]?.name ?? names[i],
    stats: existing?.[i]?.stats ?? randomStats(),
    tribeIndex: i % tribeCount,
  }));
}

export function newGame(config: Config, tribes: Tribe[], roster: { name: string; stats: Record<StatKey, number>; tribeIndex: number }[]): GameState {
  const castaways: Castaway[] = roster.map((p, i) => ({
    id: `c${i}`, name: p.name, tribeId: tribes[p.tribeIndex].id, originalTribeId: tribes[p.tribeIndex].id,
    stats: { ...p.stats }, out: false, juror: false, idols: 0, advantages: [], mood: 70, immunityWins: 0, betrayedBy: [],
  }));
  const rel: Record<string, number> = {};
  for (const a of castaways) for (const b of castaways) if (a.id < b.id) rel[key(a.id, b.id)] = Math.round((r() - 0.5) * 10 + (a.tribeId === b.tribeId ? 3 : 0));
  const hiddenIdols: Record<string, number> = {};
  tribes.forEach((t) => (hiddenIdols[t.id] = 1));
  return {
    config, castaways, tribes, alliances: [], rel, day: 1, phase: "camp", merged: false, swapped: false,
    immune: [], tribalTribe: null, hiddenIdols, usedChallenges: [], rewardAdvantageGiven: false,
    episodes: [{ n: 1, title: pick(EP_TITLES.slice(0, 20)), entries: [{ kind: "twist", title: "The Adventure Begins", text: `${castaways.length} castaways are marooned and divided into ${tribes.length} tribes: ${tribes.map((t) => t.name).join(", ")}.` }] }],
  };
}

// ---------- helpers ----------
export const getRel = (s: GameState, a: string, b: string) => s.rel[key(a, b)] ?? 0;
const addRel = (s: GameState, a: string, b: string, d: number) => { if (a !== b) s.rel[key(a, b)] = clamp(getRel(s, a, b) + d, -50, 50); };
export const alive = (s: GameState) => s.castaways.filter((c) => !c.out);
export const byId = (s: GameState, id: string) => s.castaways.find((c) => c.id === id)!;
const nm = (s: GameState, id: string) => byId(s, id).name;
const groups = (s: GameState) => {
  const m = new Map<string, Castaway[]>();
  for (const c of alive(s)) { if (!m.has(c.tribeId)) m.set(c.tribeId, []); m.get(c.tribeId)!.push(c); }
  return m;
};
export const tribeOf = (s: GameState, id: string) => s.tribes.find((t) => t.id === id);
const ep = (s: GameState) => s.episodes[s.episodes.length - 1];
const log = (s: GameState, e: LogEntry) => ep(s).entries.push(e);
const sharedAlliance = (s: GameState, a: string, b: string) => s.alliances.some((al) => al.members.includes(a) && al.members.includes(b));
const threat = (c: Castaway) => (c.stats.strategy + c.stats.social) * 0.6 + (c.stats.general + c.stats.physical + c.stats.endurance + c.stats.mental) * 0.25 + c.immunityWins * 0.8;
const missingAdv = (c: Castaway) => ADVANTAGES.filter((a) => !(c.advantages ?? []).includes(a));
const giveAdvantage = (c: Castaway): AdvantageKey | null => { const opts = missingAdv(c); if (!opts.length) return null; const a = pick(opts); c.advantages = [...(c.advantages ?? []), a]; return a; };
const weakness = (c: Castaway) => 5 - (c.stats.general + c.stats.physical + c.stats.endurance + c.stats.mental) / 4;

// ---------- decisions needed ----------
export type Pending =
  | { kind: "camp"; options: Castaway[] }
  | { kind: "tribal"; options: Castaway[]; hasIdol: boolean; advantages: AdvantageKey[]; idolTargets: Castaway[]; canGiveImmunity: boolean }
  | { kind: "cut"; options: Castaway[]; fire: boolean }
  | null;

export const tribalGroup = (s: GameState) => s.tribalTribes?.length ? s.tribalTribes : s.tribalTribe ? [s.tribalTribe] : [];
export const attendees = (s: GameState) => { const g = tribalGroup(s); return alive(s).filter((c) => g.includes(c.tribeId)); };

export function pendingDecision(s: GameState): Pending {
  const me = s.config.controlledId ? byId(s, s.config.controlledId) : null;
  if (!me || me.out) return null;
  if (s.phase === "camp") return { kind: "camp", options: alive(s).filter((c) => c.tribeId === me.tribeId && c.id !== me.id) };
  if (s.phase === "tribal" && tribalGroup(s).includes(me.tribeId)) {
    const att = attendees(s);
    return { kind: "tribal", options: att.filter((c) => c.id !== me.id && !s.immune.includes(c.id)), hasIdol: me.idols > 0, advantages: [...(me.advantages ?? [])], idolTargets: att.filter((c) => !s.immune.includes(c.id)), canGiveImmunity: s.merged && s.immune.includes(me.id) };
  }
  if (s.phase === "final_choice" && s.finalImmune === me.id) {
    return { kind: "cut", options: alive(s).filter((c) => c.id !== me.id), fire: isFireFinal(s) };
  }
  return null;
}

// ---------- step ----------
export function step(prev: GameState, d: Decision = {}): GameState {
  const s: GameState = structuredClone(prev);
  switch (s.phase) {
    case "camp": doCamp(s, d); s.phase = alive(s).length <= s.config.finalSize + 1 ? "final_challenge" : "challenge"; break;
    case "challenge": doChallenge(s); s.phase = "tribal"; break;
    case "tribal": doTribal(s, d); afterTribal(s); break;
    case "final_challenge": doFinalChallenge(s); s.phase = "final_choice"; break;
    case "final_choice": doFinalChoice(s, d); s.phase = "ftc"; break;
    case "ftc": doFTC(s); s.phase = "done"; break;
  }
  return s;
}

export function simulateToEnd(s: GameState): GameState {
  let g = s; let guard = 0;
  while (g.phase !== "done" && guard++ < 500) g = step(g);
  return g;
}

// ---------- camp ----------
function doCamp(s: GameState, d: Decision) {
  for (const [tid, members] of groups(s)) {
    const t = tribeOf(s, tid)!;
    const details: string[] = [];
    // drift & bonding
    for (const a of members) for (const b of members) if (a.id < b.id) {
      const bond = (a.stats.social + b.stats.social) / 2;
      addRel(s, a.id, b.id, Math.round((r() - 0.4) * bond * 1.5));
    }
    for (const a of members) {
      if (r() < a.stats.social * 0.05 && members.length > 1) {
        const b = pick(members.filter((x) => x.id !== a.id)); addRel(s, a.id, b.id, 7);
        details.push(`${a.name} and ${b.name} bonded ${pick(["over fishing", "while gathering firewood", "late at night by the fire", "talking about home", "building the shelter"])}.`);
      }
    }
    // arguments
    for (const a of members) {
      if (members.length > 1 && r() < (6 - a.stats.temperament) * 0.055) {
        const b = pick(members.filter((x) => x.id !== a.id));
        const sev = 6 + Math.round(r() * 10);
        addRel(s, a.id, b.id, -sev); a.mood = clamp(a.mood - 8, 0, 100); b.mood = clamp(b.mood - 5, 0, 100);
        members.forEach((m) => m.id !== a.id && m.id !== b.id && addRel(s, m.id, a.id, -2));
        log(s, { kind: "drama", title: `${t.name}: Camp Drama`, text: `${a.name} blew up at ${b.name} ${pick(["over the rice rations", "for sleeping in", "about not pulling their weight", "after overhearing whispers", "over the fire going out"])}.`, details: [`Relationship ${a.name} ↔ ${b.name}: -${sev}`, `The tribe grows wary of ${a.name}.`] });
      }
    }
    // alliances
    for (const a of shuffle(members)) {
      const mine = s.alliances.filter((al) => al.members.includes(a.id));
      if (mine.length >= 2 || members.length < 3) continue;
      if (r() < a.stats.strategy * 0.05) {
        const size = 1 + Math.floor(r() * Math.min(3, members.length - 2));
        const partners = members.filter((x) => x.id !== a.id && x.id !== s.config.controlledId)
          .sort((x, y) => getRel(s, a.id, y.id) - getRel(s, a.id, x.id)).slice(0, size);
        if (!partners.length || getRel(s, a.id, partners[0].id) < 0) continue;
        const al: Alliance = { id: `a${s.alliances.length}${Date.now() % 1000}`, name: pick(ALLIANCE_NAMES.filter((n) => !s.alliances.some((x) => x.name === n))) ?? "The Alliance", members: [a.id, ...partners.map((p) => p.id)] };
        s.alliances.push(al);
        for (const x of al.members) for (const y of al.members) if (x < y) addRel(s, x, y, 6);
        log(s, { kind: "alliance", title: `${t.name}: Alliance Formed`, text: `${a.name} pulled ${partners.map((p) => p.name).join(", ")} aside to form "${al.name}".` });
      }
    }
    // idol hunting
    if ((s.hiddenIdols[tid] ?? 0) > 0) {
      for (const a of shuffle(members.filter((c) => c.id !== s.config.controlledId && c.idols === 0))) {
        if (r() < 0.01 + a.stats.strategy * 0.015) {
          a.idols++; s.hiddenIdols[tid]--;
          log(s, { kind: "idol", title: `${t.name}: Idol Found!`, text: `${a.name} snuck away and found a Hidden Immunity Idol ${pick(["inside a tree knot", "buried under the well", "tied beneath the shelter", "in a coconut shell"])}.` });
          break;
        }
      }
    } else {
      // advantages only surface once this camp's idol has been found
      for (const a of shuffle(members.filter((c) => c.id !== s.config.controlledId && missingAdv(c).length))) {
        if (r() < 0.005 + a.stats.strategy * 0.006) {
          const adv = giveAdvantage(a)!;
          log(s, { kind: "idol", title: `${t.name}: Advantage Found!`, text: `${a.name} quietly pocketed a ${ADVANTAGE_LABEL[adv]} advantage.` });
          break;
        }
      }
    }
    for (const m of members) {
      const avg = members.reduce((acc, o) => (o.id === m.id ? acc : acc + getRel(s, m.id, o.id)), 0) / Math.max(1, members.length - 1);
      m.mood = clamp(Math.round(m.mood * 0.7 + (60 + avg * 1.5) * 0.3), 5, 100);
    }
    // random camp events
    if (r() < 0.65 && members.length) {
      const ev = pick(CAMP_EVENTS); const a = pick(members); const b = pick(members.filter((x) => x.id !== a.id)) ?? a;
      ev.fx(s, a, b, members);
      log(s, { kind: ev.kind, title: `${t.name}: ${ev.title}`, text: ev.text(a.name, b.name) });
    }
    log(s, { kind: "camp", title: `${t.name}: Life at Camp`, text: `Day ${s.day}. ${pick(["The rain wouldn't stop.", "Spirits are high at camp.", "Hunger is setting in.", "The heat is brutal.", "Paranoia is creeping in."])}`, details: details.length ? details : ["A quiet day at camp."] });
  }
  // medevacs & quits (rare, at most one per episode)
  if (alive(s).length > s.config.finalSize + 3) {
    const pool = alive(s);
    const med = pool.find(() => r() < 0.0035);
    const quitter = !med && pool.filter((c) => c.id !== s.config.controlledId && (c.mood < 45 && c.stats.temperament <= 3) || r() < 0.03).find(() => r() < 0.06);
    const gone = med || quitter;
    if (gone) {
      eliminate(s, gone, med ? "medevac" : "quit");
      log(s, med
        ? { kind: "twist", title: "Medical Evacuation", text: `${gone.name} ${pick(["collapsed from dehydration", "suffered a serious infection in their leg", "dislocated a shoulder during a camp chore", "was struck by severe heat exhaustion"])}. Medical makes the call: ${gone.name} is pulled from the game${gone.juror ? " and joins the jury" : ""}.` }
        : { kind: "drama", title: "A Castaway Quits", text: `Worn down and miserable, ${gone.name} asks for their torch to be snuffed. ${gone.name} has quit the game.` });
    }
  }
  // player approach
  if (s.config.controlledId && byId(s, s.config.controlledId).out) d = {};
  if (d.allyWith === "__random__" && s.config.controlledId) {
    const meC = byId(s, s.config.controlledId);
    const opts = alive(s).filter((c) => c.tribeId === meC.tribeId && c.id !== meC.id);
    d = { ...d, allyWith: opts.length ? pick(opts).id : undefined };
  }
  if (d.searchIdol && s.config.controlledId) {
    const meC = byId(s, s.config.controlledId);
    const spot = d.searchSpot && SEARCH_SPOTS.includes(d.searchSpot) ? d.searchSpot : pick(SEARCH_SPOTS);
    const roll = r() - meC.stats.strategy * 0.02;
    const idolHere = (s.hiddenIdols[meC.tribeId] ?? 0) > 0 && meC.idols === 0;
    let adv: AdvantageKey | null = null;
    if (idolHere && roll < 0.22) {
      meC.idols = 1; s.hiddenIdols[meC.tribeId]--;
      log(s, { kind: "idol", title: "Your Search: Idol Found!", text: `You slipped away to search ${spot} — and found a Hidden Immunity Idol!` });
    } else if (!idolHere && roll < 0.18 && (adv = giveAdvantage(meC))) {
      log(s, { kind: "idol", title: "Your Search: Advantage Found!", text: `You searched ${spot} and found a ${ADVANTAGE_LABEL[adv]} advantage. ${ADVANTAGE_DESC[adv]}` });
    } else {
      for (const o of alive(s).filter((c) => c.tribeId === meC.tribeId && c.id !== meC.id)) if (r() < 0.3) addRel(s, meC.id, o.id, -2);
      log(s, { kind: "idol", title: "Your Search: Nothing", text: `You searched ${spot} but came back empty-handed. A few people noticed you were gone.` });
    }
  }
  if (d.allyWith && s.config.controlledId) {
    const me = s.config.controlledId, them = d.allyWith;
    const target = byId(s, them);
    const accept = getRel(s, me, them) + target.stats.social * 3 + r() * 20 > 15;
    if (accept) {
      addRel(s, me, them, 14);
      let al = s.alliances.find((a) => a.members.includes(me) && !a.members.includes(them));
      if (al && al.members.length < 5) al.members.push(them);
      else if (!s.alliances.some((a) => a.members.includes(me) && a.members.includes(them))) {
        al = { id: `a${s.alliances.length}p`, name: pick(ALLIANCE_NAMES), members: [me, them] }; s.alliances.push(al);
      }
      log(s, { kind: "alliance", title: "Your Move", text: `You approached ${target.name} — they're in. You've agreed to work together.` });
    } else {
      addRel(s, me, them, -3);
      log(s, { kind: "alliance", title: "Your Move", text: `You approached ${target.name}, but they seemed hesitant and noncommittal.` });
    }
  }
  s.day += 1;
}

type CampEvent = { kind: LogEntry["kind"]; title: string; text: (a: string, b: string) => string; fx: (s: GameState, a: Castaway, b: Castaway, ms: Castaway[]) => void };
const mood = (c: Castaway, d: number) => (c.mood = clamp(c.mood + d, 0, 100));
const CAMP_EVENTS: CampEvent[] = [
  { kind: "camp", title: "Big Catch", text: (a) => `${a} speared a huge fish and fed the whole tribe.`, fx: (s, a, _b, ms) => ms.forEach((m) => { mood(m, 6); addRel(s, a.id, m.id, 3); }) },
  { kind: "camp", title: "Storm Hits Camp", text: () => "A violent storm ripped through camp overnight and flattened the shelter.", fx: (_s, _a, _b, ms) => ms.forEach((m) => mood(m, -10)) },
  { kind: "drama", title: "Missing Rice", text: (a) => `Rice is disappearing, and suspicion falls on ${a}.`, fx: (s, a, _b, ms) => ms.forEach((m) => addRel(s, m.id, a.id, -4)) },
  { kind: "camp", title: "Fire Starter", text: (a) => `${a} finally made fire with flint after hours of trying.`, fx: (s, a, _b, ms) => ms.forEach((m) => addRel(s, a.id, m.id, 2)) },
  { kind: "camp", title: "Homesick", text: (a) => `${a} broke down crying about missing family back home.`, fx: (_s, a) => mood(a, -12) },
  { kind: "drama", title: "Caught Scrambling", text: (a, b) => `${b} caught ${a} whispering game talk with the other side of the tribe.`, fx: (s, a, b) => addRel(s, a.id, b.id, -8) },
  { kind: "camp", title: "Tree Mail", text: () => "Tree mail arrives with cryptic hints about what's coming next.", fx: (_s, _a, _b, ms) => ms.forEach((m) => mood(m, 2)) },
  { kind: "camp", title: "Late Night Talk", text: (a, b) => `${a} and ${b} stayed up all night trading life stories.`, fx: (s, a, b) => addRel(s, a.id, b.id, 9) },
  { kind: "camp", title: "Injury Scare", text: (a) => `${a} sliced a foot on coral but insists they're fine.`, fx: (_s, a) => { mood(a, -8); } },
  { kind: "drama", title: "Lazy Accusations", text: (a) => `The tribe grumbles that ${a} hasn't lifted a finger all day.`, fx: (s, a, _b, ms) => ms.forEach((m) => addRel(s, m.id, a.id, -3)) },
  { kind: "camp", title: "Crab Feast", text: (a) => `${a} rounded up a bucket of crabs for dinner.`, fx: (_s, _a, _b, ms) => ms.forEach((m) => mood(m, 4)) },
  { kind: "camp", title: "Fake Idol Crafted", text: (a) => `${a} carved a fake idol out of a coconut and some beads — just in case.`, fx: (_s, a) => mood(a, 3) },
  { kind: "drama", title: "Fire Goes Out", text: (a) => `${a} was on fire duty and let the flames die overnight.`, fx: (s, a, _b, ms) => ms.forEach((m) => addRel(s, m.id, a.id, -5)) },
  { kind: "camp", title: "Shark Sighting", text: (a) => `${a} spotted a reef shark near the water hole and nobody wanted to swim for the rest of the day.`, fx: () => {} },
];

// ---------- challenges ----------
const CH_TYPES: { type: StatKey; names: string[] }[] = [
  { type: "physical", names: ["Sea Crates", "Battering Ram", "Shipwrecked", "Tug of War Brawl", "Crate Smash", "Log Roll Rumble", "Sumo at Sea", "Barrel Haul", "Cargo Net Climb", "Sled Drag", "Wrecking Crew", "Ball Brawl"] },
  { type: "endurance", names: ["Hang Time", "Last Gasp", "Balance Beam Hold", "Water Bucket Stand", "Pole Hang", "Statue Still", "Tidal Hold", "Weight of the Tribe", "Foothold", "Sunset Perch"] },
  { type: "mental", names: ["Slide Puzzle", "Memory Mayhem", "Combination Lock", "Word Scramble", "Tile Twister", "Totem Riddle", "Mirror Maze", "Number Cipher", "Knot Unravel", "Map Fragments", "Tangram Tower", "Symbol Sequence"] },
  { type: "general", names: ["Obstacle Gauntlet", "Swim & Dive", "Ring Toss Relay", "Sandbag Throw", "Coconut Bowling", "Spear Throw", "Slingshot Targets", "Paddle Relay", "Key Hunt", "Bridge Builder", "Sand Dig Relay", "Torch Run"] },
];
const indScore = (c: Castaway, t: StatKey) => c.stats.general * 0.5 + c.stats[t] * 1.2 + r() * 3.5;

// Picks a never-before-used challenge; endurance stays locked until the merge.
function freshTitle(s: GameState) {
  const used = s.episodes.map((e) => e.title);
  const opts = EP_TITLES.filter((t) => !used.includes(t));
  if (opts.length) return pick(opts);
  let k = 2; const base = pick(EP_TITLES); while (used.includes(`${base} (Part ${k})`)) k++; return `${base} (Part ${k})`;
}

function pickChallenge(s: GameState, avoidType?: StatKey) {
  s.usedChallenges ??= [];
  let types = CH_TYPES.filter((t) => (s.merged || t.type !== "endurance") && t.type !== avoidType);
  if (!types.length) types = CH_TYPES.filter((t) => s.merged || t.type !== "endurance");
  const fresh = types.flatMap((t) => t.names.filter((n) => !s.usedChallenges.includes(n)).map((name) => ({ type: t.type, name })));
  let choice = fresh.length ? pick(fresh) : null;
  if (!choice) { const t = pick(types); let k = 2; while (s.usedChallenges.includes(`${t.names[0]} ${k}`)) k++; choice = { type: t.type, name: `${t.names[0]} ${k}` }; }
  s.usedChallenges.push(choice.name);
  return choice;
}

function rewardAdvantage(s: GameState, winners: Castaway[]) {
  if (s.rewardAdvantageGiven || !(s.merged || r() < 0.3)) return;
  const eligible = winners.filter((c) => missingAdv(c).length);
  if (!eligible.length) return;
  const c = pick(eligible); const adv = giveAdvantage(c)!;
  s.rewardAdvantageGiven = true;
  log(s, { kind: "idol", title: "Reward Advantage!", text: `Hidden in the reward basket, ${c.name} discovers a ${ADVANTAGE_LABEL[adv]} advantage. ${ADVANTAGE_DESC[adv]}` });
}

function doChallenge(s: GameState) {
  s.immune = [];
  const rew = pickChallenge(s); const ch = pickChallenge(s, rew.type);
  if (!s.merged) {
    const g = [...groups(s).entries()];
    const tscore = (ms: Castaway[], t: StatKey) => ms.reduce((a, c) => a + indScore(c, t), 0) / ms.length + r() * 3.5;
    const rs = g.map(([tid, ms]) => ({ tid, sc: tscore(ms, rew.type) })).sort((a, b) => b.sc - a.sc);
    log(s, { kind: "challenge", title: `Reward Challenge: ${rew.name} (${STAT_LABEL[rew.type]})`, text: `${tribeOf(s, rs[0].tid)!.name} win reward — ${pick(["fishing gear", "a feast of pizza", "tarp and blankets", "chickens"])}!`, details: rs.map((x, i) => `${i + 1}. ${tribeOf(s, x.tid)!.name} — ${x.sc.toFixed(2)}`) });
    rs[0] && groups(s).get(rs[0].tid)!.forEach((c) => (c.mood = clamp(c.mood + 8, 0, 100)));
    rewardAdvantage(s, groups(s).get(rs[0].tid)!);
    // reward winners are worn out from the feast, so the same tribe doesn't sweep every day
    const is = g.map(([tid, ms]) => ({ tid, sc: tscore(ms, ch.type) - (tid === rs[0].tid ? 0.8 : 0), mvp: [...ms].sort((a, b) => indScore(b, ch.type) - indScore(a, ch.type))[0] })).sort((a, b) => b.sc - a.sc);
    const loser = is[is.length - 1];
    s.tribalTribe = loser.tid; s.tribalTribes = [loser.tid]; s.tribalQueue = [];
    s.twistsUsed ??= [];
    log(s, { kind: "challenge", title: `Immunity Challenge: ${ch.name} (${STAT_LABEL[ch.type]})`, text: `${is.slice(0, -1).map((x) => tribeOf(s, x.tid)!.name).join(" & ")} win immunity! ${tribeOf(s, loser.tid)!.name} will face Tribal Council.`, details: [...is.map((x, i) => `${i + 1}. ${tribeOf(s, x.tid)!.name} — ${x.sc.toFixed(2)} (MVP: ${x.mvp.name})`), `${loser.mvp.name} tried to carry, but it wasn't enough.`] });
    const big = (tid: string) => (groups(s).get(tid)?.length ?? 0) >= 3;
    if (is.length >= 2 && s.config.jointTribals !== false && !s.twistsUsed.includes("joint") && r() < 0.14) {
      const losing = is.length === 2 ? is : is.slice(-2);
      s.twistsUsed.push("joint"); s.tribalTribes = losing.map((x) => x.tid);
      const pool = losing.flatMap((x) => groups(s).get(x.tid)!);
      const champ = pool.map((c) => ({ c, sc: indScore(c, ch.type) })).sort((a, b) => b.sc - a.sc)[0].c;
      s.immune = [champ.id]; champ.immunityWins++;
      log(s, { kind: "twist", title: "Joint Tribal Council!", text: `Twist! ${losing.map((x) => tribeOf(s, x.tid)!.name).join(" and ")} will attend Tribal Council together and vote out one person. ${champ.name} earned individual immunity for the best performance.` });
    } else if (is.length >= 2 && s.config.doubleTribals !== false && !s.twistsUsed.includes("double_pre") && r() < 0.12) {
      const losing = (is.length === 2 ? is : is.slice(-2)).filter((x) => big(x.tid));
      if (losing.length === 2) {
        s.twistsUsed.push("double_pre");
        s.tribalTribes = [losing[1].tid]; s.tribalQueue = [[losing[0].tid]];
        log(s, { kind: "twist", title: "Double Tribal Council!", text: `Twist! Both ${tribeOf(s, losing[1].tid)!.name} and ${tribeOf(s, losing[0].tid)!.name} will go to Tribal Council tonight — two people are going home.` });
      }
    }
  } else {
    const ms = alive(s);
    const rr = ms.map((c) => ({ c, sc: indScore(c, rew.type) })).sort((a, b) => b.sc - a.sc);
    rr[0].c.mood = clamp(rr[0].c.mood + 10, 0, 100);
    const buddy = ms.filter((x) => x.id !== rr[0].c.id).sort((a, b) => getRel(s, rr[0].c.id, b.id) - getRel(s, rr[0].c.id, a.id))[0];
    if (buddy) addRel(s, rr[0].c.id, buddy.id, 6);
    log(s, { kind: "challenge", title: `Reward Challenge: ${rew.name} (${STAT_LABEL[rew.type]})`, text: `${rr[0].c.name} wins reward${buddy ? ` and brings ${buddy.name} along` : ""}.`, details: rr.slice(0, 5).map((x, i) => `${i + 1}. ${x.c.name} — ${x.sc.toFixed(2)}`) });
    rewardAdvantage(s, [rr[0].c]);
    const ir = ms.map((c) => ({ c, sc: indScore(c, ch.type) - (c.id === rr[0].c.id ? 1.5 : 0) - (buddy && c.id === buddy.id ? 0.7 : 0) })).sort((a, b) => b.sc - a.sc);
    ir[0].c.immunityWins++; s.immune = [ir[0].c.id];
    s.tribalTribe = ms[0].tribeId; s.tribalTribes = [ms[0].tribeId]; s.tribalQueue = [];
    s.twistsUsed ??= [];
    if (s.config.doubleTribals !== false && !s.twistsUsed.includes("double_post") && ms.length >= s.config.finalSize + 4 && r() < 0.15) {
      s.twistsUsed.push("double_post"); s.doubleElim = true;
      log(s, { kind: "twist", title: "Double Elimination!", text: "Jeff drops a bomb: tonight, two people will be voted out. A second immunity challenge follows the first vote." });
    }
    log(s, { kind: "challenge", title: `Individual Immunity: ${ch.name} (${STAT_LABEL[ch.type]})`, text: `${ir[0].c.name} wins individual immunity and is safe tonight!`, details: ir.map((x, i) => `${i + 1}. ${x.c.name} — ${x.sc.toFixed(2)}`) });
  }
}

// ---------- tribal ----------
function aiVote(s: GameState, voter: Castaway, cands: Castaway[], attendees: Castaway[]): string {
  if (!cands.length) return voter.id;
  const scoreFor = (v: Castaway, c: Castaway) =>
    -getRel(s, v.id, c.id) * 0.08 + (s.merged ? threat(c) * v.stats.strategy * 0.06 : weakness(c) * 0.6) - (sharedAlliance(s, v.id, c.id) ? 2.5 : 0) + r() * 1.6;
  const mine = s.alliances.filter((a) => a.members.includes(voter.id)).map((a) => ({ a, present: a.members.filter((m) => attendees.some((x) => x.id === m)) })).filter((x) => x.present.length >= 2).sort((x, y) => y.present.length - x.present.length)[0];
  if (mine && r() < 0.45 + voter.stats.loyalty * 0.11) {
    const tc = cands.filter((c) => !mine.a.members.includes(c.id));
    if (tc.length) {
      return tc.map((c) => ({ c, sc: mine.present.reduce((acc, m) => acc + scoreFor(byId(s, m), c) - r() * 1.6, 0) })).sort((a, b) => b.sc - a.sc)[0].c.id;
    }
  }
  return cands.map((c) => ({ c, sc: scoreFor(voter, c) })).sort((a, b) => b.sc - a.sc)[0].c.id;
}

function tally(votes: Vote[]) { const m: Record<string, number> = {}; votes.forEach((v) => !v.nullified && (m[v.target] = (m[v.target] ?? 0) + 1)); return m; }

function doTribal(s: GameState, d: Decision) {
  const att = attendees(s);
  const tname = tribalGroup(s).map((id) => tribeOf(s, id)?.name ?? "").join(" & ");
  const ctrl = s.config.controlledId;
  const immLog: string[] = [];
  // giving up individual immunity
  const holderId = s.merged ? s.immune[0] : undefined;
  if (holderId && att.some((c) => c.id === holderId)) {
    const holder = byId(s, holderId);
    let to: string | undefined;
    if (holder.id === ctrl) to = d.giveImmunity && att.some((c) => c.id === d.giveImmunity && c.id !== holder.id) ? d.giveImmunity : undefined;
    else if (r() < 0.04) to = att.filter((c) => c.id !== holder.id && getRel(s, holder.id, c.id) > 25).sort((a, b) => getRel(s, holder.id, b.id) - getRel(s, holder.id, a.id))[0]?.id;
    if (to) {
      s.immune = [to]; addRel(s, holder.id, to, 15);
      immLog.push(`${holder.name} shocks everyone by giving up individual immunity to ${nm(s, to)}!`);
    }
  }
  // advantage plays (before votes are cast)
  const plays: { who: Castaway; adv: AdvantageKey; target?: string }[] = [];
  for (const h of att.filter((c) => (c.advantages ?? []).length)) {
    let adv: AdvantageKey | undefined, target: string | undefined;
    if (h.id === ctrl) { adv = d.advantage && h.advantages.includes(d.advantage) ? d.advantage : undefined; target = d.advantageTarget; }
    else if (r() < 0.25 + h.stats.strategy * 0.06) {
      adv = pick(h.advantages);
      const foes = att.filter((c) => c.id !== h.id).sort((x, y) => getRel(s, h.id, x.id) - getRel(s, h.id, y.id));
      target = foes[0]?.id;
    }
    if (!adv) continue;
    if (adv === "safety" && att.length <= 4) continue;
    if (ADVANTAGE_NEEDS_TARGET.includes(adv) && (!target || target === h.id || !att.some((c) => c.id === target))) continue;
    h.advantages = h.advantages.filter((x) => x !== adv);
    plays.push({ who: h, adv, target });
  }
  const safe = plays.filter((p) => p.adv === "safety").map((p) => p.who.id);
  const blocked = plays.filter((p) => p.adv === "steal_vote" || p.adv === "vote_blocker").map((p) => p.target!);
  const nullifyFor = plays.filter((p) => p.adv === "idol_nullifier").map((p) => p.target!);
  const advLog = plays.map((p) => p.adv === "safety" ? `${p.who.name} plays Safety Without Power and leaves Tribal Council.` : p.adv === "extra_vote" ? `${p.who.name} plays an Extra Vote advantage and casts a second vote.` : p.adv === "steal_vote" ? `${p.who.name} plays Steal a Vote — ${nm(s, p.target!)} loses their vote.` : p.adv === "vote_blocker" ? `${p.who.name} plays a Vote Blocker on ${nm(s, p.target!)}.` : `${p.who.name} secretly plays an Idol Nullifier on ${nm(s, p.target!)}.`);
  const cands = (v: Castaway, excl: string[] = []) => att.filter((c) => c.id !== v.id && !s.immune.includes(c.id) && !safe.includes(c.id) && !excl.includes(c.id));
  const voters = att.filter((v) => !safe.includes(v.id));
  const castFor = (v: Castaway) => (v.id === ctrl && d.vote && cands(v).some((c) => c.id === d.vote) ? d.vote : aiVote(s, v, cands(v), att));
  let votes: Vote[] = voters.filter((v) => !blocked.includes(v.id)).map((v) => ({ voter: v.id, target: castFor(v) }));
  for (const p of plays) if ((p.adv === "extra_vote" || p.adv === "steal_vote") && !safe.includes(p.who.id)) {
    const own = votes.find((v) => v.voter === p.who.id);
    votes.push({ voter: p.who.id, target: own?.target ?? castFor(p.who) });
  }
  // idol plays
  const protectedIds: string[] = []; const idolLog: string[] = [];
  const t0 = tally(votes); const max = Math.max(0, ...Object.values(t0));
  for (const h of att.filter((c) => c.idols > 0)) {
    let target: string | null = null;
    if (h.id === ctrl) target = d.idol || null;
    else {
      const mine = t0[h.id] ?? 0;
      const finalTribal = alive(s).length <= 5;
      if ((mine >= max - 1 && mine > 0 && r() < 0.35 + h.stats.strategy * 0.12) || (finalTribal && mine > 0)) target = h.id;
      else {
        const ally = att.filter((c) => c.id !== h.id && getRel(s, h.id, c.id) > 18 && (t0[c.id] ?? 0) === max).sort((a, b) => getRel(s, h.id, b.id) - getRel(s, h.id, a.id))[0];
        if (ally && h.stats.strategy >= 4 && r() < 0.35) target = ally.id;
      }
    }
    if (target) {
      h.idols--; s.hiddenIdols[h.tribeId] = (s.hiddenIdols[h.tribeId] ?? 0) + 1;
      if (target !== h.id) addRel(s, h.id, target, 20);
      idolLog.push(target === h.id ? `${h.name} stands up and plays a Hidden Immunity Idol for themselves!` : `${h.name} plays a Hidden Immunity Idol for ${nm(s, target)}!`);
      if (nullifyFor.includes(target)) idolLog.push(`But the idol was nullified! Votes against ${nm(s, target)} still count.`);
      else protectedIds.push(target);
    }
  }
  votes = votes.map((v) => (protectedIds.includes(v.target) ? { ...v, nullified: true } : v));
  let t = tally(votes);
  const details: string[] = [...immLog, ...advLog, ...idolLog];
  let revote: Vote[] | undefined;
  if (!Object.keys(t).length) {
    details.push("Every vote was nullified! A revote is held.");
    revote = voters.map((v) => ({ voter: v.id, target: aiVote(s, v, cands(v, protectedIds), att) }));
    t = tally(revote);
  }
  let top = Math.max(...Object.values(t)); let tied = Object.keys(t).filter((k) => t[k] === top);
  let out: string; let rocks = false; const firstTally = t;
  if (tied.length > 1) {
    details.push(`Tie between ${tied.map((x) => nm(s, x)).join(" and ")}. Revote!`);
    revote = voters.filter((v) => !tied.includes(v.id)).map((v) => ({ voter: v.id, target: v.id === ctrl && d.vote && tied.includes(d.vote) ? d.vote : aiVote(s, v, att.filter((c) => tied.includes(c.id)), att) }));
    const rt = tally(revote); const rtop = Math.max(0, ...Object.values(rt)); const rtied = Object.keys(rt).filter((k) => rt[k] === rtop);
    if (rtied.length === 1) out = rtied[0];
    else {
      const pool = att.filter((c) => !tied.includes(c.id) && !s.immune.includes(c.id) && !safe.includes(c.id) && !protectedIds.includes(c.id));
      if (!pool.length || r() < 0.3) {
        out = [...tied].sort((a, b) => voters.reduce((acc, v) => acc + getRel(s, v.id, a), 0) - voters.reduce((acc, v) => acc + getRel(s, v.id, b), 0))[0];
        details.push(`Deadlock! Rather than draw rocks, the tribe reaches a unanimous decision to send ${nm(s, out)} home.`);
      } else {
        out = pick(pool).id; rocks = true;
        details.push(`Deadlock! Nobody budges, so ${pool.map((c) => c.name).join(", ")} must draw rocks... ${nm(s, out)} draws the purple rock.`);
      }
    }
  } else out = tied[0];
  const loser = byId(s, out);
  const allVotes = [...votes, ...(revote ?? [])];
  // relationship fallout
  const against = allVotes.filter((v) => v.target === out && !v.nullified).map((v) => v.voter);
  for (const v of against) {
    addRel(s, out, v, -12);
    if (sharedAlliance(s, out, v) || getRel(s, out, v) > 5) loser.betrayedBy.push(v);
  }
  for (const a of against) for (const b of against) if (a < b) addRel(s, a, b, 3);
  const blindside = !allVotes.some((v) => v.voter === out && against.includes(v.target)) && against.length > att.length / 2 && loser.idols > 0;
  eliminate(s, loser, `voted out`);
  const fmt = (tt: Record<string, number>) => { const e = Object.entries(tt).sort((a, b) => b[1] - a[1]); return `${e.map(([, n]) => n).join("-")} (${e.map(([k, n]) => `${nm(s, k)}: ${n}`).join(", ")})`; };
  const vc = revote?.length && tied.length > 1 ? `${fmt(firstTally)} · Revote: ${Object.keys(tally(revote)).length ? fmt(tally(revote)) : "deadlocked"}${rocks ? " · Rocks" : ""}` : fmt(t);
  log(s, {
    kind: "tribal", title: `Tribal Council — ${tname}`,
    text: `${loser.name} has been ${rocks ? "eliminated by drawing the wrong rock" : "voted out"}${loser.juror ? " and becomes a member of the jury" : ""}. ${blindside ? "A massive blindside — with an idol in their pocket!" : ""} The tribe has spoken.`,
    details: [`Final count: ${vc}`, ...details, ...(loser.betrayedBy.length ? [`${loser.name} feels betrayed by ${[...new Set(loser.betrayedBy)].map((x) => nm(s, x)).join(", ")}.`] : [])],
    votes, revote,
  });
  s.immune = [];
}

function eliminate(s: GameState, c: Castaway, _how: string) {
  const left = alive(s).length;
  c.out = true; c.placement = left;
  c.juror = left <= s.config.finalSize + s.config.jurySize;
  s.alliances.forEach((a) => (a.members = a.members.filter((m) => m !== c.id)));
  s.alliances = s.alliances.filter((a) => a.members.length >= 2);
  c.idols = 0;
  c.advantages = [];
}

function afterTribal(s: GameState) {
  if (s.tribalQueue?.length) {
    s.tribalTribes = s.tribalQueue.shift(); s.tribalTribe = s.tribalTribes[0];
    s.phase = "tribal"; return;
  }
  if (s.doubleElim) {
    s.doubleElim = false;
    const ms = alive(s);
    if (s.merged && ms.length >= s.config.finalSize + 2) {
      const ch = pickChallenge(s);
      const ir = ms.map((c) => ({ c, sc: indScore(c, ch.type) })).sort((a, b) => b.sc - a.sc);
      ir[0].c.immunityWins++; s.immune = [ir[0].c.id];
      log(s, { kind: "challenge", title: `Second Immunity: ${ch.name} (${STAT_LABEL[ch.type]})`, text: `No time to breathe — ${ir[0].c.name} wins the second immunity of the night!`, details: ir.map((x, i) => `${i + 1}. ${x.c.name} — ${x.sc.toFixed(2)}`) });
      s.phase = "tribal"; return;
    }
  }
  const n = alive(s).length;
  s.episodes.push({ n: s.episodes.length + 1, title: freshTitle(s), entries: [] });
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
  const tids = [...new Set(alive(s).map((c) => c.tribeId))];
  if (s.config.swapTribe && tids.length === 2) {
    const third = { ...s.config.swapTribe };
    s.tribes.push(third);
    tids.push(third.id);
    s.hiddenIdols[third.id] = 1;
  }
  shuffle(alive(s)).forEach((c, i) => (c.tribeId = tids[i % tids.length]));
  const details = tids.map((tid) => `${tribeOf(s, tid)!.name}: ${alive(s).filter((c) => c.tribeId === tid).map((c) => c.name).join(", ")}`);
  for (const tid of Object.keys(s.hiddenIdols)) s.hiddenIdols[tid] = Math.max(1, s.hiddenIdols[tid]);
  log(s, { kind: "twist", title: "Drop Your Buffs! Tribe Swap", text: "The castaways are shocked as Jeff announces a tribe swap. Loyalties will be tested.", details });
}

function doMerge(s: GameState) {
  s.merged = true;
  const t: Tribe = { id: "merged", name: s.config.mergedName, color: s.config.mergedColor };
  if (!s.tribes.some((x) => x.id === "merged")) s.tribes.push(t);
  alive(s).forEach((c) => (c.tribeId = "merged"));
  s.hiddenIdols.merged = 1;
  log(s, { kind: "twist", title: `The Merge — ${t.name}`, text: `The ${alive(s).length} remaining castaways merge into a single tribe, ${t.name}. It's now an individual game.`, details: [`Remaining: ${alive(s).map((c) => c.name).join(", ")}`, `Jury of ${s.config.jurySize} begins soon.`] });
}

// ---------- finale ----------
const isFireFinal = (s: GameState) => s.config.finalSize === 3 && s.config.fireAtF4 && alive(s).length === 4;
function doFinalChallenge(s: GameState) {
  const ms = alive(s); const ch = pickChallenge(s);
  const ir = ms.map((c) => ({ c, sc: indScore(c, ch.type) + c.stats.endurance * 0.3 })).sort((a, b) => b.sc - a.sc);
  const w = ir[0].c; w.immunityWins++; s.finalImmune = w.id;
  log(s, { kind: "finale", title: `Final Immunity Challenge: ${ch.name}`, text: `${w.name} wins the final immunity challenge and a guaranteed seat at Final Tribal Council!`, details: ir.map((x, i) => `${i + 1}. ${x.c.name} — ${x.sc.toFixed(2)}`) });
}

function doFinalChoice(s: GameState, d: Decision) {
  const ms = alive(s); const w = byId(s, s.finalImmune!);
  const others = ms.filter((c) => c.id !== w.id);
  const mine = w.id === s.config.controlledId && others.some((c) => c.id === d.cut) ? byId(s, d.cut!) : null;
  const pickCut = () => (w.id === s.config.controlledId && d.cut ? byId(s, d.cut) : [...others].sort((a, b) => (threat(b) - getRel(s, w.id, b.id) * 0.1) - (threat(a) - getRel(s, w.id, a.id) * 0.1))[0]);
  if (isFireFinal(s)) {
    const safe = mine ?? [...others].sort((a, b) => getRel(s, w.id, b.id) - getRel(s, w.id, a.id))[0];
    const fire = others.filter((c) => c.id !== safe.id);
    const fs = fire.map((c) => ({ c, sc: c.stats.endurance * 0.6 + c.stats.mental * 0.4 + r() * 4 })).sort((a, b) => b.sc - a.sc);
    eliminate(s, fs[1].c, "fire");
    log(s, { kind: "finale", title: "Forced Fire-Making Challenge", text: `${w.name} takes ${safe.name} to the end. ${fs[0].c.name} and ${fs[1].c.name} battle at fire-making... ${fs[0].c.name}'s flame burns through the rope! ${fs[1].c.name} becomes the final juror.`, details: fs.map((x) => `${x.c.name} — ${x.sc.toFixed(2)}`) });
  } else {
    const cut = pickCut();
    eliminate(s, cut, "cut");
    for (const o of others) if (o.id !== cut.id) addRel(s, w.id, o.id, 2);
    log(s, { kind: "finale", title: "Final Tribal Vote", text: `With the sole vote, ${w.name} votes out ${cut.name}${cut.juror ? ", who becomes the final juror" : ""}.`, votes: [{ voter: w.id, target: cut.id }] });
  }
  s.finalists = alive(s).map((c) => c.id);
}

function doFTC(s: GameState) {
  const fin = s.finalists!.map((id) => byId(s, id));
  const jury = s.castaways.filter((c) => c.juror);
  const qa: string[] = [];
  for (const j of jury) {
    const f = pick(fin);
    if (j.betrayedBy.includes(f.id)) qa.push(`${j.name} → ${f.name}: "You looked me in the eye and lied. Why should I reward that?"`);
    else if (j.stats.strategy >= 4) qa.push(`${j.name} → ${f.name}: "Name one big move that was yours and yours alone."`);
    else if (j.stats.temperament <= 2) qa.push(`${j.name} → ${f.name}: "I'm not asking a question. I'm just telling you how angry I am."`);
    else qa.push(`${j.name} → ${f.name}: "Tell me something real about yourself that you hid out here."`);
  }
  log(s, { kind: "finale", title: `Final Tribal Council — Day ${s.day}`, text: `${fin.map((f) => f.name).join(", ")} face the jury of ${jury.length}.`, details: qa });
  s.juryVotes = jury.map((j) => {
    const scored = fin.map((f) => {
      const relT = getRel(s, j.id, f.id) * 0.09, strat = f.stats.strategy * 0.55 + f.immunityWins * 0.35, soc = f.stats.social * 0.7;
      const bitter = j.betrayedBy.includes(f.id) ? -(1 + (6 - j.stats.temperament) * 0.6) : 0;
      return { f, sc: relT + strat + soc + bitter + r() * 1.5, parts: { relT, strat, soc, bitter } };
    }).sort((a, b) => b.sc - a.sc);
    const best = scored[0]; const p = best.parts;
    const top = Math.max(p.relT, p.strat, p.soc);
    const reason = top === p.strat ? "respected their strategic game" : top === p.soc ? "valued their social game" : "had a strong personal bond";
    return { juror: j.id, finalist: best.f.id, reason: `${reason}${scored.some((x) => x.parts.bitter < 0) ? " (bitter toward a betrayer)" : ""}` };
  });
  const counts: Record<string, number> = {};
  s.juryVotes.forEach((v) => (counts[v.finalist] = (counts[v.finalist] ?? 0) + 1));
  const sorted = fin.sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || threat(b) - threat(a));
  s.winner = sorted[0].id;
  log(s, { kind: "finale", title: "The Reunion — Sole Survivor", text: `${sorted[0].name} wins Survivor by a vote of ${fin.map((f) => counts[f.id] ?? 0).sort((a, b) => b - a).join("-")}!`, details: s.juryVotes.map((v) => `${nm(s, v.juror)} voted for ${nm(s, v.finalist)} — ${v.reason}`), votes: s.juryVotes.map((v) => ({ voter: v.juror, target: v.finalist })) });
}
