import { CHORD_INVERSIONS, type ChordInversion, type InversionId } from "./chord-inversions.ts"

const STORAGE_KEY = "ear-training-chord-inversions"

let memorySelectedIds: InversionId[] | null = null

function selectableIds(): InversionId[] {
  return CHORD_INVERSIONS.map((inv) => inv.id)
}

function readStoredIds(): InversionId[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const allowed = new Set(selectableIds())
    return parsed.filter(
      (id): id is InversionId => typeof id === "string" && allowed.has(id as InversionId),
    )
  } catch {
    return memorySelectedIds
  }
}

function writeStoredIds(ids: InversionId[]): void {
  memorySelectedIds = ids
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    /* ignore */
  }
}

export function getSelectableInversions(): readonly ChordInversion[] {
  return CHORD_INVERSIONS
}

export function getSelectedInversionIds(): InversionId[] {
  const allowed = selectableIds()
  const stored = readStoredIds()
  if (stored === null) return allowed

  return stored.filter((id) => allowed.includes(id))
}

export function isInversionSelected(id: InversionId): boolean {
  return getSelectedInversionIds().includes(id)
}

export function setInversionSelected(id: InversionId, selected: boolean): void {
  if (!selectableIds().includes(id)) return

  const current = getSelectedInversionIds()
  if (selected) {
    if (current.includes(id)) return
    writeStoredIds([...current, id])
    return
  }

  writeStoredIds(current.filter((entryId) => entryId !== id))
}

export function resetInversionPreference(): void {
  memorySelectedIds = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function getActiveInversions(): ChordInversion[] {
  const selected = new Set(getSelectedInversionIds())
  return CHORD_INVERSIONS.filter((inv) => selected.has(inv.id))
}

export function pickRandomInversion(): InversionId {
  const active = getActiveInversions()
  if (active.length === 0) {
    throw new Error("No inversions are selected")
  }
  return active[Math.floor(Math.random() * active.length)]!.id
}
