import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Setup } from "@/components/survivor/Setup";
import { Game } from "@/components/survivor/Game";
import type { GameState } from "@/lib/survivor/engine";
import { AccountBar } from "@/components/survivor/AccountBar";
import { supabase } from "@/integrations/supabase/client";

const SAVE_KEY = "survivor-sim-season";
const BACKUP_KEY = "survivor-sim-backup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Survivor Simulator — Outwit, Outplay, Outlast" },
      {
        name: "description",
        content:
          "Build a cast, set twists, and simulate a full Survivor season with alliances, idols, tribal councils and a jury vote.",
      },
      { property: "og:title", content: "Survivor Simulator" },
      {
        property: "og:description",
        content: "Simulate or play a full Survivor season: alliances, idols, blindsides and Final Tribal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={<div className="min-h-screen" />}>
      <Season />
    </ClientOnly>
  );
}

// The season is saved locally so a reload or app refresh never sends you back to setup.
function Season() {
  const [game, setGameState] = useState<GameState | null>(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(BACKUP_KEY);
      return raw ? (JSON.parse(raw) as GameState) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (game) {
        const serialized = JSON.stringify(game);
        localStorage.setItem(SAVE_KEY, serialized);
        // Keeps a backup copy that survives even if you reset or clear the active game
        localStorage.setItem(BACKUP_KEY, serialized);
      } else {
        localStorage.removeItem(SAVE_KEY);
      }
    } catch {
      /* storage full or blocked */
    }
  }, [game]);
  // Save finished seasons to the signed-in user's history (once per season).
  useEffect(() => {
    if (!game || game.phase !== "done" || (game as any).savedToHistory) return;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const winner = game.castaways.find((c) => c.id === game.winner)?.name ?? null;
      const marked = { ...game, savedToHistory: true } as GameState;
      const { error } = await supabase.from("seasons").insert({
        user_id: data.user.id,
        title:
          game.config.seasonTitle ??
          `Season: ${game.tribes
            .map((t) => t.name)
            .slice(0, 3)
            .join(" vs ")}`,
        winner,
        cast_size: game.castaways.length,
        data: marked as any,
      });
      if (!error) setGameState(marked);
    })();
  }, [game]);
  return (
    <>
      <AccountBar />
      {game ? (
        <Game game={game} setGame={setGameState} onReset={() => setGameState(null)} />
      ) : (
        <Setup onStart={setGameState} />
      )}
    </>
  );
}
