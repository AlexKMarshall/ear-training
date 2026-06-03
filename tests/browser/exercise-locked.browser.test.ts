import { page } from "vitest/browser";
import { expect, test } from "vitest";
import { passingSingleNoteHistory } from "../fixtures/attempts.ts";
import { mountExercisePageWithHistory } from "./helpers/mount.ts";

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
