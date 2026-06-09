import type { AttemptRecord } from "./types.ts"

const LEGACY_CHORD_PRACTICE_MODE = "chord-middle"
const LEGACY_CHORD_CONTENT_TIER = "chord-1a"

/** Pre chord-sing rework attempts — excluded from unlock, planner, and stats. */
export function isLegacyChordAttempt(record: AttemptRecord): boolean {
  return (
    (record.practiceModeId as string) === LEGACY_CHORD_PRACTICE_MODE ||
    (record.contentTierId as string | undefined) === LEGACY_CHORD_CONTENT_TIER
  )
}

export function excludeLegacyRecords(records: readonly AttemptRecord[]): AttemptRecord[] {
  return records.filter((record) => !isLegacyChordAttempt(record))
}
