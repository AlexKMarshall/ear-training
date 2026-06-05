import { describe, expect, it, vi } from "vitest"
import type { LessonExercise } from "../src/lesson-exercise.ts"
import { type AttemptScoredContext, LessonRun } from "../src/lesson-run.ts"

const sampleExercise: LessonExercise = {
  target: { midi: 60, hz: 261.63, name: "C4" },
  intervalId: "P5",
}

function runThroughLesson(run: LessonRun, outcomes: boolean[], exercise = sampleExercise): void {
  for (const passed of outcomes) {
    run.ensureCurrentExercise()
    run.recordScore(passed)
    if (run.getSnapshot().canAdvance) {
      run.advanceAfterResult(exercise)
    }
  }
}

describe("LessonRun", () => {
  it("exposes an empty snapshot before play", () => {
    const run = new LessonRun({ createLessonId: () => "lesson-a" })
    expect(run.getSnapshot()).toMatchObject({
      lessonId: "lesson-a",
      currentExerciseIndex: null,
      exerciseNumber: 1,
      scoredAttemptsOnCurrent: 0,
      lastPassed: false,
      results: [],
      canRetry: false,
      canAdvance: false,
      isLastExerciseInLesson: false,
      isLessonComplete: false,
    })
  })

  it("allows retry within the attempt limit without resetting scored attempts", () => {
    const run = new LessonRun()
    run.ensureCurrentExercise()
    run.recordScore(false)

    expect(run.getSnapshot()).toMatchObject({
      scoredAttemptsOnCurrent: 1,
      canRetry: true,
      canAdvance: false,
    })

    run.retryCurrentExercise()
    run.recordScore(false)

    expect(run.getSnapshot()).toMatchObject({
      scoredAttemptsOnCurrent: 2,
      canRetry: true,
      canAdvance: false,
    })
  })

  it("advances on pass and classifies first-try outcomes", () => {
    const run = new LessonRun()
    run.ensureCurrentExercise()
    run.recordScore(true)

    expect(run.getSnapshot().canAdvance).toBe(true)
    run.advanceAfterResult(sampleExercise)

    expect(run.getSnapshot()).toMatchObject({
      currentExerciseIndex: null,
      exerciseNumber: 2,
      results: [{ exerciseIndex: 0, outcome: "firstTry", exercise: sampleExercise }],
      isLastExerciseInLesson: false,
    })
  })

  it("advances after exhausted failures as wrong", () => {
    const run = new LessonRun()
    run.ensureCurrentExercise()
    run.recordScore(false)
    run.recordScore(false)
    run.recordScore(false)

    expect(run.getSnapshot()).toMatchObject({
      scoredAttemptsOnCurrent: 3,
      canRetry: false,
      canAdvance: true,
    })

    run.advanceAfterResult()

    expect(run.getSnapshot().results[0]).toEqual({
      exerciseIndex: 0,
      outcome: "wrong",
    })
  })

  it("completes a ten-exercise lesson and marks the last slot", () => {
    const run = new LessonRun({ exercisesPerLesson: 10 })
    const passes = Array.from({ length: 10 }, () => true)
    runThroughLesson(run, passes)

    const snapshot = run.getSnapshot()
    expect(snapshot.results).toHaveLength(10)
    expect(snapshot.isLessonComplete).toBe(true)
    expect(snapshot.isLastExerciseInLesson).toBe(true)
    expect(snapshot.currentExerciseIndex).toBeNull()
  })

  it("reset issues a fresh lesson id and clears lesson state", () => {
    const ids = ["lesson-1", "lesson-2"]
    const run = new LessonRun({ createLessonId: () => ids.shift()! })
    run.ensureCurrentExercise()
    run.recordScore(true)
    run.advanceAfterResult()

    run.reset()

    expect(run.getSnapshot()).toMatchObject({
      lessonId: "lesson-2",
      currentExerciseIndex: null,
      scoredAttemptsOnCurrent: 0,
      results: [],
      isLessonComplete: false,
    })
  })

  it("fires attempt scored on each scored try with adapter context", () => {
    const onAttemptScored = vi.fn<(ctx: AttemptScoredContext) => void>()
    const run = new LessonRun({
      createLessonId: () => "lesson-persist",
      onAttemptScored,
    })

    run.ensureCurrentExercise()
    run.recordScore(false)
    run.retryCurrentExercise()
    run.recordScore(true)
    run.advanceAfterResult(sampleExercise)

    expect(onAttemptScored).toHaveBeenCalledTimes(2)
    expect(onAttemptScored.mock.calls[0][0]).toEqual({
      lessonId: "lesson-persist",
      exerciseIndex: 0,
      passed: false,
      attemptNumber: 1,
      scoredAttemptsOnCurrent: 1,
      lastPassed: false,
    })
    expect(onAttemptScored.mock.calls[1][0]).toEqual({
      lessonId: "lesson-persist",
      exerciseIndex: 0,
      passed: true,
      attemptNumber: 2,
      scoredAttemptsOnCurrent: 2,
      lastPassed: true,
    })
  })

  it("ensureCurrentExercise does not reset attempts when replaying the same slot", () => {
    const run = new LessonRun()
    run.ensureCurrentExercise()
    run.recordScore(false)
    run.ensureCurrentExercise()

    expect(run.getSnapshot()).toMatchObject({
      currentExerciseIndex: 0,
      scoredAttemptsOnCurrent: 1,
    })
  })

  it("marks isLastExerciseInLesson on the final slot before advance", () => {
    const run = new LessonRun({ exercisesPerLesson: 3 })
    runThroughLesson(run, [true, true])

    run.ensureCurrentExercise()
    expect(run.getSnapshot()).toMatchObject({
      exerciseNumber: 3,
      isLastExerciseInLesson: true,
      isLessonComplete: false,
    })
  })
})
