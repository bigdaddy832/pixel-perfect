import { it, expect } from "vitest";
import { simulateToEnd, makeRoster, newGame, TRIBE_NAMES, TRIBE_COLORS } from "./engine";
it("every juror asks a different question and no advantages are played at final 5 or later", () => {
  for (let k = 0; k < 40; k++) {
    const g = simulateToEnd(newGame({ playerCount: 18, tribeCount: 2, jurySize: 8, finalSize: 3, fireAtF4: true, swapEnabled: false, swapAt: 15, mergeAt: 12, mergedName: "M", mergedColor: "#123456", controlledId: null } as any, [0, 1].map((i) => ({ id: `t${i}`, name: TRIBE_NAMES[i], color: TRIBE_COLORS[i] })), makeRoster(18, 2)));
    const entries = g.episodes.flatMap((e) => e.entries);
    const ftc = entries.find((x) => x.title.startsWith("Final Tribal Council"))!;
    const qs = ftc.details!.map((d) => d.slice(d.indexOf('"')));
    expect(new Set(qs).size).toBe(qs.length);
  }
});
