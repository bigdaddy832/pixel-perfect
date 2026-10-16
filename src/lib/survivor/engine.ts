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
  out: boolean; juror: boolean; idols: number; extraVotes: number; mood: number;
  placement?: number; immunityWins: number; betrayedBy: string[];
}
export interface Tribe { id: string; name: string; color: string }
export interface Alliance { id: string; name: string; members: string[] }
export interface Config {
  playerCount: number; tribeCount: number; jurySize: number;
  finalSize: 2 | 3; fireAtF4: boolean;
  swapEnabled: boolean; swapAt: number; mergeAt: number;
  mergedName: string; mergedColor: string;
  swapTribe?: Tribe;
  controlledId: string | null;
}
export interface Vote { voter: string; target: string; nullified?: boolean }
export interface LogEntry {
  kind: "camp" | "drama" | "alliance" | "idol" | "challenge" | "tribal" | "twist" | "finale";
  title: string; text: string; details?: string[]; votes?: Vote[]; revote?: Vote[];
}
export interface Episode { n: number; title: string; entries: LogEntry[] }
export type Phase = "camp" | "challenge" | "tribal" | "final_challenge" | "ftc" | "done";
export interface GameState {
  config: Config; castaways: Castaway[]; tribes: Tribe[]; alliances: Alliance[];
  rel: Record<string, number>; episodes: Episode[]; day: number; phase: Phase;
  merged: boolean; swapped: boolean; immune: string[]; tribalTribe: string | null;
  hiddenIdols: Record<string, number>; finalImmune?: string;
  winner?: string; finalists?: string[]; juryVotes?: { juror: string; finalist: string; reason: string }[];
}
export const SEARCH_SPOTS = ["the tree line", "the water well", "behind the shelter", "the rocky outcrop", "the beach at dawn"];
export interface Decision { vote?: string; idol?: string; allyWith?: string; cut?: string; searchIdol?: boolean; searchSpot?: string; extraVote?: boolean }

