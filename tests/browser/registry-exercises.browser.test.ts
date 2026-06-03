import { page, userEvent } from "vitest/browser";
import { beforeEach, expect, test } from "vitest";
import { INTERVALS } from "../../src/interval-config.ts";
import {
  resetIntervalPreference,
  setIntervalSelected,
} from "../../src/interval-preference.ts";
import { EXERCISES } from "../../src/exercises/registry.ts";
import type { ExerciseId } from "../../src/history/types.ts";
import {
  defaultPassSamplesHzFor,
  mountExerciseInBrowser,
} from "./helpers/mount.ts";

const SMOKE_IDS = [
  "chord-middle",
  "interval-melodic-sing",
  "interval-harmonic-sing",
  "interval-harmonic-id",
] as const satisfies readonly ExerciseId[];

beforeEach(() => {
  document.body.innerHTML = "";
});

for (const exerciseId of SMOKE_IDS) {
  const entry = EXERCISES.find((e) => e.id === exerciseId)!;

  test(`${exerciseId}: mounts and scores one question`, async () => {
    if (exerciseId === "interval-harmonic-id") {
      resetIntervalPreference();
      setIntervalSelected(INTERVALS.map((i) => i.id));
    }

    const mountOptions =
      entry.responseMode === "sing"
        ? { samplesHz: defaultPassSamplesHzFor(exerciseId) }
        : { resetPreferences: false };

    const { history } = mountExerciseInBrowser(exerciseId, mountOptions);

    await expect
      .element(page.getByRole("heading", { name: entry.title }))
      .toBeVisible();

    const playLabel =
      exerciseId === "chord-middle" ? /Play chord/i : /Play interval/i;
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
      exerciseId,
      passed: true,
      attemptNumber: 1,
    });
  });
}
