import { resolveSessionCurriculumLesson } from "../curriculum/session-step.ts";
import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts";
import { getEligibleTagIds } from "../curriculum/curriculum-lessons.ts";
import {
  createDefaultHistoryPort,
  type HistoryPort,
} from "../history/port.ts";
import type { AttemptInput, AttemptRecord } from "../history/types.ts";
import {
  getNaturalMinorSemitonesFromTonic,
  getScaleDegreeById,
} from "../scale-degree-config.ts";
import {
  buildScaleDegreeExercise,
  pickRandomLessonTonic,
  scaleDegreeToLessonExercise,
} from "../scale-degree-exercises.ts";
import {
  createDefaultSessionPlanner,
  type SessionPlanner,
} from "../session/planner.ts";
import type { LessonExercise } from "../lesson-exercise.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";

export interface ScaleDegreeSessionDeps {
  history?: HistoryPort;
  sessionPlanner?: SessionPlanner;
  sessionCurriculumLesson?: CurriculumLesson;
}

export interface ScaleDegreeHistoryCache {
  getRecords(): readonly AttemptRecord[];
  historyPort: HistoryPort;
}

export interface ScaleDegreeExerciseResult {
  exercise: LessonExercise;
  lessonTonicMidi: number;
}

export function createScaleDegreeHistoryCache(
  port: HistoryPort = createDefaultHistoryPort(),
): ScaleDegreeHistoryCache {
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

export function prepareScaleDegreeExercise(
  records: readonly AttemptRecord[],
  lessonTonicMidi: number | null,
  planner: SessionPlanner = createDefaultSessionPlanner(),
  range = getActiveNoteRange(),
  sessionCurriculumLesson?: CurriculumLesson,
): ScaleDegreeExerciseResult {
  const step = resolveSessionCurriculumLesson("scale-degree-sing", records, {
    urlCurriculumLesson: sessionCurriculumLesson,
  });
  const eligibleTagIds = getEligibleTagIds(step);
  const degrees = eligibleTagIds
    .map((id) => getScaleDegreeById(id))
    .filter((entry) => entry !== undefined);

  let tonic = lessonTonicMidi;
  if (tonic === null) {
    tonic = pickRandomLessonTonic(range, degrees);
  }

  const tagId = planner.planNextExerciseTag(step, records);
  const degree = getScaleDegreeById(tagId);
  if (!degree) {
    throw new Error(`Unknown scale degree id: ${tagId}`);
  }
  const semitonesFromTonic =
    step.contentTierId === "degree-minor-diatonic"
      ? getNaturalMinorSemitonesFromTonic(tagId)
      : degree.semitonesFromTonic;
  if (semitonesFromTonic === undefined) {
    throw new Error(`Unknown natural minor degree id: ${tagId}`);
  }

  return {
    exercise: {
      ...scaleDegreeToLessonExercise(
        buildScaleDegreeExercise(
          {
            ...degree,
            semitonesFromTonic,
          },
          tonic,
        ),
      ),
      contentTierId: step.contentTierId,
      eligibleTagIds,
    },
    lessonTonicMidi: tonic,
  };
}

export function resolveScaleDegreeSession(deps?: ScaleDegreeSessionDeps): {
  cache: ScaleDegreeHistoryCache;
  planner: SessionPlanner;
} {
  const cache = createScaleDegreeHistoryCache(deps?.history);
  return {
    cache,
    planner: deps?.sessionPlanner ?? createDefaultSessionPlanner(),
  };
}
