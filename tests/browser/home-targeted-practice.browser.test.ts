import { afterEach, describe, expect, test } from "vitest"
import { page } from "vitest/browser"
import { EXERCISES_PER_LESSON } from "../../src/config.ts"
import { CURRICULUM_LESSONS } from "../../src/curriculum/curriculum-lessons.ts"
import { LessonRun } from "../../src/lesson-run.ts"
import type { TargetedPracticePlan } from "../../src/session/targeted-practice-planner.ts"
import {
  resetTargetedPracticeSessionStore,
  saveTargetedPracticeSession,
} from "../../src/session/targeted-practice-session-store.ts"
import { passingIntroScaleDegreeHistory, passingSingleNoteHistory } from "../fixtures/attempts.ts"
import { defined } from "../helpers/defined.ts"
import { mountHomeWithHistory } from "./helpers/mount.ts"

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

function targetedPracticeCard() {
  return page.getByRole("link", { name: /^Targeted practice/i })
}

afterEach(() => {
  resetTargetedPracticeSessionStore()
})

test("fresh profile: targeted practice card is hidden", async () => {
  await mountHomeWithHistory([])
  await expect.element(targetedPracticeCard()).not.toBeInTheDocument()
})

test("single-note passed only: targeted practice card stays hidden until planner tags exist", async () => {
  await mountHomeWithHistory(passingSingleNoteHistory())
  await expect.element(targetedPracticeCard()).not.toBeInTheDocument()
})

test("qualifying history: fresh card shows planner preview and Start link", async () => {
  await mountHomeWithHistory(passingIntroScaleDegreeHistory())
  const card = targetedPracticeCard()
  await expect.element(card).toBeVisible()
  await expect.element(card.getByText(/^Intervals · /)).toBeVisible()
  await expect.element(card.getByText(`${EXERCISES_PER_LESSON} exercises`)).toBeVisible()
  await expect.element(card.getByText(/^Start$/)).toBeVisible()
  await expect.element(card).toHaveAttribute("href", "/targeted-practice/")
})

test("in-progress session: resume card shows locked plan copy", async () => {
  const plan = samplePlan()
  const run = new LessonRun({ createLessonId: () => "lesson-1" })
  run.ensureCurrentExercise()
  run.recordScore(true)
  run.advanceAfterResult()
  saveTargetedPracticeSession(plan, run.getSnapshot())

  await mountHomeWithHistory(passingIntroScaleDegreeHistory())
  const card = targetedPracticeCard()
  await expect.element(card).toBeVisible()
  await expect.element(card.getByText("Intervals · minor 2nd")).toBeVisible()
  await expect.element(card.getByText("Resume · 2/10")).toBeVisible()
  await expect.element(card.getByText(/^Resume$/)).toBeVisible()
})

describe("home load scroll", () => {
  test("does not auto-scroll the current path node into view", async () => {
    await mountHomeWithHistory(passingIntroScaleDegreeHistory())
    const currentNode = page.getByRole("link", {
      name: /Intervals.*Melodic reproduction.*diatonic intervals/i,
    })
    await expect.element(currentNode).toBeVisible()

    expect(document.documentElement.scrollTop).toBe(0)
  })
})