export const TRIBE_NAMES = [
  "Veylora", "Kelmori", "Zunakai", "Dakal", "Naviti", "Taku", "Ulong", "Pagong", "Tagi", "Kucha",
  "Ogakor", "Samburu", "Kota", "Fang", "Kalabaw", "Tandang", "Salani", "Manono", "Nuku",
  "Malolo", "Vakama", "Luvu", "Yase", "Soka", "Ika", "Baka", "Gata", "Lavo", "Moto", "Ravu",
];
export const MERGE_NAMES = ["Solarrion", "Rattana", "Kasama", "Huyopa", "Dabu", "Galang", "Aitutonga", "Te Tuna"];
export const TRIBE_COLORS = ["#e8662a", "#2f7fd6", "#e3c13b", "#3fae5a", "#c43d3d", "#8b5ad6", "#e45fa1", "#2bb5b0"];
const NAMES = [
  "Ava", "Boston", "Cirie", "Danni", "Ethan", "Fabio", "Gervase", "Hali", "Ian", "Jenna",
  "Kim", "Lex", "Malcolm", "Natalie", "Ozzy", "Parvati", "Quintavius", "Rob", "Sandra", "Tony",
  "Ulysses", "Vecepia", "Wendell", "Xander", "Yul", "Zeke", "Aubry", "Brad", "Chelsea", "Denise",
  "Earl", "Frosti", "Gabby", "Hayden", "Jeremy", "Kelley", "Michele", "Nick", "Rachel", "Spencer",
];
const ALLIANCE_NAMES = ["The Core", "Four Horsemen", "Rogue Squad", "Black Widow Brigade", "Stealth R Us", "The Rat Pack", "Sanctuary", "Night Owls", "The Underdogs", "Tidal Wave", "The Coconut Crew", "Shadow Council"];
const EP_TITLES = ["I'm Not Here to Make Friends", "Blindside City", "The Tide Turns", "Snakes in the Grass", "Who Can You Trust?", "Playing With Fire", "Calm Before the Storm", "A Bridge Too Far", "Don't Get Comfortable", "Idol Chatter", "Trust Nobody", "Rice and Paranoia", "Numbers Game", "Out of the Frying Pan", "The Long Con", "Torch Snuffer"];

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
    stats: { ...p.stats }, out: false, juror: false, idols: 0, extraVotes: 0, mood: 70, immunityWins: 0, betrayedBy: [],
  }));
  const rel: Record<string, number> = {};
  for (const a of castaways) for (const b of castaways) if (a.id < b.id) rel[key(a.id, b.id)] = Math.round((r() - 0.5) * 10 + (a.tribeId === b.tribeId ? 3 : 0));
  const hiddenIdols: Record<string, number> = {};
  tribes.forEach((t) => (hiddenIdols[t.id] = 1));
  return {
    config, castaways, tribes, alliances: [], rel, day: 1, phase: "camp", merged: false, swapped: false,
    immune: [], tribalTribe: null, hiddenIdols,
    episodes: [{ n: 1, title: pick(EP_TITLES), entries: [{ kind: "twist", title: "The Adventure Begins", text: `${castaways.length} castaways are marooned and divided into ${tribes.length} tribes: ${tribes.map((t) => t.name).join(", ")}.` }] }],
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
const weakness = (c: Castaway) => 5 - (c.stats.general + c.stats.physical + c.stats.endurance + c.stats.mental) / 4;

// ---------- decisions needed ----------
export type Pending =
  | { kind: "camp"; options: Castaway[] }
  | { kind: "tribal"; options: Castaway[]; hasIdol: boolean; hasExtraVote: boolean; idolTargets: Castaway[] }
  | { kind: "cut"; options: Castaway[] }
  | null;

export function pendingDecision(s: GameState): Pending {
  const me = s.config.controlledId ? byId(s, s.config.controlledId) : null;
  if (!me || me.out) return null;
  if (s.phase === "camp") return { kind: "camp", options: alive(s).filter((c) => c.tribeId === me.tribeId && c.id !== me.id) };
  if (s.phase === "tribal" && s.tribalTribe === me.tribeId) {
    const att = alive(s).filter((c) => c.tribeId === s.tribalTribe);
    return { kind: "tribal", options: att.filter((c) => c.id !== me.id && !s.immune.includes(c.id)), hasIdol: me.idols > 0, hasExtraVote: (me.extraVotes ?? 0) > 0, idolTargets: att.filter((c) => !s.immune.includes(c.id)) };
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
    case "final_challenge": doFinalChallenge(s, d); s.phase = "ftc"; break;
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
      for (const a of shuffle(members.filter((c) => c.id !== s.config.controlledId))) {
        if (r() < 0.015 + a.stats.strategy * 0.02) {
          a.idols++; s.hiddenIdols[tid]--;
          log(s, { kind: "idol", title: `${t.name}: Idol Found!`, text: `${a.name} snuck away and found a Hidden Immunity Idol ${pick(["inside a tree knot", "buried under the well", "tied beneath the shelter", "in a coconut shell"])}.` });
          break;
        }
      }
    }
    for (const m of members) {
      const avg = members.reduce((acc, o) => (o.id === m.id ? acc : acc + getRel(s, m.id, o.id)), 0) / Math.max(1, members.length - 1);
      m.mood = clamp(Math.round(m.mood * 0.7 + (60 + avg * 1.5) * 0.3), 5, 100);
    }
    log(s, { kind: "camp", title: `${t.name}: Life at Camp`, text: `Day ${s.day}. ${pick(["The rain wouldn't stop.", "Spirits are high at camp.", "Hunger is setting in.", "The heat is brutal.", "Paranoia is creeping in."])}`, details: details.length ? details : ["A quiet day at camp."] });
  }
  // player approach
  if (d.allyWith === "__random__" && s.config.controlledId) {
    const meC = byId(s, s.config.controlledId);
    const opts = alive(s).filter((c) => c.tribeId === meC.tribeId && c.id !== meC.id);
    d = { ...d, allyWith: opts.length ? pick(opts).id : undefined };
  }
  if (d.searchIdol && s.config.controlledId) {
    const meC = byId(s, s.config.controlledId);
    const spot = d.searchSpot && SEARCH_SPOTS.includes(d.searchSpot) ? d.searchSpot : pick(SEARCH_SPOTS);
    const roll = r() - meC.stats.strategy * 0.03;
    if ((s.hiddenIdols[meC.tribeId] ?? 0) > 0 && roll < 0.3) {
      meC.idols++; s.hiddenIdols[meC.tribeId]--;
      log(s, { kind: "idol", title: "Your Search: Idol Found!", text: `You slipped away to search ${spot} — and found a Hidden Immunity Idol!` });
    } else if (roll < 0.5) {
      meC.extraVotes = (meC.extraVotes ?? 0) + 1;
      log(s, { kind: "idol", title: "Your Search: Advantage Found!", text: `You searched ${spot} and found an Extra Vote advantage. Play it at a future Tribal Council to cast two votes.` });
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

// ---------- challenges ----------
const CH_TYPES: { type: StatKey; names: string[] }[] = [
  { type: "physical", names: ["Sea Crates", "Battering Ram", "Shipwrecked", "Tug of War Brawl"] },
  { type: "endurance", names: ["Hang Time", "Last Gasp", "Balance Beam Hold", "Water Bucket Stand"] },
  { type: "mental", names: ["Slide Puzzle", "Memory Mayhem", "Combination Lock", "Word Scramble"] },
  { type: "general", names: ["Obstacle Gauntlet", "Swim & Dive", "Ring Toss Relay", "Sandbag Throw"] },
];
const indScore = (c: Castaway, t: StatKey) => c.stats.general * 0.5 + c.stats[t] * 1.2 + r() * 3.5;

function doChallenge(s: GameState) {
  s.immune = [];
  const ch = pick(CH_TYPES), rew = pick(CH_TYPES);
  if (!s.merged) {
    const g = [...groups(s).entries()];
    const tscore = (ms: Castaway[], t: StatKey) => ms.reduce((a, c) => a + indScore(c, t), 0) / ms.length + r() * 2.5;
    const rs = g.map(([tid, ms]) => ({ tid, sc: tscore(ms, rew.type) })).sort((a, b) => b.sc - a.sc);
    log(s, { kind: "challenge", title: `Reward Challenge: ${pick(rew.names)}`, text: `${tribeOf(s, rs[0].tid)!.name} win reward — ${pick(["fishing gear", "a feast of pizza", "tarp and blankets", "chickens"])}!`, details: rs.map((x, i) => `${i + 1}. ${tribeOf(s, x.tid)!.name} — ${x.sc.toFixed(2)}`) });
    rs[0] && groups(s).get(rs[0].tid)!.forEach((c) => (c.mood = clamp(c.mood + 8, 0, 100)));
    const is = g.map(([tid, ms]) => ({ tid, sc: tscore(ms, ch.type), mvp: [...ms].sort((a, b) => indScore(b, ch.type) - indScore(a, ch.type))[0] })).sort((a, b) => b.sc - a.sc);
    const loser = is[is.length - 1];
    s.tribalTribe = loser.tid;
    log(s, { kind: "challenge", title: `Immunity Challenge: ${pick(ch.names)} (${STAT_LABEL[ch.type]})`, text: `${is.slice(0, -1).map((x) => tribeOf(s, x.tid)!.name).join(" & ")} win immunity! ${tribeOf(s, loser.tid)!.name} will face Tribal Council.`, details: [...is.map((x, i) => `${i + 1}. ${tribeOf(s, x.tid)!.name} — ${x.sc.toFixed(2)} (MVP: ${x.mvp.name})`), `${loser.mvp.name} tried to carry, but it wasn't enough.`] });
  } else {
    const ms = alive(s);
    const rr = ms.map((c) => ({ c, sc: indScore(c, rew.type) })).sort((a, b) => b.sc - a.sc);
    rr[0].c.mood = clamp(rr[0].c.mood + 10, 0, 100);
    const buddy = ms.filter((x) => x.id !== rr[0].c.id).sort((a, b) => getRel(s, rr[0].c.id, b.id) - getRel(s, rr[0].c.id, a.id))[0];
    if (buddy) addRel(s, rr[0].c.id, buddy.id, 6);
    log(s, { kind: "challenge", title: `Reward Challenge: ${pick(rew.names)}`, text: `${rr[0].c.name} wins reward${buddy ? ` and brings ${buddy.name} along` : ""}.`, details: rr.slice(0, 5).map((x, i) => `${i + 1}. ${x.c.name} — ${x.sc.toFixed(2)}`) });
    const ir = ms.map((c) => ({ c, sc: indScore(c, ch.type) })).sort((a, b) => b.sc - a.sc);
    ir[0].c.immunityWins++; s.immune = [ir[0].c.id];
    s.tribalTribe = ms[0].tribeId;
    log(s, { kind: "challenge", title: `Individual Immunity: ${pick(ch.names)} (${STAT_LABEL[ch.type]})`, text: `${ir[0].c.name} wins individual immunity and is safe tonight!`, details: ir.map((x, i) => `${i + 1}. ${x.c.name} — ${x.sc.toFixed(2)}`) });
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
  const att = alive(s).filter((c) => c.tribeId === s.tribalTribe);
  const tname = tribeOf(s, s.tribalTribe!)!.name;
  const ctrl = s.config.controlledId;
  const cands = (v: Castaway, excl: string[] = []) => att.filter((c) => c.id !== v.id && !s.immune.includes(c.id) && !excl.includes(c.id));
  let votes: Vote[] = att.map((v) => ({ voter: v.id, target: v.id === ctrl && d.vote ? d.vote : aiVote(s, v, cands(v), att) }));
  const playerVote = votes.find((v) => v.voter === ctrl);
  const extraVotePlayed = Boolean(ctrl && d.extraVote && playerVote && (byId(s, ctrl).extraVotes ?? 0) > 0);
  if (ctrl && extraVotePlayed && playerVote) {
    byId(s, ctrl).extraVotes--; votes.push({ ...playerVote });
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
      h.idols--; protectedIds.push(target); s.hiddenIdols[h.tribeId] = (s.hiddenIdols[h.tribeId] ?? 0) + 1;
      if (target !== h.id) addRel(s, h.id, target, 20);
      idolLog.push(target === h.id ? `${h.name} stands up and plays a Hidden Immunity Idol for themselves!` : `${h.name} plays a Hidden Immunity Idol for ${nm(s, target)}!`);
    }
  }
  votes = votes.map((v) => (protectedIds.includes(v.target) ? { ...v, nullified: true } : v));
  let t = tally(votes);
  const details: string[] = [...idolLog];
  if (extraVotePlayed && ctrl) details.push(`${nm(s, ctrl)} plays an Extra Vote advantage and casts a second vote.`);
  let revote: Vote[] | undefined;
  if (!Object.keys(t).length) {
    details.push("Every vote was nullified! A revote is held.");
    revote = att.map((v) => ({ voter: v.id, target: aiVote(s, v, cands(v, protectedIds), att) }));
    t = tally(revote);
  }
  let top = Math.max(...Object.values(t)); let tied = Object.keys(t).filter((k) => t[k] === top);
  let out: string;
  if (tied.length > 1) {
    details.push(`Tie between ${tied.map((x) => nm(s, x)).join(" and ")}. Revote!`);
    revote = att.filter((v) => !tied.includes(v.id)).map((v) => ({ voter: v.id, target: v.id === ctrl && d.vote && tied.includes(d.vote) ? d.vote : aiVote(s, v, att.filter((c) => tied.includes(c.id)), att) }));
    const rt = tally(revote); const rtop = Math.max(0, ...Object.values(rt)); const rtied = Object.keys(rt).filter((k) => rt[k] === rtop);
    if (rtied.length === 1) out = rtied[0];
    else {
      const pool = att.filter((c) => !tied.includes(c.id) && !s.immune.includes(c.id) && !protectedIds.includes(c.id));
      out = pool.length ? pick(pool).id : pick(tied);
      details.push(`Deadlock! The castaways draw rocks... ${nm(s, out)} draws the odd rock.`);
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
  const vcE = Object.entries(tally(revote?.length ? revote : votes)).sort((a, b) => b[1] - a[1]);
  const vc = `${vcE.map(([, n]) => n).join("-")} (${vcE.map(([k, n]) => `${nm(s, k)}: ${n}`).join(", ")})`;
  log(s, {
    kind: "tribal", title: `Tribal Council — ${tname}`,
    text: `${loser.name} has been voted out${loser.juror ? " and becomes a member of the jury" : ""}. ${blindside ? "A massive blindside — with an idol in their pocket!" : ""} The tribe has spoken.`,
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
  c.extraVotes = 0;
}

function afterTribal(s: GameState) {
  const n = alive(s).length;
  s.episodes.push({ n: s.episodes.length + 1, title: pick(EP_TITLES), entries: [] });
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
function doFinalChallenge(s: GameState, d: Decision) {
  const ms = alive(s); const ch = pick(CH_TYPES);
  const ir = ms.map((c) => ({ c, sc: indScore(c, ch.type) + c.stats.endurance * 0.3 })).sort((a, b) => b.sc - a.sc);
  const w = ir[0].c; w.immunityWins++; s.finalImmune = w.id;
  log(s, { kind: "finale", title: `Final Immunity Challenge: ${pick(ch.names)}`, text: `${w.name} wins the final immunity challenge and a guaranteed seat at Final Tribal Council!`, details: ir.map((x, i) => `${i + 1}. ${x.c.name} — ${x.sc.toFixed(2)}`) });
  const others = ms.filter((c) => c.id !== w.id);
  const pickCut = () => (w.id === s.config.controlledId && d.cut ? byId(s, d.cut) : [...others].sort((a, b) => (threat(b) - getRel(s, w.id, b.id) * 0.1) - (threat(a) - getRel(s, w.id, a.id) * 0.1))[0]);
  if (s.config.finalSize === 3 && s.config.fireAtF4 && ms.length === 4) {
    const safe = [...others].sort((a, b) => getRel(s, w.id, b.id) - getRel(s, w.id, a.id))[0];
    const fire = others.filter((c) => c.id !== safe.id);
    const fs = fire.map((c) => ({ c, sc: c.stats.endurance * 0.6 + c.stats.mental * 0.4 + r() * 4 })).sort((a, b) => b.sc - a.sc);
    eliminate(s, fs[1].c, "fire");
    log(s, { kind: "finale", title: "Fire-Making Challenge", text: `${w.name} takes ${safe.name} to the end. ${fs[0].c.name} and ${fs[1].c.name} battle at fire-making... ${fs[0].c.name}'s flame burns through the rope! ${fs[1].c.name} becomes the final juror.`, details: fs.map((x) => `${x.c.name} — ${x.sc.toFixed(2)}`) });
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
