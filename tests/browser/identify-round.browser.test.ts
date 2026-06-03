import { page, userEvent } from "vitest/browser";
import { beforeEach, expect, test } from "vitest";
import { INTERVALS } from "../../src/interval-config.ts";
import {
  resetIntervalPreference,
  setIntervalSelected,
} from "../../src/interval-preference.ts";
import { intervalMelodicIdConfig } from "../../src/ui/interval-tests.ts";
import {
  createMelodicIdTestConfig,
  mountMelodicIntervalIdTest,
} from "./helpers/mount.ts";

beforeEach(() => {
  resetIntervalPreference();
});

test("play, correct choice, and saveAttempt via HistoryPort", async () => {
  const { history } = mountMelodicIntervalIdTest();

  await expect
    .element(
      page.getByRole("heading", { name: /Identify melodic intervals/i }),
    )
    .toBeVisible();

  await userEvent.click(page.getByRole("button", { name: /Play interval/i }));

  await expect
    .element(page.getByRole("button", { name: /Perfect 5th/i }))
    .toBeVisible();
  await userEvent.click(page.getByRole("button", { name: /Perfect 5th/i }));

  await expect
    .element(page.getByText("Correct", { exact: true }))
    .toBeVisible();

  const records = await history.getAllAttempts();
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({
    exerciseId: "interval-melodic-id",
    passed: true,
    intervalId: "perfect-fifth",
    selectedIntervalId: "perfect-fifth",
    centsOff: 0,
    attemptNumber: 1,
    questionIndex: 0,
  });
  expect(records[0]!.roundId).toBeTruthy();
});

test("shows round progress and advances to question 2", async () => {
  mountMelodicIntervalIdTest();

  await expect.element(page.getByText(/question 1 of 10/i)).toBeVisible();

  await userEvent.click(page.getByRole("button", { name: /Play interval/i }));
  await userEvent.click(page.getByRole("button", { name: /Perfect 5th/i }));
  await userEvent.click(
    page.getByRole("button", { name: /Next question/i }),
  );

  await expect.element(page.getByText(/question 2 of 10/i)).toBeVisible();
});

test("interval picker: no intervals selected blocks play", async () => {
  resetIntervalPreference();
  for (const entry of INTERVALS) {
    setIntervalSelected(entry.id, false);
  }

  mountMelodicIntervalIdTest({
    config: intervalMelodicIdConfig,
    resetPreferences: false,
  });

  await expect
    .element(page.getByText(/Select at least one interval to begin/i))
    .toBeVisible();

  const playBtn = page.getByRole("button", { name: /Play interval/i });
  await expect.element(playBtn).toBeDisabled();
});

test("interval picker: two intervals enables play", async () => {
  resetIntervalPreference();
  for (const entry of INTERVALS) {
    setIntervalSelected(entry.id, false);
  }
  setIntervalSelected("perfect-fourth", true);
  setIntervalSelected("perfect-fifth", true);

  mountMelodicIntervalIdTest({
    config: createMelodicIdTestConfig(),
    resetPreferences: false,
  });

  await expect
    .element(page.getByText(/Press Play to hear the interval/i))
    .toBeVisible();

  const playBtn = page.getByRole("button", { name: /Play interval/i });
  await expect.element(playBtn).toBeEnabled();
});
