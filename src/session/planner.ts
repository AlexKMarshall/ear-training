import {
  getChordCapstoneFallbackTierIds,
  getEligibleInversionIds,
  getEligibleVoicingPositionIds,
  isChordPooledInversionContentTierId,
} from "../curriculum/chord-tiers.ts"
import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts"
import {
  filterRecordsForCurriculumLesson,
  getEligibleTagIds,
} from "../curriculum/curriculum-lessons.ts"
import { MIN_EXERCISE_PASS_RATE, MIN_EXERCISES_FOR_UNLOCK } from "../curriculum/unlock.ts"
import { excludeLegacyRecords } from "../history/legacy-records.ts"
import { computeLessonExerciseStats } from "../history/stats.ts"
import { getTagBreakdownConfig } from "../history/tag-stats.ts"
import type { AttemptRecord } from "../history/types.ts"
import { pickRandom } from "../util/array.ts"

/** Share of draws that target weak (under-threshold) tags vs maintenance. */
export const WEAK_AREA_PROBABILITY = 0.7

export interface SessionPlanner {
  planNextExerciseTag(step: CurriculumLesson, records: readonly AttemptRecord[]): string
}

interface SessionPlannerOptions {
  rng?: () => number
  weakAreaProbability?: number
}

function createSessionPlanner(options: SessionPlannerOptions = {}): SessionPlanner {
  const rng = options.rng ?? Math.random
  const weakAreaProbability = options.weakAreaProbability ?? WEAK_AREA_PROBABILITY
  return {
    planNextExerciseTag(step, records) {
      return planNextExerciseTag(step, records, rng, weakAreaProbability)
    },
  }
}

export function createDefaultSessionPlanner(): SessionPlanner {
  return createSessionPlanner()
}

function isWeakTag(lessonExerciseCount: number, lessonExercisePassRatePercent: number): boolean {
  return (
    lessonExerciseCount < MIN_EXERCISES_FOR_UNLOCK ||
    lessonExercisePassRatePercent < MIN_EXERCISE_PASS_RATE
  )
}

function weakTagWeight(lessonExerciseCount: number, lessonExercisePassRatePercent: number): number {
  if (lessonExerciseCount === 0) {
    return 100
  }
  return Math.max(1, 100 - lessonExercisePassRatePercent)
}

function pickWeighted<T>(items: readonly T[], weightFn: (item: T) => number, rng: () => number): T {
  if (items.length === 0) {
    throw new Error("pickWeighted: empty items")
  }
  const weights = items.map(weightFn)
  const total = weights.reduce((sum, w) => sum + w, 0)
  if (total <= 0) {
    return pickRandom(items, rng)
  }
  let roll = rng() * total
  for (let i = 0; i < items.length; i++) {
    const weight = weights[i]
    if (weight === undefined) {
      continue
    }
    roll -= weight
    if (roll < 0) {
      const item = items[i]
      if (item === undefined) {
        break
      }
      return item
    }
  }
  const last = items[items.length - 1]
  if (last === undefined) {
    throw new Error("pickWeighted: empty items")
  }
  return last
}

export type ChordCapstonePlannerAxis = "inversion" | "voicing-position"

function getTagIdForCapstoneAxis(
  record: AttemptRecord,
  axis: ChordCapstonePlannerAxis,
): string | undefined {
  return axis === "inversion" ? record.inversionId : record.voicingPositionId
}

function filterRecordsForCapstoneAxis(
  step: CurriculumLesson,
  records: readonly AttemptRecord[],
): AttemptRecord[] {
  if (!isChordPooledInversionContentTierId(step.contentTierId)) {
    throw new Error(`Not a chord pooled-inversion tier: ${step.contentTierId}`)
  }
  const capstoneRecords = filterRecordsForCurriculumLesson(records, step)
  if (capstoneRecords.length > 0) {
    return capstoneRecords
  }
  const fallbackTierIds = getChordCapstoneFallbackTierIds(step.contentTierId)
  return excludeLegacyRecords(records).filter(
    (record) =>
      record.practiceModeId === "chord-sing" &&
      record.contentTierId !== undefined &&
      (fallbackTierIds as readonly string[]).includes(record.contentTierId),
  )
}

