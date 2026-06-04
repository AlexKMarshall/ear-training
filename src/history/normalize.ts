import type { AttemptRecord, PracticeModeId } from "./types.ts";
import { PRACTICE_MODE_LABELS } from "./types.ts";

export function isPracticeModeId(value: unknown): value is PracticeModeId {
  return typeof value === "string" && value in PRACTICE_MODE_LABELS;
}

/** Map pre–practice-mode rename fields from IndexedDB (`exerciseId`, `roundId`, `questionIndex`). */
export function normalizeAttemptRecord(raw: unknown): AttemptRecord | null {
  if (!raw || typeof raw !== "object") return null;

  const row = raw as Record<string, unknown>;
  const practiceModeId = row.practiceModeId ?? row.exerciseId;
  if (!isPracticeModeId(practiceModeId)) return null;

  const lessonId =
    typeof row.lessonId === "string"
      ? row.lessonId
      : typeof row.roundId === "string"
        ? row.roundId
        : null;
  if (!lessonId) return null;

  const exerciseIndex =
    typeof row.exerciseIndex === "number"
      ? row.exerciseIndex
      : typeof row.questionIndex === "number"
        ? row.questionIndex
        : null;
  if (exerciseIndex === null) return null;

  return {
    ...(row as unknown as AttemptRecord),
    practiceModeId,
    lessonId,
    exerciseIndex,
  };
}
