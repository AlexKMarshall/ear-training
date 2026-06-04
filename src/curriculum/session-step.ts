import type { CurriculumStep } from "./steps.ts";
import { stepsForExercise } from "./steps.ts";
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
 * Resolves the curriculum step for the current session.
 * PR 5 replaces the 2a stub with highest unlocked step per exercise.
 */
export function getSessionStepForExercise(
  exerciseId: ExerciseId,
  _records: readonly AttemptRecord[],
): CurriculumStep {
  if (!isIntervalExercise(exerciseId)) {
    throw new Error(`No session step for exercise: ${exerciseId}`);
  }

  const steps = stepsForExercise(exerciseId);
  const isMelodic =
    exerciseId === "interval-melodic-sing" ||
    exerciseId === "interval-melodic-id";

  if (isMelodic) {
    const twoA = steps.find((s) => s.contentTierId === "interval-2a");
    if (!twoA) {
      throw new Error(`Missing interval-2a step for ${exerciseId}`);
    }
    return twoA;
  }

  const harmonic2a = steps.find((s) => s.contentTierId === "interval-2a");
  if (!harmonic2a) {
    throw new Error(`Missing interval-2a step for ${exerciseId}`);
  }
  return harmonic2a;
}
