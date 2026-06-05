import type { AudioPort } from "../audio/port.ts"
import type { HistoryPort } from "../history/port.ts"
import type { PracticeModeId } from "../history/types.ts"
import type { IntervalChoice } from "../interval-exercises.ts"
import type { LessonSummary } from "../lesson.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import type { VoiceType } from "../voice-ranges.ts"

export type IdentifyResultView =
  | {
      type: "attempt"
      passed: boolean
      selectedLabel: string
      attemptNote: string | null
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
  lessonProgressHidden: boolean
  lessonProgressText: string
  choices: IntervalChoice[]
  showChoices: boolean
  choicesDisabled: boolean
  resultClassName: string
  result: IdentifyResultView | null
  voice: VoiceType
  voiceRangeHint: string
  settingsLocked: boolean
  playHidden: boolean
  playDisabled: boolean
  retryHidden: boolean
  nextHidden: boolean
  nextLabel: string
  nextLessonHidden: boolean
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
}

export interface IdentifyMountDeps {
  history?: HistoryPort
  audio?: AudioPort
  /** Override lesson length (browser tests); production uses default from config. */
  exercisesPerLesson?: number
}
