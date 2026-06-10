import { EXERCISES_PER_LESSON } from "../config.ts"
import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts"
import {
  CURRICULUM_LESSONS,
  curriculumLessonKey,
  filterRecordsForCurriculumLesson,
  getEligibleTagIds,
} from "../curriculum/curriculum-lessons.ts"
import { getPathNodeFamilyTitle, getPathNodeState } from "../curriculum/path-node.ts"
import { computeLessonExerciseStats } from "../history/stats.ts"
import { getPlannerTagLabel, getTagBreakdownConfig } from "../history/tag-stats.ts"
import type { AttemptRecord, PracticeModeId } from "../history/types.ts"
import { pickRandom } from "../util/array.ts"
import { isWeakTag, WEAK_AREA_PROBABILITY, weakTagWeight } from "./planner.ts"

const MS_PER_DAY = 24 * 60 * 60 * 1000
const RECENCY_BOOST_DAYS = 7

interface TargetedPracticeFocusArea {
  curriculumLesson: CurriculumLesson
  tagId: string
  label: string
}

interface TargetedPracticeSlot {
  curriculumLesson: CurriculumLesson
  tagId: string
  practiceModeId: PracticeModeId
}

export interface TargetedPracticePlan {
  family: string
  focusAreas: readonly TargetedPracticeFocusArea[]
  focusTagLabels: readonly string[]
  slots: readonly TargetedPracticeSlot[]
}

interface ScoredTagPair {
  curriculumLesson: CurriculumLesson
  tagId: string
  lessonExerciseCount: number
  lessonExercisePassRatePercent: number
  isWeak: boolean
  priority: number
}

interface TargetedPracticePlannerOptions {
  rng?: () => number
  now?: number
  weakAreaProbability?: number
}

function recencyBoost(lastTimestamp: number | undefined, now: number): number {
  if (lastTimestamp === undefined) {
    return 2
  }
  const days = (now - lastTimestamp) / MS_PER_DAY
  return 1 + Math.min(days / RECENCY_BOOST_DAYS, 1)
}

function getPassedCurriculumLessons(records: readonly AttemptRecord[]): CurriculumLesson[] {
  return CURRICULUM_LESSONS.filter((step) => getPathNodeState(step, records) === "passed")
}

