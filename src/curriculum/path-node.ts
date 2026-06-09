import type { AttemptRecord, PracticeModeId } from "../history/types.ts"
import { getPracticeMode } from "../practice-modes/registry.ts"
import {
  getChordInversionIdExerciseSubtitle,
  getChordLessonBannerLabel,
  getChordQualityIdExerciseSubtitle,
  isChordContentTierId,
  isChordInversionIdContentTierId,
  isChordQualityIdContentTierId,
} from "./chord-tiers.ts"
import type { CurriculumLesson } from "./curriculum-lessons.ts"
import {
  CURRICULUM_LESSONS,
  curriculumLessonKey,
  getCurriculumLessonIndex,
} from "./curriculum-lessons.ts"
import { formatLessonLinkUrl } from "./lesson-link.ts"
import {
  computeCurriculumLessonProgress,
  getContinueCurriculumLesson,
  getUnlockRequirementForCurriculumLesson,
  isCurriculumLessonUnlocked,
  MIN_EXERCISE_PASS_RATE,
  MIN_EXERCISES_FOR_UNLOCK,
  meetsCurriculumLessonThreshold,
} from "./unlock.ts"

export type PathNodeState = "passed" | "current" | "locked"

export interface PathNodeLabels {
  title: string
  subtitle: string
}

const INTERVAL_MODE_LABEL: Record<
  Extract<
    PracticeModeId,
    | "interval-melodic-sing"
    | "interval-named-sing"
    | "interval-melodic-id"
    | "interval-harmonic-sing"
    | "interval-harmonic-id"
  >,
  string
> = {
  "interval-melodic-sing": "Melodic reproduction",
  "interval-named-sing": "Named-interval reproduction",
  "interval-melodic-id": "Melodic identification",
  "interval-harmonic-sing": "Harmonic reproduction",
  "interval-harmonic-id": "Harmonic identification",
}

const TIER_POOL_LABEL: Record<CurriculumLesson["contentTierId"], string | null> = {
  "tier-1": "sing back one note",
  "interval-2a": "perfect 4th, 5th, octave",
  "interval-2b": "diatonic intervals within one octave",
  "degree-major-intro": "major key · 4th, 5th, octave",
  "degree-major-diatonic": "major key · diatonic degrees within one octave",
  "degree-minor-diatonic": "natural minor key · diatonic degrees within one octave",
  "chord-major-root": "any voice",
  "chord-minor-root": "any voice",
  "chord-major-first": "any voice",
  "chord-minor-first": "any voice",
  "chord-major-second": "any voice",
  "chord-minor-second": "any voice",
  "chord-quality-root": null,
  "chord-quality-first": null,
  "chord-quality-second": null,
  "chord-inversion-major": null,
  "chord-inversion-minor": null,
}

/** Optional per-step label overrides (full `practiceModeId:contentTierId` keys). */
const STEP_LABEL_OVERRIDES: Partial<Record<string, PathNodeLabels>> = {}

function familyTitle(practiceModeId: PracticeModeId): string {
  switch (practiceModeId) {
    case "single-note":
      return "Single note"
    case "interval-melodic-sing":
    case "interval-named-sing":
    case "interval-melodic-id":
    case "interval-harmonic-sing":
    case "interval-harmonic-id":
      return "Intervals"
    case "scale-degree-sing":
      return "Scale degrees"
    case "chord-sing":
    case "chord-quality-id":
    case "chord-inversion-id":
      return "Chords"
  }
}

