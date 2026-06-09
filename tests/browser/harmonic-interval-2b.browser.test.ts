import { beforeEach, expect, test } from "vitest"
import { page, userEvent } from "vitest/browser"
import { createTestAudioPort } from "../../src/audio/port.ts"
import { getEligibleTagIds } from "../../src/curriculum/curriculum-lessons.ts"
import { getIntervalById } from "../../src/interval-config.ts"
import { buildIntervalExercise, intervalToLessonExercise } from "../../src/interval-exercises.ts"
import { mountIntervalHarmonicIdTest } from "../../src/ui/interval-tests.ts"
import { passingStepHistory, passingThroughMelodicId2bHistory } from "../fixtures/attempts.ts"
import { defined } from "../helpers/defined.ts"
import {
  createHarmonicSingTestConfig,
  createTestSessionHistory,
  defaultPassSamplesHzFor,
  mountPracticeModeInBrowser,
} from "./helpers/mount.ts"
import "../../src/ui/styles.css"

const perfectFifth = defined(getIntervalById("perfect-fifth"), "perfect-fifth")
const harmonicSing2bStep = {
  practiceModeId: "interval-harmonic-sing" as const,
  contentTierId: "interval-2b" as const,
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>'
})

test("harmonic sing at interval-2b saves attempt with 2b tier metadata", async () => {
  const { history } = mountPracticeModeInBrowser("interval-harmonic-sing", {
    config: createHarmonicSingTestConfig({
      prepareExercise: () => ({
        ...intervalToLessonExercise(buildIntervalExercise(perfectFifth, "harmonic", 60)),
        contentTierId: harmonicSing2bStep.contentTierId,
        eligibleTagIds: getEligibleTagIds(harmonicSing2bStep),
      }),
    }),
    samplesHz: defaultPassSamplesHzFor("interval-harmonic-sing"),
  })

  await userEvent.click(page.getByRole("button", { name: /Play interval/i }))
  await userEvent.click(page.getByRole("button", { name: /Start singing/i }))
  await userEvent.click(page.getByRole("button", { name: /^Done$/i }))

  await expect.element(page.getByText("Correct", { exact: true })).toBeVisible()

  const records = await history.getAllAttempts()
  expect(records).toHaveLength(1)
  expect(records[0]).toMatchObject({
    practiceModeId: "interval-harmonic-sing",
    passed: true,
    contentTierId: "interval-2b",
  })
  expect(records[0]?.eligibleTagIds).toHaveLength(12)
})

test("harmonic identify at interval-2b saves attempt with 2b tier metadata", async () => {
  const initialRecords = [
    ...passingThroughMelodicId2bHistory(),
    ...passingStepHistory({
      practiceModeId: "interval-harmonic-sing",
      contentTierId: "interval-2b",
    }),
  ]
  const { sessionHistory, history } = createTestSessionHistory(initialRecords)
  const root = defined(document.querySelector<HTMLElement>("#app"), "#app")
  mountIntervalHarmonicIdTest(root, {
    sessionHistory,
    audio: createTestAudioPort(),
    sessionPlanner: {
      planNextExerciseTag: () => "perfect-fifth",
    },
  })

  await userEvent.click(page.getByRole("button", { name: /Play interval/i }))
  await userEvent.click(page.getByRole("button", { name: /Perfect 5th/i }))

  await expect.element(page.getByText("Correct", { exact: true })).toBeVisible()

  const records = await history.getAllAttempts()
  const attempt = defined(records[records.length - 1], "attempt")
  expect(attempt).toMatchObject({
    practiceModeId: "interval-harmonic-id",
    contentTierId: "interval-2b",
    intervalId: "perfect-fifth",
    passed: true,
  })
  expect(attempt.eligibleTagIds).toHaveLength(12)
})
