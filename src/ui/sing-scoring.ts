import { MIN_VALID_SAMPLES } from "../config.ts"
import type { ScoreAnswerResult } from "../exercise-screen-state.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import { scoreFromSamples } from "../pitch/score.ts"

export function scoreSingFromSamples(
  exercise: LessonExercise,
  samplesHz: number[],
): ScoreAnswerResult {
  if (samplesHz.length < MIN_VALID_SAMPLES) {
    return {
      kind: "error",
      message: `Not enough clear pitch detected (${samplesHz.length} frames, need ${MIN_VALID_SAMPLES}). Hold a steady note closer to the mic.`,
    }
  }

  const outcome = scoreFromSamples(samplesHz, exercise.target.hz)
  if ("error" in outcome) {
    return { kind: "error", message: outcome.error }
  }

  return {
    kind: "scored",
    passed: outcome.passed,
    scorePayload: { centsOff: outcome.centsOff },
    attemptDetail: outcome,
  }
}
