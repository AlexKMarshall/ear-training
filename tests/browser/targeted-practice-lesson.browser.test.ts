import { afterEach, expect, test } from "vitest"
import { page, userEvent } from "vitest/browser"
import { EXERCISES_PER_LESSON } from "../../src/config.ts"
import { CURRICULUM_LESSONS } from "../../src/curriculum/curriculum-lessons.ts"
import { getIntervalById } from "../../src/interval-config.ts"
import { LessonRun } from "../../src/lesson-run.ts"
import type { TargetedPracticePlan } from "../../src/session/targeted-practice-planner.ts"
import {
  loadTargetedPracticeSession,
  resetTargetedPracticeSessionStore,
  saveTargetedPracticeSession,
} from "../../src/session/targeted-practice-session-store.ts"
import { passingIntroScaleDegreeHistory } from "../fixtures/attempts.ts"
import { defined } from "../helpers/defined.ts"
import { SHORT_LESSON_EXERCISES } from "./helpers/lesson-flow.ts"
import { mountHomeWithHistory, mountTargetedPracticeWithHistory } from "./helpers/mount.ts"

const melodicIdStep = defined(
  CURRICULUM_LESSONS.find(
    (step) => step.practiceModeId === "interval-melodic-id" && step.contentTierId === "interval-2a",
  ),
  "interval melodic id 2a",
)

function identifyOnlyPlan(exerciseCount: number): TargetedPracticePlan {
  return {
    family: "Intervals",
    focusAreas: [
      {
        curriculumLesson: melodicIdStep,
        tagId: "perfect-fifth",
        label: "perfect 5th",
      },
    ],
    focusTagLabels: ["perfect 5th"],
    slots: Array.from({ length: exerciseCount }, () => ({
      curriculumLesson: melodicIdStep,
      tagId: "perfect-fifth",
      practiceModeId: melodicIdStep.practiceModeId,
    })),
  }
}

function seedTargetedPracticeSession(
  plan: TargetedPracticePlan,
  lessonId = "lesson-targeted",
): void {
  const run = new LessonRun({ createLessonId: () => lessonId })
  run.ensureCurrentExercise()
  saveTargetedPracticeSession(plan, run.getSnapshot())
}

afterEach(() => {
  resetTargetedPracticeSessionStore()
})

test("home card links to targeted practice", async () => {
  await mountHomeWithHistory(passingIntroScaleDegreeHistory())
  const card = page.getByRole("link", { name: /^Targeted practice/i })
  await expect.element(card).toHaveAttribute("href", "/targeted-practice/")
})

test("targeted practice shows context banner and lesson progress", async () => {
  seedTargetedPracticeSession(identifyOnlyPlan(SHORT_LESSON_EXERCISES))

  await mountTargetedPracticeWithHistory(passingIntroScaleDegreeHistory(), {
    exercisesPerLesson: SHORT_LESSON_EXERCISES,
  })

  await expect.element(page.getByText("Targeted practice · Intervals · perfect 5th")).toBeVisible()
  await expect
    .element(page.getByText(new RegExp(`exercise 1 of ${SHORT_LESSON_EXERCISES}`, "i")))
    .toBeVisible()
})

test("completes targeted practice lesson and shows summary", async () => {
  const lessonLength = 1
  const perfectFifthLabel = defined(getIntervalById("perfect-fifth"), "perfect-fifth").label
  seedTargetedPracticeSession(identifyOnlyPlan(lessonLength))

  await mountTargetedPracticeWithHistory(passingIntroScaleDegreeHistory(), {
    exercisesPerLesson: lessonLength,
  })

  await expect.element(page.getByText(/exercise 1 of 1/i)).toBeVisible()
  await userEvent.click(page.getByRole("button", { name: /Play interval/i }))
  await expect.element(page.getByRole("button", { name: perfectFifthLabel })).toBeVisible()
  await userEvent.click(page.getByRole("button", { name: perfectFifthLabel }))
  await expect.element(page.getByText("Correct", { exact: true })).toBeVisible()
  await userEvent.click(page.getByRole("button", { name: /Finish lesson/i }))

  await expect.element(page.getByText("Lesson complete", { exact: true })).toBeVisible()
  await expect.element(page.getByRole("link", { name: "Back to home" })).toBeVisible()
  expect(loadTargetedPracticeSession()).toBeNull()
})

test("resume after reload continues at the saved exercise", async () => {
  const records = passingIntroScaleDegreeHistory()
  const plan = identifyOnlyPlan(EXERCISES_PER_LESSON)
  const run = new LessonRun({ createLessonId: () => "lesson-resume" })
  run.ensureCurrentExercise()
  run.recordScore(true)
  run.advanceAfterResult()
  run.ensureCurrentExercise()
  saveTargetedPracticeSession(plan, run.getSnapshot())

  await mountTargetedPracticeWithHistory(records)

  await expect.element(page.getByText(/exercise 2 of 10/i)).toBeVisible()
  const loaded = loadTargetedPracticeSession()
  expect(loaded?.lessonRun).toMatchObject({
    lessonId: "lesson-resume",
    currentExerciseIndex: 1,
    results: [{ exerciseIndex: 0, outcome: "firstTry" }],
  })
})

test("abandon clears stored session", async () => {
  seedTargetedPracticeSession(identifyOnlyPlan(EXERCISES_PER_LESSON))
  await mountTargetedPracticeWithHistory(passingIntroScaleDegreeHistory())
  expect(loadTargetedPracticeSession()).not.toBeNull()

  await userEvent.click(page.getByRole("link", { name: /Abandon practice/i }))

  expect(loadTargetedPracticeSession()).toBeNull()
})
