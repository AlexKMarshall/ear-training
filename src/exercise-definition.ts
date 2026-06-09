import type { ExerciseChoice } from "./chord-identify-choices.ts"
import type { ExerciseScreenStatusCopy, ScoreAnswerResult } from "./exercise-screen-state.ts"
import type { PracticeModeId } from "./history/types.ts"
import type { LessonExercise } from "./lesson-exercise.ts"

export interface ExerciseDefinitionShared {
  practiceModeId: PracticeModeId
  title: string
  subtitle: string
  showVoicePicker: boolean
  showIntervalFilters?: boolean
  showDegreeFilters?: boolean
  lessonBanner?: string
  status: ExerciseScreenStatusCopy
  prepareExercise: () => LessonExercise
  playReference: (exercise: LessonExercise) => Promise<void>
  onLessonReset?: () => void
}

export interface SingExerciseDefinition extends ExerciseDefinitionShared {
  responseMode: "sing"
  playButtonLabel: string
  exercisePrompt?: (exercise: LessonExercise) => string
  exercisePromptFromDraw?: boolean
  scoreAnswer: (
    exercise: LessonExercise,
    samplesHz: number[],
  ) => ScoreAnswerResult | Promise<ScoreAnswerResult>
}

export interface SelectExerciseDefinition extends ExerciseDefinitionShared {
  responseMode: "select"
  playButtonLabel: string
  buildChoices: (exercise: LessonExercise) => ExerciseChoice[]
  correctChoiceId: (exercise: LessonExercise) => string
  scoreAnswer: (exercise: LessonExercise, selectedId: string) => ScoreAnswerResult
  failRetryDetail?: string
}

export type ExerciseDefinition = SingExerciseDefinition | SelectExerciseDefinition

export function isSingExerciseDefinition(
  definition: ExerciseDefinition,
): definition is SingExerciseDefinition {
  return definition.responseMode === "sing"
}

export function isSelectExerciseDefinition(
  definition: ExerciseDefinition,
): definition is SelectExerciseDefinition {
  return definition.responseMode === "select"
}

export function selectScoreFromChoice(
  definition: Pick<SelectExerciseDefinition, "buildChoices" | "correctChoiceId">,
): SelectExerciseDefinition["scoreAnswer"] {
  return (exercise, selectedId) => {
    const passed = selectedId === definition.correctChoiceId(exercise)
    const label =
      definition.buildChoices(exercise).find((c) => c.id === selectedId)?.label ??
      String(selectedId)
    return {
      kind: "scored",
      passed,
      scorePayload: { selectedId },
      attemptDetail: { selectedLabel: label },
    }
  }
}
