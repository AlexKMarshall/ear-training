/** Semitone intervals from the chord root: root, third, fifth. */
export type ChordQualityIntervals = readonly [number, number, number];

export type InversionId = "root" | "first" | "second";

export interface ChordInversion {
  id: InversionId;
  label: string;
}

export const CHORD_INVERSIONS: readonly ChordInversion[] = [
  { id: "root", label: "Root position" },
  { id: "first", label: "1st inversion" },
  { id: "second", label: "2nd inversion" },
] as const;

function inversionIndex(id: InversionId): 0 | 1 | 2 {
  if (id === "root") return 0;
  if (id === "first") return 1;
  return 2;
}

/** Closed-voicing semitone offsets from the chord root for the given inversion. */
function rotatedTones(
  quality: ChordQualityIntervals,
  inversion: 0 | 1 | 2,
): [number, number, number] {
  const [root, third, fifth] = quality;
  if (inversion === 0) return [root, third, fifth];
  if (inversion === 1) return [third, fifth, root + 12];
  return [fifth, root + 12, third + 12];
}

/**
 * Low-to-high voicing offsets relative to the middle pitch (index 1).
 * The middle pitch is always the note the user should sing.
 */
export function voicingOffsetsForInversion(
  quality: ChordQualityIntervals,
  inversion: InversionId,
): [number, number, number] {
  const [low, mid, high] = rotatedTones(quality, inversionIndex(inversion));
  return [low - mid, 0, high - mid];
}
