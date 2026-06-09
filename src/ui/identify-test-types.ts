import type { AudioPort } from "../audio/port.ts"
import type { ExerciseChoice } from "../chord-identify-choices.ts"
import type { ExerciseChromeSnapshot } from "../exercise-screen-state.ts"
import type { HistoryPort } from "../history/port.ts"
import type { LessonSummary } from "../lesson.ts"
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

export interface IdentifyMountDeps {
  history?: HistoryPort
  audio?: AudioPort
  /** Override lesson length (browser tests); production uses default from config. */
  exercisesPerLesson?: number
}
