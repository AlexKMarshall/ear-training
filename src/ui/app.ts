import { startRecording, stopMediaStream } from "../audio/capture.ts";
import { ensureAudioReady } from "../audio/context.ts";
import { isPlaying, playTargetNote } from "../audio/playback.ts";
import { MIN_VALID_SAMPLES, TARGET_HZ } from "../config.ts";
import { scoreFromSamples } from "../pitch/score.ts";
import type { ScoreResult } from "../pitch/score.ts";
import "./styles.css";

type AppState = "idle" | "playing" | "ready" | "recording" | "result";

export function mountApp(root: HTMLElement): void {
  root.innerHTML = `
    <main class="app">
      <header class="header">
        <h1>Ear Training</h1>
        <p class="subtitle">Sing back the note you hear (C4)</p>
      </header>

      <section class="card" aria-live="polite">
        <p id="status" class="status">Press Play to hear the reference note.</p>
        <p id="live-pitch" class="live-pitch" hidden></p>
        <div id="result" class="result" hidden></div>
      </section>

      <div class="actions">
        <button type="button" id="btn-play" class="btn btn-primary">Play note</button>
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

  let state: AppState = "idle";
  let recordingSession: { stop: () => void } | null = null;

  function setState(next: AppState): void {
    state = next;
    updateUi();
  }

  function updateUi(): void {
    btnPlay.disabled = state === "playing" || state === "recording";
    btnRecord.disabled = state !== "ready" && state !== "recording";
    btnDone.hidden = state !== "recording";
    btnDone.disabled = state !== "recording";
    btnRetry.hidden = state !== "result";
    btnPlay.hidden = state === "result";
    btnRecord.hidden = state === "result";

    switch (state) {
      case "idle":
        statusEl.textContent = "Press Play to hear the reference note.";
        livePitchEl.hidden = true;
        resultEl.hidden = true;
        break;
      case "playing":
        statusEl.textContent = "Listen…";
        livePitchEl.hidden = true;
        resultEl.hidden = true;
        break;
      case "ready":
        statusEl.textContent =
          "Sing the note you heard, then tap Start singing when ready.";
        livePitchEl.hidden = true;
        resultEl.hidden = true;
        break;
      case "recording":
        statusEl.textContent = "Singing… tap Done when finished.";
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
      <p class="result-meta">Detected ${score.detectedHz.toFixed(1)} Hz (target ${score.targetHz.toFixed(1)} Hz)</p>
    `;
    statusEl.textContent = score.passed
      ? "Nice work!"
      : "Keep practicing — try again.";
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
      setState("playing");
      await playTargetNote(TARGET_HZ);
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

    const outcome = scoreFromSamples(samplesHz, TARGET_HZ);
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
    setState("idle");
  }

  btnPlay.addEventListener("click", () => void handlePlay());
  btnRecord.addEventListener("click", () => void handleRecordStart());
  btnDone.addEventListener("click", handleDone);
  btnRetry.addEventListener("click", handleRetry);

  updateUi();
}
