import { describe, expect, it } from "vitest"
import {
  getEligibleInversionIds,
  getEligibleTriadQualityIds,
} from "../src/curriculum/chord-tiers.ts"
import type { SessionPlanner } from "../src/session/planner.ts"
import {
  prepareChordInversionIdExercise,
  prepareChordQualityIdExercise,
} from "../src/ui/chord-identify-session.ts"
import { passingChordMajorSecondHistory, passingLevel2History } from "./fixtures/attempts.ts"

describe("prepareChordQualityIdExercise", () => {
  it("draws triad quality from planner and anchors range on bottom pitch", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "minor-triad",
    }
    const exercise = prepareChordQualityIdExercise(
      passingLevel2History(),
      planner,
      { lowMidi: 48, highMidi: 55 },
      () => 0,
    )

    expect(exercise.chordTypeId).toBe("minor-triad")
    expect(exercise.contentTierId).toBe("chord-quality-root")
    expect(exercise.inversionId).toBe("root")
    expect(exercise.eligibleTagIds).toEqual(getEligibleTriadQualityIds())
    expect(exercise.voicingPositionId).toBeUndefined()
    expect(exercise.chord.targetIndex).toBe(0)
    expect(exercise.target.midi).toBeGreaterThanOrEqual(48)
    expect(exercise.target.midi).toBeLessThanOrEqual(55)
  })

  it("respects URL curriculum lesson tier", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "major-triad",
    }
    const exercise = prepareChordQualityIdExercise(
      [],
      planner,
      { lowMidi: 48, highMidi: 67 },
      () => 0,
      { practiceModeId: "chord-quality-id", contentTierId: "chord-quality-root" },
    )

    expect(exercise.chordTypeId).toBe("major-triad")
    expect(exercise.contentTierId).toBe("chord-quality-root")
    expect(exercise.inversionId).toBe("root")
  })

  it("uses 1st inversion from URL curriculum lesson tier", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "minor-triad",
    }
    const exercise = prepareChordQualityIdExercise(
      [],
      planner,
      { lowMidi: 48, highMidi: 67 },
      () => 0,
      { practiceModeId: "chord-quality-id", contentTierId: "chord-quality-first" },
    )

    expect(exercise.chordTypeId).toBe("minor-triad")
    expect(exercise.contentTierId).toBe("chord-quality-first")
    expect(exercise.inversionId).toBe("first")
  })
})

describe("prepareChordInversionIdExercise", () => {
  it("draws inversion from planner with major triad fixed by tier", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "second",
    }
    const exercise = prepareChordInversionIdExercise(
      passingChordMajorSecondHistory(),
      planner,
      { lowMidi: 48, highMidi: 55 },
      () => 0,
    )

    expect(exercise.chordTypeId).toBe("major-triad")
    expect(exercise.contentTierId).toBe("chord-inversion-major")
    expect(exercise.inversionId).toBe("second")
    expect(exercise.eligibleTagIds).toEqual(getEligibleInversionIds())
    expect(exercise.chord.targetIndex).toBe(0)
    expect(exercise.target.midi).toBeGreaterThanOrEqual(48)
    expect(exercise.target.midi).toBeLessThanOrEqual(55)
  })

  it("respects URL curriculum lesson tier", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "first",
    }
    const exercise = prepareChordInversionIdExercise(
      [],
      planner,
      { lowMidi: 48, highMidi: 67 },
      () => 0,
      { practiceModeId: "chord-inversion-id", contentTierId: "chord-inversion-major" },
    )

    expect(exercise.chordTypeId).toBe("major-triad")
    expect(exercise.contentTierId).toBe("chord-inversion-major")
    expect(exercise.inversionId).toBe("first")
  })
})
