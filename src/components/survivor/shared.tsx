import { TRIBE_COLORS, TRIBE_NAMES, type Tribe } from "@/lib/survivor/engine";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function TribeColorPicker({ color, onChange, label }: { color: string; onChange: (color: string) => void; label: string }) {
  const [hex, setHex] = useState(color);
  useEffect(() => { setHex(color); }, [color]);
  const valid = /^#[0-9a-f]{6}$/i.test(hex);
  return (
    <div className="flex shrink-0 items-center gap-2">
      <input type="color" aria-label={`${label} color wheel`} value={color} onChange={(e) => onChange(e.target.value)} className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent" />
      <input aria-label={`${label} hex color`} aria-invalid={!valid} value={hex} maxLength={7} spellCheck={false} onChange={(e) => {
        const next = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
        setHex(next);
        if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next);
      }} onBlur={() => { if (!valid) setHex(color); }} className="w-24 rounded-md border border-input bg-secondary px-2 py-1.5 font-mono text-xs aria-invalid:border-destructive" />
    </div>
  );
}

export function StatPicker({ label, value, onChange, tone }: { label: string; value: number; onChange: (v: number) => void; tone: "social" | "challenge" }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Button variant="ghost" key={n} onClick={() => onChange(n)} aria-label={`${label} ${n}`}
            className={`h-3 w-3 rounded-sm p-0 transition ${n <= value ? (tone === "social" ? "bg-accent" : "bg-primary") : "bg-muted"}`} />
        ))}
      </div>
    </div>
  );
}

export function TribeEditor({ tribes, onChange, label = "Tribe" }: { tribes: Tribe[]; onChange: (t: Tribe[]) => void; label?: string }) {
  const set = (i: number, p: Partial<Tribe>) => onChange(tribes.map((t, j) => (j === i ? { ...t, ...p } : t)));
  return (
    <div className="space-y-2">
      {tribes.map((t, i) => (
        <div key={t.id} className="space-y-1.5">
          <input aria-label={`${label} ${i + 1} name`} list="tribe-names" value={t.name} onChange={(e) => set(i, { name: e.target.value })} className="w-full min-w-0 rounded-md border border-input bg-secondary px-2 py-1.5 text-sm" />
          <div className="flex flex-wrap items-center gap-2">
            <TribeColorPicker color={t.color} onChange={(color) => set(i, { color })} label={`${label} ${i + 1}`} />
            <div className="flex gap-1">
              {TRIBE_COLORS.slice(0, 5).map((c) => <Button variant="ghost" key={c} onClick={() => set(i, { color: c })} className="h-4 w-4 rounded-full border border-border p-0" style={{ backgroundColor: c }} aria-label={`${label} ${i + 1} color ${c}`} />)}
            </div>
          </div>
        </div>
      ))}
      <datalist id="tribe-names">{TRIBE_NAMES.map((n) => <option key={n} value={n} />)}</datalist>
    </div>
  );
}
