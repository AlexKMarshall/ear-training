import { beforeEach, expect, test } from "vitest"
import { page } from "vitest/browser"
import {
  FAIL_SAMPLES,
  singAdvanceFromResult,
  singExhaustAttempts,
  singPlayRecordFail,
} from "./helpers/lesson-flow.ts"
import { mountPracticeModeInBrowser } from "./helpers/mount.ts"

beforeEach(() => {
  document.body.innerHTML = ""
})

test("interval melodic sing: fail shows retry and records failed attempt", async () => {
  const { history } = mountPracticeModeInBrowser("interval-melodic-sing", {
    samplesHz: FAIL_SAMPLES,
  })

  await expect.element(page.getByRole("heading", { name: /Sing melodic intervals/i })).toBeVisible()

  await singPlayRecordFail(/Play interval/i)

  const records = await history.getAllAttempts()
  expect(records).toHaveLength(1)
  expect(records[0]).toMatchObject({
    practiceModeId: "interval-melodic-sing",
    passed: false,
    attemptNumber: 1,
  })
})

test("interval melodic sing: exhausts attempts and advances", async () => {
  mountPracticeModeInBrowser("interval-melodic-sing", {
    samplesHz: FAIL_SAMPLES,
  })

  await singExhaustAttempts(/Play interval/i)
  await singAdvanceFromResult(/Next exercise/i)
  await expect.element(page.getByText(/exercise 2 of 10/i)).toBeVisible()
})

test("chord sing: fail shows retry and records failed attempt", async () => {
  const { history } = mountPracticeModeInBrowser("chord-sing", {
    samplesHz: FAIL_SAMPLES,
  })

  await expect.element(page.getByText(/Sing the middle note/i)).toBeVisible()

  await singPlayRecordFail(/Play chord/i)

  const records = await history.getAllAttempts()
  expect(records).toHaveLength(1)
  expect(records[0]).toMatchObject({
    practiceModeId: "chord-sing",
    passed: false,
    attemptNumber: 1,
  })
})

test("chord middle: exhausts attempts and advances", async () => {
  mountPracticeModeInBrowser("chord-sing", {
    samplesHz: FAIL_SAMPLES,
  })

  await singExhaustAttempts(/Play chord/i)
  await singAdvanceFromResult(/Next exercise/i)
  await expect.element(page.getByText(/exercise 2 of 10/i)).toBeVisible()
})
