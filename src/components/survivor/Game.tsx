// @ts-nocheck -- indexing guarded by game invariants
import { useState, useEffect } from "react";
import {
  ADVANTAGE_DESC,
  ADVANTAGE_LABEL,
  ADVANTAGE_NEEDS_TARGET,
  CHALLENGE_STATS,
  SOCIAL_STATS,
  STAT_LABEL,
  SEARCH_SPOTS,
  alive,
  byId,
  finalistSpeeches,
  pendingDecision,
  simulateToEnd,
  step,
  tribeOf,
  tribalTargets,
  attendees,
  getRel,
  amuletHolders,
  amuletDescription,
  kipItems,
  type Castaway,
  type Decision,
  type GameState,
  type LogEntry,
  type Vote,
} from "@/lib/survivor/engine";
import { StatPicker, TribeEditor } from "./shared";
import { Button } from "@/components/ui/button";
import { SeasonStatistics } from "./SeasonStatistics";

const PHASE_LABEL: Record<string, string> = {
  camp: "Life at Camp",
  challenge: "Challenges",
  tribal: "Tribal Council",
  final_challenge: "Final Immunity",
  final_choice: "Final Decision",
  ftc: "Final Tribal Council",
  done: "Season Complete",
};
const KIND_ICON: Record<string, string> = {
  camp: "🏕️",
  drama: "💢",
  alliance: "🤝",
  idol: "🗿",
  challenge: "🏆",
  tribal: "🔥",
  twist: "🌀",
  finale: "👑",
  confessional: "🎙️",
  jury: "⚖️",
};

