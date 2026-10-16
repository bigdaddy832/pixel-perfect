// @ts-nocheck -- indexing guarded by game invariants
import { useState } from "react";
import {
  ADVANTAGE_DESC, ADVANTAGE_LABEL, ADVANTAGE_NEEDS_TARGET, CHALLENGE_STATS, SOCIAL_STATS, STAT_LABEL, SEARCH_SPOTS, alive, byId, finalistSpeeches, pendingDecision, simulateToEnd, step, tribeOf, tribalTargets, attendees, getRel, amuletHolders, amuletDescription, TALK_TOPICS,
  type Castaway, type Decision, type GameState, type LogEntry, type Vote,
} from "@/lib/survivor/engine";
import { StatPicker, TribeEditor } from "./shared";
import { Button } from "@/components/ui/button";
import { SeasonStatistics } from "./SeasonStatistics";

const PHASE_LABEL: Record<string, string> = { camp: "Life at Camp", challenge: "Challenges", tribal: "Tribal Council", final_challenge: "Final Immunity", final_choice: "Final Decision", ftc: "Final Tribal Council", done: "Season Complete" };
const KIND_ICON: Record<string, string> = { camp: "🏕️", drama: "💢", alliance: "🤝", idol: "🗿", challenge: "🏆", tribal: "🔥", twist: "🌀", finale: "👑", confessional: "🎙️", jury: "⚖️" };

