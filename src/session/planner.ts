import type { CurriculumStep, ContentTierId } from "../curriculum/steps.ts";
import { getEligibleTagIds } from "../curriculum/steps.ts";
import {
  MIN_QUESTION_PASS_RATE,
  MIN_QUESTIONS,
} from "../curriculum/unlock.ts";
import { getTagBreakdownConfig } from "../history/tag-stats.ts";
import { computeQuestionStats } from "../history/stats.ts";
import type { AttemptRecord } from "../history/types.ts";

/** Share of draws that target weak (under-threshold) tags vs maintenance. */
export const WEAK_AREA_PROBABILITY = 0.7;

type AttemptWithTier = AttemptRecord & { contentTierId?: ContentTierId };

export interface SessionPlanner {
  planNextQuestionTag(
    step: CurriculumStep,
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
    planNextQuestionTag(step, records) {
      return planNextQuestionTag(step, records, rng, weakAreaProbability);
    },
  };
}

export function createDefaultSessionPlanner(): SessionPlanner {
  return createSessionPlanner();
}

export function filterRecordsForStep(
  records: readonly AttemptRecord[],
  step: CurriculumStep,
): AttemptRecord[] {
  return records.filter((record) => {
    if (record.exerciseId !== step.exerciseId) {
      return false;
    }
    const tier = (record as AttemptWithTier).contentTierId;
    if (tier !== undefined && tier !== step.contentTierId) {
      return false;
    }
    return true;
  });
}

function isWeakTag(questionCount: number, questionPassRatePercent: number): boolean {
  return (
    questionCount < MIN_QUESTIONS ||
    questionPassRatePercent < MIN_QUESTION_PASS_RATE
  );
}

function weakTagWeight(questionCount: number, questionPassRatePercent: number): number {
  if (questionCount === 0) {
    return 100;
  }
  return Math.max(1, 100 - questionPassRatePercent);
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

export function planNextQuestionTag(
  step: CurriculumStep,
  records: readonly AttemptRecord[],
  rng: () => number = Math.random,
  weakAreaProbability: number = WEAK_AREA_PROBABILITY,
): string {
  const eligible = getEligibleTagIds(step);
  if (eligible.length === 0) {
    throw new Error(
      `No eligible tags for step ${step.exerciseId}:${step.contentTierId}`,
    );
  }

  const config = getTagBreakdownConfig(step.exerciseId);
  if (!config) {
    return eligible[Math.floor(rng() * eligible.length)]!;
  }

  const stepRecords = filterRecordsForStep(records, step);
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
    const { questionCount, questionPassRatePercent } =
      computeQuestionStats(tagRecords);
    if (isWeakTag(questionCount, questionPassRatePercent)) {
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
      const { questionCount, questionPassRatePercent } =
        computeQuestionStats(tagRecords);
      return weakTagWeight(questionCount, questionPassRatePercent);
    }, rng);
  }

  return pool[Math.floor(rng() * pool.length)]!;
}
