import { resolveSessionStep } from "../curriculum/session-step.ts";
import type { CurriculumStep } from "../curriculum/steps.ts";
import { getEligibleTagIds } from "../curriculum/steps.ts";
import {
  createDefaultHistoryPort,
  type HistoryPort,
} from "../history/port.ts";
import type { AttemptInput, AttemptRecord, ExerciseId } from "../history/types.ts";
import {
  intervalToSingTestQuestion,
  randomIntervalQuestionForTag,
  type IntervalPresentation,
} from "../interval-questions.ts";
import {
  createDefaultSessionPlanner,
  type SessionPlanner,
} from "../session/planner.ts";
import type { SingTestQuestion } from "../sing-test-question.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";

export interface IntervalSessionDeps {
  history?: HistoryPort;
  sessionPlanner?: SessionPlanner;
  sessionStep?: CurriculumStep;
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

export function prepareIntervalQuestion(
  exerciseId: ExerciseId,
  presentation: IntervalPresentation,
  records: readonly AttemptRecord[],
  planner: SessionPlanner = createDefaultSessionPlanner(),
  range = getActiveNoteRange(),
  sessionStep?: CurriculumStep,
): SingTestQuestion {
  const step = resolveSessionStep(exerciseId, records, {
    urlStep: sessionStep,
  });
  const eligibleTagIds = getEligibleTagIds(step);
  const tagId = planner.planNextQuestionTag(step, records);
  const intervalQuestion = randomIntervalQuestionForTag(
    tagId,
    presentation,
    range,
  );
  return {
    ...intervalToSingTestQuestion(intervalQuestion),
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
