import { describe, expect, it } from "vitest";
import {
  CURRICULUM_LESSON_QUERY_PARAM,
  formatCurriculumLessonParam,
  formatLessonLinkUrl,
  parseCurriculumLessonFromSearchParams,
  parseCurriculumLessonParam,
} from "../src/curriculum/lesson-link.ts";

describe("lesson link", () => {
  it("round-trips a curriculum step in the curriculum lesson query param", () => {
    const step = {
      practiceModeId: "interval-melodic-sing" as const,
      contentTierId: "interval-2a" as const,
    };
    const encoded = formatCurriculumLessonParam(step);
    expect(encoded).toBe("interval-melodic-sing:interval-2a");
    expect(parseCurriculumLessonParam(encoded)).toEqual(step);
    expect(
      parseCurriculumLessonFromSearchParams(
        `?${CURRICULUM_LESSON_QUERY_PARAM}=${encoded}`,
        step.practiceModeId,
      ),
    ).toEqual(step);
  });

  it("parses tier shorthand for the route exercise", () => {
    expect(parseCurriculumLessonParam("interval-2b", "interval-melodic-sing")).toEqual({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    });
  });

  it("rejects mismatched exercise in full step keys", () => {
    expect(
      parseCurriculumLessonFromSearchParams(
        "?step=interval-harmonic-id:interval-2a",
        "interval-melodic-sing",
      ),
    ).toBeNull();
  });

  it("returns null for unknown tiers and malformed values", () => {
    expect(parseCurriculumLessonParam("not-a-tier", "interval-melodic-sing")).toBeNull();
    expect(parseCurriculumLessonParam("", "interval-melodic-sing")).toBeNull();
    expect(parseCurriculumLessonParam("interval-melodic-sing:unknown-tier")).toBeNull();
  });

  it("formats practice mode routes with the curriculum lesson query param", () => {
    const step = {
      practiceModeId: "interval-melodic-sing" as const,
      contentTierId: "interval-2a" as const,
    };
    expect(formatLessonLinkUrl("/interval-melodic-sing/", step)).toBe(
      "/interval-melodic-sing/?step=interval-melodic-sing%3Ainterval-2a",
    );
  });
});
