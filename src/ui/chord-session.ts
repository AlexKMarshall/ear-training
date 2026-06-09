import { getChordTypeById } from "../chord-config.ts"
import { randomChordExercise } from "../chord-types.ts"
import { chordTarget } from "../chords.ts"
import { getChordTierConfig, isChordContentTierId } from "../curriculum/chord-tiers.ts"
import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts"
import { getEligibleTagIds } from "../curriculum/curriculum-lessons.ts"
import { resolveSessionCurriculumLesson } from "../curriculum/session-step.ts"
import type { MountDeps } from "../history/port.ts"
import type { SessionHistoryCache } from "../history/session-cache.ts"
import type { AttemptRecord } from "../history/types.ts"
import type { ChordLessonExercise } from "../lesson-exercise.ts"
import { createDefaultSessionPlanner, type SessionPlanner } from "../session/planner.ts"
import { getActiveNoteRange } from "../voice-ranges.ts"
import { type VoicingPositionId, voicingPositionIndex } from "../voicing-position.ts"

export interface ChordSessionDeps
  extends Pick<MountDeps, "sessionHistory" | "sessionCurriculumLesson"> {
  sessionPlanner?: SessionPlanner
  rng?: () => number
}

export function prepareChordExercise(
  records: readonly AttemptRecord[],
  planner: SessionPlanner = createDefaultSessionPlanner(),
  range = getActiveNoteRange(),
  _rng: () => number = Math.random,
  sessionCurriculumLesson?: CurriculumLesson,
): ChordLessonExercise {
  const step = resolveSessionCurriculumLesson("chord-sing", records, {
    urlCurriculumLesson: sessionCurriculumLesson,
  })
  const eligibleTagIds = getEligibleTagIds(step)
  const voicingPositionId = planner.planNextExerciseTag(step, records) as VoicingPositionId
  if (!isChordContentTierId(step.contentTierId)) {
    throw new Error(`Not a chord content tier: ${step.contentTierId}`)
  }
  const tierConfig = getChordTierConfig(step.contentTierId)
  const type = getChordTypeById(tierConfig.triadQualityId)
  if (!type) {
    throw new Error(`Unknown chord type id: ${tierConfig.triadQualityId}`)
  }
  const targetIndex = voicingPositionIndex(voicingPositionId)
  const chord = randomChordExercise(type, tierConfig.inversion, targetIndex, range)
  return {
    type: "chord",
    target: chordTarget(chord),
    chord,
    chordTypeId: type.id,
    inversionId: tierConfig.inversion,
    voicingPositionId,
    contentTierId: step.contentTierId,
    eligibleTagIds,
  }
}

export function resolveChordSession(deps: ChordSessionDeps): {
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
