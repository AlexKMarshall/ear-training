import { formatExerciseUrl } from "./step-link.ts";
import type { CurriculumStep } from "./steps.ts";
import { CURRICULUM_STEPS, getStepIndex, stepKey } from "./steps.ts";
import {
  computeStepProgress,
  getContinueStep,
  getUnlockRequirementForStep,
  isStepUnlocked,
  meetsStepThreshold,
  MIN_QUESTION_PASS_RATE,
  MIN_QUESTIONS,
} from "./unlock.ts";
import { getExercise } from "../exercises/registry.ts";
import type { AttemptRecord, ExerciseId } from "../history/types.ts";

export type PathNodeState = "passed" | "current" | "locked";

export interface PathNodeLabels {
  title: string;
  subtitle: string;
}

const INTERVAL_MODE_LABEL: Record<
  Extract<
    ExerciseId,
    | "interval-melodic-sing"
    | "interval-melodic-id"
    | "interval-harmonic-sing"
    | "interval-harmonic-id"
  >,
  string
> = {
  "interval-melodic-sing": "Melodic reproduction",
  "interval-melodic-id": "Melodic identification",
  "interval-harmonic-sing": "Harmonic reproduction",
  "interval-harmonic-id": "Harmonic identification",
};

const TIER_POOL_LABEL: Record<
  CurriculumStep["contentTierId"],
  string | null
> = {
  "tier-1": "sing back one note",
  "interval-2a": "perfect 4th, 5th, octave",
  "interval-2b": "diatonic intervals within one octave",
  "degree-3a": "major scale degrees",
  "chord-1a": "major vs minor · root position",
};

/** Optional per-step label overrides (full `exerciseId:contentTierId` keys). */
const STEP_LABEL_OVERRIDES: Partial<Record<string, PathNodeLabels>> = {};

function familyTitle(exerciseId: ExerciseId): string {
  switch (exerciseId) {
    case "single-note":
      return "Single note";
    case "interval-melodic-sing":
    case "interval-melodic-id":
    case "interval-harmonic-sing":
    case "interval-harmonic-id":
      return "Intervals";
    case "scale-degree-sing":
      return "Scale degrees";
    case "chord-middle":
      return "Chords";
  }
}

function defaultPathNodeLabels(step: CurriculumStep): PathNodeLabels {
  const title = familyTitle(step.exerciseId);
  const pool = TIER_POOL_LABEL[step.contentTierId];

  if (step.exerciseId === "single-note") {
    return { title, subtitle: "Sing back one note" };
  }

  if (
    step.exerciseId === "interval-melodic-sing" ||
    step.exerciseId === "interval-melodic-id" ||
    step.exerciseId === "interval-harmonic-sing" ||
    step.exerciseId === "interval-harmonic-id"
  ) {
    const mode = INTERVAL_MODE_LABEL[step.exerciseId];
    return {
      title,
      subtitle: pool ? `${mode} · ${pool}` : mode,
    };
  }

  if (step.exerciseId === "scale-degree-sing") {
    return {
      title,
      subtitle: pool ? `Melodic reproduction · ${pool}` : "Melodic reproduction",
    };
  }

  return {
    title,
    subtitle: pool ?? "Sing the middle note of a chord",
  };
}

export function getPathNodeLabels(step: CurriculumStep): PathNodeLabels {
  return STEP_LABEL_OVERRIDES[stepKey(step)] ?? defaultPathNodeLabels(step);
}

export function getPathNodeState(
  step: CurriculumStep,
  records: readonly AttemptRecord[],
): PathNodeState {
  if (!isStepUnlocked(step, records)) {
    return "locked";
  }
  const current = getContinueStep(records);
  if (current && stepKey(current) === stepKey(step)) {
    return "current";
  }
  return "passed";
}

export function isGuidedPathComplete(
  records: readonly AttemptRecord[],
): boolean {
  return CURRICULUM_STEPS.every((step) => meetsStepThreshold(step, records));
}

/** First locked step after the current node, or after the last passed step when none is current. */
export function getNextLockedPathNode(
  records: readonly AttemptRecord[],
): CurriculumStep | null {
  const current = getContinueStep(records);
  let startIndex: number;
  if (current) {
    startIndex = getStepIndex(current) + 1;
  } else {
    let lastPassed = -1;
    for (let i = 0; i < CURRICULUM_STEPS.length; i++) {
      const step = CURRICULUM_STEPS[i]!;
      if (meetsStepThreshold(step, records)) {
        lastPassed = i;
      } else {
        break;
      }
    }
    startIndex = lastPassed + 1;
  }

  if (startIndex >= CURRICULUM_STEPS.length) {
    return null;
  }

  const step = CURRICULUM_STEPS[startIndex]!;
  return isStepUnlocked(step, records) ? null : step;
}

export function formatPathNodeStatus(
  step: CurriculumStep,
  records: readonly AttemptRecord[],
): string {
  const state = getPathNodeState(step, records);
  if (state === "passed") {
    return "Complete";
  }
  if (state === "current") {
    const { questionCount, questionPassRatePercent } = computeStepProgress(
      step,
      records,
    );
    return `${questionCount} / ${MIN_QUESTIONS} questions · ${questionPassRatePercent}% pass (need ${MIN_QUESTION_PASS_RATE}%)`;
  }

  const nextLocked = getNextLockedPathNode(records);
  if (nextLocked && stepKey(nextLocked) === stepKey(step)) {
    const requirement = getUnlockRequirementForStep(step);
    if (requirement) {
      return `Locked · complete ${requirement.predecessorLabel} first`;
    }
  }
  return "Locked";
}

export function formatPathNodeHref(step: CurriculumStep): string {
  const route = getExercise(step.exerciseId).route;
  return formatExerciseUrl(route, step);
}
