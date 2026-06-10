import { afterEach, describe, expect, it } from "vitest"
import { EXERCISES_PER_LESSON } from "../src/config.ts"
import { CURRICULUM_LESSONS } from "../src/curriculum/curriculum-lessons.ts"
import { LessonRun } from "../src/lesson-run.ts"
import type { TargetedPracticePlan } from "../src/session/targeted-practice-planner.ts"
import {
  clearTargetedPracticeSession,
  clearTargetedPracticeSessionForGuidedPathLesson,
  getTargetedPracticeHomeCardState,
  loadTargetedPracticeSession,
  resetTargetedPracticeSessionStore,
  saveTargetedPracticeSession,
  updateTargetedPracticeLessonRun,
} from "../src/session/targeted-practice-session-store.ts"
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

describe("targeted practice session store", () => {
  it("returns fresh home state when no session is stored", () => {
    expect(getTargetedPracticeHomeCardState()).toEqual({ kind: "fresh" })
    expect(loadTargetedPracticeSession()).toBeNull()
  })

  it("saves the locked plan and lesson run at start", () => {
    const plan = samplePlan()
    const run = new LessonRun({ createLessonId: () => "lesson-1" })
    run.ensureCurrentExercise()

    saveTargetedPracticeSession(plan, run.getSnapshot())

    const loaded = loadTargetedPracticeSession()
    expect(loaded).not.toBeNull()
    expect(loaded?.plan.family).toBe("Intervals")
    expect(loaded?.plan.focusTagLabels).toEqual(["minor 2nd"])
    expect(loaded?.plan.slots).toHaveLength(EXERCISES_PER_LESSON)
    expect(loaded?.lessonRun).toMatchObject({
      lessonId: "lesson-1",
      currentExerciseIndex: 0,
      scoredAttemptsOnCurrent: 0,
      lastPassed: false,
      results: [],
    })
  })

  it("updates lesson run progress without recomputing the plan", () => {
    const plan = samplePlan()
    const run = new LessonRun({ createLessonId: () => "lesson-1" })
    run.ensureCurrentExercise()
    saveTargetedPracticeSession(plan, run.getSnapshot())

    run.recordScore(true)
    run.advanceAfterResult()
    run.ensureCurrentExercise()
    run.recordScore(false)
    updateTargetedPracticeLessonRun(run.getSnapshot())

    const loaded = loadTargetedPracticeSession()
    expect(loaded?.plan.slots).toHaveLength(EXERCISES_PER_LESSON)
    expect(loaded?.lessonRun).toMatchObject({
      lessonId: "lesson-1",
      currentExerciseIndex: 1,
      scoredAttemptsOnCurrent: 1,
      lastPassed: false,
      results: [{ exerciseIndex: 0, outcome: "firstTry" }],
    })
  })

  it("exposes resume progress for home from the locked plan", () => {
    const plan = samplePlan()
    const run = new LessonRun({ createLessonId: () => "lesson-1" })
    saveTargetedPracticeSession(plan, run.getSnapshot())

    expect(getTargetedPracticeHomeCardState()).toEqual({
      kind: "resume",
      family: "Intervals",
      focusTagLabels: ["minor 2nd"],
      exerciseNumber: 1,
      totalExercises: EXERCISES_PER_LESSON,
      progressLabel: `Resume · 1/${EXERCISES_PER_LESSON}`,
    })

    run.ensureCurrentExercise()
    run.recordScore(true)
    run.advanceAfterResult()
    run.ensureCurrentExercise()
    run.recordScore(true)
    run.advanceAfterResult()
    run.ensureCurrentExercise()
    run.recordScore(true)
    run.advanceAfterResult()
    run.ensureCurrentExercise()
    updateTargetedPracticeLessonRun(run.getSnapshot())

    expect(getTargetedPracticeHomeCardState()).toEqual({
      kind: "resume",
      family: "Intervals",
      focusTagLabels: ["minor 2nd"],
      exerciseNumber: 4,
      totalExercises: EXERCISES_PER_LESSON,
      progressLabel: `Resume · 4/${EXERCISES_PER_LESSON}`,
    })
  })

  it("clears stored state explicitly", () => {
    const plan = samplePlan()
    const run = new LessonRun({ createLessonId: () => "lesson-1" })
    saveTargetedPracticeSession(plan, run.getSnapshot())

    clearTargetedPracticeSession()

    expect(loadTargetedPracticeSession()).toBeNull()
    expect(getTargetedPracticeHomeCardState()).toEqual({ kind: "fresh" })
  })

  it("clears stored state when a guided-path lesson starts", () => {
    const plan = samplePlan()
    const run = new LessonRun({ createLessonId: () => "lesson-1" })
    saveTargetedPracticeSession(plan, run.getSnapshot())

    clearTargetedPracticeSessionForGuidedPathLesson()

    expect(loadTargetedPracticeSession()).toBeNull()
    expect(getTargetedPracticeHomeCardState()).toEqual({ kind: "fresh" })
  })

  it("restores lesson run position after reload via initial state", () => {
    const plan = samplePlan()
    const original = new LessonRun({ createLessonId: () => "lesson-1" })
    original.ensureCurrentExercise()
    original.recordScore(true)
    original.advanceAfterResult()
    original.ensureCurrentExercise()
    original.recordScore(false)
    saveTargetedPracticeSession(plan, original.getSnapshot())

    const loaded = loadTargetedPracticeSession()
    const resumed = new LessonRun({
      createLessonId: () => "should-not-run",
      initialState: loaded?.lessonRun,
    })

    expect(resumed.getSnapshot()).toMatchObject({
      lessonId: "lesson-1",
      currentExerciseIndex: 1,
      scoredAttemptsOnCurrent: 1,
      lastPassed: false,
      results: [{ exerciseIndex: 0, outcome: "firstTry" }],
      exerciseNumber: 2,
      canRetry: true,
      canAdvance: false,
    })
  })
})
