import { TRIBE_COLORS, TRIBE_NAMES, type Tribe } from "@/lib/survivor/engine";

export function StatPicker({ label, value, onChange, tone }: { label: string; value: number; onChange: (v: number) => void; tone: "social" | "challenge" }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onChange(n)} aria-label={`${label} ${n}`}
            className={`h-3 w-3 rounded-sm transition ${n <= value ? (tone === "social" ? "bg-accent" : "bg-primary") : "bg-muted"}`} />
        ))}
      </div>
    </div>
  );
}

export function TribeEditor({ tribes, onChange }: { tribes: Tribe[]; onChange: (t: Tribe[]) => void }) {
  const set = (i: number, p: Partial<Tribe>) => onChange(tribes.map((t, j) => (j === i ? { ...t, ...p } : t)));
  return (
    <div className="space-y-2">
      {tribes.map((t, i) => (
        <div key={t.id} className="flex items-center gap-1.5">
          <input type="color" value={t.color} onChange={(e) => set(i, { color: e.target.value })} className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent" />
          <input list="tribe-names" value={t.name} onChange={(e) => set(i, { name: e.target.value })} className="min-w-0 flex-1 rounded-md border border-input bg-secondary px-2 py-1.5 text-sm" />
          <div className="flex gap-0.5">
            {TRIBE_COLORS.slice(0, 5).map((c) => <button key={c} onClick={() => set(i, { color: c })} className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: c }} aria-label="color" />)}
          </div>
        </div>
      ))}
      <datalist id="tribe-names">{TRIBE_NAMES.map((n) => <option key={n} value={n} />)}</datalist>
    </div>
  );
}
