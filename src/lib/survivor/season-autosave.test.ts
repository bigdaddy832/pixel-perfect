import { describe, expect, it } from "vitest";
import { pickNewest, isSeason, type SavedSeason } from "./season-autosave";
import type { GameState } from "./engine";

const g = (phase: string) => ({ phase, castaways: [], episodes: [] }) as unknown as GameState;

describe("season autosave", () => {
  it("keeps the newer account copy when the browser copy is older", () => {
    const local: SavedSeason = { game: g("camp"), savedAt: 100 };
    const remote: SavedSeason = { game: g("tribal"), savedAt: 200 };
    expect(pickNewest(local, remote)).toBe(remote);
  });
  it("keeps the browser copy when it is newer or tied", () => {
    const local: SavedSeason = { game: g("camp"), savedAt: 200 };
    expect(pickNewest(local, { game: g("tribal"), savedAt: 200 })).toBe(local);
    expect(pickNewest(local, { game: g("tribal"), savedAt: 50 })).toBe(local);
  });
  it("restores from the account when the browser lost its copy", () => {
    const remote: SavedSeason = { game: g("camp"), savedAt: 5 };
    expect(pickNewest(null, remote)).toBe(remote);
  });
  it("rejects corrupt saves instead of loading them", () => {
    expect(isSeason({ phase: "camp" })).toBe(false);
    expect(isSeason(g("camp"))).toBe(true);
  });
});
