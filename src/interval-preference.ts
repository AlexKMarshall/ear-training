import { INTERVALS, type IntervalEntry } from "./interval-config.ts";

const STORAGE_KEY = "ear-training-intervals";

let memorySelectedIds: string[] | null = null;

function selectableIds(): string[] {
  return INTERVALS.filter((entry) => entry.enabled).map((entry) => entry.id);
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

export function getSelectableIntervals(): readonly IntervalEntry[] {
  return INTERVALS.filter((entry) => entry.enabled);
}

export function getSelectedIntervalIds(): string[] {
  const allowed = selectableIds();
  const stored = readStoredIds();
  if (stored === null) return allowed;
  return stored.filter((id) => allowed.includes(id));
}

export function isIntervalSelected(id: string): boolean {
  return getSelectedIntervalIds().includes(id);
}

export function setIntervalSelected(id: string, selected: boolean): void {
  if (!selectableIds().includes(id)) return;

  const current = getSelectedIntervalIds();
  if (selected) {
    if (current.includes(id)) return;
    writeStoredIds([...current, id]);
    return;
  }

  writeStoredIds(current.filter((entryId) => entryId !== id));
}

export function resetIntervalPreference(): void {
  memorySelectedIds = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getActiveIntervals(): IntervalEntry[] {
  const selected = new Set(getSelectedIntervalIds());
  return INTERVALS.filter((entry) => entry.enabled && selected.has(entry.id));
}

export function pickRandomInterval(): IntervalEntry {
  const active = getActiveIntervals();
  if (active.length === 0) {
    throw new Error("No intervals are selected");
  }
  return active[Math.floor(Math.random() * active.length)]!;
}
