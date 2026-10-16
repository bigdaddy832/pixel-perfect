// @ts-nocheck
import { describe, expect, it } from "vitest";
import { makeRoster, newGame, pendingDecision, simulateToEnd, step, TRIBE_COLORS, TRIBE_NAMES } from "./engine";

function season() {
  return newGame(
    { playerCount: 12, tribeCount: 2, jurySize: 6, finalSize: 3, fireAtF4: true, swapEnabled: false, swapAt: 10, mergeAt: 8, mergedName: "Final Tribe", mergedColor: "#123456", controlledId: "c0", jointTribals: false, doubleTribals: false },
    [{ id: "t0", name: TRIBE_NAMES[0] ?? "First", color: TRIBE_COLORS[0] ?? "#123456" }, { id: "t1", name: TRIBE_NAMES[1] ?? "Second", color: TRIBE_COLORS[1] ?? "#654321" }],
    makeRoster(12, 2).map((c, i) => ({ ...c, name: c.name ?? `Player ${i}` })),
  );
}

describe("confessionals, recap, nullifier, and list ordering", () => {
  it("generates confessionals and ends every season with a recap", () => {
    for (let i = 0; i < 10; i++) {
      const g = simulateToEnd(season());
      const entries = g.episodes.flatMap((e) => e.entries);
      expect(entries.some((e) => e.kind === "confessional" && e.title.startsWith("Confessional — "))).toBe(true);
      expect(entries.at(-1)?.title).toBe("Season Recap");
      expect(entries.at(-1)?.details?.join(" ")).toContain("Tribal Councils");
    }
  });

  it("offers alphabetically sorted player lists for every decision", () => {
    let g = season();
    for (let i = 0; i < 60 && g.phase !== "done"; i++) {
      const p = pendingDecision(g);
      if (p && "options" in p) {
        const names = p.options.map((o) => o.name);
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
      }
      g = step(g);
    }
  });

  it("idol nullifier cancels one idol for the named target and is then spent", () => {
    const g = season();
    g.phase = "tribal"; g.tribalTribe = "t0";
    const me = g.castaways[0];
    const holder = g.castaways.find((c) => c.tribeId === "t0" && c.id !== me.id);
    if (!me || !holder) throw new Error("Missing castaways");
    me.advantages = ["idol_nullifier"];
    holder.idols = 1;
    // Everyone votes for the idol holder so they play it.
    g.castaways.forEach((c) => { if (c.id !== holder.id) g.rel[[c.id, holder.id].sort().join("|")] = -100; });
    const result = step(g, { advantage: "idol_nullifier", advantageTarget: holder.id });
    const entry = result.episodes.flatMap((e) => e.entries).find((e) => e.kind === "tribal");
    expect(entry?.details?.some((d) => d.includes("nullified"))).toBe(true);
    expect(result.castaways[0]?.advantages).toEqual([]);
    expect(result.castaways.find((c) => c.id === holder.id)?.idols).toBe(0);
  });

  it("sometimes sees the F4 immune player give up immunity for fire", () => {
    let sawGiveUp = false;
    for (let i = 0; i < 80 && !sawGiveUp; i++) {
      const g = simulateToEnd(season());
      sawGiveUp = g.episodes.flatMap((e) => e.entries).some((e) => e.title === "Immunity Given Up — Fire-Making Showdown");
    }
    expect(sawGiveUp).toBe(true);
  });

  it("explains why the F4 immunity winner chose their finalist", () => {
    for (let i = 0; i < 10; i++) {
      const g = simulateToEnd(season());
      const fire = g.episodes.flatMap((e) => e.entries).find((e) => e.title === "Forced Fire-Making Challenge" || e.title === "Immunity Given Up — Fire-Making Showdown");
      expect(fire?.details?.some((d) => d.startsWith("Why"))).toBe(true);
    }
  });
});