const az = <T extends { name: string }>(xs: T[]) => [...xs].sort((a, b) => a.name.localeCompare(b.name));
export function Game({ game, setGame, onReset, readOnly = false }: { game: GameState; setGame: (g: GameState) => void; onReset: () => void; readOnly?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [dec, setDec] = useState<Decision>({});
  const pending = pendingDecision(game);
  const [reveals, setReveals] = useState<LogEntry[]>([]);
  const tribalCount = (g: GameState) => g.episodes.flatMap((e) => e.entries).filter((e) => e.kind === "tribal").length;
  const next = () => {
    const ng = step(game, { ...dec, pauseOnRevote: true });
    const fresh = ng.episodes.flatMap((e) => e.entries).filter((e) => e.kind === "tribal").slice(tribalCount(game));
    setGame(ng); setDec({});
    if (fresh.length) setReveals(fresh);
  };
  const winner = game.winner ? byId(game, game.winner) : null;
  const groups = [...new Set(alive(game).map((c) => c.tribeId))];
  const jury = game.castaways.filter((c) => c.juror);
  const boots = game.castaways.filter((c) => c.out).sort((a, b) => (b.placement ?? 0) - (a.placement ?? 0));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <header className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <div>
          <h1 className="text-4xl leading-none">Survivor Simulator</h1>
          {game.config.seasonTitle && <p className="font-display text-lg tracking-wide text-accent">{game.config.seasonTitle}</p>}
          <p className="text-sm text-muted-foreground">Day {game.day} · {PHASE_LABEL[game.phase]} · {alive(game).length} remain</p>
        </div>
        {!readOnly && <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={game.phase === "done"} onClick={next} className="rounded-md bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-40 torch-glow">Next Phase ▶</Button>
          <Button variant="secondary" disabled={game.phase === "done"} onClick={() => setGame(simulateToEnd(game))} className="rounded-md bg-secondary px-4 py-2 text-sm hover:bg-muted disabled:opacity-40">Auto-Simulate to End ⏩</Button>
          <Button variant="secondary" onClick={() => setEditing(true)} className="rounded-md bg-secondary px-4 py-2 text-sm hover:bg-muted">Edit Stats / Tribes ✏️</Button>
          <Button variant="secondary" onClick={() => { if (game.phase === "done" || window.confirm("Start a new season? This season will be lost.")) onReset(); }} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">New Season</Button>
        </div>}
      </header>

      {winner && (
        <div className="mb-6 rounded-2xl border-2 border-idol bg-card p-8 text-center torch-glow">
          <p className="uppercase tracking-[0.3em] text-idol">Sole Survivor</p>
          <h2 className="text-7xl">{winner.name}</h2>
          <p className="text-muted-foreground">Outwitted, outplayed and outlasted {game.castaways.length - 1} castaways.</p>
        </div>
      )}

      {!readOnly && game.phase === "tribal" && <TargetsPanel game={game} />}
      {game.phase === "done" && <SeasonStatistics game={game} />}
      {!readOnly && pending && game.phase !== "done" && <DecisionPanel game={game} pending={pending} dec={dec} setDec={setDec} />}

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
          <RelationshipsPanel game={game} />
          <AlliancesPanel game={game} />
          <PonderosaPanel game={game} />
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
      {reveals[0] && <VoteReveal key={reveals.length} g={game} e={reveals[0]} onDone={() => setReveals(reveals.slice(1))} />}
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
        <span className="flex flex-wrap items-center justify-end gap-1 text-sm">{g.immune.includes(c.id) && "🛡️"}{c.idols > 0 && "🗿".repeat(c.idols)}{c.fakeIdol && <span className="text-xs text-muted-foreground">{c.fakeIdol === "own" ? "Fake idol" : "Fake idol (thinks it's real)"}</span>}{c.clue && <span className="text-xs text-idol">Idol clue</span>}{c.bewareTribals > 0 && <span className="text-xs text-destructive">Beware</span>}{c.lostVote && <span className="text-xs text-destructive">No vote</span>}{(c.advantages ?? []).map((a) => <span key={a} className="text-xs text-accent">{ADVANTAGE_LABEL[a]}</span>)}{c.immunityWins > 0 && <span className="ml-1 text-xs text-idol">{c.immunityWins}×🏆</span>}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted" title={`Mood ${c.mood}`}><div className="h-full bg-success" style={{ width: `${c.mood}%` }} /></div>
      <div className="mt-1.5 flex flex-wrap gap-1">{als.map((a) => <span key={a.id} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-accent">{a.name}</span>)}</div>
      {c.amulet && <p className="mt-1 text-xs text-idol" title={amuletDescription(g)}>Advantage Amulet · {alive(g).length < 6 ? "Expired" : amuletHolders(g).length === 3 ? "Extra vote" : amuletHolders(g).length === 2 ? "Steal a vote" : "Immunity idol"}</p>}
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
      {pending.kind === "jury" && (
        <div className="mt-3 space-y-4">
          <h3 className="text-xl text-accent">Finalists’ Speeches</h3>
          <ul className="space-y-3 text-sm">{finalistSpeeches(game).map((speech, i) => <li key={i}>{speech}</li>)}</ul>
          <label className="flex flex-wrap items-center gap-2 text-sm">Your vote for Sole Survivor:
            <select className={sel} value={dec.juryVote ?? ""} onChange={(e) => setDec({ ...dec, juryVote: e.target.value || undefined })}>
              <option value="">— Let instinct decide —</option>{az(pending.options).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        </div>
      )}
      {pending.kind === "revote" && (
        <div className="mt-2 space-y-2">
          <p className="text-sm font-semibold text-accent">Here's how the vote went:</p>
          {pending.votes.length > 0 && <VoteChart g={game} votes={pending.votes} label="Votes read" />}
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">{pending.summary.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <label className="flex flex-wrap items-center gap-2 text-sm">Revote! You can vote for: {pending.options.map((o) => o.name).join(" or ")}.
          <select className={sel} value={dec.revoteVote ?? ""} onChange={(e) => setDec({ ...dec, revoteVote: e.target.value || undefined })}>
            <option value="">— Let instinct decide —</option>{az(pending.options).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select></label>
        </div>
      )}
      {pending.kind === "camp" && (
        <div className="mt-2 space-y-3">
        <label className="flex flex-wrap items-center gap-2 text-sm">Approach someone to align with (optional):
          <select className={sel} value={dec.allyWith ?? ""} onChange={(e) => setDec({ ...dec, allyWith: e.target.value || undefined })}>
            <option value="">— Lay low —</option><option value="__random__">Randomize who I approach</option>{az(pending.options).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select></label>
          {[0, 1].map((i) => { const t = dec.talks?.[i]; const set = (v?: { with: string; topic: any }) => { const arr = [...(dec.talks ?? [])]; if (v) arr[i] = v; else arr.splice(i, 1); setDec({ ...dec, talks: arr.filter(Boolean) }); };
            if (i === 1 && !dec.talks?.[0]) return null;
            return <div key={i} className="flex flex-wrap items-center gap-2 text-sm">{i === 0 ? "Have a conversation with" : "Second conversation with"}
              <select className={sel} value={t?.with ?? ""} onChange={(e) => set(e.target.value ? { with: e.target.value, topic: t?.topic ?? "personal" } : undefined)}>
                <option value="">— Nobody —</option>{az(pending.options).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              {t && <><span>about</span><select className={sel} value={t.topic} onChange={(e) => set({ ...t, topic: e.target.value })}>
                {Object.entries(TALK_TOPICS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select><span className="text-xs text-muted-foreground">(can work or backfire)</span></>}
            </div>; })}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={dec.searchIdol ?? false} onChange={(e) => setDec({ ...dec, searchIdol: e.target.checked })} className="size-4 accent-primary" />Search for an idol</label>
            {dec.searchIdol && <label className="flex flex-wrap items-center gap-2">Search location:
              <select className={sel} value={dec.searchSpot ?? ""} onChange={(e) => setDec({ ...dec, searchSpot: e.target.value || undefined })}>
                <option value="">Random location</option>{SEARCH_SPOTS.map((spot) => <option key={spot} value={spot}>{spot}</option>)}
              </select>
            </label>}
          </div>
          {pending.canSearchAtChallenge && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dec.challengeIdol ?? false} onChange={(e) => setDec({ ...dec, challengeIdol: e.target.checked })} className="size-4 accent-primary" />Look for an idol during the immunity challenge (risks slowing your tribe)</label>}
          {pending.giveables.length > 0 && <div className="flex flex-wrap items-center gap-2 text-sm">Give away:
            <select className={sel} value={dec.giveItem ?? ""} onChange={(e) => setDec({ ...dec, giveItem: e.target.value || undefined })}>
              <option value="">Keep everything</option>{pending.giveables.map((a) => <option key={a} value={a}>{a === "idol" ? "Hidden Immunity Idol" : ADVANTAGE_LABEL[a]}</option>)}
            </select>
            {dec.giveItem && <><span>to</span><select className={sel} value={dec.giveTo ?? ""} onChange={(e) => setDec({ ...dec, giveTo: e.target.value || undefined })}>
              <option value="">— Choose —</option>{az(pending.options).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select></>}
          </div>}
          {!pending.fakeStatus && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dec.craftFake ?? false} onChange={(e) => setDec({ ...dec, craftFake: e.target.checked })} className="size-4 accent-primary" />Craft a fake idol</label>}
          {(pending.fakeStatus === "own" || dec.craftFake) && pending.plantTargets.length > 0 && <label className="flex flex-wrap items-center gap-2 text-sm">Plant fake idol on:
            <select className={sel} value={dec.fakeTarget ?? ""} onChange={(e) => setDec({ ...dec, fakeTarget: e.target.value || undefined })}>
              <option value="">Keep it for now</option><option value="__random__">Random person</option>{az(pending.plantTargets).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select></label>}
        </div>
      )}
      {pending.kind === "cut" && (
        <label className="mt-2 flex flex-wrap items-center gap-2 text-sm">{pending.fire ? "You won! Choose who sits beside you at Final 3 (the other two make fire):" : "You won! Choose who to vote out:"}
          <select className={sel} value={dec.cut ?? ""} onChange={(e) => setDec({ ...dec, cut: e.target.value || undefined })}>
            <option value="">— Let instinct decide —</option>{az(pending.options).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select></label>
      )}
      {pending.kind === "tribal" && (
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {pending.noVote && <p className="w-full text-destructive">You have no vote tonight.</p>}
          {pending.canGiveImmunity && (
            <label className="flex items-center gap-2">🛡️ Give up immunity to:
              <select className={sel} value={dec.giveImmunity ?? ""} onChange={(e) => setDec({ ...dec, giveImmunity: e.target.value || undefined })}>
                <option value="">Keep my necklace</option>{az(pending.idolTargets.concat(pending.options).filter((o, i, arr) => o.id !== me.id && arr.findIndex((x) => x.id === o.id) === i)).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select></label>
          )}
          <label className="flex items-center gap-2">Vote for:
            <select className={sel} value={dec.vote ?? ""} onChange={(e) => setDec({ ...dec, vote: e.target.value || undefined })}>
              <option value="">— Let instinct decide —</option>{az(pending.options).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select></label>
          {!pending.noVote && <label className="flex items-center gap-2">🤫 Whisper at Tribal to push votes onto:
            <select className={sel} value={dec.whisper ?? ""} onChange={(e) => setDec({ ...dec, whisper: e.target.value || undefined })}>
              <option value="">Stay quiet</option>{az(pending.options).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select></label>}
          {pending.hasIdol && (
            <label className="flex items-center gap-2">🗿 Play idol on:
              <select className={sel} value={dec.idol ?? ""} onChange={(e) => setDec({ ...dec, idol: e.target.value })}>
                <option value="">Keep it</option><option value="__random__">Random person</option>{az(pending.idolTargets).map((o) => <option key={o.id} value={o.id}>{o.id === me.id ? "Myself" : o.name}</option>)}
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
                <option value="">— Choose —</option><option value="__random__">Random person</option>{az(pending.idolTargets.concat(pending.options).filter((o, i, arr) => o.id !== me.id && arr.findIndex((x) => x.id === o.id) === i)).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select></label>
          )}
          {dec.advantage && <p className="w-full text-xs text-muted-foreground">{ADVANTAGE_DESC[dec.advantage]}</p>}
          {pending.canShoot && <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-primary" checked={dec.shotInDark ?? false} onChange={(e) => setDec({ ...dec, shotInDark: e.target.checked })} />Play Shot in the Dark (1 in 6 chance of safety; you lose your vote either way, one use per season)</label>}
          {pending.canPlayAmulet && <>
            <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-primary" checked={dec.playAmulet ?? false} onChange={(e) => setDec({ ...dec, playAmulet: e.target.checked, amuletTarget: undefined })} />Play Advantage Amulet{amuletHolders(game).length > 1 ? " together" : ""}</label>
            {dec.playAmulet && amuletHolders(game).length < 3 && <label className="flex items-center gap-2">Amulet target:
              <select className={sel} value={dec.amuletTarget ?? ""} onChange={(e) => setDec({ ...dec, amuletTarget: e.target.value || undefined })}>
                <option value="">— Choose —</option><option value="__random__">Random person</option>{az((amuletHolders(game).length === 1 ? pending.idolTargets : attendees(game).filter((c) => c.id !== me.id && !game.immune.includes(c.id)))).map((c) => <option key={c.id} value={c.id}>{c.id === me.id ? "Myself" : c.name}</option>)}
              </select>
            </label>}
          </>}
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

function AlliancesPanel({ game }: { game: GameState }) {
  if (!game.alliances.length) return null;
  const tribes = [...new Set(alive(game).map((c) => c.tribeId))];
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="text-2xl text-accent">Alliances</h2>
      {tribes.map((tid) => {
        const t = tribeOf(game, tid);
        const als = game.alliances.filter((a) => a.members.some((m) => byId(game, m).tribeId === tid));
        if (!t || !als.length) return null;
        return (
          <div key={tid} className="mt-2">
            <p className="text-sm font-semibold" style={{ color: t.color }}>{t.name}</p>
            <ul className="mt-1 space-y-1 text-sm">{als.map((a) => <li key={a.id}><b>{a.name}</b> <span className="text-muted-foreground">({a.members.length}): {a.members.map((m) => byId(game, m).name).join(", ")}</span></li>)}</ul>
          </div>
        );
      })}
    </section>
  );
}

function TargetsPanel({ game }: { game: GameState }) {
  const att = attendees(game);
  if (!att.length) return null;
  const { individual, groups } = tribalTargets(game);
  const names = [...new Set(att.map((c) => tribeOf(game, c.tribeId)?.name))].join(" & ");
  return (
    <div className="mb-6 rounded-xl border-2 border-accent bg-card p-4">
      <h2 className="text-2xl text-accent">Heading to Tribal: {names}</h2>
      <p className="text-xs text-muted-foreground">Current plans. Minds can still change at the vote.</p>
      {groups.length > 0 && (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Group targets</p>
          <ul className="mt-1 space-y-1 text-sm">{groups.map((g) => <li key={g.alliance}><b>{g.alliance}</b> ({g.members.map((m) => byId(game, m).name).join(", ")}) → <span className="text-primary">{byId(game, g.target).name}</span> <span className="text-muted-foreground">— {g.reason}</span></li>)}</ul>
        </div>
      )}
      <div className="mt-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Individual targets</p>
        <ul className="mt-1 grid gap-1 text-sm sm:grid-cols-2">{individual.map((p) => <li key={p.voter}>{byId(game, p.voter).name} → <span className="text-primary">{byId(game, p.target).name}</span> <span className="text-muted-foreground">— {p.reason}</span></li>)}</ul>
      </div>
    </div>
  );
}

function RelationshipsPanel({ game }: { game: GameState }) {
  const id = game.config.controlledId;
  if (!id) return null;
  const me = byId(game, id);
  if (me.out) return null;
  const others = alive(game).filter((c) => c.id !== id && (game.merged || c.tribeId === me.tribeId)).sort((a, b) => getRel(game, id, b.id) - getRel(game, id, a.id));
  const label = (v: number) => v >= 25 ? "Close bond" : v >= 10 ? "Friendly" : v > -5 ? "Neutral" : v > -20 ? "Tense" : "Enemies";
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="text-2xl text-accent">Your Relationships</h2>
      <p className="text-xs text-muted-foreground">Your mood: {me.mood}/100</p>
      <ul className="mt-2 space-y-1 text-sm">{others.map((c) => { const v = getRel(game, id, c.id); return (
        <li key={c.id} className="flex items-center gap-2">
          <span className="w-28 truncate">{c.name}</span>
          <div className="relative h-2 flex-1 rounded bg-muted"><div className={`absolute top-0 h-full rounded ${v >= 0 ? "left-1/2 bg-success" : "right-1/2 bg-destructive"}`} style={{ width: `${Math.abs(v)}%` }} /></div>
          <span className="w-24 text-right text-xs text-muted-foreground">{label(v)} ({v > 0 ? "+" : ""}{v})</span>
        </li>); })}</ul>
    </section>
  );
}

function PonderosaPanel({ game }: { game: GameState }) {
  const logs = game.episodes.flatMap((e) => e.entries).filter((e) => e.kind === "jury");
  if (!logs.length) return null;
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="text-2xl text-accent">Ponderosa</h2>
      <ul className="mt-2 space-y-2 text-sm">{[...logs].reverse().map((e, i) => <li key={i}><b>{e.title.replace("Ponderosa — ", "")}</b>: {e.text}{e.details?.length ? <span className="block text-xs text-muted-foreground">{e.details.join(" ")}</span> : null}</li>)}</ul>
    </section>
  );
}

/** Reads parchments one at a time, like Jeff at the urn; the sealing vote comes last. */
function revealOrder(votes: Vote[], out?: string) {
  const counted = votes.filter((v) => !v.nullified);
  const L = counted.filter((v) => v.target === out), O = counted.filter((v) => v.target !== out);
  const seq: Vote[] = [];
  while (L.length || O.length) { if (O.length && (L.length <= 1 || seq.length % 2 === 0)) seq.push(O.shift()!); else seq.push(L.shift()!); }
  return [...votes.filter((v) => v.nullified), ...seq];
}
function VoteReveal({ g, e, onDone }: { g: GameState; e: LogEntry; onDone: () => void }) {
  const seq = [...revealOrder(e.votes ?? [], e.revote?.length ? undefined : e.out), ...(e.revote?.length ? revealOrder(e.revote, e.out).map((v) => ({ ...v, re: true })) : [])];
  const [n, setN] = useState(0);
  const shown = seq.slice(0, n);
  const counts: Record<string, number> = {};
  shown.forEach((v: any) => { if (!v.nullified && (v.re || !e.revote?.length || true)) counts[`${v.re ? "R" : ""}${v.target}`] = (counts[`${v.re ? "R" : ""}${v.target}`] ?? 0) + 1; });
  const last: any = shown.at(-1);
  const finished = n >= seq.length;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur">
      <div className="w-full max-w-lg rounded-2xl border-2 border-primary bg-card p-6 text-center torch-glow">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{e.title}</p>
        <p className="mt-2 text-sm text-muted-foreground">{n === 0 ? `"I'll read the votes." ${seq.length} parchment${seq.length === 1 ? "" : "s"}.` : last.re ? "Revote" : last.nullified ? "Does not count" : `Vote ${shown.filter((v: any) => !v.re && !v.nullified).length}`}</p>
        <div className="my-6 flex min-h-32 items-center justify-center rounded-lg border bg-secondary/60 p-6">
          {last ? <span key={n} className={`font-display text-5xl tracking-wide ${last.nullified ? "line-through text-muted-foreground" : "text-primary"}`}>{byId(g, last.target).name}</span> : <span className="text-4xl">📜</span>}
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-sm">{Object.entries(counts).map(([k, c]) => <span key={k} className="rounded bg-secondary px-2 py-1">{k.startsWith("R") ? "Revote · " : ""}{byId(g, k.replace(/^R/, "")).name}: <b>{c}</b></span>)}</div>
        {finished && <p className="mt-4 text-sm">{e.text}</p>}
        <div className="mt-5 flex justify-center gap-2">
          {!finished ? <Button onClick={() => setN(n + 1)}>Read next vote</Button> : <Button onClick={onDone}>Continue</Button>}
          {!finished && <Button variant="secondary" onClick={() => setN(seq.length)}>Skip to result</Button>}
        </div>
      </div>
    </div>
  );
}
