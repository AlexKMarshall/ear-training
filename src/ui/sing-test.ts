import {
  createDefaultAudioPort,
  type AudioPort,
} from "../audio/port.ts";
import {
  createDefaultRecordingPort,
  type RecordingPort,
} from "../audio/recording-port.ts";
import {
  MAX_ATTEMPTS_PER_EXERCISE,
  MIN_VALID_SAMPLES,
  EXERCISES_PER_LESSON,
} from "../config.ts";
import { LessonRun } from "../lesson-run.ts";
import { percentOf, summarizeLesson } from "../lesson.ts";
import type { LessonExercise } from "../lesson-exercise.ts";
import {
  getVoiceType,
  setVoiceType,
  VOICE_RANGES,
  VOICE_TYPE_LABELS,
  VOICE_TYPES,
  type VoiceType,
} from "../voice-ranges.ts";
import {
  getActiveInversions,
  getSelectableInversions,
  isInversionSelected,
  setInversionSelected,
} from "../chord-inversion-preference.ts";
import {
  getSelectableChordTypes,
  getActiveChordTypes,
  isChordTypeSelected,
  setChordTypeSelected,
} from "../chord-type-preference.ts";
import {
  getActiveIntervals,
  getSelectableIntervals,
  isIntervalSelected,
  setIntervalSelected,
} from "../interval-preference.ts";
import {
  getActiveScaleDegrees,
  getSelectableScaleDegrees,
  isScaleDegreeSelected,
  setScaleDegreeSelected,
} from "../scale-degree-preference.ts";
import { getScaleDegreeById } from "../scale-degree-config.ts";
import {
  createDefaultHistoryPort,
  type HistoryPort,
} from "../history/port.ts";
import { buildAttemptRecord } from "../history/serialize.ts";
import type { PracticeModeId } from "../history/types.ts";
import { scoreFromSamples } from "../pitch/score.ts";
import type { ScoreResult } from "../pitch/score.ts";

type TestState =
  | "idle"
  | "playing"
  | "ready"
  | "recording"
  | "result"
  | "lessonSummary";

export type { LessonExercise } from "../lesson-exercise.ts";

export interface SingTestConfig {
  practiceModeId: PracticeModeId;
  title: string;
  subtitle: string;
  playButtonLabel: string;
  showVoicePicker: boolean;
  showChordTypePicker?: boolean;
  showInversionPicker?: boolean;
  showIntervalPicker?: boolean;
  showDegreePicker?: boolean;
  exercisePrompt?: (exercise: LessonExercise) => string;
  status: {
    idle: string;
    playing: string;
    ready: string;
    recording: string;
    pass: string;
    fail: string;
    /** When the user has used all attempts on the current exercise without passing. */
    failExhausted?: string;
    /** Shown in idle state when chord type picker is on but nothing is selected. */
    noChordTypes?: string;
    /** Shown in idle state when inversion picker is on but nothing is selected. */
    noInversions?: string;
    /** Shown in idle state when interval picker is on but nothing is selected. */
    noIntervals?: string;
    /** Shown in idle state when degree picker is on but nothing is selected. */
    noDegrees?: string;
  };
  prepareExercise: () => LessonExercise;
  playReference: (exercise: LessonExercise) => Promise<void>;
  /** Called when a lesson is cleared (new lesson run, preference change, voice change). */
  onLessonReset?: () => void;
}

export interface SingMountDeps {
  history?: HistoryPort;
  audio?: AudioPort;
  recording?: RecordingPort;
}

