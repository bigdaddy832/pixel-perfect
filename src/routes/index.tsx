import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Setup } from "@/components/survivor/Setup";
import { Game } from "@/components/survivor/Game";
import type { GameState } from "@/lib/survivor/engine";
import { AccountBar } from "@/components/survivor/AccountBar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  clearLocalSeason,
  clearRemoteSeason,
  pickNewest,
  readLocalSeason,
  readRemoteSeason,
  stashPreviousSeason,
  writeLocalSeason,
  writeRemoteSeason,
  type SavedSeason,
} from "@/lib/survivor/season-autosave";

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
  const initial = useRef<SavedSeason | null>(readLocalSeason());
  const [game, setGameState] = useState<GameState | null>(() =>
    initial.current && initial.current.game.phase !== "done" ? initial.current.game : null,
  );
  const [lastSeason, setLastSeason] = useState<GameState | null>(() => initial.current?.game ?? null);
  const [saveWarning, setSaveWarning] = useState(false);
  // True once the player has acted this visit, so a background account sync never overrides their moves.
  const touched = useRef(false);
  const pendingRemote = useRef<SavedSeason | null>(null);
  const remoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setGame = (g: GameState | null) => {
    touched.current = true;
    setGameState(g);
  };

  const flushRemote = () => {
    if (remoteTimer.current) clearTimeout(remoteTimer.current);
    remoteTimer.current = null;
    const p = pendingRemote.current;
    pendingRemote.current = null;
    if (p) void writeRemoteSeason(p);
  };

  // Reconcile the browser copy with the account copy (on load and whenever the player signs in).
  useEffect(() => {
    const reconcile = async () => {
      const local = readLocalSeason();
      const remote = await readRemoteSeason();
      const newest = pickNewest(local, remote);
      if (!newest) return;
      if (newest === remote && remote && !touched.current) {
        writeLocalSeason(remote);
        setLastSeason(remote.game);
        if (remote.game.phase !== "done") setGameState(remote.game);
      } else if (newest === local && local && (!remote || local.savedAt > remote.savedAt)) {
        void writeRemoteSeason(local);
      }
    };
    void reconcile();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void reconcile();
    });
    const onHide = () => flushRemote();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
      flushRemote();
    };
  }, []);

  // Save every change. Clearing a save only ever happens through an explicit player action below.
  useEffect(() => {
    if (!game) return;
    const saved: SavedSeason = { game, savedAt: Date.now() };
    const ok = writeLocalSeason(saved);
    setLastSeason(game);
    pendingRemote.current = saved;
    if (remoteTimer.current) clearTimeout(remoteTimer.current);
    remoteTimer.current = setTimeout(flushRemote, 1200);
    if (!ok) {
      void supabase.auth.getSession().then(({ data }) => setSaveWarning(!data.session));
    } else setSaveWarning(false);
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

  const clearSave = () => {
    pendingRemote.current = null;
    if (remoteTimer.current) clearTimeout(remoteTimer.current);
    clearLocalSeason();
    void clearRemoteSeason();
  };

  const handleReset = () => {
    if (game) stashPreviousSeason(game);
    clearSave();
    setGame(null);
    setLastSeason(null);
  };

  const handleStart = (g: GameState) => {
    if (lastSeason && lastSeason.phase !== "done") {
      if (!window.confirm("You have a season in progress. Starting a new one will replace it. Continue?")) return;
      stashPreviousSeason(lastSeason);
    }
    setGame(g);
  };

  const handleResumeLastSeason = () => {
    if (lastSeason) setGame(lastSeason);
  };

  const handleDismissLastSeason = () => {
    if (lastSeason && lastSeason.phase !== "done" && !window.confirm("Discard your in-progress season?")) return;
    if (lastSeason) stashPreviousSeason(lastSeason);
    clearSave();
    setLastSeason(null);
  };

  return (
    <>
      <AccountBar />

      {saveWarning && (
        <div className="mx-auto mt-4 max-w-4xl px-4">
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm">
            Your browser couldn't save this season. Sign in so your progress is kept safely in your account.
          </div>
        </div>
      )}

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
        <Game game={game} setGame={setGame} onReset={handleReset} />
      ) : (
        <Setup onStart={handleStart} />
      )}
    </>
  );
}
