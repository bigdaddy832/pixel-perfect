// @ts-nocheck -- indexing guarded by game invariants
import { useState } from "react";
import {
  CHALLENGE_STATS,
  SOCIAL_STATS,
  STAT_LABEL,
  TRIBE_COLORS,
  MERGE_NAMES,
  defaultJury,
  defaultMergeAt,
  makeRoster,
  newGame,
  randomStats,
  randomTribeColor,
  randomTribeName,
  randStat,
  type Config,
  type GameState,
  type StatKey,
  type Tribe,
} from "@/lib/survivor/engine";
import { StatPicker, TribeEditor } from "./shared";
import { Button } from "@/components/ui/button";
import { SettingsPresets } from "./SettingsPresets";
import { markTitleUsed, randomSeasonTitle, readUsedTitles } from "@/lib/survivor/season-titles";
import type { SeasonSettings } from "@/lib/survivor/settings-presets";

type Row = { name: string; stats: Record<StatKey, number>; tribeIndex: number };

/** Invented tribe names picked fresh every time the start page opens. */
function freshTribeNames() {
  const used: string[] = [];
  const pick = () => {
    const n = randomTribeName(used);
    used.push(n);
    return n;
  };
  return { starting: [pick(), pick(), pick(), pick()], merge: pick(), swap: pick() };
}

