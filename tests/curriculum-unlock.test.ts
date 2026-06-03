import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isUnlockAllEnabled } from "../src/curriculum/dev-unlock.ts";
import {
  getContinueExercise,
  getUnlockRequirement,
  isExerciseUnlocked,
  isLevelUnlocked,
  MIN_QUESTION_PASS_RATE,
  MIN_QUESTIONS,
} from "../src/curriculum/unlock.ts";
import type { AttemptRecord } from "../src/history/types.ts";
import {
  attempt,
  passingLevel2History,
  passingSingleNoteHistory,
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

  it("locks scale-degree-sing until interval-harmonic-id passes", () => {
    const records = passingLevel2History().filter(
      (record) => record.exerciseId !== "interval-harmonic-id",
    );
    expect(isExerciseUnlocked("scale-degree-sing", records)).toBe(false);
    expect(isExerciseUnlocked("scale-degree-sing", passingLevel2History())).toBe(
      true,
    );
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

  it("locks level 3 until level 2 path is complete", () => {
    expect(isLevelUnlocked(3, passingSingleNoteHistory())).toBe(false);
    expect(isLevelUnlocked(3, passingLevel2History())).toBe(true);
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
    expect(getContinueExercise(passingLevel2History())).toBe(
      "scale-degree-sing",
    );
  });

  it("returns null when every path exercise meets thresholds", () => {
    const records: AttemptRecord[] = [];
    for (const exerciseId of [
      "single-note",
      "interval-melodic-sing",
      "interval-harmonic-sing",
      "interval-melodic-id",
      "interval-harmonic-id",
      "scale-degree-sing",
    ] as const) {
      records.push(
        ...Array.from({ length: MIN_QUESTIONS }, (_, i) =>
          attempt({
            exerciseId,
            passed: true,
            attemptNumber: 1,
            centsOff: 0,
            questionIndex: i,
            roundId: `${exerciseId}-${i}`,
          }),
        ),
      );
    }
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
});
