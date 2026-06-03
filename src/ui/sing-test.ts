import { startRecording, stopMediaStream } from "../audio/capture.ts";
import { ensureAudioReady, unlockAudio } from "../audio/context.ts";
import { isPlaying } from "../audio/playback.ts";
import {
  MAX_ATTEMPTS_PER_QUESTION,
  MIN_VALID_SAMPLES,
  QUESTIONS_PER_ROUND,
} from "../config.ts";
import {
  classifyQuestionOutcome,
  percentOf,
  summarizeRound,
  type RoundQuestionResult,
} from "../round.ts";
import type { SingTestQuestion } from "../sing-test-question.ts";
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
import { buildAttemptRecord } from "../history/serialize.ts";
import { saveAttempt } from "../history/store.ts";
import type { ExerciseId } from "../history/types.ts";
import { scoreFromSamples } from "../pitch/score.ts";
import type { ScoreResult } from "../pitch/score.ts";

type TestState =
  | "idle"
  | "playing"
  | "ready"
  | "recording"
  | "result"
  | "roundSummary";

export type { SingTestQuestion } from "../sing-test-question.ts";

export interface SingTestConfig {
  exerciseId: ExerciseId;
  title: string;
  subtitle: string;
  playButtonLabel: string;
  showVoicePicker: boolean;
  showChordTypePicker?: boolean;
  showInversionPicker?: boolean;
  showIntervalPicker?: boolean;
  status: {
    idle: string;
    playing: string;
    ready: string;
    recording: string;
    pass: string;
    fail: string;
    /** When the user has used all attempts on the current question without passing. */
    failExhausted?: string;
    /** Shown in idle state when chord type picker is on but nothing is selected. */
    noChordTypes?: string;
    /** Shown in idle state when inversion picker is on but nothing is selected. */
    noInversions?: string;
    /** Shown in idle state when interval picker is on but nothing is selected. */
    noIntervals?: string;
  };
  prepareQuestion: () => SingTestQuestion;
  playReference: (question: SingTestQuestion) => Promise<void>;
}

