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
  it("keeps eligible revote ballots on their original target instead of randomly changing sides", () => {
    let checked = 0;
    for (let seed = 1; seed <= 100; seed++) {
      seedRandom(seed);
      const g = season();
      g.phase = "tribal"; g.tribalTribe = "t0";
      g.castaways.forEach((c) => { c.idols = 0; c.advantages = []; c.shotUsed = true; });
      const result = step(g);
      const entry = result.episodes.flatMap((e) => e.entries).find((e) => e.kind === "tribal");
      if (!entry?.revote) continue;
      const counts: Record<string, number> = {};
      entry.votes?.forEach((v) => { if (!v.nullified) counts[v.target] = (counts[v.target] ?? 0) + 1; });
      const highest = Math.max(...Object.values(counts));
      const tied = Object.keys(counts).filter((id) => counts[id] === highest);
      for (const ballot of entry.revote) {
        const old = entry.votes?.find((v) => v.voter === ballot.voter);
        if (!old) throw new Error("Missing initial ballot");
        if (!tied.includes(old.target)) continue;
        expect(ballot.target).toBe(old.target);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("an idol only negates its existing ballots and cannot redirect the other side's votes", () => {
    let checked = 0;
    for (let seed = 1; seed <= 40; seed++) {
      seedRandom(seed);
      const g = season();
      g.phase = "tribal"; g.tribalTribe = "t0"; g.config.controlledId = "c0";
      g.castaways.forEach((c) => { c.idols = 0; c.advantages = []; c.shotUsed = true; });
      const me = g.castaways.find((c) => c.id === "c0");
      if (!me) throw new Error("Missing idol holder");
      me.idols = 1; me.idolOrigins = ["t0"];
      const result = step(g, { idol: "c0", vote: "c2" });
      const entry = result.episodes.flatMap((e) => e.entries).find((e) => e.kind === "tribal");
      if (!entry) throw new Error("Missing Tribal");
      expect(entry.votes?.filter((v) => v.target === "c0").every((v) => v.nullified)).toBe(true);
      if (entry.votes?.some((v) => v.target === "c0")) checked++;
      if (!entry.revote) expect(entry.out).not.toBe("c0");
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("records who changed from the displayed plan instead of silently introducing a new target", () => {
    let changed = 0;
    for (let seed = 1; seed <= 40; seed++) {
      seedRandom(seed);
      const g = season(); g.phase = "tribal"; g.tribalTribe = "t0";
      const plans = tribalTargets(g).individual;
      const result = step(g);
      const entry = result.episodes.flatMap((e) => e.entries).find((e) => e.kind === "tribal");
      if (!entry) throw new Error("Missing Tribal");
      for (const ballot of entry.votes ?? []) {
        const plan = plans.find((p) => p.voter === ballot.voter);
        if (!plan || plan.target === ballot.target) continue;
        const voter = g.castaways.find((c) => c.id === ballot.voter);
        if (!voter) throw new Error("Missing voter");
        expect(entry.details?.some((line) => line.startsWith(`${voter.name} changes from `))).toBe(true);
        changed++;
      }
    }
    expect(changed).toBeGreaterThan(0);
  });

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
  }, 120000);

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