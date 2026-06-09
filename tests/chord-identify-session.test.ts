import { describe, expect, it } from "vitest"
import { getEligibleTriadQualityIds } from "../src/curriculum/chord-tiers.ts"
import type { SessionPlanner } from "../src/session/planner.ts"
import { prepareChordQualityIdExercise } from "../src/ui/chord-identify-session.ts"
import { passingLevel2History } from "./fixtures/attempts.ts"

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
})
