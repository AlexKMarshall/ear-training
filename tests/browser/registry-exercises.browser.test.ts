import { beforeEach, expect, test } from "vitest"
import { page, userEvent } from "vitest/browser"
import type { PracticeModeId } from "../../src/history/types.ts"
import { PRACTICE_MODES } from "../../src/practice-modes/registry.ts"
import { defined } from "../helpers/defined.ts"
import { defaultPassSamplesHzFor, mountPracticeModeInBrowser } from "./helpers/mount.ts"

const SMOKE_IDS = [
  "single-note",
  "chord-sing",
  "interval-melodic-sing",
  "interval-named-sing",
  "interval-harmonic-sing",
  "interval-melodic-id",
  "interval-harmonic-id",
  "scale-degree-sing",
] as const satisfies readonly PracticeModeId[]

beforeEach(() => {
  document.body.innerHTML = ""
})

for (const practiceModeId of SMOKE_IDS) {
  const entry = defined(
    PRACTICE_MODES.find((e) => e.id === practiceModeId),
    `practice mode ${practiceModeId}`,
  )

  test(`${practiceModeId}: mounts and scores one question`, async () => {
    const mountOptions =
      entry.responseMode === "sing"
        ? { samplesHz: defaultPassSamplesHzFor(practiceModeId) }
        : undefined

    const { history } = mountPracticeModeInBrowser(practiceModeId, mountOptions)

    await expect.element(page.getByRole("heading", { name: entry.title })).toBeVisible()

    const playLabel =
      practiceModeId === "single-note" || practiceModeId === "interval-named-sing"
        ? /Play note/i
        : practiceModeId === "chord-sing"
          ? /Play chord/i
          : practiceModeId === "scale-degree-sing"
            ? /Play tonic/i
            : /Play interval/i
    await userEvent.click(page.getByRole("button", { name: playLabel }))

    if (entry.responseMode === "select") {
      await userEvent.click(page.getByRole("button", { name: /Perfect 5th/i }))
    } else {
      await userEvent.click(page.getByRole("button", { name: /Start singing/i }))
      await userEvent.click(page.getByRole("button", { name: /^Done$/i }))
    }

    await expect.element(page.getByText("Correct", { exact: true })).toBeVisible()

    const records = await history.getAllAttempts()
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      practiceModeId,
      passed: true,
      attemptNumber: 1,
    })
  })
}
