import { computeQuestionStats } from "../history/stats.ts";
import type { AttemptRecord, ExerciseId } from "../history/types.ts";
import { isUnlockAllEnabled } from "./dev-unlock.ts";
import { CURRICULUM_LEVELS } from "./levels.ts";
import type { CurriculumStep } from "./steps.ts";
import {
  CURRICULUM_STEPS,
  filterRecordsForStep,
  getStepIndex,
  getStepLabel,
  stepsForExercise,
} from "./steps.ts";

export const MIN_QUESTIONS = 10;
export const MIN_QUESTION_PASS_RATE = 70;

export interface UnlockRequirement {
  predecessorId: ExerciseId;
  predecessorLabel: string;
  minQuestions: number;
  minPassRatePercent: number;
}

export function computeStepProgress(
  step: CurriculumStep,
  records: readonly AttemptRecord[],
): { questionCount: number; questionPassRatePercent: number } {
  const filtered = filterRecordsForStep(records, step);
  const { questionCount, questionPassRatePercent } =
    computeQuestionStats(filtered);
  return { questionCount, questionPassRatePercent };
}

export function meetsStepThreshold(
  step: CurriculumStep,
  records: readonly AttemptRecord[],
): boolean {
  const { questionCount, questionPassRatePercent } = computeStepProgress(
    step,
    records,
  );
  return (
    questionCount >= MIN_QUESTIONS &&
    questionPassRatePercent >= MIN_QUESTION_PASS_RATE
  );
}

export function isStepUnlocked(
  step: CurriculumStep,
  records: readonly AttemptRecord[],
): boolean {
  if (isUnlockAllEnabled()) {
    return true;
  }
  const index = getStepIndex(step);
  if (index < 0) {
    return false;
  }
  if (index === 0) {
    return true;
  }
  const predecessor = CURRICULUM_STEPS[index - 1]!;
  return meetsStepThreshold(predecessor, records);
}

/** Highest unlocked step for an exercise (last tier in path order), or null. */
export function getHighestUnlockedStepForExercise(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
): CurriculumStep | null {
  let highest: CurriculumStep | null = null;
  for (const step of stepsForExercise(exerciseId)) {
    if (isStepUnlocked(step, records)) {
      highest = step;
    }
  }
  return highest;
}

export function isExerciseUnlocked(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
): boolean {
  if (isUnlockAllEnabled()) {
    return true;
  }
  const firstStep = stepsForExercise(exerciseId)[0];
  if (!firstStep) {
    return false;
  }
  return isStepUnlocked(firstStep, records);
}

export function isLevelUnlocked(
  level: number,
  records: readonly AttemptRecord[],
): boolean {
  const def = CURRICULUM_LEVELS.find((l) => l.level === level);
  if (!def || def.exerciseIds.length === 0) {
    return false;
  }
  return isExerciseUnlocked(def.exerciseIds[0]!, records);
}

/** First unlocked curriculum step that still needs practice, or null when complete. */
export function getContinueStep(
  records: readonly AttemptRecord[],
): CurriculumStep | null {
  for (const step of CURRICULUM_STEPS) {
    if (!isStepUnlocked(step, records)) {
      break;
    }
    if (!meetsStepThreshold(step, records)) {
      return step;
    }
  }
  return null;
}

/** First guided exercise to work on, or null when the path is complete. */
export function getContinueExercise(
  records: readonly AttemptRecord[],
): ExerciseId | null {
  return getContinueStep(records)?.exerciseId ?? null;
}

/** Curriculum step immediately before this one on the guided path, if any. */
export function getPredecessorStep(step: CurriculumStep): CurriculumStep | null {
  const index = getStepIndex(step);
  if (index <= 0) {
    return null;
  }
  return CURRICULUM_STEPS[index - 1]!;
}

/** Static unlock copy for a specific curriculum step (null for the first step). */
export function getUnlockRequirementForStep(
  step: CurriculumStep,
): UnlockRequirement | null {
  const predecessor = getPredecessorStep(step);
  if (!predecessor) {
    return null;
  }
  return {
    predecessorId: predecessor.exerciseId,
    predecessorLabel: getStepLabel(predecessor),
    minQuestions: MIN_QUESTIONS,
    minPassRatePercent: MIN_QUESTION_PASS_RATE,
  };
}

/** Whether the learner may open a session for this step (progress or `?unlock=all`). */
export function isStepAccessible(
  step: CurriculumStep,
  records: readonly AttemptRecord[],
  search = globalThis.location?.search ?? "",
): boolean {
  if (isUnlockAllEnabled(search)) {
    return true;
  }
  return isStepUnlocked(step, records);
}

/** Static unlock copy for a path exercise (null if always available). */
export function getUnlockRequirement(
  exerciseId: ExerciseId,
): UnlockRequirement | null {
  const firstStep = stepsForExercise(exerciseId)[0];
  if (!firstStep) {
    return null;
  }
  const index = getStepIndex(firstStep);
  if (index <= 0) {
    return null;
  }
  const predecessor = CURRICULUM_STEPS[index - 1]!;
  return {
    predecessorId: predecessor.exerciseId,
    predecessorLabel: getStepLabel(predecessor),
    minQuestions: MIN_QUESTIONS,
    minPassRatePercent: MIN_QUESTION_PASS_RATE,
  };
}
