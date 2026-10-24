import { describe, expect, it } from "vitest";
import { makeRoster, newGame, step, type Config, type GameState } from "./engine";

const config: Config = { playerCount: 18, tribeCount: 2, jurySize: 8, finalSize: 3, fireAtF4: true, swapEnabled: false, swapAt: 15, mergeAt: 12, mergedName: "Merge Test", mergedColor: "#123abc", controlledId: "none", demergeTwist: true };
const season = () => newGame({ ...config }, [0, 1].map((i) => ({ id: `t${i}`, name: `T${i}`, color: "#123456" })), makeRoster(18, 2).map((c, i) => ({ ...c, name: c.name ?? `P${i}` })));

describe("demerge twist", () => {
  it("never votes out either group's immunity winner", () => {
    let hit = 0;
    for (let k = 0; k < 30; k++) {
      let g: GameState = season();
      let immune: string[] | null = null;
      for (let i = 0; i < 400 && g.phase !== "done"; i++) {
        const wasActive = g.demergeActive;
        g = step(g);
        if (!wasActive && g.demergeActive) immune = [...g.immune];
        if (immune && !g.demergeActive && wasActive) {
          for (const id of immune) expect(g.castaways.find((c) => c.id === id)?.out).toBe(false);
          expect(g.tribes.some((t) => t.id.startsWith("demerge"))).toBe(false);
          hit++;
          immune = null;
        }
      }
    }
    expect(hit).toBeGreaterThan(0);
  });
});
