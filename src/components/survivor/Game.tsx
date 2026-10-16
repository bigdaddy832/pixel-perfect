// @ts-nocheck -- indexing guarded by game invariants
import { useState } from "react";
import {
  ADVANTAGE_DESC, ADVANTAGE_LABEL, ADVANTAGE_NEEDS_TARGET, CHALLENGE_STATS, SOCIAL_STATS, STAT_LABEL, SEARCH_SPOTS, alive, byId, pendingDecision, simulateToEnd, step, tribeOf,
  type Castaway, type Decision, type GameState, type LogEntry, type Vote,
} from "@/lib/survivor/engine";
import { StatPicker, TribeEditor } from "./shared";
import { Button } from "@/components/ui/button";

const PHASE_LABEL: Record<string, string> = { camp: "Life at Camp", challenge: "Challenges", tribal: "Tribal Council", final_challenge: "Final Immunity", ftc: "Final Tribal Council", done: "Season Complete" };
const KIND_ICON: Record<string, string> = { camp: "🏕️", drama: "💢", alliance: "🤝", idol: "🗿", challenge: "🏆", tribal: "🔥", twist: "🌀", finale: "👑" };

export function Game({ game, setGame, onReset }: { game: GameState; setGame: (g: GameState) => void; onReset: () => void }) {
  const [editing, setEditing] = useState(false);
  const [dec, setDec] = useState<Decision>({});
  const pending = pendingDecision(game);
  const next = () => { setGame(step(game, dec)); setDec({}); };
  const winner = game.winner ? byId(game, game.winner) : null;
  const groups = [...new Set(alive(game).map((c) => c.tribeId))];
  const jury = game.castaways.filter((c) => c.juror);
  const boots = game.castaways.filter((c) => c.out).sort((a, b) => (b.placement ?? 0) - (a.placement ?? 0));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <header className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <div>
          <h1 className="text-4xl leading-none">Survivor Simulator</h1>
          <p className="text-sm text-muted-foreground">Day {game.day} · {PHASE_LABEL[game.phase]} · {alive(game).length} remain</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={game.phase === "done"} onClick={next} className="rounded-md bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-40 torch-glow">Next Phase ▶</Button>
          <Button variant="secondary" disabled={game.phase === "done"} onClick={() => setGame(simulateToEnd(game))} className="rounded-md bg-secondary px-4 py-2 text-sm hover:bg-muted disabled:opacity-40">Auto-Simulate to End ⏩</Button>
          <Button variant="secondary" onClick={() => setEditing(true)} className="rounded-md bg-secondary px-4 py-2 text-sm hover:bg-muted">Edit Stats / Tribes ✏️</Button>
          <Button variant="secondary" onClick={onReset} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">New Season</Button>
        </div>
      </header>

      {winner && (
        <div className="mb-6 rounded-2xl border-2 border-idol bg-card p-8 text-center torch-glow">
          <p className="uppercase tracking-[0.3em] text-idol">Sole Survivor</p>
          <h2 className="text-7xl">{winner.name}</h2>
          <p className="text-muted-foreground">Outwitted, outplayed and outlasted {game.castaways.length - 1} castaways.</p>
        </div>
      )}

      {pending && game.phase !== "done" && <DecisionPanel game={game} pending={pending} dec={dec} setDec={setDec} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          {groups.map((tid) => {
            const t = tribeOf(game, tid);
            if (!t) return null;
            return (
              <section key={tid}>
                <h2 className="mb-2 rounded-md px-3 py-1 text-2xl" style={{ backgroundColor: t.color, color: "#111" }}>{t.name}</h2>
                <div className="grid gap-2 sm:grid-cols-2">{alive(game).filter((c) => c.tribeId === tid).map((c) => <Card key={c.id} g={game} c={c} />)}</div>
              </section>
            );
          })}
          {jury.length > 0 && (
            <section className="rounded-xl border bg-card p-4">
              <h2 className="text-2xl text-accent">Jury ({jury.length}/{game.config.jurySize})</h2>
              <div className="mt-2 flex flex-wrap gap-2">{jury.map((j) => <span key={j.id} className="rounded-full bg-secondary px-3 py-1 text-sm">⚖️ {j.name}</span>)}</div>
            </section>
          )}
          {boots.length > 0 && (
            <section className="rounded-xl border bg-card p-4">
              <h2 className="text-2xl text-accent">Boot Order</h2>
              <ol className="mt-2 space-y-0.5 text-sm text-muted-foreground">{boots.map((b) => <li key={b.id}>{b.placement}th — {b.name}{b.juror ? " (juror)" : ""}</li>)}</ol>
            </section>
          )}
        </div>
        <div className="space-y-4">
          {[...game.episodes].reverse().filter((e) => e.entries.length).map((e, i) => (
            <details key={e.n} open={i < 2} className="rounded-xl border bg-card">
              <summary className="cursor-pointer px-4 py-3 font-display text-2xl tracking-wide">Episode {e.n}: "{e.title}"</summary>
              <div className="space-y-2 px-4 pb-4">{e.entries.map((en, k) => <Entry key={k} g={game} e={en} />)}</div>
            </details>
          ))}
        </div>
      </div>
      {editing && <EditModal game={game} setGame={setGame} onClose={() => setEditing(false)} />}
    </div>
  );
}

