import { describe, expect, it } from "vitest"
import { getEligibleVoicingPositionIds } from "../src/curriculum/chord-tiers.ts"
import type { SessionPlanner } from "../src/session/planner.ts"
import { prepareChordExercise } from "../src/ui/chord-session.ts"
import {
  passingChordMajorSecondHistory,
  passingMelodicSing2bHistory,
  passingThroughHarmonicSing2aHistory,
} from "./fixtures/attempts.ts"

describe("prepareChordExercise", () => {
  it("uses planner voicing position and attaches tier metadata", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "middle",
    }
    const exercise = prepareChordExercise(
      passingThroughHarmonicSing2aHistory(),
      planner,
      { lowMidi: 48, highMidi: 67 },
      () => 0,
    )

    expect(exercise.chordTypeId).toBe("major-triad")
    expect(exercise.contentTierId).toBe("chord-major-root")
    expect(exercise.eligibleTagIds).toEqual(getEligibleVoicingPositionIds())
    expect(exercise.inversionId).toBe("root")
    expect(exercise.voicingPositionId).toBe("middle")
    expect(exercise.chord).toBeDefined()
    expect(exercise.target.midi).toBeGreaterThanOrEqual(48)
    expect(exercise.target.midi).toBeLessThanOrEqual(67)
  })

  it("anchors range on the drawn voicing position", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "top",
    }
    const exercise = prepareChordExercise(
      passingThroughHarmonicSing2aHistory(),
      planner,
      { lowMidi: 55, highMidi: 55 },
      () => 0,
    )

    expect(exercise.voicingPositionId).toBe("top")
    expect(exercise.target.midi).toBe(55)
    expect(exercise.chord.targetIndex).toBe(2)
  })

  it("draws major triad first inversion for chord-major-first tier", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "bottom",
    }
    const exercise = prepareChordExercise(
      passingMelodicSing2bHistory(),
      planner,
      { lowMidi: 48, highMidi: 67 },
      () => 0,
      { practiceModeId: "chord-sing", contentTierId: "chord-major-first" },
    )

    expect(exercise.chordTypeId).toBe("major-triad")
    expect(exercise.contentTierId).toBe("chord-major-first")
    expect(exercise.inversionId).toBe("first")
  })

  it("draws minor triad root for chord-minor-root tier", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "middle",
    }
    const exercise = prepareChordExercise(
      passingThroughHarmonicSing2aHistory(),
      planner,
      { lowMidi: 48, highMidi: 67 },
      () => 0,
      { practiceModeId: "chord-sing", contentTierId: "chord-minor-root" },
    )

    expect(exercise.chordTypeId).toBe("minor-triad")
    expect(exercise.contentTierId).toBe("chord-minor-root")
    expect(exercise.inversionId).toBe("root")
  })

  it("draws major triad second inversion for chord-major-second tier", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "bottom",
    }
    const exercise = prepareChordExercise(
      passingChordMajorSecondHistory(),
      planner,
      { lowMidi: 48, highMidi: 67 },
      () => 0,
      { practiceModeId: "chord-sing", contentTierId: "chord-major-second" },
    )

    expect(exercise.chordTypeId).toBe("major-triad")
    expect(exercise.contentTierId).toBe("chord-major-second")
    expect(exercise.inversionId).toBe("second")
  })
})
