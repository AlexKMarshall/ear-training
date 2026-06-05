import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { parseCurriculumLessonFromSearchParams } from "../../src/curriculum/lesson-link.ts";
import { createMemoryHistoryPort } from "../../src/history/port.ts";
import { passingLevel2History } from "../fixtures/attempts.ts";
import { mountPracticeModePageWithHistory, setCurriculumLessonSearch } from "./helpers/mount.ts";

describe("curriculum lesson query param on practice page", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    setCurriculumLessonSearch(null);
  });

  afterEach(() => {
    setCurriculumLessonSearch(null);
  });

  test("parses step from URL for the route exercise", () => {
    setCurriculumLessonSearch({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    });
    expect(
      parseCurriculumLessonFromSearchParams(window.location.search, "interval-melodic-sing"),
    ).toEqual({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    });
  });

  test("mounts an accessible step from the URL", async () => {
    setCurriculumLessonSearch({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    });
    const seed = passingLevel2History();
    await mountPracticeModePageWithHistory("interval-melodic-sing", seed, {
      locationSearch: window.location.search,
      history: createMemoryHistoryPort(seed),
    });

    await expect
      .element(page.getByRole("heading", { name: /Sing melodic intervals/i }))
      .toBeVisible();
    await expect.element(page.getByRole("heading", { name: "Locked" })).not.toBeInTheDocument();
  });
});
