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
  it("defines guided steps in cross-mode unlock order through chord middle", () => {
    expect(CURRICULUM_STEPS.map((s) => `${s.exerciseId}@${s.contentTierId}`)).toEqual([
      "single-note@tier-1",
      "interval-melodic-sing@interval-2a",
      "interval-melodic-id@interval-2a",
      "interval-harmonic-sing@interval-2a",
      "interval-harmonic-id@interval-2a",
      "interval-melodic-sing@interval-2b",
      "interval-melodic-id@interval-2b",
      "interval-harmonic-sing@interval-2b",
      "interval-harmonic-id@interval-2b",
      "scale-degree-sing@degree-3a",
      "chord-middle@chord-1a",
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

  it("exposes twelve tags for interval 2b steps", () => {
    const harmonicSing2b = CURRICULUM_STEPS.find(
      (s) =>
        s.exerciseId === "interval-harmonic-sing" &&
        s.contentTierId === "interval-2b",
    )!;
    expect(getEligibleTagIds(harmonicSing2b)).toHaveLength(12);
  });

  it("orders interval 2a in cross-mode sequence before the 2b block", () => {
    const melodicSing2a = getStepIndex({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    });
    const melodicId2a = getStepIndex({
      exerciseId: "interval-melodic-id",
      contentTierId: "interval-2a",
    });
    const harmonicSing2a = getStepIndex({
      exerciseId: "interval-harmonic-sing",
      contentTierId: "interval-2a",
    });
    const harmonicId2a = getStepIndex({
      exerciseId: "interval-harmonic-id",
      contentTierId: "interval-2a",
    });
    const melodicSing2b = getStepIndex({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    });
    expect(melodicSing2a).toBe(1);
    expect(melodicId2a).toBe(2);
    expect(harmonicSing2a).toBe(3);
    expect(harmonicId2a).toBe(4);
    expect(melodicSing2b).toBe(5);
    expect(melodicId2a).toBeGreaterThan(melodicSing2a);
    expect(harmonicSing2a).toBeGreaterThan(melodicId2a);
    expect(harmonicId2a).toBeGreaterThan(harmonicSing2a);
    expect(melodicSing2b).toBeGreaterThan(harmonicId2a);
  });

  it("orders 2b steps in cross-mode sequence after all four modes at 2a", () => {
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
    const harmonicSing2b = getStepIndex({
      exerciseId: "interval-harmonic-sing",
      contentTierId: "interval-2b",
    });
    const harmonicId2b = getStepIndex({
      exerciseId: "interval-harmonic-id",
      contentTierId: "interval-2b",
    });
    const scaleDegree = getStepIndex({
      exerciseId: "scale-degree-sing",
      contentTierId: "degree-3a",
    });
    const chordMiddle = getStepIndex({
      exerciseId: "chord-middle",
      contentTierId: "chord-1a",
    });
    expect(harmonicId2a).toBe(4);
    expect(melodicSing2b).toBe(5);
    expect(melodicId2b).toBe(6);
    expect(harmonicSing2b).toBe(7);
    expect(harmonicId2b).toBe(8);
    expect(scaleDegree).toBe(9);
    expect(chordMiddle).toBe(10);
    expect(melodicSing2b).toBeGreaterThan(harmonicId2a);
    expect(harmonicSing2b).toBeGreaterThan(melodicId2b);
    expect(harmonicId2b).toBeGreaterThan(harmonicSing2b);
    expect(chordMiddle).toBeGreaterThan(scaleDegree);
  });

  it("returns ordered steps per exercise for tier progression", () => {
    expect(stepsForExercise("interval-melodic-sing").map((s) => s.contentTierId)).toEqual([
      "interval-2a",
      "interval-2b",
    ]);
    expect(stepsForExercise("interval-harmonic-sing").map((s) => s.contentTierId)).toEqual([
      "interval-2a",
      "interval-2b",
    ]);
    expect(stepsForExercise("scale-degree-sing").map((s) => s.contentTierId)).toEqual([
      "degree-3a",
    ]);
    expect(stepsForExercise("chord-middle").map((s) => s.contentTierId)).toEqual([
      "chord-1a",
    ]);
  });

  it("presets degree-3a tags from enabled scale degrees", () => {
    const step = CURRICULUM_STEPS.find((s) => s.contentTierId === "degree-3a")!;
    expect(getEligibleTagIds(step)).toEqual(["fourth", "fifth", "octave"]);
  });

  it("presets chord-1a types and inversions on the chord-middle step", () => {
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
    const step = CURRICULUM_STEPS.find((s) => s.exerciseId === "chord-middle")!;
    expect(getEligibleTagIds(step)).toEqual(getEligibleChordTypeIds("chord-1a"));
  });
});
