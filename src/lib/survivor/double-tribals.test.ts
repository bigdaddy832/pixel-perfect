import { afterEach, describe, expect, it, vi } from "vitest";
import { alive, makeRoster, newGame, step } from "./engine";

afterEach(() => vi.restoreAllMocks());

function challenge(tribeCount: number) {
  const s = newGame({
    playerCount: 18, tribeCount, jurySize: 8, finalSize: 3,
    fireAtF4: true, swapEnabled: false, swapAt: 15, mergeAt: 10,
    mergedName: "Test Merge", mergedColor: "#123abc", controlledId: null,
    jointTribals: false, doubleTribals: true,
  }, Array.from({ length: tribeCount }, (_, i) => ({ id: `t${i}`, name: `Tribe ${i}`, color: "#123abc" })), makeRoster(18, tribeCount));
  s.phase = "challenge";
  return s;
}

describe("premerge double Tribals", () => {
  it("awards one individual immunity per active tribe and protects both through separate votes", () => {
    const start = challenge(2);
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    let s = step(start);
    expect(s.twistsUsed).toContain("double_pre");
    const immune = [...s.immune];
    expect(immune).toHaveLength(2);
    expect(new Set(immune.map((id) => s.castaways.find((c) => c.id === id)?.tribeId)).size).toBe(2);
    for (const id of immune) expect(s.castaways.find((c) => c.id === id)?.immunityWins).toBe(1);
    expect(s.tribalTribe).toBe(s.tribalTribes?.[0]);
    s = step(s);
    expect(s.phase).toBe("tribal");
    expect(s.immune).toEqual(immune);
    s = step(s);
    expect(alive(s)).toHaveLength(16);
    for (const id of immune) expect(s.castaways.find((c) => c.id === id)?.out).toBe(false);
    const tribals = s.episodes.flatMap((e) => e.entries).filter((e) => e.kind === "tribal");
    expect(tribals).toHaveLength(2);
    expect(new Set(tribals.map((e) => s.castaways.find((c) => c.id === e.out)?.tribeId)).size).toBe(2);
  });

  it("keeps tribe immunity with three active tribes while the other two attend", () => {
    const start = challenge(3);
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const s = step(start);
    expect(s.twistsUsed).toContain("double_pre");
    expect(s.immune).toEqual([]);
    expect(new Set([...(s.tribalTribes ?? []), ...(s.tribalQueue ?? []).flat()]).size).toBe(2);
  });
});