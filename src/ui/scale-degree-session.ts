import { getSessionStepForExercise } from "../curriculum/session-step.ts";
import { getEligibleTagIds } from "../curriculum/steps.ts";
import {
  createDefaultHistoryPort,
  type HistoryPort,
} from "../history/port.ts";
import type { AttemptInput, AttemptRecord } from "../history/types.ts";
import { getScaleDegreeById } from "../scale-degree-config.ts";
import {
  buildScaleDegreeQuestion,
  pickRandomRoundTonic,
  scaleDegreeToSingTestQuestion,
} from "../scale-degree-questions.ts";
import {
  createDefaultSessionPlanner,
  type SessionPlanner,
} from "../session/planner.ts";
import type { SingTestQuestion } from "../sing-test-question.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";

export interface ScaleDegreeSessionDeps {
  history?: HistoryPort;
  sessionPlanner?: SessionPlanner;
}

export interface ScaleDegreeHistoryCache {
  getRecords(): readonly AttemptRecord[];
  historyPort: HistoryPort;
}

export interface ScaleDegreeQuestionResult {
  question: SingTestQuestion;
  roundTonicMidi: number;
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

export function prepareScaleDegreeQuestion(
  records: readonly AttemptRecord[],
  roundTonicMidi: number | null,
  planner: SessionPlanner = createDefaultSessionPlanner(),
  range = getActiveNoteRange(),
): ScaleDegreeQuestionResult {
  const step = getSessionStepForExercise("scale-degree-sing", records);
  const eligibleTagIds = getEligibleTagIds(step);
  const degrees = eligibleTagIds
    .map((id) => getScaleDegreeById(id))
    .filter((entry) => entry !== undefined);

  let tonic = roundTonicMidi;
  if (tonic === null) {
    tonic = pickRandomRoundTonic(range, degrees);
  }

  const tagId = planner.planNextQuestionTag(step, records);
  const degree = getScaleDegreeById(tagId);
  if (!degree) {
    throw new Error(`Unknown scale degree id: ${tagId}`);
  }

  return {
    question: {
      ...scaleDegreeToSingTestQuestion(
        buildScaleDegreeQuestion(degree, tonic),
      ),
      contentTierId: step.contentTierId,
      eligibleTagIds,
    },
    roundTonicMidi: tonic,
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
