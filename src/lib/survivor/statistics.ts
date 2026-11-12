import type { Castaway, GameState } from "./engine";

export function reachedMerge(game: GameState, player: Castaway): boolean {
  if (player.madeMerge !== undefined) return player.madeMerge;
  if (player.tribeId === "merged") return true;
  return game.episodes.flatMap((e) => e.entries).some((e) => e.title.startsWith("The Merge —") && e.details?.some((d) => d.includes(`${player.name} (`)));
}

// "1st", "2nd", "3rd", "11th", "21st" ...
export function ordinal(n: number) {
  const v = Math.abs(n) % 100;
  const suffix = v >= 11 && v <= 13 ? "th" : (["th", "st", "nd", "rd"][Math.abs(n) % 10] ?? "th");
  return `${n}${suffix}`;
}

// Final ranking for a finished season: winner first, then the other finalists by
// jury votes received, then everyone else by the placement recorded when they
// were voted out. Every castaway gets a unique 1-based placement.
export function finalPlacements(game: GameState): Record<string, number> {
  const juryCounts: Record<string, number> = {};
  game.juryVotes?.forEach((v) => (juryCounts[v.finalist] = (juryCounts[v.finalist] ?? 0) + 1));
  const nameOf = (id: string) => game.castaways.find((c) => c.id === id)?.name ?? id;
  const finalists = game.finalists ?? game.castaways.filter((c) => !c.out).map((c) => c.id);
  const ranked: string[] = [];
  if (game.winner) ranked.push(game.winner);
  ranked.push(
    ...finalists
      .filter((id) => id !== game.winner)
      .sort((a, b) => (juryCounts[b] ?? 0) - (juryCounts[a] ?? 0) || nameOf(a).localeCompare(nameOf(b))),
  );
  ranked.push(
    ...game.castaways
      .filter((c) => !ranked.includes(c.id))
      .sort((a, b) => (a.placement ?? 9999) - (b.placement ?? 9999) || a.name.localeCompare(b.name))
      .map((c) => c.id),
  );
  const placements: Record<string, number> = {};
  ranked.forEach((id, i) => (placements[id] = i + 1));
  return placements;
}

export function seasonStatistics(game: GameState) {
  const placements = finalPlacements(game);
  const entries = game.episodes.flatMap((e) => e.entries);
  const ballots = entries.filter((e) => e.kind === "tribal" || e.title === "Final Tribal Vote").flatMap((e) => [...(e.votes ?? []), ...(e.revote ?? [])]);
  return game.castaways.map((player) => {
    const rewards = player.rewardWins ?? entries.filter((e) => e.title.startsWith("Reward Challenge:") && e.text.startsWith(`${player.name} wins reward`)).length;
    const against = ballots.filter((v) => v.target === player.id);
    return {
      id: player.id, name: player.name, placement: placements[player.id] ?? 0,
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