import { test, expect } from "vitest";
import * as E from "@/lib/survivor/engine";
test("checks", () => {
  for (let i = 0; i < 60; i++) {
    const g: any = (E as any).simulateToEnd((E as any).newGame ? (E as any).newGame() : null);
    if (!g) return;
    const ftc = g.episodes.flatMap((e: any) => e.entries).find((x: any) => x.title.startsWith("Final Tribal Council"));
    const qs = ftc.details.map((d: string) => d.split(": ").slice(1).join(": "));
    expect(new Set(qs).size).toBe(qs.length);
  }
});
