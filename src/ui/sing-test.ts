import { createStore } from "solid-js/store";
import { render } from "solid-js/web";
import { createDefaultAudioPort } from "../audio/port.ts";
import { createDefaultRecordingPort } from "../audio/recording-port.ts";
import {
  MAX_ATTEMPTS_PER_EXERCISE,
  MIN_VALID_SAMPLES,
  EXERCISES_PER_LESSON,
} from "../config.ts";
import { LessonRun } from "../lesson-run.ts";
import { percentOf, summarizeLesson } from "../lesson.ts";
import type { LessonExercise } from "../lesson-exercise.ts";
import { getScaleDegreeById } from "../scale-degree-config.ts";
import { createDefaultHistoryPort } from "../history/port.ts";
import { buildAttemptRecord } from "../history/serialize.ts";
import { scoreFromSamples } from "../pitch/score.ts";
import type { ScoreResult } from "../pitch/score.ts";
import {
  getVoiceType,
  setVoiceType,
  type VoiceType,
} from "../voice-ranges.ts";
import { voiceRangeHint } from "./components/voice-picker.tsx";
import { SingTestView } from "./sing-test-view.tsx";
import type {
  SingMountDeps,
  SingResultView,
  SingTestConfig,
  SingUiState,
} from "./sing-test-types.ts";

export type {
  SingMountDeps,
  SingResultView,
  SingTestConfig,
  SingUiState,
} from "./sing-test-types.ts";

export type { LessonExercise } from "../lesson-exercise.ts";

type TestState =
  | "idle"
  | "playing"
  | "ready"
  | "recording"
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

