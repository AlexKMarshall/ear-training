import { page, userEvent } from "vitest/browser";
import { beforeEach, expect, test } from "vitest";
import { getEligibleTagIds } from "../../src/curriculum/steps.ts";
import { getIntervalById } from "../../src/interval-config.ts";
import {
  buildIntervalQuestion,
  intervalToSingTestQuestion,
} from "../../src/interval-questions.ts";
import { createTestAudioPort } from "../../src/audio/port.ts";
import { createMemoryHistoryPort } from "../../src/history/port.ts";
import { mountIntervalHarmonicIdTest } from "../../src/ui/interval-tests.ts";
import {
  passingStepHistory,
  passingThroughMelodic2bHistory,
} from "../fixtures/attempts.ts";
import {
  createHarmonicSingTestConfig,
  defaultPassSamplesHzFor,
  mountExerciseInBrowser,
} from "./helpers/mount.ts";
import "../../src/ui/styles.css";

const perfectFifth = getIntervalById("perfect-fifth")!;
const harmonicSing2bStep = {
  exerciseId: "interval-harmonic-sing" as const,
  contentTierId: "interval-2b" as const,
};

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

test("harmonic sing at interval-2b saves attempt with 2b tier metadata", async () => {
  const { history } = mountExerciseInBrowser("interval-harmonic-sing", {
    config: createHarmonicSingTestConfig({
      prepareQuestion: () => ({
        ...intervalToSingTestQuestion(
          buildIntervalQuestion(perfectFifth, "harmonic", 60),
        ),
        contentTierId: harmonicSing2bStep.contentTierId,
        eligibleTagIds: getEligibleTagIds(harmonicSing2bStep),
      }),
    }),
    samplesHz: defaultPassSamplesHzFor("interval-harmonic-sing"),
  });

  await userEvent.click(page.getByRole("button", { name: /Play interval/i }));
  await userEvent.click(page.getByRole("button", { name: /Start singing/i }));
  await userEvent.click(page.getByRole("button", { name: /^Done$/i }));

  await expect
    .element(page.getByText("Correct", { exact: true }))
    .toBeVisible();

  const records = await history.getAllAttempts();
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({
    exerciseId: "interval-harmonic-sing",
    passed: true,
    contentTierId: "interval-2b",
  });
  expect(records[0]!.eligibleTagIds).toHaveLength(12);
});

test("harmonic identify at interval-2b saves attempt with 2b tier metadata", async () => {
  const history = createMemoryHistoryPort([
    ...passingThroughMelodic2bHistory(),
    ...passingStepHistory({
      exerciseId: "interval-harmonic-sing",
      contentTierId: "interval-2b",
    }),
  ]);
  const root = document.querySelector<HTMLElement>("#app")!;
  mountIntervalHarmonicIdTest(root, {
    history,
    audio: createTestAudioPort(),
    sessionPlanner: {
      planNextQuestionTag: () => "perfect-fifth",
    },
  });

  await userEvent.click(page.getByRole("button", { name: /Play interval/i }));
  await userEvent.click(page.getByRole("button", { name: /Perfect 5th/i }));

  await expect
    .element(page.getByText("Correct", { exact: true }))
    .toBeVisible();

  const records = await history.getAllAttempts();
  const attempt = records[records.length - 1]!;
  expect(attempt).toMatchObject({
    exerciseId: "interval-harmonic-id",
    contentTierId: "interval-2b",
    intervalId: "perfect-fifth",
    passed: true,
  });
  expect(attempt.eligibleTagIds).toHaveLength(12);
});
