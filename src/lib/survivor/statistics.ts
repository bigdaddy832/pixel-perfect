import type { Castaway, GameState } from "./engine";

export function reachedMerge(game: GameState, player: Castaway): boolean {
  if (player.madeMerge !== undefined) return player.madeMerge;
  if (player.tribeId === "merged") return true;
  return game.episodes.flatMap((e) => e.entries).some((e) => e.title.startsWith("The Merge —") && e.details?.some((d) => d.includes(`${player.name} (`)));
}

export function seasonStatistics(game: GameState) {
  const entries = game.episodes.flatMap((e) => e.entries);
  const ballots = entries.filter((e) => e.kind === "tribal" || e.title === "Final Tribal Vote").flatMap((e) => [...(e.votes ?? []), ...(e.revote ?? [])]);
  return game.castaways.map((player) => {
    const rewards = player.rewardWins ?? entries.filter((e) => e.title.startsWith("Reward Challenge:") && e.text.startsWith(`${player.name} wins reward`)).length;
    const against = ballots.filter((v) => v.target === player.id);
    return {
      id: player.id, name: player.name, placement: player.placement ?? (player.id === game.winner ? 1 : 0),
      rewards, immunity: player.immunityWins, totalWins: rewards + player.immunityWins,
      votesAgainst: against.length, countedAgainst: against.filter((v) => !v.nullified).length,
      negated: against.filter((v) => v.nullified).length,
      votesCast: ballots.filter((v) => v.voter === player.id).length,
      correctVotes: player.correctVotes ?? 0, idolsPlayed: player.idolsPlayed ?? 0, advantagesPlayed: player.advPlayed ?? 0,
      juryVotes: game.juryVotes?.filter((v) => v.finalist === player.id).length ?? 0,
    };
  });
}

export type SeasonStatistic = ReturnType<typeof seasonStatistics>[number];