function defaultPathNodeLabels(step: CurriculumLesson): PathNodeLabels {
  const title = familyTitle(step.practiceModeId)
  const pool = TIER_POOL_LABEL[step.contentTierId]

  if (step.practiceModeId === "single-note") {
    return { title, subtitle: "Sing back one note" }
  }

  if (
    step.practiceModeId === "interval-melodic-sing" ||
    step.practiceModeId === "interval-named-sing" ||
    step.practiceModeId === "interval-melodic-id" ||
    step.practiceModeId === "interval-harmonic-sing" ||
    step.practiceModeId === "interval-harmonic-id"
  ) {
    const mode = INTERVAL_MODE_LABEL[step.practiceModeId]
    return {
      title,
      subtitle: pool ? `${mode} · ${pool}` : mode,
    }
  }

  if (step.practiceModeId === "scale-degree-sing") {
    return {
      title,
      subtitle: pool ? `Melodic reproduction · ${pool}` : "Melodic reproduction",
    }
  }

  if (step.practiceModeId === "chord-sing" && isChordContentTierId(step.contentTierId)) {
    return {
      title,
      subtitle: `${getChordLessonBannerLabel(step.contentTierId)} · ${pool ?? "any voice"}`,
    }
  }

  if (
    step.practiceModeId === "chord-quality-id" &&
    isChordQualityIdContentTierId(step.contentTierId)
  ) {
    return {
      title,
      subtitle: getChordQualityIdExerciseSubtitle(step.contentTierId),
    }
  }

  if (
    step.practiceModeId === "chord-inversion-id" &&
    isChordInversionIdContentTierId(step.contentTierId)
  ) {
    return {
      title,
      subtitle: getChordInversionIdExerciseSubtitle(step.contentTierId),
    }
  }

  return {
    title,
    subtitle: pool ?? "Sing a chord voice",
  }
}

export function getPathNodeLabels(step: CurriculumLesson): PathNodeLabels {
  return STEP_LABEL_OVERRIDES[curriculumLessonKey(step)] ?? defaultPathNodeLabels(step)
}

export function getPathNodeState(
  step: CurriculumLesson,
  records: readonly AttemptRecord[],
): PathNodeState {
  if (!isCurriculumLessonUnlocked(step, records)) {
    return "locked"
  }
  const current = getContinueCurriculumLesson(records)
  if (current && curriculumLessonKey(current) === curriculumLessonKey(step)) {
    return "current"
  }
  return "passed"
}

export function isGuidedPathComplete(records: readonly AttemptRecord[]): boolean {
  return CURRICULUM_LESSONS.every((step) => meetsCurriculumLessonThreshold(step, records))
}

/** First locked step after the current node, or after the last passed step when none is current. */
export function getNextLockedPathNode(records: readonly AttemptRecord[]): CurriculumLesson | null {
  const current = getContinueCurriculumLesson(records)
  let startIndex: number
  if (current) {
    startIndex = getCurriculumLessonIndex(current) + 1
  } else {
    let lastPassed = -1
    for (let i = 0; i < CURRICULUM_LESSONS.length; i++) {
      const step = CURRICULUM_LESSONS[i]
      if (step === undefined) {
        break
      }
      if (meetsCurriculumLessonThreshold(step, records)) {
        lastPassed = i
      } else {
        break
      }
    }
    startIndex = lastPassed + 1
  }

  if (startIndex >= CURRICULUM_LESSONS.length) {
    return null
  }

  const step = CURRICULUM_LESSONS[startIndex]
  if (step === undefined) {
    return null
  }
  return isCurriculumLessonUnlocked(step, records) ? null : step
}

export function formatPathNodeStatus(
  step: CurriculumLesson,
  records: readonly AttemptRecord[],
): string {
  const state = getPathNodeState(step, records)
  if (state === "passed") {
    return "Complete"
  }
  if (state === "current") {
    const { lessonExerciseCount, lessonExercisePassRatePercent } = computeCurriculumLessonProgress(
      step,
      records,
    )
    return `${lessonExerciseCount} / ${MIN_EXERCISES_FOR_UNLOCK} exercises · ${lessonExercisePassRatePercent}% pass (need ${MIN_EXERCISE_PASS_RATE}%)`
  }

  const nextLocked = getNextLockedPathNode(records)
  if (nextLocked && curriculumLessonKey(nextLocked) === curriculumLessonKey(step)) {
    const requirement = getUnlockRequirementForCurriculumLesson(step)
    if (requirement) {
      return `Locked · complete ${requirement.predecessorLabel} first`
    }
  }
  return "Locked"
}

export function formatPathNodeHref(step: CurriculumLesson): string {
  const route = getPracticeMode(step.practiceModeId).route
  return formatLessonLinkUrl(route, step)
}
