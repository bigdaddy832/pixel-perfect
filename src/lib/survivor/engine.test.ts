import { afterEach, describe, expect, it, vi } from "vitest";
import { alive, makeRoster, newGame, pendingDecision, simulateToEnd, step, TRIBE_COLORS, TRIBE_NAMES, type Config, type GameState } from "./engine";

const config: Config = { playerCount: 18, tribeCount: 2, jurySize: 8, finalSize: 3, fireAtF4: true, swapEnabled: true, swapAt: 15, mergeAt: 12, mergedName: "Merge Test", mergedColor: "#123abc", controlledId: "c0", swapTribe: { id: "swap-third", name: "Swap Test", color: "#ab1234" } };
function season() { return newGame({ ...config }, [0, 1].map((i) => ({ id: `t${i}`, name: TRIBE_NAMES[i] ?? "Test", color: TRIBE_COLORS[i] ?? "#123456" })), makeRoster(18, 2).map((c, i) => ({ ...c, name: c.name ?? `Player ${i + 1}` }))); }
afterEach(() => vi.restoreAllMocks());

describe("Survivor decisions and tribes", () => {
  it.each([[0.1, "Idol Found!", 1, 0], [0.5, "Advantage Found!", 0, 1], [0.99, "Nothing", 0, 0]])("handles search outcome for roll %s", (roll, title, idols, advantages) => {
    const g = season();
    const me = g.castaways[0];
    if (!me) throw new Error("Missing player");
    g.castaways.forEach((c) => { c.stats.strategy = 1; });
    vi.spyOn(Math, "random").mockReturnValue(Number(roll));
    const result = step(g, { searchIdol: true, searchSpot: "the water well" });
    expect(result.episodes.flatMap((e) => e.entries).find((e) => e.title === `Your Search: ${title}`)?.text).toContain("the water well");
    expect(result.castaways[0]?.idols).toBe(idols);
    expect(result.castaways[0]?.extraVotes).toBe(advantages);
    expect(me.idols).toBe(0);
  });

  it("randomizes an approach within the player's tribe", () => {
    const result = step(season(), { allyWith: "__random__" });
    const move = result.episodes.flatMap((e) => e.entries).find((e) => e.title === "Your Move");
    expect(move?.text).toContain("You approached");
    expect(result.castaways.filter((c) => c.id !== "c0" && c.tribeId === "t0").some((c) => move?.text.includes(c.name))).toBe(true);
  });

  it("plays an extra vote even when instinct picks the target", () => {
    const g = season();
    g.phase = "tribal"; g.tribalTribe = "t0";
    const me = g.castaways[0];
    if (!me) throw new Error("Missing player");
    me.extraVotes = 1;
    expect(pendingDecision(g)).toMatchObject({ hasExtraVote: true });
    const result = step(g, { extraVote: true });
    const tribal = result.episodes.flatMap((e) => e.entries).find((e) => e.kind === "tribal");
    const votes = tribal?.votes?.filter((v) => v.voter === "c0");
    expect(votes).toHaveLength(2);
    expect(votes?.[0]?.target).toBe(votes?.[1]?.target);
    expect(result.castaways[0]?.extraVotes).toBe(0);
  });

  it("keeps the player idol unless explicitly played", () => {
    const g = season(); g.phase = "tribal"; g.tribalTribe = "t0";
    const me = g.castaways[0];
    if (!me) throw new Error("Missing player");
    me.idols = 1;
    const result = step(g);
    const tribal = result.episodes.flatMap((e) => e.entries).find((e) => e.kind === "tribal");
    expect(tribal?.details?.some((d) => d.includes(`${me.name} stands up and plays`))).toBe(false);
  });

  it("activates the configured third tribe only at swap and carries merge colors", () => {
    let g = season();
    expect(g.tribes).toHaveLength(2);
    for (let i = 0; i < 30 && !g.swapped; i++) g = step(g);
    expect(g.swapped).toBe(true);
    expect(g.tribes.find((t) => t.id === "swap-third")).toEqual(config.swapTribe);
    expect(alive(g).filter((c) => c.tribeId === "swap-third")).toHaveLength(5);
    expect(g.hiddenIdols["swap-third"]).toBe(1);
    g = simulateToEnd(g);
    expect(g.phase).toBe("done");
    expect(g.tribes.find((t) => t.id === "merged")?.color).toBe(config.mergedColor);
  });

  it("sorts tribal final totals from most to least across full seasons", () => {
    for (let i = 0; i < 15; i++) {
      const g: GameState = simulateToEnd(season());
      expect(g.winner).toBeTruthy();
      for (const e of g.episodes.flatMap((ep) => ep.entries).filter((entry) => entry.kind === "tribal")) {
        const count = e.details?.[0]?.match(/Final count: ([\d-]+)/)?.[1]?.split("-").map(Number);
        expect(count).toBeTruthy();
        expect(count).toEqual([...(count ?? [])].sort((a, b) => b - a));
      }
    }
  });
});