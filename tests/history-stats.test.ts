import { describe, expect, it } from "vitest";
import {
  computeDashboardStats,
  computeExerciseProgress,
  computeExerciseStats,
} from "../src/history/stats.ts";
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
      }),
    ]);
    const intervalStats = stats.byExercise.find(
      (s) => s.exerciseId === "interval-melodic-sing",
    );
    expect(intervalStats?.attemptCount).toBe(1);
    expect(intervalStats?.label).toBe("Sing melodic intervals");
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
