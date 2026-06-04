import { page, userEvent } from "vitest/browser";
import { beforeEach, expect, test } from "vitest";
import { midiToHz } from "../../src/notes.ts";
import { mountScaleDegreeSingTest } from "./helpers/mount.ts";

const PASS_SAMPLES = Array(20).fill(midiToHz(67));
const FAIL_SAMPLES = Array(20).fill(300);

async function playAndRecord(): Promise<void> {
  await userEvent.click(page.getByRole("button", { name: /Play tonic/i }));
  await userEvent.click(
    page.getByRole("button", { name: /Start singing/i }),
  );
  await userEvent.click(page.getByRole("button", { name: /^Done$/i }));
}

beforeEach(() => {
  document.body.innerHTML = "";
});

test("play tonic, show degree prompt, pass recording, and saveAttempt", async () => {
  const { history } = mountScaleDegreeSingTest({ samplesHz: PASS_SAMPLES });

  await expect
    .element(page.getByRole("heading", { name: /Sing scale degrees/i }))
    .toBeVisible();

  await userEvent.click(page.getByRole("button", { name: /Play tonic/i }));

  await expect.element(page.getByText("Sing the 5th")).toBeVisible();

  await userEvent.click(
    page.getByRole("button", { name: /Start singing/i }),
  );
  await userEvent.click(page.getByRole("button", { name: /^Done$/i }));

  await expect
    .element(page.getByText("Correct", { exact: true }))
    .toBeVisible();

  const records = await history.getAllAttempts();
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({
    practiceModeId: "scale-degree-sing",
    passed: true,
    attemptNumber: 1,
    degreeId: "fifth",
    tonicMidi: 60,
    targetMidi: 67,
    contentTierId: "degree-3a",
    exerciseIndex: 0,
  });
});

test("fail shows retry and records failed attempt", async () => {
  const { history } = mountScaleDegreeSingTest({ samplesHz: FAIL_SAMPLES });

  await playAndRecord();

  await expect
    .element(page.getByText("Not quite", { exact: true }))
    .toBeVisible();

  const records = await history.getAllAttempts();
  expect(records).toHaveLength(1);
  expect(records[0]!.passed).toBe(false);
});