function scoreTagPairsForLesson(
  step: CurriculumLesson,
  records: readonly AttemptRecord[],
  now: number,
): ScoredTagPair[] {
  const eligible = getEligibleTagIds(step)
  if (eligible.length === 0) {
    return []
  }
  const config = getTagBreakdownConfig(step.practiceModeId)
  if (!config) {
    return []
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

  return eligible.map((tagId) => {
    const tagRecords = byTag.get(tagId) ?? []
    const { lessonExerciseCount, lessonExercisePassRatePercent } =
      computeLessonExerciseStats(tagRecords)
    const lastTimestamp =
      tagRecords.length > 0 ? Math.max(...tagRecords.map((record) => record.timestamp)) : undefined
    const weak = isWeakTag(lessonExerciseCount, lessonExercisePassRatePercent)
    const priority =
      weakTagWeight(lessonExerciseCount, lessonExercisePassRatePercent) *
      recencyBoost(lastTimestamp, now)
    return {
      curriculumLesson: step,
      tagId,
      lessonExerciseCount,
      lessonExercisePassRatePercent,
      isWeak: weak,
      priority,
    }
  })
}

function scoreAllPassedTagPairs(records: readonly AttemptRecord[], now: number): ScoredTagPair[] {
  const pairs: ScoredTagPair[] = []
  for (const step of getPassedCurriculumLessons(records)) {
    pairs.push(...scoreTagPairsForLesson(step, records, now))
  }
  return pairs
}

function compareRelativeWeakness(a: ScoredTagPair, b: ScoredTagPair): number {
  if (a.lessonExercisePassRatePercent !== b.lessonExercisePassRatePercent) {
    return a.lessonExercisePassRatePercent - b.lessonExercisePassRatePercent
  }
  if (a.lessonExerciseCount !== b.lessonExerciseCount) {
    return a.lessonExerciseCount - b.lessonExerciseCount
  }
  if (a.priority !== b.priority) {
    return b.priority - a.priority
  }
  return a.tagId.localeCompare(b.tagId)
}

function pickHighestPriorityPair(pairs: readonly ScoredTagPair[]): ScoredTagPair | null {
  if (pairs.length === 0) {
    return null
  }
  const weakPairs = pairs.filter((pair) => pair.isWeak)
  if (weakPairs.length > 0) {
    return weakPairs.reduce((best, pair) => (pair.priority > best.priority ? pair : best))
  }
  return [...pairs].sort(compareRelativeWeakness)[0] ?? null
}

function pickFocusAreas(
  family: string,
  records: readonly AttemptRecord[],
  now: number,
): TargetedPracticeFocusArea[] {
  const familyPairs = scoreAllPassedTagPairs(records, now).filter(
    (pair) => getPathNodeFamilyTitle(pair.curriculumLesson.practiceModeId) === family,
  )
  const primary = pickHighestPriorityPair(familyPairs)
  if (!primary) {
    return []
  }

  const focusAreas: TargetedPracticeFocusArea[] = [toFocusArea(primary)]

  const second = familyPairs.find(
    (pair) =>
      pair.tagId === primary.tagId &&
      curriculumLessonKey(pair.curriculumLesson) !== curriculumLessonKey(primary.curriculumLesson),
  )
  if (second) {
    focusAreas.push(toFocusArea(second))
  }

  return focusAreas
}

function toFocusArea(pair: ScoredTagPair): TargetedPracticeFocusArea {
  return {
    curriculumLesson: pair.curriculumLesson,
    tagId: pair.tagId,
    label: getPlannerTagLabel(pair.curriculumLesson.practiceModeId, pair.tagId),
  }
}

function pickWeightedPair(pairs: readonly ScoredTagPair[], rng: () => number): ScoredTagPair {
  if (pairs.length === 0) {
    throw new Error("pickWeightedPair: empty pairs")
  }
  if (pairs.length === 1) {
    const only = pairs[0]
    if (!only) {
      throw new Error("pickWeightedPair: empty pairs")
    }
    return only
  }
  const weights = pairs.map((pair) => pair.priority)
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  if (total <= 0) {
    return pickRandom(pairs, rng)
  }
  let roll = rng() * total
  for (let i = 0; i < pairs.length; i++) {
    const weight = weights[i]
    if (weight === undefined) {
      continue
    }
    roll -= weight
    if (roll < 0) {
      const pair = pairs[i]
      if (pair === undefined) {
        break
      }
      return pair
    }
  }
  const last = pairs[pairs.length - 1]
  if (!last) {
    throw new Error("pickWeightedPair: empty pairs")
  }
  return last
}

function focusPairsForAreas(
  focusAreas: readonly TargetedPracticeFocusArea[],
  records: readonly AttemptRecord[],
  now: number,
): ScoredTagPair[] {
  const keys = new Set(
    focusAreas.map((area) => `${curriculumLessonKey(area.curriculumLesson)}:${area.tagId}`),
  )
  return scoreAllPassedTagPairs(records, now).filter((pair) =>
    keys.has(`${curriculumLessonKey(pair.curriculumLesson)}:${pair.tagId}`),
  )
}

function maintenancePairsInFamily(
  family: string,
  records: readonly AttemptRecord[],
  now: number,
): ScoredTagPair[] {
  return scoreAllPassedTagPairs(records, now).filter(
    (pair) =>
      getPathNodeFamilyTitle(pair.curriculumLesson.practiceModeId) === family && !pair.isWeak,
  )
}

function toSlot(pair: ScoredTagPair): TargetedPracticeSlot {
  return {
    curriculumLesson: pair.curriculumLesson,
    tagId: pair.tagId,
    practiceModeId: pair.curriculumLesson.practiceModeId,
  }
}

function buildSlotKinds(
  focusCount: number,
  maintenanceCount: number,
  focusPairs: readonly ScoredTagPair[],
): Array<"focus" | "maintenance"> {
  const uniqueFocusTags = new Set(focusPairs.map((pair) => pair.tagId)).size
  if (uniqueFocusTags <= 1 && maintenanceCount > 0) {
    const kinds: Array<"focus" | "maintenance"> = []
    let focusRemaining = focusCount
    let maintenanceRemaining = maintenanceCount
    while (focusRemaining + maintenanceRemaining > 0) {
      const lastKind = kinds.at(-1)
      if (focusRemaining > 0 && (lastKind !== "focus" || maintenanceRemaining === 0)) {
        kinds.push("focus")
        focusRemaining -= 1
        continue
      }
      if (maintenanceRemaining > 0) {
        kinds.push("maintenance")
        maintenanceRemaining -= 1
        continue
      }
      kinds.push("focus")
      focusRemaining -= 1
    }
    return kinds
  }

  const kinds: Array<"focus" | "maintenance"> = []
  let focusRemaining = focusCount
  let maintenanceRemaining = maintenanceCount
  while (focusRemaining + maintenanceRemaining > 0) {
    const remaining = focusRemaining + maintenanceRemaining
    const preferFocus =
      focusRemaining > 0 &&
      (maintenanceRemaining === 0 || focusRemaining / remaining >= WEAK_AREA_PROBABILITY)
    if (preferFocus) {
      kinds.push("focus")
      focusRemaining -= 1
    } else {
      kinds.push("maintenance")
      maintenanceRemaining -= 1
    }
  }
  return kinds
}

function pickPairAvoidingTag(
  pairs: readonly ScoredTagPair[],
  lastTagId: string | undefined,
  rng: () => number,
  weighted: boolean,
): ScoredTagPair {
  const candidates =
    lastTagId === undefined ? pairs : pairs.filter((pair) => pair.tagId !== lastTagId)
  const pool = candidates.length > 0 ? candidates : pairs
  return weighted ? pickWeightedPair(pool, rng) : pickRandom(pool, rng)
}

function assembleLessonSlots(
  focusPairs: readonly ScoredTagPair[],
  maintenancePairs: readonly ScoredTagPair[],
  rng: () => number,
): TargetedPracticeSlot[] {
  const focusCount = Math.round(EXERCISES_PER_LESSON * WEAK_AREA_PROBABILITY)
  const maintenanceCount = EXERCISES_PER_LESSON - focusCount
  const maintenancePool = maintenancePairs.length > 0 ? maintenancePairs : focusPairs
  const kinds = buildSlotKinds(focusCount, maintenanceCount, focusPairs)
  const slots: TargetedPracticeSlot[] = []
  let lastTagId: string | undefined

  for (const kind of kinds) {
    const pair = pickPairAvoidingTag(
      kind === "focus" ? focusPairs : maintenancePool,
      lastTagId,
      rng,
      kind === "focus",
    )
    slots.push(toSlot(pair))
    lastTagId = pair.tagId
  }

  return slots
}

export function planTargetedPracticeLesson(
  records: readonly AttemptRecord[],
  options: TargetedPracticePlannerOptions = {},
): TargetedPracticePlan | null {
  const rng = options.rng ?? Math.random
  const now = options.now ?? Date.now()
  const allPairs = scoreAllPassedTagPairs(records, now)
  if (allPairs.length === 0) {
    return null
  }

  const topPair = pickHighestPriorityPair(allPairs)
  if (!topPair) {
    return null
  }

  const family = getPathNodeFamilyTitle(topPair.curriculumLesson.practiceModeId)
  const focusAreas = pickFocusAreas(family, records, now)
  if (focusAreas.length === 0) {
    return null
  }

  const focusPairs = focusPairsForAreas(focusAreas, records, now)
  const maintenancePairs = maintenancePairsInFamily(family, records, now)

  const slots = assembleLessonSlots(focusPairs, maintenancePairs, rng)
  const uniqueFocusLabels = [...new Set(focusAreas.map((area) => area.label))]

  return {
    family,
    focusAreas,
    focusTagLabels: uniqueFocusLabels,
    slots,
  }
}
