import { CHORD_TYPES } from "../chord-config.ts";
import { CHORD_INVERSIONS, type InversionId } from "../chord-inversions.ts";
import type { ExerciseId } from "../history/types.ts";
import {
  DIATONIC_MAJOR_INTERVAL_IDS,
  INTERVAL_2A_IDS,
} from "../interval-config.ts";
import { SCALE_DEGREES } from "../scale-degree-config.ts";

export type ContentTierId =
  | "tier-1"
  | "interval-2a"
  | "interval-2b"
  | "degree-3a"
  | "chord-1a";

export interface CurriculumStep {
  exerciseId: ExerciseId;
  contentTierId: ContentTierId;
}

export const CURRICULUM_STEPS: readonly CurriculumStep[] = [
  { exerciseId: "single-note", contentTierId: "tier-1" },
  { exerciseId: "interval-melodic-sing", contentTierId: "interval-2a" },
  { exerciseId: "interval-harmonic-sing", contentTierId: "interval-2a" },
  { exerciseId: "interval-melodic-id", contentTierId: "interval-2a" },
  { exerciseId: "interval-harmonic-id", contentTierId: "interval-2a" },
  { exerciseId: "interval-melodic-sing", contentTierId: "interval-2b" },
  { exerciseId: "interval-melodic-id", contentTierId: "interval-2b" },
  { exerciseId: "scale-degree-sing", contentTierId: "degree-3a" },
] as const;

export function stepKey(step: CurriculumStep): string {
  return `${step.exerciseId}:${step.contentTierId}`;
}

export function getStepIndex(step: CurriculumStep): number {
  const key = stepKey(step);
  return CURRICULUM_STEPS.findIndex((s) => stepKey(s) === key);
}

export function stepsForExercise(
  exerciseId: ExerciseId,
): readonly CurriculumStep[] {
  return CURRICULUM_STEPS.filter((s) => s.exerciseId === exerciseId);
}

export function getEligibleIntervalIds(
  tierId: "interval-2a" | "interval-2b",
): readonly string[] {
  if (tierId === "interval-2a") {
    return INTERVAL_2A_IDS;
  }
  return DIATONIC_MAJOR_INTERVAL_IDS;
}

export function getEligibleDegreeIds(
  tierId: "degree-3a",
): readonly string[] {
  if (tierId !== "degree-3a") {
    return [];
  }
  return SCALE_DEGREES.filter((d) => d.enabled).map((d) => d.id);
}

export function getEligibleChordTypeIds(
  tierId: "chord-1a",
): readonly string[] {
  if (tierId !== "chord-1a") {
    return [];
  }
  return CHORD_TYPES.filter((t) => t.enabled).map((t) => t.id);
}

export function getEligibleInversionIds(
  tierId: "chord-1a",
): readonly InversionId[] {
  if (tierId !== "chord-1a") {
    return [];
  }
  return CHORD_INVERSIONS.map((inv) => inv.id);
}

/** Tag ids the session planner may draw for this step (interval, degree, or chord type). */
export function getEligibleTagIds(step: CurriculumStep): readonly string[] {
  switch (step.contentTierId) {
    case "tier-1":
      return [];
    case "interval-2a":
    case "interval-2b":
      return getEligibleIntervalIds(step.contentTierId);
    case "degree-3a":
      return getEligibleDegreeIds(step.contentTierId);
    case "chord-1a":
      return getEligibleChordTypeIds(step.contentTierId);
  }
}
