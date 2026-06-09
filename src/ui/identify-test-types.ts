import type { AudioPort } from "../audio/port.ts"
import type { ExerciseChoice } from "../chord-identify-choices.ts"
import type { ExerciseChromeSnapshot } from "../exercise-screen-state.ts"
import type { HistoryPort } from "../history/port.ts"
import type { PracticeModeId } from "../history/types.ts"
import type { LessonSummary } from "../lesson.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import type { VoiceType } from "../voice-ranges.ts"

export type IdentifyResultView =
  | {
      type: "attempt"
      passed: boolean
      selectedLabel: string
      attemptNote: string | null
      failRetryDetail: string
    }
  | {
      type: "summary"
      summary: LessonSummary
      correctPct: number
      firstTryPct: number
      retryPct: number
      wrongPct: number
    }
  | { type: "audio-error" }

export interface IdentifyUiState {
  statusText: string
  chrome: ExerciseChromeSnapshot
  choices: ExerciseChoice[]
  showChoices: boolean
  choicesDisabled: boolean
  resultClassName: string
  result: IdentifyResultView | null
  voice: VoiceType
  voiceRangeHint: string
  settingsLocked: boolean
}

export interface IdentifyTestConfig {
  practiceModeId: PracticeModeId
  title: string
  subtitle: string
  playButtonLabel: string
  showVoicePicker: boolean
  status: {
    idle: string
    playing: string
    ready: string
    pass: string
    fail: string
    failExhausted?: string
  }
  prepareExercise: () => LessonExercise
  playReference: (exercise: LessonExercise) => Promise<void>
  /** Build or refresh multiple-choice options after playback. */
  buildChoices: (exercise: LessonExercise) => ExerciseChoice[]
  /** Answer id to compare against the learner's selection. */
  correctChoiceId: (exercise: LessonExercise) => string
  lessonBanner?: string
  failRetryDetail?: string
}

export interface IdentifyMountDeps {
  history?: HistoryPort
  audio?: AudioPort
  /** Override lesson length (browser tests); production uses default from config. */
  exercisesPerLesson?: number
}