export function mountSingTest(
  root: HTMLElement,
  config: SingTestConfig,
  deps?: SingMountDeps,
): void {
  const history = deps?.history ?? createDefaultHistoryPort();
  const audio = deps?.audio ?? createDefaultAudioPort();
  const recording = deps?.recording ?? createDefaultRecordingPort();
  const exercisesPerLesson =
    deps?.exercisesPerLesson ?? EXERCISES_PER_LESSON;

  let state: TestState = "idle";
  let recordingSession: { stop: () => void } | null = null;
  let currentExercise: LessonExercise | null = null;
  let pendingCentsOff: number | undefined;
  let resultView: SingResultView | null = null;
  let livePitchText = "Listening…";

  const lessonRun = new LessonRun({
    exercisesPerLesson,
    onAttemptScored: (ctx) => {
      if (!currentExercise || pendingCentsOff === undefined) return;
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
        pendingCentsOff,
        ctx.passed,
        ctx.attemptNumber,
      );
      void history.saveAttempt(record);
    },
  });

  const [ui, setUi] = createStore<SingUiState>({
    statusText: config.status.idle,
    lessonProgressHidden: false,
    lessonProgressText: "",
    questionPrompt: "",
    showQuestionPrompt: false,
    livePitchText: "Listening…",
    showLivePitch: false,
    resultClassName: "result",
    result: null,
    voice: getVoiceType(),
    voiceRangeHint: voiceRangeHint(getVoiceType()),
    settingsLocked: false,
    playHidden: false,
    playDisabled: false,
    recordHidden: false,
    recordDisabled: true,
    recordLabel: "Start singing",
    retryHidden: true,
    nextHidden: true,
    nextLabel: "Next exercise",
    nextRoundHidden: true,
  });

  function lessonSnapshot() {
    return lessonRun.getSnapshot();
  }

  function exercisePromptText(exercise: LessonExercise | null): string | null {
    if (!exercise) return null;
    if (config.exercisePrompt) {
      return config.exercisePrompt(exercise);
    }
    if (exercise.scaleDegree) {
      const label =
        getScaleDegreeById(exercise.degreeId ?? "")?.label ??
        exercise.degreeId;
      return label ? `Sing the ${label}` : null;
    }
    return null;
  }

  function syncUi(): void {
    const snap = lessonSnapshot();
    const inLessonSummary = state === "lessonSummary";
    const settingsLocked =
      state === "playing" || state === "recording" || inLessonSummary;

    const showResultActions = state === "result";
    const canRetry = showResultActions && snap.canRetry;
    const canNext = showResultActions && snap.canAdvance;
    const nextLabel = nextStepButtonLabel(snap.isLastExerciseInLesson);

    let statusText = config.status.idle;
    let showQuestionPrompt = false;
    let questionPrompt = "";
    let showLivePitch = false;
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
      case "ready": {
        statusText = config.status.ready;
        const prompt = exercisePromptText(currentExercise);
        if (prompt) {
          showQuestionPrompt = true;
          questionPrompt = prompt;
        }
        break;
      }
      case "recording":
        statusText = config.status.recording;
        showLivePitch = true;
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
        } else if (resultView?.type === "scoring-error") {
          statusText = "Something went wrong.";
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
    } else if (
      resultView?.type === "scoring-error" ||
      resultView?.type === "audio-error"
    ) {
      resultClassName = "result result-fail";
    }

    const voice = getVoiceType();

    setUi({
      statusText,
      lessonProgressHidden,
      lessonProgressText,
      questionPrompt,
      showQuestionPrompt,
      livePitchText,
      showLivePitch,
      resultClassName,
      result: resultView,
      voice,
      voiceRangeHint: voiceRangeHint(voice),
      settingsLocked,
      playHidden: showResultActions || inLessonSummary,
      playDisabled:
        inLessonSummary || state === "playing" || state === "recording",
      recordHidden: showResultActions || inLessonSummary,
      recordDisabled: state !== "ready" && state !== "recording",
      recordLabel: state === "recording" ? "Done" : "Start singing",
      retryHidden: !canRetry || inLessonSummary,
      nextHidden: !canNext || inLessonSummary,
      nextLabel,
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
    pendingCentsOff = undefined;
    resultView = null;
    config.onLessonReset?.();
  }

  function showAttemptResult(score: ScoreResult): void {
    pendingCentsOff = score.centsOff;
    lessonRun.recordScore(score.passed);

    const snap = lessonSnapshot();
    const triesLeft = MAX_ATTEMPTS_PER_EXERCISE - snap.scoredAttemptsOnCurrent;
    const nextLabel = nextStepButtonLabel(snap.isLastExerciseInLesson);
    resultView = {
      type: "attempt",
      passed: score.passed,
      message: score.message,
      detectedHz: score.detectedHz,
      targetHz: score.targetHz,
      targetName: currentExercise?.target.name ?? "?",
      attemptNote: buildAttemptNote(score.passed, triesLeft, nextLabel),
    };
    setState("result");
  }

  function showScoringError(message: string): void {
    resultView = { type: "scoring-error", detail: message };
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

  async function handlePlay(): Promise<void> {
    if (audio.isPlaying()) return;

    try {
      await audio.ensureReady();
      if (state === "idle" || !currentExercise) {
        currentExercise = config.prepareExercise();
        lessonRun.ensureCurrentExercise();
      }
      setState("playing");
      await config.playReference(currentExercise);
      setState("ready");
    } catch {
      resultView = { type: "audio-error" };
      currentExercise = null;
      setState("idle");
      syncUi();
    }
  }

  async function handleRecordStart(): Promise<void> {
    if (state === "recording") return;

    try {
      await audio.ensureReady();
      livePitchText = "Listening…";
      setState("recording");

      recordingSession = await recording.start({
        targetHz: currentExercise?.target.hz,
        onPitch: (hz, clarity) => {
          livePitchText = `~${hz.toFixed(0)} Hz (clarity ${(clarity * 100).toFixed(0)}%)`;
          syncUi();
        },
        onComplete: (samples) => {
          recordingSession = null;
          finishScoring(samples);
        },
        onError: (msg) => {
          recordingSession = null;
          showScoringError(msg);
        },
      });
    } catch (err) {
      showScoringError(
        err instanceof Error ? err.message : "Microphone error.",
      );
    }
  }

  function finishScoring(samplesHz: number[]): void {
    if (samplesHz.length < MIN_VALID_SAMPLES) {
      showScoringError(
        `Not enough clear pitch detected (${samplesHz.length} frames, need ${MIN_VALID_SAMPLES}). Hold a steady note closer to the mic.`,
      );
      return;
    }

    if (!currentExercise) {
      showScoringError("No reference — press Play first.");
      return;
    }

    const outcome = scoreFromSamples(samplesHz, currentExercise.target.hz);
    if ("error" in outcome) {
      showScoringError(outcome.error);
      return;
    }

    showAttemptResult(outcome);
  }

  function handleRecord(): void {
    if (state === "recording") {
      recordingSession?.stop();
      recordingSession = null;
      return;
    }
    void handleRecordStart();
  }

  function handleRetry(): void {
    recording.stopStream();
    lessonRun.retryCurrentExercise();
    resultView = null;
    void handlePlay();
  }

  function handleNextQuestion(): void {
    recording.stopStream();
    lessonRun.advanceAfterResult(currentExercise ?? undefined);
    if (lessonSnapshot().isLessonComplete) {
      showLessonSummary();
      return;
    }
    currentExercise = null;
    resultView = null;
    setState("idle");
    void handlePlay();
  }

  function handleNextRound(): void {
    recording.stopStream();
    resetLesson();
    setState("idle");
  }

  function handleVoiceChange(voice: VoiceType): void {
    if (!config.showVoicePicker || voice === getVoiceType()) return;
    setVoiceType(voice);
    resetLesson();
    if (state === "result" || state === "lessonSummary") {
      setState("idle");
    } else if (state === "ready") {
      setState("idle");
    } else {
      syncUi();
    }
  }

  render(
    () =>
      SingTestView({
        ui,
        title: config.title,
        subtitle: config.subtitle,
        lessonBanner: config.lessonBanner,
        playButtonLabel: config.playButtonLabel,
        showVoicePicker: config.showVoicePicker,
        onPlay: () => {
          audio.unlock();
          void handlePlay();
        },
        onRecord: () => {
          audio.unlock();
          handleRecord();
        },
        onRetry: handleRetry,
        onNext: handleNextQuestion,
        onNextRound: handleNextRound,
        onVoiceChange: handleVoiceChange,
      }),
    root,
  );

  syncUi();
}