export function planChordCapstoneExerciseTag(
  step: CurriculumLesson,
  axis: ChordCapstonePlannerAxis,
  records: readonly AttemptRecord[],
  rng: () => number = Math.random,
  weakAreaProbability: number = WEAK_AREA_PROBABILITY,
): string {
  const eligible: readonly string[] =
    axis === "inversion" ? getEligibleInversionIds() : getEligibleVoicingPositionIds()
  const axisRecords = filterRecordsForCapstoneAxis(step, records)
  const byTag = new Map<string, AttemptRecord[]>()
  for (const record of axisRecords) {
    const tagId = getTagIdForCapstoneAxis(record, axis)
    if (!tagId || !eligible.includes(tagId)) {
      continue
    }
    const group = byTag.get(tagId) ?? []
    group.push(record)
    byTag.set(tagId, group)
  }

  const weak: string[] = []
  const maintenance: string[] = []

  for (const tagId of eligible) {
    const tagRecords = byTag.get(tagId) ?? []
    const { lessonExerciseCount, lessonExercisePassRatePercent } =
      computeLessonExerciseStats(tagRecords)
    if (isWeakTag(lessonExerciseCount, lessonExercisePassRatePercent)) {
      weak.push(tagId)
    } else {
      maintenance.push(tagId)
    }
  }

  const pickFromWeak = weak.length > 0 && (maintenance.length === 0 || rng() < weakAreaProbability)
  const pool = pickFromWeak ? weak : maintenance

  if (pool.length === 1) {
    return pickRandom(pool, rng)
  }

  if (pickFromWeak) {
    return pickWeighted(
      pool,
      (tagId) => {
        const tagRecords = byTag.get(tagId) ?? []
        const { lessonExerciseCount, lessonExercisePassRatePercent } =
          computeLessonExerciseStats(tagRecords)
        return weakTagWeight(lessonExerciseCount, lessonExercisePassRatePercent)
      },
      rng,
    )
  }

  return pickRandom(pool, rng)
}

export function planNextExerciseTag(
  step: CurriculumLesson,
  records: readonly AttemptRecord[],
  rng: () => number = Math.random,
  weakAreaProbability: number = WEAK_AREA_PROBABILITY,
): string {
  const eligible = getEligibleTagIds(step)
  if (eligible.length === 0) {
    throw new Error(
      `No eligible tags for curriculum lesson ${step.practiceModeId}:${step.contentTierId}`,
    )
  }

  const config = getTagBreakdownConfig(step.practiceModeId)
  if (!config) {
    return pickRandom(eligible, rng)
  }

  const stepRecords = filterRecordsForCurriculumLesson(records, step)
  const byTag = new Map<string, AttemptRecord[]>()
  for (const record of stepRecords) {
    const tagId = config.getTagId(record)
    if (!tagId || !eligible.includes(tagId)) {
      continue
    }
    const group = byTag.get(tagId) ?? []
    group.push(record)
    byTag.set(tagId, group)
  }

  const weak: string[] = []
  const maintenance: string[] = []

  for (const tagId of eligible) {
    const tagRecords = byTag.get(tagId) ?? []
    const { lessonExerciseCount, lessonExercisePassRatePercent } =
      computeLessonExerciseStats(tagRecords)
    if (isWeakTag(lessonExerciseCount, lessonExercisePassRatePercent)) {
      weak.push(tagId)
    } else {
      maintenance.push(tagId)
    }
  }

  const pickFromWeak = weak.length > 0 && (maintenance.length === 0 || rng() < weakAreaProbability)
  const pool = pickFromWeak ? weak : maintenance

  if (pool.length === 1) {
    return pickRandom(pool, rng)
  }

  if (pickFromWeak) {
    return pickWeighted(
      pool,
      (tagId) => {
        const tagRecords = byTag.get(tagId) ?? []
        const { lessonExerciseCount, lessonExercisePassRatePercent } =
          computeLessonExerciseStats(tagRecords)
        return weakTagWeight(lessonExerciseCount, lessonExercisePassRatePercent)
      },
      rng,
    )
  }

  return pickRandom(pool, rng)
}
