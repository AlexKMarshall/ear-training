import { page } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  passingLevel2History,
  passingSingleNoteHistory,
  passingThroughMelodic2bHistory,
} from "../fixtures/attempts.ts";
import { mountHomeWithHistory, setUnlockAllSearch } from "./helpers/mount.ts";

test("fresh profile: first exercise is a link, next path exercise is not", async () => {
  await mountHomeWithHistory([]);
  await expect
    .element(
      page
        .getByRole("region", { name: /Level 1/i })
        .getByRole("link", { name: /Sing a single note/i }),
    )
    .toBeVisible();
  await expect
    .element(page.getByRole("link", { name: /Sing melodic intervals/i }))
    .not.toBeInTheDocument();
});

test("after single-note unlock: melodic sing appears as link", async () => {
  await mountHomeWithHistory(passingSingleNoteHistory());
  await expect
    .element(
      page
        .getByRole("region", { name: /Level 2/i })
        .getByRole("link", { name: /Sing melodic intervals/i }),
    )
    .toBeVisible();
});

test("after level 2 at 2a complete: scale-degree sing stays locked", async () => {
  await mountHomeWithHistory(passingLevel2History());
  await expect
    .element(page.getByRole("link", { name: /Sing scale degrees/i }))
    .not.toBeInTheDocument();
});

test("after melodic 2b complete: scale-degree sing appears as link", async () => {
  await mountHomeWithHistory(passingThroughMelodic2bHistory());
  await expect
    .element(
      page
        .getByRole("region", { name: /Level 3/i })
        .getByRole("link", { name: /Sing scale degrees/i }),
    )
    .toBeVisible();
});

test("after level 2 at 2a: Continue points at melodic sing for 2b tier", async () => {
  await mountHomeWithHistory(passingLevel2History());
  await expect
    .element(
      page
        .getByRole("region", { name: /Continue guided path/i })
        .getByRole("link", { name: /Sing melodic intervals/i }),
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

  test("fresh profile: scale-degree sing is a link", async () => {
    await mountHomeWithHistory([]);
    await expect
      .element(
        page
          .getByRole("region", { name: /Level 3/i })
          .getByRole("link", { name: /Sing scale degrees/i }),
      )
      .toBeVisible();
  });

  test("fresh profile: Continue still points at single-note", async () => {
    await mountHomeWithHistory([]);
    await expect
      .element(
        page
          .getByRole("region", { name: /Continue guided path/i })
          .getByRole("link", { name: /Sing a single note/i }),
      )
      .toBeVisible();
  });
});