function Card({ g, c }: { g: GameState; c: Castaway }) {
  const als = g.alliances.filter((a) => a.members.includes(c.id));
  const me = g.config.controlledId === c.id;
  return (
    <div className={`rounded-lg border bg-card p-3 ${me ? "border-primary torch-glow" : ""} ${g.immune.includes(c.id) ? "ring-2 ring-idol" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">{c.name}{me && <span className="ml-1 text-xs text-primary">(YOU)</span>}</span>
        <span className="flex flex-wrap items-center justify-end gap-1 text-sm">{g.immune.includes(c.id) && "🛡️"}{c.idols > 0 && "🗿".repeat(c.idols)}{(c.advantages ?? []).map((a) => <span key={a} className="text-xs text-accent">{ADVANTAGE_LABEL[a]}</span>)}{c.immunityWins > 0 && <span className="ml-1 text-xs text-idol">{c.immunityWins}×🏆</span>}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted" title={`Mood ${c.mood}`}><div className="h-full bg-success" style={{ width: `${c.mood}%` }} /></div>
      <div className="mt-1.5 flex flex-wrap gap-1">{als.map((a) => <span key={a.id} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-accent">{a.name}</span>)}</div>
      <div className="mt-1.5 grid grid-cols-4 gap-1 text-center text-[10px] text-muted-foreground">
        {[...SOCIAL_STATS, ...CHALLENGE_STATS].map((k) => <span key={k} title={STAT_LABEL[k]}>{STAT_LABEL[k].slice(0, 3)} <b className="text-foreground">{c.stats[k]}</b></span>)}
      </div>
    </div>
  );
}

function Entry({ g, e }: { g: GameState; e: LogEntry }) {
  return (
    <div className={`rounded-lg bg-secondary/60 p-3 ${e.kind === "tribal" || e.kind === "finale" ? "border-l-4 border-primary" : ""}`}>
      <p className="font-semibold">{KIND_ICON[e.kind]} {e.title}</p>
      <p className="text-sm">{e.text}</p>
      {e.kind === "tribal" && e.details?.[0]?.startsWith("Final count:") && <p className="mt-2 text-sm font-semibold text-accent">{e.details[0]}</p>}
      {e.votes && <VoteChart g={g} votes={e.votes} label={e.kind === "finale" && g.juryVotes ? "Jury Votes" : "Votes"} />}
      {e.revote && e.revote.length > 0 && <VoteChart g={g} votes={e.revote} label="Revote" />}
      {e.details && e.details.length > 0 && (
        <details className="mt-1 text-sm text-muted-foreground"><summary className="cursor-pointer text-xs uppercase tracking-wider text-accent">Details</summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">{e.details.map((d, i) => <li key={i}>{d}</li>)}</ul></details>
      )}
    </div>
  );
}

function VoteChart({ g, votes, label }: { g: GameState; votes: Vote[]; label: string }) {
  return (
    <div className="mt-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {votes.map((v, i) => (
          <div key={i} className="vote-reveal rounded border bg-card px-2 py-1 text-xs" style={{ animationDelay: `${i * 0.12}s` }}>
            <span className="text-muted-foreground">{byId(g, v.voter).name} →</span>{" "}
            <span className={`font-display text-base tracking-wide ${v.nullified ? "line-through text-muted-foreground" : "text-primary"}`}>{byId(g, v.target).name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionPanel({ game, pending, dec, setDec }: { game: GameState; pending: NonNullable<ReturnType<typeof pendingDecision>>; dec: Decision; setDec: (d: Decision) => void }) {
  const sel = "rounded-md border border-input bg-secondary px-2 py-1.5 text-sm";
  if (!game.config.controlledId) return null;
  const me = byId(game, game.config.controlledId);
  return (
    <div className="mb-6 rounded-xl border-2 border-primary bg-card p-4">
      <h2 className="text-2xl text-primary">Your Decision, {me.name}</h2>
      {pending.kind === "camp" && (
        <div className="mt-2 space-y-3">
        <label className="flex flex-wrap items-center gap-2 text-sm">Approach someone to align with (optional):
          <select className={sel} value={dec.allyWith ?? ""} onChange={(e) => setDec({ ...dec, allyWith: e.target.value || undefined })}>
            <option value="">— Lay low —</option><option value="__random__">Randomize who I approach</option>{pending.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select></label>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={dec.searchIdol ?? false} onChange={(e) => setDec({ ...dec, searchIdol: e.target.checked })} className="size-4 accent-primary" />Search for an idol</label>
            {dec.searchIdol && <label className="flex flex-wrap items-center gap-2">Search location:
              <select className={sel} value={dec.searchSpot ?? ""} onChange={(e) => setDec({ ...dec, searchSpot: e.target.value || undefined })}>
                <option value="">Random location</option>{SEARCH_SPOTS.map((spot) => <option key={spot} value={spot}>{spot}</option>)}
              </select>
            </label>}
          </div>
        </div>
      )}
      {pending.kind === "tribal" && (
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">Vote for:
            <select className={sel} value={dec.vote ?? ""} onChange={(e) => setDec({ ...dec, vote: e.target.value || undefined })}>
              <option value="">— Let instinct decide —</option>{pending.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select></label>
          {pending.hasIdol && (
            <label className="flex items-center gap-2">🗿 Play idol on:
              <select className={sel} value={dec.idol ?? ""} onChange={(e) => setDec({ ...dec, idol: e.target.value })}>
                <option value="">Keep it</option>{pending.idolTargets.map((o) => <option key={o.id} value={o.id}>{o.id === me.id ? "Myself" : o.name}</option>)}
              </select></label>
          )}
          {pending.advantages.length > 0 && (
            <label className="flex items-center gap-2">Play advantage:
              <select className={sel} value={dec.advantage ?? ""} onChange={(e) => setDec({ ...dec, advantage: e.target.value || undefined, advantageTarget: undefined })}>
                <option value="">Keep it</option>{pending.advantages.map((a) => <option key={a} value={a}>{ADVANTAGE_LABEL[a]}</option>)}
              </select></label>
          )}
          {dec.advantage && ADVANTAGE_NEEDS_TARGET.includes(dec.advantage) && (
            <label className="flex items-center gap-2">On:
              <select className={sel} value={dec.advantageTarget ?? ""} onChange={(e) => setDec({ ...dec, advantageTarget: e.target.value || undefined })}>
                <option value="">— Choose —</option>{pending.idolTargets.concat(pending.options).filter((o, i, arr) => o.id !== me.id && arr.findIndex((x) => x.id === o.id) === i).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select></label>
          )}
          {dec.advantage && <p className="w-full text-xs text-muted-foreground">{ADVANTAGE_DESC[dec.advantage]}</p>}
        </div>
      )}
    </div>
  );
}

function EditModal({ game, setGame, onClose }: { game: GameState; setGame: (g: GameState) => void; onClose: () => void }) {
  const upd = (f: (g: GameState) => void) => { const g = structuredClone(game); f(g); setGame(g); };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="w-full max-w-4xl rounded-xl border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-3xl">Edit Stats & Tribes</h2><Button variant="secondary" onClick={onClose} className="rounded-md bg-primary px-4 py-1.5 text-primary-foreground">Done</Button></div>
        <h3 className="text-xl text-accent">Tribes</h3>
        <TribeEditor tribes={game.tribes} onChange={(t) => upd((g) => { g.tribes = t; const m = t.find((x) => x.id === "merged"); if (m) { g.config.mergedName = m.name; g.config.mergedColor = m.color; } })} />
        {!game.merged && (
          <div className="mt-3"><h3 className="mb-2 text-xl text-accent">Future merge tribe</h3>
            <TribeEditor label="Future merge tribe" tribes={[{ id: "merged", name: game.config.mergedName, color: game.config.mergedColor }]} onChange={(t) => upd((g) => { g.config.mergedName = t[0].name; g.config.mergedColor = t[0].color; })} />
          </div>
        )}
        {!game.swapped && game.config.swapTribe && <div className="mt-3"><h3 className="mb-2 text-xl text-accent">Future swap tribe</h3>
          <TribeEditor label="Future swap tribe" tribes={[game.config.swapTribe]} onChange={(t) => upd((g) => { g.config.swapTribe = t[0]; })} />
        </div>}
        <h3 className="mt-5 text-xl text-accent">Castaways</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alive(game).map((c) => (
            <div key={c.id} className="rounded-lg bg-secondary/60 p-3">
              <input className="mb-1 w-full rounded bg-transparent font-semibold outline-none focus:bg-secondary" value={c.name} onChange={(e) => upd((g) => { byId(g, c.id).name = e.target.value; })} />
              {[...SOCIAL_STATS, ...CHALLENGE_STATS].map((k) => (
                <StatPicker key={k} label={STAT_LABEL[k]} value={c.stats[k]} tone={SOCIAL_STATS.includes(k) ? "social" : "challenge"} onChange={(v) => upd((g) => { byId(g, c.id).stats[k] = v; })} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
