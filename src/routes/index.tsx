import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Setup } from "@/components/survivor/Setup";
import { Game } from "@/components/survivor/Game";
import type { GameState } from "@/lib/survivor/engine";

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
  const [game, setGame] = useState<GameState | null>(null);
  return game ? <Game game={game} setGame={setGame} onReset={() => setGame(null)} /> : <Setup onStart={setGame} />;
}
