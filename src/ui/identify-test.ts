import { createStore } from "solid-js/store";
import { render } from "solid-js/web";
import { createDefaultAudioPort } from "../audio/port.ts";
import { createDefaultHistoryPort } from "../history/port.ts";
import {
  MAX_ATTEMPTS_PER_EXERCISE,
  EXERCISES_PER_LESSON,
} from "../config.ts";
import { buildAttemptRecord } from "../history/serialize.ts";
import {
  buildIntervalChoices,
  type IntervalChoice,
} from "../interval-exercises.ts";
import { LessonRun } from "../lesson-run.ts";
import { percentOf, summarizeLesson } from "../lesson.ts";
import type { LessonExercise } from "../lesson-exercise.ts";
import {
  getVoiceType,
  setVoiceType,
  type VoiceType,
} from "../voice-ranges.ts";
import { voiceRangeHint } from "./components/voice-picker.tsx";
import { IdentifyTestView } from "./identify-test-view.tsx";
import type {
  IdentifyMountDeps,
  IdentifyResultView,
  IdentifyTestConfig,
  IdentifyUiState,
} from "./identify-test-types.ts";

export type {
  IdentifyMountDeps,
  IdentifyResultView,
  IdentifyTestConfig,
  IdentifyUiState,
} from "./identify-test-types.ts";

type TestState =
  | "idle"
  | "playing"
  | "ready"
  | "result"
  | "lessonSummary";

function nextStepButtonLabel(isLastExerciseInLesson: boolean): string {
  return isLastExerciseInLesson ? "Finish lesson" : "Next exercise";
}

function buildAttemptNote(
  passed: boolean,
  triesLeft: number,
  nextLabel: string,
): string | null {
  if (passed) return null;
  if (triesLeft > 0) {
    return `${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left on this exercise.`;
  }
  return `No tries left — tap ${nextLabel} when you are ready.`;
}

