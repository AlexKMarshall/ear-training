import { computeExerciseProgress } from "../history/stats.ts";
import type { AttemptRecord, ExerciseId } from "../history/types.ts";
import { EXERCISE_LABELS } from "../history/types.ts";
import { isUnlockAllEnabled } from "./dev-unlock.ts";
import {
  CURRICULUM_LEVELS,
  CURRICULUM_PATH,
  FREE_PRACTICE_IDS,
} from "./levels.ts";

export const MIN_QUESTIONS = 10;
export const MIN_QUESTION_PASS_RATE = 70;

export interface UnlockRequirement {
  predecessorId: ExerciseId;
  predecessorLabel: string;
  minQuestions: number;
  minPassRatePercent: number;
}

function meetsProgressThreshold(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
): boolean {
  const { questionCount, questionPassRatePercent } = computeExerciseProgress(
    exerciseId,
    records,
  );
  return (
    questionCount >= MIN_QUESTIONS &&
    questionPassRatePercent >= MIN_QUESTION_PASS_RATE
  );
}

function pathIndex(exerciseId: ExerciseId): number {
  return CURRICULUM_PATH.indexOf(exerciseId);
}

export function isExerciseUnlocked(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
): boolean {
  if (isUnlockAllEnabled()) {
    return true;
  }
  if ((FREE_PRACTICE_IDS as readonly ExerciseId[]).includes(exerciseId)) {
    return true;
  }
  const index = pathIndex(exerciseId);
  if (index < 0) {
    return false;
  }
  if (index === 0) {
    return true;
  }
  const predecessor = CURRICULUM_PATH[index - 1]!;
  return meetsProgressThreshold(predecessor, records);
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

/** First guided exercise to work on, or null when the path is complete. */
export function getContinueExercise(
  records: readonly AttemptRecord[],
): ExerciseId | null {
  for (const id of CURRICULUM_PATH) {
    if (!isExerciseUnlocked(id, records)) {
      break;
    }
    if (!meetsProgressThreshold(id, records)) {
      return id;
    }
  }
  return null;
}

/** Static unlock copy for a path exercise (null if always available). */
export function getUnlockRequirement(
  exerciseId: ExerciseId,
): UnlockRequirement | null {
  if ((FREE_PRACTICE_IDS as readonly ExerciseId[]).includes(exerciseId)) {
    return null;
  }
  const index = pathIndex(exerciseId);
  if (index <= 0) {
    return null;
  }
  const predecessorId = CURRICULUM_PATH[index - 1]!;
  return {
    predecessorId,
    predecessorLabel: EXERCISE_LABELS[predecessorId],
    minQuestions: MIN_QUESTIONS,
    minPassRatePercent: MIN_QUESTION_PASS_RATE,
  };
}
