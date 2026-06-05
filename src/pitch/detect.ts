import { PitchDetector } from "pitchy"
import { ANALYSER_FFT_SIZE, MIN_CLARITY, MIN_RMS } from "../config.ts"
import { medianSorted } from "../util/array.ts"

const detector = PitchDetector.forFloat32Array(ANALYSER_FFT_SIZE)
const timeDomainBuffer = new Float32Array(ANALYSER_FFT_SIZE)

export interface PitchSample {
  frequencyHz: number
  clarity: number
}

export function computeRms(samples: Float32Array): number {
  let sum = 0
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]
    if (sample === undefined) {
      continue
    }
    sum += sample * sample
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
  return medianSorted(sorted)
}
