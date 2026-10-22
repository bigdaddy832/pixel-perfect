import type { Castaway, GameState } from "./engine";

export type JuryTopic = "betrayed" | "strategy" | "angry" | "social" | "challenge" | "general";
export const JURY_QUESTIONS = [
  { id: "reward-lie", topic: "betrayed", text: "You looked me in the eye and lied. Why should I reward that?" },
  { id: "friendship", topic: "betrayed", text: "Was our friendship ever real, or was I just a number?" },
  { id: "regret", topic: "betrayed", text: "Do you regret how you got me out?" },
  { id: "turn", topic: "betrayed", text: "Tell me the moment you decided to turn on me." },
  { id: "big-move", topic: "strategy", text: "Name one big move that was yours and yours alone." },
  { id: "proud-vote", topic: "strategy", text: "Walk me through the vote you're proudest of." },
  { id: "threat", topic: "strategy", text: "Who was the biggest threat you let slide, and why?" },
  { id: "mistake", topic: "strategy", text: "What's one mistake you made, and how did you recover?" },
  { id: "win-moment", topic: "strategy", text: "When did you first think you could win?" },
  { id: "anger", topic: "angry", text: "I'm not asking a question. I'm just telling you how angry I am." },
  { id: "respect", topic: "angry", text: "Why should I respect the way you played?" },
  { id: "comparison", topic: "angry", text: "Give me one reason not to vote for the person next to you." },
  { id: "personal", topic: "social", text: "Tell me something real about yourself that you hid out here." },
  { id: "connection", topic: "social", text: "Who out here do you think you really connected with?" },
  { id: "lesson", topic: "social", text: "What did you learn about yourself on this island?" },
  { id: "hide-threat", topic: "social", text: "How did you keep people from seeing you as a threat?" },
  {
    id: "immunity-impact",
    topic: "challenge",
    text: "Did winning immunity help your game, or did it just paint a target on you?",
  },
  { id: "without-wins", topic: "challenge", text: "Would you still be sitting there without your challenge wins?" },
  { id: "deserve", topic: "general", text: "Why do you deserve this more than the others?" },
  { id: "three-words", topic: "general", text: "Describe your game in three words." },
  { id: "again", topic: "general", text: "What would you do differently if you played again?" },
  { id: "best-other", topic: "general", text: "Who would you say played the best game besides yourself?" },
  { id: "family", topic: "general", text: "What's one thing you'd say to your family watching at home?" },
  { id: "lose", topic: "general", text: "If you lose tonight, who should win and why?" },
  { id: "apology", topic: "general", text: "Which jury member do you owe an apology to?" },
  { id: "lowest", topic: "general", text: "What was your lowest point out here?" },
] as const satisfies readonly { id: string; topic: JuryTopic; text: string }[];
export type JuryQuestion = (typeof JURY_QUESTIONS)[number];

export function eligibleJuryQuestions(j: Castaway, f: Castaway) {
  return JURY_QUESTIONS.filter(
    (q) => (q.topic !== "betrayed" || j.betrayedBy.includes(f.id)) && (q.topic !== "challenge" || f.immunityWins > 0),
  );
}

