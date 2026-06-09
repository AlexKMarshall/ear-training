import { getChordTypeById } from "./chord-config.ts"
import type { InversionId } from "./chord-inversions.ts"

export interface ExerciseChoice {
  id: string
  label: string
}

const TRIAD_QUALITY_CHOICE_LABEL: Record<string, string> = {
  "major-triad": "Major",
  "minor-triad": "Minor",
}

const INVERSION_CHOICE_LABEL: Record<InversionId, string> = {
  root: "Root position",
  first: "1st inversion",
  second: "2nd inversion",
}

/** Multiple-choice options for inversion identification (exact eligible pool). */
export function buildInversionChoices(eligibleIds: readonly InversionId[]): ExerciseChoice[] {
  return eligibleIds.map((id) => ({
    id,
    label: INVERSION_CHOICE_LABEL[id],
  }))
}

/** Multiple-choice options for triad quality identification (exact eligible pool). */
export function buildTriadQualityChoices(eligibleIds: readonly string[]): ExerciseChoice[] {
  return eligibleIds.map((id) => {
    const type = getChordTypeById(id)
    if (!type) {
      throw new Error(`Unknown triad quality id: ${id}`)
    }
    const label = TRIAD_QUALITY_CHOICE_LABEL[id] ?? type.label
    return { id, label }
  })
}
