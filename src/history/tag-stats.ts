import { getChordTypeById } from "../chord-config.ts"
import { getIntervalById } from "../interval-config.ts"
import { getPracticeMode } from "../practice-modes/registry.ts"
import { getScaleDegreeById } from "../scale-degree-config.ts"
import { type VoicingPositionId, voicingPositionStatsLabel } from "../voicing-position.ts"
import { computeLessonExerciseStats, computeMedianAbsCents } from "./stats.ts"
import type { AttemptRecord, PracticeModeId } from "./types.ts"

export interface TagStats {
  tagId: string
  label: string
  attemptCount: number
  lessonExerciseCount: number
  lessonExercisePassRatePercent: number
  firstTryRatePercent: number
  /** Null for identify exercises (cents not meaningful). */
  medianAbsCents: number | null
}

export type TagBreakdownKind =
  | "interval"
  | "degree"
  | "voicing-position"
  | "triad-quality"
  | "inversion"

export interface TagBreakdownConfig {
  kind: TagBreakdownKind
  getTagId: (record: AttemptRecord) => string | undefined
  includeMedianCents: boolean
}

const TAG_CONFIG: Partial<Record<PracticeModeId, TagBreakdownConfig>> = {
  "interval-melodic-sing": {
    kind: "interval",
    getTagId: (r) => r.intervalId,
    includeMedianCents: true,
  },
  "interval-named-sing": {
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
  "chord-sing": {
    kind: "voicing-position",
    getTagId: (r) => r.voicingPositionId,
    includeMedianCents: true,
  },
  "chord-quality-id": {
    kind: "triad-quality",
    getTagId: (r) => r.chordTypeId,
    includeMedianCents: false,
  },
  "chord-inversion-id": {
    kind: "inversion",
    getTagId: (r) => r.inversionId,
    includeMedianCents: false,
  },
}

export function getTagBreakdownConfig(
  practiceModeId: PracticeModeId,
): TagBreakdownConfig | undefined {
  return TAG_CONFIG[practiceModeId]
}

export function tagBreakdownHeading(kind: TagBreakdownKind): string {
  switch (kind) {
    case "interval":
      return "By interval"
    case "degree":
      return "By scale degree"
    case "voicing-position":
      return "By voicing position"
    case "triad-quality":
      return "By triad quality"
    case "inversion":
      return "By inversion"
  }
}

function resolveTagLabel(kind: TagBreakdownKind, tagId: string): string {
  switch (kind) {
    case "interval":
      return getIntervalById(tagId)?.label ?? tagId
    case "degree":
      return getScaleDegreeById(tagId)?.label ?? tagId
    case "voicing-position":
      return voicingPositionStatsLabel(tagId as VoicingPositionId)
    case "triad-quality":
      return getChordTypeById(tagId)?.label ?? tagId
    case "inversion":
      switch (tagId) {
        case "root":
          return "Root position"
        case "first":
          return "1st inversion"
        case "second":
          return "2nd inversion"
        default:
          return tagId
      }
  }
}

export function computeTagStats(
  records: readonly AttemptRecord[],
  config: TagBreakdownConfig,
): TagStats[] {
  const byTag = new Map<string, AttemptRecord[]>()
  for (const record of records) {
    const tagId = config.getTagId(record)
    if (!tagId) continue
    const group = byTag.get(tagId) ?? []
    group.push(record)
    byTag.set(tagId, group)
  }

  const rows: TagStats[] = []
  for (const [tagId, tagRecords] of byTag) {
    const lessonExerciseStats = computeLessonExerciseStats(tagRecords)
    rows.push({
      tagId,
      label: resolveTagLabel(config.kind, tagId),
      attemptCount: tagRecords.length,
      ...lessonExerciseStats,
      medianAbsCents: config.includeMedianCents ? computeMedianAbsCents(tagRecords) : null,
    })
  }

  rows.sort((a, b) => {
    if (a.lessonExercisePassRatePercent !== b.lessonExercisePassRatePercent) {
      return a.lessonExercisePassRatePercent - b.lessonExercisePassRatePercent
    }
    return a.label.localeCompare(b.label)
  })

  return rows
}

export function computeTagBreakdownForExercise(
  practiceModeId: PracticeModeId,
  records: readonly AttemptRecord[],
): TagStats[] | undefined {
  const config = getTagBreakdownConfig(practiceModeId)
  if (!config || records.length === 0) return undefined
  const rows = computeTagStats(records, config)
  return rows.length > 0 ? rows : undefined
}

/** Sing attempts only — meaningful for overall intonation on the dashboard. */
export function singAttemptsMedianAbsCents(records: readonly AttemptRecord[]): number {
  const singRecords = records.filter(
    (r) => getPracticeMode(r.practiceModeId).responseMode === "sing",
  )
  return computeMedianAbsCents(singRecords)
}
