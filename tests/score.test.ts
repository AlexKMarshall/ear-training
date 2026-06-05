import { describe, expect, it } from "vitest"
import { centsOff, scoreFromSamples, scorePitch } from "../src/pitch/score.ts"

describe("centsOff", () => {
  it("returns 0 for exact match", () => {
    expect(centsOff(261.63, 261.63)).toBeCloseTo(0, 5)
  })

  it("returns positive when sharp", () => {
    expect(centsOff(277.18, 261.63)).toBeGreaterThan(0)
  })

  it("returns negative when flat", () => {
    expect(centsOff(246.94, 261.63)).toBeLessThan(0)
  })
})

describe("scorePitch", () => {
  it("passes within tolerance", () => {
    const result = scorePitch(263, 261.63, 40)
    expect(result.passed).toBe(true)
  })

  it("fails outside tolerance", () => {
    const result = scorePitch(280, 261.63, 40)
    expect(result.passed).toBe(false)
  })

  it("detects wrong octave too high", () => {
    const result = scorePitch(523.26, 261.63, 40)
    expect(result.passed).toBe(false)
    expect(result.octaveHint).toContain("too high")
  })
})

describe("scoreFromSamples", () => {
  it("returns error for empty samples", () => {
    const result = scoreFromSamples([], 261.63)
    expect("error" in result).toBe(true)
  })

  it("scores median of samples", () => {
    const samples = Array(20).fill(262)
    const result = scoreFromSamples(samples, 261.63, 40)
    expect("error" in result).toBe(false)
    if (!("error" in result)) {
      expect(result.passed).toBe(true)
    }
  })

  it("corrects frames that locked onto a harmonic before scoring", () => {
    const targetHz = 207.7
    const samples = Array(20).fill(601.4)
    const result = scoreFromSamples(samples, targetHz, 40)
    expect("error" in result).toBe(false)
    if (!("error" in result)) {
      expect(result.detectedHz).toBeCloseTo(601.4 / 3, 0)
    }
  })
})
