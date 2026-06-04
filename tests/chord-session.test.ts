import { describe, expect, it } from "vitest";
import { getEligibleChordTypeIds } from "../src/curriculum/steps.ts";
import {
  pickRandomInversionFromTier,
  prepareChordQuestion,
} from "../src/ui/chord-session.ts";
import type { SessionPlanner } from "../src/session/planner.ts";
import { passingScaleDegreeHistory } from "./fixtures/attempts.ts";

describe("prepareChordQuestion", () => {
  it("uses planner chord type and attaches tier metadata", () => {
    const planner: SessionPlanner = {
      planNextQuestionTag: () => "major-triad-sing-middle",
    };
    const question = prepareChordQuestion(
      passingScaleDegreeHistory(),
      planner,
      { lowMidi: 48, highMidi: 67 },
      () => 0,
    );

    expect(question.chordTypeId).toBe("major-triad-sing-middle");
    expect(question.contentTierId).toBe("chord-1a");
    expect(question.eligibleTagIds).toEqual(getEligibleChordTypeIds("chord-1a"));
    expect(question.inversionId).toBe("root");
    expect(question.chord).toBeDefined();
    expect(question.target.midi).toBeGreaterThanOrEqual(48);
    expect(question.target.midi).toBeLessThanOrEqual(67);
  });

  it("draws inversion from the chord-1a tier pool", () => {
    const inversions = new Set<string>();
    for (let i = 0; i < 30; i++) {
      inversions.add(pickRandomInversionFromTier(() => i / 30));
    }
    expect(inversions).toEqual(new Set(["root", "first", "second"]));
  });
});
