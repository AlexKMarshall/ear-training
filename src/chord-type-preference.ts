import { CHORD_TYPES, type ChordTypeEntry } from "./chord-config.ts";
import { pickRandomInversion } from "./chord-inversion-preference.ts";
import { randomChordExercise } from "./chord-types.ts";
import type { ChordType } from "./chord-types.ts";
import type { ChordExercise } from "./chords.ts";
import type { NoteRange } from "./notes.ts";

const STORAGE_KEY = "ear-training-chord-types";

/** Used when localStorage is unavailable (e.g. unit tests). */
let memorySelectedIds: string[] | null = null;

function selectableIds(): string[] {
  return CHORD_TYPES.filter((t) => t.enabled).map((t) => t.id);
}

function readStoredIds(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return memorySelectedIds;
  }
}

function writeStoredIds(ids: string[]): void {
  memorySelectedIds = ids;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/** Chord types the user can toggle in settings (registry-enabled only). */
export function getSelectableChordTypes(): readonly ChordTypeEntry[] {
  return CHORD_TYPES.filter((t) => t.enabled);
}

/** Selected chord type ids; defaults to all selectable types when unset. */
export function getSelectedChordTypeIds(): string[] {
  const allowed = selectableIds();
  const stored = readStoredIds();
  if (stored === null) return allowed;

  return stored.filter((id) => allowed.includes(id));
}

export function isChordTypeSelected(id: string): boolean {
  return getSelectedChordTypeIds().includes(id);
}

/** Toggle a chord type on/off. */
export function setChordTypeSelected(id: string, selected: boolean): void {
  if (!selectableIds().includes(id)) return;

  const current = getSelectedChordTypeIds();
  if (selected) {
    if (current.includes(id)) return;
    writeStoredIds([...current, id]);
    return;
  }

  writeStoredIds(current.filter((entryId) => entryId !== id));
}

/** Clears persisted and in-memory preference (for tests). */
export function resetChordTypePreference(): void {
  memorySelectedIds = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Registry-enabled types that the user has selected for random questions. */
export function getActiveChordTypes(): ChordType[] {
  const selected = new Set(getSelectedChordTypeIds());
  return CHORD_TYPES.filter((t) => t.enabled && selected.has(t.id));
}

export function pickRandomChordType(): ChordType {
  const active = getActiveChordTypes();
  if (active.length === 0) {
    throw new Error("No chord types are selected");
  }
  return active[Math.floor(Math.random() * active.length)]!;
}

/** Random chord question using user-selected chord types and inversions. */
export function randomEnabledChordExercise(range: NoteRange): ChordExercise {
  return randomChordExercise(
    pickRandomChordType(),
    pickRandomInversion(),
    range,
  );
}
