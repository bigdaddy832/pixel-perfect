import { z } from "zod";

// Show-style building blocks (head starts, safety, lost votes, tokens) — never mood or relationship tweaks.
export const twistEffectSchema = z.object({
  kind: z.enum(["challenge_boost", "safety", "lost_vote", "fire_tokens"]),
  target: z.enum(["most_wins", "fewest_wins", "random"]),
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
export const TOKENS_FOR_SAFETY = 3;
export const targetLabels: Record<string, string> = {
  most_wins: "the player with the most individual challenge wins",
  fewest_wins: "the player with the fewest individual challenge wins",
  random: "a player drawn at random",
};
function effectText(e: TwistEffect): string {
  switch (e.kind) {
    case "challenge_boost":
      return `gets a head start worth ${e.amount} × their ${e.stat} stat ÷ 5 in that round's reward and immunity challenges`;
    case "safety":
      return "is safe at that round's Tribal Council";
    case "lost_vote":
      return "loses their vote at that round's Tribal Council";
    case "fire_tokens":
      return `earns ${e.amount} Fire Token${e.amount > 1 ? "s" : ""}; anyone reaching ${TOKENS_FOR_SAFETY} tokens automatically spends them on safety at that Tribal`;
  }
}
export function twistRules(twist: GeneratedTwist): string[] {
  return twist.effects.map((e) => `On challenge rounds ${[...new Set(e.rounds)].sort((a, b) => a - b).join(", ")} ${e.scope === "tribes" ? "before the merge, in each tribe" : e.scope === "merged" ? "after the merge" : "in each active tribe"}, ${targetLabels[e.target] ?? "a chosen player"} ${effectText(e) ?? "is affected"}. Ties go alphabetically. Ends before final five.`);
}
// Ignore cosmetic text and effect order: renaming identical gameplay is not a new twist.
export function twistRulesKey(twist: GeneratedTwist): string {
  return JSON.stringify(twist.effects.map((e) => JSON.stringify({ kind: e.kind, target: e.target, scope: e.scope, rounds: [...new Set(e.rounds)].sort((a, b) => a - b), stat: e.kind === "challenge_boost" ? e.stat : "general", amount: e.kind === "challenge_boost" || e.kind === "fire_tokens" ? e.amount : 1 })).sort());
}
export function validateGeneratedTwist(value: unknown): GeneratedTwist {
  const twist = generatedTwistSchema.parse(value);
  if (/\b(edge of extinction|eoe|exile|summit|journey|fire.?making|double tribal|redemption|amulet|beware|idol|extra vote|steal.a.vote|vote blocker|knowledge is power|relationship|morale|mood)\b/i.test(`${twist.name} ${twist.inspiration}`)) throw new Error("Twist overlaps an existing setting or advantage.");
  if (new Set(twist.effects.map((e) => JSON.stringify(e))).size !== twist.effects.length) throw new Error("Repeated effect.");
  return twist;
}

const KINDS: TwistEffect["kind"][] = ["challenge_boost", "safety", "lost_vote", "fire_tokens"];
const TARGETS: TwistEffect["target"][] = ["most_wins", "fewest_wins", "random"];
const NOUNS: Record<TwistEffect["kind"], string[]> = {
  challenge_boost: ["Head Start", "Running Start", "Edge"],
  safety: ["Sanctuary", "Shelter", "Reprieve"],
  lost_vote: ["Silence", "Muzzle", "Gag Order"],
  fire_tokens: ["Tokens", "Coin", "Embers"],
};
/** Offline twist builder used when AI generation is unavailable; reuses the same bounded effects. */
export function buildFallbackTwist(title: string, avoidRules: string[], avoidNames: string[], rand: () => number = Math.random): GeneratedTwist {
  const place = title.replace(/^Survivor:\s*/i, "").replace(/\s+\d+$/, "").trim() || "Island";
  const pickOne = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)] as T;
  for (let attempt = 0; attempt < 500; attempt++) {
    const count = 2 + Math.floor(rand() * 2);
    const kinds = [...KINDS].sort(() => rand() - 0.5).slice(0, count);
    const effects: TwistEffect[] = kinds.map((kind, i) => {
      const n = 1 + Math.floor(rand() * 3);
      const rounds = [...new Set(Array.from({ length: n }, () => 1 + Math.floor(rand() * 8)))];
      if (i === 0 && !rounds.includes(1)) rounds.push(1);
      return {
        kind, target: pickOne(TARGETS), scope: i === 0 ? "both" : pickOne(["tribes", "merged", "both"] as const),
        rounds: rounds.sort((a, b) => a - b).slice(0, 4), stat: kind === "challenge_boost" ? pickOne(["general", "physical", "mental"] as const) : "general",
        amount: 1 + Math.floor(rand() * 3),
      };
    });
    const name = `${place} ${pickOne(NOUNS[kinds[0]])}`.slice(0, 70);
    const twist: GeneratedTwist = { name: name.length >= 4 ? name : `${name} Twist`, inspiration: `A ${place} season where ${kinds.map((k) => ({ challenge_boost: "head starts", safety: "surprise safety", lost_vote: "lost votes", fire_tokens: "Fire Tokens" })[k]).join(", ")} shape every Tribal.`.slice(0, 240), effects };
    const nameKey = twist.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (avoidRules.includes(twistRulesKey(twist))) continue;
    if (avoidNames.includes(nameKey)) twist.name = `${twist.name.slice(0, 64)} ${attempt + 2}`;
    return validateGeneratedTwist(twist);
  }
  throw new Error("No unique fallback twist available");
}
