import { useState } from "react";
import type { GameState } from "@/lib/survivor/engine";
import { seasonStatistics, type SeasonStatistic } from "@/lib/survivor/statistics";
import { Button } from "@/components/ui/button";

const columns: { key: keyof Omit<SeasonStatistic, "id" | "name">; label: string }[] = [
  { key: "rewards", label: "Individual rewards" }, { key: "immunity", label: "Immunity wins" },
  { key: "totalWins", label: "Total individual wins" }, { key: "votesAgainst", label: "Votes against (all)" },
  { key: "countedAgainst", label: "Votes counted" }, { key: "negated", label: "Votes negated" },
  { key: "votesCast", label: "Votes cast" }, { key: "correctVotes", label: "Correct tribals" },
  { key: "idolsPlayed", label: "Idols played" }, { key: "advantagesPlayed", label: "Advantages played" },
  { key: "juryVotes", label: "Jury votes" },
];

export function SeasonStatistics({ game }: { game: GameState }) {
  const [sort, setSort] = useState<keyof SeasonStatistic>("totalWins");
  const rows = seasonStatistics(game).sort((a, b) => Number(b[sort]) - Number(a[sort]) || a.name.localeCompare(b.name));
  const favorite = game.castaways.find((c) => c.id === game.fanFavorite);
  return (
    <section className="mb-8 border-y py-5">
      <h2 className="mb-4 text-3xl text-accent">Season Statistics</h2>
      <div className="mb-4 grid gap-x-6 gap-y-2 sm:grid-cols-3">
        {columns.slice(0, 3).map((column) => {
          const best = Math.max(0, ...rows.map((row) => row[column.key]));
          return <p key={column.key} className="text-sm"><span className="block text-muted-foreground">Most {column.label.toLowerCase()}</span><b>{best ? rows.filter((r) => r[column.key] === best).map((r) => r.name).join(", ") : "—"}</b> · {best}</p>;
        })}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="border-b"><th className="min-w-36 bg-background px-3 py-2 text-left">Castaway</th>{columns.map((column) => <th key={column.key} className="min-w-24 px-1 py-2"><Button variant={sort === column.key ? "secondary" : "ghost"} size="sm" onClick={() => setSort(column.key)} className="h-auto w-full whitespace-normal text-xs">{column.label}{sort === column.key ? " ↓" : ""}</Button></th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-b"><th className="px-3 py-3 text-left font-semibold">{row.name}</th>{columns.map((column) => <td key={column.key} className="px-2 py-3 text-center tabular-nums">{row[column.key]}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {favorite && <div className="mt-6 border-t pt-4"><p className="text-sm uppercase tracking-wider text-idol">Fan Favorite Award</p><h3 className="text-4xl">{favorite.name}</h3><p className="text-sm text-muted-foreground">The simulated fan vote celebrates their personality, relationships, and memorable season.</p></div>}
    </section>
  );
}