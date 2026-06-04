import type { ContentTierId, CurriculumLesson } from "./curriculum-lessons.ts";
import { CURRICULUM_LESSONS, curriculumLessonKey } from "./curriculum-lessons.ts";
import type { PracticeModeId } from "../history/types.ts";

export const CURRICULUM_LESSON_QUERY_PARAM = "step";

const CONTENT_TIER_IDS = new Set<ContentTierId>(
  CURRICULUM_LESSONS.map((s) => s.contentTierId),
);

function isContentTierId(value: string): value is ContentTierId {
  return (CONTENT_TIER_IDS as Set<string>).has(value);
}

export function findCurriculumLesson(
  practiceModeId: PracticeModeId,
  contentTierId: ContentTierId,
): CurriculumLesson | null {
  const match = CURRICULUM_LESSONS.find(
    (s) => s.practiceModeId === practiceModeId && s.contentTierId === contentTierId,
  );
  return match ?? null;
}

/** Encodes a curriculum step for the `step` query parameter. */
export function formatCurriculumLessonParam(step: CurriculumLesson): string {
  return curriculumLessonKey(step);
}

/**
 * Parses a `step` query value. Accepts full `practiceModeId:contentTierId` or, when
 * `expectedPracticeModeId` is set, a tier id shorthand for that practice mode route.
 */
export function parseCurriculumLessonParam(
  value: string,
  expectedPracticeModeId?: PracticeModeId,
): CurriculumLesson | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes(":")) {
    const colon = trimmed.indexOf(":");
    const practiceModeId = trimmed.slice(0, colon) as PracticeModeId;
    const contentTierId = trimmed.slice(colon + 1);
    if (!isContentTierId(contentTierId)) {
      return null;
    }
    return findCurriculumLesson(practiceModeId, contentTierId);
  }

  if (!expectedPracticeModeId || !isContentTierId(trimmed)) {
    return null;
  }
  return findCurriculumLesson(expectedPracticeModeId, trimmed);
}

export function parseCurriculumLessonFromSearchParams(
  search: string,
  expectedPracticeModeId: PracticeModeId,
): CurriculumLesson | null {
  const raw = new URLSearchParams(search).get(CURRICULUM_LESSON_QUERY_PARAM);
  if (!raw) {
    return null;
  }
  const step = parseCurriculumLessonParam(raw, expectedPracticeModeId);
  if (!step || step.practiceModeId !== expectedPracticeModeId) {
    return null;
  }
  return step;
}

/** Appends or replaces the `step` query param on an practice mode route. */
export function formatLessonLinkUrl(
  route: string,
  step: CurriculumLesson,
): string {
  const url = new URL(route, "http://local");
  url.searchParams.set(CURRICULUM_LESSON_QUERY_PARAM, formatCurriculumLessonParam(step));
  return `${url.pathname}${url.search}`;
}
