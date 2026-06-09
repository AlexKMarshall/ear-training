import { excludeLegacyRecords } from "../history/legacy-records.ts"
import type { AttemptRecord } from "../history/types.ts"
import { PRACTICE_MODE_LABELS, type PracticeModeId } from "../history/types.ts"
import { DIATONIC_MAJOR_INTERVAL_IDS, INTERVAL_2A_IDS } from "../interval-config.ts"
import {
  DEGREE_MAJOR_DIATONIC_IDS,
  DEGREE_MAJOR_INTRO_IDS,
  DEGREE_MINOR_DIATONIC_IDS,
} from "../scale-degree-config.ts"
import {
  getChordInversionIdLessonBannerLabel,
  getChordLessonBannerLabel,
  getChordQualityIdLessonBannerLabel,
  getEligibleInversionIds,
  getEligibleTriadQualityIds,
  getEligibleVoicingPositionIds,
  isChordContentTierId,
  isChordInversionIdContentTierId,
  isChordQualityIdContentTierId,
} from "./chord-tiers.ts"
import { DEGREE_TIER_POOL_LABEL } from "./scale-degree-tiers.ts"

export type ContentTierId =
  | "tier-1"
  | "interval-2a"
  | "interval-2b"
  | "degree-major-intro"
  | "degree-major-diatonic"
  | "degree-minor-diatonic"
  | "chord-major-root"
  | "chord-minor-root"
  | "chord-major-first"
  | "chord-minor-first"
  | "chord-major-second"
  | "chord-minor-second"
  | "chord-quality-root"
  | "chord-quality-first"
  | "chord-quality-second"
  | "chord-inversion-major"
  | "chord-inversion-minor"

export interface CurriculumLesson {
  practiceModeId: PracticeModeId
  contentTierId: ContentTierId
}

export const CURRICULUM_LESSONS: readonly CurriculumLesson[] = [
  { practiceModeId: "single-note", contentTierId: "tier-1" },
  { practiceModeId: "interval-melodic-sing", contentTierId: "interval-2a" },
  { practiceModeId: "interval-named-sing", contentTierId: "interval-2a" },
  { practiceModeId: "interval-melodic-id", contentTierId: "interval-2a" },
  { practiceModeId: "interval-harmonic-sing", contentTierId: "interval-2a" },
  { practiceModeId: "chord-sing", contentTierId: "chord-major-root" },
  { practiceModeId: "interval-harmonic-id", contentTierId: "interval-2a" },
  { practiceModeId: "chord-sing", contentTierId: "chord-minor-root" },
  { practiceModeId: "chord-quality-id", contentTierId: "chord-quality-root" },
  { practiceModeId: "scale-degree-sing", contentTierId: "degree-major-intro" },
  { practiceModeId: "interval-melodic-sing", contentTierId: "interval-2b" },
  { practiceModeId: "chord-sing", contentTierId: "chord-major-first" },
  { practiceModeId: "interval-named-sing", contentTierId: "interval-2b" },
  { practiceModeId: "chord-sing", contentTierId: "chord-minor-first" },
  { practiceModeId: "chord-quality-id", contentTierId: "chord-quality-first" },
  { practiceModeId: "interval-melodic-id", contentTierId: "interval-2b" },
  { practiceModeId: "interval-harmonic-sing", contentTierId: "interval-2b" },
  { practiceModeId: "interval-harmonic-id", contentTierId: "interval-2b" },
  { practiceModeId: "scale-degree-sing", contentTierId: "degree-major-diatonic" },
  { practiceModeId: "chord-sing", contentTierId: "chord-major-second" },
  { practiceModeId: "chord-inversion-id", contentTierId: "chord-inversion-major" },
  { practiceModeId: "scale-degree-sing", contentTierId: "degree-minor-diatonic" },
  { practiceModeId: "chord-sing", contentTierId: "chord-minor-second" },
  { practiceModeId: "chord-quality-id", contentTierId: "chord-quality-second" },
  { practiceModeId: "chord-inversion-id", contentTierId: "chord-inversion-minor" },
] as const

export function curriculumLessonKey(step: CurriculumLesson): string {
  return `${step.practiceModeId}:${step.contentTierId}`
}

