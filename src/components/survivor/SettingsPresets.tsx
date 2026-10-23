import { useEffect, useState } from "react";
import { Save, FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/hooks/use-session";
import {
  LEGACY_PRESET_KEYS,
  PRESETS_KEY,
  mergePresets,
  readPresets,
  settingsSchema,
  type SeasonSettings,
  type SettingsPreset,
} from "@/lib/survivor/settings-presets";

/** Reads every browser key that has ever held presets and folds them into one list. */
function getStoredPresets(): SettingsPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const lists = [PRESETS_KEY, ...LEGACY_PRESET_KEYS].map((k) => readPresets(localStorage.getItem(k)));
    const merged = mergePresets(...lists);
    if (lists.slice(1).some((l) => l.length > 0)) {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(merged));
      for (const k of LEGACY_PRESET_KEYS) localStorage.removeItem(k);
    }
    return merged;
  } catch {
    return [];
  }
}

function writeLocal(next: SettingsPreset[]) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

async function fetchAccountPresets(userId: string): Promise<SettingsPreset[] | null> {
  const { data, error } = await supabase.from("settings_presets").select("name, settings").eq("user_id", userId);
  if (error || !data) return null;
  return readPresets(JSON.stringify(data));
}

export function SettingsPresets({
  settings,
  onLoad,
}: {
  settings: SeasonSettings;
  onLoad: (settings: SeasonSettings) => void;
}) {
  const { user } = useSessionUser();
  const userId = user?.id;
  const [presets, setPresets] = useState<SettingsPreset[]>([]);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPresets(getStoredPresets());
  }, []);

  // Signed in: show every preset on the account plus any only on this browser, and back those up to the account.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const account = await fetchAccountPresets(userId);
      if (cancelled || !account) return;
      const local = getStoredPresets();
      const merged = mergePresets(account, local);
      const accountNames = new Set(account.map((p) => p.name.toLowerCase()));
      const missing = local.filter((p) => !accountNames.has(p.name.toLowerCase()));
      if (missing.length > 0) {
        await supabase.from("settings_presets").upsert(
          missing.map((p) => ({ user_id: userId, name: p.name, settings: p.settings as never })),
          { onConflict: "user_id,name" },
        );
      }
      if (cancelled) return;
      writeLocal(merged);
      setPresets(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const save = async () => {
    const cleanName = name.trim();
    const parsed = settingsSchema.safeParse(settings);
    if (!parsed.success) {
      setMessage("Check your settings before saving this preset.");
      return;
    }
    const existing = presets.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
    if (existing && !window.confirm(`Replace “${existing.name}” with your current settings?`)) return;
    const next = mergePresets([{ name: cleanName, settings: parsed.data }], presets.filter((p) => p !== existing));
    const localOk = writeLocal(next);
    setPresets(next);
    setSelected(cleanName);
    if (userId) {
      if (existing && existing.name !== cleanName)
        await supabase.from("settings_presets").delete().eq("user_id", userId).eq("name", existing.name);
      const { error } = await supabase
        .from("settings_presets")
        .upsert(
          { user_id: userId, name: cleanName, settings: parsed.data as never, updated_at: new Date().toISOString() },
          { onConflict: "user_id,name" },
        );
      setMessage(error ? `Saved “${cleanName}” on this browser, but couldn’t back it up to your account.` : `Saved “${cleanName}” to your account.`);
      return;
    }
    setMessage(
      localOk
        ? `Saved “${cleanName}” on this browser. Sign in to keep it on every device.`
        : "Couldn’t save. Your browser’s storage may be full or disabled.",
    );
  };

  const loadByName = (chosen: string) => {
    const preset = presets.find((p) => p.name === chosen);
    if (!preset) return;
    onLoad(preset.settings);
    setName(preset.name);
    setMessage(`Loaded “${preset.name}”.`);
  };

  const remove = async () => {
    if (!selected || !window.confirm(`Delete preset “${selected}”?`)) return;
    const next = presets.filter((p) => p.name !== selected);
    writeLocal(next);
    setPresets(next);
    if (userId) await supabase.from("settings_presets").delete().eq("user_id", userId).eq("name", selected);
    setSelected("");
    setMessage("Preset deleted.");
  };

  return (
    <section className="mb-6 space-y-3 border-y py-4" aria-labelledby="presets-heading">
      <h2 id="presets-heading" className="text-2xl text-accent">
        Settings presets
      </h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Preset name</span>
          <input
            className="w-60 max-w-full rounded-md border border-input bg-secondary px-3 py-2"
            placeholder="My favorite season"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <Button variant="secondary" disabled={!name.trim()} onClick={save}>
          <Save className="size-4" />
          Save preset
        </Button>
        <label className="flex min-w-0 flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Saved presets ({presets.length})</span>
          <select
            aria-label="Saved presets"
            className="w-60 max-w-full rounded-md border border-input bg-secondary px-3 py-2"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              if (e.target.value) loadByName(e.target.value);
            }}
          >
            <option value="">Select a preset</option>
            {presets.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <Button variant="secondary" disabled={!selected} onClick={() => loadByName(selected)}>
          <FolderOpen className="size-4" />
          Load preset
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete preset"
          title="Delete preset"
          disabled={!selected}
          onClick={remove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </section>
  );
}
