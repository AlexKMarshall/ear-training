import { describe, expect, it } from "vitest";
import { getSessionStepForExercise } from "../src/curriculum/session-step.ts";

describe("getSessionStepForExercise", () => {
  it("returns interval-2a for melodic exercises until step unlock (PR 5)", () => {
    expect(
      getSessionStepForExercise("interval-melodic-sing", []),
    ).toEqual({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    });
    expect(getSessionStepForExercise("interval-melodic-id", [])).toEqual({
      exerciseId: "interval-melodic-id",
      contentTierId: "interval-2a",
    });
  });

  it("returns interval-2a for harmonic exercises", () => {
    expect(
      getSessionStepForExercise("interval-harmonic-sing", []),
    ).toEqual({
      exerciseId: "interval-harmonic-sing",
      contentTierId: "interval-2a",
    });
    expect(
      getSessionStepForExercise("interval-harmonic-id", []),
    ).toEqual({
      exerciseId: "interval-harmonic-id",
      contentTierId: "interval-2a",
    });
  });
});
