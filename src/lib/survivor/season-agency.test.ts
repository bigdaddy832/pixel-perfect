import { afterEach, describe, expect, it, vi } from "vitest";
import { advantageSearchChance, alive, canDiscoverIdol, makeRoster, newGame, simulateToEnd, step, TALK_TOPICS, type Config } from "./engine";
import { randomSeasonTwist, seasonTwistOptions, SEASON_PLACES, SEASON_THEMES, type SeasonTwist } from "./season-titles";

const config: Config = { playerCount: 16, tribeCount: 2, jurySize: 7, finalSize: 3, fireAtF4: true, swapEnabled: false, swapAt: 12, mergeAt: 10, mergedName: "Test Merge", mergedColor: "#123456", controlledId: "c0", jointTribals: false, doubleTribals: false };
const season = (twist?: SeasonTwist) => newGame({ ...config, themeTwist: twist, seasonTitle: "Survivor: Fire & Fate" }, [{ id: "t0", name: "First", color: "#123456" }, { id: "t1", name: "Second", color: "#654321" }], makeRoster(16, 2));
afterEach(() => vi.restoreAllMocks());

describe("season agency rules", () => {
  it("random conversations choose two different living tribemates and automatic topics", () => {
    const g = season();
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const result = step(g, { talks: [{ with: "__random__" }, { with: "__random__" }] });
    const conversations = result.episodes.flatMap((e) => e.entries).filter((e) => e.title.startsWith("Conversation with"));
    const names = alive(g).filter((c) => c.tribeId === "t0" && c.id !== "c0").map((c) => c.name);
    expect(conversations).toHaveLength(2);
    expect(new Set(conversations.map((e) => e.title)).size).toBe(2);
    for (const e of conversations) {
      expect(names.some((name) => e.title.startsWith(`Conversation with ${name}:`))).toBe(true);
      expect(Object.values(TALK_TOPICS).some((t) => e.text.includes(t.label.toLowerCase()))).toBe(true);
    }
  });

  it("rejects conversations with someone outside your tribe", () => {
    const g = season();
    const other = g.castaways.find((c) => c.tribeId === "t1");
    if (!other) throw new Error("Missing other tribe");
    const result = step(g, { talks: [{ with: other.id }] });
    expect(result.episodes.flatMap((e) => e.entries).filter((e) => e.title.startsWith("Conversation with"))).toHaveLength(0);
  });

  it("blocks all camp idol discoveries at final four while allowing final five", () => {
    const g = season();
    g.castaways.forEach((c, i) => { c.out = i >= 5; c.clue = true; c.stats.strategy = 10; });
    expect(canDiscoverIdol(g)).toBe(true);
    const fifth = g.castaways[4];
    if (!fifth) throw new Error("Missing fifth player");
    fifth.out = true;
    expect(canDiscoverIdol(g)).toBe(false);
    vi.spyOn(Math, "random").mockReturnValue(0);
    const result = step(g, { searchIdol: true, challengeIdol: true });
    expect(result.castaways.reduce((sum, c) => sum + c.idols, 0)).toBe(0);
    expect(result.hiddenIdols).toEqual(g.hiddenIdols);
  });

  it("reduces incidental advantage odds slightly", () => {
    expect(advantageSearchChance(1)).toBeCloseTo(0.009);
    expect(advantageSearchChance(5)).toBeCloseTo(0.029);
    expect(advantageSearchChance(5)).toBeLessThan(0.035);
  });

  it("gives every generated title a compatible twist and excludes fire for final two", () => {
    for (const title of [...SEASON_PLACES, ...SEASON_THEMES]) {
      for (const roll of [0, 0.99]) {
        expect(seasonTwistOptions(`Survivor: ${title}`)).toContain(randomSeasonTwist(`Survivor: ${title}`, 3, () => roll));
        expect(randomSeasonTwist(`Survivor: ${title}`, 2, () => roll)).not.toBe("fire");
      }
    }
    expect(seasonTwistOptions("Survivor: Fire Island")).toEqual(["fire", "double"]);
    expect(seasonTwistOptions("Survivor: Isolation Isle")).toEqual(["exile", "return"]);
  });

  it.each(["journey", "exile", "return", "fire", "double"] as const)("activates and runs the %s theme twist", (twist) => {
    vi.spyOn(Math, "random").mockReturnValue(0.75);
    const g = season(twist);
    const result = simulateToEnd(g);
    expect(result.phase).toBe("done");
    if (twist === "journey") expect(result.journeysDone).toBeGreaterThan(0);
    if (twist === "exile") expect(result.episodes.flatMap((e) => e.entries).some((e) => e.title === "Exile Island")).toBe(true);
    if (twist === "return") expect(result.edgeDone).toBe(true);
    if (twist === "fire") expect(result.episodes.flatMap((e) => e.entries).some((e) => e.title.includes("Fire-Making"))).toBe(true);
    if (twist === "double") expect(result.twistsUsed).toContain("double_post");
  });
});