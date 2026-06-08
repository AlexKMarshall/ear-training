import type { AttemptRecord, PracticeModeId } from "../history/types.ts"
import type { CurriculumLesson } from "./curriculum-lessons.ts"
import { curriculumLessonsForPracticeMode } from "./curriculum-lessons.ts"
import {
  getHighestUnlockedCurriculumLessonForPracticeMode,
  isCurriculumLessonUnlocked,
  meetsCurriculumLessonThreshold,
} from "./unlock.ts"

export const CHORD_MIDDLE_CURRICULUM_LESSON: CurriculumLesson = {
  practiceModeId: "chord-middle",
  contentTierId: "chord-1a",
}

const INTERVAL_PRACTICE_MODE_IDS = [
  "interval-melodic-sing",
  "interval-named-sing",
  "interval-harmonic-sing",
  "interval-melodic-id",
  "interval-harmonic-id",
] as const satisfies readonly PracticeModeId[]

function isIntervalPracticeMode(
  practiceModeId: PracticeModeId,
): practiceModeId is (typeof INTERVAL_PRACTICE_MODE_IDS)[number] {
  return (INTERVAL_PRACTICE_MODE_IDS as readonly PracticeModeId[]).includes(practiceModeId)
}

function assertSessionPracticeMode(practiceModeId: PracticeModeId): void {
  if (
    !isIntervalPracticeMode(practiceModeId) &&
    practiceModeId !== "scale-degree-sing" &&
    practiceModeId !== "chord-middle"
  ) {
    throw new Error(`No session curriculum lesson for practice mode: ${practiceModeId}`)
  }
}

/**
 * Guided-path default for an exercise: first unlocked step on that exercise that
 * still needs practice, or the highest unlocked tier when every step is complete.
 */
export function getGuidedCurriculumLessonForPracticeMode(
  practiceModeId: PracticeModeId,
  records: readonly AttemptRecord[],
): CurriculumLesson {
  assertSessionPracticeMode(practiceModeId)

  for (const step of curriculumLessonsForPracticeMode(practiceModeId)) {
    if (
      isCurriculumLessonUnlocked(step, records) &&
      !meetsCurriculumLessonThreshold(step, records)
    ) {
      return step
    }
  }

  const highest = getHighestUnlockedCurriculumLessonForPracticeMode(practiceModeId, records)
  if (!highest) {
    throw new Error(`No unlocked curriculum lesson for ${practiceModeId}`)
  }
  return highest
}

export interface ResolveSessionCurriculumLessonOptions {
  /** Step from the URL; when set and valid for the route, used for the session. */
  urlCurriculumLesson?: CurriculumLesson | null
}

/**
 * Resolves the curriculum step for the current session. URL step wins for guided
 * replay; otherwise uses the guided-path default for that exercise.
 */
export function resolveSessionCurriculumLesson(
  practiceModeId: PracticeModeId,
  records: readonly AttemptRecord[],
  options: ResolveSessionCurriculumLessonOptions = {},
): CurriculumLesson {
  assertSessionPracticeMode(practiceModeId)

  const { urlCurriculumLesson } = options
  if (urlCurriculumLesson && urlCurriculumLesson.practiceModeId === practiceModeId) {
    return urlCurriculumLesson
  }

  return getGuidedCurriculumLessonForPracticeMode(practiceModeId, records)
}

/**
 * Step the learner is trying to open: explicit URL step, or guided default for the
 * practice mode route when the param is omitted.
 */
export function resolveAccessCurriculumLesson(
  practiceModeId: PracticeModeId,
  records: readonly AttemptRecord[],
  urlCurriculumLesson: CurriculumLesson | null,
): CurriculumLesson {
  if (urlCurriculumLesson) {
    return urlCurriculumLesson
  }

  const steps = curriculumLessonsForPracticeMode(practiceModeId)
  if (steps.length === 0) {
    throw new Error(`No curriculum lessons for practice mode: ${practiceModeId}`)
  }

  if (practiceModeId === "single-note") {
    const first = steps[0]
    if (!first) {
      throw new Error(`No curriculum lessons for practice mode: ${practiceModeId}`)
    }
    return first
  }

  try {
    return getGuidedCurriculumLessonForPracticeMode(practiceModeId, records)
  } catch {
    const first = steps[0]
    if (!first) {
      throw new Error(`No curriculum lessons for practice mode: ${practiceModeId}`)
    }
    return first
  }
}

/**
 * @deprecated Prefer {@link resolveSessionCurriculumLesson} with explicit `urlCurriculumLesson`.
 * Resolves using guided-path default only (highest-tier behavior superseded).
 */
export function getSessionCurriculumLessonForPracticeMode(
  practiceModeId: PracticeModeId,
  records: readonly AttemptRecord[],
  options: ResolveSessionCurriculumLessonOptions = {},
): CurriculumLesson {
  return resolveSessionCurriculumLesson(practiceModeId, records, options)
}
