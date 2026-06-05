import type { ContentTierId } from "./curriculum-lessons.ts";

/** Learner-visible key quality for scale-degree curriculum tiers. */
export function getScaleDegreeKeyQualityLabel(
  tierId: ContentTierId,
): string | null {
  switch (tierId) {
    case "degree-major-intro":
    case "degree-major-diatonic":
      return "Major key";
    case "degree-minor-diatonic":
      return "Natural minor key";
    default:
      return null;
  }
}

export const DEGREE_TIER_POOL_LABEL = {
  "degree-major-intro": "major key · 4th, 5th, octave",
  "degree-major-diatonic": "major key · diatonic degrees within one octave",
  "degree-minor-diatonic": "natural minor key · diatonic degrees within one octave",
} as const satisfies Partial<Record<ContentTierId, string>>;
