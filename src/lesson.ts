import type { LessonExercise } from "./lesson-exercise.ts"

/** How the user finished a single exercise within a lesson. */
export type ExerciseOutcome = "firstTry" | "retry" | "wrong"

export interface LessonExerciseResult {
  /** Position in the lesson (0-based) (0-based). */
  exerciseIndex: number
  outcome: ExerciseOutcome
  /** Snapshot for future review UI (which notes were missed, etc.). */
  exercise?: LessonExercise
}

export interface LessonSummary {
  results: readonly LessonExerciseResult[]
  firstTryCount: number
  retryCount: number
  wrongCount: number
  /** Passed on first try or after one or more retries. */
  correctCount: number
  total: number
}

export function classifyExerciseOutcome(passed: boolean, scoredAttempts: number): ExerciseOutcome {
  if (passed && scoredAttempts === 1) return "firstTry"
  if (passed) return "retry"
  return "wrong"
}

export function summarizeLesson(results: readonly LessonExerciseResult[]): LessonSummary {
  let firstTryCount = 0
  let retryCount = 0
  let wrongCount = 0
  for (const r of results) {
    if (r.outcome === "firstTry") firstTryCount += 1
    else if (r.outcome === "retry") retryCount += 1
    else wrongCount += 1
  }
  return {
    results,
    firstTryCount,
    retryCount,
    wrongCount,
    correctCount: firstTryCount + retryCount,
    total: results.length,
  }
}

export function percentOf(count: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}
