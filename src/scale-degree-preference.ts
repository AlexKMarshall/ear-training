import { SCALE_DEGREES } from "./scale-degree-config.ts";

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

export function getSelectedScaleDegreeIds(): string[] {
  const allowed = selectableIds();
  const stored = readStoredIds();
  if (stored === null) return allowed;
  return stored.filter((id) => allowed.includes(id));
}

export function resetScaleDegreePreference(): void {
  memorySelectedIds = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
