import { afterEach, describe, expect, it, vi } from "vitest";
import { alive, makeRoster, newGame, step, tribalTargets, type GameState } from "./engine";

afterEach(() => vi.restoreAllMocks());
function seedRandom(seed: number) {
  let state = seed;
  vi.spyOn(Math, "random").mockImplementation(() => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  });
}
function season(): GameState {
  return newGame({ playerCount: 20, tribeCount: 2, jurySize: 8, finalSize: 3,
    fireAtF4: true, swapEnabled: false, swapAt: 16, mergeAt: 12,
    mergedName: "Test", mergedColor: "#123456", controlledId: null,
    shotInTheDark: false, doubleTribals: false, jointTribals: false },
  [{ id: "t0", name: "First", color: "#123456" }, { id: "t1", name: "Second", color: "#654321" }],
  makeRoster(20, 2).map((c, i) => ({ ...c, name: c.name ?? `Player ${i + 1}` })));
}

describe("coordinated Tribal votes and larger alliances", () => {
  it("keeps most premerge and merge tallies on at most two targets, while allowing occasional scattered votes and deliberate splits", () => {
    const rounds: [number, number] = [0, 0], scattered: [number, number] = [0, 0];
    let splits = 0;
    for (let seed = 1; seed <= 60; seed++) {
      seedRandom(seed);
      let g = season();
      for (let i = 0; g.phase !== "done" && i < 300; i++) {
        const before = g.episodes.flatMap((e) => e.entries).filter((e) => e.kind === "tribal").length;
        const stage = g.merged ? 1 : 0;
        g = step(g);
        for (const entry of g.episodes.flatMap((e) => e.entries).filter((e) => e.kind === "tribal").slice(before)) {
          rounds[stage] += 1;
          if (new Set(entry.votes?.map((v) => v.target)).size > 2) scattered[stage] += 1;
          if (entry.details?.some((d) => d.includes("splits their votes"))) splits += 1;
        }
      }
      expect(g.phase).toBe("done");
    }
    for (const stage of [0, 1] as const) {
      expect(rounds[stage]).toBeGreaterThan(100);
      expect(scattered[stage] / rounds[stage]).toBeLessThan(0.3);
    }
    expect(scattered[0] + scattered[1]).toBeGreaterThan(0);
    expect(splits).toBeGreaterThan(0);
    console.log({ rounds, scattered, splits });
  });

  it("forms five-plus-member alliances regularly without removing smaller partnerships", () => {
    let largeSeasons = 0, smallSeasons = 0;
    for (let seed = 1; seed <= 40; seed++) {
      seedRandom(seed);
      let g = season(), large = false, small = false;
      for (let round = 0; round < 3; round++) {
        g = step(g);
        large ||= g.alliances.some((a) => a.members.length >= 5);
        small ||= g.alliances.some((a) => a.members.length <= 4);
        while (g.phase !== "camp" && g.phase !== "done") g = step(g);
      }
      if (large) largeSeasons++;
      if (small) smallSeasons++;
    }
    expect(largeSeasons).toBeGreaterThanOrEqual(20);
    expect(smallSeasons).toBeGreaterThanOrEqual(20);
  });

  it("keeps preview targets on the shared slate and preserves an explicit player vote outside it", () => {
    seedRandom(93);
    const g = season();
    g.config.controlledId = "c0";
    g.phase = "tribal"; g.tribalTribe = "t0";
    g.alliances = [
      { id: "a", name: "A", members: ["c0", "c2", "c4"] },
      { id: "b", name: "B", members: ["c6", "c8", "c10"] },
      { id: "c", name: "C", members: ["c12", "c14", "c16"] },
    ];
    const preview = tribalTargets(g);
    const targets = new Set(preview.individual.map((p) => p.target));
    expect(targets.size).toBeLessThanOrEqual(2);
    const chosen = alive(g).find((c) => c.tribeId === "t0" && c.id !== "c0" && !targets.has(c.id));
    if (!chosen) throw new Error("Missing off-slate candidate");
    const result = step(g, { vote: chosen.id });
    const votes = result.episodes.flatMap((e) => e.entries).find((e) => e.kind === "tribal")?.votes;
    expect(votes?.find((v) => v.voter === "c0")?.target).toBe(chosen.id);
  });
});