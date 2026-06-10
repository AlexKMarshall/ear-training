import { EXERCISES_PER_LESSON } from "../config.ts"
import { CURRICULUM_LESSONS } from "../curriculum/curriculum-lessons.ts"
import { getPathNodeState } from "../curriculum/path-node.ts"
import type { AttemptRecord } from "../history/types.ts"
import { planTargetedPracticeLesson } from "./targeted-practice-planner.ts"
import {
  getTargetedPracticeHomeCardState,
  type TargetedPracticeHomeCardState,
} from "./targeted-practice-session-store.ts"

export interface TargetedPracticeHomeCardView {
  subtitle: string
  status: string
  ctaLabel: "Start" | "Resume"
}

export function hasPassedPathNode(records: readonly AttemptRecord[]): boolean {
  return CURRICULUM_LESSONS.some((step) => getPathNodeState(step, records) === "passed")
}

export function formatTargetedPracticeSubtitle(
  family: string,
  focusTagLabels: readonly string[],
): string {
  if (focusTagLabels.length === 0) {
    return family
  }
  return `${family} · ${focusTagLabels.join(", ")}`
}

function freshExerciseStatus(): string {
  return `${EXERCISES_PER_LESSON} exercises`
}

function resolveFreshCard(records: readonly AttemptRecord[]): TargetedPracticeHomeCardView | null {
  const plan = planTargetedPracticeLesson(records)
  if (!plan) {
    return null
  }
  return {
    subtitle: formatTargetedPracticeSubtitle(plan.family, plan.focusTagLabels),
    status: freshExerciseStatus(),
    ctaLabel: "Start",
  }
}

function resolveResumeCard(
  cardState: Extract<TargetedPracticeHomeCardState, { kind: "resume" }>,
): TargetedPracticeHomeCardView {
  return {
    subtitle: formatTargetedPracticeSubtitle(cardState.family, cardState.focusTagLabels),
    status: cardState.progressLabel,
    ctaLabel: "Resume",
  }
}

/** Returns card copy when the home entry should render; null when hidden. */
export function resolveTargetedPracticeHomeCard(
  records: readonly AttemptRecord[],
): TargetedPracticeHomeCardView | null {
  const cardState = getTargetedPracticeHomeCardState()
  if (cardState.kind === "resume") {
    return resolveResumeCard(cardState)
  }
  if (!hasPassedPathNode(records)) {
    return null
  }
  return resolveFreshCard(records)
}
