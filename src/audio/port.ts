import { ensureAudioReady, unlockAudio } from "./context.ts"
import { isPlaying as isGlobalPlaybackBusy } from "./playback.ts"

export interface AudioPort {
  unlock(): AudioContext
  ensureReady(): Promise<AudioContext>
  isPlaying(): boolean
}

export function createDefaultAudioPort(): AudioPort {
  return {
    unlock: unlockAudio,
    ensureReady: ensureAudioReady,
    isPlaying: isGlobalPlaybackBusy,
  }
}

/** Instant-ready audio for browser tests (no piano playback timing). */
export function createTestAudioPort(): AudioPort {
  const ctx = new AudioContext()
  return {
    unlock: () => ctx,
    ensureReady: async () => ctx,
    isPlaying: isGlobalPlaybackBusy,
  }
}
