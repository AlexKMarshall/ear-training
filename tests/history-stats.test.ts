import { describe, expect, it } from "vitest"
import {
  computeDashboardStats,
  computePracticeModeProgress,
  computePracticeModeStats,
} from "../src/history/stats.ts"
import { computeTagStats } from "../src/history/tag-stats.ts"
import type { AttemptRecord } from "../src/history/types.ts"

function attempt(
  overrides: Partial<AttemptRecord> & Pick<AttemptRecord, "passed" | "attemptNumber" | "centsOff">,
): AttemptRecord {
  return {
    practiceModeId: "single-note",
    timestamp: 1,
    targetMidi: 60,
    targetHz: 261.63,
    targetName: "C4",
    lessonId: "lesson-1",
    exerciseIndex: 0,
    ...overrides,
  }
}

describe("computeDashboardStats", () => {
  it("returns zeros for empty history", () => {
    const stats = computeDashboardStats([])
    expect(stats.totalAttempts).toBe(0)
    expect(stats.attemptPassRatePercent).toBe(0)
    expect(stats.firstTryRatePercent).toBe(0)
    expect(stats.medianAbsCents).toBe(0)
  })

  it("computes attempt pass rate and median cents", () => {
    const stats = computeDashboardStats([
      attempt({ passed: true, attemptNumber: 1, centsOff: 10 }),
      attempt({ passed: false, attemptNumber: 1, centsOff: -30 }),
      attempt({ passed: true, attemptNumber: 2, centsOff: 5, exerciseIndex: 1 }),
    ])
    expect(stats.totalAttempts).toBe(3)
    expect(stats.attemptPassRatePercent).toBe(67)
    expect(stats.medianAbsCents).toBe(10)
  })

  it("computes first-try rate per question", () => {
    const stats = computeDashboardStats([
      attempt({ passed: true, attemptNumber: 1, centsOff: 0, exerciseIndex: 0 }),
      attempt({
        passed: false,
        attemptNumber: 1,
        centsOff: 50,
        exerciseIndex: 1,
        lessonId: "lesson-1",
      }),
      attempt({
        passed: true,
        attemptNumber: 2,
        centsOff: 5,
        exerciseIndex: 1,
        lessonId: "lesson-1",
      }),
    ])
    expect(stats.totalLessonExercises).toBe(2)
    expect(stats.firstTryRatePercent).toBe(50)
    expect(stats.lessonExercisePassRatePercent).toBe(100)
  })

  it("splits stats by exercise", () => {
    const stats = computeDashboardStats([
      attempt({
        practiceModeId: "single-note",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
      }),
      attempt({
        practiceModeId: "chord-middle",
        passed: false,
        attemptNumber: 1,
        centsOff: 40,
        exerciseIndex: 0,
        lessonId: "r2",
      }),
    ])
    expect(stats.byPracticeMode[0]?.attemptCount).toBe(1)
    expect(stats.byPracticeMode[0]?.attemptPassRatePercent).toBe(100)
    expect(stats.byPracticeMode[1]?.attemptCount).toBe(1)
    expect(stats.byPracticeMode[1]?.attemptPassRatePercent).toBe(0)
  })

  it("includes interval melodic sing in byPracticeMode", () => {
    const stats = computeDashboardStats([
      attempt({
        practiceModeId: "interval-melodic-sing",
        passed: true,
        attemptNumber: 1,
        centsOff: 8,
        intervalId: "perfect-fifth",
      }),
    ])
    const intervalStats = stats.byPracticeMode.find(
      (s) => s.practiceModeId === "interval-melodic-sing",
    )
    expect(intervalStats?.attemptCount).toBe(1)
    expect(intervalStats?.label).toBe("Sing melodic intervals")
    expect(intervalStats?.byTag?.[0]?.label).toBe("Perfect 5th")
  })

  it("overall median uses sing attempts only", () => {
    const stats = computeDashboardStats([
      attempt({
        practiceModeId: "interval-melodic-id",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
        intervalId: "perfect-fifth",
      }),
      attempt({
        practiceModeId: "interval-melodic-sing",
        passed: true,
        attemptNumber: 1,
        centsOff: 20,
        intervalId: "perfect-fifth",
      }),
    ])
    expect(stats.medianAbsCents).toBe(20)
  })
})

