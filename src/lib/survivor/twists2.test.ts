// @ts-nocheck
import { expect, test } from "vitest";
import { newGame, makeRoster, simulateToEnd, TRIBE_COLORS } from "./engine";
test("new twists run, max one joint/double", () => {
  const seen: Record<string, number> = {};
  for (let i = 0; i < 150; i++) {
    const tribes = [0, 1].map((k) => ({ id: `t${k}`, name: `T${k}`, color: TRIBE_COLORS[k]! }));
    const g = simulateToEnd(newGame({ playerCount: 18, tribeCount: 2, jurySize: 8, finalSize: 3, fireAtF4: true, swapEnabled: true, swapAt: 15, mergeAt: 12, mergedName: "M", mergedColor: "#fff", controlledId: null, jointTribals: true, doubleTribals: true, edgeOfExtinction: true, journeys: true, exileIsland: true, bewareAdvantages: true }, tribes, makeRoster(18, 2)));
    expect(g.phase).toBe("done");
    expect((g.twistsUsed ?? []).filter((x) => ["joint", "double_pre", "double_post"].includes(x)).length).toBeLessThanOrEqual(1);
    for (const e of g.episodes.flatMap((x) => x.entries)) for (const k of ["Return from the Edge", "Journey", "Summit", "Exile Island", "BEWARE", "Knowledge is Power", "NOT a hidden", "Opening Statements", "Challenge"]) if ((e.title + e.text + (e.details ?? []).join()).includes(k)) seen[k] = (seen[k] ?? 0) + 1;
  }
  console.log(JSON.stringify(seen));
});
