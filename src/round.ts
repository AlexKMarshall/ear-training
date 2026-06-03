import { QUESTIONS_PER_ROUND } from "./config.ts";
import type { SingTestQuestion } from "./sing-test-question.ts";

export { QUESTIONS_PER_ROUND };

/** How the user finished a single question within a round. */
export type QuestionOutcome = "firstTry" | "retry" | "wrong";

export interface RoundQuestionResult {
  /** Position in the round (0-based). */
  questionIndex: number;
  outcome: QuestionOutcome;
  /** Snapshot for future review UI (which notes were missed, etc.). */
  question?: SingTestQuestion;
}

export interface RoundSummary {
  results: readonly RoundQuestionResult[];
  firstTryCount: number;
  retryCount: number;
  wrongCount: number;
  /** Passed on first try or after one or more retries. */
  correctCount: number;
  total: number;
}

export function classifyQuestionOutcome(
  passed: boolean,
  scoredAttempts: number,
): QuestionOutcome {
  if (passed && scoredAttempts === 1) return "firstTry";
  if (passed) return "retry";
  return "wrong";
}

export function summarizeRound(
  results: readonly RoundQuestionResult[],
): RoundSummary {
  let firstTryCount = 0;
  let retryCount = 0;
  let wrongCount = 0;
  for (const r of results) {
    if (r.outcome === "firstTry") firstTryCount += 1;
    else if (r.outcome === "retry") retryCount += 1;
    else wrongCount += 1;
  }
  return {
    results,
    firstTryCount,
    retryCount,
    wrongCount,
    correctCount: firstTryCount + retryCount,
    total: results.length,
  };
}

export function percentOf(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}
