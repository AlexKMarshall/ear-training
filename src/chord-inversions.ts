/** Semitone intervals from the chord root: root, third, fifth. */
export type ChordQualityIntervals = readonly [number, number, number]

export type InversionId = "root" | "first" | "second"

function inversionIndex(id: InversionId): 0 | 1 | 2 {
  if (id === "root") return 0
  if (id === "first") return 1
  return 2
}

/** Closed-voicing semitone offsets from the chord root for the given inversion. */
function rotatedTones(
  quality: ChordQualityIntervals,
  inversion: 0 | 1 | 2,
): [number, number, number] {
  const [root, third, fifth] = quality
  if (inversion === 0) return [root, third, fifth]
  if (inversion === 1) return [third, fifth, root + 12]
  return [fifth, root + 12, third + 12]
}

/**
 * Low-to-high voicing offsets relative to the anchor pitch at `anchorIndex`.
 * The anchor is the pitch the learner sings and must fall within voice range.
 */
export function voicingOffsetsFromAnchor(
  quality: ChordQualityIntervals,
  inversion: InversionId,
  anchorIndex: 0 | 1 | 2,
): [number, number, number] {
  const [low, mid, high] = rotatedTones(quality, inversionIndex(inversion))
  const anchor = anchorIndex === 0 ? low : anchorIndex === 1 ? mid : high
  return [low - anchor, mid - anchor, high - anchor]
}

/** @deprecated Use {@link voicingOffsetsFromAnchor} with anchor index 1. */
export function voicingOffsetsForInversion(
  quality: ChordQualityIntervals,
  inversion: InversionId,
): [number, number, number] {
  return voicingOffsetsFromAnchor(quality, inversion, 1)
}
