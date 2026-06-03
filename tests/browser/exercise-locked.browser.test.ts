import { page } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { passingSingleNoteHistory } from "../fixtures/attempts.ts";
import {
  mountExercisePageWithHistory,
  setUnlockAllSearch,
} from "./helpers/mount.ts";

test("locked interval exercise shows locked heading and predecessor CTA", async () => {
  await mountExercisePageWithHistory("interval-melodic-sing", []);
  await expect
    .element(page.getByRole("heading", { name: "Locked" }))
    .toBeVisible();
  await expect
    .element(page.getByRole("link", { name: /Go to Sing a single note/i }))
    .toBeVisible();
});

test("unlocked interval exercise does not show locked heading", async () => {
  await mountExercisePageWithHistory(
    "interval-melodic-sing",
    passingSingleNoteHistory(),
  );
  await expect
    .element(page.getByRole("heading", { name: "Locked" }))
    .not.toBeInTheDocument();
});

test("locked scale-degree exercise shows locked heading", async () => {
  await mountExercisePageWithHistory("scale-degree-sing", []);
  await expect
    .element(page.getByRole("heading", { name: "Locked" }))
    .toBeVisible();
  await expect
    .element(
      page.getByRole("link", { name: /Go to Identify harmonic intervals/i }),
    )
    .toBeVisible();
});

describe("?unlock=all", () => {
  beforeEach(() => {
    setUnlockAllSearch(true);
  });

  afterEach(() => {
    setUnlockAllSearch(false);
  });

  test("scale-degree-sing mounts exercise on empty history", async () => {
    await mountExercisePageWithHistory("scale-degree-sing", []);
    await expect
      .element(page.getByRole("heading", { name: /Sing scale degrees/i }))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Locked" }))
      .not.toBeInTheDocument();
  });
});
