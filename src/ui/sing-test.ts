import { startRecording, stopMediaStream } from "../audio/capture.ts";
import { ensureAudioReady, unlockAudio } from "../audio/context.ts";
import { isPlaying } from "../audio/playback.ts";
import { MIN_VALID_SAMPLES } from "../config.ts";
import type { TargetNote } from "../notes.ts";
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
import { scoreFromSamples } from "../pitch/score.ts";
import type { ScoreResult } from "../pitch/score.ts";

type TestState = "idle" | "playing" | "ready" | "recording" | "result";

import type { ChordQuestion } from "../chords.ts";

export interface SingTestQuestion {
  target: TargetNote;
  /** Present when the reference is a chord rather than a single tone. */
  chord?: ChordQuestion;
}

export interface SingTestConfig {
  title: string;
  subtitle: string;
  playButtonLabel: string;
  showVoicePicker: boolean;
  showChordTypePicker?: boolean;
  showInversionPicker?: boolean;
  status: {
    idle: string;
    playing: string;
    ready: string;
    recording: string;
    pass: string;
    fail: string;
    /** Shown in idle state when chord type picker is on but nothing is selected. */
    noChordTypes?: string;
    /** Shown in idle state when inversion picker is on but nothing is selected. */
    noInversions?: string;
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

  root.innerHTML = `
    <main class="app">
      <nav class="nav">
        <a href="/" class="nav-back">← All tests</a>
      </nav>

      <header class="header">
        <h1>${config.title}</h1>
        <p class="subtitle">${config.subtitle}</p>
      </header>

      ${voicePickerHtml}
      ${chordTypePickerHtml}
      ${inversionPickerHtml}

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

  let state: TestState = "idle";
  let recordingSession: { stop: () => void } | null = null;
  let currentQuestion: SingTestQuestion | null = null;

  function setState(next: TestState): void {
    state = next;
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
    currentQuestion = null;
    if (state === "result") {
      resultEl.hidden = true;
      setState("idle");
    } else if (state === "ready") {
      setState("idle");
    }
  }

  function syncChordTypePicker(): void {
    if (!config.showChordTypePicker) return;
    for (const input of chordTypeInputs) {
      input.checked = isChordTypeSelected(input.value);
    }
  }

  function resetQuestionForPreferenceChange(): void {
    currentQuestion = null;
    if (state === "result") {
      resultEl.hidden = true;
      setState("idle");
    } else if (state === "ready") {
      setState("idle");
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

  function updateUi(): void {
    const settingsLocked = state === "playing" || state === "recording";
    const noChordTypesSelected =
      config.showChordTypePicker && getActiveChordTypes().length === 0;
    const noInversionsSelected =
      config.showInversionPicker && getActiveInversions().length === 0;
    const settingsIncomplete = noChordTypesSelected || noInversionsSelected;
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

    btnPlay.disabled =
      state === "playing" || state === "recording" || settingsIncomplete;
    btnRecord.disabled = state !== "ready" && state !== "recording";
    btnDone.hidden = state !== "recording";
    btnDone.disabled = state !== "recording";
    btnRetry.hidden = state !== "result";
    btnPlay.hidden = state === "result";
    btnRecord.hidden = state === "result";

    switch (state) {
      case "idle":
        statusEl.textContent =
          noChordTypesSelected && config.status.noChordTypes
            ? config.status.noChordTypes
            : noInversionsSelected && config.status.noInversions
              ? config.status.noInversions
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

  function showResult(score: ScoreResult): void {
    resultEl.hidden = false;
    resultEl.className = `result ${score.passed ? "result-pass" : "result-fail"}`;
    resultEl.innerHTML = `
      <p class="result-verdict">${score.passed ? "Correct" : "Not quite"}</p>
      <p class="result-detail">${score.message}</p>
      <p class="result-meta">Detected ${score.detectedHz.toFixed(1)} Hz (target ${score.targetHz.toFixed(1)} Hz — ${currentQuestion?.target.name ?? "?"})</p>
    `;
    statusEl.textContent = score.passed
      ? config.status.pass
      : config.status.fail;
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
    currentQuestion = null;
    resultEl.hidden = true;
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

  syncVoicePicker();
  syncChordTypePicker();
  syncInversionPicker();
  updateUi();
}
