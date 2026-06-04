import type { ContentTierId } from "./curriculum-lessons.ts";

/** Learner-visible key quality for scale-degree curriculum tiers. */
export function getScaleDegreeKeyQualityLabel(
  tierId: ContentTierId,
): string | null {
  switch (tierId) {
    case "degree-major-intro":
      return "Major key";
    default:
      return null;
  }
}

export const DEGREE_TIER_POOL_LABEL = {
  "degree-major-intro": "major key · 4th, 5th, octave",
} as const satisfies Partial<Record<ContentTierId, string>>;
