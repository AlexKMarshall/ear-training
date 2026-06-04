import { page, userEvent } from "vitest/browser";
import { beforeEach, expect, test } from "vitest";
import { PRACTICE_MODES } from "../../src/practice-modes/registry.ts";
import type { PracticeModeId } from "../../src/history/types.ts";
import {
  defaultPassSamplesHzFor,
  mountPracticeModeInBrowser,
} from "./helpers/mount.ts";

const SMOKE_IDS = [
  "chord-middle",
  "interval-melodic-sing",
  "interval-harmonic-sing",
  "interval-harmonic-id",
] as const satisfies readonly PracticeModeId[];

beforeEach(() => {
  document.body.innerHTML = "";
});

for (const practiceModeId of SMOKE_IDS) {
  const entry = PRACTICE_MODES.find((e) => e.id === practiceModeId)!;

  test(`${practiceModeId}: mounts and scores one question`, async () => {
    const mountOptions =
      entry.responseMode === "sing"
        ? { samplesHz: defaultPassSamplesHzFor(practiceModeId) }
        : undefined;

    const { history } = mountPracticeModeInBrowser(practiceModeId, mountOptions);

    await expect
      .element(page.getByRole("heading", { name: entry.title }))
      .toBeVisible();

    const playLabel =
      practiceModeId === "chord-middle" ? /Play chord/i : /Play interval/i;
    await userEvent.click(page.getByRole("button", { name: playLabel }));

    if (entry.responseMode === "select") {
      await userEvent.click(
        page.getByRole("button", { name: /Perfect 5th/i }),
      );
    } else {
      await userEvent.click(
        page.getByRole("button", { name: /Start singing/i }),
      );
      await userEvent.click(page.getByRole("button", { name: /^Done$/i }));
    }

    await expect
      .element(page.getByText("Correct", { exact: true }))
      .toBeVisible();

    const records = await history.getAllAttempts();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      practiceModeId,
      passed: true,
      attemptNumber: 1,
    });
  });
}
