import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { Game } from "@/components/survivor/Game";
import { finalistSpeeches, IDOL_HIDING_PLACES, SEARCH_SPOTS, makeRoster, newGame, pendingDecision, simulateToEnd, step } from "./engine";
import { reachedMerge, seasonStatistics } from "./statistics";

function season() {
  return newGame({ playerCount: 12, tribeCount: 2, jurySize: 6, finalSize: 3, fireAtF4: true, swapEnabled: false, swapAt: 10, mergeAt: 8, mergedName: "Final Tribe", mergedColor: "#123456", controlledId: "c0", jointTribals: false, doubleTribals: false }, [{ id: "t0", name: "First", color: "#123456" }, { id: "t1", name: "Second", color: "#654321" }], makeRoster(12, 2).map((c, i) => ({ ...c, name: c.name ?? `Player ${i}` })));
}
function jurySeason() {
  const g = season();
  g.merged = true; g.phase = "ftc"; g.finalists = ["c1", "c2", "c3"];
  g.castaways.forEach((c, i) => { c.out = !g.finalists?.includes(c.id); c.juror = c.out && i < 9; c.madeMerge = i < 9; c.tribeId = i < 9 ? "merged" : c.tribeId; });
  return g;
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("finale detail and decisions", () => {
  it("keeps existing alliances unchanged and creates a new pair", () => {
    const g = season();
    const partners = g.castaways.filter((c) => c.tribeId === "t0" && c.id !== "c0");
    const old = partners[0], target = partners[1];
    if (!old || !target) throw new Error("Missing partners");
    g.alliances = [{ id: "original", name: "Original", members: ["c0", old.id] }];
    g.rel[["c0", target.id].sort().join("|")] = 50;
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const result = step(g, { allyWith: target.id });
    expect(result.alliances.find((a) => a.id === "original")?.members).toEqual(["c0", old.id]);
    expect(result.alliances.some((a) => a.members.length === 2 && a.members.includes("c0") && a.members.includes(target.id))).toBe(true);
    const again = step({ ...result, phase: "camp" }, { allyWith: target.id });
    expect(again.alliances.filter((a) => a.members.includes("c0") && a.members.includes(target.id))).toHaveLength(1);
  });

  it("lets an eliminated juror choose a finalist and records that vote", () => {
    const g = jurySeason();
    expect(pendingDecision(g)).toMatchObject({ kind: "jury", options: g.castaways.filter((c) => !c.out).sort((a, b) => a.name.localeCompare(b.name)) });
    const done = step(g, { juryVote: "c2" });
    expect(done.juryVotes?.find((v) => v.juror === "c0")?.finalist).toBe("c2");
    expect(done.phase).toBe("done");
    expect(done.episodes.flatMap((e) => e.entries).filter((e) => e.title === "Opening Statements")).toHaveLength(1);
    expect(step(g, { juryVote: "c11" }).juryVotes?.find((v) => v.juror === "c0")?.finalist).not.toBe("c11");
    const me = g.castaways[0];
    if (!me) throw new Error("Missing player");
    me.juror = false;
    expect(pendingDecision(g)).toBeNull();
  });

  it("supports the jury choice through the game screen", () => {
    const setGame = vi.fn();
    render(<Game game={jurySeason()} setGame={setGame} onReset={() => {}} />);
    expect(screen.getByText("Finalists’ Speeches")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Your vote for Sole Survivor:"), { target: { value: "c2" } });
    fireEvent.click(screen.getByRole("button", { name: /Next Phase/ }));
    expect(setGame.mock.calls[0]?.[0].juryVotes.find((v: { juror: string }) => v.juror === "c0").finalist).toBe("c2");
  });

  it("uses more than three evidence-based speech reasons", () => {
    const g = jurySeason();
    const finalist = g.castaways[1];
    if (!finalist) throw new Error("Missing finalist");
    Object.assign(finalist, { immunityWins: 3, votesCast: 7, correctVotes: 5, idolsPlayed: 2, advPlayed: 1 });
    g.episodes[0]?.entries.push({ kind: "tribal", title: "Tribal", text: "", votes: [{ voter: "c4", target: finalist.id, nullified: true }] });
    const speech = finalistSpeeches(g)[0];
    for (const phrase of ["3 immunities", "5 of 7", "2 idols", "1 advantage", "negating 1 vote"]) expect(speech).toContain(phrase);
  });

  it("lists negated votes separately without changing elimination", () => {
    const g = season(); g.phase = "tribal"; g.tribalTribe = "t0";
    const me = g.castaways[0];
    if (!me) throw new Error("Missing player");
    me.idols = 1;
    g.castaways.forEach((c) => { if (c.id !== me.id) g.rel[[c.id, me.id].sort().join("|")] = -100; });
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const result = step(g, { idol: me.id });
    const entry = result.episodes.flatMap((e) => e.entries).find((e) => e.kind === "tribal");
    const negated = entry?.votes?.filter((v) => v.nullified).length;
    expect(negated).toBeGreaterThan(0);
    expect(entry?.details?.[0]).toContain(`Idol-negated: ${negated}`);
    expect(result.castaways[0]?.out).toBe(false);
  });

  it("adds logged hiding places without adding search options", () => {
    expect(IDOL_HIDING_PLACES.length).toBeGreaterThan(12);
    expect(SEARCH_SPOTS).toHaveLength(5);
  });

  it("counts individual wins and all ballots, separating negated votes", () => {
    const g = jurySeason();
    const finalist = g.castaways[1];
    if (!finalist) throw new Error("Missing finalist");
    finalist.immunityWins = 2;
    g.episodes[0]?.entries.push({ kind: "challenge", title: "Reward Challenge: Test", text: `${finalist.name} wins reward.` }, { kind: "tribal", title: "Vote", text: "", votes: [{ voter: "c4", target: "c1", nullified: true }, { voter: "c5", target: "c1" }], revote: [{ voter: "c4", target: "c1" }] });
    expect(seasonStatistics(g).find((r) => r.id === "c1")).toMatchObject({ rewards: 1, immunity: 2, totalWins: 3, votesAgainst: 3, countedAgainst: 2, negated: 1 });
  });

  it("awards fan favorite only to a merge player after the winner", () => {
    for (let i = 0; i < 20; i++) {
      const done = simulateToEnd(season());
      const favorite = done.castaways.find((c) => c.id === done.fanFavorite);
      expect(favorite).toBeTruthy();
      if (!favorite) throw new Error("Missing favorite");
      expect(reachedMerge(done, favorite)).toBe(true);
      const entries = done.episodes.flatMap((e) => e.entries);
      expect(entries.at(-1)?.title).toBe("Season Recap");
      expect(entries.at(-2)?.title).toBe("Season Superlatives");
      expect(entries.at(-3)?.title).toBe("Fan Favorite Award");
      expect(entries.at(-4)?.title).toBe("The Reunion — Sole Survivor");
    }
  });
});