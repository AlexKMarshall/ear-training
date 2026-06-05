import { getChordTypeById } from "../chord-config.ts";
import type { InversionId } from "../chord-inversions.ts";
import { randomChordExercise } from "../chord-types.ts";
import { chordTarget } from "../chords.ts";
import { resolveSessionCurriculumLesson } from "../curriculum/session-step.ts";
import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts";
import {
  getEligibleInversionIds,
  getEligibleTagIds,
} from "../curriculum/curriculum-lessons.ts";
import type { MountDeps } from "../history/port.ts";
import type { SessionHistoryCache } from "../history/session-cache.ts";
import type { AttemptRecord } from "../history/types.ts";
import {
  createDefaultSessionPlanner,
  type SessionPlanner,
} from "../session/planner.ts";
import type { LessonExercise } from "../lesson-exercise.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";

export interface ChordSessionDeps
  extends Pick<MountDeps, "sessionHistory" | "sessionCurriculumLesson"> {
  sessionPlanner?: SessionPlanner;
  rng?: () => number;
}

export function pickRandomInversionFromTier(
  rng: () => number = Math.random,
): InversionId {
  const eligible = getEligibleInversionIds("chord-1a");
  return eligible[Math.floor(rng() * eligible.length)]!;
}

export function prepareChordExercise(
  records: readonly AttemptRecord[],
  planner: SessionPlanner = createDefaultSessionPlanner(),
  range = getActiveNoteRange(),
  rng: () => number = Math.random,
  sessionCurriculumLesson?: CurriculumLesson,
): LessonExercise {
  const step = resolveSessionCurriculumLesson("chord-middle", records, {
    urlCurriculumLesson: sessionCurriculumLesson,
  });
  const eligibleTagIds = getEligibleTagIds(step);
  const tagId = planner.planNextExerciseTag(step, records);
  const type = getChordTypeById(tagId);
  if (!type) {
    throw new Error(`Unknown chord type id: ${tagId}`);
  }
  const inversion = pickRandomInversionFromTier(rng);
  const chord = randomChordExercise(type, inversion, range);
  return {
    target: chordTarget(chord),
    chord,
    chordTypeId: type.id,
    inversionId: inversion,
    contentTierId: step.contentTierId,
    eligibleTagIds,
  };
}

export function resolveChordSession(deps: ChordSessionDeps): {
  sessionHistory: SessionHistoryCache;
  planner: SessionPlanner;
  rng: () => number;
} {
  if (!deps.sessionHistory) {
    throw new Error("sessionHistory is required");
  }

  return {
    sessionHistory: deps.sessionHistory,
    planner: deps.sessionPlanner ?? createDefaultSessionPlanner(),
    rng: deps.rng ?? Math.random,
  };
}
