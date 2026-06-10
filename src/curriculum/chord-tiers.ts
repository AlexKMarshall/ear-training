import type { InversionId } from "../chord-inversions.ts"
import { VOICING_POSITION_IDS } from "../voicing-position.ts"
import type { ContentTierId } from "./curriculum-lessons.ts"

export type ChordPerInversionContentTierId = Extract<
  ContentTierId,
  | "chord-major-root"
  | "chord-minor-root"
  | "chord-major-first"
  | "chord-minor-first"
  | "chord-major-second"
  | "chord-minor-second"
>

export type ChordPooledInversionContentTierId = Extract<
  ContentTierId,
  "chord-major-inversions" | "chord-minor-inversions"
>

export type ChordContentTierId = ChordPerInversionContentTierId | ChordPooledInversionContentTierId

export type ChordQualityIdContentTierId = Extract<ContentTierId, `chord-quality-${string}`>

export type ChordInversionIdContentTierId = Extract<ContentTierId, `chord-inversion-${string}`>

export interface ChordTierConfig {
  triadQualityId: "major-triad" | "minor-triad"
  inversion: InversionId
}

const CHORD_TIER_CONFIG: Record<ChordPerInversionContentTierId, ChordTierConfig> = {
  "chord-major-root": { triadQualityId: "major-triad", inversion: "root" },
  "chord-minor-root": { triadQualityId: "minor-triad", inversion: "root" },
  "chord-major-first": { triadQualityId: "major-triad", inversion: "first" },
  "chord-minor-first": { triadQualityId: "minor-triad", inversion: "first" },
  "chord-major-second": { triadQualityId: "major-triad", inversion: "second" },
  "chord-minor-second": { triadQualityId: "minor-triad", inversion: "second" },
}

const CHORD_POOLED_INVERSION_TIER_CONFIG: Record<
  ChordPooledInversionContentTierId,
  { triadQualityId: "major-triad" | "minor-triad" }
> = {
  "chord-major-inversions": { triadQualityId: "major-triad" },
  "chord-minor-inversions": { triadQualityId: "minor-triad" },
}

const CHORD_CAPSTONE_FALLBACK_TIERS: Record<
  ChordPooledInversionContentTierId,
  readonly ChordPerInversionContentTierId[]
> = {
  "chord-major-inversions": ["chord-major-root", "chord-major-first", "chord-major-second"],
  "chord-minor-inversions": ["chord-minor-root", "chord-minor-first", "chord-minor-second"],
}

export function isChordPerInversionContentTierId(
  tierId: ContentTierId,
): tierId is ChordPerInversionContentTierId {
  return tierId in CHORD_TIER_CONFIG
}

export function isChordPooledInversionContentTierId(
  tierId: ContentTierId,
): tierId is ChordPooledInversionContentTierId {
  return tierId in CHORD_POOLED_INVERSION_TIER_CONFIG
}

export function isChordContentTierId(tierId: ContentTierId): tierId is ChordContentTierId {
  return isChordPerInversionContentTierId(tierId) || isChordPooledInversionContentTierId(tierId)
}

export function isChordQualityIdContentTierId(
  tierId: ContentTierId,
): tierId is ChordQualityIdContentTierId {
  return tierId.startsWith("chord-quality-")
}

export function isChordInversionIdContentTierId(
  tierId: ContentTierId,
): tierId is ChordInversionIdContentTierId {
  return tierId.startsWith("chord-inversion-")
}

const CHORD_QUALITY_ID_TIER_CONFIG: Record<
  ChordQualityIdContentTierId,
  { inversion: InversionId }
> = {
  "chord-quality-root": { inversion: "root" },
  "chord-quality-first": { inversion: "first" },
  "chord-quality-second": { inversion: "second" },
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
    case "chord-quality-second":
      return "2nd inversion"
  }
}

export function getChordQualityIdExerciseSubtitle(tierId: ChordQualityIdContentTierId): string {
  return `Quality identification · ${getChordQualityIdLessonBannerLabel(tierId).toLowerCase()}`
}

export function getEligibleTriadQualityIds(): readonly ["major-triad", "minor-triad"] {
  return ["major-triad", "minor-triad"]
}

const CHORD_INVERSION_ID_TIER_CONFIG: Record<
  ChordInversionIdContentTierId,
  { triadQualityId: "major-triad" | "minor-triad" }
> = {
  "chord-inversion-major": { triadQualityId: "major-triad" },
  "chord-inversion-minor": { triadQualityId: "minor-triad" },
}

export function getChordInversionIdTierConfig(tierId: ChordInversionIdContentTierId): {
  triadQualityId: "major-triad" | "minor-triad"
} {
  const config = CHORD_INVERSION_ID_TIER_CONFIG[tierId]
  if (!config) {
    throw new Error(`Unknown chord inversion identify tier: ${tierId}`)
  }
  return config
}

export function getChordInversionIdLessonBannerLabel(
  tierId: ChordInversionIdContentTierId,
): string {
  switch (tierId) {
    case "chord-inversion-major":
      return "Major triad"
    case "chord-inversion-minor":
      return "Minor triad"
  }
}

export function getChordInversionIdExerciseSubtitle(tierId: ChordInversionIdContentTierId): string {
  return `Inversion identification · ${getChordInversionIdLessonBannerLabel(tierId).toLowerCase()}`
}

export function getEligibleInversionIds(): readonly InversionId[] {
  return ["root", "first", "second"]
}

export function getChordTierConfig(tierId: ChordPerInversionContentTierId): ChordTierConfig {
  const config = CHORD_TIER_CONFIG[tierId]
  if (!config) {
    throw new Error(`Unknown chord content tier: ${tierId}`)
  }
  return config
}

export function getChordPooledInversionTierConfig(tierId: ChordPooledInversionContentTierId): {
  triadQualityId: "major-triad" | "minor-triad"
} {
  const config = CHORD_POOLED_INVERSION_TIER_CONFIG[tierId]
  if (!config) {
    throw new Error(`Unknown chord pooled-inversion tier: ${tierId}`)
  }
  return config
}

export function getChordCapstoneFallbackTierIds(
  tierId: ChordPooledInversionContentTierId,
): readonly ChordPerInversionContentTierId[] {
  return CHORD_CAPSTONE_FALLBACK_TIERS[tierId]
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
    case "chord-major-inversions":
      return "Major triad · all inversions"
    case "chord-minor-inversions":
      return "Minor triad · all inversions"
  }
}

export function getEligibleVoicingPositionIds(): readonly (typeof VOICING_POSITION_IDS)[number][] {
  return VOICING_POSITION_IDS
}
