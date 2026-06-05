import { describe, expect, it } from "vitest"
import { correctHarmonicPitch } from "../src/pitch/harmonics.ts"
import { centsOff } from "../src/pitch/score.ts"

describe("correctHarmonicPitch", () => {
  const targetHz = 207.7 // ~G#3

  it("folds a detected 3rd harmonic back toward the fundamental", () => {
    const corrected = correctHarmonicPitch(601.4, targetHz)
    expect(Math.abs(centsOff(corrected, targetHz))).toBeLessThan(
      Math.abs(centsOff(601.4, targetHz)),
    )
    expect(corrected).toBeCloseTo(601.4 / 3, 0)
  })

  it("leaves a good fundamental detection unchanged", () => {
    expect(correctHarmonicPitch(208, targetHz)).toBe(208)
  })

  it("does not fold an octave error into a pass", () => {
    const octaveHigh = targetHz * 2
    expect(correctHarmonicPitch(octaveHigh, targetHz)).toBe(octaveHigh)
  })

  it("folds a detected 4th harmonic", () => {
    const fourth = targetHz * 4
    expect(correctHarmonicPitch(fourth, targetHz)).toBeCloseTo(targetHz, 0)
  })
})
