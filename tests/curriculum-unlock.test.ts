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
  passingLevel2History,
  passingMelodicSing2bHistory,
  passingSingleNoteHistory,
  passingStepHistory,
  passingThroughMelodic2bHistory,
} from "./fixtures/attempts.ts";

describe("isExerciseUnlocked", () => {
  it("always unlocks the first path exercise", () => {
    expect(isExerciseUnlocked("single-note", [])).toBe(true);
  });

  it("always unlocks free practice", () => {
    expect(isExerciseUnlocked("chord-middle", [])).toBe(true);
  });

  it("locks path successors until the predecessor meets thresholds", () => {
    const records = passingSingleNoteHistory().slice(0, MIN_QUESTIONS - 1);
    expect(isExerciseUnlocked("interval-melodic-sing", records)).toBe(false);
  });

  it("unlocks the next path exercise when the predecessor passes", () => {
    const records = passingSingleNoteHistory();
    expect(isExerciseUnlocked("interval-melodic-sing", records)).toBe(true);
  });

  it("locks scale-degree-sing until melodic identify at 2b passes", () => {
    expect(isExerciseUnlocked("scale-degree-sing", passingLevel2History())).toBe(
      false,
    );
    expect(
      isExerciseUnlocked("scale-degree-sing", passingThroughMelodic2bHistory()),
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

  it("locks level 3 until melodic 2b path completes", () => {
    expect(isLevelUnlocked(3, passingSingleNoteHistory())).toBe(false);
    expect(isLevelUnlocked(3, passingLevel2History())).toBe(false);
    expect(
      isLevelUnlocked(3, passingThroughMelodic2bHistory()),
    ).toBe(true);
  });
});

describe("isStepUnlocked", () => {
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

  it("advances to scale degrees after melodic 2b completes", () => {
    expect(getContinueExercise(passingThroughMelodic2bHistory())).toBe(
      "scale-degree-sing",
    );
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
    const records: AttemptRecord[] = [
      ...passingThroughMelodic2bHistory(),
      ...passingStepHistory({
        exerciseId: "scale-degree-sing",
        contentTierId: "degree-3a",
      }),
    ];
    expect(getContinueExercise(records)).toBe(null);
  });
});

describe("getUnlockRequirement", () => {
  it("returns null for the first path exercise and free practice", () => {
    expect(getUnlockRequirement("single-note")).toBe(null);
    expect(getUnlockRequirement("chord-middle")).toBe(null);
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
      predecessorId: "interval-melodic-id",
      predecessorLabel:
        "Identify melodic intervals (diatonic intervals within one octave)",
      minQuestions: MIN_QUESTIONS,
      minPassRatePercent: MIN_QUESTION_PASS_RATE,
    });
  });
});
