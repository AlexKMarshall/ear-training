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
] as const;

/** Ordered guided path (Level 1 → Level 2 exercises). */
export const CURRICULUM_PATH: readonly ExerciseId[] =
  CURRICULUM_LEVELS.flatMap((level) => level.exerciseIds);

/** Exercises outside the guided path; always available for free practice. */
export const FREE_PRACTICE_IDS: readonly ExerciseId[] = ["chord-middle"];
