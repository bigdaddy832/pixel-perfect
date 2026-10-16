import { describe, expect, it } from "vitest";
import { makeRoster, newGame, simulateToEnd, step, TRIBE_COLORS, TRIBE_NAMES } from "./engine";
import { randomSeasonTitle, SEASON_PLACES, SEASON_THEMES, REAL_SEASON_NAMES } from "./season-titles";
const season = () => newGame({ playerCount: 16, tribeCount: 2, jurySize: 7, finalSize: 3, fireAtF4: true, swapEnabled: false, swapAt: 12, mergeAt: 10, mergedName: "M", mergedColor: "#123456", controlledId: "c0" },
  [0, 1].map((i) => ({ id: `t${i}`, name: TRIBE_NAMES[i] ?? "A", color: TRIBE_COLORS[i] ?? "#123456" })), makeRoster(16, 2).map((c, i) => ({ ...c, name: c.name ?? `P${i}` })));
describe("social features", () => {
  it("logs conversations that change relationships", () => {
    const g = season(); const other = g.castaways.find((c) => c.id !== "c0" && c.tribeId === "t0")!;
    const res = step(g, { talks: [{ with: other.id, topic: "personal" }] });
    expect(res.episodes.flatMap((e) => e.entries).some((e) => e.title.startsWith(`Conversation with ${other.name}`))).toBe(true);
  });
  it("produces ponderosa logs, superlatives, splits and live tribals", () => {
    let pond = 0, sups = 0, live = 0, split = 0;
    for (let i = 0; i < 40; i++) {
      const es = simulateToEnd(season()).episodes.flatMap((e) => e.entries);
      pond += es.filter((e) => e.kind === "jury").length; sups += es.filter((e) => e.title === "Season Superlatives").length;
      live += es.filter((e) => e.details?.some((d) => d.startsWith("Live Tribal"))).length; split += es.filter((e) => e.details?.some((d) => d.includes("splits their votes"))).length;
    }
    expect(pond).toBeGreaterThan(0); expect(sups).toBe(40); expect(live).toBeGreaterThan(0); expect(split).toBeGreaterThan(0);
  });
  it("never repeats season titles", () => {
    const used: string[] = []; for (let i = 0; i < 700; i++) { const t = randomSeasonTitle(used); expect(t).not.toContain("—"); expect(used).not.toContain(t); used.push(t); }
  });
  it("uses real locations and original themes, never a real Survivor season name", () => {
    const real = new Set(REAL_SEASON_NAMES.map((n) => n.toLowerCase()));
    for (const p of [...SEASON_PLACES, ...SEASON_THEMES]) expect(real.has(p.toLowerCase()), `collides with a real Survivor season name: ${p}`).toBe(false);
    // Places are drawn from a real-world pool (spot-check a few well-known real places).
    for (const p of ["Bora Bora", "Seychelles", "Sicily", "Antigua"]) expect(SEASON_PLACES).toContain(p);
  });
});
