import { describe, expect, it } from "vitest";
import { makeRoster, newGame, step, type Config, type GameState } from "./engine";

const base: Config = { playerCount: 18, tribeCount: 2, jurySize: 8, finalSize: 3, fireAtF4: true, swapEnabled: false, swapAt: 15, mergeAt: 12, mergedName: "M", mergedColor: "#123abc", controlledId: null };
const season = (c: Partial<Config>) =>
  newGame({ ...base, ...c }, [0, 1].map((i) => ({ id: `t${i}`, name: `T${i}`, color: "#123456" })), makeRoster(18, 2).map((p, i) => ({ ...p, name: p.name ?? `P${i}` })));

describe("earn the merge", () => {
  it("makes the winning team immune and votes out someone from the losing team", () => {
    for (let k = 0; k < 15; k++) {
      let g: GameState = season({ earnTheMerge: true });
      let immune: string[] | null = null;
      for (let i = 0; i < 400 && g.phase !== "done"; i++) {
        const had = (g.twistsUsed ?? []).includes("earn-merge");
        g = step(g);
        if (!had && (g.twistsUsed ?? []).includes("earn-merge")) {
          immune = [...g.immune];
          expect(immune.length).toBeGreaterThanOrEqual(3);
          const before = g.castaways.filter((c) => c.out).length;
          while (g.phase === "tribal") g = step(g);
          expect(g.castaways.filter((c) => c.out).length).toBeGreaterThan(before);
          for (const id of immune) expect(g.castaways.find((c) => c.id === id)!.out).toBe(false);
          break;
        }
      }
      expect(immune).not.toBeNull();
    }
  });
});

describe("idol halves", () => {
  it("splits at most 2 idols per season and both holders keep a matching half", () => {
    let sawHalf = false;
    for (let k = 0; k < 25; k++) {
      let g: GameState = season({ idolGifting: true });
      for (let i = 0; i < 400 && g.phase !== "done"; i++) {
        g = step(g);
        expect(g.halfIdolsMade ?? 0).toBeLessThanOrEqual(2);
        for (const c of g.castaways.filter((x) => !x.out && x.halfIdolWith)) {
          sawHalf = true;
          expect(g.castaways.find((x) => x.id === c.halfIdolWith)?.halfIdolWith).toBe(c.id);
        }
      }
    }
    expect(sawHalf).toBe(true);
  });
});
