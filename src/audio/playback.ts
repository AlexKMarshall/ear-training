import { MELODIC_INTERVAL_GAP_MS, PLAYBACK_DURATION_MS } from "../config.ts"
import { ensurePianoReady } from "./piano.ts"

let playing = false

/** Extra time for the piano sample release tail after the nominal duration. */
const RELEASE_TAIL_MS = 600

export function isPlaying(): boolean {
  return playing
}

async function playMidiNotes(midis: number[], durationMs: number, velocity: number): Promise<void> {
  if (playing) return

  playing = true
  const durationSec = durationMs / 1000

  try {
    const piano = await ensurePianoReady()

    for (const midi of midis) {
      piano.start({ note: midi, duration: durationSec, velocity })
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, durationMs + RELEASE_TAIL_MS)
    })
  } finally {
    playing = false
  }
}

/** Play a single reference note from the sampled piano. */
export async function playTargetNote(
  midi: number,
  durationMs = PLAYBACK_DURATION_MS,
): Promise<void> {
  await playMidiNotes([midi], durationMs, 100)
}

/** Play three simultaneous notes (chord reference). */
export async function playChord(
  midis: [number, number, number],
  durationMs = PLAYBACK_DURATION_MS,
): Promise<void> {
  await playMidiNotes(midis, durationMs, 80)
}

/** Play two notes in sequence (low then high). */
export async function playMelodicSequence(
  midis: [number, number],
  durationMs = PLAYBACK_DURATION_MS,
  gapMs = MELODIC_INTERVAL_GAP_MS,
): Promise<void> {
  if (playing) return

  playing = true
  const durationSec = durationMs / 1000

  try {
    const piano = await ensurePianoReady()
    piano.start({
      note: midis[0],
      duration: durationSec,
      velocity: 100,
    })
    await new Promise<void>((resolve) => {
      setTimeout(resolve, durationMs + RELEASE_TAIL_MS)
    })
    await new Promise<void>((resolve) => {
      setTimeout(resolve, gapMs)
    })
    piano.start({
      note: midis[1],
      duration: durationSec,
      velocity: 100,
    })
    await new Promise<void>((resolve) => {
      setTimeout(resolve, durationMs + RELEASE_TAIL_MS)
    })
  } finally {
    playing = false
  }
}

/** Play two simultaneous notes (harmonic interval). */
export async function playDyad(
  midis: [number, number],
  durationMs = PLAYBACK_DURATION_MS,
): Promise<void> {
  await playMidiNotes(midis, durationMs, 80)
}
