import { CHORD_TYPES } from "../chord-config.ts";
import { CHORD_INVERSIONS, type InversionId } from "../chord-inversions.ts";
import { PRACTICE_MODE_LABELS, type PracticeModeId } from "../history/types.ts";
import type { AttemptRecord } from "../history/types.ts";
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

export interface CurriculumLesson {
  practiceModeId: PracticeModeId;
  contentTierId: ContentTierId;
}

export const CURRICULUM_LESSONS: readonly CurriculumLesson[] = [
  { practiceModeId: "single-note", contentTierId: "tier-1" },
  { practiceModeId: "interval-melodic-sing", contentTierId: "interval-2a" },
  { practiceModeId: "interval-melodic-id", contentTierId: "interval-2a" },
  { practiceModeId: "interval-harmonic-sing", contentTierId: "interval-2a" },
  { practiceModeId: "interval-harmonic-id", contentTierId: "interval-2a" },
  { practiceModeId: "interval-melodic-sing", contentTierId: "interval-2b" },
  { practiceModeId: "interval-melodic-id", contentTierId: "interval-2b" },
  { practiceModeId: "interval-harmonic-sing", contentTierId: "interval-2b" },
  { practiceModeId: "interval-harmonic-id", contentTierId: "interval-2b" },
  { practiceModeId: "scale-degree-sing", contentTierId: "degree-3a" },
  { practiceModeId: "chord-middle", contentTierId: "chord-1a" },
] as const;

export function curriculumLessonKey(step: CurriculumLesson): string {
  return `${step.practiceModeId}:${step.contentTierId}`;
}

export function getCurriculumLessonIndex(step: CurriculumLesson): number {
  const key = curriculumLessonKey(step);
  return CURRICULUM_LESSONS.findIndex((s) => curriculumLessonKey(s) === key);
}

export function curriculumLessonsForPracticeMode(
  practiceModeId: PracticeModeId,
): readonly CurriculumLesson[] {
  return CURRICULUM_LESSONS.filter((s) => s.practiceModeId === practiceModeId);
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
/** Attempts that count toward progress for this step (tier filter when set on records). */
export function filterRecordsForCurriculumLesson(
  records: readonly AttemptRecord[],
  step: CurriculumLesson,
): AttemptRecord[] {
  const firstTierId = curriculumLessonsForPracticeMode(step.practiceModeId)[0]?.contentTierId;
  return records.filter((record) => {
    if (record.practiceModeId !== step.practiceModeId) {
      return false;
    }
    const tier = record.contentTierId;
    if (tier === undefined) {
      return step.contentTierId === firstTierId;
    }
    return tier === step.contentTierId;
  });
}

const INTERVAL_TIER_POOL_LABEL: Record<"interval-2a" | "interval-2b", string> = {
  "interval-2a": "perfect 4th, 5th, octave",
  "interval-2b": "diatonic intervals within one octave",
};

/** Human-readable step label for unlock copy (includes tier pool when relevant). */
export function getCurriculumLessonLabel(step: CurriculumLesson): string {
  const title = PRACTICE_MODE_LABELS[step.practiceModeId];
  if (step.contentTierId === "interval-2a" || step.contentTierId === "interval-2b") {
    return `${title} (${INTERVAL_TIER_POOL_LABEL[step.contentTierId]})`;
  }
  return title;
}

export function getEligibleTagIds(step: CurriculumLesson): readonly string[] {
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
