import { percentOf } from "../round.ts";
import {
  EXERCISE_LABELS,
  type AttemptRecord,
  type ExerciseId,
} from "./types.ts";

export interface ExerciseStats {
  exerciseId: ExerciseId;
  label: string;
  attemptCount: number;
  questionCount: number;
  /** Share of scored attempts that passed. */
  attemptPassRatePercent: number;
  /** Share of questions with at least one passing attempt. */
  questionPassRatePercent: number;
  medianAbsCents: number;
  firstTryRatePercent: number;
}

export interface DashboardStats {
  totalAttempts: number;
  totalQuestions: number;
  attemptPassRatePercent: number;
  questionPassRatePercent: number;
  medianAbsCents: number;
  firstTryRatePercent: number;
  byExercise: ExerciseStats[];
}

function questionKey(record: AttemptRecord): string {
  return `${record.roundId}:${record.questionIndex}`;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

function computeQuestionStats(records: readonly AttemptRecord[]): {
  questionCount: number;
  questionPassRatePercent: number;
  firstTryRatePercent: number;
} {
  const byQuestion = new Map<string, AttemptRecord[]>();
  for (const record of records) {
    const key = questionKey(record);
    const group = byQuestion.get(key) ?? [];
    group.push(record);
    byQuestion.set(key, group);
  }

  const questionCount = byQuestion.size;
  if (questionCount === 0) {
    return {
      questionCount: 0,
      questionPassRatePercent: 0,
      firstTryRatePercent: 0,
    };
  }

  let questionsPassed = 0;
  let firstTryPassed = 0;

  for (const attempts of byQuestion.values()) {
    const passed = attempts.some((a) => a.passed);
    if (passed) questionsPassed += 1;

    const first = attempts.find((a) => a.attemptNumber === 1);
    if (first?.passed) firstTryPassed += 1;
  }

  return {
    questionCount,
    questionPassRatePercent: percentOf(questionsPassed, questionCount),
    firstTryRatePercent: percentOf(firstTryPassed, questionCount),
  };
}

function computeAttemptPassRate(records: readonly AttemptRecord[]): number {
  if (records.length === 0) return 0;
  const passed = records.filter((r) => r.passed).length;
  return percentOf(passed, records.length);
}

function computeMedianAbsCents(records: readonly AttemptRecord[]): number {
  if (records.length === 0) return 0;
  return Math.round(
    median(records.map((r) => Math.abs(r.centsOff))),
  );
}

function statsForExercise(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
): ExerciseStats {
  const questionStats = computeQuestionStats(records);
  return {
    exerciseId,
    label: EXERCISE_LABELS[exerciseId],
    attemptCount: records.length,
    ...questionStats,
    attemptPassRatePercent: computeAttemptPassRate(records),
    medianAbsCents: computeMedianAbsCents(records),
  };
}

export function computeDashboardStats(
  records: readonly AttemptRecord[],
): DashboardStats {
  const questionStats = computeQuestionStats(records);
  const exerciseIds = ["single-note", "chord-middle"] as const;

  return {
    totalAttempts: records.length,
    totalQuestions: questionStats.questionCount,
    questionPassRatePercent: questionStats.questionPassRatePercent,
    firstTryRatePercent: questionStats.firstTryRatePercent,
    attemptPassRatePercent: computeAttemptPassRate(records),
    medianAbsCents: computeMedianAbsCents(records),
    byExercise: exerciseIds.map((id) =>
      statsForExercise(
        id,
        records.filter((r) => r.exerciseId === id),
      ),
    ),
  };
}
