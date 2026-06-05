import { TOLERANCE_CENTS } from "../config.ts"
import { medianSorted } from "../util/array.ts"
import { correctHarmonicPitch } from "./harmonics.ts"

export interface ScoreResult {
  passed: boolean
  centsOff: number
  detectedHz: number
  targetHz: number
  message: string
  octaveHint: string | null
}

export function centsOff(detectedHz: number, targetHz: number): number {
  return 1200 * Math.log2(detectedHz / targetHz)
}

function formatCentsMessage(cents: number): string {
  const rounded = Math.round(cents)
  if (Math.abs(rounded) <= 3) {
    return "On pitch"
  }
  if (rounded > 0) {
    return `${rounded} cents sharp`
  }
  return `${Math.abs(rounded)} cents flat`
}

function detectOctaveHint(detectedHz: number, targetHz: number): string | null {
  const ratio = detectedHz / targetHz
  const doubleCents = centsOff(detectedHz, targetHz * 2)
  const halfCents = centsOff(detectedHz, targetHz / 2)

  if (Math.abs(doubleCents) <= 50 && ratio > 1.5) {
    return "Wrong octave — you sang too high"
  }
  if (Math.abs(halfCents) <= 50 && ratio < 0.75) {
    return "Wrong octave — you sang too low"
  }
  return null
}

export function scorePitch(
  detectedHz: number,
  targetHz: number,
  toleranceCents = TOLERANCE_CENTS,
): ScoreResult {
  const cents = centsOff(detectedHz, targetHz)
  const passed = Math.abs(cents) <= toleranceCents
  const octaveHint = detectOctaveHint(detectedHz, targetHz)

  let message: string
  if (passed) {
    message = `Correct! ${formatCentsMessage(cents)}.`
  } else if (octaveHint) {
    message = octaveHint
  } else if (cents > 0) {
    message = `Not quite — ${formatCentsMessage(cents)}.`
  } else {
    message = `Not quite — ${formatCentsMessage(cents)}.`
  }

  return {
    passed,
    centsOff: cents,
    detectedHz,
    targetHz,
    message,
    octaveHint,
  }
}

export function scoreFromSamples(
  samplesHz: number[],
  targetHz: number,
  toleranceCents = TOLERANCE_CENTS,
): ScoreResult | { error: string } {
  if (samplesHz.length === 0) {
    return {
      error:
        "Could not detect your pitch. Try a quieter room, sing louder, or hold the note steady.",
    }
  }

  const corrected = samplesHz.map((hz) => correctHarmonicPitch(hz, targetHz))
  const sorted = [...corrected].sort((a, b) => a - b)
  const detectedHz = medianSorted(sorted)

  return scorePitch(detectedHz, targetHz, toleranceCents)
}
