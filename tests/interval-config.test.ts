import { describe, expect, it } from "vitest"
import {
  DIATONIC_MAJOR_INTERVAL_IDS,
  getIntervalById,
  getIntervalsByIds,
  INTERVAL_2A_IDS,
  INTERVALS,
} from "../src/interval-config.ts"

describe("INTERVALS registry", () => {
  it("has unique ids", () => {
    const ids = INTERVALS.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("maps diatonic ids to unique semitones 1–12", () => {
    const diatonic = getIntervalsByIds(DIATONIC_MAJOR_INTERVAL_IDS)
    expect(diatonic).toHaveLength(12)
    const semitones = diatonic.map((entry) => entry.semitones)
    expect(new Set(semitones).size).toBe(12)
    expect(Math.min(...semitones)).toBe(1)
    expect(Math.max(...semitones)).toBe(12)
  })

  it("includes tier 2a ids in the diatonic set", () => {
    for (const id of INTERVAL_2A_IDS) {
      expect(DIATONIC_MAJOR_INTERVAL_IDS).toContain(id)
    }
  })

  it("keeps only tier 2a enabled for the v1 picker until planner wiring", () => {
    const enabledIds = INTERVALS.filter((entry) => entry.enabled).map((entry) => entry.id)
    expect(enabledIds).toEqual([...INTERVAL_2A_IDS])
  })
})

describe("getIntervalById", () => {
  it("returns labels for new diatonic entries", () => {
    expect(getIntervalById("minor-second")?.label).toBe("Minor 2nd")
    expect(getIntervalById("tritone")?.label).toBe("Tritone")
    expect(getIntervalById("major-seventh")?.label).toBe("Major 7th")
  })
})
