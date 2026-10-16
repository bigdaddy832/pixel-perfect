import { it, expect } from "vitest";
import { makeRoster, newGame, step, pendingDecision, TRIBE_NAMES, TRIBE_COLORS } from "./engine";
it("pauses at a tie so the controlled player can revote", () => {
  let pauses = 0, honored = 0;
  for (let k = 0; k < 80; k++) {
    let g = newGame({ playerCount: 16, tribeCount: 2, jurySize: 7, finalSize: 3, fireAtF4: true, swapEnabled: false, swapAt: 13, mergeAt: 10, mergedName: "M", mergedColor: "#123456", controlledId: "c0" }, [0, 1].map((i) => ({ id: `t${i}`, name: TRIBE_NAMES[i], color: TRIBE_COLORS[i] })), makeRoster(16, 2));
    let i = 0;
    while (g.phase !== "done" && i++ < 500) {
      const p = pendingDecision(g);
      if (p?.kind === "revote") {
        pauses++; const pick = p.options[0].id; const day = g.day;
        g = step(g, { revoteVote: pick, pauseOnRevote: true });
        const rv = g.episodes.flatMap((e) => e.entries).filter((e) => e.revote).at(-1)!.revote!;
        expect(g.day >= day).toBe(true);
        if (rv.find((v) => v.voter === "c0")?.target === pick) honored++;
        continue;
      }
      g = step(g, { ...(p?.kind === "tribal" ? { vote: p.options[0]?.id } : {}), pauseOnRevote: true });
    }
    expect(g.phase).toBe("done");
  }
  expect(pauses).toBeGreaterThan(0);
  expect(honored).toBe(pauses);
}, 300000);