export function mountSingTest(root: HTMLElement, config: SingTestConfig): void {
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

      <section class="card" aria-live="polite">
        <p id="status" class="status">${config.status.idle}</p>
        <p id="live-pitch" class="live-pitch" hidden></p>
        <div id="result" class="result" hidden></div>
      </section>

      <div class="actions">
        <button type="button" id="btn-play" class="btn btn-primary">${config.playButtonLabel}</button>
        <button type="button" id="btn-record" class="btn" disabled>Start singing</button>
        <button type="button" id="btn-done" class="btn" disabled hidden>Done</button>
        <button type="button" id="btn-retry" class="btn" hidden>Try again</button>
        <button type="button" id="btn-next" class="btn btn-primary" hidden>Next question</button>
        <button type="button" id="btn-next-round" class="btn btn-primary" hidden>Start next round</button>
      </div>

      <p class="hint">
        Use headphones if you can. Allow microphone access when prompted.
        Works on HTTPS or localhost.
      </p>
    </main>
  `;

  const statusEl = root.querySelector<HTMLElement>("#status")!;
  const livePitchEl = root.querySelector<HTMLElement>("#live-pitch")!;
  const resultEl = root.querySelector<HTMLElement>("#result")!;
  const btnPlay = root.querySelector<HTMLButtonElement>("#btn-play")!;
  const btnRecord = root.querySelector<HTMLButtonElement>("#btn-record")!;
  const btnDone = root.querySelector<HTMLButtonElement>("#btn-done")!;
  const btnRetry = root.querySelector<HTMLButtonElement>("#btn-retry")!;
  const btnNext = root.querySelector<HTMLButtonElement>("#btn-next")!;
  const btnNextRound = root.querySelector<HTMLButtonElement>("#btn-next-round")!;
  const roundProgressEl = root.querySelector<HTMLElement>("#round-progress")!;
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

  let state: TestState = "idle";
  let recordingSession: { stop: () => void } | null = null;
  let currentQuestion: SingTestQuestion | null = null;
  let scoredAttempts = 0;
  let lastPassed = false;
  let roundResults: RoundQuestionResult[] = [];
  let roundId = crypto.randomUUID();

  function resetRound(): void {
    roundId = crypto.randomUUID();
    roundResults = [];
    currentQuestion = null;
    scoredAttempts = 0;
    lastPassed = false;
    resultEl.hidden = true;
  }

  function currentQuestionNumber(): number {
    return roundResults.length + 1;
  }

  function isLastQuestionInRound(): boolean {
    return roundResults.length >= QUESTIONS_PER_ROUND - 1;
  }

  function nextStepButtonLabel(): string {
    return isLastQuestionInRound() ? "Finish round" : "Next question";
  }

  function syncRoundProgress(): void {
    if (state === "roundSummary") {
      roundProgressEl.hidden = true;
      return;
    }
    roundProgressEl.hidden = false;
    roundProgressEl.textContent = `Round — question ${currentQuestionNumber()} of ${QUESTIONS_PER_ROUND}`;
  }

  function setState(next: TestState): void {
    state = next;
    syncRoundProgress();
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
    resetRound();
    if (state === "result" || state === "roundSummary") {
      setState("idle");
    } else if (state === "ready") {
      setState("idle");
    } else {
      syncRoundProgress();
      updateUi();
    }
  }

  function syncChordTypePicker(): void {
    if (!config.showChordTypePicker) return;
    for (const input of chordTypeInputs) {
      input.checked = isChordTypeSelected(input.value);
    }
  }

  function resetQuestionForPreferenceChange(): void {
    resetRound();
    if (state === "result" || state === "roundSummary") {
      setState("idle");
    } else if (state === "ready") {
      setState("idle");
    } else {
      syncRoundProgress();
      updateUi();
    }
  }

  function setChordTypePreference(id: string, selected: boolean): void {
    if (!config.showChordTypePicker) return;
    setChordTypeSelected(id, selected);
    syncChordTypePicker();
    resetQuestionForPreferenceChange();
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
    resetQuestionForPreferenceChange();
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
    resetQuestionForPreferenceChange();
    updateUi();
  }

  function updateUi(): void {
    const inRoundSummary = state === "roundSummary";
    const settingsLocked =
      state === "playing" || state === "recording" || inRoundSummary;
    const noChordTypesSelected =
      config.showChordTypePicker && getActiveChordTypes().length === 0;
    const noInversionsSelected =
      config.showInversionPicker && getActiveInversions().length === 0;
    const noIntervalsSelected =
      config.showIntervalPicker && getActiveIntervals().length === 0;
    const settingsIncomplete = Boolean(
      noChordTypesSelected || noInversionsSelected || noIntervalsSelected,
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

    btnPlay.disabled =
      inRoundSummary ||
      state === "playing" ||
      state === "recording" ||
      settingsIncomplete;
    btnRecord.disabled = state !== "ready" && state !== "recording";
    btnDone.hidden = state !== "recording";
    btnDone.disabled = state !== "recording";
    const showResultActions = state === "result";
    const canRetrySameQuestion =
      showResultActions &&
      !lastPassed &&
      scoredAttempts < MAX_ATTEMPTS_PER_QUESTION;
    const canGoToNextQuestion =
      showResultActions &&
      (lastPassed || scoredAttempts >= MAX_ATTEMPTS_PER_QUESTION);

    btnRetry.hidden = !canRetrySameQuestion || inRoundSummary;
    btnNext.hidden = !canGoToNextQuestion || inRoundSummary;
    if (canGoToNextQuestion && !inRoundSummary) {
      btnNext.textContent = nextStepButtonLabel();
    }
    btnNextRound.hidden = !inRoundSummary;
    btnPlay.hidden = showResultActions || inRoundSummary;
    btnRecord.hidden = showResultActions || inRoundSummary;

    switch (state) {
      case "roundSummary":
        break;
      case "idle":
        statusEl.textContent =
          noChordTypesSelected && config.status.noChordTypes
            ? config.status.noChordTypes
            : noInversionsSelected && config.status.noInversions
              ? config.status.noInversions
              : noIntervalsSelected && config.status.noIntervals
                ? config.status.noIntervals
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
  }

  function persistAttempt(score: ScoreResult): void {
    if (!currentQuestion) return;
    const record = buildAttemptRecord(
      {
        exerciseId: config.exerciseId,
        roundId,
        questionIndex: roundResults.length,
        showVoicePicker: config.showVoicePicker,
        showChordFilters: Boolean(
          config.showChordTypePicker || config.showInversionPicker,
        ),
        showIntervalFilters: Boolean(config.showIntervalPicker),
      },
      currentQuestion,
      score.centsOff,
      score.passed,
      scoredAttempts + 1,
    );
    void saveAttempt(record);
  }

  function showResult(score: ScoreResult): void {
    scoredAttempts += 1;
    lastPassed = score.passed;
    persistAttempt(score);

    const triesLeft = MAX_ATTEMPTS_PER_QUESTION - scoredAttempts;
    const nextLabel = nextStepButtonLabel();
    let attemptNote = "";
    if (!score.passed) {
      if (triesLeft > 0) {
        attemptNote = `<p class="result-attempts">${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left on this question.</p>`;
      } else {
        attemptNote = `<p class="result-attempts">No tries left — tap ${nextLabel} when you are ready.</p>`;
      }
    }

    resultEl.hidden = false;
    resultEl.className = `result ${score.passed ? "result-pass" : "result-fail"}`;
    resultEl.innerHTML = `
      <p class="result-verdict">${score.passed ? "Correct" : "Not quite"}</p>
      <p class="result-detail">${score.message}</p>
      <p class="result-meta">Detected ${score.detectedHz.toFixed(1)} Hz (target ${score.targetHz.toFixed(1)} Hz — ${currentQuestion?.target.name ?? "?"})</p>
      ${attemptNote}
    `;
    const onLastQuestion = isLastQuestionInRound();
    statusEl.textContent = score.passed
      ? onLastQuestion
        ? `Correct — tap ${nextLabel} when you are ready.`
        : config.status.pass
      : triesLeft > 0
        ? config.status.fail
        : onLastQuestion
          ? `Out of tries — tap ${nextLabel} to see your round score.`
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
    if (isPlaying()) return;

    try {
      await ensureAudioReady();
      if (state === "idle" || !currentQuestion) {
        currentQuestion = config.prepareQuestion();
        scoredAttempts = 0;
        lastPassed = false;
      }
      setState("playing");
      await config.playReference(currentQuestion);
      setState("ready");
    } catch {
      showError("Could not play audio. Tap Play again after interacting with the page.");
      setState("idle");
    }
  }

  async function handleRecordStart(): Promise<void> {
    if (state === "recording") return;

    try {
      await ensureAudioReady();
      setState("recording");
      livePitchEl.textContent = "Listening…";

      recordingSession = await startRecording({
        targetHz: currentQuestion?.target.hz,
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

    if (!currentQuestion) {
      showError("No reference — press Play first.");
      return;
    }

    const outcome = scoreFromSamples(samplesHz, currentQuestion.target.hz);
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
    stopMediaStream();
    resultEl.hidden = true;
    void handlePlay();
  }

  function showRoundSummary(): void {
    const summary = summarizeRound(roundResults);
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
    statusEl.textContent = "Round finished — review your score, then start the next round.";
    setState("roundSummary");
  }

  function recordQuestionOutcome(): void {
    roundResults.push({
      questionIndex: roundResults.length,
      outcome: classifyQuestionOutcome(lastPassed, scoredAttempts),
      question: currentQuestion ?? undefined,
    });
  }

  function handleNextQuestion(): void {
    stopMediaStream();
    recordQuestionOutcome();

    if (roundResults.length >= QUESTIONS_PER_ROUND) {
      showRoundSummary();
      return;
    }

    currentQuestion = null;
    scoredAttempts = 0;
    lastPassed = false;
    resultEl.hidden = true;
    setState("idle");
    void handlePlay();
  }

  function handleNextRound(): void {
    stopMediaStream();
    resetRound();
    setState("idle");
  }

  btnPlay.addEventListener("click", () => {
    unlockAudio();
    void handlePlay();
  });
  btnRecord.addEventListener("click", () => {
    unlockAudio();
    void handleRecordStart();
  });
  btnDone.addEventListener("click", handleDone);
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

  syncVoicePicker();
  syncChordTypePicker();
  syncInversionPicker();
  syncIntervalPicker();
  syncRoundProgress();
  updateUi();
}
