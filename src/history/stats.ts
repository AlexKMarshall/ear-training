import { percentOf } from "../lesson.ts";
import { getPracticeMode, PRACTICE_MODES } from "../practice-modes/registry.ts";
import {
  computeTagBreakdownForExercise,
  singAttemptsMedianAbsCents,
  type TagStats,
} from "./tag-stats.ts";
import { type AttemptRecord, PRACTICE_MODE_LABELS, type PracticeModeId } from "./types.ts";

export interface PracticeModeStats {
  practiceModeId: PracticeModeId;
  label: string;
  attemptCount: number;
  lessonExerciseCount: number;
  /** Share of scored attempts that passed. */
  attemptPassRatePercent: number;
  /** Share of questions with at least one passing attempt. */
  lessonExercisePassRatePercent: number;
  /** Null for identify-only exercise sections (cents not meaningful). */
  medianAbsCents: number | null;
  firstTryRatePercent: number;
  byTag?: TagStats[];
}

export interface DashboardStats {
  totalAttempts: number;
  totalLessonExercises: number;
  attemptPassRatePercent: number;
  lessonExercisePassRatePercent: number;
  /** Median abs cents over sing attempts only. */
  medianAbsCents: number;
  firstTryRatePercent: number;
  byPracticeMode: PracticeModeStats[];
}

function lessonExerciseKey(record: AttemptRecord): string {
  return `${record.lessonId}:${record.exerciseIndex}`;
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

export function computeLessonExerciseStats(records: readonly AttemptRecord[]): {
  lessonExerciseCount: number;
  lessonExercisePassRatePercent: number;
  firstTryRatePercent: number;
} {
  const byLessonExercise = new Map<string, AttemptRecord[]>();
  for (const record of records) {
    const key = lessonExerciseKey(record);
    const group = byLessonExercise.get(key) ?? [];
    group.push(record);
    byLessonExercise.set(key, group);
  }

  const lessonExerciseCount = byLessonExercise.size;
  if (lessonExerciseCount === 0) {
    return {
      lessonExerciseCount: 0,
      lessonExercisePassRatePercent: 0,
      firstTryRatePercent: 0,
    };
  }

  let lessonExercisesPassed = 0;
  let firstTryPassed = 0;

  for (const attempts of byLessonExercise.values()) {
    const passed = attempts.some((a) => a.passed);
    if (passed) lessonExercisesPassed += 1;

    const first = attempts.find((a) => a.attemptNumber === 1);
    if (first?.passed) firstTryPassed += 1;
  }

  return {
    lessonExerciseCount,
    lessonExercisePassRatePercent: percentOf(lessonExercisesPassed, lessonExerciseCount),
    firstTryRatePercent: percentOf(firstTryPassed, lessonExerciseCount),
  };
}

function computeAttemptPassRate(records: readonly AttemptRecord[]): number {
  if (records.length === 0) return 0;
  const passed = records.filter((r) => r.passed).length;
  return percentOf(passed, records.length);
}

export function computeMedianAbsCents(records: readonly AttemptRecord[]): number {
  if (records.length === 0) return 0;
  return Math.round(median(records.map((r) => Math.abs(r.centsOff))));
}

function statsForExercise(
  practiceModeId: PracticeModeId,
  records: readonly AttemptRecord[],
): PracticeModeStats {
  const lessonExerciseStats = computeLessonExerciseStats(records);
  const isIdentify = getPracticeMode(practiceModeId).responseMode === "select";
  return {
    practiceModeId,
    label: PRACTICE_MODE_LABELS[practiceModeId],
    attemptCount: records.length,
    ...lessonExerciseStats,
    attemptPassRatePercent: computeAttemptPassRate(records),
    medianAbsCents: isIdentify ? null : computeMedianAbsCents(records),
    byTag: computeTagBreakdownForExercise(practiceModeId, records),
  };
}

export interface ExerciseProgress {
  lessonExerciseCount: number;
  lessonExercisePassRatePercent: number;
}

export function computePracticeModeStats(
  practiceModeId: PracticeModeId,
  records: readonly AttemptRecord[],
): PracticeModeStats {
  return statsForExercise(
    practiceModeId,
    records.filter((r) => r.practiceModeId === practiceModeId),
  );
}

/** Per-exercise question progress for unlock rules (same grouping as dashboard). */
export function computePracticeModeProgress(
  practiceModeId: PracticeModeId,
  records: readonly AttemptRecord[],
): ExerciseProgress {
  const filtered = records.filter((r) => r.practiceModeId === practiceModeId);
  const { lessonExerciseCount, lessonExercisePassRatePercent } =
    computeLessonExerciseStats(filtered);
  return { lessonExerciseCount, lessonExercisePassRatePercent };
}

export function computeDashboardStats(records: readonly AttemptRecord[]): DashboardStats {
  const lessonExerciseStats = computeLessonExerciseStats(records);
  const practiceModeIds = PRACTICE_MODES.map((e) => e.id);

  return {
    totalAttempts: records.length,
    totalLessonExercises: lessonExerciseStats.lessonExerciseCount,
    lessonExercisePassRatePercent: lessonExerciseStats.lessonExercisePassRatePercent,
    firstTryRatePercent: lessonExerciseStats.firstTryRatePercent,
    attemptPassRatePercent: computeAttemptPassRate(records),
    medianAbsCents: singAttemptsMedianAbsCents(records),
    byPracticeMode: practiceModeIds.map((id) =>
      statsForExercise(
        id,
        records.filter((r) => r.practiceModeId === id),
      ),
    ),
  };
}
