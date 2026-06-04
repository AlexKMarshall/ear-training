import { describe, expect, it } from "vitest";
import { getSessionStepForExercise } from "../src/curriculum/session-step.ts";
import {
  passingLevel2History,
  passingMelodicSing2bHistory,
  passingSingleNoteHistory,
} from "./fixtures/attempts.ts";

describe("getSessionStepForExercise", () => {
  it("returns interval-2a for melodic sing until 2b unlocks", () => {
    const records = passingSingleNoteHistory();
    expect(
      getSessionStepForExercise("interval-melodic-sing", records),
    ).toEqual({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    });
  });

  it("returns interval-2b for melodic exercises when that tier is unlocked", () => {
    const records = passingLevel2History();
    expect(
      getSessionStepForExercise("interval-melodic-sing", records),
    ).toEqual({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    });
    expect(
      getSessionStepForExercise("interval-melodic-id", records),
    ).toEqual({
      exerciseId: "interval-melodic-id",
      contentTierId: "interval-2a",
    });
  });

  it("returns interval-2b for melodic identify after sing at 2b passes", () => {
    const records = passingMelodicSing2bHistory();
    expect(
      getSessionStepForExercise("interval-melodic-id", records),
    ).toEqual({
      exerciseId: "interval-melodic-id",
      contentTierId: "interval-2b",
    });
  });

  it("returns interval-2a for harmonic exercises even when melodic 2b is active", () => {
    const records = passingMelodicSing2bHistory();
    expect(
      getSessionStepForExercise("interval-harmonic-sing", records),
    ).toEqual({
      exerciseId: "interval-harmonic-sing",
      contentTierId: "interval-2a",
    });
    expect(
      getSessionStepForExercise("interval-harmonic-id", records),
    ).toEqual({
      exerciseId: "interval-harmonic-id",
      contentTierId: "interval-2a",
    });
  });
});
