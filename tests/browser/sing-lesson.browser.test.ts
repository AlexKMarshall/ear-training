import { beforeEach, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { mountSingleNoteSingTest } from "./helpers/mount.ts";

const PASS_SAMPLES = Array(20).fill(262);
const FAIL_SAMPLES = Array(20).fill(300);
const SHORT_SAMPLES = Array(5).fill(262);

async function playAndRecord(): Promise<void> {
  await userEvent.click(page.getByRole("button", { name: /Play note/i }));
  await userEvent.click(page.getByRole("button", { name: /Start singing/i }));
  await userEvent.click(page.getByRole("button", { name: /^Done$/i }));
}

beforeEach(() => {
  document.body.innerHTML = "";
});

test("play, pass recording, and saveAttempt via HistoryPort", async () => {
  const { history } = mountSingleNoteSingTest({ samplesHz: PASS_SAMPLES });

  await expect.element(page.getByRole("heading", { name: /Sing a single note/i })).toBeVisible();

  await playAndRecord();

  await expect.element(page.getByText("Correct", { exact: true })).toBeVisible();

  const records = await history.getAllAttempts();
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({
    practiceModeId: "single-note",
    passed: true,
    attemptNumber: 1,
    exerciseIndex: 0,
  });
  expect(records[0]!.lessonId).toBeTruthy();
  expect(Math.abs(records[0]!.centsOff)).toBeLessThanOrEqual(40);
});

test("shows lesson progress and advances to exercise 2", async () => {
  mountSingleNoteSingTest({ samplesHz: PASS_SAMPLES });

  await expect.element(page.getByText(/exercise 1 of 10/i)).toBeVisible();

  await playAndRecord();
  await userEvent.click(page.getByRole("button", { name: /Next exercise/i }));

  await expect.element(page.getByText(/exercise 2 of 10/i)).toBeVisible();
});

test("fail shows retry and records failed attempt", async () => {
  const { history } = mountSingleNoteSingTest({ samplesHz: FAIL_SAMPLES });

  await playAndRecord();

  await expect.element(page.getByText("Not quite", { exact: true })).toBeVisible();
  await expect.element(page.getByRole("button", { name: /Try again/i })).toBeVisible();

  const records = await history.getAllAttempts();
  expect(records).toHaveLength(1);
  expect(records[0]!.passed).toBe(false);
});

test("exhausts attempts and shows next exercise", async () => {
  mountSingleNoteSingTest({ samplesHz: FAIL_SAMPLES });

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt === 0) {
      await playAndRecord();
    } else {
      await userEvent.click(page.getByRole("button", { name: /Try again/i }));
      await userEvent.click(page.getByRole("button", { name: /Start singing/i }));
      await userEvent.click(page.getByRole("button", { name: /^Done$/i }));
    }
  }

  await expect.element(page.getByRole("button", { name: /Next exercise/i })).toBeVisible();
  await expect.element(page.getByRole("button", { name: /Try again/i })).not.toBeInTheDocument();
});

test("not enough pitch does not save attempt", async () => {
  const { history } = mountSingleNoteSingTest({ samplesHz: SHORT_SAMPLES });

  await playAndRecord();

  await expect.element(page.getByText(/Not enough clear pitch detected/i)).toBeVisible();

  const records = await history.getAllAttempts();
  expect(records).toHaveLength(0);
});
