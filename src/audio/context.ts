let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/** Call on first user gesture (required on iOS Safari). */
export async function ensureAudioReady(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  return ctx;
}

export function closeAudioContext(): void {
  if (audioContext) {
    void audioContext.close();
    audioContext = null;
  }
}
