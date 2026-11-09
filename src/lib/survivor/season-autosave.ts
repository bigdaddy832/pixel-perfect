// Autosave for the current season. The browser copy is the fast path; signed-in players also get an
// account copy so a season survives cleared/partitioned browser storage or switching tabs and devices.
// Saves are only ever removed by an explicit player action (discard or starting a new season).
import type { GameState } from "./engine";
import { supabase } from "@/integrations/supabase/client";

export const SAVE_KEY = "survivor-sim-season";
export const SAVED_AT_KEY = "survivor-sim-season-saved-at";
export const PREVIOUS_KEY = "survivor-sim-season-previous";
const LEGACY_BACKUP_KEY = "survivor-sim-backup";

export type SavedSeason = { game: GameState; savedAt: number };

export function isSeason(v: unknown): v is GameState {
  return (
    typeof v === "object" &&
    v !== null &&
    Array.isArray((v as GameState).castaways) &&
    Array.isArray((v as GameState).episodes) &&
    typeof (v as GameState).phase === "string"
  );
}

function seasonProgress(g: GameState): number {
  if (g.phase === "done") return 999999;
  return (g.episodes?.length ?? 0) * 1000 + (g.day ?? 0);
}

/** Pick the most recently saved copy; ties keep the browser copy. Never rewinds an earlier episode over a later one. */
export function pickNewest(local: SavedSeason | null, remote: SavedSeason | null): SavedSeason | null {
  if (!local) return remote;
  if (!remote) return local;

  const sameSeason =
    local.game.config?.seasonTitle &&
    remote.game.config?.seasonTitle &&
    local.game.config.seasonTitle === remote.game.config.seasonTitle;

  if (sameSeason) {
    const localProg = seasonProgress(local.game);
    const remoteProg = seasonProgress(remote.game);
    if (localProg > remoteProg) return local;
    if (remoteProg > localProg) return remote;
  }

  return remote.savedAt > local.savedAt ? remote : local;
}

function parse(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    return isSeason(v) ? v : null;
  } catch {
    return null;
  }
}

export function readLocalSeason(): SavedSeason | null {
  try {
    const game = parse(localStorage.getItem(SAVE_KEY)) ?? parse(localStorage.getItem(LEGACY_BACKUP_KEY));
    if (!game) return null;
    const savedAt = Number(localStorage.getItem(SAVED_AT_KEY)) || 0;
    return { game, savedAt };
  } catch {
    return null;
  }
}

/** Returns false when the browser refused the write (storage full or blocked). */
export function writeLocalSeason(saved: SavedSeason): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved.game));
    localStorage.setItem(SAVED_AT_KEY, String(saved.savedAt));
    localStorage.removeItem(LEGACY_BACKUP_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Keep one copy of an unfinished season that is about to be replaced, as a safety net. */
export function stashPreviousSeason(game: GameState) {
  if (game.phase === "done") return;
  try {
    localStorage.setItem(PREVIOUS_KEY, JSON.stringify(game));
  } catch {
    /* best effort */
  }
}

export function clearLocalSeason() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SAVED_AT_KEY);
    localStorage.removeItem(LEGACY_BACKUP_KEY);
  } catch {
    /* storage blocked */
  }
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function readRemoteSeason(): Promise<SavedSeason | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const { data, error } = await supabase
    .from("active_seasons")
    .select("data,saved_at")
    .eq("user_id", uid)
    .maybeSingle();
  if (error || !data || !isSeason(data.data)) return null;
  return { game: data.data as unknown as GameState, savedAt: Number(data.saved_at) || 0 };
}

export async function writeRemoteSeason(saved: SavedSeason): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid) return false;
  const { error } = await supabase.from("active_seasons").upsert({
    user_id: uid,
    data: saved.game as never,
    saved_at: saved.savedAt,
    updated_at: new Date().toISOString(),
  });
  return !error;
}

export async function clearRemoteSeason() {
  const uid = await currentUserId();
  if (!uid) return;
  await supabase.from("active_seasons").delete().eq("user_id", uid);
}
