import { describe, expect, it } from "vitest"
import { CURRICULUM_LESSONS } from "../src/curriculum/curriculum-lessons.ts"
import {
  prepareTargetedPracticeSlotExercise,
  slotIndexFromLessonRun,
} from "../src/session/targeted-practice-exercise.ts"
import type { TargetedPracticeSlot } from "../src/session/targeted-practice-planner.ts"
import { defined } from "./helpers/defined.ts"

const melodicSingStep = defined(
  CURRICULUM_LESSONS.find(
    (step) =>
      step.practiceModeId === "interval-melodic-sing" && step.contentTierId === "interval-2a",
  ),
  "interval melodic sing 2a",
)

describe("targeted practice slot exercise", () => {
  it("derives slot index from lesson run position", () => {
    expect(slotIndexFromLessonRun(0, 0)).toBe(0)
    expect(slotIndexFromLessonRun(2, 2)).toBe(2)
    expect(slotIndexFromLessonRun(null, 3)).toBe(3)
  })

  it("prepares interval exercise for a locked slot tag", () => {
    const slot: TargetedPracticeSlot = {
      curriculumLesson: melodicSingStep,
      tagId: "perfect-fifth",
      practiceModeId: "interval-melodic-sing",
    }
    const prepared = prepareTargetedPracticeSlotExercise(slot, {
      records: [],
      rng: () => 0,
      range: { lowMidi: 48, highMidi: 72 },
      lessonTonicMidi: null,
      lastScaleDegreeStepKey: null,
    })

    expect(prepared.exercise.type).toBe("interval")
    if (prepared.exercise.type === "interval") {
      expect(prepared.exercise.intervalId).toBe("perfect-fifth")
      expect(prepared.exercise.contentTierId).toBe("interval-2a")
    }
  })
})
