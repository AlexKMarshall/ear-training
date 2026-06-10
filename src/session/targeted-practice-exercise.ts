import { getChordTypeById } from "../chord-config.ts"
import type { InversionId } from "../chord-inversions.ts"
import { randomChordExercise } from "../chord-types.ts"
import { chordTarget } from "../chords.ts"
import {
  getChordInversionIdTierConfig,
  getChordPooledInversionTierConfig,
  getChordQualityIdTierConfig,
  getChordTierConfig,
  isChordInversionIdContentTierId,
  isChordPerInversionContentTierId,
  isChordPooledInversionContentTierId,
  isChordQualityIdContentTierId,
} from "../curriculum/chord-tiers.ts"
import { curriculumLessonKey, getEligibleTagIds } from "../curriculum/curriculum-lessons.ts"
import type { AttemptRecord } from "../history/types.ts"
import {
  type IntervalPresentation,
  intervalToLessonExercise,
  randomIntervalExerciseForTag,
} from "../interval-exercises.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import { getNaturalMinorSemitonesFromTonic, getScaleDegreeById } from "../scale-degree-config.ts"
import {
  buildScaleDegreeExercise,
  pickRandomLessonTonic,
  scaleDegreeToLessonExercise,
} from "../scale-degree-exercises.ts"
import type { getActiveNoteRange } from "../voice-ranges.ts"
import { type VoicingPositionId, voicingPositionIndex } from "../voicing-position.ts"
import { planChordCapstoneExerciseTag } from "./planner.ts"
import type { TargetedPracticeSlot } from "./targeted-practice-planner.ts"

export interface TargetedPracticeExerciseContext {
  records: readonly AttemptRecord[]
  rng: () => number
  range: ReturnType<typeof getActiveNoteRange>
  lessonTonicMidi: number | null
  lastScaleDegreeStepKey: string | null
}

export function slotIndexFromLessonRun(
  currentExerciseIndex: number | null,
  resultsLength: number,
): number {
  return currentExerciseIndex ?? resultsLength
}

function intervalPresentationForMode(
  practiceModeId: TargetedPracticeSlot["practiceModeId"],
): IntervalPresentation {
  switch (practiceModeId) {
    case "interval-melodic-sing":
    case "interval-named-sing":
    case "interval-melodic-id":
      return "melodic"
    case "interval-harmonic-sing":
    case "interval-harmonic-id":
      return "harmonic"
    default:
      throw new Error(`Not an interval practice mode: ${practiceModeId}`)
  }
}

function prepareIntervalSlotExercise(
  slot: TargetedPracticeSlot,
  context: TargetedPracticeExerciseContext,
): LessonExercise {
  const step = slot.curriculumLesson
  const presentation = intervalPresentationForMode(slot.practiceModeId)
  const eligibleTagIds = getEligibleTagIds(step)
  const intervalExercise = randomIntervalExerciseForTag(slot.tagId, presentation, context.range)
  return {
    ...intervalToLessonExercise(intervalExercise),
    contentTierId: step.contentTierId,
    eligibleTagIds,
  }
}

function prepareScaleDegreeSlotExercise(
  slot: TargetedPracticeSlot,
  context: TargetedPracticeExerciseContext,
): { exercise: LessonExercise; lessonTonicMidi: number | null; lastScaleDegreeStepKey: string } {
  const step = slot.curriculumLesson
  const stepKey = curriculumLessonKey(step)
  let lessonTonicMidi = context.lessonTonicMidi
  if (context.lastScaleDegreeStepKey !== stepKey) {
    lessonTonicMidi = null
  }

  const eligibleTagIds = getEligibleTagIds(step)
  const degree = getScaleDegreeById(slot.tagId)
  if (!degree) {
    throw new Error(`Unknown scale degree id: ${slot.tagId}`)
  }
  const semitonesFromTonic =
    step.contentTierId === "degree-minor-diatonic"
      ? getNaturalMinorSemitonesFromTonic(slot.tagId)
      : degree.semitonesFromTonic
  if (semitonesFromTonic === undefined) {
    throw new Error(`Unknown natural minor degree id: ${slot.tagId}`)
  }

  const tonic = lessonTonicMidi ?? pickRandomLessonTonic(context.range, [degree])

  const exercise = {
    ...scaleDegreeToLessonExercise(
      buildScaleDegreeExercise({ ...degree, semitonesFromTonic }, tonic),
    ),
    contentTierId: step.contentTierId,
    eligibleTagIds,
  }

  return { exercise, lessonTonicMidi: tonic, lastScaleDegreeStepKey: stepKey }
}