export function Setup({ onStart }: { onStart: (g: GameState) => void }) {
  const [savedGame, setSavedGame] = useState<GameState | null>(() => {
    try {
      const raw = localStorage.getItem("survivor-sim-backup") || localStorage.getItem("survivor-sim-season");
      const parsed = raw ? (JSON.parse(raw) as GameState) : null;
      return parsed && parsed.phase !== "done" ? parsed : null;
    } catch {
      return null;
    }
  });
  const [names] = useState(freshTribeNames);
  const [seasonTitle, setSeasonTitle] = useState(() => randomSeasonTitle(readUsedTitles()));
  const changeTitle = (title: string) => {
    setSeasonTitle(title);
  };
  const [count, setCount] = useState(18);
  const [tribeCount, setTribeCount] = useState(2);
  const [finalSize, setFinalSize] = useState<2 | 3>(3);
  const [fire, setFire] = useState(true);
  const [jury, setJury] = useState(defaultJury(18));
  const [swap, setSwap] = useState(true);
  const [swapAt, setSwapAt] = useState(15);
  const [mergeAt, setMergeAt] = useState(defaultMergeAt(18, 8, 3));
  const [mergeTribe, setMergeTribe] = useState<Tribe>({ id: "merged", name: names.merge, color: TRIBE_COLORS[2] });
  const [swapTribe, setSwapTribe] = useState<Tribe>({ id: "swap-third", name: names.swap, color: TRIBE_COLORS[2] });
  const [addSwapTribe, setAddSwapTribe] = useState(true);
  const [joint, setJoint] = useState(true);
  const [double, setDouble] = useState(true);
  const [edge, setEdge] = useState(false);
  const [journeys, setJourneys] = useState(true);
  const [exile, setExile] = useState(false);
  const [beware, setBeware] = useState(true);
  const [sitd, setSitd] = useState(true);
  const [demerge, setDemerge] = useState(true);
  const [idolGifting, setIdolGifting] = useState(false);
  const [earnMerge, setEarnMerge] = useState(false);
  const [tribes, setTribes] = useState<Tribe[]>(() =>
    [0, 1, 2, 3].map((i) => ({ id: `t${i}`, name: names.starting[i], color: TRIBE_COLORS[i] })),
  );
  const [roster, setRoster] = useState<Row[]>(() => makeRoster(18, 2));
  const [controlled, setControlled] = useState<number | null>(null);

  const recount = (n: number, tc = tribeCount, fs = finalSize) => {
    const j = defaultJury(n);
    setCount(n);
    setJury(j);
    setMergeAt(defaultMergeAt(n, j, fs));
    setSwapAt(n - 3);
    setRoster((r) => makeRoster(n, tc, r).map((p, i) => ({ ...p, tribeIndex: i % tc })));
    setControlled(null);
  };
  const upd = (i: number, f: (r: Row) => Row) => setRoster((rs) => rs.map((r, j) => (j === i ? f(r) : r)));

  const settings: SeasonSettings = {
    count,
    tribeCount,
    finalSize,
    fire,
    jury,
    swap,
    swapAt,
    mergeAt,
    mergeTribe,
    swapTribe,
    tribes,
    addSwapTribe,
    joint,
    double,
    edge,
    journeys,
    exile,
    beware,
    sitd,
    demerge,
    idolGifting,
    earnMerge,
  };
  const loadSettings = (s: SeasonSettings) => {
    setCount(s.count);
    setTribeCount(s.tribeCount);
    setFinalSize(s.finalSize);
    setFire(s.fire);
    setJury(s.jury);
    setSwap(s.swap);
    setSwapAt(s.swapAt);
    setMergeAt(s.mergeAt);
    setMergeTribe({ ...s.mergeTribe });
    setSwapTribe({ ...s.swapTribe });
    setTribes(s.tribes.map((t) => ({ ...t })));
    setAddSwapTribe(s.addSwapTribe);
    setJoint(s.joint);
    setDouble(s.double);
    setEdge(s.edge);
    setJourneys(s.journeys);
    setExile(s.exile);
    setBeware(s.beware);
    setSitd(s.sitd);
    setDemerge(s.demerge ?? true);
    setIdolGifting(s.idolGifting ?? false);
    setEarnMerge(s.earnMerge ?? false);
    setRoster((r) => makeRoster(s.count, s.tribeCount, r).map((p, i) => ({ ...p, tribeIndex: i % s.tribeCount })));
    setControlled(null);
  };
  const activeTribes = tribeCount === 3 ? [tribes[0], tribes[1], swapTribe] : tribes.slice(0, tribeCount);

  const randomizeTribeColors = () => {
    const used: string[] = [];
    const pick = () => {
      const c = randomTribeColor(used);
      used.push(c);
      return c;
    };
    const colors = tribes.slice(0, tribeCount).map(() => pick());
    setTribes((all) => all.map((t, i) => (i < tribeCount ? { ...t, color: colors[i] } : t)));
    const mc = pick();
    setMergeTribe((t) => ({ ...t, color: mc }));
    if (tribeCount === 3 || (swap && addSwapTribe)) {
      const sc = pick();
      setSwapTribe((t) => ({ ...t, color: sc }));
    }
  };

  const randomizeTribeNames = () => {
    const used: string[] = [];
    const pick = () => {
      const n = randomTribeName(used);
      used.push(n);
      return n;
    };
    const names = tribes.map(() => pick());
    setTribes((all) => all.map((t, i) => (i < tribeCount ? { ...t, name: names[i] } : t)));
    const mn = pick();
    setMergeTribe((t) => ({ ...t, name: mn }));
    const sn = pick();
    setSwapTribe((t) => ({ ...t, name: sn }));
  };

  const start = () => {
    if (readUsedTitles().some((t) => t.toLowerCase() === seasonTitle.trim().toLowerCase())) {
      changeTitle(randomSeasonTitle(readUsedTitles()));
      return;
    }
    const title =
      seasonTitle.trim() && !readUsedTitles().some((t) => t.toLowerCase() === seasonTitle.trim().toLowerCase())
        ? seasonTitle.trim()
        : randomSeasonTitle(readUsedTitles());
    // With 3 starting tribes, the configured "swap tribe" IS the third starting tribe.
    const active = activeTribes.map((t) => ({ ...t }));
    const cfg: Config = {
      playerCount: count,
      tribeCount,
      jurySize: jury,
      finalSize,
      fireAtF4: fire && finalSize === 3,
      swapEnabled: swap,
      swapAt,
      mergeAt: Math.min(mergeAt, count - 2),
      mergedName: mergeTribe.name,
      mergedColor: mergeTribe.color,
      swapTribe: swap && tribeCount === 2 && addSwapTribe ? { ...swapTribe } : undefined,
      jointTribals: joint,
      doubleTribals: double,
      edgeOfExtinction: edge,
      journeys,
      exileIsland: exile,
      bewareAdvantages: beware,
      shotInTheDark: sitd,
      demergeTwist: demerge,
      idolGifting,
      earnTheMerge: earnMerge,
      controlledId: controlled === null ? null : `c${controlled}`,
      seasonTitle: title,
    };
    markTitleUsed(title);
    onStart(
      newGame(
        cfg,
        active,
        roster.map((r, i) => ({ ...r, tribeIndex: i % tribeCount })),
      ),
    );
  };

  const sel = "rounded-md border border-input bg-secondary px-2 py-1.5 text-sm";
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {savedGame && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <p className="font-semibold text-emerald-400">
                Autosaved Season Found: {savedGame.config?.seasonTitle || "In-Progress Season"}
              </p>
              <p className="text-xs text-muted-foreground">
                Day {savedGame.day} · Episode {savedGame.episode} ·{" "}
                {savedGame.castaways.filter((c) => !c.eliminated && !c.out).length} castaways remaining
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onStart(savedGame)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Resume Season ▶
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("survivor-sim-backup");
                localStorage.removeItem("survivor-sim-season");
                setSavedGame(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Discard Autosave ✕
            </Button>
          </div>
        </div>
      )}
      <header className="mb-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Outwit · Outplay · Outlast</p>
        <h1 className="text-6xl md:text-7xl">Survivor Simulator</h1>
        <p className="mt-2 text-muted-foreground">Build your cast, set the twists, and watch the season unfold.</p>
      </header>

      <section className="mb-6 rounded-xl border bg-card p-5">
        <h2 className="text-2xl text-accent">Season Title</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            aria-label="Season title"
            className={`${sel} min-w-0 flex-1`}
            value={seasonTitle}
            onChange={(e) => changeTitle(e.target.value)}
          />
          <Button
            variant="secondary"
            onClick={() => changeTitle(randomSeasonTitle([...readUsedTitles(), seasonTitle]))}
          >
            🎲 New title
          </Button>
        </div>
        {readUsedTitles().some((t) => t.toLowerCase() === seasonTitle.trim().toLowerCase()) && (
          <p className="mt-1 text-xs text-destructive">You've already used this title — pick another.</p>
        )}
      </section>

      <SettingsPresets settings={settings} onLoad={loadSettings} />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-2xl text-accent">Season Format</h2>
          <Field label="Castaways">
            <select className={sel} value={count} onChange={(e) => recount(+e.target.value)}>
              {[12, 16, 18, 20].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Field>
          <Field label="Starting tribes">
            <select
              className={sel}
              value={tribeCount}
              onChange={(e) => {
                setTribeCount(+e.target.value);
                recount(count, +e.target.value);
              }}
            >
              {[2, 3, 4].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Field>
          <Field label="Jury size">
            <input
              type="number"
              min={3}
              max={count - 3}
              className={`${sel} w-20`}
              value={jury}
              onChange={(e) => setJury(+e.target.value)}
            />
          </Field>
          <Field label="Final">
            <select
              className={sel}
              value={finalSize}
              onChange={(e) => {
                const f = +e.target.value as 2 | 3;
                setFinalSize(f);
                setMergeAt(defaultMergeAt(count, jury, f));
              }}
            >
              <option value={3}>Final 3</option>
              <option value={2}>Final 2</option>
            </select>
          </Field>
          {finalSize === 3 && (
            <Field label="Forced fire-making at F4">
              <input
                type="checkbox"
                checked={fire}
                onChange={(e) => setFire(e.target.checked)}
                className="accent-primary size-4"
              />
            </Field>
          )}
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-2xl text-accent">Twists</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                ["Tribe swap", swap, setSwap, "Shuffle tribes partway through the pre-merge."],
                ["Joint tribals", joint, setJoint, "Two tribes attend one Tribal Council (max one per season)."],
                ["Double tribals", double, setDouble, "Two people go home in one night (max one per season)."],
                ["Edge of Extinction", edge, setEdge, "Voted-out players can fight their way back in at the merge."],
                ["Summit journeys", journeys, setJourneys, "Players are sent on journeys to risk their vote for advantages."],
                ["Exile Island", exile, setExile, "Reward winners can banish someone to Exile."],
                ["Beware advantages", beware, setBeware, "Shared amulets and Beware idols that come with a cost."],
                ["Shot in the Dark", sitd, setSitd, "Everyone gets one chance at safety in exchange for their vote."],
                ["Demerge", demerge, setDemerge, "At Final 10, two groups each hold their own Tribal Council."],
                ["Idol halves", idolGifting, setIdolGifting, "A found idol is half an idol; the finder must gift it to a tribemate."],
                ["Earn the merge", earnMerge, setEarnMerge, "First merged immunity is a team challenge; the losing team is vulnerable."],
              ] as [string, boolean, (v: boolean) => void, string][]
            ).map(([label, on, set, tip]) => (
              <button
                key={label}
                type="button"
                title={tip}
                aria-pressed={on}
                onClick={() => set(!on)}
                className={`rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                  on ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {on ? "✓ " : ""}
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Hover a twist to see what it does.</p>
          {swap && (
            <Field label="Swap at (remaining)">
              <input
                type="number"
                className={`${sel} w-20`}
                value={swapAt}
                onChange={(e) => setSwapAt(+e.target.value)}
              />
            </Field>
          )}
          <Field label="Merge at (remaining)">
            <input
              type="number"
              className={`${sel} w-20`}
              value={mergeAt}
              onChange={(e) => setMergeAt(+e.target.value)}
            />
          </Field>
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-2xl text-accent">Tribes & Mode</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={randomizeTribeNames}
              className="rounded-md bg-secondary px-2 py-1 text-xs hover:bg-muted"
            >
              🎲 Randomize every tribe name
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={randomizeTribeColors}
              className="rounded-md bg-secondary px-2 py-1 text-xs hover:bg-muted"
            >
              🎲 Randomize every tribe color
            </Button>
          </div>
          <h3 className="text-lg">Starting tribes</h3>
          <TribeEditor
            label="Starting tribe"
            tribes={activeTribes}
            onChange={(t) => {
              const third = t.find((y) => y.id === swapTribe.id);
              if (third) setSwapTribe(third);
              setTribes((all) => all.map((x) => t.find((y) => y.id === x.id) ?? x));
            }}
          />
          {tribeCount === 3 && (
            <p className="text-xs text-muted-foreground">Your third tribe uses the swap-tribe settings below.</p>
          )}
          <h3 className="border-t pt-3 text-lg">Merge tribe</h3>
          <TribeEditor label="Merge tribe" tribes={[mergeTribe]} onChange={(t) => setMergeTribe(t[0])} />
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setMergeTribe((t) => ({ ...t, name: MERGE_NAMES[Math.floor(Math.random() * MERGE_NAMES.length)] }))
            }
          >
            Suggest name
          </Button>
          {swap && tribeCount === 2 && (
            <div className="space-y-2 border-t pt-3">
              <Field label="Add a third tribe at swap">
                <input
                  type="checkbox"
                  checked={addSwapTribe}
                  onChange={(e) => setAddSwapTribe(e.target.checked)}
                  className="accent-primary size-4"
                />
              </Field>
              {addSwapTribe && (
                <TribeEditor label="Swap tribe" tribes={[swapTribe]} onChange={(t) => setSwapTribe(t[0])} />
              )}
            </div>
          )}
          <Field label="Play as">
            <select
              className={sel}
              value={controlled ?? ""}
              onChange={(e) => setControlled(e.target.value === "" ? null : +e.target.value)}
            >
              <option value="">Spectator (auto)</option>
              {roster
                .map((r, i) => ({ r, i }))
                .sort((a, b) => a.r.name.localeCompare(b.r.name))
                .map(({ r, i }) => (
                  <option key={i} value={i}>
                    {r.name}
                  </option>
                ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-3xl">The Cast</h2>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="rounded-md bg-secondary px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setRoster((r) => makeRoster(count, tribeCount).map((p, i) => ({ ...p, name: r[i].name })))}
            >
              Randomize all stats
            </Button>
            <Button
              variant="secondary"
              className="rounded-md bg-secondary px-3 py-2 text-sm hover:bg-muted"
              onClick={() => {
                setRoster((r) =>
                  makeRoster(
                    count,
                    tribeCount,
                    undefined,
                    r.map((x) => x.name),
                  ),
                );
                setControlled(null);
              }}
            >
              New random cast
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: tribeCount }, (_, ti) => (
            <div key={ti} className="space-y-3">
              <div
                className="rounded-md px-3 py-1.5 font-display text-2xl tracking-wider"
                style={{ backgroundColor: activeTribes[ti].color, color: "#111" }}
              >
                {activeTribes[ti].name}
              </div>
              {roster.map((p, i) =>
                i % tribeCount !== ti ? null : (
                  <div
                    key={i}
                    className={`rounded-lg border bg-card p-3 ${controlled === i ? "border-primary torch-glow" : ""}`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        className="flex-1 rounded bg-transparent text-lg font-semibold outline-none focus:bg-secondary px-1"
                        value={p.name}
                        onChange={(e) => upd(i, (r) => ({ ...r, name: e.target.value }))}
                      />
                      <Button
                        variant="secondary"
                        title="Randomize"
                        className="rounded bg-secondary px-2 py-1 text-xs hover:bg-muted"
                        onClick={() => upd(i, (r) => ({ ...r, stats: randomStats() }))}
                      >
                        🎲
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {[...SOCIAL_STATS, ...CHALLENGE_STATS].map((k) => (
                        <StatPicker
                          key={k}
                          label={STAT_LABEL[k]}
                          value={p.stats[k]}
                          tone={SOCIAL_STATS.includes(k) ? "social" : "challenge"}
                          onChange={(v) => upd(i, (r) => ({ ...r, stats: { ...r.stats, [k]: v } }))}
                        />
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-4 mt-8 flex justify-center">
        <Button
          variant="secondary"
          onClick={start}
          className="rounded-full bg-primary px-10 py-4 font-display text-3xl tracking-widest text-primary-foreground torch-glow hover:scale-105 transition"
        >
          Start the Season 🔥
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
