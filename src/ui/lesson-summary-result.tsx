import type { LessonSummary } from "../lesson.ts"

export function LessonSummaryResult(props: {
  summary: LessonSummary
  correctPct: number
  firstTryPct: number
  retryPct: number
  wrongPct: number
}) {
  return (
    <>
      <p class="result-verdict">Lesson complete</p>
      <p class="lesson-summary-score">
        <span class="lesson-summary-score-value">
          {props.summary.correctCount}/{props.summary.total}
        </span>{" "}
        correct ({props.correctPct}%)
      </p>
      <ul class="lesson-summary-breakdown">
        <li>
          <span class="lesson-summary-label">First try</span> {props.summary.firstTryCount} (
          {props.firstTryPct}%)
        </li>
        <li>
          <span class="lesson-summary-label">After retry</span> {props.summary.retryCount} (
          {props.retryPct}%)
        </li>
        <li>
          <span class="lesson-summary-label">Wrong</span> {props.summary.wrongCount} (
          {props.wrongPct}%)
        </li>
      </ul>
    </>
  )
}
