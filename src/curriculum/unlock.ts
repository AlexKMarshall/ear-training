import { computeLessonExerciseStats } from "../history/stats.ts";
import type { AttemptRecord, PracticeModeId } from "../history/types.ts";
import { isUnlockAllEnabled } from "./dev-unlock.ts";
import { CURRICULUM_LEVELS } from "./levels.ts";
import type { CurriculumLesson } from "./curriculum-lessons.ts";
import {
  CURRICULUM_LESSONS,
  filterRecordsForCurriculumLesson,
  getCurriculumLessonIndex,
  getCurriculumLessonLabel,
  curriculumLessonsForPracticeMode,
} from "./curriculum-lessons.ts";

export const MIN_EXERCISES_FOR_UNLOCK = 10;
export const MIN_EXERCISE_PASS_RATE = 70;

export interface UnlockRequirement {
  predecessorPracticeModeId: PracticeModeId;
  predecessorLabel: string;
  minExercisesForUnlock: number;
  minPassRatePercent: number;
}

export function computeCurriculumLessonProgress(
  step: CurriculumLesson,
  records: readonly AttemptRecord[],
): { lessonExerciseCount: number; lessonExercisePassRatePercent: number } {
  const filtered = filterRecordsForCurriculumLesson(records, step);
  const { lessonExerciseCount, lessonExercisePassRatePercent } =
    computeLessonExerciseStats(filtered);
  return { lessonExerciseCount, lessonExercisePassRatePercent };
}

export function meetsCurriculumLessonThreshold(
  step: CurriculumLesson,
  records: readonly AttemptRecord[],
): boolean {
  const { lessonExerciseCount, lessonExercisePassRatePercent } = computeCurriculumLessonProgress(
    step,
    records,
  );
  return (
    lessonExerciseCount >= MIN_EXERCISES_FOR_UNLOCK &&
    lessonExercisePassRatePercent >= MIN_EXERCISE_PASS_RATE
  );
}

export function isCurriculumLessonUnlocked(
  step: CurriculumLesson,
  records: readonly AttemptRecord[],
): boolean {
  if (isUnlockAllEnabled()) {
    return true;
  }
  const index = getCurriculumLessonIndex(step);
  if (index < 0) {
    return false;
  }
  if (index === 0) {
    return true;
  }
  const predecessor = CURRICULUM_LESSONS[index - 1]!;
  return meetsCurriculumLessonThreshold(predecessor, records);
}

/** Highest unlocked step for an exercise (last tier in path order), or null. */
export function getHighestUnlockedCurriculumLessonForPracticeMode(
  practiceModeId: PracticeModeId,
  records: readonly AttemptRecord[],
): CurriculumLesson | null {
  let highest: CurriculumLesson | null = null;
  for (const step of curriculumLessonsForPracticeMode(practiceModeId)) {
    if (isCurriculumLessonUnlocked(step, records)) {
      highest = step;
    }
  }
  return highest;
}

export function isPracticeModeUnlocked(
  practiceModeId: PracticeModeId,
  records: readonly AttemptRecord[],
): boolean {
  if (isUnlockAllEnabled()) {
    return true;
  }
  const firstStep = curriculumLessonsForPracticeMode(practiceModeId)[0];
  if (!firstStep) {
    return false;
  }
  return isCurriculumLessonUnlocked(firstStep, records);
}

export function isLevelUnlocked(
  level: number,
  records: readonly AttemptRecord[],
): boolean {
  const def = CURRICULUM_LEVELS.find((l) => l.level === level);
  if (!def || def.practiceModeIds.length === 0) {
    return false;
  }
  return isPracticeModeUnlocked(def.practiceModeIds[0]!, records);
}

/** First unlocked curriculum step that still needs practice, or null when complete. */
export function getContinueCurriculumLesson(
  records: readonly AttemptRecord[],
): CurriculumLesson | null {
  for (const step of CURRICULUM_LESSONS) {
    if (!isCurriculumLessonUnlocked(step, records)) {
      break;
    }
    if (!meetsCurriculumLessonThreshold(step, records)) {
      return step;
    }
  }
  return null;
}

/** First guided exercise to work on, or null when the path is complete. */
export function getContinuePracticeMode(
  records: readonly AttemptRecord[],
): PracticeModeId | null {
  return getContinueCurriculumLesson(records)?.practiceModeId ?? null;
}

/** Curriculum step immediately before this one on the guided path, if any. */
export function getPredecessorCurriculumLesson(step: CurriculumLesson): CurriculumLesson | null {
  const index = getCurriculumLessonIndex(step);
  if (index <= 0) {
    return null;
  }
  return CURRICULUM_LESSONS[index - 1]!;
}

/** Static unlock copy for a specific curriculum step (null for the first step). */
export function getUnlockRequirementForCurriculumLesson(
  step: CurriculumLesson,
): UnlockRequirement | null {
  const predecessor = getPredecessorCurriculumLesson(step);
  if (!predecessor) {
    return null;
  }
  return {
    predecessorPracticeModeId: predecessor.practiceModeId,
    predecessorLabel: getCurriculumLessonLabel(predecessor),
    minExercisesForUnlock: MIN_EXERCISES_FOR_UNLOCK,
    minPassRatePercent: MIN_EXERCISE_PASS_RATE,
  };
}

/** Whether the learner may open a session for this step (progress or `?unlock=all`). */
export function isCurriculumLessonAccessible(
  step: CurriculumLesson,
  records: readonly AttemptRecord[],
  search = globalThis.location?.search ?? "",
): boolean {
  if (isUnlockAllEnabled(search)) {
    return true;
  }
  return isCurriculumLessonUnlocked(step, records);
}

/** Static unlock copy for a path exercise (null if always available). */
export function getUnlockRequirement(
  practiceModeId: PracticeModeId,
): UnlockRequirement | null {
  const firstStep = curriculumLessonsForPracticeMode(practiceModeId)[0];
  if (!firstStep) {
    return null;
  }
  const index = getCurriculumLessonIndex(firstStep);
  if (index <= 0) {
    return null;
  }
  const predecessor = CURRICULUM_LESSONS[index - 1]!;
  return {
    predecessorPracticeModeId: predecessor.practiceModeId,
    predecessorLabel: getCurriculumLessonLabel(predecessor),
    minExercisesForUnlock: MIN_EXERCISES_FOR_UNLOCK,
    minPassRatePercent: MIN_EXERCISE_PASS_RATE,
  };
}
