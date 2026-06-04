import { describe, expect, it } from "vitest";
import {
  formatExerciseUrl,
  formatStepParam,
  parseStepFromSearchParams,
  parseStepParam,
  STEP_QUERY_PARAM,
} from "../src/curriculum/step-link.ts";

describe("step link", () => {
  it("round-trips a curriculum step in the step query param", () => {
    const step = {
      exerciseId: "interval-melodic-sing" as const,
      contentTierId: "interval-2a" as const,
    };
    const encoded = formatStepParam(step);
    expect(encoded).toBe("interval-melodic-sing:interval-2a");
    expect(parseStepParam(encoded)).toEqual(step);
    expect(parseStepFromSearchParams(`?${STEP_QUERY_PARAM}=${encoded}`, step.exerciseId)).toEqual(
      step,
    );
  });

  it("parses tier shorthand for the route exercise", () => {
    expect(
      parseStepParam("interval-2b", "interval-melodic-sing"),
    ).toEqual({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    });
  });

  it("rejects mismatched exercise in full step keys", () => {
    expect(
      parseStepFromSearchParams(
        "?step=interval-harmonic-id:interval-2a",
        "interval-melodic-sing",
      ),
    ).toBeNull();
  });

  it("returns null for unknown tiers and malformed values", () => {
    expect(parseStepParam("not-a-tier", "interval-melodic-sing")).toBeNull();
    expect(parseStepParam("", "interval-melodic-sing")).toBeNull();
    expect(parseStepParam("interval-melodic-sing:unknown-tier")).toBeNull();
  });

  it("formats exercise routes with the step query param", () => {
    const step = {
      exerciseId: "interval-melodic-sing" as const,
      contentTierId: "interval-2a" as const,
    };
    expect(formatExerciseUrl("/interval-melodic-sing/", step)).toBe(
      "/interval-melodic-sing/?step=interval-melodic-sing%3Ainterval-2a",
    );
  });
});
