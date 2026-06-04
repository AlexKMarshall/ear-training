import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isUnlockAllEnabled } from "../src/curriculum/dev-unlock.ts";
import {
  getContinueExercise,
  getContinueStep,
  getUnlockRequirement,
  isExerciseUnlocked,
  isLevelUnlocked,
  isStepUnlocked,
  MIN_QUESTION_PASS_RATE,
  MIN_QUESTIONS,
} from "../src/curriculum/unlock.ts";
import type { AttemptRecord } from "../src/history/types.ts";
import {
  attempt,
  passingFullGuidedPathHistory,
  passingLevel2History,
  passingMelodicSing2bHistory,
  passingScaleDegreeHistory,
  passingSingleNoteHistory,
  passingStepHistory,
  passingThroughHarmonic2bHistory,
  passingThroughMelodic2bHistory,
} from "./fixtures/attempts.ts";

describe("isExerciseUnlocked", () => {
  it("always unlocks the first path exercise", () => {
    expect(isExerciseUnlocked("single-note", [])).toBe(true);
  });

  it("locks chord-middle until scale-degree sing passes", () => {
    expect(isExerciseUnlocked("chord-middle", [])).toBe(false);
    expect(isExerciseUnlocked("chord-middle", passingThroughHarmonic2bHistory())).toBe(
      false,
    );
    expect(isExerciseUnlocked("chord-middle", passingScaleDegreeHistory())).toBe(
      true,
    );
  });

  it("locks path successors until the predecessor meets thresholds", () => {
    const records = passingSingleNoteHistory().slice(0, MIN_QUESTIONS - 1);
    expect(isExerciseUnlocked("interval-melodic-sing", records)).toBe(false);
  });

  it("unlocks the next path exercise when the predecessor passes", () => {
    const records = passingSingleNoteHistory();
    expect(isExerciseUnlocked("interval-melodic-sing", records)).toBe(true);
  });

  it("locks scale-degree-sing until harmonic identify at 2b passes", () => {
    expect(isExerciseUnlocked("scale-degree-sing", passingLevel2History())).toBe(
      false,
    );
    expect(
      isExerciseUnlocked("scale-degree-sing", passingThroughMelodic2bHistory()),
    ).toBe(false);
    expect(
      isExerciseUnlocked("scale-degree-sing", passingThroughHarmonic2bHistory()),
    ).toBe(true);
  });

  describe("?unlock=all", () => {
    beforeEach(() => {
      vi.stubGlobal("location", { search: "?unlock=all" });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("isUnlockAllEnabled reads the query param", () => {
      expect(isUnlockAllEnabled()).toBe(true);
      expect(isUnlockAllEnabled("")).toBe(false);
    });

    it("unlocks path exercises with empty history", () => {
      expect(isExerciseUnlocked("scale-degree-sing", [])).toBe(true);
      expect(isExerciseUnlocked("interval-melodic-sing", [])).toBe(true);
    });

    it("does not change getContinueExercise progress", () => {
      expect(getContinueExercise([])).toBe("single-note");
    });
  });
});

describe("isLevelUnlocked", () => {
  it("unlocks level 1 with no history", () => {
    expect(isLevelUnlocked(1, [])).toBe(true);
  });

  it("locks level 2 until single-note meets thresholds", () => {
    expect(isLevelUnlocked(2, [])).toBe(false);
    expect(isLevelUnlocked(2, passingSingleNoteHistory())).toBe(true);
  });

  it("locks level 3 until harmonic 2b path completes", () => {
    expect(isLevelUnlocked(3, passingSingleNoteHistory())).toBe(false);
    expect(isLevelUnlocked(3, passingLevel2History())).toBe(false);
    expect(isLevelUnlocked(3, passingThroughMelodic2bHistory())).toBe(false);
    expect(
      isLevelUnlocked(3, passingThroughHarmonic2bHistory()),
    ).toBe(true);
  });
});

describe("isStepUnlocked", () => {
  it("locks melodic identify at 2a until melodic sing at 2a passes", () => {
    const id2a = {
      exerciseId: "interval-melodic-id" as const,
      contentTierId: "interval-2a" as const,
    };
    expect(isStepUnlocked(id2a, passingSingleNoteHistory())).toBe(false);
    expect(
      isStepUnlocked(id2a, [
        ...passingSingleNoteHistory(),
        ...passingStepHistory({
          exerciseId: "interval-melodic-sing",
          contentTierId: "interval-2a",
        }),
      ]),
    ).toBe(true);
  });

  it("locks harmonic sing at 2a until melodic identify at 2a passes", () => {
    const sing2a = {
      exerciseId: "interval-harmonic-sing" as const,
      contentTierId: "interval-2a" as const,
    };
    expect(isStepUnlocked(sing2a, passingSingleNoteHistory())).toBe(false);
    expect(
      isStepUnlocked(sing2a, [
        ...passingSingleNoteHistory(),
        ...passingStepHistory({
          exerciseId: "interval-melodic-sing",
          contentTierId: "interval-2a",
        }),
      ]),
    ).toBe(false);
    expect(
      isStepUnlocked(sing2a, [
        ...passingSingleNoteHistory(),
        ...passingStepHistory({
          exerciseId: "interval-melodic-sing",
          contentTierId: "interval-2a",
        }),
        ...passingStepHistory({
          exerciseId: "interval-melodic-id",
          contentTierId: "interval-2a",
        }),
      ]),
    ).toBe(true);
  });

  it("locks melodic 2b until all four interval modes at 2a pass", () => {
    const sing2b = {
      exerciseId: "interval-melodic-sing" as const,
      contentTierId: "interval-2b" as const,
    };
    expect(isStepUnlocked(sing2b, passingSingleNoteHistory())).toBe(false);
    const withoutHarmonicId = passingLevel2History().filter(
      (r) => r.exerciseId !== "interval-harmonic-id",
    );
    expect(isStepUnlocked(sing2b, withoutHarmonicId)).toBe(false);
    expect(isStepUnlocked(sing2b, passingLevel2History())).toBe(true);
  });

  it("locks melodic identify at 2b until melodic sing at 2b passes", () => {
    const id2b = {
      exerciseId: "interval-melodic-id" as const,
      contentTierId: "interval-2b" as const,
    };
    expect(isStepUnlocked(id2b, passingLevel2History())).toBe(false);
    expect(isStepUnlocked(id2b, passingMelodicSing2bHistory())).toBe(true);
  });

  it("locks harmonic sing at 2b until melodic identify at 2b passes", () => {
    const sing2b = {
      exerciseId: "interval-harmonic-sing" as const,
      contentTierId: "interval-2b" as const,
    };
    expect(isStepUnlocked(sing2b, passingMelodicSing2bHistory())).toBe(false);
    expect(isStepUnlocked(sing2b, passingThroughMelodic2bHistory())).toBe(true);
  });

  it("locks harmonic identify at 2b until harmonic sing at 2b passes", () => {
    const id2b = {
      exerciseId: "interval-harmonic-id" as const,
      contentTierId: "interval-2b" as const,
    };
    expect(isStepUnlocked(id2b, passingThroughMelodic2bHistory())).toBe(false);
    expect(
      isStepUnlocked(id2b, [
        ...passingThroughMelodic2bHistory(),
        ...passingStepHistory({
          exerciseId: "interval-harmonic-sing",
          contentTierId: "interval-2b",
        }),
      ]),
    ).toBe(true);
  });
});

describe("getContinueStep", () => {
  it("points at the first path exercise on a fresh profile", () => {
    expect(getContinueStep([])).toEqual({
      exerciseId: "single-note",
      contentTierId: "tier-1",
    });
  });

  it("advances to melodic sing at 2b after level 2 at 2a completes", () => {
    expect(getContinueExercise(passingLevel2History())).toBe(
      "interval-melodic-sing",
    );
    expect(getContinueStep(passingLevel2History())).toEqual({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    });
  });

  it("advances to harmonic sing at 2b after melodic 2b completes", () => {
    expect(getContinueExercise(passingThroughMelodic2bHistory())).toBe(
      "interval-harmonic-sing",
    );
    expect(getContinueStep(passingThroughMelodic2bHistory())).toEqual({
      exerciseId: "interval-harmonic-sing",
      contentTierId: "interval-2b",
    });
  });

  it("advances to scale degrees after harmonic 2b completes", () => {
    expect(getContinueExercise(passingThroughHarmonic2bHistory())).toBe(
      "scale-degree-sing",
    );
  });

  it("advances to chord middle after scale degrees complete", () => {
    expect(getContinueExercise(passingScaleDegreeHistory())).toBe("chord-middle");
    expect(getContinueStep(passingScaleDegreeHistory())).toEqual({
      exerciseId: "chord-middle",
      contentTierId: "chord-1a",
    });
  });
});

describe("getContinueExercise", () => {
  it("points at the first path exercise on a fresh profile", () => {
    expect(getContinueExercise([])).toBe("single-note");
  });

  it("advances after the current exercise meets thresholds", () => {
    expect(getContinueExercise(passingSingleNoteHistory())).toBe(
      "interval-melodic-sing",
    );
  });

  it("returns null when every curriculum step meets thresholds", () => {
    expect(getContinueExercise(passingFullGuidedPathHistory())).toBe(null);
  });
});

describe("getUnlockRequirement", () => {
  it("returns null for the first path exercise", () => {
    expect(getUnlockRequirement("single-note")).toBe(null);
  });

  it("describes the predecessor and thresholds for later path exercises", () => {
    expect(getUnlockRequirement("interval-melodic-sing")).toEqual({
      predecessorId: "single-note",
      predecessorLabel: "Sing a single note",
      minQuestions: MIN_QUESTIONS,
      minPassRatePercent: MIN_QUESTION_PASS_RATE,
    });
  });

  it("includes tier pool in predecessor label for scale-degree sing", () => {
    expect(getUnlockRequirement("scale-degree-sing")).toEqual({
      predecessorId: "interval-harmonic-id",
      predecessorLabel:
        "Identify harmonic intervals (diatonic intervals within one octave)",
      minQuestions: MIN_QUESTIONS,
      minPassRatePercent: MIN_QUESTION_PASS_RATE,
    });
  });

  it("requires scale-degree sing before chord middle", () => {
    expect(getUnlockRequirement("chord-middle")).toEqual({
      predecessorId: "scale-degree-sing",
      predecessorLabel: "Sing scale degrees",
      minQuestions: MIN_QUESTIONS,
      minPassRatePercent: MIN_QUESTION_PASS_RATE,
    });
  });
});
