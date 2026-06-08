import type { AudioPort } from "../audio/port.ts"
import type { RecordingPort } from "../audio/recording-port.ts"
import type { ExerciseChromeSnapshot } from "../exercise-screen-state.ts"
import type { HistoryPort } from "../history/port.ts"
import type { PracticeModeId } from "../history/types.ts"
import type { LessonSummary } from "../lesson.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
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

export interface SingTestConfig {
  practiceModeId: PracticeModeId
  title: string
  subtitle: string
  playButtonLabel: string
  showVoicePicker: boolean
  /** Persistent banner for lesson context (e.g. key quality on scale-degree sing). */
  lessonBanner?: string
  exercisePrompt?: (exercise: LessonExercise) => string
  /** When true, show {@link exercisePrompt} from draw through recording (not only in ready). */
  exercisePromptFromDraw?: boolean
  status: {
    idle: string
    playing: string
    ready: string
    recording: string
    pass: string
    fail: string
    failExhausted?: string
  }
  prepareExercise: () => LessonExercise
  playReference: (exercise: LessonExercise) => Promise<void>
  /** Called when a lesson is cleared (new lesson run, preference change, voice change). */
  onLessonReset?: () => void
}

export interface SingMountDeps {
  history?: HistoryPort
  audio?: AudioPort
  recording?: RecordingPort
  /** Override lesson length (browser tests); production uses default from config. */
  exercisesPerLesson?: number
}