// Every answer is keyed to the selected question, never inferred from the juror's personality.
export function answerJuryQuestion(s: GameState, f: Castaway, j: Castaway, question: JuryQuestion) {
  const entries = s.episodes.flatMap((e) => e.entries);
  const tribals = entries.filter((e) => e.kind === "tribal" || e.title === "Final Tribal Vote");
  const ballots = (e: (typeof entries)[number]) => (e.revote?.length ? e.revote : (e.votes ?? []));
  const relation = (c: Castaway) => s.rel[[f.id, c.id].sort().join("|")] ?? 0;
  const named = (id?: string) => s.castaways.find((c) => c.id === id)?.name ?? "the eliminated player";
  const jurorExit = tribals.find((e) => e.out === j.id);
  const votedForJuror =
    jurorExit && ballots(jurorExit).some((v) => v.voter === f.id && v.target === j.id && !v.nullified);
  const successfulVote = tribals.find(
    (e) => e.out && ballots(e).some((v) => v.voter === f.id && v.target === e.out && !v.nullified),
  );
  const missedVote = tribals.find((e) => e.out && ballots(e).some((v) => v.voter === f.id && v.target !== e.out));
  const idolSave = tribals.find((e) => e.votes?.some((v) => v.target === f.id && v.nullified));
  const bond = s.castaways.filter((c) => c.id !== f.id && relation(c) > 8).sort((a, b) => relation(b) - relation(a))[0];
  const others = s.castaways.filter((c) => c.id !== f.id);
  const score = (c: Castaway) => c.immunityWins + (c.correctVotes ?? 0);
  const bestOther = [...others].sort((a, b) => score(b) - score(a))[0];
  const otherFinalist = others
    .filter((c) => (s.finalists ?? s.castaways.filter((p) => !p.out).map((p) => p.id)).includes(c.id))
    .sort((a, b) => score(b) - score(a))[0];
  const apology = s.castaways.find((c) => c.juror && c.betrayedBy.includes(f.id));
  const danger = tribals
    .map((e) => ({ e, count: (e.votes ?? []).filter((v) => v.target === f.id).length }))
    .sort((a, b) => b.count - a.count)[0];
  const resume = `I won ${f.immunityWins} immunit${f.immunityWins === 1 ? "y" : "ies"} and cast ${f.correctVotes ?? 0} votes for the player who went home`;
  const exitExplanation = votedForJuror
    ? `At the Tribal Council where you left, I wrote your name down. I chose my path forward over our alliance, and I own that decision. I can't pretend I know how the game would have ended if I'd kept you.`
    : `I accept that you felt betrayed by me. The recorded ballots don't show me casting a counted vote for you at your elimination, so I won't invent a deciding vote or a secret turning point.`;
  const mistake = missedVote
    ? `At ${missedVote.title}, I voted for ${named(ballots(missedVote).find((v) => v.voter === f.id)?.target)}, but ${named(missedVote.out)} went home. I misread the outcome. Reaching this seat means I survived that mistake, not that I controlled every vote afterward.`
    : "I can't point to a recorded vote where I backed the wrong elimination. But I could have been more open about my decisions instead of leaving people to interpret them after the fact.";
  const rivalCase = (c: Castaway) =>
    `${c.name}, with ${c.immunityWins} immunity wins and ${c.correctVotes ?? 0} correct elimination votes`;
  let reply: string;
  let evidencePlayerId: string | undefined;
  let evidenceEntryTitle: string | undefined;
  let evidenceCount: number | undefined;
  switch (question.id) {
    case "reward-lie":
      reply = `${exitExplanation} You don't owe me a reward for lying. I'm asking you to weigh that choice as gameplay, while holding me accountable for how I treated you.`;
      evidencePlayerId = j.id;
      evidenceEntryTitle = jurorExit?.title;
      break;
    case "friendship":
      reply =
        relation(j) > 8
          ? `Our connection was real to me; I still feel close to you. That doesn't excuse choosing the game over your trust. You weren't just a number, even though my decisions made you feel that way.`
          : `I won't claim we had an unbreakable friendship when our relationship ended this strained. I let the game come before your trust, and I understand why that makes our connection hard to believe.`;
      evidencePlayerId = j.id;
      break;
    case "regret":
      reply = `I regret the hurt and how I handled your trust. ${exitExplanation} I would be more direct with you, even if I still made a decision that helped me reach the end.`;
      evidencePlayerId = j.id;
      evidenceEntryTitle = jurorExit?.title;
      break;
    case "turn":
      reply = `${exitExplanation} That's the concrete moment I can point to, rather than inventing a private conversation that wasn't recorded.`;
      evidencePlayerId = j.id;
      evidenceEntryTitle = jurorExit?.title;
      break;
    case "big-move":
      reply = idolSave
        ? `The clearest concrete turning point was ${idolSave.title}: an idol negated ${(idolSave.votes ?? []).filter((v) => v.target === f.id && v.nullified).length} votes against me. I benefited from that play, but the ballots alone don't prove I masterminded it alone.`
        : `I can't honestly claim a move was mine and mine alone. ${successfulVote ? `I helped vote out ${named(successfulVote.out)} at ${successfulVote.title}, but that required other people's votes too.` : "Reaching the end isn't proof that I personally engineered a big move."}`;
      evidenceEntryTitle = (idolSave ?? successfulVote)?.title;
      break;
    case "proud-vote":
      reply = successfulVote
        ? `At ${successfulVote.title}, I voted for ${named(successfulVote.out)}. The final ballots sent them home, so that is a decision I can stand behind. It was a shared outcome, not something I can claim alone.`
        : "I don't have a recorded correct elimination vote to claim as my proudest. I'd rather admit that than take credit for someone else's vote.";
      evidencePlayerId = successfulVote?.out;
      evidenceEntryTitle = successfulVote?.title;
      break;
    case "threat":
      reply = bestOther
        ? `Looking back, I'd name ${rivalCase(bestOther)} as a threat I didn't eliminate before their run ended. I won't pretend every night offered me a chance to vote them out; leaving a strong competitor in the game was a risk.`
        : "There isn't another player's recorded game for me to compare fairly.";
      evidencePlayerId = bestOther?.id;
      break;
    case "mistake":
      reply = mistake;
      evidenceEntryTitle = missedVote?.title;
      break;
    case "win-moment":
      reply = `Reaching the final ${s.config.finalSize} was the first point where I could honestly see a winning path: I could finally make my case directly to you. Before then, I still had to survive another elimination.`;
      break;
    case "anger":
      reply =
        "I hear how angry you are. I'm not going to answer that with a list of wins or tell you to get over it. I'm sorry for the hurt my decisions caused, and I'll listen.";
      evidencePlayerId = j.id;
      break;
    case "respect":
      reply = `${resume}. Those are results you can check, not a claim that I played perfectly. Respecting my decisions doesn't have to mean approving of how each one felt.`;
      break;
    case "comparison":
    case "deserve":
      reply = `${resume}. That's the case for my game, not proof that the other finalists deserve less. I'd ask you to compare our actual decisions and results rather than reward the loudest claim.`;
      break;
    case "personal":
      reply =
        "I hid how much I wanted everyone's approval. Admitting that felt risky while we were competing; sitting here, I can admit that losing someone's trust mattered to me.";
      break;
    case "connection":
      reply = bond
        ? `I'd name ${bond.name}. Of the relationships I still have, that is one of my strongest. A close connection doesn't mean we agreed on every vote, but it mattered beyond the numbers.`
        : "I don't have a strong relationship left that I can honestly present as my closest bond. That's a weakness in my social game, and I own it.";
      evidencePlayerId = bond?.id;
      break;
    case "lesson":
      reply =
        "I learned that wanting to be liked and wanting to win can pull me in different directions. I have to own my choices instead of expecting people to forgive them just because this is a game.";
      break;
    case "hide-threat":
      reply =
        f.immunityWins > 1
          ? `With ${f.immunityWins} immunity wins, I couldn't really hide my challenge ability. I had to survive while being visible, rather than pretend everyone saw me as harmless.`
          : `With ${f.immunityWins} immunity wins, I wasn't dominating the challenges. That gave me a less visible profile, though I can't claim to know exactly how threatening everyone thought I was.`;
      evidenceCount = f.immunityWins;
      break;
    case "immunity-impact":
      reply = `My ${f.immunityWins} immunity win${f.immunityWins === 1 ? "" : "s"} guaranteed safety on those nights, so they helped. They also made my ability visible. I can prove the safety, but not that I would otherwise have gone home.`;
      evidenceCount = f.immunityWins;
      break;
    case "without-wins":
      reply = `I can't promise I'd be here without my ${f.immunityWins} immunity win${f.immunityWins === 1 ? "" : "s"}. Those necklaces removed me as a voting option. My other decisions mattered too, but the alternate outcome isn't something I can know.`;
      evidenceCount = f.immunityWins;
      break;
    case "three-words":
      reply = "Adaptable, imperfect, persistent.";
      break;
    case "again":
      reply = `I'd communicate more honestly before making a decision that hurt an ally. ${mistake}`;
      evidenceEntryTitle = missedVote?.title;
      break;
    case "best-other":
    case "lose": {
      const candidate = question.id === "lose" ? otherFinalist : bestOther;
      reply = candidate
        ? `I'd choose ${rivalCase(candidate)}. Those results give me a concrete reason to respect their game${question.id === "lose" ? " and support them if I lose tonight" : " besides my own"}.`
        : "I can't name another eligible player from the recorded finalists.";
      evidencePlayerId = candidate?.id;
      break;
    }
    case "family":
      reply =
        "I'd tell my family: thank you for supporting me. I hope you're proud that I kept going, and I want to talk honestly about the choices I made, not just whether I won.";
      break;
    case "apology":
      reply = apology
        ? `I owe ${apology.name} an apology. They felt betrayed by me, and reaching the end doesn't erase that. I'm sorry for putting my path through the game ahead of their trust.`
        : "No juror has a recorded betrayal by me, but that doesn't mean I hurt nobody. I'd listen to anyone who felt dismissed and apologize for that, rather than manufacture a betrayal to answer this.";
      evidencePlayerId = apology?.id;
      break;
    case "lowest":
      reply =
        danger && danger.count > 0
          ? `My lowest point was ${danger.e.title}, when ${danger.count} ballot${danger.count === 1 ? " was" : "s were"} cast against me. Seeing my name written down made how close I was to leaving feel real.`
          : "The hardest part was reaching the end unsure whether the people on this jury could still trust me. I don't have a recorded vote pileup against me to invent as a dramatic low point.";
      evidenceEntryTitle = danger && danger.count > 0 ? danger.e.title : undefined;
      evidenceCount = danger?.count ?? 0;
      break;
  }
  const reaction =
    relation(j) > 6
      ? `${j.name} nods approvingly`
      : j.betrayedBy.includes(f.id) && j.stats.temperament <= 2
        ? `${j.name} rolls their eyes skeptically`
        : `${j.name} listens intently`;
  const directlyAnswered =
  question.topic === "betrayed"
    ? Boolean(jurorExit)
    : true;

const answerQuality: "strong" | "mixed" | "weak" =
  directlyAnswered && (evidenceEntryTitle || evidencePlayerId || evidenceCount !== undefined)
    ? "strong"
    : directlyAnswered
      ? "mixed"
      : "weak";

return {
  reply,
  reaction,
  questionId: question.id,
  evidencePlayerId,
  evidenceEntryTitle,
  evidenceCount,
  directlyAnswered,
  answerQuality,
};

