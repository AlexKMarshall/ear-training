import { describe, expect, it } from "vitest"
import { CURRICULUM_LESSONS } from "../src/curriculum/curriculum-lessons.ts"
import {
  formatTargetedPracticeContextBanner,
  getCurriculumLessonBanner,
} from "../src/session/targeted-practice-banner.ts"
import { defined } from "./helpers/defined.ts"

const melodicSingStep = defined(
  CURRICULUM_LESSONS.find(
    (step) =>
      step.practiceModeId === "interval-melodic-sing" && step.contentTierId === "interval-2a",
  ),
  "interval melodic sing 2a",
)

describe("targeted practice banners", () => {
  it("formats the fixed context banner for the lesson", () => {
    expect(formatTargetedPracticeContextBanner("Intervals", ["minor 2nd"])).toBe(
      "Targeted practice · Intervals · minor 2nd",
    )
  })

  it("returns tier banner copy for interval curriculum lessons", () => {
    expect(getCurriculumLessonBanner(melodicSingStep)).toBe("perfect 4th, 5th, octave")
  })
})
