import type { InversionId } from "../chord-inversions.ts"
import { VOICING_POSITION_IDS } from "../voicing-position.ts"
import type { ContentTierId } from "./curriculum-lessons.ts"

export type ChordContentTierId = Extract<ContentTierId, `chord-${string}`>

export interface ChordTierConfig {
  triadQualityId: "major-triad" | "minor-triad"
  inversion: InversionId
}

const CHORD_TIER_CONFIG: Record<ChordContentTierId, ChordTierConfig> = {
  "chord-major-root": { triadQualityId: "major-triad", inversion: "root" },
  "chord-minor-root": { triadQualityId: "minor-triad", inversion: "root" },
  "chord-major-first": { triadQualityId: "major-triad", inversion: "first" },
  "chord-minor-first": { triadQualityId: "minor-triad", inversion: "first" },
}

export function isChordContentTierId(tierId: ContentTierId): tierId is ChordContentTierId {
  return tierId.startsWith("chord-")
}

export function getChordTierConfig(tierId: ChordContentTierId): ChordTierConfig {
  const config = CHORD_TIER_CONFIG[tierId]
  if (!config) {
    throw new Error(`Unknown chord content tier: ${tierId}`)
  }
  return config
}

export function getChordLessonBannerLabel(tierId: ChordContentTierId): string {
  switch (tierId) {
    case "chord-major-root":
      return "Major triad · root position"
    case "chord-minor-root":
      return "Minor triad · root position"
    case "chord-major-first":
      return "Major triad · 1st inversion"
    case "chord-minor-first":
      return "Minor triad · 1st inversion"
  }
}

export function getEligibleVoicingPositionIds(): readonly (typeof VOICING_POSITION_IDS)[number][] {
  return VOICING_POSITION_IDS
}
