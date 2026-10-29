import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { GameState } from "@/lib/survivor/engine";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Season History — Survivor Simulator" },
      { name: "description", content: "Every Survivor season you've simulated, with winners and full episode logs." },
      { property: "og:title", content: "Season History — Survivor Simulator" },
      { property: "og:description", content: "Look back at the seasons you've simulated." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: History,
});

type Row = { id: string; title: string; winner: string | null; cast_size: number; created_at: string };

function History() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [activeSeason, setActiveSeason] = useState<GameState | null>(null);

  const load = () =>
    supabase
      .from("seasons")
      .select("id,title,winner,cast_size,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));

  useEffect(() => {
    load();
    try {
      const raw = localStorage.getItem("survivor-sim-season");
      if (raw) {
        const parsed = JSON.parse(raw) as GameState;
        if (parsed && parsed.phase !== "done") {
          setActiveSeason(parsed);
        }
      }
    } catch {}
  }, []);

  const handleDiscardActive = () => {
    if (!window.confirm("Discard current in-progress season?")) return;
    try {
      localStorage.removeItem("survivor-sim-season");
      localStorage.removeItem("survivor-sim-backup");
    } catch {}
    setActiveSeason(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-5xl">Season History</h1>
        <Link to="/" className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">
          Back to simulator
        </Link>
      </div>

      {/* Active in-progress season banner */}
      {activeSeason && (
        <div className="mb-6 rounded-xl border-2 border-primary/50 bg-primary/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground uppercase">
                  Current Season (In Progress)
                </span>
                <p className="font-display text-2xl tracking-wide">
                  {activeSeason.config.seasonTitle ?? "Survivor Season"}
                </p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Episode {activeSeason.episodes.length + 1} · Day {activeSeason.day} ·{" "}
                {activeSeason.castaways.filter((c) => !c.out).length} of {activeSeason.castaways.length} castaways
                remaining
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Continue Playing →
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscardActive}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}

      {!rows ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : rows.length === 0 && !activeSeason ? (
        <p className="text-muted-foreground">
          No seasons yet. Finish a season while signed in and it will show up here.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
              <Link to="/history/$id" params={{ id: r.id }} className="flex-1">
                <p className="font-display text-2xl tracking-wide">{r.title}</p>
                <p className="text-sm text-muted-foreground">
                  Winner: {r.winner ?? "—"} · {r.cast_size} castaways · {new Date(r.created_at).toLocaleDateString()}
                </p>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (!window.confirm("Delete this season?")) return;
                  await supabase.from("seasons").delete().eq("id", r.id);
                  load();
                }}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
