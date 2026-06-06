import { Show } from "solid-js"
import type { LessonSummary } from "../lesson.ts"
import type { VoiceType } from "../voice-ranges.ts"
import {
  ExerciseActionBar,
  ExerciseHeader,
  ExerciseHint,
  ExerciseNav,
} from "./components/exercise-chrome.tsx"
import { VoicePicker } from "./components/voice-picker.tsx"
import type { SingResultView, SingUiState } from "./sing-test-types.ts"

function SingAttemptResult(props: {
  passed: boolean
  message: string
  detectedHz: number
  targetHz: number
  targetName: string
  attemptNote: string | null
}) {
  return (
    <>
      <p class="result-verdict">{props.passed ? "Correct" : "Not quite"}</p>
      <p class="result-detail">{props.message}</p>
      <p class="result-meta">
        Detected {props.detectedHz.toFixed(1)} Hz (target {props.targetHz.toFixed(1)} Hz —{" "}
        {props.targetName})
      </p>
      {props.attemptNote ? <p class="result-attempts">{props.attemptNote}</p> : null}
    </>
  )
}

function SingLessonSummaryResult(props: {
  summary: LessonSummary
  correctPct: number
  firstTryPct: number
  retryPct: number
  wrongPct: number
}) {
  return (
    <>
      <p class="result-verdict">Lesson complete</p>
      <p class="lesson-summary-score">
        <span class="lesson-summary-score-value">
          {props.summary.correctCount}/{props.summary.total}
        </span>{" "}
        correct ({props.correctPct}%)
      </p>
      <ul class="lesson-summary-breakdown">
        <li>
          <span class="lesson-summary-label">First try</span> {props.summary.firstTryCount} (
          {props.firstTryPct}%)
        </li>
        <li>
          <span class="lesson-summary-label">After retry</span> {props.summary.retryCount} (
          {props.retryPct}%)
        </li>
        <li>
          <span class="lesson-summary-label">Wrong</span> {props.summary.wrongCount} (
          {props.wrongPct}%)
        </li>
      </ul>
    </>
  )
}

function SingScoringErrorResult(props: { detail: string }) {
  return (
    <>
      <p class="result-verdict">Could not score</p>
      <p class="result-detail">{props.detail}</p>
    </>
  )
}

function SingAudioErrorResult() {
  return (
    <>
      <p class="result-verdict">Could not play audio</p>
      <p class="result-detail">Tap Play again after interacting with the page.</p>
    </>
  )
}

function SingResultContent(props: { result: SingResultView }) {
  if (props.result.type === "attempt") {
    return (
      <SingAttemptResult
        passed={props.result.passed}
        message={props.result.message}
        detectedHz={props.result.detectedHz}
        targetHz={props.result.targetHz}
        targetName={props.result.targetName}
        attemptNote={props.result.attemptNote}
      />
    )
  }
  if (props.result.type === "summary") {
    return (
      <SingLessonSummaryResult
        summary={props.result.summary}
        correctPct={props.result.correctPct}
        firstTryPct={props.result.firstTryPct}
        retryPct={props.result.retryPct}
        wrongPct={props.result.wrongPct}
      />
    )
  }
  if (props.result.type === "scoring-error") {
    return <SingScoringErrorResult detail={props.result.detail} />
  }
  return <SingAudioErrorResult />
}

function SingResultPanel(props: { ui: SingUiState }) {
  return (
    <Show when={props.ui.result} keyed>
      {(result) => (
        <div class={props.ui.resultClassName}>
          <SingResultContent result={result} />
        </div>
      )}
    </Show>
  )
}

export function SingTestView(props: {
  ui: SingUiState
  title: string
  subtitle: string
  lessonBanner?: string
  playButtonLabel: string
  showVoicePicker: boolean
  onPlay: () => void
  onRecord: () => void
  onRetry: () => void
  onNext: () => void
  onNextLesson: () => void
  onVoiceChange: (voice: VoiceType) => void
}) {
  return (
    <main class="app">
      <ExerciseNav />
      <ExerciseHeader
        title={props.title}
        subtitle={props.subtitle}
        lessonBanner={props.lessonBanner}
        lessonProgress={props.ui.chrome.lessonProgress}
      />
      {props.showVoicePicker ? (
        <VoicePicker
          selectedVoice={props.ui.voice}
          rangeHint={props.ui.voiceRangeHint}
          disabled={props.ui.settingsLocked}
          onVoiceChange={props.onVoiceChange}
        />
      ) : null}
      <section class="card" aria-live="polite">
        <p class="status">{props.ui.statusText}</p>
        {props.ui.showQuestionPrompt ? (
          <p class="question-prompt">{props.ui.questionPrompt}</p>
        ) : null}
        {props.ui.showLivePitch ? <p class="live-pitch">{props.ui.livePitchText}</p> : null}
        <SingResultPanel ui={props.ui} />
      </section>
      <ExerciseActionBar
        actionBar={props.ui.chrome.actionBar}
        playButtonLabel={props.playButtonLabel}
        onRecord={props.onRecord}
        onPlay={props.onPlay}
        onRetry={props.onRetry}
        onNext={props.onNext}
        onNextLesson={props.onNextLesson}
      />
      <ExerciseHint>
        Use headphones if you can. Allow microphone access when prompted. Works on HTTPS or
        localhost.
      </ExerciseHint>
    </main>
  )
}
