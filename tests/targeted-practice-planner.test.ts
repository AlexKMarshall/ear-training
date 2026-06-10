import { describe, expect, it } from "vitest"
import { EXERCISES_PER_LESSON } from "../src/config.ts"
import type { ContentTierId, CurriculumLesson } from "../src/curriculum/curriculum-lessons.ts"
import { CURRICULUM_LESSONS, getEligibleTagIds } from "../src/curriculum/curriculum-lessons.ts"
import { getPathNodeState } from "../src/curriculum/path-node.ts"
import { MIN_EXERCISES_FOR_UNLOCK } from "../src/curriculum/unlock.ts"
import { getTagBreakdownConfig } from "../src/history/tag-stats.ts"
import type { AttemptRecord } from "../src/history/types.ts"
import { WEAK_AREA_PROBABILITY } from "../src/session/planner.ts"
import { planTargetedPracticeLesson } from "../src/session/targeted-practice-planner.ts"
import {
  attempt,
  passingIntroScaleDegreeHistory,
  passingMelodicSing2bHistory,
  passingStepHistory,
  passingThroughHarmonic2bHistory,
} from "./fixtures/attempts.ts"

function withTier(record: AttemptRecord, contentTierId: ContentTierId): AttemptRecord {
  return { ...record, contentTierId } as AttemptRecord
}

function intervalHistory(
  practiceModeId: AttemptRecord["practiceModeId"],
  tagId: string,
  options: {
    lessonExercises: number
    passRate: number
    contentTierId?: ContentTierId
    timestampStart?: number
  },
): AttemptRecord[] {
  const passedCount = Math.round((options.lessonExercises * options.passRate) / 100)
  const records: AttemptRecord[] = []
  for (let i = 0; i < options.lessonExercises; i++) {
    const passed = i < passedCount
    const base = attempt({
      practiceModeId,
      passed,
      attemptNumber: 1,
      centsOff: passed ? 5 : 40,
      intervalId: tagId,
      exerciseIndex: i,
      lessonId: `${tagId}-${i}`,
      timestamp: (options.timestampStart ?? 1) + i,
    })
    records.push(options.contentTierId ? withTier(base, options.contentTierId) : base)
  }
  return records
}

function tagHistoryForLesson(
  step: CurriculumLesson,
  tagId: string,
  passRate: number,
  timestampStart = 1,
): AttemptRecord[] {
  const records: AttemptRecord[] = []
  const passedCount = Math.round((MIN_EXERCISES_FOR_UNLOCK * passRate) / 100)
  for (let i = 0; i < MIN_EXERCISES_FOR_UNLOCK; i++) {
    const passed = i < passedCount
    const base = attempt({
      practiceModeId: step.practiceModeId,
      contentTierId: step.contentTierId,
      passed,
      attemptNumber: 1,
      centsOff: passed ? 5 : 40,
      exerciseIndex: i,
      lessonId: `${step.practiceModeId}-${step.contentTierId}-${tagId}-${i}`,
      timestamp: timestampStart + i,
    })
    if (step.practiceModeId.startsWith("interval-")) {
      records.push({ ...base, intervalId: tagId })
      continue
    }
    if (step.practiceModeId === "scale-degree-sing") {
      records.push({ ...base, degreeId: tagId })
      continue
    }
    if (step.practiceModeId === "chord-sing") {
      records.push({
        ...base,
        voicingPositionId: tagId as AttemptRecord["voicingPositionId"],
        inversionId:
          step.contentTierId === "chord-major-root" || step.contentTierId === "chord-minor-root"
            ? "root"
            : step.contentTierId === "chord-major-first" ||
                step.contentTierId === "chord-minor-first"
              ? "first"
              : "second",
      })
      continue
    }
    if (step.practiceModeId === "chord-quality-id") {
      records.push({ ...base, chordTypeId: tagId })
      continue
    }
    if (step.practiceModeId === "chord-inversion-id") {
      records.push({ ...base, inversionId: tagId as AttemptRecord["inversionId"] })
    }
  }
  return records
}

