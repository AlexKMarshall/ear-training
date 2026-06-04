import type { CurriculumStep } from "./steps.ts";
import { getHighestUnlockedStepForExercise } from "./unlock.ts";
import type { AttemptRecord, ExerciseId } from "../history/types.ts";

/** Free-practice chord exercise uses the chord-1a tier preset (not on CURRICULUM_STEPS). */
export const CHORD_MIDDLE_STEP: CurriculumStep = {
  exerciseId: "chord-middle",
  contentTierId: "chord-1a",
};

const INTERVAL_EXERCISE_IDS = [
  "interval-melodic-sing",
  "interval-harmonic-sing",
  "interval-melodic-id",
  "interval-harmonic-id",
] as const satisfies readonly ExerciseId[];

function isIntervalExercise(
  exerciseId: ExerciseId,
): exerciseId is (typeof INTERVAL_EXERCISE_IDS)[number] {
  return (INTERVAL_EXERCISE_IDS as readonly ExerciseId[]).includes(exerciseId);
}

/**
 * Resolves the curriculum step for the current session: highest unlocked tier
 * for that exercise on the guided path (or chord-1a for free practice).
 */
export function getSessionStepForExercise(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
): CurriculumStep {
  if (exerciseId === "chord-middle") {
    return CHORD_MIDDLE_STEP;
  }

  if (!isIntervalExercise(exerciseId) && exerciseId !== "scale-degree-sing") {
    throw new Error(`No session step for exercise: ${exerciseId}`);
  }

  const step = getHighestUnlockedStepForExercise(exerciseId, records);
  if (!step) {
    throw new Error(`No unlocked step for ${exerciseId}`);
  }
  return step;
}
