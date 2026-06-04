import { resolveSessionCurriculumLesson } from "../curriculum/session-step.ts";
import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts";
import { getEligibleTagIds } from "../curriculum/curriculum-lessons.ts";
import {
  createDefaultHistoryPort,
  type HistoryPort,
} from "../history/port.ts";
import type { AttemptInput, AttemptRecord, PracticeModeId } from "../history/types.ts";
import {
  intervalToLessonExercise,
  randomIntervalExerciseForTag,
  type IntervalPresentation,
} from "../interval-exercises.ts";
import {
  createDefaultSessionPlanner,
  type SessionPlanner,
} from "../session/planner.ts";
import type { LessonExercise } from "../lesson-exercise.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";

export interface IntervalSessionDeps {
  history?: HistoryPort;
  sessionPlanner?: SessionPlanner;
  sessionCurriculumLesson?: CurriculumLesson;
}

export interface IntervalHistoryCache {
  getRecords(): readonly AttemptRecord[];
  historyPort: HistoryPort;
}

export function createIntervalHistoryCache(
  port: HistoryPort = createDefaultHistoryPort(),
): IntervalHistoryCache {
  let records: AttemptRecord[] = [];
  void port.getAllAttempts().then((loaded) => {
    records = [...loaded];
  });

  return {
    getRecords: () => records,
    historyPort: {
      getAllAttempts: async () => [...records],
      saveAttempt: async (input: AttemptInput) => {
        await port.saveAttempt(input);
        records.push({ ...input });
      },
    },
  };
}

export function prepareIntervalExercise(
  practiceModeId: PracticeModeId,
  presentation: IntervalPresentation,
  records: readonly AttemptRecord[],
  planner: SessionPlanner = createDefaultSessionPlanner(),
  range = getActiveNoteRange(),
  sessionCurriculumLesson?: CurriculumLesson,
): LessonExercise {
  const step = resolveSessionCurriculumLesson(practiceModeId, records, {
    urlCurriculumLesson: sessionCurriculumLesson,
  });
  const eligibleTagIds = getEligibleTagIds(step);
  const tagId = planner.planNextExerciseTag(step, records);
  const intervalExercise = randomIntervalExerciseForTag(
    tagId,
    presentation,
    range,
  );
  return {
    ...intervalToLessonExercise(intervalExercise),
    contentTierId: step.contentTierId,
    eligibleTagIds,
  };
}

export function resolveIntervalSession(
  deps?: IntervalSessionDeps,
): {
  cache: IntervalHistoryCache;
  planner: SessionPlanner;
} {
  const cache = createIntervalHistoryCache(deps?.history);
  return {
    cache,
    planner: deps?.sessionPlanner ?? createDefaultSessionPlanner(),
  };
}
