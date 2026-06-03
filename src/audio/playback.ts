import { PLAYBACK_DURATION_MS } from "../config.ts";
import { ensureAudioReady } from "./context.ts";

let playing = false;

export function isPlaying(): boolean {
  return playing;
}

/**
 * Play a single reference tone with a short fade in/out.
 * Swap the oscillator for AudioBufferSourceNode + sample later without changing callers.
 */
export async function playTargetNote(
  frequencyHz: number,
  durationMs = PLAYBACK_DURATION_MS,
): Promise<void> {
  if (playing) return;

  const ctx = await ensureAudioReady();
  playing = true;

  const now = ctx.currentTime;
  const durationSec = durationMs / 1000;
  const attack = 0.02;
  const release = 0.08;

  const oscillator = ctx.createOscillator();
  oscillator.type = "triangle";
  oscillator.frequency.value = frequencyHz;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.35, now + attack);
  gain.gain.setValueAtTime(0.35, now + durationSec - release);
  gain.gain.linearRampToValueAtTime(0, now + durationSec);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + durationSec);

  await new Promise<void>((resolve) => {
    oscillator.onended = () => {
      playing = false;
      resolve();
    };
  });
}

/** Extension point: play three simultaneous notes (full test). */
export async function playChord(
  frequenciesHz: [number, number, number],
  durationMs = PLAYBACK_DURATION_MS,
): Promise<void> {
  if (playing) return;

  const ctx = await ensureAudioReady();
  playing = true;

  const now = ctx.currentTime;
  const durationSec = durationMs / 1000;
  const attack = 0.02;
  const release = 0.08;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.25, now + attack);
  master.gain.setValueAtTime(0.25, now + durationSec - release);
  master.gain.linearRampToValueAtTime(0, now + durationSec);
  master.connect(ctx.destination);

  const oscillators = frequenciesHz.map((hz) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = hz;
    osc.connect(master);
    osc.start(now);
    osc.stop(now + durationSec);
    return osc;
  });

  await new Promise<void>((resolve) => {
    oscillators[2]!.onended = () => {
      playing = false;
      resolve();
    };
  });
}
