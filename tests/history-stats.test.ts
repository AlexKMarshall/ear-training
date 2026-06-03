import { describe, expect, it } from "vitest";
import { computeDashboardStats } from "../src/history/stats.ts";
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
