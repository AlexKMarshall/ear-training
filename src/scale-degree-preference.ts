import { SCALE_DEGREES, type ScaleDegreeEntry } from "./scale-degree-config.ts";

const STORAGE_KEY = "ear-training-scale-degrees";

let memorySelectedIds: string[] | null = null;

function selectableIds(): string[] {
  return SCALE_DEGREES.filter((entry) => entry.enabled).map((entry) => entry.id);
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

export function getSelectableScaleDegrees(): readonly ScaleDegreeEntry[] {
  return SCALE_DEGREES.filter((entry) => entry.enabled);
}

export function getSelectedScaleDegreeIds(): string[] {
  const allowed = selectableIds();
  const stored = readStoredIds();
  if (stored === null) return allowed;
  return stored.filter((id) => allowed.includes(id));
}

export function isScaleDegreeSelected(id: string): boolean {
  return getSelectedScaleDegreeIds().includes(id);
}

export function setScaleDegreeSelected(id: string, selected: boolean): void {
  if (!selectableIds().includes(id)) return;

  const current = getSelectedScaleDegreeIds();
  if (selected) {
    if (current.includes(id)) return;
    writeStoredIds([...current, id]);
    return;
  }

  writeStoredIds(current.filter((entryId) => entryId !== id));
}

export function resetScaleDegreePreference(): void {
  memorySelectedIds = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getActiveScaleDegrees(): ScaleDegreeEntry[] {
  const selected = new Set(getSelectedScaleDegreeIds());
  return SCALE_DEGREES.filter((entry) => entry.enabled && selected.has(entry.id));
}

export function pickRandomScaleDegree(): ScaleDegreeEntry {
  const active = getActiveScaleDegrees();
  if (active.length === 0) {
    throw new Error("No scale degrees are selected");
  }
  return active[Math.floor(Math.random() * active.length)]!;
}
