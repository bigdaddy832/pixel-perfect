import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Game } from "@/components/survivor/Game";
import type { GameState } from "@/lib/survivor/engine";

export const Route = createFileRoute("/_authenticated/history_/$id")({
  head: () => ({
    meta: [
      { title: "Saved Season — Survivor Simulator" },
      { name: "description", content: "Replay the full log of a saved Survivor season." },
      { property: "og:title", content: "Saved Season — Survivor Simulator" },
      { property: "og:description", content: "Episode-by-episode recap of a simulated Survivor season." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavedSeason,
});

function SavedSeason() {
  const { id } = Route.useParams();
  const [game, setGame] = useState<GameState | null | undefined>(undefined);
  useEffect(() => {
    supabase.from("seasons").select("data").eq("id", id).maybeSingle().then(({ data }) => setGame((data?.data as unknown as GameState) ?? null));
  }, [id]);
  return (
    <div>
      <div className="px-4 pt-4"><Link to="/history" className="text-sm text-muted-foreground underline">← All seasons</Link></div>
      {game === undefined ? <p className="p-6 text-muted-foreground">Loading…</p> : game === null ? <p className="p-6">Season not found.</p> : <Game game={game} setGame={() => {}} onReset={() => {}} readOnly />}
    </div>
  );
}
