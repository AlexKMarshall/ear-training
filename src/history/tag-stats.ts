import { getChordTypeById } from "../chord-config.ts";
import { getPracticeMode } from "../practice-modes/registry.ts";
import { getIntervalById } from "../interval-config.ts";
import { getScaleDegreeById } from "../scale-degree-config.ts";
import type { AttemptRecord, PracticeModeId } from "./types.ts";
import {
  computeMedianAbsCents,
  computeLessonExerciseStats,
} from "./stats.ts";

export interface TagStats {
  tagId: string;
  label: string;
  attemptCount: number;
  lessonExerciseCount: number;
  lessonExercisePassRatePercent: number;
  firstTryRatePercent: number;
  /** Null for identify exercises (cents not meaningful). */
  medianAbsCents: number | null;
}

export type TagBreakdownKind = "interval" | "degree" | "chord-type";

export interface TagBreakdownConfig {
  kind: TagBreakdownKind;
  getTagId: (record: AttemptRecord) => string | undefined;
  includeMedianCents: boolean;
}

const TAG_CONFIG: Partial<Record<PracticeModeId, TagBreakdownConfig>> = {
  "interval-melodic-sing": {
    kind: "interval",
    getTagId: (r) => r.intervalId,
    includeMedianCents: true,
  },
  "interval-harmonic-sing": {
    kind: "interval",
    getTagId: (r) => r.intervalId,
    includeMedianCents: true,
  },
  "interval-melodic-id": {
    kind: "interval",
    getTagId: (r) => r.intervalId,
    includeMedianCents: false,
  },
  "interval-harmonic-id": {
    kind: "interval",
    getTagId: (r) => r.intervalId,
    includeMedianCents: false,
  },
  "scale-degree-sing": {
    kind: "degree",
    getTagId: (r) => r.degreeId,
    includeMedianCents: true,
  },
  "chord-middle": {
    kind: "chord-type",
    getTagId: (r) => r.chordTypeId,
    includeMedianCents: true,
  },
};

export function getTagBreakdownConfig(
  practiceModeId: PracticeModeId,
): TagBreakdownConfig | undefined {
  return TAG_CONFIG[practiceModeId];
}

export function tagBreakdownHeading(kind: TagBreakdownKind): string {
  switch (kind) {
    case "interval":
      return "By interval";
    case "degree":
      return "By scale degree";
    case "chord-type":
      return "By chord type";
  }
}

function resolveTagLabel(kind: TagBreakdownKind, tagId: string): string {
  switch (kind) {
    case "interval":
      return getIntervalById(tagId)?.label ?? tagId;
    case "degree":
      return getScaleDegreeById(tagId)?.label ?? tagId;
    case "chord-type":
      return getChordTypeById(tagId)?.label ?? tagId;
  }
}

export function computeTagStats(
  records: readonly AttemptRecord[],
  config: TagBreakdownConfig,
): TagStats[] {
  const byTag = new Map<string, AttemptRecord[]>();
  for (const record of records) {
    const tagId = config.getTagId(record);
    if (!tagId) continue;
    const group = byTag.get(tagId) ?? [];
    group.push(record);
    byTag.set(tagId, group);
  }

  const rows: TagStats[] = [];
  for (const [tagId, tagRecords] of byTag) {
    const lessonExerciseStats = computeLessonExerciseStats(tagRecords);
    rows.push({
      tagId,
      label: resolveTagLabel(config.kind, tagId),
      attemptCount: tagRecords.length,
      ...lessonExerciseStats,
      medianAbsCents: config.includeMedianCents
        ? computeMedianAbsCents(tagRecords)
        : null,
    });
  }

  rows.sort((a, b) => {
    if (a.lessonExercisePassRatePercent !== b.lessonExercisePassRatePercent) {
      return a.lessonExercisePassRatePercent - b.lessonExercisePassRatePercent;
    }
    return a.label.localeCompare(b.label);
  });

  return rows;
}

export function computeTagBreakdownForExercise(
  practiceModeId: PracticeModeId,
  records: readonly AttemptRecord[],
): TagStats[] | undefined {
  const config = getTagBreakdownConfig(practiceModeId);
  if (!config || records.length === 0) return undefined;
  const rows = computeTagStats(records, config);
  return rows.length > 0 ? rows : undefined;
}

/** Sing attempts only — meaningful for overall intonation on the dashboard. */
export function singAttemptsMedianAbsCents(
  records: readonly AttemptRecord[],
): number {
  const singRecords = records.filter(
    (r) => getPracticeMode(r.practiceModeId).responseMode === "sing",
  );
  return computeMedianAbsCents(singRecords);
}
