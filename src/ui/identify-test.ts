import {
  createDefaultAudioPort,
  type AudioPort,
} from "../audio/port.ts";
import {
  createDefaultHistoryPort,
  type HistoryPort,
} from "../history/port.ts";
import {
  MAX_ATTEMPTS_PER_EXERCISE,
  EXERCISES_PER_LESSON,
} from "../config.ts";
import { buildAttemptRecord } from "../history/serialize.ts";
import type { PracticeModeId } from "../history/types.ts";
import {
  getActiveIntervals,
  getSelectableIntervals,
  isIntervalSelected,
  setIntervalSelected,
} from "../interval-preference.ts";
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
  VOICE_RANGES,
  VOICE_TYPE_LABELS,
  VOICE_TYPES,
  type VoiceType,
} from "../voice-ranges.ts";

type TestState =
  | "idle"
  | "playing"
  | "ready"
  | "result"
  | "lessonSummary";

export interface IdentifyTestConfig {
  practiceModeId: PracticeModeId;
  title: string;
  subtitle: string;
  playButtonLabel: string;
  showVoicePicker: boolean;
  showIntervalPicker: boolean;
  status: {
    idle: string;
    noIntervals: string;
    tooFewIntervals: string;
    playing: string;
    ready: string;
    pass: string;
    fail: string;
    failExhausted?: string;
  };
  prepareExercise: () => LessonExercise;
  playReference: (exercise: LessonExercise) => Promise<void>;
}

export interface IdentifyMountDeps {
  history?: HistoryPort;
  audio?: AudioPort;
  /** Override lesson length (browser tests); production uses default from config. */
  exercisesPerLesson?: number;
}

