import type { ExerciseId } from "../history/types.ts";

export interface CurriculumLevel {
  level: number;
  label: string;
  exerciseIds: readonly ExerciseId[];
}

export const CURRICULUM_LEVELS: readonly CurriculumLevel[] = [
  {
    level: 1,
    label: "Single note",
    exerciseIds: ["single-note"],
  },
  {
    level: 2,
    label: "Intervals",
    exerciseIds: [
      "interval-melodic-sing",
      "interval-harmonic-sing",
      "interval-melodic-id",
      "interval-harmonic-id",
    ],
  },
  {
    level: 3,
    label: "Scale degrees",
    exerciseIds: ["scale-degree-sing"],
  },
  {
    level: 4,
    label: "Chord middle",
    exerciseIds: ["chord-middle"],
  },
] as const;

/** Ordered guided path (Level 1 → Level 4 exercises). */
export const CURRICULUM_PATH: readonly ExerciseId[] =
  CURRICULUM_LEVELS.flatMap((level) => level.exerciseIds);
