// @ts-nocheck -- indexing guarded by game invariants
import { useState } from "react";
import {
  CHALLENGE_STATS, SOCIAL_STATS, STAT_LABEL, TRIBE_COLORS, TRIBE_NAMES, MERGE_NAMES,
  defaultJury, defaultMergeAt, makeRoster, newGame, randomStats, randStat,
  type Config, type GameState, type StatKey, type Tribe,
} from "@/lib/survivor/engine";
import { StatPicker, TribeEditor } from "./shared";
import { Button } from "@/components/ui/button";

type Row = { name: string; stats: Record<StatKey, number>; tribeIndex: number };

export function Setup({ onStart }: { onStart: (g: GameState) => void }) {
  const [count, setCount] = useState(18);
  const [tribeCount, setTribeCount] = useState(2);
  const [finalSize, setFinalSize] = useState<2 | 3>(3);
  const [fire, setFire] = useState(true);
  const [jury, setJury] = useState(defaultJury(18));
  const [swap, setSwap] = useState(true);
  const [swapAt, setSwapAt] = useState(15);
  const [mergeAt, setMergeAt] = useState(defaultMergeAt(18, 8, 3));
  const [mergeTribe, setMergeTribe] = useState<Tribe>({ id: "merged", name: MERGE_NAMES[0], color: TRIBE_COLORS[2] });
  const [swapTribe, setSwapTribe] = useState<Tribe>({ id: "swap-third", name: TRIBE_NAMES[2], color: TRIBE_COLORS[2] });
  const [addSwapTribe, setAddSwapTribe] = useState(true);
  const [tribes, setTribes] = useState<Tribe[]>(() => [0, 1, 2].map((i) => ({ id: `t${i}`, name: TRIBE_NAMES[i], color: TRIBE_COLORS[i] })));
  const [roster, setRoster] = useState<Row[]>(() => makeRoster(18, 2));
  const [controlled, setControlled] = useState<number | null>(null);

  const recount = (n: number, tc = tribeCount, fs = finalSize) => {
    const j = defaultJury(n);
    setCount(n); setJury(j); setMergeAt(defaultMergeAt(n, j, fs)); setSwapAt(n - 3);
    setRoster((r) => makeRoster(n, tc, r).map((p, i) => ({ ...p, tribeIndex: i % tc })));
    setControlled(null);
  };
  const upd = (i: number, f: (r: Row) => Row) => setRoster((rs) => rs.map((r, j) => (j === i ? f(r) : r)));

  const start = () => {
    const active = tribes.slice(0, tribeCount);
    const cfg: Config = {
      playerCount: count, tribeCount, jurySize: jury, finalSize, fireAtF4: fire && finalSize === 3,
      swapEnabled: swap, swapAt, mergeAt: Math.min(mergeAt, count - 2), mergedName: mergeTribe.name, mergedColor: mergeTribe.color,
      swapTribe: swap && tribeCount === 2 && addSwapTribe ? { ...swapTribe } : undefined,
      controlledId: controlled === null ? null : `c${controlled}`,
    };
    onStart(newGame(cfg, active, roster.map((r, i) => ({ ...r, tribeIndex: i % tribeCount }))));
  };

  const sel = "rounded-md border border-input bg-secondary px-2 py-1.5 text-sm";
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Outwit · Outplay · Outlast</p>
        <h1 className="text-6xl md:text-7xl">Survivor Simulator</h1>
        <p className="mt-2 text-muted-foreground">Build your cast, set the twists, and watch the season unfold.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-2xl text-accent">Season Format</h2>
          <Field label="Castaways"><select className={sel} value={count} onChange={(e) => recount(+e.target.value)}>{[12, 16, 18, 20].map((n) => <option key={n}>{n}</option>)}</select></Field>
          <Field label="Starting tribes"><select className={sel} value={tribeCount} onChange={(e) => { setTribeCount(+e.target.value); recount(count, +e.target.value); }}>{[2, 3].map((n) => <option key={n}>{n}</option>)}</select></Field>
          <Field label="Jury size"><input type="number" min={3} max={count - 3} className={`${sel} w-20`} value={jury} onChange={(e) => setJury(+e.target.value)} /></Field>
          <Field label="Final"><select className={sel} value={finalSize} onChange={(e) => { const f = +e.target.value as 2 | 3; setFinalSize(f); setMergeAt(defaultMergeAt(count, jury, f)); }}><option value={3}>Final 3</option><option value={2}>Final 2</option></select></Field>
          {finalSize === 3 && <Field label="Fire-making at F4"><input type="checkbox" checked={fire} onChange={(e) => setFire(e.target.checked)} className="accent-primary size-4" /></Field>}
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-2xl text-accent">Twists</h2>
          <Field label="Tribe swap"><input type="checkbox" checked={swap} onChange={(e) => setSwap(e.target.checked)} className="accent-primary size-4" /></Field>
          {swap && <Field label="Swap at (remaining)"><input type="number" className={`${sel} w-20`} value={swapAt} onChange={(e) => setSwapAt(+e.target.value)} /></Field>}
          <Field label="Merge at (remaining)"><input type="number" className={`${sel} w-20`} value={mergeAt} onChange={(e) => setMergeAt(+e.target.value)} /></Field>
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-2xl text-accent">Tribes & Mode</h2>
          <h3 className="text-lg">Starting tribes</h3>
          <TribeEditor label="Starting tribe" tribes={tribes.slice(0, tribeCount)} onChange={(t) => setTribes((all) => all.map((x) => t.find((y) => y.id === x.id) ?? x))} />
          <h3 className="border-t pt-3 text-lg">Merge tribe</h3>
          <TribeEditor label="Merge tribe" tribes={[mergeTribe]} onChange={(t) => setMergeTribe(t[0])} />
          <Button variant="secondary" size="sm" onClick={() => setMergeTribe((t) => ({ ...t, name: MERGE_NAMES[Math.floor(Math.random() * MERGE_NAMES.length)] }))}>Suggest name</Button>
          {swap && tribeCount === 2 && <div className="space-y-2 border-t pt-3">
            <Field label="Add a third tribe at swap"><input type="checkbox" checked={addSwapTribe} onChange={(e) => setAddSwapTribe(e.target.checked)} className="accent-primary size-4" /></Field>
            {addSwapTribe && <TribeEditor label="Swap tribe" tribes={[swapTribe]} onChange={(t) => setSwapTribe(t[0])} />}
          </div>}
          <Field label="Play as">
            <select className={sel} value={controlled ?? ""} onChange={(e) => setControlled(e.target.value === "" ? null : +e.target.value)}>
              <option value="">Spectator (auto)</option>
              {roster.map((r, i) => <option key={i} value={i}>{r.name}</option>)}
            </select>
          </Field>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-3xl">The Cast</h2>
          <div className="flex gap-2">
            <button className="rounded-md bg-secondary px-3 py-2 text-sm hover:bg-muted" onClick={() => setRoster((r) => makeRoster(count, tribeCount).map((p, i) => ({ ...p, name: r[i].name })))}>Randomize all stats</button>
            <button className="rounded-md bg-secondary px-3 py-2 text-sm hover:bg-muted" onClick={() => recount(count)}>New random cast</button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: tribeCount }, (_, ti) => (
            <div key={ti} className="space-y-3">
              <div className="rounded-md px-3 py-1.5 font-display text-2xl tracking-wider" style={{ backgroundColor: tribes[ti].color, color: "#111" }}>{tribes[ti].name}</div>
              {roster.map((p, i) => i % tribeCount !== ti ? null : (
                <div key={i} className={`rounded-lg border bg-card p-3 ${controlled === i ? "border-primary torch-glow" : ""}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <input className="flex-1 rounded bg-transparent text-lg font-semibold outline-none focus:bg-secondary px-1" value={p.name} onChange={(e) => upd(i, (r) => ({ ...r, name: e.target.value }))} />
                    <button title="Randomize" className="rounded bg-secondary px-2 py-1 text-xs hover:bg-muted" onClick={() => upd(i, (r) => ({ ...r, stats: randomStats() }))}>🎲</button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {[...SOCIAL_STATS, ...CHALLENGE_STATS].map((k) => (
                      <StatPicker key={k} label={STAT_LABEL[k]} value={p.stats[k]} tone={SOCIAL_STATS.includes(k) ? "social" : "challenge"} onChange={(v) => upd(i, (r) => ({ ...r, stats: { ...r.stats, [k]: v } }))} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-4 mt-8 flex justify-center">
        <button onClick={start} className="rounded-full bg-primary px-10 py-4 font-display text-3xl tracking-widest text-primary-foreground torch-glow hover:scale-105 transition">Start the Season 🔥</button>
      </div>
      
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{label}</span>{children}</label>;
}
