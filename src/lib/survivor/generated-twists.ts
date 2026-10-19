import { z } from "zod";

export const twistEffectSchema = z.object({
  kind: z.enum(["challenge_boost", "bond_shift", "morale_shift"]),
  target: z.enum(["lowest_mood", "highest_mood", "most_wins", "fewest_wins", "least_connected", "most_connected"]),
  scope: z.enum(["tribes", "merged", "both"]),
  rounds: z.array(z.number().int().min(1).max(8)).min(1).max(4),
  stat: z.enum(["general", "physical", "mental"]),
  amount: z.number().int().min(1).max(3),
});
export const generatedTwistSchema = z.object({
  name: z.string().min(4).max(70),
  inspiration: z.string().min(10).max(240),
  effects: z.array(twistEffectSchema).min(2).max(4),
});
export type GeneratedTwist = z.infer<typeof generatedTwistSchema>;
export type TwistEffect = z.infer<typeof twistEffectSchema>;
export const targetLabels: Record<TwistEffect["target"], string> = {
  lowest_mood: "the player with the lowest morale", highest_mood: "the player with the highest morale",
  most_wins: "the player with the most individual challenge wins", fewest_wins: "the player with the fewest individual challenge wins",
  least_connected: "the player with the weakest combined relationships", most_connected: "the player with the strongest combined relationships",
};
export function twistRules(twist: GeneratedTwist): string[] {
  return twist.effects.map((e) => `On challenge rounds ${[...new Set(e.rounds)].sort((a,b) => a-b).join(", ")} ${e.scope === "tribes" ? "before the merge, in each tribe" : e.scope === "merged" ? "after the merge" : "in each active tribe"}, ${targetLabels[e.target]} ${e.kind === "challenge_boost" ? `gets a reward and immunity score bonus of ${e.amount} × their ${e.stat} stat ÷ 5 that round` : e.kind === "morale_shift" ? `gains ${e.amount * 5} morale` : `builds +${e.amount * 2} relationship with their least-close tribemate`}. Ties go alphabetically. Ends before final five.`);
}
// Ignore cosmetic text and effect order: renaming identical gameplay is not a new twist.
export function twistRulesKey(twist: GeneratedTwist): string {
  return JSON.stringify(twist.effects.map((e) => JSON.stringify({ kind: e.kind, target: e.target, scope: e.scope, rounds: [...new Set(e.rounds)].sort((a,b) => a-b), stat: e.kind === "challenge_boost" ? e.stat : "general", amount: e.amount })).sort());
}
export function validateGeneratedTwist(value: unknown): GeneratedTwist {
  const twist = generatedTwistSchema.parse(value);
  if (/\b(edge of extinction|eoe|exile|summit|journey|fire.?making|double tribal|redemption|amulet|beware|idol|extra vote|steal.a.vote|vote blocker|knowledge is power)\b/i.test(`${twist.name} ${twist.inspiration}`)) throw new Error("Twist overlaps an existing setting or advantage.");
  if (new Set(twist.effects.map((e) => JSON.stringify(e))).size !== twist.effects.length) throw new Error("Repeated effect.");
  return twist;
}