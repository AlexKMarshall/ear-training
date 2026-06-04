import { describe, expect, it } from "vitest";
import { formatLessonLinkUrl } from "../src/curriculum/lesson-link.ts";
import { resolveAccessCurriculumLesson } from "../src/curriculum/session-step.ts";
import { getPredecessorCurriculumLesson } from "../src/curriculum/unlock.ts";
import { getPracticeMode } from "../src/practice-modes/registry.ts";
import {
  passingLevel2History,
  passingSingleNoteHistory,
} from "./fixtures/attempts.ts";

describe("resolveAccessCurriculumLesson", () => {
  it("uses the URL step when provided", () => {
    const urlCurriculumLesson = {
      practiceModeId: "interval-melodic-sing" as const,
      contentTierId: "interval-2a" as const,
    };
    expect(
      resolveAccessCurriculumLesson("interval-melodic-sing", passingLevel2History(), urlCurriculumLesson),
    ).toEqual(urlCurriculumLesson);
  });

  it("uses guided default when step param is omitted", () => {
    expect(
      resolveAccessCurriculumLesson("interval-melodic-sing", passingLevel2History(), null),
    ).toEqual({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    });
    expect(
      resolveAccessCurriculumLesson("scale-degree-sing", passingLevel2History(), null),
    ).toEqual({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-major-intro",
    });
  });

  it("falls back to the first step on the exercise when none are unlocked", () => {
    expect(
      resolveAccessCurriculumLesson("interval-melodic-sing", [], null),
    ).toEqual({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    });
  });
});

describe("getPredecessorCurriculumLesson", () => {
  it("returns the previous curriculum step for step-level lock CTAs", () => {
    const step = {
      practiceModeId: "scale-degree-sing" as const,
      contentTierId: "degree-major-intro" as const,
    };
    const predecessor = getPredecessorCurriculumLesson(step);
    expect(predecessor).toEqual({
      practiceModeId: "interval-harmonic-id",
      contentTierId: "interval-2a",
    });
    expect(formatLessonLinkUrl(getPracticeMode(predecessor!.practiceModeId).route, predecessor!)).toBe(
      "/interval-harmonic-id/?step=interval-harmonic-id%3Ainterval-2a",
    );
  });
});
