import {
  getChordInversionIdLessonBannerLabel,
  getChordLessonBannerLabel,
  getChordQualityIdLessonBannerLabel,
  isChordContentTierId,
  isChordInversionIdContentTierId,
  isChordQualityIdContentTierId,
} from "../curriculum/chord-tiers.ts"
import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts"
import { getScaleDegreeKeyQualityLabel } from "../curriculum/scale-degree-tiers.ts"
import { formatTargetedPracticeSubtitle } from "./targeted-practice-home-card.ts"

const INTERVAL_TIER_BANNER: Record<"interval-2a" | "interval-2b", string> = {
  "interval-2a": "perfect 4th, 5th, octave",
  "interval-2b": "diatonic intervals within one octave",
}

export function formatTargetedPracticeContextBanner(
  family: string,
  focusTagLabels: readonly string[],
): string {
  return `Targeted practice · ${formatTargetedPracticeSubtitle(family, focusTagLabels)}`
}

export function getCurriculumLessonBanner(step: CurriculumLesson): string | undefined {
  if (step.contentTierId === "interval-2a" || step.contentTierId === "interval-2b") {
    return INTERVAL_TIER_BANNER[step.contentTierId]
  }
  if (step.practiceModeId === "scale-degree-sing") {
    return getScaleDegreeKeyQualityLabel(step.contentTierId) ?? undefined
  }
  if (step.practiceModeId === "chord-sing" && isChordContentTierId(step.contentTierId)) {
    return getChordLessonBannerLabel(step.contentTierId)
  }
  if (
    step.practiceModeId === "chord-quality-id" &&
    isChordQualityIdContentTierId(step.contentTierId)
  ) {
    return getChordQualityIdLessonBannerLabel(step.contentTierId)
  }
  if (
    step.practiceModeId === "chord-inversion-id" &&
    isChordInversionIdContentTierId(step.contentTierId)
  ) {
    return getChordInversionIdLessonBannerLabel(step.contentTierId)
  }
  return undefined
}
