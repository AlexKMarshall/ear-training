import { Show } from "solid-js";
import type { IntervalChoice } from "../interval-exercises.ts";
import type { IdentifyResultView } from "./identify-test-types.ts";
import type { LessonSummary } from "../lesson.ts";
import type { VoiceType } from "../voice-ranges.ts";
import {
  ExerciseActionBar,
  ExerciseHeader,
  ExerciseHint,
  ExerciseNav,
} from "./components/exercise-chrome.tsx";
import { VoicePicker } from "./components/voice-picker.tsx";
import type { IdentifyUiState } from "./identify-test-types.ts";

function ChoiceGrid(props: {
  choices: IntervalChoice[];
  disabled: boolean;
  onChoice: (choiceId: string) => void;
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
  );
}

function IdentifyAttemptResult(props: {
  passed: boolean;
  selectedLabel: string;
  attemptNote: string | null;
}) {
  return (
    <>
      <p class="result-verdict">{props.passed ? "Correct" : "Not quite"}</p>
      <p class="result-detail">
        {props.passed
          ? `You chose ${props.selectedLabel}.`
          : "That wasn't right — tap Try again to hear the interval and pick again."}
      </p>
      {props.attemptNote ? (
        <p class="result-attempts">{props.attemptNote}</p>
      ) : null}
    </>
  );
}

function IdentifyLessonSummaryResult(props: {
  summary: LessonSummary;
  correctPct: number;
  firstTryPct: number;
  retryPct: number;
  wrongPct: number;
}) {
  return (
    <>
      <p class="result-verdict">Round complete</p>
      <p class="round-summary-score">
        <span class="round-summary-score-value">
          {props.summary.correctCount}/{props.summary.total}
        </span>{" "}
        correct ({props.correctPct}%)
      </p>
      <ul class="round-summary-breakdown">
        <li>
          <span class="round-summary-label">First try</span>{" "}
          {props.summary.firstTryCount} ({props.firstTryPct}%)
        </li>
        <li>
          <span class="round-summary-label">After retry</span>{" "}
          {props.summary.retryCount} ({props.retryPct}%)
        </li>
        <li>
          <span class="round-summary-label">Wrong</span> {props.summary.wrongCount}{" "}
          ({props.wrongPct}%)
        </li>
      </ul>
    </>
  );
}

function IdentifyAudioErrorResult() {
  return (
    <>
      <p class="result-verdict">Could not play audio</p>
      <p class="result-detail">
        Tap Play again after interacting with the page.
      </p>
    </>
  );
}

function IdentifyResultContent(props: { result: IdentifyResultView }) {
  if (props.result.type === "attempt") {
    return (
      <IdentifyAttemptResult
        passed={props.result.passed}
        selectedLabel={props.result.selectedLabel}
        attemptNote={props.result.attemptNote}
      />
    );
  }
  if (props.result.type === "summary") {
    return (
      <IdentifyLessonSummaryResult
        summary={props.result.summary}
        correctPct={props.result.correctPct}
        firstTryPct={props.result.firstTryPct}
        retryPct={props.result.retryPct}
        wrongPct={props.result.wrongPct}
      />
    );
  }
  return <IdentifyAudioErrorResult />;
}

function IdentifyResultPanel(props: { ui: IdentifyUiState }) {
  return (
    <Show when={props.ui.result}>
      {(result) => (
        <div class={props.ui.resultClassName}>
          <IdentifyResultContent result={result()} />
        </div>
      )}
    </Show>
  );
}

export function IdentifyTestView(props: {
  ui: IdentifyUiState;
  title: string;
  subtitle: string;
  playButtonLabel: string;
  showVoicePicker: boolean;
  onPlay: () => void;
  onRetry: () => void;
  onNext: () => void;
  onNextRound: () => void;
  onVoiceChange: (voice: VoiceType) => void;
  onChoice: (choiceId: string) => void;
}) {
  return (
    <main class="app">
      <ExerciseNav />
      <ExerciseHeader
        title={props.title}
        subtitle={props.subtitle}
        lessonProgressHidden={props.ui.lessonProgressHidden}
        lessonProgressText={props.ui.lessonProgressText}
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
        playLabel={props.playButtonLabel}
        playHidden={props.ui.playHidden}
        playDisabled={props.ui.playDisabled}
        retryHidden={props.ui.retryHidden}
        nextHidden={props.ui.nextHidden}
        nextLabel={props.ui.nextLabel}
        nextRoundHidden={props.ui.nextRoundHidden}
        onPlay={props.onPlay}
        onRetry={props.onRetry}
        onNext={props.onNext}
        onNextRound={props.onNextRound}
      />
      <ExerciseHint>
        Use headphones if you can. Tap Play to hear the reference (no microphone
        needed).
      </ExerciseHint>
    </main>
  );
}
