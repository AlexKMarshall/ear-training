import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts";
import {
  filterRecordsForCurriculumLesson,
  getEligibleTagIds,
} from "../curriculum/curriculum-lessons.ts";
import {
  MIN_EXERCISE_PASS_RATE,
  MIN_EXERCISES_FOR_UNLOCK,
} from "../curriculum/unlock.ts";
import { getTagBreakdownConfig } from "../history/tag-stats.ts";
import { computeLessonExerciseStats } from "../history/stats.ts";
import type { AttemptRecord } from "../history/types.ts";

/** Share of draws that target weak (under-threshold) tags vs maintenance. */
export const WEAK_AREA_PROBABILITY = 0.7;

export interface SessionPlanner {
  planNextExerciseTag(
    step: CurriculumLesson,
    records: readonly AttemptRecord[],
  ): string;
}

export interface SessionPlannerOptions {
  rng?: () => number;
  weakAreaProbability?: number;
}

export function createSessionPlanner(
  options: SessionPlannerOptions = {},
): SessionPlanner {
  const rng = options.rng ?? Math.random;
  const weakAreaProbability =
    options.weakAreaProbability ?? WEAK_AREA_PROBABILITY;
  return {
    planNextExerciseTag(step, records) {
      return planNextExerciseTag(step, records, rng, weakAreaProbability);
    },
  };
}

export function createDefaultSessionPlanner(): SessionPlanner {
  return createSessionPlanner();
}

function isWeakTag(lessonExerciseCount: number, lessonExercisePassRatePercent: number): boolean {
  return (
    lessonExerciseCount < MIN_EXERCISES_FOR_UNLOCK ||
    lessonExercisePassRatePercent < MIN_EXERCISE_PASS_RATE
  );
}

function weakTagWeight(lessonExerciseCount: number, lessonExercisePassRatePercent: number): number {
  if (lessonExerciseCount === 0) {
    return 100;
  }
  return Math.max(1, 100 - lessonExercisePassRatePercent);
}

function pickWeighted<T>(
  items: readonly T[],
  weightFn: (item: T) => number,
  rng: () => number,
): T {
  const weights = items.map(weightFn);
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) {
    return items[Math.floor(rng() * items.length)]!;
  }
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]!;
    if (roll < 0) {
      return items[i]!;
    }
  }
  return items[items.length - 1]!;
}

export function planNextExerciseTag(
  step: CurriculumLesson,
  records: readonly AttemptRecord[],
  rng: () => number = Math.random,
  weakAreaProbability: number = WEAK_AREA_PROBABILITY,
): string {
  const eligible = getEligibleTagIds(step);
  if (eligible.length === 0) {
    throw new Error(
      `No eligible tags for curriculum lesson ${step.practiceModeId}:${step.contentTierId}`,
    );
  }

  const config = getTagBreakdownConfig(step.practiceModeId);
  if (!config) {
    return eligible[Math.floor(rng() * eligible.length)]!;
  }

  const stepRecords = filterRecordsForCurriculumLesson(records, step);
  const byTag = new Map<string, AttemptRecord[]>();
  for (const record of stepRecords) {
    const tagId = config.getTagId(record);
    if (!tagId || !eligible.includes(tagId)) {
      continue;
    }
    const group = byTag.get(tagId) ?? [];
    group.push(record);
    byTag.set(tagId, group);
  }

  const weak: string[] = [];
  const maintenance: string[] = [];

  for (const tagId of eligible) {
    const tagRecords = byTag.get(tagId) ?? [];
    const { lessonExerciseCount, lessonExercisePassRatePercent } =
      computeLessonExerciseStats(tagRecords);
    if (isWeakTag(lessonExerciseCount, lessonExercisePassRatePercent)) {
      weak.push(tagId);
    } else {
      maintenance.push(tagId);
    }
  }

  const pickFromWeak =
    weak.length > 0 &&
    (maintenance.length === 0 || rng() < weakAreaProbability);
  const pool = pickFromWeak ? weak : maintenance;

  if (pool.length === 1) {
    return pool[0]!;
  }

  if (pickFromWeak) {
    return pickWeighted(pool, (tagId) => {
      const tagRecords = byTag.get(tagId) ?? [];
      const { lessonExerciseCount, lessonExercisePassRatePercent } =
        computeLessonExerciseStats(tagRecords);
      return weakTagWeight(lessonExerciseCount, lessonExercisePassRatePercent);
    }, rng);
  }

  return pool[Math.floor(rng() * pool.length)]!;
}
