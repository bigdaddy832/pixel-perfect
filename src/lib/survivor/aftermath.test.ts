import { describe, expect, it } from "vitest";
import { makeRoster, newGame, step, type Config, type GameState } from "./engine";

const base: Config = { playerCount: 16, tribeCount: 2, jurySize: 7, finalSize: 3, fireAtF4: true, swapEnabled: false, swapAt: 13, mergeAt: 11, mergedName: "M", mergedColor: "#123abc", controlledId: null };

describe("blindside aftermath", () => {
  it("adds morning-after confrontations after votes, never from the person voted out", () => {
    let total = 0;
    for (let k = 0; k < 10; k++) {
      let g: GameState = newGame(base, [0, 1].map((i) => ({ id: `t${i}`, name: `T${i}`, color: "#123456" })), makeRoster(16, 2).map((p, i) => ({ ...p, name: p.name ?? `P${i}` })));
      for (let i = 0; i < 400 && g.phase !== "done"; i++) g = step(g);
      for (const e of g.episodes) {
        const entries = e.entries;
        entries.forEach((en, idx) => {
          if (!en.title.startsWith("Morning After")) return;
          total++;
          const prevTribal = [...entries.slice(0, idx)].reverse().find((x) => x.kind === "tribal" && x.out);
          expect(prevTribal).toBeTruthy();
          const outName = g.castaways.find((c) => c.id === prevTribal!.out)!.name;
          expect(en.title).not.toContain(outName);
        });
      }
    }
    expect(total).toBeGreaterThan(10);
  });
});
