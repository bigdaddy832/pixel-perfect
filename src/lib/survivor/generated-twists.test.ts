import { describe, expect, it } from "vitest";
import { validateGeneratedTwist } from "./generated-twists";

const base = { name: "Ember Ledger", inspiration: "Tokens decide who is safe each night.", effects: [
  { kind: "fire_tokens", target: "most_wins", scope: "both", rounds: [1], stat: "general", amount: 2 },
  { kind: "lost_vote", target: "random", scope: "tribes", rounds: [2], stat: "general", amount: 1 },
] };

describe("generated twists", () => {
  it("accepts show-style effects", () => expect(validateGeneratedTwist(base).effects).toHaveLength(2));
  it("rejects relationship and mood effects", () => {
    expect(() => validateGeneratedTwist({ ...base, effects: [{ ...base.effects[0], kind: "bond_shift" }, base.effects[1]] })).toThrow();
    expect(() => validateGeneratedTwist({ ...base, effects: [{ ...base.effects[0], kind: "morale_shift" }, base.effects[1]] })).toThrow();
  });
});