export function mountIdentifyTest(
  root: HTMLElement,
  config: IdentifyTestConfig,
  deps?: IdentifyMountDeps,
): void {
  const history = deps?.history ?? createDefaultHistoryPort();
  const audio = deps?.audio ?? createDefaultAudioPort();
  const voicePickerHtml = config.showVoicePicker
    ? `
      <fieldset class="voice-picker" id="voice-picker">
        <legend class="voice-picker-legend">Voice type</legend>
        <div class="voice-options">
          ${VOICE_TYPES.map(
            (voice) => `
            <label class="voice-option">
              <input type="radio" name="voice" value="${voice}" class="voice-option-input" />
              <span class="voice-option-label">${VOICE_TYPE_LABELS[voice]}</span>
            </label>
          `,
          ).join("")}
        </div>
        <p id="voice-range-hint" class="voice-range-hint"></p>
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
              <input type="checkbox" value="${entry.id}" class="interval-option-input chord-type-option-input" />
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
      ${intervalPickerHtml}
      <section class="card" aria-live="polite">
        <p id="status" class="status">${config.status.idle}</p>
        <div id="choices" class="choice-grid" hidden></div>
        <div id="result" class="result" hidden></div>
      </section>
      <div class="actions">
        <button type="button" id="btn-play" class="btn btn-primary">${config.playButtonLabel}</button>
        <button type="button" id="btn-retry" class="btn" hidden>Try again</button>
        <button type="button" id="btn-next" class="btn btn-primary" hidden>Next exercise</button>
        <button type="button" id="btn-next-round" class="btn btn-primary" hidden>Start next lesson</button>
      </div>
      <p class="hint">Use headphones if you can. Tap Play to hear the reference (no microphone needed).</p>
    </main>
  `;

  const statusEl = root.querySelector<HTMLElement>("#status")!;
  const choicesEl = root.querySelector<HTMLElement>("#choices")!;
  const resultEl = root.querySelector<HTMLElement>("#result")!;
  const btnPlay = root.querySelector<HTMLButtonElement>("#btn-play")!;
  const btnRetry = root.querySelector<HTMLButtonElement>("#btn-retry")!;
  const btnNext = root.querySelector<HTMLButtonElement>("#btn-next")!;
  const btnNextRound = root.querySelector<HTMLButtonElement>("#btn-next-round")!;
  const lessonProgressEl = root.querySelector<HTMLElement>("#round-progress")!;
  const voicePickerEl = root.querySelector<HTMLFieldSetElement>("#voice-picker");
  const voiceRangeHintEl = root.querySelector<HTMLElement>("#voice-range-hint");
  const voiceInputs = root.querySelectorAll<HTMLInputElement>(".voice-option-input");
  const intervalPickerEl =
    root.querySelector<HTMLFieldSetElement>("#interval-picker");
  const intervalInputs = root.querySelectorAll<HTMLInputElement>(
    ".interval-option-input",
  );

  let state: TestState = "idle";
  let currentExercise: LessonExercise | null = null;
  let currentChoices: IntervalChoice[] = [];
  let pendingSelectedIntervalId: string | undefined;

  const exercisesPerLesson =
    deps?.exercisesPerLesson ?? EXERCISES_PER_LESSON;

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
          showIntervalFilters: config.showIntervalPicker,
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

  function lessonSnapshot() {
    return lessonRun.getSnapshot();
  }

  function resetLesson(): void {
    lessonRun.reset();
    currentExercise = null;
    pendingSelectedIntervalId = undefined;
    resultEl.hidden = true;
    choicesEl.hidden = true;
    choicesEl.innerHTML = "";
  }

  function activeIntervalCount(): number {
    return getActiveIntervals().length;
  }

  function settingsIncomplete(): boolean {
    if (config.showIntervalPicker && activeIntervalCount() === 0) return true;
    if (config.showIntervalPicker && activeIntervalCount() < 2) return true;
    return false;
  }

  function settingsIdleMessage(): string {
    if (config.showIntervalPicker && activeIntervalCount() === 0) {
      return config.status.noIntervals;
    }
    if (config.showIntervalPicker && activeIntervalCount() < 2) {
      return config.status.tooFewIntervals;
    }
    return config.status.idle;
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
    lessonProgressEl.textContent = `Lesson — exercise ${exerciseNumber} of ${exercisesPerLesson}`;
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
    setState("idle");
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
    resetLesson();
    setState("idle");
  }

  function renderChoices(): void {
    if (!currentExercise?.intervalId) return;
    const eligibleIds =
      currentExercise.eligibleTagIds ??
      (currentExercise.intervalId ? [currentExercise.intervalId] : []);
    currentChoices = buildIntervalChoices(
      currentExercise.intervalId,
      eligibleIds,
    );
    choicesEl.innerHTML = currentChoices
      .map(
        (choice) => `
        <button type="button" class="btn choice-btn" data-choice-id="${choice.id}">
          ${choice.label}
        </button>
      `,
      )
      .join("");
    for (const btn of choicesEl.querySelectorAll<HTMLButtonElement>(
      ".choice-btn",
    )) {
      btn.addEventListener("click", () => {
        void handleChoice(btn.dataset.choiceId!);
      });
    }
  }

  function updateUi(): void {
    const inLessonSummary = state === "lessonSummary";
    const settingsLocked =
      state === "playing" || state === "result" || inLessonSummary;
    const incomplete = settingsIncomplete();

    if (voicePickerEl) {
      voicePickerEl.disabled = settingsLocked;
      for (const input of voiceInputs) input.disabled = settingsLocked;
    }
    if (intervalPickerEl) {
      intervalPickerEl.disabled = settingsLocked;
      for (const input of intervalInputs) input.disabled = settingsLocked;
    }

    btnPlay.disabled =
      inLessonSummary || state === "playing" || incomplete;
    btnPlay.hidden = state === "result" || inLessonSummary;

    const showResultActions = state === "result";
    const { canRetry: lessonCanRetry, canAdvance: lessonCanAdvance } =
      lessonSnapshot();
    const canRetry = showResultActions && lessonCanRetry;
    const canNext = showResultActions && lessonCanAdvance;

    btnRetry.hidden = !canRetry || inLessonSummary;
    btnNext.hidden = !canNext || inLessonSummary;
    if (canNext && !inLessonSummary) {
      btnNext.textContent = nextStepButtonLabel();
    }
    btnNextRound.hidden = !inLessonSummary;

    choicesEl.hidden = state !== "ready";
    if (state === "ready") {
      for (const btn of choicesEl.querySelectorAll<HTMLButtonElement>(
        ".choice-btn",
      )) {
        btn.disabled = false;
      }
    }

    switch (state) {
      case "lessonSummary":
        break;
      case "idle":
        statusEl.textContent = settingsIdleMessage();
        resultEl.hidden = true;
        choicesEl.hidden = true;
        break;
      case "playing":
        statusEl.textContent = config.status.playing;
        resultEl.hidden = true;
        choicesEl.hidden = true;
        break;
      case "ready":
        statusEl.textContent = config.status.ready;
        resultEl.hidden = true;
        break;
      case "result":
        choicesEl.hidden = true;
        break;
    }
  }

  function showResult(passed: boolean, selectedLabel: string): void {
    const snap = lessonSnapshot();
    const triesLeft = MAX_ATTEMPTS_PER_EXERCISE - snap.scoredAttemptsOnCurrent;
    const nextLabel = nextStepButtonLabel();
    let attemptNote = "";
    if (!passed) {
      if (triesLeft > 0) {
        attemptNote = `<p class="result-attempts">${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left on this exercise.</p>`;
      } else {
        attemptNote = `<p class="result-attempts">No tries left — tap ${nextLabel} when you are ready.</p>`;
      }
    }

    resultEl.hidden = false;
    resultEl.className = `result ${passed ? "result-pass" : "result-fail"}`;
    resultEl.innerHTML = passed
      ? `
      <p class="result-verdict">Correct</p>
      <p class="result-detail">You chose ${selectedLabel}.</p>
      ${attemptNote}
    `
      : `
      <p class="result-verdict">Not quite</p>
      <p class="result-detail">That wasn't right — tap Try again to hear the interval and pick again.</p>
      ${attemptNote}
    `;

    const onLastQuestion = snap.isLastExerciseInLesson;
    statusEl.textContent = passed
      ? onLastQuestion
        ? `Correct — tap ${nextLabel} when you are ready.`
        : config.status.pass
      : triesLeft > 0
        ? config.status.fail
        : onLastQuestion
          ? `Out of tries — tap ${nextLabel} to see your lesson score.`
          : (config.status.failExhausted ?? config.status.fail);
    setState("result");
  }

  async function handleChoice(selectedId: string): Promise<void> {
    if (state !== "ready" || !currentExercise?.intervalId) return;

    for (const btn of choicesEl.querySelectorAll<HTMLButtonElement>(
      ".choice-btn",
    )) {
      btn.disabled = true;
    }

    const passed = selectedId === currentExercise.intervalId;
    const label =
      currentChoices.find((c) => c.id === selectedId)?.label ?? selectedId;
    pendingSelectedIntervalId = selectedId;
    lessonRun.recordScore(passed);
    showResult(passed, label);
  }

  async function handlePlay(): Promise<void> {
    if (audio.isPlaying() || settingsIncomplete()) return;

    try {
      await audio.ensureReady();
      if (state === "idle" || !currentExercise) {
        currentExercise = config.prepareExercise();
        lessonRun.ensureCurrentExercise();
      }
      setState("playing");
      await config.playReference(currentExercise);
      renderChoices();
      setState("ready");
    } catch {
      resultEl.hidden = false;
      resultEl.className = "result result-fail";
      resultEl.innerHTML = `
        <p class="result-verdict">Could not play audio</p>
        <p class="result-detail">Tap Play again after interacting with the page.</p>
      `;
      setState("idle");
    }
  }

  function handleRetry(): void {
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
    statusEl.textContent =
      "Lesson finished — review your score, then start the next lesson.";
    setState("lessonSummary");
  }

  function handleNextQuestion(): void {
    lessonRun.advanceAfterResult(currentExercise ?? undefined);
    if (lessonSnapshot().isLessonComplete) {
      showLessonSummary();
      return;
    }
    currentExercise = null;
    resultEl.hidden = true;
    choicesEl.innerHTML = "";
    setState("idle");
    void handlePlay();
  }

  function handleNextRound(): void {
    resetLesson();
    setState("idle");
  }

  btnPlay.addEventListener("click", () => {
    audio.unlock();
    void handlePlay();
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

  for (const input of intervalInputs) {
    input.addEventListener("change", () => {
      setIntervalPreference(input.value, input.checked);
    });
  }

  syncVoicePicker();
  syncIntervalPicker();
  syncLessonProgress();
  updateUi();
}