describe("tag breakdown", () => {
  it("sorts intervals weakest first and includes median cents for sing", () => {
    const stats = computePracticeModeStats("interval-melodic-sing", [
      attempt({
        practiceModeId: "interval-melodic-sing",
        passed: true,
        attemptNumber: 1,
        centsOff: 5,
        intervalId: "perfect-fifth",
        exerciseIndex: 0,
      }),
      attempt({
        practiceModeId: "interval-melodic-sing",
        passed: false,
        attemptNumber: 1,
        centsOff: 50,
        intervalId: "perfect-fourth",
        exerciseIndex: 1,
        lessonId: "lesson-1",
      }),
      attempt({
        practiceModeId: "interval-melodic-sing",
        passed: true,
        attemptNumber: 2,
        centsOff: 10,
        intervalId: "perfect-fourth",
        exerciseIndex: 1,
        lessonId: "lesson-1",
      }),
    ])
    expect(stats.byTag).toHaveLength(2)
    expect(stats.byTag?.[0]?.tagId).toBe("perfect-fourth")
    expect(stats.byTag?.[0]?.lessonExercisePassRatePercent).toBe(100)
    expect(stats.byTag?.[1]?.tagId).toBe("perfect-fifth")
    expect(stats.byTag?.[0]?.medianAbsCents).toBe(30)
  })

  it("identify exercise has null median on exercise and tags", () => {
    const stats = computePracticeModeStats("interval-melodic-id", [
      attempt({
        practiceModeId: "interval-melodic-id",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
        intervalId: "perfect-octave",
      }),
    ])
    expect(stats.medianAbsCents).toBeNull()
    expect(stats.byTag?.[0]?.medianAbsCents).toBeNull()
  })

  it("single-note has no byTag", () => {
    const stats = computePracticeModeStats("single-note", [
      attempt({ passed: true, attemptNumber: 1, centsOff: 0 }),
    ])
    expect(stats.byTag).toBeUndefined()
  })

  it("groups chord-middle by chord type", () => {
    const stats = computePracticeModeStats("chord-middle", [
      attempt({
        practiceModeId: "chord-middle",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
        chordTypeId: "major-triad-sing-middle",
      }),
    ])
    expect(stats.byTag?.[0]?.label).toBe("Major triad")
  })

  it("groups scale-degree-sing by degree", () => {
    const stats = computePracticeModeStats("scale-degree-sing", [
      attempt({
        practiceModeId: "scale-degree-sing",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
        degreeId: "fifth",
      }),
    ])
    expect(stats.byTag?.[0]?.label).toBe("5th")
  })

  it("resolves labels for major diatonic degree ids", () => {
    const stats = computePracticeModeStats("scale-degree-sing", [
      attempt({
        practiceModeId: "scale-degree-sing",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
        degreeId: "seventh",
      }),
    ])
    expect(stats.byTag?.[0]?.label).toBe("7th")
  })

  it("computeTagStats omits records without tag id", () => {
    const rows = computeTagStats(
      [
        attempt({
          passed: true,
          attemptNumber: 1,
          centsOff: 0,
          intervalId: "perfect-fifth",
        }),
        attempt({ passed: true, attemptNumber: 1, centsOff: 0 }),
      ],
      {
        kind: "interval",
        getTagId: (r) => r.intervalId,
        includeMedianCents: true,
      },
    )
    expect(rows).toHaveLength(1)
  })
})

describe("computePracticeModeStats", () => {
  it("ignores attempts for other exercises", () => {
    const stats = computePracticeModeStats("single-note", [
      attempt({
        practiceModeId: "single-note",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
      }),
      attempt({
        practiceModeId: "chord-middle",
        passed: false,
        attemptNumber: 1,
        centsOff: 40,
        lessonId: "r2",
      }),
    ])
    expect(stats.practiceModeId).toBe("single-note")
    expect(stats.attemptCount).toBe(1)
    expect(stats.lessonExerciseCount).toBe(1)
    expect(stats.lessonExercisePassRatePercent).toBe(100)
  })
})

describe("computePracticeModeProgress", () => {
  it("returns zeros when the exercise has no attempts", () => {
    const progress = computePracticeModeProgress("interval-melodic-sing", [
      attempt({
        practiceModeId: "single-note",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
      }),
    ])
    expect(progress).toEqual({
      lessonExerciseCount: 0,
      lessonExercisePassRatePercent: 0,
    })
  })

  it("groups questions by lessonId and exerciseIndex", () => {
    const records = [
      attempt({
        practiceModeId: "single-note",
        passed: false,
        attemptNumber: 1,
        centsOff: 50,
        exerciseIndex: 0,
        lessonId: "lesson-1",
      }),
      attempt({
        practiceModeId: "single-note",
        passed: true,
        attemptNumber: 2,
        centsOff: 5,
        exerciseIndex: 0,
        lessonId: "lesson-1",
      }),
      attempt({
        practiceModeId: "single-note",
        passed: false,
        attemptNumber: 1,
        centsOff: 40,
        exerciseIndex: 1,
        lessonId: "lesson-1",
      }),
      attempt({
        practiceModeId: "single-note",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
        exerciseIndex: 0,
        lessonId: "lesson-2",
      }),
    ]
    const progress = computePracticeModeProgress("single-note", records)
    expect(progress.lessonExerciseCount).toBe(3)
    expect(progress.lessonExercisePassRatePercent).toBe(67)
  })

  it("matches dashboard question pass rate for one exercise", () => {
    const records = [
      attempt({
        practiceModeId: "single-note",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
        exerciseIndex: 0,
      }),
      attempt({
        practiceModeId: "chord-middle",
        passed: false,
        attemptNumber: 1,
        centsOff: 40,
        lessonId: "r2",
      }),
    ]
    const progress = computePracticeModeProgress("single-note", records)
    const dashboard = computeDashboardStats(records)
    const singleNote = dashboard.byPracticeMode.find((s) => s.practiceModeId === "single-note")
    expect(progress.lessonExerciseCount).toBe(singleNote?.lessonExerciseCount)
    expect(progress.lessonExercisePassRatePercent).toBe(singleNote?.lessonExercisePassRatePercent)
  })
})
