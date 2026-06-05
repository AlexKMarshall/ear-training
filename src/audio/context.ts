let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Call synchronously inside a click/tap handler before any `await`.
 * iOS Safari only unlocks audio output when resume() runs in the gesture
 * call stack — an awaited resume() later is too late and playback is silent.
 */
export function unlockAudio(): AudioContext {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

/** Wait until the audio context is running (call after unlockAudio on user gesture). */
export async function ensureAudioReady(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state !== "running") {
    await ctx.resume();
  }
  return ctx;
}
