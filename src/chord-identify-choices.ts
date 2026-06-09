import { getChordTypeById } from "./chord-config.ts"

export interface ExerciseChoice {
  id: string
  label: string
}

const TRIAD_QUALITY_CHOICE_LABEL: Record<string, string> = {
  "major-triad": "Major",
  "minor-triad": "Minor",
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
