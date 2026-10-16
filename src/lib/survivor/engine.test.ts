import { afterEach, describe, expect, it, vi } from "vitest";
import { alive, makeRoster, MERGE_NAMES, newGame, pendingDecision, randomTribeColor, simulateToEnd, step, TRIBE_COLORS, TRIBE_NAMES, type Config, type GameState } from "./engine";

const config: Config = { playerCount: 18, tribeCount: 2, jurySize: 8, finalSize: 3, fireAtF4: true, swapEnabled: true, swapAt: 15, mergeAt: 12, mergedName: "Merge Test", mergedColor: "#123abc", controlledId: "c0", swapTribe: { id: "swap-third", name: "Swap Test", color: "#ab1234" } };
function season() { return newGame({ ...config }, [0, 1].map((i) => ({ id: `t${i}`, name: TRIBE_NAMES[i] ?? "Test", color: TRIBE_COLORS[i] ?? "#123456" })), makeRoster(18, 2).map((c, i) => ({ ...c, name: c.name ?? `Player ${i + 1}` }))); }
afterEach(() => vi.restoreAllMocks());

describe("Survivor decisions and tribes", () => {
  it("uses invented merge defaults and suggestions instead of past tribe names", () => {
    expect(MERGE_NAMES[0]).toBe("Velunara");
    expect(new Set(MERGE_NAMES).size).toBe(MERGE_NAMES.length);
    for (const name of ["Rattana", "Kasama", "Huyopa", "Dabu", "Galang", "Aitutonga", "Te Tuna"]) {
      expect(MERGE_NAMES).not.toContain(name);
    }
  });

  it("generates fresh cast names and nicknames without iconic contestant names", () => {
    // A maximum random roll leaves the complete name pool in its original order.
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    const names = makeRoster(64, 2).map((c) => c.name);
    expect(names.every((name) => typeof name === "string" && name.length > 0)).toBe(true);
    expect(new Set(names).size).toBe(names.length);
    for (const name of ["Cirie", "Parvati", "Ozzy", "Yul", "Vecepia", "Gervase", "Boston", "Frosti", "Coach"]) {
      expect(names).not.toContain(name);
    }
    for (const name of ["Tony", "Stephanie", "Rob", "Spark", "Patch", "Skipper"]) expect(names).toContain(name);
    const custom = makeRoster(20, 2)[0];
    if (!custom) throw new Error("Missing castaway");
    expect(makeRoster(20, 2, [{ ...custom, name: "My nickname" }])[0]?.name).toBe("My nickname");
  });

  it.each([[0.1, true, "Idol Found!", 1, 0], [0.1, false, "Advantage Found!", 0, 1], [0.5, true, "Nothing", 0, 0], [0.5, false, "Nothing", 0, 0]])("handles search roll %s (idol hidden: %s)", (roll, idolHidden, title, idols, advantages) => {
    const g = season();
    if (!idolHidden) g.hiddenIdols["t0"] = 0;
    g.castaways.forEach((c) => { c.stats.strategy = 1; });
    vi.spyOn(Math, "random").mockReturnValue(Number(roll));
    const result = step(g, { searchIdol: true, searchSpot: "the water well" });
    expect(result.episodes.flatMap((e) => e.entries).find((e) => e.title === `Your Search: ${title}`)?.text).toContain("the water well");
    expect(result.castaways[0]?.idols).toBe(idols);
    expect(result.castaways[0]?.advantages).toHaveLength(Number(advantages));
  });

  it("never gives duplicate idols or advantages", () => {
    for (let k = 0; k < 10; k++) {
      let g = season();
      while (g.phase !== "done") {
        g = step(g, { searchIdol: true });
        for (const c of g.castaways) { expect(c.idols).toBeLessThanOrEqual(1); expect(new Set(c.advantages).size).toBe(c.advantages.length); }
      }
    }
  });

  it("never repeats challenges, keeps endurance post-merge, and hands out a reward advantage", () => {
    for (let k = 0; k < 10; k++) {
      const g = simulateToEnd(season());
      const titles = g.episodes.flatMap((ep) => ep.entries.map((e) => ({ e, merged: false })));
      const ch = g.episodes.flatMap((ep) => ep.entries).filter((e) => /Challenge|Immunity:/.test(e.title) && e.kind !== "idol");
      const names = ch.map((e) => e.title.split(": ")[1]?.replace(/ \(.*\)$/, ""));
      expect(new Set(names).size).toBe(names.length);
      for (const e of ch) if (e.title.startsWith("Immunity Challenge") || (e.title.startsWith("Reward Challenge") && e.text.includes("win reward"))) expect(e.title).not.toContain("(Endurance)");
      expect(g.rewardAdvantageGiven).toBe(true);
      expect(titles.length).toBeGreaterThan(0);
    }
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
    me.advantages = ["extra_vote"];
    expect(pendingDecision(g)).toMatchObject({ advantages: ["extra_vote"] });
    const result = step(g, { advantage: "extra_vote" });
    const tribal = result.episodes.flatMap((e) => e.entries).find((e) => e.kind === "tribal");
    const votes = tribal?.votes?.filter((v) => v.voter === "c0");
    expect(votes).toHaveLength(2);
    expect(votes?.[0]?.target).toBe(votes?.[1]?.target);
    expect(result.castaways[0]?.advantages).toEqual([]);
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

  it("picks random tribe colors that stay valid and distinct from ones already used", () => {
    for (let i = 0; i < 200; i++) expect(randomTribeColor()).toMatch(/^#[0-9a-f]{6}$/);
    const rgb = (h: string): [number, number, number] => [
      parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16),
    ];
    const used: string[] = [];
    for (let i = 0; i < 6; i++) {
      const c = randomTribeColor(used);
      for (const u of used) {
        const [r1, g1, b1] = rgb(c), [r2, g2, b2] = rgb(u);
        expect(Math.hypot(r1 - r2, g1 - g2, b1 - b2)).toBeGreaterThan(30);
      }
      used.push(c);
    }
    expect(randomTribeColor(TRIBE_COLORS)).toMatch(/^#[0-9a-f]{6}$/);
    expect(randomTribeColor(["not-a-color", "#12g456"])).toMatch(/^#[0-9a-f]{6}$/);
  });
});