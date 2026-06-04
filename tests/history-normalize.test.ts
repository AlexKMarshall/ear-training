import { describe, expect, it } from "vitest";
import { computeDashboardStats } from "../src/history/stats.ts";
import { normalizeAttemptRecord } from "../src/history/normalize.ts";

describe("normalizeAttemptRecord", () => {
  it("maps legacy exerciseId, roundId, and questionIndex", () => {
    const normalized = normalizeAttemptRecord({
      exerciseId: "single-note",
      roundId: "round-1",
      questionIndex: 2,
      timestamp: 1,
      centsOff: 12,
      passed: true,
      attemptNumber: 1,
      targetMidi: 60,
      targetHz: 261.63,
      targetName: "C4",
    });

    expect(normalized).toMatchObject({
      practiceModeId: "single-note",
      lessonId: "round-1",
      exerciseIndex: 2,
      centsOff: 12,
    });
  });

  it("returns null when practice mode is missing", () => {
    expect(
      normalizeAttemptRecord({
        timestamp: 1,
        centsOff: 0,
        passed: true,
        attemptNumber: 1,
        targetMidi: 60,
        targetHz: 261.63,
        targetName: "C4",
        lessonId: "lesson-1",
        exerciseIndex: 0,
      }),
    ).toBeNull();
  });
});

describe("computeDashboardStats with legacy-shaped rows", () => {
  it("does not throw when records still use exerciseId", () => {
    const legacy = normalizeAttemptRecord({
      exerciseId: "interval-melodic-sing",
      roundId: "lesson-a",
      questionIndex: 0,
      timestamp: 1,
      centsOff: 15,
      passed: true,
      attemptNumber: 1,
      targetMidi: 60,
      targetHz: 261.63,
      targetName: "C4",
    })!;

    expect(() => computeDashboardStats([legacy])).not.toThrow();
    expect(computeDashboardStats([legacy]).medianAbsCents).toBe(15);
  });
});
