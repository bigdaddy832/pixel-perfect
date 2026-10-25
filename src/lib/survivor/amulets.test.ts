import { afterEach, describe, expect, it, vi } from "vitest";
import { alive, amuletHolders, makeRoster, newGame, pendingDecision, simulateToEnd, step, type GameState } from "./engine";

function season(tribeCount = 3) {
  return newGame({ playerCount: 18, tribeCount, jurySize: 8, finalSize: 3, fireAtF4: true, swapEnabled: false, swapAt: 15, mergeAt: 12, mergedName: "Velunara", mergedColor: "#123abc", controlledId: "c0", bewareAdvantages: true, jointTribals: false, doubleTribals: false }, Array.from({ length: tribeCount }, (_, i) => ({ id: `t${i}`, name: `Tribe ${i}`, color: "#123abc" })), makeRoster(18, tribeCount).map((c, i) => ({ ...c, name: c.name ?? `Player ${i}` })));
}
const entries = (s: GameState) => s.episodes.flatMap((e) => e.entries);
function tribalWithHolders(n: number) {
  const s = season();
  s.merged = true; s.phase = "tribal"; s.tribalTribe = "t0"; s.amuletsGiven = true; s.amuletStages = [3];
  s.castaways.forEach((c, i) => { c.tribeId = "t0"; c.amulet = i < n; c.out = i >= 8; });
  return s;
}
afterEach(() => vi.restoreAllMocks());

describe("Beware and Advantage Amulets", () => {
  it("awards one first-reward volunteer per tribe in a three-tribe season, only once", () => {
    const n = 3;
    const s = season(n); s.phase = "challenge";
    const result = step(s);
    expect(amuletHolders(result)).toHaveLength(n);
    expect(new Set(amuletHolders(result).map((c) => c.tribeId)).size).toBe(n);
    expect(entries(result).filter((e) => e.title.startsWith("Advantage Amulet:"))).toHaveLength(1);
    result.phase = "challenge";
    expect(entries(step(result)).filter((e) => e.title === "First Reward: Amulet Volunteers")).toHaveLength(1);
  });

  it.each([2, 4])("does not award amulets in a %s-starting-tribe season", (n) => {
    const s = season(n); s.phase = "challenge";
    // Even a later three-tribe stage must not enable this twist.
    if (n === 2) s.castaways.forEach((c, i) => { c.tribeId = `t${i % 3}`; });
    const result = step(s);
    expect(amuletHolders(result)).toHaveLength(0);
    expect(result.amuletsGiven).not.toBe(true);
  });

  it("requires all holders at Tribal Council", () => {
    const s = tribalWithHolders(3);
    const other = s.castaways[1];
    if (!other) throw new Error("Missing holder");
    other.tribeId = "t1";
    expect(pendingDecision(s)).toMatchObject({ canPlayAmulet: false });
    const result = step(s, { playAmulet: true });
    expect(result.amuletsConsumed).not.toBe(true);
  });

  it.each([3, 2, 1])("plays the %s-holder power and spends every amulet", (n) => {
    const s = tribalWithHolders(n);
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const result = step(s, { playAmulet: true, amuletTarget: n === 1 ? "c0" : "c7", vote: "c7" });
    const tribal = entries(result).find((e) => e.kind === "tribal");
    expect(result.amuletsConsumed).toBe(true);
    expect(amuletHolders(result)).toHaveLength(0);
    expect(tribal?.details?.some((d) => d.includes("Advantage Amulets together"))).toBe(true);
    if (n > 1) expect(tribal?.votes?.filter((v) => v.voter === "c0")).toHaveLength(2);
    if (n === 2) expect(tribal?.votes?.some((v) => v.voter === "c7")).toBe(false);
    if (n === 1) { expect(result.castaways[0]?.out).toBe(false); expect(tribal?.votes?.filter((v) => v.target === "c0").every((v) => v.nullified)).toBe(true); }
  });

  it("announces three, two, and one holders once each after eliminations", () => {
    let s = tribalWithHolders(3);
    s.amuletStages = [];
    // Initial award note is produced by the first reward.
    const start = season(); start.phase = "challenge";
    const awarded = step(start);
    s.episodes = awarded.episodes; s.amuletStages = [3];
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    for (const target of ["c2", "c1", "c3"]) {
      s.phase = "tribal"; s.tribalTribe = "t0"; s.tribalTribes = ["t0"];
      for (const c of alive(s)) { s.rel[[c.id, target].sort().join("|")] = -50; }
      s = step(s, { vote: target });
      expect(s.castaways.find((c) => c.id === target)?.out).toBe(true);
    }
    expect(s.amuletStages).toEqual([3, 2, 1]);
    expect(entries(s).filter((e) => e.title.startsWith("Advantage Amulet:"))).toHaveLength(3);
  });

  it("expires after final six", () => {
    const s = tribalWithHolders(1);
    s.castaways.slice(5).forEach((c) => { c.out = true; });
    expect(pendingDecision(s)).toMatchObject({ canPlayAmulet: false });
    expect(step(s, { playAmulet: true, amuletTarget: "c0" }).amuletsConsumed).not.toBe(true);
  });

  it("limits Beware discoveries across AI and player searches, including older saved logs", () => {
    const s = season(); s.config.controlledId = null;
    vi.spyOn(Math, "random").mockReturnValue(0.08);
    const result = step(s);
    expect(entries(result).filter((e) => e.title.includes("Beware Advantage"))).toHaveLength(1);
    expect(result.bewareFound).toBe(true);
    delete result.bewareFound; result.config.controlledId = "c0";
    const player = result.castaways[0];
    if (!player) throw new Error("Missing player");
    player.idols = 0; result.hiddenIdols['t0'] = 1; result.phase = "camp";
    const later = step(result, { searchIdol: true });
    expect(entries(later).filter((e) => e.title.includes("Beware Advantage"))).toHaveLength(1);
  });

  it("finishes varied seasons without duplicate stage notes or Beware discoveries", () => {
    for (let i = 0; i < 30; i++) {
      const result = simulateToEnd(season(i % 3 + 2));
      expect(result.phase).toBe("done");
      expect(entries(result).filter((e) => e.title.includes("Beware Advantage")).length).toBeLessThanOrEqual(1);
      const notes = entries(result).filter((e) => e.title.startsWith("Advantage Amulet:"));
      expect(new Set(notes.map((e) => e.title)).size).toBe(notes.length);
      expect(notes.length).toBeLessThanOrEqual(i % 3 + 2 === 3 ? 3 : 0);
    }
  });
});