import {
  getChordInversionIdExerciseSubtitle,
  getChordQualityIdExerciseSubtitle,
  isChordInversionIdContentTierId,
  isChordQualityIdContentTierId,
} from "../curriculum/chord-tiers.ts"
import type { ExerciseDefinition } from "../exercise-definition.ts"
import { isSingExerciseDefinition } from "../exercise-definition.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import { getPracticeMode } from "../practice-modes/registry.ts"
import { chordInversionIdExerciseDefinition } from "../ui/chord-inversion-id-tests.ts"
import { chordQualityIdExerciseDefinition } from "../ui/chord-quality-id-tests.ts"
import {
  intervalHarmonicIdExerciseDefinition,
  intervalHarmonicSingExerciseDefinition,
  intervalMelodicIdExerciseDefinition,
  intervalMelodicSingExerciseDefinition,
  intervalNamedSingExerciseDefinition,
} from "../ui/interval-tests.ts"
import { scaleDegreeSingExerciseDefinition } from "../ui/scale-degree-tests.ts"
import { chordSingExerciseDefinition } from "../ui/tests.ts"
import { getCurriculumLessonBanner } from "./targeted-practice-banner.ts"
import type { PreparedTargetedPracticeExercise } from "./targeted-practice-exercise.ts"
import type { TargetedPracticeSlot } from "./targeted-practice-planner.ts"

const BASE_DEFINITIONS: Record<
  TargetedPracticeSlot["practiceModeId"],
  ExerciseDefinition | undefined
> = {
  "single-note": undefined,
  "chord-sing": chordSingExerciseDefinition,
  "chord-quality-id": chordQualityIdExerciseDefinition,
  "chord-inversion-id": chordInversionIdExerciseDefinition,
  "interval-melodic-sing": intervalMelodicSingExerciseDefinition,
  "interval-named-sing": intervalNamedSingExerciseDefinition,
  "interval-harmonic-sing": intervalHarmonicSingExerciseDefinition,
  "interval-melodic-id": intervalMelodicIdExerciseDefinition,
  "interval-harmonic-id": intervalHarmonicIdExerciseDefinition,
  "scale-degree-sing": scaleDegreeSingExerciseDefinition,
}

function subtitleForSlot(slot: TargetedPracticeSlot): string {
  const entry = getPracticeMode(slot.practiceModeId)
  if (slot.practiceModeId === "chord-quality-id") {
    const tierId = slot.curriculumLesson.contentTierId
    if (isChordQualityIdContentTierId(tierId)) {
      return getChordQualityIdExerciseSubtitle(tierId)
    }
  }
  if (slot.practiceModeId === "chord-inversion-id") {
    const tierId = slot.curriculumLesson.contentTierId
    if (isChordInversionIdContentTierId(tierId)) {
      return getChordInversionIdExerciseSubtitle(tierId)
    }
  }
  return entry.subtitle
}

export function buildTargetedPracticeSlotDefinition(
  slot: TargetedPracticeSlot,
  prepareExercise: () => LessonExercise,
  onLessonReset?: () => void,
): ExerciseDefinition {
  const base = BASE_DEFINITIONS[slot.practiceModeId]
  if (!base) {
    throw new Error(`Unsupported targeted practice mode: ${slot.practiceModeId}`)
  }
  const lessonBanner = getCurriculumLessonBanner(slot.curriculumLesson)
  if (isSingExerciseDefinition(base)) {
    return {
      ...base,
      subtitle: subtitleForSlot(slot),
      lessonBanner,
      prepareExercise,
      onLessonReset,
    }
  }
  return {
    ...base,
    subtitle: subtitleForSlot(slot),
    lessonBanner,
    prepareExercise,
    onLessonReset,
  }
}

export function applyPreparedExerciseContext(
  context: {
    lessonTonicMidi: number | null
    lastScaleDegreeStepKey: string | null
  },
  prepared: PreparedTargetedPracticeExercise,
): void {
  context.lessonTonicMidi = prepared.lessonTonicMidi
  context.lastScaleDegreeStepKey = prepared.lastScaleDegreeStepKey
}
