import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Game, VoteReveal } from "@/components/survivor/Game";
import { kipItems, makeRoster, newGame, step, type GameState, type LogEntry } from "./engine";

function tribal(): GameState {
  const g = newGame({ playerCount: 16, tribeCount: 2, jurySize: 7, finalSize: 3, fireAtF4: true, swapEnabled: false, swapAt: 12, mergeAt: 10, mergedName: "Test", controlledId: "c0", jointTribals: false, doubleTribals: false }, [{ id: "t0", name: "First", color: "#123456" }, { id: "t1", name: "Second", color: "#654321" }], makeRoster(16, 2));
  g.phase = "tribal"; g.tribalTribe = "t0";
  g.castaways.forEach((c) => { c.idols = 0; c.advantages = []; c.shotUsed = true; });
  return g;
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Tribal item agency", () => {
  it("takes exactly the selected KIP advantage instead of the target's idol", () => {
    const g = tribal(); const me = g.castaways.find((c) => c.id === "c0"); const target = g.castaways.find((c) => c.id !== "c0" && c.tribeId === "t0");
    if (!me || !target) throw new Error("Missing players");
    me.advantages = ["knowledge_is_power"]; target.idols = 1; target.advantages = ["extra_vote", "vote_blocker"];
    expect(kipItems(me, target)).toEqual(["idol", "extra_vote", "vote_blocker"]);
    const result = step(g, { advantage: "knowledge_is_power", advantageTarget: target.id, kipItem: "vote_blocker" });
    expect(result.castaways.find((c) => c.id === me.id)?.advantages).toEqual(["vote_blocker"]);
    expect(result.castaways.find((c) => c.id === me.id)?.idols).toBe(0);
    expect(result.castaways.find((c) => c.id === target.id)?.advantages).not.toContain("vote_blocker");
  });

  it("excludes locked idols and duplicate advantages from KIP options", () => {
    const g = tribal(); const [me, target] = g.castaways;
    if (!me || !target) throw new Error("Missing players");
    me.advantages = ["extra_vote", "knowledge_is_power"]; target.idols = 1; target.bewareTribals = 1; target.advantages = ["extra_vote", "safety"];
    expect(kipItems(me, target)).toEqual(["safety"]);
  });

  it("lets idol instinct protect a threatened controlled player while keep preserves the idol", () => {
    const g = tribal(); const me = g.castaways.find((c) => c.id === "c0");
    if (!me) throw new Error("Missing player");
    me.idols = 1; g.castaways.forEach((c, i) => { c.out = i >= 5; c.tribeId = "t0"; });
    g.rel = {}; g.castaways.filter((c) => !c.out && c.id !== me.id).forEach((c) => { g.rel[[c.id, me.id].sort().join("|")] = -50; });
    // At the last idol-eligible Tribal, instinct plays whenever the holder receives votes.
    let found = false;
    for (let seed = 1; seed <= 30; seed++) {
      vi.spyOn(Math, "random").mockReturnValue(seed / 31);
      const result = step(g, { idol: "__instinct__" });
      const player = result.castaways.find((c) => c.id === me.id);
      if (player?.idolsPlayed === 1) { expect(player.idols).toBe(0); found = true; break; }
    }
    expect(found).toBe(true);
    expect(step(g, { idol: "" }).castaways.find((c) => c.id === me.id)?.idols).toBe(1);
  });

  it("advantage instinct can play a held advantage but never at final five", () => {
    const g = tribal(); const me = g.castaways.find((c) => c.id === "c0");
    if (!me) throw new Error("Missing player");
    me.advantages = ["extra_vote"];
    let played = false;
    for (let seed = 1; seed <= 30; seed++) {
      vi.spyOn(Math, "random").mockReturnValue(seed / 31);
      if (step(g, { advantage: "__instinct__" }).castaways.find((c) => c.id === me.id)?.advPlayed === 1) { played = true; break; }
    }
    expect(played).toBe(true);
    expect(step(g).castaways.find((c) => c.id === me.id)?.advantages).toEqual(["extra_vote"]);
    g.castaways.forEach((c, i) => { c.out = i >= 5; c.tribeId = "t0"; });
    expect(step(g, { advantage: "__instinct__" }).castaways.find((c) => c.id === me.id)?.advantages).toEqual(["extra_vote"]);
  });

  it("the KIP item control hands over the chosen item when advancing Tribal", () => {
    const g = tribal(); const me = g.castaways.find((c) => c.id === "c0"); const target = g.castaways.find((c) => c.id !== "c0" && c.tribeId === "t0");
    if (!me || !target) throw new Error("Missing players");
    me.advantages = ["knowledge_is_power"]; target.idols = 1; target.advantages = ["extra_vote"];
    const setGame = vi.fn();
    render(<Game game={g} setGame={setGame} onReset={() => {}} />);
    fireEvent.change(screen.getByLabelText("Play advantage:"), { target: { value: "knowledge_is_power" } });
    fireEvent.change(screen.getByLabelText("Advantage target"), { target: { value: target.id } });
    fireEvent.change(screen.getByLabelText("KIP item to take"), { target: { value: "extra_vote" } });
    fireEvent.click(screen.getByRole("button", { name: /Next Phase/ }));
    const result: GameState = setGame.mock.calls[0]?.[0];
    expect(result.castaways.find((c) => c.id === me.id)?.advantages).toEqual(["extra_vote"]);
  });

  it("revote reading counts only new parchments", () => {
    const g = tribal(); const [a, b, c] = g.castaways;
    if (!a || !b || !c) throw new Error("Missing players");
    const e: LogEntry = { kind: "tribal", title: "Tribal", text: "Result", out: c.id, votes: [{ voter: b.id, target: a.id }, { voter: c.id, target: a.id }, { voter: a.id, target: b.id }], revote: [{ voter: a.id, target: c.id }, { voter: b.id, target: c.id }] };
    render(<VoteReveal g={g} e={e} onDone={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Read next vote" }));
    expect(screen.queryByText(a.name)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Read next vote" }));
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Read next vote" })).not.toBeInTheDocument();
  });
});