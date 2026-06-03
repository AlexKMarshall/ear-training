import { describe, expect, it } from "vitest";
import {
  computeDashboardStats,
  computeExerciseProgress,
  computeExerciseStats,
} from "../src/history/stats.ts";
import { computeTagStats } from "../src/history/tag-stats.ts";
import type { AttemptRecord } from "../src/history/types.ts";

function attempt(
  overrides: Partial<AttemptRecord> & Pick<AttemptRecord, "passed" | "attemptNumber" | "centsOff">,
): AttemptRecord {
  return {
    exerciseId: "single-note",
    timestamp: 1,
    targetMidi: 60,
    targetHz: 261.63,
    targetName: "C4",
    roundId: "round-1",
    questionIndex: 0,
    ...overrides,
  };
}

describe("computeDashboardStats", () => {
  it("returns zeros for empty history", () => {
    const stats = computeDashboardStats([]);
    expect(stats.totalAttempts).toBe(0);
    expect(stats.attemptPassRatePercent).toBe(0);
    expect(stats.firstTryRatePercent).toBe(0);
    expect(stats.medianAbsCents).toBe(0);
  });

  it("computes attempt pass rate and median cents", () => {
    const stats = computeDashboardStats([
      attempt({ passed: true, attemptNumber: 1, centsOff: 10 }),
      attempt({ passed: false, attemptNumber: 1, centsOff: -30 }),
      attempt({ passed: true, attemptNumber: 2, centsOff: 5, questionIndex: 1 }),
    ]);
    expect(stats.totalAttempts).toBe(3);
    expect(stats.attemptPassRatePercent).toBe(67);
    expect(stats.medianAbsCents).toBe(10);
  });

  it("computes first-try rate per question", () => {
    const stats = computeDashboardStats([
      attempt({ passed: true, attemptNumber: 1, centsOff: 0, questionIndex: 0 }),
      attempt({
        passed: false,
        attemptNumber: 1,
        centsOff: 50,
        questionIndex: 1,
        roundId: "round-1",
      }),
      attempt({
        passed: true,
        attemptNumber: 2,
        centsOff: 5,
        questionIndex: 1,
        roundId: "round-1",
      }),
    ]);
    expect(stats.totalQuestions).toBe(2);
    expect(stats.firstTryRatePercent).toBe(50);
    expect(stats.questionPassRatePercent).toBe(100);
  });

  it("splits stats by exercise", () => {
    const stats = computeDashboardStats([
      attempt({
        exerciseId: "single-note",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
      }),
      attempt({
        exerciseId: "chord-middle",
        passed: false,
        attemptNumber: 1,
        centsOff: 40,
        questionIndex: 0,
        roundId: "r2",
      }),
    ]);
    expect(stats.byExercise[0]!.attemptCount).toBe(1);
    expect(stats.byExercise[0]!.attemptPassRatePercent).toBe(100);
    expect(stats.byExercise[1]!.attemptCount).toBe(1);
    expect(stats.byExercise[1]!.attemptPassRatePercent).toBe(0);
  });

  it("includes interval melodic sing in byExercise", () => {
    const stats = computeDashboardStats([
      attempt({
        exerciseId: "interval-melodic-sing",
        passed: true,
        attemptNumber: 1,
        centsOff: 8,
        intervalId: "perfect-fifth",
      }),
    ]);
    const intervalStats = stats.byExercise.find(
      (s) => s.exerciseId === "interval-melodic-sing",
    );
    expect(intervalStats?.attemptCount).toBe(1);
    expect(intervalStats?.label).toBe("Sing melodic intervals");
    expect(intervalStats?.byTag?.[0]?.label).toBe("Perfect 5th");
  });

  it("overall median uses sing attempts only", () => {
    const stats = computeDashboardStats([
      attempt({
        exerciseId: "interval-melodic-id",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
        intervalId: "perfect-fifth",
      }),
      attempt({
        exerciseId: "interval-melodic-sing",
        passed: true,
        attemptNumber: 1,
        centsOff: 20,
        intervalId: "perfect-fifth",
      }),
    ]);
    expect(stats.medianAbsCents).toBe(20);
  });
});

