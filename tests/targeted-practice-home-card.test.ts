import { afterEach, describe, expect, it } from "vitest"
import { EXERCISES_PER_LESSON } from "../src/config.ts"
import { CURRICULUM_LESSONS } from "../src/curriculum/curriculum-lessons.ts"
import { LessonRun } from "../src/lesson-run.ts"
import {
  formatTargetedPracticeSubtitle,
  hasPassedPathNode,
  resolveTargetedPracticeHomeCard,
} from "../src/session/targeted-practice-home-card.ts"
import type { TargetedPracticePlan } from "../src/session/targeted-practice-planner.ts"
import {
  resetTargetedPracticeSessionStore,
  saveTargetedPracticeSession,
} from "../src/session/targeted-practice-session-store.ts"
import { passingIntroScaleDegreeHistory, passingSingleNoteHistory } from "./fixtures/attempts.ts"
import { defined } from "./helpers/defined.ts"

const sampleStep = defined(CURRICULUM_LESSONS[1], "sample curriculum lesson")

function samplePlan(): TargetedPracticePlan {
  return {
    family: "Intervals",
    focusAreas: [
      {
        curriculumLesson: sampleStep,
        tagId: "m2",
        label: "minor 2nd",
      },
    ],
    focusTagLabels: ["minor 2nd"],
    slots: Array.from({ length: EXERCISES_PER_LESSON }, () => ({
      curriculumLesson: sampleStep,
      tagId: "m2",
      practiceModeId: sampleStep.practiceModeId,
    })),
  }
}

afterEach(() => {
  resetTargetedPracticeSessionStore()
})

describe("targeted practice home card", () => {
  it("detects passed path nodes from attempt history", () => {
    expect(hasPassedPathNode([])).toBe(false)
    expect(hasPassedPathNode(passingSingleNoteHistory())).toBe(true)
  })

  it("formats subtitle with family and focus tag labels", () => {
    expect(formatTargetedPracticeSubtitle("Intervals", ["minor 2nd"])).toBe("Intervals · minor 2nd")
    expect(formatTargetedPracticeSubtitle("Intervals", ["minor 2nd", "perfect 4th"])).toBe(
      "Intervals · minor 2nd, perfect 4th",
    )
  })

  it("returns null for fresh profiles without a passed path node", () => {
    expect(resolveTargetedPracticeHomeCard([])).toBeNull()
  })

  it("returns null when only single-note is passed because planner tags are unavailable", () => {
    expect(resolveTargetedPracticeHomeCard(passingSingleNoteHistory())).toBeNull()
  })

  it("returns a fresh preview when history qualifies for targeted practice", () => {
    const card = resolveTargetedPracticeHomeCard(passingIntroScaleDegreeHistory())
    expect(card).not.toBeNull()
    expect(card?.ctaLabel).toBe("Start")
    expect(card?.status).toBe(`${EXERCISES_PER_LESSON} exercises`)
    expect(card?.subtitle).toMatch(/^Intervals · /)
  })

  it("returns resume copy from the locked session plan", () => {
    const plan = samplePlan()
    const run = new LessonRun({ createLessonId: () => "lesson-1" })
    run.ensureCurrentExercise()
    run.recordScore(true)
    run.advanceAfterResult()
    saveTargetedPracticeSession(plan, run.getSnapshot())

    expect(resolveTargetedPracticeHomeCard([])).toEqual({
      subtitle: "Intervals · minor 2nd",
      status: "Resume · 2/10",
      ctaLabel: "Resume",
    })
  })
})
