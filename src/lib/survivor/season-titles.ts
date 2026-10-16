// Original season locations and themes (none used by the real show). A title is never reused.
export const SEASON_PLACES = [
  "Emberreach", "Coral Vesta", "Isla Thornwake", "Saltmoor", "Kalivora", "Driftmark", "Tavuna Reef", "Obsidian Cay",
  "Mirelune", "Sunhollow", "Velatu Atoll", "Brackenfall", "Isla Quorra", "Lumeshore", "Tidecrest", "Nalimar",
  "Ashveil Keys", "Pelorin", "Stormhaven Bay", "Corvanta", "Isla Brisa Negra", "Wyndral", "Ondeluma", "Sablecove",
];
export const SEASON_THEMES = [
  "Sparks vs. Embers", "Dreamers vs. Doers", "Rookies vs. Renegades", "Salt & Smoke", "Hidden Currents", "Fault Lines",
  "The Long Con", "Thunder & Tide", "Schemers vs. Steady Hands", "Night Owls vs. Early Birds", "Lone Wolves", "Fool's Gold",
  "Wildfire", "Undertow", "Gamblers vs. Guardians", "Quiet Storm", "Paper Crowns", "Moon & Machete",
  "Builders vs. Breakers", "Second Wind", "Crosswinds", "Smoke Signals", "Daredevils vs. Diplomats", "The Gilded Rope",
];
export const USED_TITLES_KEY = "survivor-sim-used-season-titles-v1";

export function readUsedTitles(): string[] {
  try { const v: unknown = JSON.parse(localStorage.getItem(USED_TITLES_KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []; } catch { return []; }
}
export function markTitleUsed(title: string) {
  try { const u = readUsedTitles(); if (!u.includes(title)) localStorage.setItem(USED_TITLES_KEY, JSON.stringify([...u, title])); } catch { /* storage blocked */ }
}
/** Random unused "Survivor: Place — Theme" title; falls back to a numbered variant once every combo is spent. */
export function randomSeasonTitle(used: string[], rand: () => number = Math.random): string {
  const usedSet = new Set(used.map((t) => t.toLowerCase()));
  const all: string[] = [];
  for (const p of SEASON_PLACES) for (const t of SEASON_THEMES) all.push(`Survivor: ${p} — ${t}`);
  const free = all.filter((t) => !usedSet.has(t.toLowerCase()));
  if (free.length) return free[Math.floor(rand() * free.length)]!;
  for (let n = 2; ; n++) { const t = `${all[Math.floor(rand() * all.length)]} ${n}`; if (!usedSet.has(t.toLowerCase())) return t; }
}
