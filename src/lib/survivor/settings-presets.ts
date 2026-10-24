import { z } from "zod";

const tribe = z.object({
  id: z.string().default("t0"),
  name: z.string().min(1).catch("Tribe"),
  color: z.string().catch("#e8662a"),
});

export const settingsSchema = z.object({
  count: z.number().int().catch(18),
  tribeCount: z.number().int().catch(2),
  finalSize: z.union([z.literal(2), z.literal(3)]).catch(3),
  fire: z.boolean().catch(true),
  jury: z.number().int().catch(8),
  swap: z.boolean().catch(true),
  swapAt: z.number().int().catch(15),
  mergeAt: z.number().int().catch(10),
  mergeTribe: tribe.catch({ id: "merged", name: "Merge", color: "#e3c13b" }),
  swapTribe: tribe.catch({ id: "swap-third", name: "Swap", color: "#3fae5a" }),
  tribes: z
    .array(tribe)
    .min(1)
    .catch([
      { id: "t0", name: "Tribe 1", color: "#e8662a" },
      { id: "t1", name: "Tribe 2", color: "#2f7fd6" },
    ]),
  addSwapTribe: z.boolean().catch(true),
  joint: z.boolean().catch(true),
  double: z.boolean().catch(true),
  edge: z.boolean().catch(false),
  journeys: z.boolean().catch(true),
  exile: z.boolean().catch(false),
  beware: z.boolean().catch(true),
  sitd: z.boolean().catch(true),
  demerge: z.boolean().catch(true),
  idolGifting: z.boolean().catch(false),
  earnMerge: z.boolean().catch(false),
});

export type SeasonSettings = z.infer<typeof settingsSchema>;

const presetSchema = z.object({
  name: z.string().trim().min(1).max(60),
  settings: settingsSchema,
});

export type SettingsPreset = z.infer<typeof presetSchema>;
export const PRESETS_KEY = "survivor-sim-settings-presets-v1";
/** Older browser keys that may still hold presets; they are merged into PRESETS_KEY. */
export const LEGACY_PRESET_KEYS = ["survivor-sim-settings-presets", "survivor-settings-presets", "presets"];

/** Combine preset lists, keeping one per name (case-insensitive). Earlier lists win on conflicts. */
export function mergePresets(...lists: SettingsPreset[][]): SettingsPreset[] {
  const seen = new Map<string, SettingsPreset>();
  for (const list of lists)
    for (const p of list) {
      const key = p.name.trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, p);
    }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Read presets safely with healing so older, flat, or partial presets are never lost */
export function readPresets(raw: string | null): SettingsPreset[] {
  try {
    const data: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const rec = entry as Record<string, unknown>;
      const rawName = rec["name"] ?? rec["title"] ?? rec["label"] ?? rec["presetName"] ?? "Saved Preset";
      const name = String(rawName).trim().slice(0, 60);
      if (!name) return [];

      let rawSettings = rec["settings"] ?? entry;
      if (typeof rawSettings === "string") {
        try {
          rawSettings = JSON.parse(rawSettings);
        } catch {
          rawSettings = {};
        }
      }
      if (!rawSettings || typeof rawSettings !== "object") {
        rawSettings = {};
      }

      const parsed = settingsSchema.safeParse(rawSettings);
      const settings = parsed.success ? parsed.data : settingsSchema.parse({});
      return [{ name, settings }];
    });
  } catch {
    return [];
  }
}
