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

/** Select branch ships in #204; included so the union is stable for registry typing. */
export interface SelectExerciseDefinition extends ExerciseDefinitionShared {
  responseMode: "select"
}

export type ExerciseDefinition = SingExerciseDefinition | SelectExerciseDefinition

export function isSingExerciseDefinition(
  definition: ExerciseDefinition,
): definition is SingExerciseDefinition {
  return definition.responseMode === "sing"
}
