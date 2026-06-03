import { describe, expect, it } from "vitest";
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
});

describe("isLevelUnlocked", () => {
  it("unlocks level 1 with no history", () => {
    expect(isLevelUnlocked(1, [])).toBe(true);
  });

  it("locks level 2 until single-note meets thresholds", () => {
    expect(isLevelUnlocked(2, [])).toBe(false);
    expect(isLevelUnlocked(2, passingSingleNoteHistory())).toBe(true);
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

  it("returns null when every path exercise meets thresholds", () => {
    const records: AttemptRecord[] = [];
    for (const exerciseId of [
      "single-note",
      "interval-melodic-sing",
      "interval-harmonic-sing",
      "interval-melodic-id",
      "interval-harmonic-id",
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