describe("tag breakdown", () => {
  it("sorts intervals weakest first and includes median cents for sing", () => {
    const stats = computeExerciseStats("interval-melodic-sing", [
      attempt({
        exerciseId: "interval-melodic-sing",
        passed: true,
        attemptNumber: 1,
        centsOff: 5,
        intervalId: "perfect-fifth",
        questionIndex: 0,
      }),
      attempt({
        exerciseId: "interval-melodic-sing",
        passed: false,
        attemptNumber: 1,
        centsOff: 50,
        intervalId: "perfect-fourth",
        questionIndex: 1,
        roundId: "round-1",
      }),
      attempt({
        exerciseId: "interval-melodic-sing",
        passed: true,
        attemptNumber: 2,
        centsOff: 10,
        intervalId: "perfect-fourth",
        questionIndex: 1,
        roundId: "round-1",
      }),
    ]);
    expect(stats.byTag).toHaveLength(2);
    expect(stats.byTag![0]!.tagId).toBe("perfect-fourth");
    expect(stats.byTag![0]!.questionPassRatePercent).toBe(100);
    expect(stats.byTag![1]!.tagId).toBe("perfect-fifth");
    expect(stats.byTag![0]!.medianAbsCents).toBe(30);
  });

  it("identify exercise has null median on exercise and tags", () => {
    const stats = computeExerciseStats("interval-melodic-id", [
      attempt({
        exerciseId: "interval-melodic-id",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
        intervalId: "perfect-octave",
      }),
    ]);
    expect(stats.medianAbsCents).toBeNull();
    expect(stats.byTag![0]!.medianAbsCents).toBeNull();
  });

  it("single-note has no byTag", () => {
    const stats = computeExerciseStats("single-note", [
      attempt({ passed: true, attemptNumber: 1, centsOff: 0 }),
    ]);
    expect(stats.byTag).toBeUndefined();
  });

  it("groups chord-middle by chord type", () => {
    const stats = computeExerciseStats("chord-middle", [
      attempt({
        exerciseId: "chord-middle",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
        chordTypeId: "major-triad-sing-middle",
      }),
    ]);
    expect(stats.byTag![0]!.label).toBe("Major triad");
  });

  it("groups scale-degree-sing by degree", () => {
    const stats = computeExerciseStats("scale-degree-sing", [
      attempt({
        exerciseId: "scale-degree-sing",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
        degreeId: "fifth",
      }),
    ]);
    expect(stats.byTag![0]!.label).toBe("5th");
  });

  it("computeTagStats omits records without tag id", () => {
    const rows = computeTagStats(
      [
        attempt({
          passed: true,
          attemptNumber: 1,
          centsOff: 0,
          intervalId: "perfect-fifth",
        }),
        attempt({ passed: true, attemptNumber: 1, centsOff: 0 }),
      ],
      {
        kind: "interval",
        getTagId: (r) => r.intervalId,
        includeMedianCents: true,
      },
    );
    expect(rows).toHaveLength(1);
  });
});

describe("computeExerciseStats", () => {
  it("ignores attempts for other exercises", () => {
    const stats = computeExerciseStats("single-note", [
      attempt({
        exerciseId: "single-note",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
      }),
      attempt({
        exerciseId: "chord-middle",
        passed: false,
        attemptNumber: 1,
        centsOff: 40,
        roundId: "r2",
      }),
    ]);
    expect(stats.exerciseId).toBe("single-note");
    expect(stats.attemptCount).toBe(1);
    expect(stats.questionCount).toBe(1);
    expect(stats.questionPassRatePercent).toBe(100);
  });
});

describe("computeExerciseProgress", () => {
  it("returns zeros when the exercise has no attempts", () => {
    const progress = computeExerciseProgress("interval-melodic-sing", [
      attempt({
        exerciseId: "single-note",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
      }),
    ]);
    expect(progress).toEqual({
      questionCount: 0,
      questionPassRatePercent: 0,
    });
  });

  it("groups questions by roundId and questionIndex", () => {
    const records = [
      attempt({
        exerciseId: "single-note",
        passed: false,
        attemptNumber: 1,
        centsOff: 50,
        questionIndex: 0,
        roundId: "round-1",
      }),
      attempt({
        exerciseId: "single-note",
        passed: true,
        attemptNumber: 2,
        centsOff: 5,
        questionIndex: 0,
        roundId: "round-1",
      }),
      attempt({
        exerciseId: "single-note",
        passed: false,
        attemptNumber: 1,
        centsOff: 40,
        questionIndex: 1,
        roundId: "round-1",
      }),
      attempt({
        exerciseId: "single-note",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
        questionIndex: 0,
        roundId: "round-2",
      }),
    ];
    const progress = computeExerciseProgress("single-note", records);
    expect(progress.questionCount).toBe(3);
    expect(progress.questionPassRatePercent).toBe(67);
  });

  it("matches dashboard question pass rate for one exercise", () => {
    const records = [
      attempt({
        exerciseId: "single-note",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
        questionIndex: 0,
      }),
      attempt({
        exerciseId: "chord-middle",
        passed: false,
        attemptNumber: 1,
        centsOff: 40,
        roundId: "r2",
      }),
    ];
    const progress = computeExerciseProgress("single-note", records);
    const dashboard = computeDashboardStats(records);
    const singleNote = dashboard.byExercise.find(
      (s) => s.exerciseId === "single-note",
    );
    expect(progress.questionCount).toBe(singleNote?.questionCount);
    expect(progress.questionPassRatePercent).toBe(
      singleNote?.questionPassRatePercent,
    );
  });
});
