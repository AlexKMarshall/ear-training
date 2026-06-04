import { describe, expect, it } from "vitest";
import { formatExerciseUrl } from "../src/curriculum/step-link.ts";
import { resolveAccessStep } from "../src/curriculum/session-step.ts";
import { getPredecessorStep } from "../src/curriculum/unlock.ts";
import { getExercise } from "../src/exercises/registry.ts";
import {
  passingLevel2History,
  passingSingleNoteHistory,
} from "./fixtures/attempts.ts";

describe("resolveAccessStep", () => {
  it("uses the URL step when provided", () => {
    const urlStep = {
      exerciseId: "interval-melodic-sing" as const,
      contentTierId: "interval-2a" as const,
    };
    expect(
      resolveAccessStep("interval-melodic-sing", passingLevel2History(), urlStep),
    ).toEqual(urlStep);
  });

  it("uses guided default when step param is omitted", () => {
    expect(
      resolveAccessStep("interval-melodic-sing", passingLevel2History(), null),
    ).toEqual({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    });
  });

  it("falls back to the first step on the exercise when none are unlocked", () => {
    expect(
      resolveAccessStep("interval-melodic-sing", [], null),
    ).toEqual({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    });
  });
});

describe("getPredecessorStep", () => {
  it("returns the previous curriculum step for step-level lock CTAs", () => {
    const step = {
      exerciseId: "scale-degree-sing" as const,
      contentTierId: "degree-3a" as const,
    };
    const predecessor = getPredecessorStep(step);
    expect(predecessor).toEqual({
      exerciseId: "interval-harmonic-id",
      contentTierId: "interval-2b",
    });
    expect(formatExerciseUrl(getExercise(predecessor!.exerciseId).route, predecessor!)).toBe(
      "/interval-harmonic-id/?step=interval-harmonic-id%3Ainterval-2b",
    );
  });
});
