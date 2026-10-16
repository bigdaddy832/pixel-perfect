import { z } from "zod";

const tribe = z.object({ id: z.string(), name: z.string().min(1), color: z.string().regex(/^#[0-9a-f]{6}$/i) });
export const settingsSchema = z.object({
  count: z.union([z.literal(12), z.literal(16), z.literal(18), z.literal(20)]),
  tribeCount: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  finalSize: z.union([z.literal(2), z.literal(3)]),
  fire: z.boolean(), jury: z.number().int().min(3).max(17),
  swap: z.boolean(), swapAt: z.number().int().min(1).max(20),
  mergeAt: z.number().int().min(1).max(20),
  mergeTribe: tribe, swapTribe: tribe, tribes: z.array(tribe).length(4),
  addSwapTribe: z.boolean(), joint: z.boolean(), double: z.boolean(),
  edge: z.boolean(), journeys: z.boolean(), exile: z.boolean(), beware: z.boolean(),
});
export type SeasonSettings = z.infer<typeof settingsSchema>;
const presetSchema = z.object({ name: z.string().trim().min(1).max(60), settings: settingsSchema });
export type SettingsPreset = z.infer<typeof presetSchema>;
export const PRESETS_KEY = "survivor-sim-settings-presets-v1";

/** Ignore malformed saved entries without losing other usable presets. */
export function readPresets(raw: string | null): SettingsPreset[] {
  try {
    const data: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.flatMap((entry) => {
      const parsed = presetSchema.safeParse(entry);
      return parsed.success ? [parsed.data] : [];
    });
  } catch { return []; }
}