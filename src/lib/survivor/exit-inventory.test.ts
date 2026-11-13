import { afterEach, describe, expect, it, vi } from "vitest";
import { alive, fixAllianceNames, makeRoster, newGame, simulateToEnd, step, type GameState } from "./engine";

function season(): GameState {
  return newGame({ playerCount: 12, tribeCount: 2, jurySize: 6, finalSize: 3,
    fireAtF4: true, swapEnabled: false, swapAt: 10, mergeAt: 8,
    mergedName: "Test", mergedColor: "#123456", controlledId: "c0",
    shotInTheDark: false, jointTribals: false, doubleTribals: false },
  [{ id: "t0", name: "First", color: "#123456" }, { id: "t1", name: "Second", color: "#654321" }],
  makeRoster(12, 2).map((c, i) => ({ ...c, name: c.name ?? `Player ${i}` })));
}
afterEach(() => vi.restoreAllMocks());

describe("idol inventory at elimination", () => {
  it("records full, locked Beware, and half idols before clearing active inventory", () => {
    const g = season();
    const player = g.castaways.find((c) => c.id === "c0");
    if (!player) throw new Error("Missing player");
    player.idols = 2; player.idolOrigins = ["t0", "t1"];
    player.bewareTribals = 2; player.halfIdolWith = "c2";
    const result = step(g, { quit: true });
    expect(result.castaways.find((c) => c.id === "c0")).toMatchObject({
      out: true, idols: 0, idolsAtExit: 2, halfIdolAtExit: true,
    });
    expect(result.episodes.flatMap((e) => e.entries).find((e) => e.title === "Idols Left in Pocket")?.out).toBe("c0");
  });

  it("records a Tribal pocket idol even when the eliminated player voted for a voter against them", () => {
    let checked = false;
    for (let seed = 1; seed <= 100 && !checked; seed++) {
      let state = seed;
      vi.spyOn(Math, "random").mockImplementation(() => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
      });
      const g = season(); g.phase = "tribal"; g.tribalTribe = "t0";
      const player = g.castaways.find((c) => c.id === "c0");
      if (!player) throw new Error("Missing player");
      player.idols = 1; player.idolOrigins = ["t0"];
      for (const c of alive(g).filter((c) => c.id !== "c0" && c.tribeId === "t0")) {
        g.rel[[c.id, "c0"].sort().join("|")] = -100;
      }
      const result = step(g, { vote: "c2" });
      const tribal = result.episodes.flatMap((e) => e.entries).find((e) => e.kind === "tribal");
      if (tribal?.out !== "c0" || !tribal.votes?.some((v) => v.voter === "c2" && v.target === "c0")) continue;
      expect(result.castaways.find((c) => c.id === "c0")?.idolsAtExit).toBe(1);
      expect(tribal.text).toContain("1 unplayed idol");
      checked = true;
    }
    expect(checked).toBe(true);
  });
});

describe("identical remaining alliances", () => {
  it("dissolves Jeff/Dan/Matt into the existing Jeff/Dan group after Matt leaves", () => {
    const g = season(); g.config.controlledId = "c4";
    g.alliances = [
      { id: "trio", name: "Trio", members: ["c0", "c2", "c4"] },
      { id: "duo", name: "Duo", members: ["c2", "c0"] },
      { id: "different", name: "Other", members: ["c0", "c6"] },
    ];
    const result = step(g, { quit: true });
    expect(result.alliances).toEqual([
      { id: "duo", name: "Duo", members: ["c2", "c0"] },
      { id: "different", name: "Other", members: ["c0", "c6"] },
    ]);
  });

  it("repairs existing duplicate groups regardless of member order or tribe", () => {
    const g = season();
    g.alliances = [
      { id: "a", name: "First group", members: ["c0", "c1"] },
      { id: "b", name: "Duplicate", members: ["c1", "c0"] },
    ];
    fixAllianceNames(g);
    expect(g.alliances.map((a) => a.id)).toEqual(["a"]);
  });

  it("keeps every phase of a complete season free of duplicate surviving groups", () => {
    let g = season();
    while (g.phase !== "done") {
      g = step(g);
      const signatures = g.alliances.map((a) => JSON.stringify([...a.members].sort()));
      expect(new Set(signatures).size).toBe(signatures.length);
      expect(g.alliances.every((a) => a.members.length >= 2 && a.members.every((id) => alive(g).some((c) => c.id === id)))).toBe(true);
    }
    expect(simulateToEnd(g).winner).toBe(g.winner);
  });
});