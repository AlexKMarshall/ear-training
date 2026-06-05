import { beforeEach, expect, test } from "vitest";
import { page } from "vitest/browser";
import {
  assertLessonSummaryO2,
  runIdentifyLessonO2,
  runSingLessonO2,
  SHORT_LESSON_EXERCISES,
  singLessonO2RecordingPort,
} from "./helpers/lesson-flow.ts";
import { mountMelodicIntervalIdTest, mountSingleNoteSingTest } from "./helpers/mount.ts";

beforeEach(() => {
  document.body.innerHTML = "";
});

test("single-note sing shows lesson summary after shortened lesson with mixed outcomes", async () => {
  mountSingleNoteSingTest({
    samplesHz: Array(20).fill(262),
    deps: {
      exercisesPerLesson: SHORT_LESSON_EXERCISES,
      recording: singLessonO2RecordingPort(),
    },
  });

  await expect.element(page.getByRole("heading", { name: /Sing a single note/i })).toBeVisible();

  await runSingLessonO2(/Play note/i);
  await assertLessonSummaryO2();
});

test("interval melodic identify shows lesson summary after shortened lesson with mixed outcomes", async () => {
  mountMelodicIntervalIdTest({
    deps: { exercisesPerLesson: SHORT_LESSON_EXERCISES },
  });

  await expect
    .element(page.getByRole("heading", { name: /Identify melodic intervals/i }))
    .toBeVisible();

  await runIdentifyLessonO2();
  await assertLessonSummaryO2();
});
