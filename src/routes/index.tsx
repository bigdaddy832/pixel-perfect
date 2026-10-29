import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Setup } from "@/components/survivor/Setup";
import { Game } from "@/components/survivor/Game";
import type { GameState } from "@/lib/survivor/engine";
import { AccountBar } from "@/components/survivor/AccountBar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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

function Season() {
  const [game, setGameState] = useState<GameState | null>(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const parsed = raw ? (JSON.parse(raw) as GameState) : null;
      return parsed && parsed.phase !== "done" ? parsed : null;
    } catch {
      return null;
    }
  });

  const [lastSeason, setLastSeason] = useState<GameState | null>(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(BACKUP_KEY);
      return raw ? (JSON.parse(raw) as GameState) : null;
    } catch {
      return null;
    }
  });

  // Always keep localStorage strictly in sync with the active game
  useEffect(() => {
    try {
      if (game) {
        const serialized = JSON.stringify(game);
        localStorage.setItem(SAVE_KEY, serialized);
        localStorage.removeItem(BACKUP_KEY);
        setLastSeason(game);
      } else {
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(BACKUP_KEY);
      }
    } catch {
      /* storage full or blocked */
    }
  }, [game]);

  // Save finished seasons to the signed-in user's history
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

  const handleResumeLastSeason = () => {
    if (lastSeason) {
      setGameState(lastSeason);
    }
  };

  const handleDismissLastSeason = () => {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(BACKUP_KEY);
    } catch {}
    setLastSeason(null);
  };

  return (
    <>
      <AccountBar />

      {/* Unified Season Banner */}
      {!game && lastSeason && (
        <div className="mx-auto mt-4 max-w-4xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-card/90 p-4 shadow-lg backdrop-blur">
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${
                  lastSeason.phase === "done" ? "bg-primary" : "bg-emerald-500 animate-pulse"
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    {lastSeason.phase === "done" ? "Finished Season" : "Season In Progress"}
                  </span>
                  <h3 className="font-display text-xl text-foreground">
                    {lastSeason.config.seasonTitle ?? "Survivor Season"}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lastSeason.phase === "done"
                    ? `Winner: ${lastSeason.castaways.find((c) => c.id === lastSeason.winner)?.name ?? "TBD"} · ${lastSeason.castaways.length} castaways`
                    : `Episode ${lastSeason.episodes.length + 1} · Day ${lastSeason.day} · ${
                        lastSeason.castaways.filter((c) => !c.out).length
                      } castaways remaining`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleResumeLastSeason} className="font-semibold">
                ▶ {lastSeason.phase === "done" ? "View Last Season" : "Resume Season"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissLastSeason}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Discard Autosave ✕
              </Button>
            </div>
          </div>
        </div>
      )}

      {game ? (
        <Game game={game} setGame={setGameState} onReset={() => setGameState(null)} />
      ) : (
        <Setup onStart={setGameState} />
      )}
    </>
  );
}