export function mountIdentifyTest(
  root: HTMLElement,
  config: IdentifyTestConfig,
  deps?: IdentifyMountDeps,
): void {
  const history = deps?.history ?? createDefaultHistoryPort();
  const audio = deps?.audio ?? createDefaultAudioPort();
  const exercisesPerLesson =
    deps?.exercisesPerLesson ?? EXERCISES_PER_LESSON;

  let state: TestState = "idle";
  let currentExercise: LessonExercise | null = null;
  let currentChoices: IntervalChoice[] = [];
  let pendingSelectedIntervalId: string | undefined;
  let choicesDisabled = false;
  let resultView: IdentifyResultView | null = null;

  const lessonRun = new LessonRun({
    exercisesPerLesson,
    onAttemptScored: (ctx) => {
      if (!currentExercise || pendingSelectedIntervalId === undefined) return;
      const record = buildAttemptRecord(
        {
          practiceModeId: config.practiceModeId,
          lessonId: ctx.lessonId,
          exerciseIndex: ctx.exerciseIndex,
          showVoicePicker: config.showVoicePicker,
          showChordFilters: false,
          showIntervalFilters: false,
          showDegreeFilters: false,
        },
        currentExercise,
        0,
        ctx.passed,
        ctx.attemptNumber,
        pendingSelectedIntervalId,
      );
      void history.saveAttempt(record);
    },
  });

  const [ui, setUi] = createStore<IdentifyUiState>({
    statusText: config.status.idle,
    lessonProgressHidden: false,
    lessonProgressText: "",
    choices: [],
    showChoices: false,
    choicesDisabled: false,
    resultClassName: "result",
    result: null,
    voice: getVoiceType(),
    voiceRangeHint: voiceRangeHint(getVoiceType()),
    settingsLocked: false,
    playHidden: false,
    playDisabled: false,
    retryHidden: true,
    nextHidden: true,
    nextLabel: "Next exercise",
    nextRoundHidden: true,
  });

  function lessonSnapshot() {
    return lessonRun.getSnapshot();
  }

  function syncUi(): void {
    const snap = lessonSnapshot();
    const inLessonSummary = state === "lessonSummary";
    const settingsLocked =
      state === "playing" || state === "result" || inLessonSummary;

    const showResultActions = state === "result";
    const canRetry = showResultActions && snap.canRetry;
    const canNext = showResultActions && snap.canAdvance;
    const nextLabel = nextStepButtonLabel(snap.isLastExerciseInLesson);

    let statusText = config.status.idle;
    let showChoices = false;
    switch (state) {
      case "lessonSummary":
        statusText =
          "Lesson finished — review your score, then start the next lesson.";
        break;
      case "idle":
        statusText = config.status.idle;
        break;
      case "playing":
        statusText = config.status.playing;
        break;
      case "ready":
        statusText = config.status.ready;
        showChoices = true;
        break;
      case "result": {
        const triesLeft = MAX_ATTEMPTS_PER_EXERCISE - snap.scoredAttemptsOnCurrent;
        const onLastQuestion = snap.isLastExerciseInLesson;
        if (resultView?.type === "attempt") {
          statusText = resultView.passed
            ? onLastQuestion
              ? `Correct — tap ${nextLabel} when you are ready.`
              : config.status.pass
            : triesLeft > 0
              ? config.status.fail
              : onLastQuestion
                ? `Out of tries — tap ${nextLabel} to see your lesson score.`
                : (config.status.failExhausted ?? config.status.fail);
        }
        break;
      }
    }

    let lessonProgressHidden = inLessonSummary;
    let lessonProgressText = "";
    if (!lessonProgressHidden) {
      lessonProgressText = `Lesson — exercise ${snap.exerciseNumber} of ${exercisesPerLesson}`;
    }

    let resultClassName = "result";
    if (resultView?.type === "attempt") {
      resultClassName = resultView.passed
        ? "result result-pass"
        : "result result-fail";
    } else if (resultView?.type === "summary") {
      resultClassName = "result round-summary";
    } else if (resultView?.type === "audio-error") {
      resultClassName = "result result-fail";
    }

    const voice = getVoiceType();

    setUi({
      statusText,
      lessonProgressHidden,
      lessonProgressText,
      choices: currentChoices,
      showChoices,
      choicesDisabled,
      resultClassName,
      result: resultView,
      voice,
      voiceRangeHint: voiceRangeHint(voice),
      settingsLocked,
      playHidden: state === "result" || inLessonSummary,
      playDisabled: inLessonSummary || state === "playing",
      retryHidden: !canRetry || inLessonSummary,
      nextHidden: !canNext || inLessonSummary,
      nextLabel: nextLabel,
      nextRoundHidden: !inLessonSummary,
    });
  }

  function setState(next: TestState): void {
    state = next;
    syncUi();
  }

  function resetLesson(): void {
    lessonRun.reset();
    currentExercise = null;
    pendingSelectedIntervalId = undefined;
    currentChoices = [];
    choicesDisabled = false;
    resultView = null;
  }

  function rebuildChoices(): void {
    if (!currentExercise?.intervalId) {
      currentChoices = [];
      return;
    }
    const eligibleIds =
      currentExercise.eligibleTagIds ??
      (currentExercise.intervalId ? [currentExercise.intervalId] : []);
    currentChoices = buildIntervalChoices(
      currentExercise.intervalId,
      eligibleIds,
    );
  }

  function showAttemptResult(passed: boolean, selectedLabel: string): void {
    const snap = lessonSnapshot();
    const triesLeft = MAX_ATTEMPTS_PER_EXERCISE - snap.scoredAttemptsOnCurrent;
    const nextLabel = nextStepButtonLabel(snap.isLastExerciseInLesson);
    resultView = {
      type: "attempt",
      passed,
      selectedLabel,
      attemptNote: buildAttemptNote(passed, triesLeft, nextLabel),
    };
    setState("result");
  }

  function showLessonSummary(): void {
    const summary = summarizeLesson(lessonSnapshot().results);
    resultView = {
      type: "summary",
      summary,
      correctPct: percentOf(summary.correctCount, summary.total),
      firstTryPct: percentOf(summary.firstTryCount, summary.total),
      retryPct: percentOf(summary.retryCount, summary.total),
      wrongPct: percentOf(summary.wrongCount, summary.total),
    };
    setState("lessonSummary");
  }

  async function handleChoice(selectedId: string): Promise<void> {
    if (state !== "ready" || !currentExercise?.intervalId) return;

    choicesDisabled = true;
    syncUi();

    const passed = selectedId === currentExercise.intervalId;
    const label =
      currentChoices.find((c) => c.id === selectedId)?.label ?? selectedId;
    pendingSelectedIntervalId = selectedId;
    lessonRun.recordScore(passed);
    showAttemptResult(passed, label);
  }

  async function handlePlay(): Promise<void> {
    if (audio.isPlaying()) return;

    try {
      await audio.ensureReady();
      if (state === "idle" || !currentExercise) {
        currentExercise = config.prepareExercise();
        lessonRun.ensureCurrentExercise();
      }
      choicesDisabled = false;
      setState("playing");
      await config.playReference(currentExercise);
      rebuildChoices();
      setState("ready");
    } catch {
      resultView = { type: "audio-error" };
      choicesDisabled = false;
      setState("idle");
      syncUi();
    }
  }

  function handleRetry(): void {
    lessonRun.retryCurrentExercise();
    resultView = null;
    choicesDisabled = false;
    void handlePlay();
  }

  function handleNextQuestion(): void {
    lessonRun.advanceAfterResult(currentExercise ?? undefined);
    if (lessonSnapshot().isLessonComplete) {
      showLessonSummary();
      return;
    }
    currentExercise = null;
    currentChoices = [];
    resultView = null;
    choicesDisabled = false;
    setState("idle");
    void handlePlay();
  }

  function handleNextRound(): void {
    resetLesson();
    setState("idle");
  }

  function handleVoiceChange(voice: VoiceType): void {
    if (!config.showVoicePicker || voice === getVoiceType()) return;
    setVoiceType(voice);
    resetLesson();
    setState("idle");
  }

  render(
    () =>
      IdentifyTestView({
        ui,
        title: config.title,
        subtitle: config.subtitle,
        playButtonLabel: config.playButtonLabel,
        showVoicePicker: config.showVoicePicker,
        onPlay: () => {
          audio.unlock();
          void handlePlay();
        },
        onRetry: handleRetry,
        onNext: handleNextQuestion,
        onNextRound: handleNextRound,
        onVoiceChange: handleVoiceChange,
        onChoice: (choiceId) => {
          void handleChoice(choiceId);
        },
      }),
    root,
  );

  syncUi();
}
