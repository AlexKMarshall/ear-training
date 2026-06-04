import { page } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { parseStepFromSearchParams } from "../../src/curriculum/step-link.ts";
import { createMemoryHistoryPort } from "../../src/history/port.ts";
import { passingLevel2History } from "../fixtures/attempts.ts";
import { mountExercisePageWithHistory, setStepSearch } from "./helpers/mount.ts";

describe("step query param on exercise page", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    setStepSearch(null);
  });

  afterEach(() => {
    setStepSearch(null);
  });

  test("parses step from URL for the route exercise", () => {
    setStepSearch({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    });
    expect(
      parseStepFromSearchParams(window.location.search, "interval-melodic-sing"),
    ).toEqual({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    });
  });

  test("mounts an accessible step from the URL", async () => {
    setStepSearch({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    });
    const seed = passingLevel2History();
    await mountExercisePageWithHistory("interval-melodic-sing", seed, {
      locationSearch: window.location.search,
      history: createMemoryHistoryPort(seed),
    });

    await expect
      .element(page.getByRole("heading", { name: /Sing melodic intervals/i }))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Locked" }))
      .not.toBeInTheDocument();
  });
});
