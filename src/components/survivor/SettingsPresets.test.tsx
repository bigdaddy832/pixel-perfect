import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Setup } from "./Setup";
import { PRESETS_KEY, readPresets } from "@/lib/survivor/settings-presets";
import { simulateToEnd, type GameState } from "@/lib/survivor/engine";

beforeEach(() => localStorage.clear());
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
    expect(readPresets('[{"name":"bad","settings":{}}]')).toEqual([]);
  });
});