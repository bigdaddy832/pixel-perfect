import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Setup } from "./Setup";
import { PRESETS_KEY, readPresets } from "@/lib/survivor/settings-presets";
import { simulateToEnd, type GameState } from "@/lib/survivor/engine";
import { mergePresets, settingsSchema } from "@/lib/survivor/settings-presets";

// Fake account: tests can set a signed-in user and the presets stored on that account.
const account = vi.hoisted(() => ({ user: null as null | { id: string }, rows: [] as { name: string; settings: unknown }[] }));
vi.mock("@/integrations/supabase/client", () => {
  const chain = () => {
    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.delete = () => q;
    q.eq = () => q;
    q.upsert = (rows: unknown) => {
      for (const r of [rows].flat() as { name: string; settings: unknown }[]) {
        account.rows = account.rows.filter((x) => x.name !== r.name).concat({ name: r.name, settings: r.settings });
      }
      return Promise.resolve({ error: null });
    };
    q.then = (res: (v: unknown) => void) => res({ data: account.rows, error: null });
    return q;
  };
  return {
    supabase: {
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getSession: () => Promise.resolve({ data: { session: account.user ? { user: account.user } : null } }),
      },
      from: () => chain(),
    },
  };
});

beforeEach(() => { localStorage.clear(); account.user = null; account.rows = []; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe("Season settings presets", () => {
  it("saves and reloads all settings without saving the cast", () => {
    const onStart = vi.fn();
    const view = render(<Setup onStart={onStart} />);
    fireEvent.change(screen.getByLabelText("Castaways"), { target: { value: "16" } });
    fireEvent.change(screen.getByLabelText("Starting tribes"), { target: { value: "4" } });
    fireEvent.click(screen.getByLabelText("Exile Island"));
    fireEvent.change(screen.getByLabelText("Preset name"), { target: { value: "Four tribes" } });
    fireEvent.click(screen.getByRole("button", { name: "Save preset" }));
    const saved = readPresets(localStorage.getItem(PRESETS_KEY));
    expect(saved[0]?.settings).toMatchObject({ count: 16, tribeCount: 4, exile: true });
    expect(saved[0]?.settings).not.toHaveProperty("roster");
    view.unmount();
    render(<Setup onStart={onStart} />);
    fireEvent.change(screen.getByLabelText("Saved presets"), { target: { value: "Four tribes" } });
    fireEvent.click(screen.getByRole("button", { name: "Load preset" }));
    expect(screen.getByLabelText("Castaways")).toHaveValue("16");
    expect(screen.getByLabelText("Starting tribes")).toHaveValue("4");
    expect(screen.getByLabelText("Exile Island")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: /Start the Season/ }));
    const call = onStart.mock.calls[0];
    if (!call) throw new Error("Season did not start");
    const game: GameState = call[0];
    expect(game.tribes).toHaveLength(4);
    expect(game.castaways).toHaveLength(16);
    for (const t of game.tribes) expect(game.castaways.filter((c) => c.tribeId === t.id)).toHaveLength(4);
    expect(simulateToEnd(game).phase).toBe("done");
  });
  it("confirms replacement and deletion", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Setup onStart={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Preset name"), { target: { value: "Favorite" } });
    fireEvent.click(screen.getByRole("button", { name: "Save preset" }));
    fireEvent.change(screen.getByLabelText("Castaways"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "Save preset" }));
    expect(readPresets(localStorage.getItem(PRESETS_KEY))).toHaveLength(1);
    expect(readPresets(localStorage.getItem(PRESETS_KEY))[0]?.settings.count).toBe(12);
    fireEvent.click(screen.getByRole("button", { name: "Delete preset" }));
    expect(readPresets(localStorage.getItem(PRESETS_KEY))).toEqual([]);
  });
  it("safely ignores broken saved data", () => {
    expect(readPresets("not json")).toEqual([]);
    expect(readPresets('{"not":"a list"}')).toEqual([]);
  });
  it("heals a preset with broken settings instead of dropping it", () => {
    const healed = readPresets('[{"name":"bad","settings":{}}]');
    expect(healed).toHaveLength(1);
    expect(healed[0]?.settings.count).toBe(18);
  });
  it("shows presets from every older browser key, not just the first", () => {
    const one = settingsSchema.parse({ count: 16 });
    localStorage.setItem("survivor-sim-settings-presets-v1", JSON.stringify([{ name: "A", settings: one }]));
    localStorage.setItem("survivor-sim-settings-presets", JSON.stringify([{ name: "B", settings: one }]));
    render(<Setup onStart={vi.fn()} />);
    const options = Array.from(screen.getByLabelText("Saved presets").querySelectorAll("option")).map((o) => o.textContent);
    expect(options).toEqual(["Select a preset", "A", "B"]);
  });
  it("signed in: shows account presets and backs up browser-only ones", async () => {
    const one = settingsSchema.parse({});
    account.user = { id: "u1" };
    account.rows = [{ name: "From account", settings: one }];
    localStorage.setItem(PRESETS_KEY, JSON.stringify([{ name: "Only here", settings: one }]));
    render(<Setup onStart={vi.fn()} />);
    expect(await screen.findByRole("option", { name: "From account" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Only here" })).toBeInTheDocument();
    expect(account.rows.map((r) => r.name).sort()).toEqual(["From account", "Only here"]);
  });
  it("merges duplicate names case-insensitively", () => {
    const one = settingsSchema.parse({});
    expect(mergePresets([{ name: "Fav", settings: one }], [{ name: "fav", settings: one }])).toHaveLength(1);
  });
});
