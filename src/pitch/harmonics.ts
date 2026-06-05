/** Integer factors above the octave (2×) that pitch detectors often lock onto. */
const HARMONIC_FACTORS = [3, 4, 5, 6, 7, 8] as const

/** How close detected/target must be to an integer harmonic factor. */
const RATIO_TOLERANCE = 0.18

/**
 * When autocorrelation locks onto a strong overtone (e.g. 3× the fundamental),
 * map the reading back toward the fundamental using the known target pitch.
 *
 * Octave errors (2× / ½×) are intentionally not folded — those stay wrong so
 * we can still coach "wrong octave" feedback.
 */
export function correctHarmonicPitch(detectedHz: number, targetHz: number): number {
  if (detectedHz <= 0 || targetHz <= 0) {
    return detectedHz
  }

  const ratio = detectedHz / targetHz

  for (const n of HARMONIC_FACTORS) {
    if (Math.abs(ratio - n) < RATIO_TOLERANCE) {
      return detectedHz / n
    }
    if (Math.abs(ratio * n - 1) < RATIO_TOLERANCE) {
      return detectedHz * n
    }
  }

  return detectedHz
}
