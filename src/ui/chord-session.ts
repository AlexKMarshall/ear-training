import { getChordTypeById } from "../chord-config.ts";
import type { InversionId } from "../chord-inversions.ts";
import { randomChordQuestion } from "../chord-types.ts";
import { chordTarget } from "../chords.ts";
import { getSessionStepForExercise } from "../curriculum/session-step.ts";
import {
  getEligibleInversionIds,
  getEligibleTagIds,
} from "../curriculum/steps.ts";
import {
  createDefaultHistoryPort,
  type HistoryPort,
} from "../history/port.ts";
import type { AttemptInput, AttemptRecord } from "../history/types.ts";
import {
  createDefaultSessionPlanner,
  type SessionPlanner,
} from "../session/planner.ts";
import type { SingTestQuestion } from "../sing-test-question.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";

export interface ChordSessionDeps {
  history?: HistoryPort;
  sessionPlanner?: SessionPlanner;
  rng?: () => number;
}

export interface ChordHistoryCache {
  getRecords(): readonly AttemptRecord[];
  historyPort: HistoryPort;
}

export function createChordHistoryCache(
  port: HistoryPort = createDefaultHistoryPort(),
): ChordHistoryCache {
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

export function pickRandomInversionFromTier(
  rng: () => number = Math.random,
): InversionId {
  const eligible = getEligibleInversionIds("chord-1a");
  return eligible[Math.floor(rng() * eligible.length)]!;
}

export function prepareChordQuestion(
  records: readonly AttemptRecord[],
  planner: SessionPlanner = createDefaultSessionPlanner(),
  range = getActiveNoteRange(),
  rng: () => number = Math.random,
): SingTestQuestion {
  const step = getSessionStepForExercise("chord-middle", records);
  const eligibleTagIds = getEligibleTagIds(step);
  const tagId = planner.planNextQuestionTag(step, records);
  const type = getChordTypeById(tagId);
  if (!type) {
    throw new Error(`Unknown chord type id: ${tagId}`);
  }
  const inversion = pickRandomInversionFromTier(rng);
  const chord = randomChordQuestion(type, inversion, range);
  return {
    target: chordTarget(chord),
    chord,
    chordTypeId: type.id,
    inversionId: inversion,
    contentTierId: step.contentTierId,
    eligibleTagIds,
  };
}

export function resolveChordSession(deps?: ChordSessionDeps): {
  cache: ChordHistoryCache;
  planner: SessionPlanner;
  rng: () => number;
} {
  const cache = createChordHistoryCache(deps?.history);
  return {
    cache,
    planner: deps?.sessionPlanner ?? createDefaultSessionPlanner(),
    rng: deps?.rng ?? Math.random,
  };
}
