import type { InversionId } from "../chord-inversions.ts"
import { VOICING_POSITION_IDS } from "../voicing-position.ts"
import type { ContentTierId } from "./curriculum-lessons.ts"

export type ChordContentTierId = Extract<
  ContentTierId,
  `chord-major-${string}` | `chord-minor-${string}`
>

export type ChordQualityIdContentTierId = Extract<ContentTierId, `chord-quality-${string}`>

export interface ChordTierConfig {
  triadQualityId: "major-triad" | "minor-triad"
  inversion: InversionId
}

const CHORD_TIER_CONFIG: Record<ChordContentTierId, ChordTierConfig> = {
  "chord-major-root": { triadQualityId: "major-triad", inversion: "root" },
  "chord-minor-root": { triadQualityId: "minor-triad", inversion: "root" },
  "chord-major-first": { triadQualityId: "major-triad", inversion: "first" },
  "chord-minor-first": { triadQualityId: "minor-triad", inversion: "first" },
  "chord-major-second": { triadQualityId: "major-triad", inversion: "second" },
  "chord-minor-second": { triadQualityId: "minor-triad", inversion: "second" },
}

export function isChordContentTierId(tierId: ContentTierId): tierId is ChordContentTierId {
  return tierId.startsWith("chord-major-") || tierId.startsWith("chord-minor-")
}

export function isChordQualityIdContentTierId(
  tierId: ContentTierId,
): tierId is ChordQualityIdContentTierId {
  return tierId.startsWith("chord-quality-")
}

const CHORD_QUALITY_ID_TIER_CONFIG: Record<
  ChordQualityIdContentTierId,
  { inversion: InversionId }
> = {
  "chord-quality-root": { inversion: "root" },
  "chord-quality-first": { inversion: "first" },
}

export function getChordQualityIdTierConfig(tierId: ChordQualityIdContentTierId): {
  inversion: InversionId
} {
  const config = CHORD_QUALITY_ID_TIER_CONFIG[tierId]
  if (!config) {
    throw new Error(`Unknown chord quality identify tier: ${tierId}`)
  }
  return config
}

export function getChordQualityIdLessonBannerLabel(tierId: ChordQualityIdContentTierId): string {
  switch (tierId) {
    case "chord-quality-root":
      return "Root position"
    case "chord-quality-first":
      return "1st inversion"
  }
}

export function getEligibleTriadQualityIds(): readonly ["major-triad", "minor-triad"] {
  return ["major-triad", "minor-triad"]
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
    case "chord-major-second":
      return "Major triad · 2nd inversion"
    case "chord-minor-second":
      return "Minor triad · 2nd inversion"
  }
}

export function getEligibleVoicingPositionIds(): readonly (typeof VOICING_POSITION_IDS)[number][] {
  return VOICING_POSITION_IDS
}
