import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Setup } from "@/components/survivor/Setup";
import { Game } from "@/components/survivor/Game";
import type { GameState } from "@/lib/survivor/engine";

const SAVE_KEY = "survivor-sim-season";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Survivor Simulator — Outwit, Outplay, Outlast" },
      { name: "description", content: "Build a cast, set twists, and simulate a full Survivor season with alliances, idols, tribal councils and a jury vote." },
      { property: "og:title", content: "Survivor Simulator" },
      { property: "og:description", content: "Simulate or play a full Survivor season: alliances, idols, blindsides and Final Tribal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <ClientOnly fallback={<div className="min-h-screen" />}><Season /></ClientOnly>;
}

// The season is saved locally so a reload or app refresh never sends you back to setup.
function Season() {
  const [game, setGameState] = useState<GameState | null>(() => {
    try { const raw = localStorage.getItem(SAVE_KEY); return raw ? (JSON.parse(raw) as GameState) : null; } catch { return null; }
  });
  useEffect(() => {
    try { if (game) localStorage.setItem(SAVE_KEY, JSON.stringify(game)); else localStorage.removeItem(SAVE_KEY); } catch { /* storage full or blocked */ }
  }, [game]);
  return game ? <Game game={game} setGame={setGameState} onReset={() => setGameState(null)} /> : <Setup onStart={setGameState} />;
}
