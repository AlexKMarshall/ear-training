import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts"
import { getEligibleTagIds } from "../curriculum/curriculum-lessons.ts"
import { resolveSessionCurriculumLesson } from "../curriculum/session-step.ts"
import type { MountDeps } from "../history/port.ts"
import type { SessionHistoryCache } from "../history/session-cache.ts"
import type { AttemptRecord, PracticeModeId } from "../history/types.ts"
import {
  type IntervalPresentation,
  intervalToLessonExercise,
  randomIntervalExerciseForTag,
} from "../interval-exercises.ts"
import type { IntervalLessonExercise } from "../lesson-exercise.ts"
import { createDefaultSessionPlanner, type SessionPlanner } from "../session/planner.ts"
import { getActiveNoteRange } from "../voice-ranges.ts"

export interface IntervalSessionDeps
  extends Pick<MountDeps, "sessionHistory" | "sessionCurriculumLesson"> {
  sessionPlanner?: SessionPlanner
}

export function prepareIntervalExercise(
  practiceModeId: PracticeModeId,
  presentation: IntervalPresentation,
  records: readonly AttemptRecord[],
  planner: SessionPlanner = createDefaultSessionPlanner(),
  range = getActiveNoteRange(),
  sessionCurriculumLesson?: CurriculumLesson,
): IntervalLessonExercise {
  const step = resolveSessionCurriculumLesson(practiceModeId, records, {
    urlCurriculumLesson: sessionCurriculumLesson,
  })
  const eligibleTagIds = getEligibleTagIds(step)
  const tagId = planner.planNextExerciseTag(step, records)
  const intervalExercise = randomIntervalExerciseForTag(tagId, presentation, range)
  return {
    ...intervalToLessonExercise(intervalExercise),
    contentTierId: step.contentTierId,
    eligibleTagIds,
  }
}

export function resolveIntervalSession(deps: IntervalSessionDeps): {
  sessionHistory: SessionHistoryCache
  planner: SessionPlanner
} {
  if (!deps.sessionHistory) {
    throw new Error("sessionHistory is required")
  }

  return {
    sessionHistory: deps.sessionHistory,
    planner: deps.sessionPlanner ?? createDefaultSessionPlanner(),
  }
}
