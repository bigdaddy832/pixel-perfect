// Season titles follow the show's "Survivor: Location — Theme" format.
// Locations are REAL places (islands, countries, seas) — but never one that
// already served as a real Survivor season name. Themes are original,
// twist-style coined names (like "Elimination Island") — never a real
// Survivor season name or twist name. A full title is never reused.
export const SEASON_PLACES = [
  "Bora Bora", "Tahiti", "Moorea", "Raiatea", "Huahine", "Tuvalu", "Palawan", "Cebu",
  "Okinawa", "Halmahera", "Komodo", "Langkawi", "Sri Lanka", "Andaman Islands", "Maldives", "Seychelles",
  "Mauritius", "Madagascar", "Zanzibar", "São Tomé", "Cape Verde", "Madeira", "Azores", "Canary Islands",
  "Sardinia", "Corsica", "Sicily", "Crete", "Antigua", "Dominica", "Grenada", "St. Lucia",
  "Roatán", "Cozumel", "Grand Cayman", "Aruba", "Curaçao", "Bonaire", "Yasawa Islands", "Taveuni",
  "Guadalcanal", "Solomon Islands", "New Britain", "Palawan Reef", "Bohol", "Siargao", "Ko Lanta", "Bako",
];
export const SEASON_THEMES = [
  "Elimination Island", "Isolation Isle", "Snake Pit", "Judgement Rock", "Skull Cove", "Mutiny Bay",
  "Treachery Shoals", "The Empty Throne", "Sudden Death", "Last Tribe Standing", "Burn the Boats",
  "No Safe Harbor", "The Burning Tide", "Fire & Fate", "Duel Isle", "Crossfire Cove", "The Reckoning",
  "War Paint", "The Wreckage", "Torched", "Tidal Wrath", "The Long Drop", "Ash & Bone", "Dead Water",
  "Cursed Lagoon", "The Phantom Isle", "Castaway Crucible", "The Verdict", "Doomsday Reef", "The Bone Yard",
  "The Last Stand", "Snake & Dagger",
];
/** Real Survivor (US) season names — these can never appear as a place or theme. */
export const REAL_SEASON_NAMES = [
  "Borneo", "The Australian Outback", "Africa", "Marquesas", "Thailand", "Amazon", "Pearl Islands",
  "Vanuatu", "Palau", "Guatemala", "Panama", "Cook Islands", "Fiji", "China", "Micronesia", "Gabon",
  "Tocantins", "Samoa", "Nicaragua", "Redemption Island", "South Pacific", "One World", "Philippines",
  "Caramoan", "Blood vs. Water", "Cagayan", "San Juan del Sur", "Worlds Apart", "Cambodia",
  "Kaôh Rōng", "Millennials vs. Gen X", "Game Changers", "Ghost Island", "David vs. Goliath",
  "Edge of Extinction", "Island of the Idols", "Winners at War", "Heroes vs. Villains",
  "Fans vs. Favorites", "Exile Island", "New Beginnings", "Hero Duel", "Second Chance",
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