const az = <T extends { name: string }>(xs: T[]) => [...xs].sort((a, b) => a.name.localeCompare(b.name));
export function Game({
  game,
  setGame,
  onReset,
  readOnly = false,
}: {
  game: GameState;
  setGame: (g: GameState) => void;
  onReset: () => void;
  readOnly?: boolean;
}) {
  // Warn before closing or reloading tab during an active season
  useEffect(() => {
    if (readOnly || game.phase === "done") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [readOnly, game.phase]);
  const [editing, setEditing] = useState(false);
  const [dec, setDec] = useState<Decision>({});
  const pending = pendingDecision(game);
  const [reveals, setReveals] = useState<LogEntry[]>([]);
  const [expandEpisodes, setExpandEpisodes] = useState<boolean | null>(null);
  const voteLogCount = (g: GameState) =>
    g.episodes.flatMap((e) => e.entries).filter((e) => e.kind === "tribal" || (e.kind === "finale" && e.votes?.length))
      .length;
  const next = () => {
    if (
      dec.quit &&
      !window.confirm("Quit this season? Your torch will be snuffed and you will continue as a spectator.")
    )
      return;
    const ng = step(game, { ...dec, pauseOnRevote: true });
    const myId = game.config.controlledId;
    const meBefore = myId ? byId(game, myId) : null;

    const fresh = ng.episodes
      .flatMap((e) => e.entries)
      .filter((e) => e.kind === "tribal" || (e.kind === "finale" && e.votes?.length))
      .slice(voteLogCount(game))
      .filter((e) => {
        // Spectating from the start (no controlled player)
        if (!meBefore) return false;

        // Finale / Jury vote: show if you are a finalist or on the jury
        if (e.kind === "finale") return !meBefore.out || !!meBefore.juror;

        // Already voted out in an earlier round: skip popup
        if (meBefore.out) return false;

        // Tribal Council: only popup if your tribe was there or you were involved
        const voters = (e.votes ?? []).map((v) => byId(ng, v.voter)).filter(Boolean);
        const userTribeAtTribal = voters.some((v) => v.tribeId === meBefore.tribeId);
        const userInvolved =
          (e.votes ?? []).some((v) => v.voter === meBefore.id || v.target === meBefore.id) || e.out === meBefore.id;

        return userTribeAtTribal || userInvolved;
      });

    setGame(ng);
    setDec({});
    if (fresh.length) setReveals(fresh);
  };
  const skipToMergeVote = () => {
    let g = game;
    let guard = 0;
    // Step until we reach Tribal Council on the merged tribe
    while (!(g.merged && g.phase === "tribal") && g.phase !== "done" && guard++ < 300) {
      g = step(g);
    }
    setGame(g);
    setDec({});
  };

  const skipToFTC = () => {
    let g = game;
    let guard = 0;
    // Step until the start of FTC (speeches & questions ready, before votes are read)
    while (g.phase !== "ftc" && g.phase !== "done" && guard++ < 500) {
      g = step(g);
    }
    setGame(g);
    setDec({});
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
          {game.config.seasonTitle && (
            <p className="font-display text-lg tracking-wide text-accent">{game.config.seasonTitle}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Day {game.day} · {PHASE_LABEL[game.phase]} · {alive(game).length} remain</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Autosaved
            </span>
          </div>

        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={game.phase === "done"}
              onClick={next}
              className="rounded-md bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-40 torch-glow"
            >
              Next Phase ▶
            </Button>
            <Button
              variant="secondary"
              disabled={game.phase === "done"}
              onClick={() => setGame(simulateToEnd(game))}
              className="rounded-md bg-secondary px-4 py-2 text-sm hover:bg-muted disabled:opacity-40"
            >
              Auto-Simulate to End ⏩
            </Button>
            <Button
              variant="secondary"
              disabled={game.merged || game.phase === "done"}
              onClick={skipToMergeVote}
              className="rounded-md bg-secondary px-4 py-2 text-sm hover:bg-muted disabled:opacity-40"
            >
              Skip to Merge Vote 🤝
            </Button>
            <Button
              variant="secondary"
              disabled={game.phase === "ftc" || game.phase === "done"}
              onClick={skipToFTC}
              className="rounded-md bg-secondary px-4 py-2 text-sm hover:bg-muted disabled:opacity-40"
            >
              Skip to FTC 👑
            </Button>
            <Button
              variant="secondary"
              onClick={() => setEditing(true)}
              className="rounded-md bg-secondary px-4 py-2 text-sm hover:bg-muted"
            >
              Edit Stats / Tribes ✏️
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (game.phase === "done" || window.confirm("Start a new season? This season will be lost.")) onReset();
              }}
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              New Season
            </Button>
          </div>
        )}
      </header>

      {winner && (
        <div className="mb-6 rounded-2xl border-2 border-idol bg-card p-8 text-center torch-glow">
          <p className="uppercase tracking-[0.3em] text-idol">Sole Survivor</p>
          <h2 className="text-7xl">{winner.name}</h2>
          <p className="text-muted-foreground">
            Outwitted, outplayed and outlasted {game.castaways.length - 1} castaways.
          </p>
        </div>
      )}

      {!readOnly && game.phase === "tribal" && <TargetsPanel game={game} />}
      {game.phase === "done" && <SeasonStatistics game={game} />}
      {!readOnly && pending && game.phase !== "done" && (
        <DecisionPanel game={game} pending={pending} dec={dec} setDec={setDec} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          {groups.map((tid) => {
            const t = tribeOf(game, tid);
            if (!t) return null;
            return (
              <section key={tid}>
                <h2 className="mb-2 rounded-md px-3 py-1 text-2xl" style={{ backgroundColor: t.color, color: "#111" }}>
                  {t.name}
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {alive(game)
                    .filter((c) => c.tribeId === tid)
                    .map((c) => (
                      <Card key={c.id} g={game} c={c} />
                    ))}
                </div>
              </section>
            );
          })}
          <RelationshipsPanel game={game} />
          <AlliancesPanel game={game} />
          <PonderosaPanel game={game} />
          {jury.length > 0 && (
            <section className="rounded-xl border bg-card p-4">
              <h2 className="text-2xl text-accent">
                Jury ({jury.length}/{game.config.jurySize})
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {jury.map((j) => (
                  <span key={j.id} className="rounded-full bg-secondary px-3 py-1 text-sm">
                    ⚖️ {j.name}
                  </span>
                ))}
              </div>
            </section>
          )}
          {boots.length > 0 && (
            <section className="rounded-xl border bg-card p-4">
              <h2 className="text-2xl text-accent">Boot Order</h2>
              <ol className="mt-2 space-y-1 text-sm">
                {boots.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between border-b border-border/40 py-1 text-xs last:border-0"
                  >
                    <span className="font-medium text-foreground">
                      {b.placement}th — {b.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {b.juror && (
                        <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                          ⚖️ Jury
                        </span>
                      )}
                      <span className="text-muted-foreground">🕯️ Snuffed</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setExpandEpisodes((prev) => !prev)}
              className="text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              {expandEpisodes ? "Collapse Past Episodes" : "Expand All Episodes"}
            </button>
          </div>
          {[...game.episodes]
            .reverse()
            .filter((e) => e.entries.length)
            .map((e, i) => (
              <details key={e.n} open={expandEpisodes || i < 2} className="rounded-xl border bg-card">
                <summary className="cursor-pointer px-4 py-3 font-display text-2xl tracking-wide">
                  Episode {e.n}: "{e.title}"
                </summary>
                <div className="space-y-2 px-4 pb-4">
                  {e.entries.map((en, k) => (
                    <Entry key={k} g={game} e={en} />
                  ))}
                </div>
              </details>
            ))}
        </div>
      </div>
      {reveals[0] && (
        <VoteReveal key={reveals.length} g={game} e={reveals[0]} onDone={() => setReveals(reveals.slice(1))} />
      )}
      {editing && <EditModal game={game} setGame={setGame} onClose={() => setEditing(false)} />}
    </div>
  );
}
function getArchetype(s: Castaway["stats"]) {
  if (s.physical >= 8 && s.endurance >= 7) return "Challenge Beast";
  if (s.strategy >= 8) return "The Mastermind";
  if (s.social >= 8) return "Social Threat";
  if (s.loyalty >= 8) return "Loyal Soldier";
  if (s.temperament <= 3) return "The Wildcard";
  if (s.mental >= 8) return "Puzzle Wizard";
  return "The Underdog";
}
function getThreatBadge(c: Castaway, g?: GameState) {
  if (!g || !g.alliances) return null;
  const allianceCount = g.alliances.filter((a) => a.members.includes(c.id)).length;
  const immWins = c.immunityWins ?? 0;
  const rewWins = c.rewardWins ?? 0;
  const correctVotes = c.correctVotes ?? 0;

  // Visible challenge threats
  const challengeThreat = immWins * 3.5 + rewWins * 1.5 + c.stats.physical * 0.8;
  // Visible social connections (alliances + social ability)
  const socialThreat = allianceCount * 2.0 + c.stats.social * 1.0;
  // Visible strategic / voting control (orchestrated majority votes)
  const strategicThreat = correctVotes * 2.5 + c.stats.strategy * 1.0;
  // Threat ramps up once players reach the merge
  const mergeBonus = g.merged ? 3.0 : 0;

  const score = challengeThreat + socialThreat + strategicThreat + mergeBonus;
  const tooltip = `Perceived Threat: ${score.toFixed(1)} | ${immWins} Immunities, ${correctVotes} Majority Votes, ${allianceCount} Alliances`;

  if (score >= 35) {
    return (
      <span
        title={tooltip}
        className="cursor-help rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-bold text-destructive"
      >
        🔴 Target
      </span>
    );
  }
  if (score >= 27) {
    return (
      <span
        title={tooltip}
        className="cursor-help rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-500"
      >
        🟠 High
      </span>
    );
  }
  if (score >= 20) {
    return (
      <span
        title={tooltip}
        className="cursor-help rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-600 dark:text-yellow-400"
      >
        🟡 Mid
      </span>
    );
  }
  return (
    <span
      title={tooltip}
      className="cursor-help rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500"
    >
      🟢 Low
    </span>
  );
}
function Card({ g, c }: { g: GameState; c: Castaway }) {
  const als = g.alliances.filter((a) => a.members.includes(c.id));
  const me = g.config.controlledId === c.id;
  return (
    <div
      className={`rounded-lg border bg-card p-3 ${me ? "border-primary torch-glow" : ""} ${g.immune.includes(c.id) ? "ring-2 ring-idol" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold flex items-center gap-1.5">
          {c.name}
          {me && <span className="text-xs text-primary">(YOU)</span>}
          {getThreatBadge(c, g)}
        </span>
        <span className="flex flex-wrap items-center justify-end gap-1 text-sm">
          {g.immune.includes(c.id) && "🛡️"}
          {c.idols > 0 && "🗿".repeat(c.idols)}
          {c.fakeIdol && (
            <span className="text-xs text-muted-foreground">
              {c.fakeIdol === "own" ? "Fake idol" : "Fake idol (thinks it's real)"}
            </span>
          )}
          {c.clue && <span className="text-xs text-idol">Idol clue</span>}
          {c.bewareTribals > 0 && (
            <span className="text-xs text-destructive" title={c.bewareTask}>
              Beware idol (locked)
            </span>
          )}
          {c.lostVote && <span className="text-xs text-destructive">No vote</span>}
          {(c.advantages ?? []).map((a) => (
            <span key={a} className="text-xs text-accent">
              {ADVANTAGE_LABEL[a]}
            </span>
          ))}
          {c.immunityWins > 0 && <span className="ml-1 text-xs text-idol">{c.immunityWins}×🏆</span>}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted" title={`Mood ${c.mood}`}>
        <div className="h-full bg-success" style={{ width: `${c.mood}%` }} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {als.map((a) => (
          <span key={a.id} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-accent">
            {a.name}
          </span>
        ))}
      </div>
      {c.amulet && (
        <p className="mt-1 text-xs text-idol" title={amuletDescription(g)}>
          Advantage Amulet ·{" "}
          {alive(g).length < 6
            ? "Expired"
            : amuletHolders(g).length === 3
              ? "Extra vote"
              : amuletHolders(g).length === 2
                ? "Steal a vote"
                : "Immunity idol"}
        </p>
      )}
      <div className="mt-1.5 grid grid-cols-4 gap-1 text-center text-[10px] text-muted-foreground">
        {[...SOCIAL_STATS, ...CHALLENGE_STATS].map((k) => (
          <span key={k} title={STAT_LABEL[k]}>
            {STAT_LABEL[k].slice(0, 3)} <b className="text-foreground">{c.stats[k]}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function Entry({ g, e }: { g: GameState; e: LogEntry }) {
  return (
    <div
      className={`rounded-lg bg-secondary/60 p-3 ${e.kind === "tribal" || e.kind === "finale" ? "border-l-4 border-primary" : ""}`}
    >
      <p className="font-semibold">
        {KIND_ICON[e.kind]} {e.title}
      </p>
      <p className="text-sm">{e.text}</p>
      {e.kind === "tribal" && e.text.includes("with a hidden immunity idol in") && (
        <span className="mt-1 inline-block rounded bg-destructive/20 border border-destructive px-2 py-0.5 text-xs font-bold text-destructive">
          ⚡ BLINDSIDE! (Went home with an idol!)
        </span>
      )}

      {e.kind === "tribal" && e.details?.[0]?.startsWith("Final count:") && (
        <p className="mt-2 text-sm font-semibold text-accent">{e.details[0]}</p>
      )}
      {e.votes && (
        <VoteChart g={g} votes={e.votes} label={e.kind === "finale" && g.juryVotes ? "Jury Votes" : "Votes"} />
      )}
      {e.revote && e.revote.length > 0 && <VoteChart g={g} votes={e.revote} label="Revote" />}
      {e.details && e.details.length > 0 && (
        <details className="mt-1 text-sm text-muted-foreground">
          <summary className="cursor-pointer text-xs uppercase tracking-wider text-accent">Details</summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {e.details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </details>
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
          <div
            key={i}
            className="vote-reveal rounded border bg-card px-2 py-1 text-xs"
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            <span className="text-muted-foreground">{byId(g, v.voter).name} →</span>{" "}
            <span
              className={`font-display text-base tracking-wide ${v.nullified ? "line-through text-muted-foreground" : "text-primary"}`}
            >
              {byId(g, v.target).name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionPanel({
  game,
  pending,
  dec,
  setDec,
}: {
  game: GameState;
  pending: NonNullable<ReturnType<typeof pendingDecision>>;
  dec: Decision;
  setDec: (d: Decision) => void;
}) {
  const sel = "rounded-md border border-input bg-secondary px-2 py-1.5 text-sm";
  if (!game.config.controlledId) return null;
  const me = byId(game, game.config.controlledId);
  const kipTarget = attendees(game).find((c) => c.id === dec.advantageTarget);
  const stealable = kipTarget ? kipItems(me, kipTarget) : [];
  return (
    <div className="mb-6 rounded-xl border-2 border-primary bg-card p-4">
      <h2 className="text-2xl text-primary">Your Decision, {me.name}</h2>
      {pending.kind === "jury" && (
        <div className="mt-3 space-y-4">
          <h3 className="text-xl text-accent">Finalists’ Speeches</h3>
          <ul className="space-y-3 text-sm">
            {finalistSpeeches(game).map((speech, i) => (
              <li key={i}>{speech}</li>
            ))}
          </ul>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            Your vote for Sole Survivor:
            <select
              className={sel}
              value={dec.juryVote ?? ""}
              onChange={(e) => setDec({ ...dec, juryVote: e.target.value || undefined })}
            >
              <option value="">— Let instinct decide —</option>
              {az(pending.options).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {pending.kind === "revote" && (
        <div className="mt-2 space-y-2">
          <p className="text-sm font-semibold text-accent">Here's how the vote went:</p>
          {pending.votes.length > 0 && <VoteChart g={game} votes={pending.votes} label="Votes read" />}
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
            {pending.summary.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            Revote! You can vote for: {pending.options.map((o) => o.name).join(" or ")}.
            <select
              className={sel}
              value={dec.revoteVote ?? ""}
              onChange={(e) => setDec({ ...dec, revoteVote: e.target.value || undefined })}
            >
              <option value="">— Let instinct decide —</option>
              {az(pending.options).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {pending.kind === "camp" && (
        <div className="mt-2 space-y-3">
          <label className="flex flex-wrap items-center gap-2 text-sm">
            Approach someone to align with (optional):
            <select
              className={sel}
              value={dec.allyWith ?? ""}
              onChange={(e) => setDec({ ...dec, allyWith: e.target.value || undefined })}
            >
              <option value="">— Lay low —</option>
              <option value="__random__">Randomize who I approach</option>
              {az(pending.options).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          {[0, 1].map((i) => {
            const t = dec.talks?.[i];
            const set = (v?: { with: string }) => {
              const arr = [...(dec.talks ?? [])];
              if (v) arr[i] = v;
              else arr.splice(i, 1);
              setDec({ ...dec, talks: arr.filter(Boolean) });
            };
            if (i === 1 && !dec.talks?.[0]) return null;
            return (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                {i === 0 ? "Have a conversation with" : "Second conversation with"}
                <select
                  aria-label={i === 0 ? "Conversation partner" : "Second conversation partner"}
                  className={sel}
                  value={t?.with ?? ""}
                  onChange={(e) => set(e.target.value ? { with: e.target.value } : undefined)}
                >
                  <option value="">— Nobody —</option>
                  <option value="__random__">Randomize who I talk to</option>
                  {az(pending.options).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          {pending.bewareTask && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dec.bewareAttempt ?? false}
                onChange={(e) => setDec({ ...dec, bewareAttempt: e.target.checked })}
                className="size-4 accent-primary"
              />
              Try to unlock your Beware idol: {pending.bewareTask} (getting caught makes your tribe suspicious)
            </label>
          )}
          {alive(game).length > 4 && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={dec.searchIdol ?? false}
                  onChange={(e) => setDec({ ...dec, searchIdol: e.target.checked })}
                  className="size-4 accent-primary"
                />
                Search for an idol
              </label>
              {dec.searchIdol && (
                <label className="flex flex-wrap items-center gap-2">
                  Search location:
                  <select
                    className={sel}
                    value={dec.searchSpot ?? ""}
                    onChange={(e) => setDec({ ...dec, searchSpot: e.target.value || undefined })}
                  >
                    <option value="">Random location</option>
                    {SEARCH_SPOTS.map((spot) => (
                      <option key={spot} value={spot}>
                        {spot}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
          {pending.canSearchAtChallenge && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dec.challengeIdol ?? false}
                onChange={(e) => setDec({ ...dec, challengeIdol: e.target.checked })}
                className="size-4 accent-primary"
              />
              Look for an idol during the immunity challenge (risks slowing your tribe)
            </label>
          )}
          {pending.giveables.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              Give away:
              <select
                className={sel}
                value={dec.giveItem ?? ""}
                onChange={(e) => setDec({ ...dec, giveItem: e.target.value || undefined })}
              >
                <option value="">Keep everything</option>
                {pending.giveables.map((a) => (
                  <option key={a} value={a}>
                    {a === "idol" ? "Hidden Immunity Idol" : ADVANTAGE_LABEL[a]}
                  </option>
                ))}
              </select>
              {dec.giveItem && (
                <>
                  <span>to</span>
                  <select
                    className={sel}
                    value={dec.giveTo ?? ""}
                    onChange={(e) => setDec({ ...dec, giveTo: e.target.value || undefined })}
                  >
                    <option value="">— Choose —</option>
                    {az(pending.options).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-destructive">
            <input
              type="checkbox"
              checked={dec.quit ?? false}
              onChange={(e) => setDec({ ...dec, quit: e.target.checked })}
              className="size-4 accent-primary"
            />
            Choose to quit the game
          </label>
          {!pending.fakeStatus && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dec.craftFake ?? false}
                onChange={(e) => setDec({ ...dec, craftFake: e.target.checked })}
                className="size-4 accent-primary"
              />
              Craft a fake idol
            </label>
          )}
          {(pending.fakeStatus === "own" || dec.craftFake) && pending.plantTargets.length > 0 && (
            <label className="flex flex-wrap items-center gap-2 text-sm">
              Plant fake idol on:
              <select
                className={sel}
                value={dec.fakeTarget ?? ""}
                onChange={(e) => setDec({ ...dec, fakeTarget: e.target.value || undefined })}
              >
                <option value="">Keep it for now</option>
                <option value="__random__">Random person</option>
                {az(pending.plantTargets).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
      {pending.kind === "cut" && (
        <label className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          {pending.fire
            ? "You won! Choose who sits beside you at Final 3 (the other two make fire):"
            : "You won! Choose who to vote out:"}
          <select
            className={sel}
            value={dec.cut ?? ""}
            onChange={(e) => setDec({ ...dec, cut: e.target.value || undefined })}
          >
            <option value="">— Let instinct decide —</option>
            {az(pending.options).map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {pending.kind === "tribal" && (
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {pending.noVote && <p className="w-full text-destructive">You have no vote tonight.</p>}
          {pending.canGiveImmunity && (
            <label className="flex items-center gap-2">
              🛡️ Give up immunity to:
              <select
                className={sel}
                value={dec.giveImmunity ?? ""}
                onChange={(e) => setDec({ ...dec, giveImmunity: e.target.value || undefined })}
              >
                <option value="">Keep my necklace</option>
                {az(
                  pending.idolTargets
                    .concat(pending.options)
                    .filter((o, i, arr) => o.id !== me.id && arr.findIndex((x) => x.id === o.id) === i),
                ).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2">
            Vote for:
            <select
              className={sel}
              value={dec.vote ?? ""}
              onChange={(e) => setDec({ ...dec, vote: e.target.value || undefined })}
            >
              <option value="">— Let instinct decide —</option>
              {az(pending.options).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          {!pending.noVote && (
            <label className="flex items-center gap-2">
              🤫 Whisper at Tribal to push votes onto:
              <select
                className={sel}
                value={dec.whisper ?? ""}
                onChange={(e) => setDec({ ...dec, whisper: e.target.value || undefined })}
              >
                <option value="">Stay quiet</option>
                {az(pending.options).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {pending.hasIdol && (
            <label className="flex items-center gap-2">
              🗿 Play idol on:
              <select className={sel} value={dec.idol ?? ""} onChange={(e) => setDec({ ...dec, idol: e.target.value })}>
                <option value="">Keep it</option>
                <option value="__instinct__">— Let instinct decide —</option>
                <option value="__random__">Random person</option>
                {az(pending.idolTargets).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id === me.id ? "Myself" : o.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {pending.advantages.length > 0 && (
            <label className="flex items-center gap-2">
              Play advantage:
              <select
                className={sel}
                value={dec.advantage ?? ""}
                onChange={(e) =>
                  setDec({
                    ...dec,
                    advantage: e.target.value || undefined,
                    advantageTarget: undefined,
                    kipItem: undefined,
                  })
                }
              >
                <option value="">Keep it</option>
                <option value="__instinct__">— Let instinct decide —</option>
                {pending.advantages.map((a) => (
                  <option key={a} value={a}>
                    {ADVANTAGE_LABEL[a]}
                  </option>
                ))}
              </select>
            </label>
          )}
          {dec.advantage && ADVANTAGE_NEEDS_TARGET.includes(dec.advantage) && (
            <label className="flex items-center gap-2">
              On:
              <select
                aria-label="Advantage target"
                className={sel}
                value={dec.advantageTarget ?? ""}
                onChange={(e) => {
                  const others = attendees(game).filter((c) => c.id !== me.id);
                  const value =
                    dec.advantage === "knowledge_is_power" && e.target.value === "__random__"
                      ? others[Math.floor(Math.random() * others.length)]?.id
                      : e.target.value;
                  setDec({ ...dec, advantageTarget: value || undefined, kipItem: undefined });
                }}
              >
                <option value="">— Choose —</option>
                {dec.advantage !== "knowledge_is_power" && (
                  <option value="__instinct__">— Let instinct decide —</option>
                )}
                <option value="__random__">Random person</option>
                {az(attendees(game).filter((o) => o.id !== me.id)).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {dec.advantage === "knowledge_is_power" &&
            kipTarget &&
            (stealable.length ? (
              <label className="flex flex-wrap items-center gap-2">
                Take from {kipTarget.name}:
                <select
                  aria-label="KIP item to take"
                  className={sel}
                  value={dec.kipItem ?? ""}
                  onChange={(e) => setDec({ ...dec, kipItem: e.target.value || undefined })}
                >
                  <option value="">— Let instinct decide —</option>
                  {stealable.map((item) => (
                    <option key={item} value={item}>
                      {item === "idol"
                        ? "Hidden Immunity Idol"
                        : item === "amulet"
                          ? "Advantage Amulet"
                          : ADVANTAGE_LABEL[item as AdvantageKey]}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="w-full text-muted-foreground">{kipTarget.name} has no item you can take.</p>
            ))}
          {dec.advantage && dec.advantage !== "__instinct__" && (
            <p className="w-full text-xs text-muted-foreground">{ADVANTAGE_DESC[dec.advantage]}</p>
          )}
          {pending.canShoot && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={dec.shotInDark ?? false}
                onChange={(e) => setDec({ ...dec, shotInDark: e.target.checked })}
              />
              Play Shot in the Dark (1 in 6 chance of safety; you lose your vote either way, one use per season)
            </label>
          )}
          {pending.canPlayAmulet && (
            <>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={dec.playAmulet ?? false}
                  onChange={(e) => setDec({ ...dec, playAmulet: e.target.checked, amuletTarget: undefined })}
                />
                Play Advantage Amulet{amuletHolders(game).length > 1 ? " together" : ""}
              </label>
              {dec.playAmulet && amuletHolders(game).length < 3 && (
                <label className="flex items-center gap-2">
                  Amulet target:
                  <select
                    className={sel}
                    value={dec.amuletTarget ?? ""}
                    onChange={(e) => setDec({ ...dec, amuletTarget: e.target.value || undefined })}
                  >
                    <option value="">— Choose —</option>
                    <option value="__random__">Random person</option>
                    {az(
                      amuletHolders(game).length === 1
                        ? pending.idolTargets
                        : attendees(game).filter((c) => c.id !== me.id && !game.immune.includes(c.id)),
                    ).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id === me.id ? "Myself" : c.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EditModal({
  game,
  setGame,
  onClose,
}: {
  game: GameState;
  setGame: (g: GameState) => void;
  onClose: () => void;
}) {
  const upd = (f: (g: GameState) => void) => {
    const g = structuredClone(game);
    f(g);
    setGame(g);
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div className="w-full max-w-4xl rounded-xl border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl">Edit Stats & Tribes</h2>
          <Button
            variant="secondary"
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-1.5 text-primary-foreground"
          >
            Done
          </Button>
        </div>
        <h3 className="text-xl text-accent">Tribes</h3>
        <TribeEditor
          tribes={game.tribes}
          onChange={(t) =>
            upd((g) => {
              g.tribes = t;
              const m = t.find((x) => x.id === "merged");
              if (m) {
                g.config.mergedName = m.name;
                g.config.mergedColor = m.color;
              }
            })
          }
        />
        {!game.merged && (
          <div className="mt-3">
            <h3 className="mb-2 text-xl text-accent">Future merge tribe</h3>
            <TribeEditor
              label="Future merge tribe"
              tribes={[{ id: "merged", name: game.config.mergedName, color: game.config.mergedColor }]}
              onChange={(t) =>
                upd((g) => {
                  g.config.mergedName = t[0].name;
                  g.config.mergedColor = t[0].color;
                })
              }
            />
          </div>
        )}
        {!game.swapped && game.config.swapTribe && (
          <div className="mt-3">
            <h3 className="mb-2 text-xl text-accent">Future swap tribe</h3>
            <TribeEditor
              label="Future swap tribe"
              tribes={[game.config.swapTribe]}
              onChange={(t) =>
                upd((g) => {
                  g.config.swapTribe = t[0];
                })
              }
            />
          </div>
        )}
        <h3 className="mt-5 text-xl text-accent">Castaways</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alive(game).map((c) => (
            <div key={c.id} className="rounded-lg bg-secondary/60 p-3">
              <input
                className="mb-1 w-full rounded bg-transparent font-semibold outline-none focus:bg-secondary"
                value={c.name}
                onChange={(e) =>
                  upd((g) => {
                    byId(g, c.id).name = e.target.value;
                  })
                }
              />
              {[...SOCIAL_STATS, ...CHALLENGE_STATS].map((k) => (
                <StatPicker
                  key={k}
                  label={STAT_LABEL[k]}
                  value={c.stats[k]}
                  tone={SOCIAL_STATS.includes(k) ? "social" : "challenge"}
                  onChange={(v) =>
                    upd((g) => {
                      byId(g, c.id).stats[k] = v;
                    })
                  }
                />
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
            <p className="text-sm font-semibold" style={{ color: t.color }}>
              {t.name}
            </p>
            <ul className="mt-1 space-y-1 text-sm">
              {als.map((a) => (
                <li key={a.id}>
                  <b>{a.name}</b>{" "}
                  <span className="text-muted-foreground">
                    ({a.members.length}): {a.members.map((m) => byId(game, m).name).join(", ")}
                  </span>
                </li>
              ))}
            </ul>
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
          <ul className="mt-1 space-y-1 text-sm">
            {groups.map((g) => (
              <li key={g.alliance}>
                <b>{g.alliance}</b> ({g.members.map((m) => byId(game, m).name).join(", ")}) →{" "}
                <span className="text-primary">{byId(game, g.target).name}</span>{" "}
                <span className="text-muted-foreground">— {g.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Individual targets</p>
        <ul className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
          {individual.map((p) => (
            <li key={p.voter}>
              {byId(game, p.voter).name} → <span className="text-primary">{byId(game, p.target).name}</span>{" "}
              <span className="text-muted-foreground">— {p.reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RelationshipsPanel({ game }: { game: GameState }) {
  const id = game.config.controlledId;
  if (!id) return null;
  const me = byId(game, id);
  if (me.out) return null;
  const others = alive(game)
    .filter((c) => c.id !== id && (game.merged || c.tribeId === me.tribeId))
    .sort((a, b) => getRel(game, id, b.id) - getRel(game, id, a.id));
  const label = (v: number) =>
    v >= 25 ? "Close bond" : v >= 10 ? "Friendly" : v > -5 ? "Neutral" : v > -20 ? "Tense" : "Enemies";
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="text-2xl text-accent">Your Relationships</h2>
      <p className="text-xs text-muted-foreground">Your mood: {me.mood}/100</p>
      <ul className="mt-2 space-y-1 text-sm">
        {others.map((c) => {
          const v = getRel(game, id, c.id);
          return (
            <li key={c.id} className="flex items-center gap-2">
              <span className="w-28 truncate">{c.name}</span>
              <div className="relative h-2 flex-1 rounded bg-muted">
                <div
                  className={`absolute top-0 h-full rounded ${v >= 0 ? "left-1/2 bg-success" : "right-1/2 bg-destructive"}`}
                  style={{ width: `${Math.abs(v)}%` }}
                />
              </div>
              <span className="w-24 text-right text-xs text-muted-foreground">
                {label(v)} ({v > 0 ? "+" : ""}
                {v})
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PonderosaPanel({ game }: { game: GameState }) {
  const logs = game.episodes.flatMap((e) => e.entries).filter((e) => e.kind === "jury");
  if (!logs.length) return null;
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="text-2xl text-accent">Ponderosa</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {[...logs].reverse().map((e, i) => (
          <li key={i}>
            <b>{e.title.replace("Ponderosa — ", "")}</b>: {e.text}
            {e.details?.length ? (
              <span className="block text-xs text-muted-foreground">{e.details.join(" ")}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Reads parchments one at a time, like Jeff at the urn; the sealing vote comes last. */
function revealOrder(votes: Vote[], out?: string) {
  const counted = votes.filter((v) => !v.nullified);
  const L = counted.filter((v) => v.target === out),
    O = counted.filter((v) => v.target !== out);
  const seq: Vote[] = [];
  while (L.length || O.length) {
    const vote = O.length && (L.length <= 1 || seq.length % 2 === 0) ? O.shift() : L.shift();
    if (vote) seq.push(vote);
  }
  return [...votes.filter((v) => v.nullified), ...seq];
}
function getVotingConfessional(g: GameState, vote: Vote, isFinale: boolean): string {
  const voter = byId(g, vote.voter);
  const target = byId(g, vote.target);
  if (!voter || !target) return "My vote is locked in.";

  // Makes each parchment's quote vary by the full voter/target IDs,
  // the current episode, and the vote's position in that episode.
  const currentEpisode = g.episodes[g.episodes.length - 1];
  const voteNumber =
    currentEpisode?.entries
      .flatMap((entry) => [...(entry.votes ?? []), ...(entry.revote ?? [])])
      .findIndex((entryVote) => entryVote === vote) ?? 0;

  const hashText = `${vote.voter}-${vote.target}-${g.day}-${g.episodes.length}-${voteNumber}`;
  const seed = [...hashText].reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0);

  if (isFinale) {
    const finaleQuotes = [
      "You played the most complete, dominant game out here. You earned this.",
      "From day one, you adapted to every twist and never quit. My vote is yours.",
      "Outwit, outplay, outlast. You checked every single box.",
      "You owned every move you made at final tribal council. Full respect.",
      "You didn't hide behind anyone. You made the hard decisions.",
      "I respect the game you played, even the move that sent me to the jury.",
      "Your story was messy, but your recovery was impressive.",
      "You built real relationships while still making the moves that mattered.",
      "I came in wanting an explanation, and you gave me one.",
      "You survived every round when your name was on the line. That matters.",
    ];
    return finaleQuotes[Math.abs(seed) % finaleQuotes.length];
  }

  if (vote.nullified) {
    const nullQuotes = [
      "I had a gut feeling you were holding something, but I had to shoot my shot.",
      "If this flushes your idol, it's worth it. See what happens.",
      "Hoping this counts tonight, but you're too slippery to trust.",
      "Even if this vote gets wiped out, it tells me where the lines are.",
      "I knew this might be blocked, but I could not let you feel comfortable.",
      "You forced my hand tonight. Idol or not, I had to take the swing.",
    ];
    return nullQuotes[Math.abs(seed) % nullQuotes.length];
  }

  const quotes = [
    "Nothing personal, strictly numbers tonight.",
    "You're way too dangerous to keep around. If we don't take you out now, you win.",
    "I made a promise to my alliance, and I stick to my word.",
    "You got caught whispering five minutes before tribal. Bad move.",
    "You've been steering votes from the shadows. Time for a blindside.",
    "You thought you had the numbers tonight. Surprise.",
    "You're a massive threat in challenges and everyone knows it.",
    "You broke trust earlier, and tonight it finally catches up to you.",
    "You're too charming. No one beats you if you make it to the end.",
    "Payback for last week.",
    "The lines were drawn, and you ended up on the wrong side.",
    "Masterminds don't make it to Day 39. Time to go.",
    "I cannot keep letting you control the conversation around camp.",
    "This is the move that gives me a better path forward.",
    "You were not expecting my name on this vote, and that is exactly the point.",
    "I need to prove I can make a decision instead of just following one.",
    "We have worked together, but tonight our games are going in different directions.",
    "You are too connected. If I wait any longer, it will be too late.",
    "I respect you, which is exactly why I need you gone.",
    "The plan changed, and I had to decide where I stood.",
    "You have been playing both sides for too long.",
    "This vote is for my game, not for camp friendships.",
    "I do not want to sit next to you at the end. Simple as that.",
    "Everyone sees how well-positioned you are. Tonight, that catches up to you.",
  ];

  return quotes[Math.abs(seed) % quotes.length];
}

export function VoteReveal({ g, e, onDone }: { g: GameState; e: LogEntry; onDone: () => void }) {
  const isFinale = e.kind === "finale";
  const isRevote = !!e.revote?.length;
  const seq = revealOrder(isRevote ? (e.revote ?? []) : (e.votes ?? []), isFinale ? g.winner : e.out);
  const [n, setN] = useState(0);
  const shown = seq.slice(0, n);
  const counts: Record<string, number> = {};
  shown.forEach((v) => {
    if (!v.nullified) counts[v.target] = (counts[v.target] ?? 0) + 1;
  });
  const last: any = shown.at(-1);
  const finished = n >= seq.length;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur">
      <div className="w-full max-w-lg rounded-2xl border-2 border-primary bg-card p-6 text-center torch-glow">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{e.title}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {n === 0
            ? isFinale
              ? `"I'll read the votes to crown the Sole Survivor." ${seq.length} jury vote${seq.length === 1 ? "" : "s"}.`
              : `"I'll read the ${isRevote ? "revote " : ""}votes." ${seq.length} parchment${seq.length === 1 ? "" : "s"}.`
            : last.nullified
              ? "Does not count"
              : `${isFinale ? "Jury " : isRevote ? "Revote · " : ""}Vote ${shown.filter((v) => !v.nullified).length}`}
        </p>
        <div className="my-6 flex min-h-36 items-center justify-center rounded-lg border bg-secondary/60 p-6">
          {last ? (
            <div className="flex flex-col items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
              <span
                key={n}
                className={`font-display text-5xl tracking-wide ${last.nullified ? "line-through text-muted-foreground" : "text-primary"}`}
              >
                {byId(g, last.target).name}
              </span>
              <p className="max-w-md italic text-xs md:text-sm text-foreground/80 mt-1 px-4">
                “{getVotingConfessional(g, last, isFinale)}”
              </p>
              <span className="text-[11px] text-muted-foreground">
                — {byId(g, last.voter)?.name || "Castaway"} {isFinale ? "(Jury Vote)" : "in the voting booth"}
              </span>
            </div>
          ) : (
            <span className="text-4xl">📜</span>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          {Object.entries(counts).map(([k, c]) => (
            <span key={k} className="rounded bg-secondary px-2 py-1">
              {isRevote ? "Revote · " : ""}
              {byId(g, k).name}: <b>{c}</b>
            </span>
          ))}
        </div>
        {finished && <p className="mt-4 text-sm">{e.text}</p>}
        <div className="mt-5 flex justify-center gap-2">
          {!finished ? (
            <Button onClick={() => setN(n + 1)}>Read next vote</Button>
          ) : (
            <Button onClick={onDone}>Continue</Button>
          )}
          {!finished && (
            <Button variant="secondary" onClick={() => setN(seq.length)}>
              Skip to result
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
