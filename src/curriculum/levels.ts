import type { PracticeModeId } from "../history/types.ts"

export interface CurriculumLevel {
  level: number
  label: string
  practiceModeIds: readonly PracticeModeId[]
}

export const CURRICULUM_LEVELS: readonly CurriculumLevel[] = [
  {
    level: 1,
    label: "Single note",
    practiceModeIds: ["single-note"],
  },
  {
    level: 2,
    label: "Intervals",
    practiceModeIds: [
      "interval-melodic-sing",
      "interval-named-sing",
      "interval-harmonic-sing",
      "interval-melodic-id",
      "interval-harmonic-id",
    ],
  },
  {
    level: 3,
    label: "Scale degrees",
    practiceModeIds: ["scale-degree-sing"],
  },
  {
    level: 4,
    label: "Chords",
    practiceModeIds: ["chord-sing"],
  },
] as const

/** Ordered guided path (Level 1 → Level 4 exercises). */
export const CURRICULUM_PATH: readonly PracticeModeId[] = CURRICULUM_LEVELS.flatMap(
  (level) => level.practiceModeIds,
)