function prepareChordSingSlotExercise(
  slot: TargetedPracticeSlot,
  context: TargetedPracticeExerciseContext,
): LessonExercise {
  const step = slot.curriculumLesson
  const eligibleTagIds = getEligibleTagIds(step)

  if (isChordPooledInversionContentTierId(step.contentTierId)) {
    const tierConfig = getChordPooledInversionTierConfig(step.contentTierId)
    const voicingPositionId = slot.tagId as VoicingPositionId
    const inversionId = planChordCapstoneExerciseTag(
      step,
      "inversion",
      context.records,
      context.rng,
    ) as InversionId
    const type = getChordTypeById(tierConfig.triadQualityId)
    if (!type) {
      throw new Error(`Unknown chord type id: ${tierConfig.triadQualityId}`)
    }
    const targetIndex = voicingPositionIndex(voicingPositionId)
    const chord = randomChordExercise(type, inversionId, targetIndex, context.range)
    return {
      type: "chord",
      target: chordTarget(chord),
      chord,
      chordTypeId: type.id,
      inversionId,
      voicingPositionId,
      contentTierId: step.contentTierId,
      eligibleTagIds,
    }
  }

  if (!isChordPerInversionContentTierId(step.contentTierId)) {
    throw new Error(`Not a chord content tier: ${step.contentTierId}`)
  }
  const voicingPositionId = slot.tagId as VoicingPositionId
  const tierConfig = getChordTierConfig(step.contentTierId)
  const type = getChordTypeById(tierConfig.triadQualityId)
  if (!type) {
    throw new Error(`Unknown chord type id: ${tierConfig.triadQualityId}`)
  }
  const targetIndex = voicingPositionIndex(voicingPositionId)
  const chord = randomChordExercise(type, tierConfig.inversion, targetIndex, context.range)
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

function prepareChordQualityIdSlotExercise(
  slot: TargetedPracticeSlot,
  context: TargetedPracticeExerciseContext,
): LessonExercise {
  const step = slot.curriculumLesson
  const eligibleTagIds = getEligibleTagIds(step)
  if (!isChordQualityIdContentTierId(step.contentTierId)) {
    throw new Error(`Not a chord quality identify tier: ${step.contentTierId}`)
  }
  const tierConfig = getChordQualityIdTierConfig(step.contentTierId)
  const type = getChordTypeById(slot.tagId)
  if (!type) {
    throw new Error(`Unknown chord type id: ${slot.tagId}`)
  }
  const chord = randomChordExercise(type, tierConfig.inversion, 0, context.range)
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

function prepareChordInversionIdSlotExercise(
  slot: TargetedPracticeSlot,
  context: TargetedPracticeExerciseContext,
): LessonExercise {
  const step = slot.curriculumLesson
  const eligibleTagIds = getEligibleTagIds(step)
  if (!isChordInversionIdContentTierId(step.contentTierId)) {
    throw new Error(`Not a chord inversion identify tier: ${step.contentTierId}`)
  }
  const tierConfig = getChordInversionIdTierConfig(step.contentTierId)
  const inversionId = slot.tagId as InversionId
  const type = getChordTypeById(tierConfig.triadQualityId)
  if (!type) {
    throw new Error(`Unknown chord type id: ${tierConfig.triadQualityId}`)
  }
  const chord = randomChordExercise(type, inversionId, 0, context.range)
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

export interface PreparedTargetedPracticeExercise {
  exercise: LessonExercise
  lessonTonicMidi: number | null
  lastScaleDegreeStepKey: string | null
}

export function prepareTargetedPracticeSlotExercise(
  slot: TargetedPracticeSlot,
  context: TargetedPracticeExerciseContext,
): PreparedTargetedPracticeExercise {
  switch (slot.practiceModeId) {
    case "interval-melodic-sing":
    case "interval-named-sing":
    case "interval-harmonic-sing":
    case "interval-melodic-id":
    case "interval-harmonic-id":
      return {
        exercise: prepareIntervalSlotExercise(slot, context),
        lessonTonicMidi: context.lessonTonicMidi,
        lastScaleDegreeStepKey: context.lastScaleDegreeStepKey,
      }
    case "scale-degree-sing": {
      const result = prepareScaleDegreeSlotExercise(slot, context)
      return {
        exercise: result.exercise,
        lessonTonicMidi: result.lessonTonicMidi,
        lastScaleDegreeStepKey: result.lastScaleDegreeStepKey,
      }
    }
    case "chord-sing":
      return {
        exercise: prepareChordSingSlotExercise(slot, context),
        lessonTonicMidi: context.lessonTonicMidi,
        lastScaleDegreeStepKey: context.lastScaleDegreeStepKey,
      }
    case "chord-quality-id":
      return {
        exercise: prepareChordQualityIdSlotExercise(slot, context),
        lessonTonicMidi: context.lessonTonicMidi,
        lastScaleDegreeStepKey: context.lastScaleDegreeStepKey,
      }
    case "chord-inversion-id":
      return {
        exercise: prepareChordInversionIdSlotExercise(slot, context),
        lessonTonicMidi: context.lessonTonicMidi,
        lastScaleDegreeStepKey: context.lastScaleDegreeStepKey,
      }
    case "single-note":
      throw new Error("single-note is not used in targeted practice slots")
  }
}
