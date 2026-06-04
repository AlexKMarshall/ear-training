import { page } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { formatExerciseUrl } from "../../src/curriculum/step-link.ts";
import { getPredecessorStep } from "../../src/curriculum/unlock.ts";
import { getExercise } from "../../src/exercises/registry.ts";
import { passingSingleNoteHistory } from "../fixtures/attempts.ts";
import {
  mountExercisePageWithHistory,
  setStepSearch,
  setUnlockAllSearch,
} from "./helpers/mount.ts";

test("locked default step shows predecessor curriculum label and step link", async () => {
  await mountExercisePageWithHistory("interval-melodic-sing", []);
  const predecessor = getPredecessorStep({
    exerciseId: "interval-melodic-sing",
    contentTierId: "interval-2a",
  })!;
  const expectedHref = formatExerciseUrl(
    getExercise(predecessor.exerciseId).route,
    predecessor,
  );

  await expect.element(page.getByRole("heading", { name: "Locked" })).toBeVisible();
  const cta = page.getByRole("link", { name: /Go to Sing a single note/i });
  await expect.element(cta).toBeVisible();
  await expect.element(cta).toHaveAttribute("href", expectedHref);
});

test("unlocked default step mounts the exercise", async () => {
  await mountExercisePageWithHistory(
    "interval-melodic-sing",
    passingSingleNoteHistory(),
  );
  await expect
    .element(page.getByRole("heading", { name: "Locked" }))
    .not.toBeInTheDocument();
  await expect
    .element(page.getByRole("heading", { name: /Sing melodic intervals/i }))
    .toBeVisible();
});

test("locked deep link shows predecessor step label and step link CTA", async () => {
  setStepSearch({
    exerciseId: "interval-melodic-sing",
    contentTierId: "interval-2b",
  });
  const lockedStep = {
    exerciseId: "interval-melodic-sing" as const,
    contentTierId: "interval-2b" as const,
  };
  const predecessor = getPredecessorStep(lockedStep)!;
  const expectedHref = formatExerciseUrl(
    getExercise(predecessor.exerciseId).route,
    predecessor,
  );

  await mountExercisePageWithHistory("interval-melodic-sing", passingSingleNoteHistory(), {
    locationSearch: window.location.search,
  });

  await expect.element(page.getByRole("heading", { name: "Locked" })).toBeVisible();
  const cta = page.getByRole("link", {
    name: /Go to Identify harmonic intervals \(perfect 4th, 5th, octave\)/i,
  });
  await expect.element(cta).toBeVisible();
  await expect.element(cta).toHaveAttribute("href", expectedHref);
  setStepSearch(null);
});

test("locked scale-degree default step uses predecessor step link", async () => {
  const lockedStep = {
    exerciseId: "scale-degree-sing" as const,
    contentTierId: "degree-3a" as const,
  };
  const predecessor = getPredecessorStep(lockedStep)!;
  const expectedHref = formatExerciseUrl(
    getExercise(predecessor.exerciseId).route,
    predecessor,
  );

  await mountExercisePageWithHistory("scale-degree-sing", []);
  await expect.element(page.getByRole("heading", { name: "Locked" })).toBeVisible();
  const cta = page.getByRole("link", {
    name: /Go to Identify harmonic intervals \(diatonic intervals within one octave\)/i,
  });
  await expect.element(cta).toHaveAttribute("href", expectedHref);
});

test("unlocked step deep link mounts the exercise", async () => {
  setStepSearch({
    exerciseId: "interval-melodic-sing",
    contentTierId: "interval-2a",
  });
  await mountExercisePageWithHistory("interval-melodic-sing", passingSingleNoteHistory(), {
    locationSearch: window.location.search,
  });
  await expect
    .element(page.getByRole("heading", { name: /Sing melodic intervals/i }))
    .toBeVisible();
  await expect
    .element(page.getByRole("heading", { name: "Locked" }))
    .not.toBeInTheDocument();
  setStepSearch(null);
});

describe("?unlock=all", () => {
  beforeEach(() => {
    setUnlockAllSearch(true);
  });

  afterEach(() => {
    setUnlockAllSearch(false);
  });

  test("locked step URL mounts exercise without faking progress", async () => {
    setStepSearch(
      {
        exerciseId: "scale-degree-sing",
        contentTierId: "degree-3a",
      },
      { unlockAll: true },
    );
    await mountExercisePageWithHistory("scale-degree-sing", [], {
      locationSearch: window.location.search,
    });
    await expect
      .element(page.getByRole("heading", { name: /Sing scale degrees/i }))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Locked" }))
      .not.toBeInTheDocument();
    setStepSearch(null);
  });
});
