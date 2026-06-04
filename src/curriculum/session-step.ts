import type { CurriculumStep } from "./steps.ts";
import { stepsForExercise } from "./steps.ts";
import {
  getHighestUnlockedStepForExercise,
  isStepUnlocked,
  meetsStepThreshold,
} from "./unlock.ts";
import type { AttemptRecord, ExerciseId } from "../history/types.ts";

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

function assertSessionExercise(exerciseId: ExerciseId): void {
  if (
    !isIntervalExercise(exerciseId) &&
    exerciseId !== "scale-degree-sing" &&
    exerciseId !== "chord-middle"
  ) {
    throw new Error(`No session step for exercise: ${exerciseId}`);
  }
}

/**
 * Guided-path default for an exercise: first unlocked step on that exercise that
 * still needs practice, or the highest unlocked tier when every step is complete.
 */
export function getGuidedStepForExercise(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
): CurriculumStep {
  assertSessionExercise(exerciseId);

  for (const step of stepsForExercise(exerciseId)) {
    if (isStepUnlocked(step, records) && !meetsStepThreshold(step, records)) {
      return step;
    }
  }

  const highest = getHighestUnlockedStepForExercise(exerciseId, records);
  if (!highest) {
    throw new Error(`No unlocked step for ${exerciseId}`);
  }
  return highest;
}

export interface ResolveSessionStepOptions {
  /** Step from the URL; when set and valid for the route, used for the session. */
  urlStep?: CurriculumStep | null;
}

/**
 * Resolves the curriculum step for the current session. URL step wins for guided
 * replay; otherwise uses the guided-path default for that exercise.
 */
export function resolveSessionStep(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
  options: ResolveSessionStepOptions = {},
): CurriculumStep {
  assertSessionExercise(exerciseId);

  const { urlStep } = options;
  if (urlStep && urlStep.exerciseId === exerciseId) {
    return urlStep;
  }

  return getGuidedStepForExercise(exerciseId, records);
}

/**
 * @deprecated Prefer {@link resolveSessionStep} with explicit `urlStep`.
 * Resolves using guided-path default only (highest-tier behavior superseded).
 */
export function getSessionStepForExercise(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
  options: ResolveSessionStepOptions = {},
): CurriculumStep {
  return resolveSessionStep(exerciseId, records, options);
}
