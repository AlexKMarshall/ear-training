import { expect } from "vitest"
import { page, userEvent } from "vitest/browser"
import type { RecordingPort } from "../../../src/audio/recording-port.ts"
import { getIntervalById } from "../../../src/interval-config.ts"
import { defined } from "../../helpers/defined.ts"

/** Shortened lesson length for summary browser tests (O2 outcome mix). */
export const SHORT_LESSON_EXERCISES = 3

const PASS_SAMPLES = Array(20).fill(262)
const FAIL_SAMPLES = Array(20).fill(300)

/** Delivers a fixed Hz sequence per recording stop (O2 sing lesson). */
function createSequenceRecordingPort(sequences: number[][]): RecordingPort {
  let index = 0
  return {
    async start(callbacks) {
      const fallback = sequences[0]
      const samples = sequences[Math.min(index++, sequences.length - 1)] ?? fallback
      if (samples === undefined) {
        throw new Error("createSequenceRecordingPort: empty sequences")
      }
      return {
        stop: () => {
          callbacks.onComplete(samples)
        },
      }
    },
    stopStream() {},
  }
}

/** Pass, fail+retry pass, then three fails for a three-exercise sing lesson. */
export function singLessonO2RecordingPort(): RecordingPort {
  return createSequenceRecordingPort([
    PASS_SAMPLES,
    FAIL_SAMPLES,
    PASS_SAMPLES,
    FAIL_SAMPLES,
    FAIL_SAMPLES,
    FAIL_SAMPLES,
  ])
}

async function singPlayRecordPass(playLabel: RegExp): Promise<void> {
  await userEvent.click(page.getByRole("button", { name: playLabel }))
  await userEvent.click(page.getByRole("button", { name: /Start singing/i }))
  await userEvent.click(page.getByRole("button", { name: /^Done$/i }))
  await expect.element(page.getByText("Correct", { exact: true })).toBeVisible()
}

export async function singPlayRecordFail(playLabel: RegExp): Promise<void> {
  await userEvent.click(page.getByRole("button", { name: playLabel }))
  await userEvent.click(page.getByRole("button", { name: /Start singing/i }))
  await userEvent.click(page.getByRole("button", { name: /^Done$/i }))
  await expect.element(page.getByText("Not quite", { exact: true })).toBeVisible()
}

async function singRetryThenPass(_playLabel: RegExp): Promise<void> {
  await userEvent.click(page.getByRole("button", { name: /Try again/i }))
  await userEvent.click(page.getByRole("button", { name: /Start singing/i }))
  await userEvent.click(page.getByRole("button", { name: /^Done$/i }))
  await expect.element(page.getByText("Correct", { exact: true })).toBeVisible()
}

export async function singExhaustAttempts(playLabel: RegExp): Promise<void> {
  await singPlayRecordFail(playLabel)
  for (let attempt = 1; attempt < 3; attempt++) {
    await userEvent.click(page.getByRole("button", { name: /Try again/i }))
    await userEvent.click(page.getByRole("button", { name: /Start singing/i }))
    await userEvent.click(page.getByRole("button", { name: /^Done$/i }))
  }
  await expect.element(page.getByRole("button", { name: /Try again/i })).not.toBeInTheDocument()
}

export async function singAdvanceFromResult(buttonName: RegExp): Promise<void> {
  await userEvent.click(page.getByRole("button", { name: buttonName }))
}

export async function runSingLessonO2(playLabel: RegExp): Promise<void> {
  await expect
    .element(page.getByText(new RegExp(`exercise 1 of ${SHORT_LESSON_EXERCISES}`, "i")))
    .toBeVisible()

  await singPlayRecordPass(playLabel)
  await singAdvanceFromResult(/Next exercise/i)

  await singPlayRecordFail(playLabel)
  await singRetryThenPass(playLabel)
  await singAdvanceFromResult(/Next exercise/i)

  await singExhaustAttempts(playLabel)
  await singAdvanceFromResult(/Finish lesson/i)
}

const wrongIntervalLabel = defined(getIntervalById("perfect-fourth"), "perfect-fourth").label
const correctIntervalLabel = defined(getIntervalById("perfect-fifth"), "perfect-fifth").label

async function identifyPlayAndChoose(label: string): Promise<void> {
  await userEvent.click(page.getByRole("button", { name: /Play interval/i }))
  await userEvent.click(page.getByRole("button", { name: label }))
}

async function identifyPassFirstTry(): Promise<void> {
  await identifyPlayAndChoose(correctIntervalLabel)
  await expect.element(page.getByText("Correct", { exact: true })).toBeVisible()
}

async function identifyFailThenPass(): Promise<void> {
  await identifyPlayAndChoose(wrongIntervalLabel)
  await expect.element(page.getByText("Not quite", { exact: true })).toBeVisible()
  await userEvent.click(page.getByRole("button", { name: /Try again/i }))
  await identifyPlayAndChoose(correctIntervalLabel)
  await expect.element(page.getByText("Correct", { exact: true })).toBeVisible()
}

async function identifyExhaustAttempts(): Promise<void> {
  await identifyPlayAndChoose(wrongIntervalLabel)
  for (let attempt = 1; attempt < 3; attempt++) {
    await userEvent.click(page.getByRole("button", { name: /Try again/i }))
    await identifyPlayAndChoose(wrongIntervalLabel)
  }
  await expect.element(page.getByRole("button", { name: /Try again/i })).not.toBeInTheDocument()
}

async function identifyAdvanceFromResult(buttonName: RegExp): Promise<void> {
  await userEvent.click(page.getByRole("button", { name: buttonName }))
}

export async function runIdentifyLessonO2(): Promise<void> {
  await expect
    .element(page.getByText(new RegExp(`exercise 1 of ${SHORT_LESSON_EXERCISES}`, "i")))
    .toBeVisible()

  await identifyPassFirstTry()
  await identifyAdvanceFromResult(/Next exercise/i)

  await identifyFailThenPass()
  await identifyAdvanceFromResult(/Next exercise/i)

  await identifyExhaustAttempts()
  await identifyAdvanceFromResult(/Finish lesson/i)
}

export async function assertLessonSummaryO2(): Promise<void> {
  await expect.element(page.getByText("Lesson complete", { exact: true })).toBeVisible()
  await expect.element(page.getByText("2/3")).toBeVisible()
  await expect.element(page.getByText("correct (67%)", { exact: false })).toBeVisible()
  const breakdown = page.getByRole("list").getByRole("listitem")
  await expect.element(breakdown.nth(0)).toHaveTextContent(/First try/)
  await expect.element(breakdown.nth(0)).toHaveTextContent(/1 \(33%\)/)
  await expect.element(breakdown.nth(1)).toHaveTextContent(/After retry/)
  await expect.element(breakdown.nth(1)).toHaveTextContent(/1 \(33%\)/)
  await expect.element(breakdown.nth(2)).toHaveTextContent(/Wrong/)
  await expect.element(breakdown.nth(2)).toHaveTextContent(/1 \(33%\)/)
}

export { FAIL_SAMPLES }