/** Passed path history with strong tag stats on every passed planner-backed lesson. */
function passingWithStrongTagStats(
  extra: AttemptRecord[] = [],
  base: AttemptRecord[] = passingMelodicSing2bHistory(),
): AttemptRecord[] {
  const records: AttemptRecord[] = [...base]
  const passedLessons = CURRICULUM_LESSONS.filter(
    (step) => getPathNodeState(step, records) === "passed",
  )
  for (const step of passedLessons) {
    if (!getTagBreakdownConfig(step.practiceModeId)) {
      continue
    }
    for (const tagId of getEligibleTagIds(step)) {
      records.push(...tagHistoryForLesson(step, tagId, 100))
    }
  }
  return [...records, ...extra]
}

describe("planTargetedPracticeLesson", () => {
  it("returns null when no passed path nodes have planner tags", () => {
    expect(planTargetedPracticeLesson([])).toBeNull()
    expect(
      planTargetedPracticeLesson(
        passingStepHistory({ practiceModeId: "single-note", contentTierId: "tier-1" }),
      ),
    ).toBeNull()
  })

  it("returns a complete ten-slot plan from fixture attempt history", () => {
    const records = passingIntroScaleDegreeHistory()
    const plan = planTargetedPracticeLesson(records, { rng: () => 0 })
    expect(plan).not.toBeNull()
    expect(plan?.slots).toHaveLength(EXERCISES_PER_LESSON)
    expect(plan?.family).toBeTruthy()
    expect(plan?.focusTagLabels.length).toBeGreaterThan(0)
    for (const slot of plan?.slots ?? []) {
      expect(slot.practiceModeId).toBe(slot.curriculumLesson.practiceModeId)
      expect(slot.tagId).toBeTruthy()
    }
  })

  it("picks the family with the globally highest-priority weak pair", () => {
    const records = passingWithStrongTagStats([
      ...intervalHistory("interval-melodic-sing", "minor-sixth", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 0,
        contentTierId: "interval-2b",
        timestampStart: 10_000,
      }),
      ...intervalHistory("scale-degree-sing", "second", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 50,
        contentTierId: "degree-major-intro",
        timestampStart: 20_000,
      }),
    ])
    const plan = planTargetedPracticeLesson(records, { rng: () => 0 })
    expect(plan?.family).toBe("Intervals")
    expect(plan?.focusTagLabels).toContain("Minor 6th")
  })

  it("uses one focus area by default", () => {
    const records = passingWithStrongTagStats([
      ...intervalHistory("interval-melodic-sing", "minor-sixth", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 0,
        contentTierId: "interval-2b",
      }),
    ])
    const plan = planTargetedPracticeLesson(records, { rng: () => 0 })
    expect(plan?.family).toBe("Intervals")
    expect(plan?.focusAreas).toHaveLength(1)
    expect(plan?.focusAreas[0]?.tagId).toBe("minor-sixth")
  })

  it("adds a second focus area when the same tag id appears on another passed lesson in the family", () => {
    const records = passingWithStrongTagStats(
      [
        ...intervalHistory("interval-melodic-sing", "minor-second", {
          lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
          passRate: 0,
          contentTierId: "interval-2b",
        }),
        ...intervalHistory("interval-harmonic-id", "minor-second", {
          lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
          passRate: 0,
          contentTierId: "interval-2b",
        }),
      ],
      passingThroughHarmonic2bHistory(),
    )
    const plan = planTargetedPracticeLesson(records, { rng: () => 0 })
    expect(plan?.focusAreas).toHaveLength(2)
    expect(plan?.focusAreas.every((area) => area.tagId === "minor-second")).toBe(true)
    expect(new Set(plan?.focusAreas.map((area) => area.curriculumLesson.practiceModeId)).size).toBe(
      2,
    )
    expect(plan?.focusTagLabels).toEqual(["Minor 2nd"])
  })

  it("does not add a second focus area for two weak tags with different ids", () => {
    const records = passingWithStrongTagStats([
      ...intervalHistory("interval-melodic-sing", "minor-second", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 0,
        contentTierId: "interval-2b",
      }),
      ...intervalHistory("interval-melodic-sing", "tritone", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 20,
        contentTierId: "interval-2b",
      }),
    ])
    const plan = planTargetedPracticeLesson(records, { rng: () => 0 })
    expect(plan?.focusAreas).toHaveLength(1)
    expect(plan?.focusAreas[0]?.tagId).toBe("minor-second")
  })

  it("uses relative focus when no pair is below the weak threshold", () => {
    const records = passingWithStrongTagStats([
      ...intervalHistory("interval-melodic-sing", "major-second", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 80,
        contentTierId: "interval-2b",
      }),
    ])

    const plan = planTargetedPracticeLesson(records, { rng: () => 0 })
    expect(plan?.family).toBe("Intervals")
    expect(plan?.focusAreas).toHaveLength(1)
    expect(plan?.focusAreas[0]?.tagId).toBe("major-second")
  })

  it("allocates roughly seventy percent focus slots and thirty percent maintenance", () => {
    const records = passingWithStrongTagStats([
      ...intervalHistory("interval-melodic-sing", "minor-sixth", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 0,
        contentTierId: "interval-2b",
      }),
    ])
    const plan = planTargetedPracticeLesson(records, { rng: () => 0.5 })
    const focusKeys = new Set(
      plan?.focusAreas.map((area) => `${area.curriculumLesson.practiceModeId}:${area.tagId}`),
    )
    let focusSlots = 0
    for (const slot of plan?.slots ?? []) {
      const key = `${slot.curriculumLesson.practiceModeId}:${slot.tagId}`
      if (focusKeys.has(key)) {
        focusSlots += 1
      }
    }
    const expectedFocus = Math.round(EXERCISES_PER_LESSON * WEAK_AREA_PROBABILITY)
    expect(focusSlots).toBe(expectedFocus)
    expect(plan?.slots.length).toBe(EXERCISES_PER_LESSON)
  })

  it("draws maintenance slots only from maintenance-classified tags in the focused family", () => {
    const records = passingWithStrongTagStats([
      ...intervalHistory("interval-melodic-sing", "minor-sixth", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 10,
        contentTierId: "interval-2b",
      }),
    ])
    const plan = planTargetedPracticeLesson(records, { rng: () => 0.99 })
    const focusKeys = new Set(
      plan?.focusAreas.map((area) => `${area.curriculumLesson.practiceModeId}:${area.tagId}`),
    )
    const maintenanceSlots = (plan?.slots ?? []).filter((slot) => {
      const key = `${slot.curriculumLesson.practiceModeId}:${slot.tagId}`
      return !focusKeys.has(key)
    })
    expect(maintenanceSlots.length).toBeGreaterThan(0)
    for (const slot of maintenanceSlots) {
      expect(slot.tagId).not.toBe("minor-sixth")
      expect(slot.practiceModeId.startsWith("interval-")).toBe(true)
    }
  })

  it("interleaves maintenance tags between early focus draws when possible", () => {
    const records = passingWithStrongTagStats([
      ...intervalHistory("interval-melodic-sing", "minor-sixth", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 0,
        contentTierId: "interval-2b",
      }),
    ])
    const plan = planTargetedPracticeLesson(records, { rng: () => 0.42 })
    expect(plan?.family).toBe("Intervals")
    expect(plan?.slots.some((slot) => slot.tagId !== "minor-sixth")).toBe(true)
    expect(plan?.slots[0]?.tagId).not.toBe(plan?.slots[1]?.tagId)
  })

  it("boosts pairs that have not been practiced recently when choosing the family", () => {
    const now = 1_000_000
    const records = passingWithStrongTagStats([
      ...intervalHistory("interval-melodic-sing", "minor-sixth", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 0,
        contentTierId: "interval-2b",
        timestampStart: now - 10 * 24 * 60 * 60 * 1000,
      }),
      ...intervalHistory("interval-melodic-sing", "tritone", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 0,
        contentTierId: "interval-2b",
        timestampStart: now - 1,
      }),
    ])
    const plan = planTargetedPracticeLesson(records, { rng: () => 0, now })
    expect(plan?.focusAreas[0]?.tagId).toBe("minor-sixth")
  })
})
