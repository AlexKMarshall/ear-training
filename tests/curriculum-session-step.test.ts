import { describe, expect, it } from "vitest";
import { CHORD_MIDDLE_STEP, getSessionStepForExercise } from "../src/curriculum/session-step.ts";
import {
  passingLevel2History,
  passingMelodicSing2bHistory,
  passingScaleDegreeHistory,
  passingSingleNoteHistory,
  passingStepHistory,
  passingThroughHarmonic2bHistory,
  passingThroughMelodic2bHistory,
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

  it("returns interval-2a for harmonic exercises until harmonic sing at 2b unlocks", () => {
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

  it("returns interval-2b for harmonic exercises when that tier is unlocked", () => {
    const records = passingThroughMelodic2bHistory();
    expect(
      getSessionStepForExercise("interval-harmonic-sing", records),
    ).toEqual({
      exerciseId: "interval-harmonic-sing",
      contentTierId: "interval-2b",
    });
    expect(
      getSessionStepForExercise("interval-harmonic-id", records),
    ).toEqual({
      exerciseId: "interval-harmonic-id",
      contentTierId: "interval-2a",
    });
  });

  it("returns interval-2b for harmonic identify after harmonic sing at 2b passes", () => {
    const records = [
      ...passingThroughMelodic2bHistory(),
      ...passingStepHistory({
        exerciseId: "interval-harmonic-sing",
        contentTierId: "interval-2b",
      }),
    ];
    expect(
      getSessionStepForExercise("interval-harmonic-id", records),
    ).toEqual({
      exerciseId: "interval-harmonic-id",
      contentTierId: "interval-2b",
    });
  });

  it("returns degree-3a for scale-degree sing when interval 2b path is complete", () => {
    const records = passingThroughHarmonic2bHistory();
    expect(
      getSessionStepForExercise("scale-degree-sing", records),
    ).toEqual({
      exerciseId: "scale-degree-sing",
      contentTierId: "degree-3a",
    });
  });

  it("returns chord-1a for chord-middle when that step is unlocked", () => {
    expect(getSessionStepForExercise("chord-middle", passingScaleDegreeHistory())).toEqual(
      CHORD_MIDDLE_STEP,
    );
  });
});
