import { useEffect, useState } from "react";
import { Save, FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRESETS_KEY, readPresets, settingsSchema, type SeasonSettings, type SettingsPreset } from "@/lib/survivor/settings-presets";

export function SettingsPresets({ settings, onLoad }: { settings: SeasonSettings; onLoad: (settings: SeasonSettings) => void }) {
  const [presets, setPresets] = useState<SettingsPreset[]>([]);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    try { setPresets(readPresets(localStorage.getItem(PRESETS_KEY))); }
    catch { setMessage("Saved presets aren’t available in this browser."); }
  }, []);

  const persist = (next: SettingsPreset[]) => {
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(next)); setPresets(next); return true; }
    catch { setMessage("Couldn’t save. Your browser’s storage may be full or disabled."); return false; }
  };
  const save = () => {
    const cleanName = name.trim();
    const parsed = settingsSchema.safeParse(settings);
    if (!parsed.success) { setMessage("Check your settings before saving this preset."); return; }
    const existing = presets.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
    if (existing && !window.confirm(`Replace “${existing.name}” with your current settings?`)) return;
    const next = [...presets.filter((p) => p !== existing), { name: cleanName, settings: parsed.data }];
    if (persist(next)) { setSelected(cleanName); setMessage(`Saved “${cleanName}” on this browser.`); }
  };
  const load = () => {
    const preset = presets.find((p) => p.name === selected);
    if (!preset) return;
    onLoad(preset.settings); setName(preset.name); setMessage(`Loaded “${preset.name}”.`);
  };
  const remove = () => {
    if (!selected || !window.confirm(`Delete preset “${selected}”?`)) return;
    if (persist(presets.filter((p) => p.name !== selected))) { setSelected(""); setMessage("Preset deleted."); }
  };
  return <section className="mb-6 space-y-3 border-y py-4" aria-labelledby="presets-heading">
    <h2 id="presets-heading" className="text-2xl text-accent">Settings presets</h2>
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-0 flex-col gap-1 text-sm"><span className="text-muted-foreground">Preset name</span><input className="w-60 max-w-full rounded-md border border-input bg-secondary px-3 py-2" placeholder="My favorite season" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <Button variant="secondary" disabled={!name.trim()} onClick={save}><Save className="size-4" />Save preset</Button>
      <label className="flex min-w-0 flex-col gap-1 text-sm"><span className="text-muted-foreground">Saved presets</span><select className="w-60 max-w-full rounded-md border border-input bg-secondary px-3 py-2" value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Select a preset</option>{presets.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}</select></label>
      <Button variant="secondary" disabled={!selected} onClick={load}><FolderOpen className="size-4" />Load preset</Button>
      <Button variant="ghost" size="icon" aria-label="Delete preset" title="Delete preset" disabled={!selected} onClick={remove}><Trash2 className="size-4" /></Button>
    </div>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
  </section>;
}