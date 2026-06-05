import { PitchDetector } from "pitchy"
import { ANALYSER_FFT_SIZE, MIN_CLARITY, MIN_RMS } from "../config.ts"

const detector = PitchDetector.forFloat32Array(ANALYSER_FFT_SIZE)
const timeDomainBuffer = new Float32Array(ANALYSER_FFT_SIZE)

export interface PitchSample {
  frequencyHz: number
  clarity: number
}

export function computeRms(samples: Float32Array): number {
  let sum = 0
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i]! * samples[i]!
  }
  return Math.sqrt(sum / samples.length)
}

export function detectPitchFromAnalyser(
  analyser: AnalyserNode,
  sampleRate: number,
): PitchSample | null {
  analyser.getFloatTimeDomainData(timeDomainBuffer)

  const rms = computeRms(timeDomainBuffer)
  if (rms < MIN_RMS) {
    return null
  }

  const [frequencyHz, clarity] = detector.findPitch(timeDomainBuffer, sampleRate)

  if (frequencyHz <= 0 || clarity < MIN_CLARITY) {
    return null
  }

  return { frequencyHz, clarity }
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2
  }
  return sorted[mid]!
}
