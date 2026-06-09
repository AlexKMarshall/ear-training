import { describe, expect, it } from "vitest"
import { getEligibleDegreeIds } from "../src/curriculum/curriculum-lessons.ts"
import { getScaleDegreeById } from "../src/scale-degree-config.ts"
import type { SessionPlanner } from "../src/session/planner.ts"
import { prepareScaleDegreeExercise } from "../src/ui/scale-degree-session.ts"
import {
  attempt,
  passingIntroScaleDegreeHistory,
  passingThroughChordInversionMajorHistory,
  passingThroughHarmonic2bHistory,
} from "./fixtures/attempts.ts"
import { defined } from "./helpers/defined.ts"

describe("prepareScaleDegreeExercise", () => {
  it("uses planner tag and attaches intro tier metadata", () => {
    const introHistory = passingIntroScaleDegreeHistory()
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "fifth",
    }
    const { exercise, lessonTonicMidi } = prepareScaleDegreeExercise(
      introHistory,
      null,
      planner,
      { lowMidi: 48, highMidi: 67 },
      { practiceModeId: "scale-degree-sing", contentTierId: "degree-major-intro" },
    )

    expect(exercise.degreeId).toBe("fifth")
    expect(exercise.contentTierId).toBe("degree-major-intro")
    expect(exercise.eligibleTagIds).toEqual(getEligibleDegreeIds("degree-major-intro"))
    expect(exercise.scaleDegree.tonic.midi).toBe(lessonTonicMidi)
    expect(exercise.target.midi).toBe(lessonTonicMidi + 7)
  })

  it("uses major diatonic tier after harmonic identify at 2b passes", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "third",
    }
    const { exercise } = prepareScaleDegreeExercise(
      passingThroughHarmonic2bHistory(),
      null,
      planner,
      { lowMidi: 48, highMidi: 67 },
    )

    expect(exercise.degreeId).toBe("third")
    expect(exercise.contentTierId).toBe("degree-major-diatonic")
    expect(exercise.eligibleTagIds).toEqual(getEligibleDegreeIds("degree-major-diatonic"))
  })

  it("uses minor diatonic tier after major triad inversion identification completes", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "third",
    }
    const { exercise } = prepareScaleDegreeExercise(
      passingThroughChordInversionMajorHistory(),
      60,
      planner,
      { lowMidi: 48, highMidi: 67 },
    )

    expect(exercise.degreeId).toBe("third")
    expect(exercise.contentTierId).toBe("degree-minor-diatonic")
    expect(exercise.eligibleTagIds).toEqual(getEligibleDegreeIds("degree-minor-diatonic"))
    expect(exercise.target.midi).toBe(63)
  })

  it("keeps the same lesson tonic across questions", () => {
    const introHistory = passingIntroScaleDegreeHistory()
    const planner: SessionPlanner = {
      planNextExerciseTag: (_step, records) => (records.length === 0 ? "fourth" : "fifth"),
    }
    const first = prepareScaleDegreeExercise(
      introHistory,
      null,
      planner,
      { lowMidi: 48, highMidi: 67 },
      { practiceModeId: "scale-degree-sing", contentTierId: "degree-major-intro" },
    )
    const second = prepareScaleDegreeExercise(
      [
        ...introHistory,
        attempt({
          practiceModeId: "scale-degree-sing",
          degreeId: "fourth",
          contentTierId: "degree-major-intro",
          passed: true,
          attemptNumber: 1,
          centsOff: 5,
        }),
      ],
      first.lessonTonicMidi,
      planner,
      { lowMidi: 48, highMidi: 67 },
      { practiceModeId: "scale-degree-sing", contentTierId: "degree-major-intro" },
    )

    expect(second.lessonTonicMidi).toBe(first.lessonTonicMidi)
    expect(second.exercise.degreeId).toBe("fifth")
    expect(second.exercise.scaleDegree.tonic.midi).toBe(first.lessonTonicMidi)
  })

  it("resets tonic when lesson state is cleared", () => {
    const introHistory = passingIntroScaleDegreeHistory()
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "fifth",
    }

    let lessonTonicMidi: number | null = null
    const first = prepareScaleDegreeExercise(
      introHistory,
      lessonTonicMidi,
      planner,
      { lowMidi: 48, highMidi: 67 },
      { practiceModeId: "scale-degree-sing", contentTierId: "degree-major-intro" },
    )
    lessonTonicMidi = first.lessonTonicMidi

    lessonTonicMidi = null
    const second = prepareScaleDegreeExercise(
      introHistory,
      lessonTonicMidi,
      planner,
      { lowMidi: 48, highMidi: 67 },
      { practiceModeId: "scale-degree-sing", contentTierId: "degree-major-intro" },
    )

    expect(second.lessonTonicMidi).toBeTypeOf("number")
  })
})

describe("scaleDegreeQuestionForTag", () => {
  it("builds a question for each intro tier degree", () => {
    for (const id of getEligibleDegreeIds("degree-major-intro")) {
      const degree = defined(getScaleDegreeById(id), id)
      const { exercise } = prepareScaleDegreeExercise(
        passingIntroScaleDegreeHistory(),
        60,
        { planNextExerciseTag: () => id },
        undefined,
        { practiceModeId: "scale-degree-sing", contentTierId: "degree-major-intro" },
      )
      expect(exercise.degreeId).toBe(id)
      expect(exercise.target.midi).toBe(60 + degree.semitonesFromTonic)
    }
  })

  it("builds a question for each major diatonic tier degree", () => {
    for (const id of getEligibleDegreeIds("degree-major-diatonic")) {
      const degree = defined(getScaleDegreeById(id), id)
      const { exercise } = prepareScaleDegreeExercise(passingThroughHarmonic2bHistory(), 60, {
        planNextExerciseTag: () => id,
      })
      expect(exercise.degreeId).toBe(id)
      expect(exercise.target.midi).toBe(60 + degree.semitonesFromTonic)
    }
  })

  it("builds natural minor pitches for each minor diatonic degree id", () => {
    const expectedSemitones: Record<string, number> = {
      second: 2,
      third: 3,
      fourth: 5,
      fifth: 7,
      sixth: 8,
      seventh: 10,
      octave: 12,
    }
    for (const id of getEligibleDegreeIds("degree-minor-diatonic")) {
      const { exercise } = prepareScaleDegreeExercise(
        passingThroughChordInversionMajorHistory(),
        60,
        {
          planNextExerciseTag: () => id,
        },
      )
      expect(exercise.degreeId).toBe(id)
      expect(exercise.target.midi).toBe(60 + defined(expectedSemitones[id], id))
    }
  })
})
