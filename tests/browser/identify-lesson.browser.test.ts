import { beforeEach, expect, test } from "vitest"
import { page, userEvent } from "vitest/browser"
import { getEligibleTagIds } from "../../src/curriculum/curriculum-lessons.ts"
import { getIntervalById } from "../../src/interval-config.ts"
import {
  intervalToLessonExercise,
  randomIntervalExerciseForTag,
} from "../../src/interval-exercises.ts"
import { getActiveNoteRange } from "../../src/voice-ranges.ts"
import { createMelodicIdTestConfig, mountMelodicIntervalIdTest } from "./helpers/mount.ts"

beforeEach(() => {
  document.body.innerHTML = ""
})

test("play, correct choice, and saveAttempt via HistoryPort", async () => {
  const { history } = mountMelodicIntervalIdTest()

  await expect
    .element(page.getByRole("heading", { name: /Identify melodic intervals/i }))
    .toBeVisible()

  await userEvent.click(page.getByRole("button", { name: /Play interval/i }))

  await expect.element(page.getByRole("button", { name: /Perfect 5th/i })).toBeVisible()
  await userEvent.click(page.getByRole("button", { name: /Perfect 5th/i }))

  await expect.element(page.getByText("Correct", { exact: true })).toBeVisible()

  const records = await history.getAllAttempts()
  expect(records).toHaveLength(1)
  expect(records[0]).toMatchObject({
    practiceModeId: "interval-melodic-id",
    passed: true,
    intervalId: "perfect-fifth",
    selectedIntervalId: "perfect-fifth",
    contentTierId: "interval-2a",
    eligibleTagIds: ["perfect-fourth", "perfect-fifth", "perfect-octave"],
    centsOff: 0,
    attemptNumber: 1,
    exerciseIndex: 0,
  })
  expect(records[0]?.lessonId).toBeTruthy()
})

test("shows lesson progress and advances to exercise 2", async () => {
  mountMelodicIntervalIdTest()

  await expect.element(page.getByText(/exercise 1 of 10/i)).toBeVisible()

  await userEvent.click(page.getByRole("button", { name: /Play interval/i }))
  await userEvent.click(page.getByRole("button", { name: /Perfect 5th/i }))
  await userEvent.click(page.getByRole("button", { name: /Next exercise/i }))

  await expect.element(page.getByText(/exercise 2 of 10/i)).toBeVisible()
})

test("does not render interval picker", async () => {
  mountMelodicIntervalIdTest()

  await expect.element(page.getByRole("group", { name: /Intervals/i })).not.toBeInTheDocument()
})

test("eligible tier pool drives multiple choice without interval picker", async () => {
  const step = {
    practiceModeId: "interval-melodic-id" as const,
    contentTierId: "interval-2b" as const,
  }
  const eligibleTagIds = getEligibleTagIds(step)
  mountMelodicIntervalIdTest({
    config: createMelodicIdTestConfig({
      prepareExercise: () => {
        const intervalQuestion = randomIntervalExerciseForTag(
          "minor-sixth",
          "melodic",
          getActiveNoteRange(),
        )
        return {
          ...intervalToLessonExercise(intervalQuestion),
          contentTierId: step.contentTierId,
          eligibleTagIds,
        }
      },
    }),
  })

  await userEvent.click(page.getByRole("button", { name: /Play interval/i }))

  const label = getIntervalById("minor-sixth")?.label
  await expect.element(page.getByRole("button", { name: label })).toBeVisible()
  await userEvent.click(page.getByRole("button", { name: label }))

  await expect.element(page.getByText("Correct", { exact: true })).toBeVisible()
})