export function getCurriculumLessonIndex(step: CurriculumLesson): number {
  const key = curriculumLessonKey(step)
  return CURRICULUM_LESSONS.findIndex((s) => curriculumLessonKey(s) === key)
}

export function curriculumLessonsForPracticeMode(
  practiceModeId: PracticeModeId,
): readonly CurriculumLesson[] {
  return CURRICULUM_LESSONS.filter((s) => s.practiceModeId === practiceModeId)
}

export function getEligibleIntervalIds(tierId: "interval-2a" | "interval-2b"): readonly string[] {
  if (tierId === "interval-2a") {
    return INTERVAL_2A_IDS
  }
  return DIATONIC_MAJOR_INTERVAL_IDS
}

export function getEligibleDegreeIds(
  tierId: "degree-major-intro" | "degree-major-diatonic" | "degree-minor-diatonic",
): readonly string[] {
  switch (tierId) {
    case "degree-major-intro":
      return DEGREE_MAJOR_INTRO_IDS
    case "degree-major-diatonic":
      return DEGREE_MAJOR_DIATONIC_IDS
    case "degree-minor-diatonic":
      return DEGREE_MINOR_DIATONIC_IDS
  }
}

/** Attempts that count toward progress for this step (tier filter when set on records). */
export function filterRecordsForCurriculumLesson(
  records: readonly AttemptRecord[],
  step: CurriculumLesson,
): AttemptRecord[] {
  const firstTierId = curriculumLessonsForPracticeMode(step.practiceModeId)[0]?.contentTierId
  return excludeLegacyRecords(records).filter((record) => {
    if (record.practiceModeId !== step.practiceModeId) {
      return false
    }
    const tier = record.contentTierId
    if (tier === undefined) {
      return step.contentTierId === firstTierId
    }
    return tier === step.contentTierId
  })
}

const INTERVAL_TIER_POOL_LABEL: Record<"interval-2a" | "interval-2b", string> = {
  "interval-2a": "perfect 4th, 5th, octave",
  "interval-2b": "diatonic intervals within one octave",
}

/** Human-readable step label for unlock copy (includes tier pool when relevant). */
export function getCurriculumLessonLabel(step: CurriculumLesson): string {
  const title = PRACTICE_MODE_LABELS[step.practiceModeId]
  if (step.contentTierId === "interval-2a" || step.contentTierId === "interval-2b") {
    return `${title} (${INTERVAL_TIER_POOL_LABEL[step.contentTierId]})`
  }
  if (step.practiceModeId === "scale-degree-sing") {
    const pool = DEGREE_TIER_POOL_LABEL[step.contentTierId as keyof typeof DEGREE_TIER_POOL_LABEL]
    if (pool) {
      return `${title} (${pool})`
    }
  }
  if (step.practiceModeId === "chord-sing" && isChordContentTierId(step.contentTierId)) {
    return `${title} (${getChordLessonBannerLabel(step.contentTierId)})`
  }
  if (
    step.practiceModeId === "chord-quality-id" &&
    isChordQualityIdContentTierId(step.contentTierId)
  ) {
    return `${title} (${getChordQualityIdLessonBannerLabel(step.contentTierId)})`
  }
  if (
    step.practiceModeId === "chord-inversion-id" &&
    isChordInversionIdContentTierId(step.contentTierId)
  ) {
    return `${title} (${getChordInversionIdLessonBannerLabel(step.contentTierId)})`
  }
  return title
}

export function getEligibleTagIds(step: CurriculumLesson): readonly string[] {
  switch (step.contentTierId) {
    case "tier-1":
      return []
    case "interval-2a":
    case "interval-2b":
      return getEligibleIntervalIds(step.contentTierId)
    case "degree-major-intro":
    case "degree-major-diatonic":
    case "degree-minor-diatonic":
      return getEligibleDegreeIds(step.contentTierId)
    case "chord-major-root":
    case "chord-minor-root":
    case "chord-major-first":
    case "chord-minor-first":
    case "chord-major-second":
    case "chord-minor-second":
      return getEligibleVoicingPositionIds()
    case "chord-quality-root":
    case "chord-quality-first":
    case "chord-quality-second":
      return getEligibleTriadQualityIds()
    case "chord-inversion-major":
    case "chord-inversion-minor":
      return getEligibleInversionIds()
  }
}
