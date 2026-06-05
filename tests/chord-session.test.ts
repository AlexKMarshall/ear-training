import { describe, expect, it } from "vitest";
import { getEligibleChordTypeIds } from "../src/curriculum/curriculum-lessons.ts";
import {
  pickRandomInversionFromTier,
  prepareChordExercise,
} from "../src/ui/chord-session.ts";
import type { SessionPlanner } from "../src/session/planner.ts";
import { passingMinorDiatonicScaleDegreeHistory } from "./fixtures/attempts.ts";

describe("prepareChordExercise", () => {
  it("uses planner chord type and attaches tier metadata", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "major-triad-sing-middle",
    };
    const exercise = prepareChordExercise(
      passingMinorDiatonicScaleDegreeHistory(),
      planner,
      { lowMidi: 48, highMidi: 67 },
      () => 0,
    );

    expect(exercise.chordTypeId).toBe("major-triad-sing-middle");
    expect(exercise.contentTierId).toBe("chord-1a");
    expect(exercise.eligibleTagIds).toEqual(getEligibleChordTypeIds("chord-1a"));
    expect(exercise.inversionId).toBe("root");
    expect(exercise.chord).toBeDefined();
    expect(exercise.target.midi).toBeGreaterThanOrEqual(48);
    expect(exercise.target.midi).toBeLessThanOrEqual(67);
  });

  it("draws inversion from the chord-1a tier pool", () => {
    const inversions = new Set<string>();
    for (let i = 0; i < 30; i++) {
      inversions.add(pickRandomInversionFromTier(() => i / 30));
    }
    expect(inversions).toEqual(new Set(["root", "first", "second"]));
  });
});
