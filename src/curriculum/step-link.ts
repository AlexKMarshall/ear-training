import type { ContentTierId, CurriculumStep } from "./steps.ts";
import { CURRICULUM_STEPS, stepKey } from "./steps.ts";
import type { ExerciseId } from "../history/types.ts";

export const STEP_QUERY_PARAM = "step";

const CONTENT_TIER_IDS = new Set<ContentTierId>(
  CURRICULUM_STEPS.map((s) => s.contentTierId),
);

function isContentTierId(value: string): value is ContentTierId {
  return (CONTENT_TIER_IDS as Set<string>).has(value);
}

export function findCurriculumStep(
  exerciseId: ExerciseId,
  contentTierId: ContentTierId,
): CurriculumStep | null {
  const match = CURRICULUM_STEPS.find(
    (s) => s.exerciseId === exerciseId && s.contentTierId === contentTierId,
  );
  return match ?? null;
}

/** Encodes a curriculum step for the `step` query parameter. */
export function formatStepParam(step: CurriculumStep): string {
  return stepKey(step);
}

/**
 * Parses a `step` query value. Accepts full `exerciseId:contentTierId` or, when
 * `expectedExerciseId` is set, a tier id shorthand for that exercise route.
 */
export function parseStepParam(
  value: string,
  expectedExerciseId?: ExerciseId,
): CurriculumStep | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes(":")) {
    const colon = trimmed.indexOf(":");
    const exerciseId = trimmed.slice(0, colon) as ExerciseId;
    const contentTierId = trimmed.slice(colon + 1);
    if (!isContentTierId(contentTierId)) {
      return null;
    }
    return findCurriculumStep(exerciseId, contentTierId);
  }

  if (!expectedExerciseId || !isContentTierId(trimmed)) {
    return null;
  }
  return findCurriculumStep(expectedExerciseId, trimmed);
}

export function parseStepFromSearchParams(
  search: string,
  expectedExerciseId: ExerciseId,
): CurriculumStep | null {
  const raw = new URLSearchParams(search).get(STEP_QUERY_PARAM);
  if (!raw) {
    return null;
  }
  const step = parseStepParam(raw, expectedExerciseId);
  if (!step || step.exerciseId !== expectedExerciseId) {
    return null;
  }
  return step;
}

/** Appends or replaces the `step` query param on an exercise route. */
export function formatExerciseUrl(
  route: string,
  step: CurriculumStep,
): string {
  const url = new URL(route, "http://local");
  url.searchParams.set(STEP_QUERY_PARAM, formatStepParam(step));
  return `${url.pathname}${url.search}`;
}
