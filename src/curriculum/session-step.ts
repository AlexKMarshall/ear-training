import type { CurriculumStep } from "./steps.ts";
import { stepsForExercise } from "./steps.ts";
import { getHighestUnlockedStepForExercise } from "./unlock.ts";
import type { AttemptRecord, ExerciseId } from "../history/types.ts";

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
 * for melodic exercises; harmonic exercises stay on interval-2a.
 */
export function getSessionStepForExercise(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
): CurriculumStep {
  if (!isIntervalExercise(exerciseId)) {
    throw new Error(`No session step for exercise: ${exerciseId}`);
  }

  const isMelodic =
    exerciseId === "interval-melodic-sing" ||
    exerciseId === "interval-melodic-id";

  if (isMelodic) {
    const step = getHighestUnlockedStepForExercise(exerciseId, records);
    if (!step) {
      throw new Error(`No unlocked step for ${exerciseId}`);
    }
    return step;
  }

  const harmonic2a = stepsForExercise(exerciseId).find(
    (s) => s.contentTierId === "interval-2a",
  );
  if (!harmonic2a) {
    throw new Error(`Missing interval-2a step for ${exerciseId}`);
  }
  return harmonic2a;
}
