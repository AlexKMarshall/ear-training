import { describe, expect, it } from "vitest";
import {
  CURRICULUM_STEPS,
  getEligibleChordTypeIds,
  getEligibleInversionIds,
  getEligibleIntervalIds,
  getEligibleTagIds,
  getStepIndex,
  stepsForExercise,
} from "../src/curriculum/steps.ts";
import {
  DIATONIC_MAJOR_INTERVAL_IDS,
  INTERVAL_2A_IDS,
} from "../src/interval-config.ts";

describe("curriculum steps", () => {
  it("defines guided steps in unlock order through melodic 2b", () => {
    expect(CURRICULUM_STEPS.map((s) => `${s.exerciseId}@${s.contentTierId}`)).toEqual([
      "single-note@tier-1",
      "interval-melodic-sing@interval-2a",
      "interval-harmonic-sing@interval-2a",
      "interval-melodic-id@interval-2a",
      "interval-harmonic-id@interval-2a",
      "interval-melodic-sing@interval-2b",
      "interval-melodic-id@interval-2b",
      "scale-degree-sing@degree-3a",
    ]);
  });

  it("places interval 2a tags inside the 2b diatonic pool", () => {
    const twoA = getEligibleIntervalIds("interval-2a");
    const twoB = getEligibleIntervalIds("interval-2b");
    expect(twoB).toHaveLength(12);
    for (const id of twoA) {
      expect(twoB).toContain(id);
    }
    expect(twoA).toEqual([...INTERVAL_2A_IDS]);
    expect(twoB).toEqual([...DIATONIC_MAJOR_INTERVAL_IDS]);
  });

  it("exposes twelve tags for melodic interval 2b steps", () => {
    const sing2b = CURRICULUM_STEPS.find(
      (s) =>
        s.exerciseId === "interval-melodic-sing" &&
        s.contentTierId === "interval-2b",
    )!;
    expect(getEligibleTagIds(sing2b)).toHaveLength(12);
  });

  it("orders 2b steps after all four interval modes at 2a", () => {
    const harmonicId2a = getStepIndex({
      exerciseId: "interval-harmonic-id",
      contentTierId: "interval-2a",
    });
    const melodicSing2b = getStepIndex({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    });
    const melodicId2b = getStepIndex({
      exerciseId: "interval-melodic-id",
      contentTierId: "interval-2b",
    });
    expect(harmonicId2a).toBe(4);
    expect(melodicSing2b).toBe(5);
    expect(melodicId2b).toBe(6);
    expect(melodicSing2b).toBeGreaterThan(harmonicId2a);
    expect(melodicId2b).toBeGreaterThan(melodicSing2b);
  });

  it("returns ordered steps per exercise for tier progression", () => {
    expect(stepsForExercise("interval-melodic-sing").map((s) => s.contentTierId)).toEqual([
      "interval-2a",
      "interval-2b",
    ]);
    expect(stepsForExercise("interval-harmonic-sing").map((s) => s.contentTierId)).toEqual([
      "interval-2a",
    ]);
    expect(stepsForExercise("scale-degree-sing").map((s) => s.contentTierId)).toEqual([
      "degree-3a",
    ]);
  });

  it("presets degree-3a tags from enabled scale degrees", () => {
    const step = CURRICULUM_STEPS.find((s) => s.contentTierId === "degree-3a")!;
    expect(getEligibleTagIds(step)).toEqual(["fourth", "fifth", "octave"]);
  });

  it("presets chord-1a types and inversions for free practice", () => {
    expect(getEligibleChordTypeIds("chord-1a")).toEqual([
      "major-triad-sing-middle",
      "minor-triad-sing-middle",
      "diminished-triad-sing-middle",
    ]);
    expect(getEligibleInversionIds("chord-1a")).toEqual([
      "root",
      "first",
      "second",
    ]);
  });
});
