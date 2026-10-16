import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
  const load = () => supabase.from("seasons").select("id,title,winner,cast_size,created_at").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-5xl">Season History</h1>
        <Link to="/" className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">Back to simulator</Link>
      </div>
      {!rows ? <p className="text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <p className="text-muted-foreground">No seasons yet. Finish a season while signed in and it will show up here.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
              <Link to="/history/$id" params={{ id: r.id }} className="flex-1">
                <p className="font-display text-2xl tracking-wide">{r.title}</p>
                <p className="text-sm text-muted-foreground">Winner: {r.winner ?? "—"} · {r.cast_size} castaways · {new Date(r.created_at).toLocaleDateString()}</p>
              </Link>
              <Button variant="ghost" size="sm" onClick={async () => { if (!window.confirm("Delete this season?")) return; await supabase.from("seasons").delete().eq("id", r.id); load(); }}>Delete</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
