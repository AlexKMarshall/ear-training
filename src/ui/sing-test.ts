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
  status: {
    idle: string;
    playing: string;
    ready: string;
    recording: string;
    pass: string;
    fail: string;
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

  function updateUi(): void {
    const voiceLocked = state === "playing" || state === "recording";
    if (voicePickerEl) {
      voicePickerEl.disabled = voiceLocked;
      for (const input of voiceInputs) {
        input.disabled = voiceLocked;
      }
    }

    btnPlay.disabled = state === "playing" || state === "recording";
    btnRecord.disabled = state !== "ready" && state !== "recording";
    btnDone.hidden = state !== "recording";
    btnDone.disabled = state !== "recording";
    btnRetry.hidden = state !== "result";
    btnPlay.hidden = state === "result";
    btnRecord.hidden = state === "result";

    switch (state) {
      case "idle":
        statusEl.textContent = config.status.idle;
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

  syncVoicePicker();
  updateUi();
}
