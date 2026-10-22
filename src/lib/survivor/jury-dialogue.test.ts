import { describe, expect, it } from "vitest";
import { makeRoster, newGame, simulateToEnd } from "./engine";
import { answerJuryQuestion, eligibleJuryQuestions, JURY_QUESTIONS, type JuryQuestion } from "./jury-dialogue";

function fixture() {
  const game = newGame({ playerCount: 12, tribeCount: 2, jurySize: 6, finalSize: 3, fireAtF4: true, swapEnabled: false, swapAt: 10, mergeAt: 8, mergedName: "Test", mergedColor: "#123456", controlledId: null }, [{ id: "t0", name: "First", color: "#123456" }, { id: "t1", name: "Second", color: "#654321" }], makeRoster(12, 2).map((c, i) => ({ ...c, name: c.name ?? `Player ${i}` })));
  const f = game.castaways[0], j = game.castaways[1];
  if (!f || !j) throw new Error("Missing cast");
  return { game, f, j };
}
function question(id: JuryQuestion["id"]) {
  const q = JURY_QUESTIONS.find((q) => q.id === id);
  if (!q) throw new Error("Missing question");
  return q;
}
describe("question-specific jury answers", () => {
  it("answers the selected immunity question even when the juror was betrayed", () => {
    const { game, f, j } = fixture(); j.betrayedBy = [f.id]; f.immunityWins = 3;
    const result = answerJuryQuestion(game, f, j, question("without-wins"));
    expect(result.questionId).toBe("without-wins");
    expect(result.evidenceCount).toBe(3);
    expect(result.evidencePlayerId).toBeUndefined();
  });
  it("grounds a betrayal answer in the juror's actual elimination", () => {
    const { game, f, j } = fixture(); j.betrayedBy = [f.id];
    game.episodes[0]?.entries.push({ kind: "tribal", title: "Round 6", text: "", out: j.id, votes: [{ voter: f.id, target: j.id }] });
    const result = answerJuryQuestion(game, f, j, question("turn"));
    expect(result.questionId).toBe("turn");
    expect(result.evidencePlayerId).toBe(j.id);
    expect(result.evidenceEntryTitle).toBe("Round 6");
  });
  it("does not invent a betrayal elimination when there is no evidence", () => {
    const { game, f, j } = fixture();
    expect(answerJuryQuestion(game, f, j, question("regret")).evidenceEntryTitle).toBeUndefined();
    expect(eligibleJuryQuestions(j, f).some((q) => q.topic === "betrayed")).toBe(false);
  });
  it("uses the final revote for the proudest vote evidence", () => {
    const { game, f, j } = fixture();
    game.episodes[0]?.entries.push({ kind: "tribal", title: "Revote round", text: "", out: j.id, votes: [{ voter: f.id, target: "c2" }], revote: [{ voter: f.id, target: j.id }] });
    const result = answerJuryQuestion(game, f, j, question("proud-vote"));
    expect(result.evidencePlayerId).toBe(j.id);
    expect(result.evidenceEntryTitle).toBe("Revote round");
  });
  it("names the strongest surviving rival when asked who should win if they lose", () => {
    const { game, f, j } = fixture();
    const rival = game.castaways[2]; if (!rival) throw new Error("Missing rival");
    game.finalists = [f.id, j.id, rival.id]; j.immunityWins = 1; rival.immunityWins = 4;
    expect(answerJuryQuestion(game, f, j, question("lose")).evidencePlayerId).toBe(rival.id);
  });
  it("selects the closest recorded relationship for a connection question", () => {
    const { game, f, j } = fixture(); game.rel[[f.id, j.id].sort().join("|")] = 90;
    expect(answerJuryQuestion(game, f, j, question("connection")).evidencePlayerId).toBe(j.id);
  });
  it("uses the concrete highest vote pileup for the lowest point", () => {
    const { game, f, j } = fixture();
    game.episodes[0]?.entries.push({ kind: "tribal", title: "Danger round", text: "", votes: [{ voter: j.id, target: f.id }, { voter: "c2", target: f.id, nullified: true }] });
    const result = answerJuryQuestion(game, f, j, question("lowest"));
    expect(result.evidenceCount).toBe(2); expect(result.evidenceEntryTitle).toBe("Danger round");
  });
  it("keeps all juror questions unique across completed seasons", () => {
    for (let i = 0; i < 10; i++) {
      const done = simulateToEnd(fixture().game);
      expect(done.phase).toBe("done");
      const ftc = done.episodes.flatMap((e) => e.entries).find((e) => e.title.startsWith("Final Tribal Council —"));
      expect(ftc?.details).toHaveLength(done.castaways.filter((c) => c.juror).length);
      const questions = ftc?.details?.map((d) => d.split("\n")[0]);
      expect(new Set(questions?.map((q) => q?.split(': "')[1])).size).toBe(questions?.length);
    }
  });
});