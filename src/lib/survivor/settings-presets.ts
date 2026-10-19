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
});

export type SeasonSettings = z.infer<typeof settingsSchema>;

const presetSchema = z.object({
  name: z.string().trim().min(1).max(60),
  settings: settingsSchema,
});

export type SettingsPreset = z.infer<typeof presetSchema>;
export const PRESETS_KEY = "survivor-sim-settings-presets-v1";

/** Read presets safely with healing so older or partial presets are never lost */
export function readPresets(raw: string | null): SettingsPreset[] {
  try {
    const data: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.flatMap((entry) => {
      if (
        !entry ||
        typeof entry !== "object" ||
        !("name" in entry) ||
        typeof entry.name !== "string" ||
        !entry.name.trim()
      ) {
        return [];
      }
      const parsed = presetSchema.safeParse(entry);
      return parsed.success ? [parsed.data] : [];
    });
  } catch {
    return [];
  }
}
