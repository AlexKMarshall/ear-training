import { Show } from "solid-js"
import type { ExerciseChoice } from "../chord-identify-choices.ts"
import type { VoiceType } from "../voice-ranges.ts"
import {
  ExerciseActionBar,
  ExerciseHeader,
  ExerciseHint,
  ExerciseNav,
} from "./components/exercise-chrome.tsx"
import { VoicePicker } from "./components/voice-picker.tsx"
import type { IdentifyResultView, IdentifyUiState } from "./identify-test-types.ts"
import { LessonSummaryResult } from "./lesson-summary-result.tsx"

function ChoiceGrid(props: {
  choices: ExerciseChoice[]
  disabled: boolean
  onChoice: (choiceId: string) => void
}) {
  return (
    <div class="choice-grid">
      {props.choices.map((choice) => (
        <button
          type="button"
          class="btn choice-btn"
          disabled={props.disabled}
          onClick={() => props.onChoice(choice.id)}
        >
          {choice.label}
        </button>
      ))}
    </div>
  )
}

function IdentifyAttemptResult(props: {
  passed: boolean
  selectedLabel: string
  attemptNote: string | null
  failRetryDetail: string
}) {
  return (
    <>
      <p class="result-verdict">{props.passed ? "Correct" : "Not quite"}</p>
      <p class="result-detail">
        {props.passed ? `You chose ${props.selectedLabel}.` : props.failRetryDetail}
      </p>
      {props.attemptNote ? <p class="result-attempts">{props.attemptNote}</p> : null}
    </>
  )
}

function IdentifyAudioErrorResult() {
  return (
    <>
      <p class="result-verdict">Could not play audio</p>
      <p class="result-detail">Tap Play again after interacting with the page.</p>
    </>
  )
}

function IdentifyResultContent(props: { result: IdentifyResultView }) {
  if (props.result.type === "attempt") {
    return (
      <IdentifyAttemptResult
        passed={props.result.passed}
        selectedLabel={props.result.selectedLabel}
        attemptNote={props.result.attemptNote}
        failRetryDetail={props.result.failRetryDetail}
      />
    )
  }
  if (props.result.type === "summary") {
    return (
      <LessonSummaryResult
        summary={props.result.summary}
        correctPct={props.result.correctPct}
        firstTryPct={props.result.firstTryPct}
        retryPct={props.result.retryPct}
        wrongPct={props.result.wrongPct}
      />
    )
  }
  return <IdentifyAudioErrorResult />
}

function IdentifyResultPanel(props: { ui: IdentifyUiState }) {
  return (
    <Show when={props.ui.result} keyed>
      {(result) => (
        <div class={props.ui.resultClassName}>
          <IdentifyResultContent result={result} />
        </div>
      )}
    </Show>
  )
}

export function IdentifyTestView(props: {
  ui: IdentifyUiState
  title: string
  subtitle: string
  lessonBanner?: string
  playButtonLabel: string
  showVoicePicker: boolean
  onPlay: () => void
  onRetry: () => void
  onNext: () => void
  onNextLesson: () => void
  onVoiceChange: (voice: VoiceType) => void
  onChoice: (choiceId: string) => void
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
        {props.ui.showChoices ? (
          <ChoiceGrid
            choices={props.ui.choices}
            disabled={props.ui.choicesDisabled}
            onChoice={props.onChoice}
          />
        ) : null}
        <IdentifyResultPanel ui={props.ui} />
      </section>
      <ExerciseActionBar
        actionBar={props.ui.chrome.actionBar}
        playButtonLabel={props.playButtonLabel}
        onPlay={props.onPlay}
        onRetry={props.onRetry}
        onNext={props.onNext}
        onNextLesson={props.onNextLesson}
      />
      <ExerciseHint>
        Use headphones if you can. Tap Play to hear the reference (no microphone needed).
      </ExerciseHint>
    </main>
  )
}