export function mountSingTest(
  root: HTMLElement,
  config: SingTestConfig,
  deps?: SingMountDeps,
): void {
  const history = deps?.history ?? createDefaultHistoryPort();
  const audio = deps?.audio ?? createDefaultAudioPort();
  const recording = deps?.recording ?? createDefaultRecordingPort();
  const voicePickerHtml = config.showVoicePicker
    ? `
      <fieldset class="voice-picker" id="voice-picker">
        <legend class="voice-picker-legend">Voice type</legend>
        <div class="voice-options">
          ${VOICE_TYPES.map(
            (voice) => `
            <label class="voice-option">
              <input
                type="radio"
                name="voice"
                value="${voice}"
                class="voice-option-input"
              />
              <span class="voice-option-label">${VOICE_TYPE_LABELS[voice]}</span>
            </label>
          `,
          ).join("")}
        </div>
        <p id="voice-range-hint" class="voice-range-hint"></p>
      </fieldset>
    `
    : "";

  const chordTypePickerHtml = config.showChordTypePicker
    ? `
      <fieldset class="chord-type-picker" id="chord-type-picker">
        <legend class="chord-type-picker-legend">Chord types</legend>
        <div class="chord-type-options">
          ${getSelectableChordTypes()
            .map(
              (type) => `
            <label class="chord-type-option">
              <input
                type="checkbox"
                value="${type.id}"
                class="chord-type-option-input"
              />
              <span class="chord-type-option-label">${type.label}</span>
            </label>
          `,
            )
            .join("")}
        </div>
      </fieldset>
    `
    : "";

  const inversionPickerHtml = config.showInversionPicker
    ? `
      <fieldset class="chord-inversion-picker" id="chord-inversion-picker">
        <legend class="chord-inversion-picker-legend">Inversions</legend>
        <div class="chord-inversion-options">
          ${getSelectableInversions()
            .map(
              (inv) => `
            <label class="chord-inversion-option">
              <input
                type="checkbox"
                value="${inv.id}"
                class="chord-inversion-option-input"
              />
              <span class="chord-inversion-option-label">${inv.label}</span>
            </label>
          `,
            )
            .join("")}
        </div>
      </fieldset>
    `
    : "";

  const intervalPickerHtml = config.showIntervalPicker
    ? `
      <fieldset class="interval-picker chord-type-picker" id="interval-picker">
        <legend class="chord-type-picker-legend">Intervals</legend>
        <div class="chord-type-options">
          ${getSelectableIntervals()
            .map(
              (entry) => `
            <label class="chord-type-option">
              <input
                type="checkbox"
                value="${entry.id}"
                class="interval-option-input chord-type-option-input"
              />
              <span class="chord-type-option-label">${entry.label}</span>
            </label>
          `,
            )
            .join("")}
        </div>
      </fieldset>
    `
    : "";

  const degreePickerHtml = config.showDegreePicker
    ? `
      <fieldset class="degree-picker chord-type-picker" id="degree-picker">
        <legend class="chord-type-picker-legend">Scale degrees</legend>
        <div class="chord-type-options">
          ${getSelectableScaleDegrees()
            .map(
              (entry) => `
            <label class="chord-type-option">
              <input
                type="checkbox"
                value="${entry.id}"
                class="degree-option-input chord-type-option-input"
              />
              <span class="chord-type-option-label">${entry.label}</span>
            </label>
          `,
            )
            .join("")}
        </div>
      </fieldset>
    `
    : "";

  root.innerHTML = `
    <main class="app">
      <nav class="nav">
        <a href="/" class="nav-back">← All tests</a>
      </nav>

      <header class="header">
        <h1>${config.title}</h1>
        <p class="subtitle">${config.subtitle}</p>
        <p id="round-progress" class="round-progress" hidden></p>
      </header>

      ${voicePickerHtml}
      ${chordTypePickerHtml}
      ${inversionPickerHtml}
      ${intervalPickerHtml}
      ${degreePickerHtml}

      <section class="card" aria-live="polite">
        <p id="status" class="status">${config.status.idle}</p>
        <p id="question-prompt" class="question-prompt" hidden></p>
        <p id="live-pitch" class="live-pitch" hidden></p>
        <div id="result" class="result" hidden></div>
      </section>

      <div class="actions">
        <button type="button" id="btn-play" class="btn btn-primary">${config.playButtonLabel}</button>
        <button type="button" id="btn-record" class="btn" disabled>Start singing</button>
        <button type="button" id="btn-retry" class="btn" hidden>Try again</button>
        <button type="button" id="btn-next" class="btn btn-primary" hidden>Next exercise</button>
        <button type="button" id="btn-next-round" class="btn btn-primary" hidden>Start next lesson</button>
      </div>

      <p class="hint">
        Use headphones if you can. Allow microphone access when prompted.
        Works on HTTPS or localhost.
      </p>
    </main>
  `;

  const statusEl = root.querySelector<HTMLElement>("#status")!;
  const questionPromptEl = root.querySelector<HTMLElement>("#question-prompt")!;
  const livePitchEl = root.querySelector<HTMLElement>("#live-pitch")!;
  const resultEl = root.querySelector<HTMLElement>("#result")!;
  const btnPlay = root.querySelector<HTMLButtonElement>("#btn-play")!;
  const btnRecord = root.querySelector<HTMLButtonElement>("#btn-record")!;
  const btnRetry = root.querySelector<HTMLButtonElement>("#btn-retry")!;
  const btnNext = root.querySelector<HTMLButtonElement>("#btn-next")!;
  const btnNextRound = root.querySelector<HTMLButtonElement>("#btn-next-round")!;
  const lessonProgressEl = root.querySelector<HTMLElement>("#round-progress")!;
  const voicePickerEl = root.querySelector<HTMLFieldSetElement>("#voice-picker");
  const voiceRangeHintEl = root.querySelector<HTMLElement>("#voice-range-hint");
  const voiceInputs = root.querySelectorAll<HTMLInputElement>(
    ".voice-option-input",
  );
  const chordTypePickerEl =
    root.querySelector<HTMLFieldSetElement>("#chord-type-picker");
  const chordTypeInputs = root.querySelectorAll<HTMLInputElement>(
    ".chord-type-option-input",
  );
  const inversionPickerEl = root.querySelector<HTMLFieldSetElement>(
    "#chord-inversion-picker",
  );
  const inversionInputs = root.querySelectorAll<HTMLInputElement>(
    ".chord-inversion-option-input",
  );
  const intervalPickerEl =
    root.querySelector<HTMLFieldSetElement>("#interval-picker");
  const intervalInputs = root.querySelectorAll<HTMLInputElement>(
    ".interval-option-input",
  );
  const degreePickerEl =
    root.querySelector<HTMLFieldSetElement>("#degree-picker");
  const degreeInputs = root.querySelectorAll<HTMLInputElement>(
    ".degree-option-input",
  );

  let state: TestState = "idle";
  let recordingSession: { stop: () => void } | null = null;
  let currentExercise: LessonExercise | null = null;
  let pendingCentsOff: number | undefined;

  const lessonRun = new LessonRun({
    onAttemptScored: (ctx) => {
      if (!currentExercise || pendingCentsOff === undefined) return;
      const record = buildAttemptRecord(
        {
          practiceModeId: config.practiceModeId,
          lessonId: ctx.lessonId,
          exerciseIndex: ctx.exerciseIndex,
          showVoicePicker: config.showVoicePicker,
          showChordFilters: Boolean(
            config.showChordTypePicker || config.showInversionPicker,
          ),
          showIntervalFilters: Boolean(config.showIntervalPicker),
          showDegreeFilters: Boolean(config.showDegreePicker),
        },
        currentExercise,
        pendingCentsOff,
        ctx.passed,
        ctx.attemptNumber,
      );
      void history.saveAttempt(record);
    },
  });

  function lessonSnapshot() {
    return lessonRun.getSnapshot();
  }

  function resetLesson(): void {
    lessonRun.reset();
    currentExercise = null;
    pendingCentsOff = undefined;
    resultEl.hidden = true;
    config.onLessonReset?.();
  }

  function nextStepButtonLabel(): string {
    return lessonSnapshot().isLastExerciseInLesson
      ? "Finish lesson"
      : "Next exercise";
  }

  function syncLessonProgress(): void {
    if (state === "lessonSummary") {
      lessonProgressEl.hidden = true;
      return;
    }
    lessonProgressEl.hidden = false;
    const { exerciseNumber } = lessonSnapshot();
    lessonProgressEl.textContent = `Lesson — exercise ${exerciseNumber} of ${EXERCISES_PER_LESSON}`;
  }

  function setState(next: TestState): void {
    state = next;
    syncLessonProgress();
    updateUi();
  }

  function syncVoicePicker(): void {
    if (!config.showVoicePicker) return;
    const voice = getVoiceType();
    for (const input of voiceInputs) {
      input.checked = input.value === voice;
    }
    voiceRangeHintEl!.textContent = `Notes drawn from ${VOICE_RANGES[voice].label}`;
  }

  function setVoicePreference(voice: VoiceType): void {
    if (!config.showVoicePicker || voice === getVoiceType()) return;
    setVoiceType(voice);
    syncVoicePicker();
    resetLesson();
    if (state === "result" || state === "lessonSummary") {
      setState("idle");
    } else if (state === "ready") {
      setState("idle");
    } else {
      syncLessonProgress();
      updateUi();
    }
  }

  function syncChordTypePicker(): void {
    if (!config.showChordTypePicker) return;
    for (const input of chordTypeInputs) {
      input.checked = isChordTypeSelected(input.value);
    }
  }

  function resetExerciseForPreferenceChange(): void {
    resetLesson();
    if (state === "result" || state === "lessonSummary") {
      setState("idle");
    } else if (state === "ready") {
      setState("idle");
    } else {
      syncLessonProgress();
      updateUi();
    }
  }

  function setChordTypePreference(id: string, selected: boolean): void {
    if (!config.showChordTypePicker) return;
    setChordTypeSelected(id, selected);
    syncChordTypePicker();
    resetExerciseForPreferenceChange();
    updateUi();
  }

  function syncInversionPicker(): void {
    if (!config.showInversionPicker) return;
    for (const input of inversionInputs) {
      input.checked = isInversionSelected(
        input.value as "root" | "first" | "second",
      );
    }
  }

  function setInversionPreference(
    id: "root" | "first" | "second",
    selected: boolean,
  ): void {
    if (!config.showInversionPicker) return;
    setInversionSelected(id, selected);
    syncInversionPicker();
    resetExerciseForPreferenceChange();
    updateUi();
  }

  function syncIntervalPicker(): void {
    if (!config.showIntervalPicker) return;
    for (const input of intervalInputs) {
      input.checked = isIntervalSelected(input.value);
    }
  }

  function setIntervalPreference(id: string, selected: boolean): void {
    if (!config.showIntervalPicker) return;
    setIntervalSelected(id, selected);
    syncIntervalPicker();
    resetExerciseForPreferenceChange();
    updateUi();
  }

  function syncDegreePicker(): void {
    if (!config.showDegreePicker) return;
    for (const input of degreeInputs) {
      input.checked = isScaleDegreeSelected(input.value);
    }
  }

  function setDegreePreference(id: string, selected: boolean): void {
    if (!config.showDegreePicker) return;
    setScaleDegreeSelected(id, selected);
    syncDegreePicker();
    resetExerciseForPreferenceChange();
    updateUi();
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

  function syncExercisePrompt(): void {
    const prompt = exercisePromptText(currentExercise);
    if (state === "ready" && prompt) {
      questionPromptEl.textContent = prompt;
      questionPromptEl.hidden = false;
    } else {
      questionPromptEl.hidden = true;
      questionPromptEl.textContent = "";
    }
  }

  function updateUi(): void {
    const inLessonSummary = state === "lessonSummary";
    const settingsLocked =
      state === "playing" || state === "recording" || inLessonSummary;
    const noChordTypesSelected =
      config.showChordTypePicker && getActiveChordTypes().length === 0;
    const noInversionsSelected =
      config.showInversionPicker && getActiveInversions().length === 0;
    const noIntervalsSelected =
      config.showIntervalPicker && getActiveIntervals().length === 0;
    const noDegreesSelected =
      config.showDegreePicker && getActiveScaleDegrees().length === 0;
    const settingsIncomplete = Boolean(
      noChordTypesSelected ||
        noInversionsSelected ||
        noIntervalsSelected ||
        noDegreesSelected,
    );
    if (voicePickerEl) {
      voicePickerEl.disabled = settingsLocked;
      for (const input of voiceInputs) {
        input.disabled = settingsLocked;
      }
    }
    if (chordTypePickerEl) {
      chordTypePickerEl.disabled = settingsLocked;
      for (const input of chordTypeInputs) {
        input.disabled = settingsLocked;
      }
    }
    if (inversionPickerEl) {
      inversionPickerEl.disabled = settingsLocked;
      for (const input of inversionInputs) {
        input.disabled = settingsLocked;
      }
    }
    if (intervalPickerEl) {
      intervalPickerEl.disabled = settingsLocked;
      for (const input of intervalInputs) {
        input.disabled = settingsLocked;
      }
    }
    if (degreePickerEl) {
      degreePickerEl.disabled = settingsLocked;
      for (const input of degreeInputs) {
        input.disabled = settingsLocked;
      }
    }

    btnPlay.disabled =
      inLessonSummary ||
      state === "playing" ||
      state === "recording" ||
      settingsIncomplete;
    btnRecord.disabled = state !== "ready" && state !== "recording";
    btnRecord.textContent = state === "recording" ? "Done" : "Start singing";
    const showResultActions = state === "result";
    const { canRetry: lessonCanRetry, canAdvance: lessonCanAdvance } =
      lessonSnapshot();
    const canRetrySameQuestion = showResultActions && lessonCanRetry;
    const canGoToNextQuestion = showResultActions && lessonCanAdvance;

    btnRetry.hidden = !canRetrySameQuestion || inLessonSummary;
    btnNext.hidden = !canGoToNextQuestion || inLessonSummary;
    if (canGoToNextQuestion && !inLessonSummary) {
      btnNext.textContent = nextStepButtonLabel();
    }
    btnNextRound.hidden = !inLessonSummary;
    btnPlay.hidden = showResultActions || inLessonSummary;
    btnRecord.hidden = showResultActions || inLessonSummary;

    switch (state) {
      case "lessonSummary":
        break;
      case "idle":
        statusEl.textContent =
          noChordTypesSelected && config.status.noChordTypes
            ? config.status.noChordTypes
            : noInversionsSelected && config.status.noInversions
              ? config.status.noInversions
              : noIntervalsSelected && config.status.noIntervals
                ? config.status.noIntervals
                : noDegreesSelected && config.status.noDegrees
                  ? config.status.noDegrees
                  : config.status.idle;
        livePitchEl.hidden = true;
        resultEl.hidden = true;
        break;
      case "playing":
        statusEl.textContent = config.status.playing;
        livePitchEl.hidden = true;
        resultEl.hidden = true;
        break;
      case "ready":
        statusEl.textContent = config.status.ready;
        livePitchEl.hidden = true;
        resultEl.hidden = true;
        break;
      case "recording":
        statusEl.textContent = config.status.recording;
        livePitchEl.hidden = false;
        resultEl.hidden = true;
        break;
      case "result":
        livePitchEl.hidden = true;
        break;
    }

    syncExercisePrompt();
  }

  function showResult(score: ScoreResult): void {
    pendingCentsOff = score.centsOff;
    lessonRun.recordScore(score.passed);

    const snap = lessonSnapshot();
    const triesLeft = MAX_ATTEMPTS_PER_EXERCISE - snap.scoredAttemptsOnCurrent;
    const nextLabel = nextStepButtonLabel();
    let attemptNote = "";
    if (!score.passed) {
      if (triesLeft > 0) {
        attemptNote = `<p class="result-attempts">${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left on this exercise.</p>`;
      } else {
        attemptNote = `<p class="result-attempts">No tries left — tap ${nextLabel} when you are ready.</p>`;
      }
    }

    resultEl.hidden = false;
    resultEl.className = `result ${score.passed ? "result-pass" : "result-fail"}`;
    resultEl.innerHTML = `
      <p class="result-verdict">${score.passed ? "Correct" : "Not quite"}</p>
      <p class="result-detail">${score.message}</p>
      <p class="result-meta">Detected ${score.detectedHz.toFixed(1)} Hz (target ${score.targetHz.toFixed(1)} Hz — ${currentExercise?.target.name ?? "?"})</p>
      ${attemptNote}
    `;
    const onLastQuestion = snap.isLastExerciseInLesson;
    statusEl.textContent = score.passed
      ? onLastQuestion
        ? `Correct — tap ${nextLabel} when you are ready.`
        : config.status.pass
      : triesLeft > 0
        ? config.status.fail
        : onLastQuestion
          ? `Out of tries — tap ${nextLabel} to see your lesson score.`
          : (config.status.failExhausted ?? config.status.fail);
  }

  function showError(message: string): void {
    resultEl.hidden = false;
    resultEl.className = "result result-fail";
    resultEl.innerHTML = `
      <p class="result-verdict">Could not score</p>
      <p class="result-detail">${message}</p>
    `;
    statusEl.textContent = "Something went wrong.";
    setState("result");
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
      showError("Could not play audio. Tap Play again after interacting with the page.");
      setState("idle");
    }
  }

  async function handleRecordStart(): Promise<void> {
    if (state === "recording") return;

    try {
      await audio.ensureReady();
      setState("recording");
      livePitchEl.textContent = "Listening…";

      recordingSession = await recording.start({
        targetHz: currentExercise?.target.hz,
        onPitch: (hz, clarity) => {
          livePitchEl.textContent = `~${hz.toFixed(0)} Hz (clarity ${(clarity * 100).toFixed(0)}%)`;
        },
        onComplete: (samples) => {
          recordingSession = null;
          finishScoring(samples);
        },
        onError: (msg) => {
          recordingSession = null;
          showError(msg);
        },
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Microphone error.");
    }
  }

  function finishScoring(samplesHz: number[]): void {
    if (samplesHz.length < MIN_VALID_SAMPLES) {
      showError(
        `Not enough clear pitch detected (${samplesHz.length} frames, need ${MIN_VALID_SAMPLES}). Hold a steady note closer to the mic.`,
      );
      return;
    }

    if (!currentExercise) {
      showError("No reference — press Play first.");
      return;
    }

    const outcome = scoreFromSamples(samplesHz, currentExercise.target.hz);
    if ("error" in outcome) {
      showError(outcome.error);
      return;
    }

    showResult(outcome);
    setState("result");
  }

  function handleDone(): void {
    recordingSession?.stop();
    recordingSession = null;
  }

  function handleRetry(): void {
    recording.stopStream();
    lessonRun.retryCurrentExercise();
    resultEl.hidden = true;
    void handlePlay();
  }

  function showLessonSummary(): void {
    const summary = summarizeLesson(lessonSnapshot().results);
    const correctPct = percentOf(summary.correctCount, summary.total);
    const firstTryPct = percentOf(summary.firstTryCount, summary.total);
    const retryPct = percentOf(summary.retryCount, summary.total);
    const wrongPct = percentOf(summary.wrongCount, summary.total);

    resultEl.hidden = false;
    resultEl.className = "result round-summary";
    resultEl.innerHTML = `
      <p class="result-verdict">Round complete</p>
      <p class="round-summary-score">
        <span class="round-summary-score-value">${summary.correctCount}/${summary.total}</span>
        correct (${correctPct}%)
      </p>
      <ul class="round-summary-breakdown">
        <li><span class="round-summary-label">First try</span> ${summary.firstTryCount} (${firstTryPct}%)</li>
        <li><span class="round-summary-label">After retry</span> ${summary.retryCount} (${retryPct}%)</li>
        <li><span class="round-summary-label">Wrong</span> ${summary.wrongCount} (${wrongPct}%)</li>
      </ul>
    `;
    statusEl.textContent = "Lesson finished — review your score, then start the next lesson.";
    setState("lessonSummary");
  }

  function handleNextQuestion(): void {
    recording.stopStream();
    lessonRun.advanceAfterResult(currentExercise ?? undefined);
    if (lessonSnapshot().isLessonComplete) {
      showLessonSummary();
      return;
    }

    currentExercise = null;
    resultEl.hidden = true;
    setState("idle");
    void handlePlay();
  }

  function handleNextRound(): void {
    recording.stopStream();
    resetLesson();
    setState("idle");
  }

  btnPlay.addEventListener("click", () => {
    audio.unlock();
    void handlePlay();
  });
  btnRecord.addEventListener("click", () => {
    audio.unlock();
    if (state === "recording") {
      handleDone();
    } else {
      void handleRecordStart();
    }
  });
  btnRetry.addEventListener("click", handleRetry);
  btnNext.addEventListener("click", handleNextQuestion);
  btnNextRound.addEventListener("click", handleNextRound);

  for (const input of voiceInputs) {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      setVoicePreference(input.value as VoiceType);
    });
  }

  for (const input of chordTypeInputs) {
    input.addEventListener("change", () => {
      setChordTypePreference(input.value, input.checked);
    });
  }

  for (const input of inversionInputs) {
    input.addEventListener("change", () => {
      setInversionPreference(
        input.value as "root" | "first" | "second",
        input.checked,
      );
    });
  }

  for (const input of intervalInputs) {
    input.addEventListener("change", () => {
      setIntervalPreference(input.value, input.checked);
    });
  }

  for (const input of degreeInputs) {
    input.addEventListener("change", () => {
      setDegreePreference(input.value, input.checked);
    });
  }

  syncVoicePicker();
  syncChordTypePicker();
  syncInversionPicker();
  syncIntervalPicker();
  syncDegreePicker();
  syncLessonProgress();
  updateUi();
}
