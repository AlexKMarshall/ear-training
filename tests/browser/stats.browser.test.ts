import { page } from "vitest/browser";
import { expect, test } from "vitest";
import { intervalWeaknessHistory } from "../fixtures/stats-history.ts";
import { mountStatsWithHistory } from "./helpers/mount.ts";

test("empty history shows no practice copy", async () => {
  await mountStatsWithHistory([]);
  await expect
    .element(page.getByText(/No practice history yet/i))
    .toBeVisible();
});

test("shows interval weakness breakdown for sing history", async () => {
  await mountStatsWithHistory(intervalWeaknessHistory());
  await expect.element(page.getByText(/By interval/i)).toBeVisible();
  await expect.element(page.getByText("Perfect 4th")).toBeVisible();
  await expect.element(page.getByText(/Median error \(singing\)/i)).toBeVisible();
});

test("identify-only history explains singing median", async () => {
  await mountStatsWithHistory([
    {
      practiceModeId: "interval-melodic-id",
      timestamp: 1,
      centsOff: 0,
      passed: true,
      attemptNumber: 1,
      targetMidi: 60,
      targetHz: 261.63,
      targetName: "C4",
      lessonId: "lesson-1",
      exerciseIndex: 0,
      intervalId: "perfect-fifth",
    },
  ]);
  await expect
    .element(page.getByText(/Median error applies to singing exercises only/i))
    .toBeVisible();
  await expect.element(page.getByText(/By interval/i)).toBeVisible();
});
