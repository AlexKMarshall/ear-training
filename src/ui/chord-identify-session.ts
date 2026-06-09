import { getChordTypeById } from "../chord-config.ts"
import { randomChordExercise } from "../chord-types.ts"
import { chordTarget } from "../chords.ts"
import {
  getChordInversionIdTierConfig,
  getChordQualityIdTierConfig,
  isChordInversionIdContentTierId,
  isChordQualityIdContentTierId,
} from "../curriculum/chord-tiers.ts"
import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts"
import { getEligibleTagIds } from "../curriculum/curriculum-lessons.ts"
import { resolveSessionCurriculumLesson } from "../curriculum/session-step.ts"
import type { MountDeps } from "../history/port.ts"
import type { SessionHistoryCache } from "../history/session-cache.ts"
import type { AttemptRecord } from "../history/types.ts"
import type { ChordLessonExercise } from "../lesson-exercise.ts"
import { createDefaultSessionPlanner, type SessionPlanner } from "../session/planner.ts"
import { getActiveNoteRange } from "../voice-ranges.ts"

export interface ChordIdentifySessionDeps
  extends Pick<MountDeps, "sessionHistory" | "sessionCurriculumLesson"> {
  sessionPlanner?: SessionPlanner
  rng?: () => number
}

export function prepareChordQualityIdExercise(
  records: readonly AttemptRecord[],
  planner: SessionPlanner = createDefaultSessionPlanner(),
  range = getActiveNoteRange(),
  _rng: () => number = Math.random,
  sessionCurriculumLesson?: CurriculumLesson,
): ChordLessonExercise {
  const step = resolveSessionCurriculumLesson("chord-quality-id", records, {
    urlCurriculumLesson: sessionCurriculumLesson,
  })
  const eligibleTagIds = getEligibleTagIds(step)
  const triadQualityId = planner.planNextExerciseTag(step, records)
  if (!isChordQualityIdContentTierId(step.contentTierId)) {
    throw new Error(`Not a chord quality identify tier: ${step.contentTierId}`)
  }
  const tierConfig = getChordQualityIdTierConfig(step.contentTierId)
  const type = getChordTypeById(triadQualityId)
  if (!type) {
    throw new Error(`Unknown chord type id: ${triadQualityId}`)
  }
  const chord = randomChordExercise(type, tierConfig.inversion, 0, range)
  return {
    type: "chord",
    target: chordTarget(chord),
    chord,
    chordTypeId: type.id,
    inversionId: tierConfig.inversion,
    contentTierId: step.contentTierId,
    eligibleTagIds,
  }
}

export function prepareChordInversionIdExercise(
  records: readonly AttemptRecord[],
  planner: SessionPlanner = createDefaultSessionPlanner(),
  range = getActiveNoteRange(),
  _rng: () => number = Math.random,
  sessionCurriculumLesson?: CurriculumLesson,
): ChordLessonExercise {
  const step = resolveSessionCurriculumLesson("chord-inversion-id", records, {
    urlCurriculumLesson: sessionCurriculumLesson,
  })
  const eligibleTagIds = getEligibleTagIds(step)
  const inversionId = planner.planNextExerciseTag(step, records) as ChordLessonExercise["inversionId"]
  if (!isChordInversionIdContentTierId(step.contentTierId)) {
    throw new Error(`Not a chord inversion identify tier: ${step.contentTierId}`)
  }
  const tierConfig = getChordInversionIdTierConfig(step.contentTierId)
  const type = getChordTypeById(tierConfig.triadQualityId)
  if (!type) {
    throw new Error(`Unknown chord type id: ${tierConfig.triadQualityId}`)
  }
  const chord = randomChordExercise(type, inversionId, 0, range)
  return {
    type: "chord",
    target: chordTarget(chord),
    chord,
    chordTypeId: type.id,
    inversionId,
    contentTierId: step.contentTierId,
    eligibleTagIds,
  }
}

export function resolveChordIdentifySession(deps: ChordIdentifySessionDeps): {
  sessionHistory: SessionHistoryCache
  planner: SessionPlanner
  rng: () => number
} {
  if (!deps.sessionHistory) {
    throw new Error("sessionHistory is required")
  }

  return {
    sessionHistory: deps.sessionHistory,
    planner: deps.sessionPlanner ?? createDefaultSessionPlanner(),
    rng: deps.rng ?? Math.random,
  }
}
