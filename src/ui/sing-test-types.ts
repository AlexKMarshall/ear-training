import type { AudioPort } from "../audio/port.ts"
import type { RecordingPort } from "../audio/recording-port.ts"
import type { ExerciseChromeSnapshot } from "../exercise-screen-state.ts"
import type { HistoryPort } from "../history/port.ts"
import type { LessonSummary } from "../lesson.ts"
import type { VoiceType } from "../voice-ranges.ts"

export type SingResultView =
  | {
      type: "attempt"
      passed: boolean
      message: string
      detectedHz: number
      targetHz: number
      targetName: string
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
  | { type: "scoring-error"; detail: string }
  | { type: "audio-error" }

export interface SingUiState {
  statusText: string
  chrome: ExerciseChromeSnapshot
  questionPrompt: string
  showQuestionPrompt: boolean
  livePitchText: string
  showLivePitch: boolean
  resultClassName: string
  result: SingResultView | null
  voice: VoiceType
  voiceRangeHint: string
  settingsLocked: boolean
}

export interface SingMountDeps {
  history?: HistoryPort
  audio?: AudioPort
  recording?: RecordingPort
  /** Override lesson length (browser tests); production uses default from config. */
  exercisesPerLesson?: number
}
