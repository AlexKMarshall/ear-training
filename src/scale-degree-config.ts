/** Registry entry for a scale degree in a major key (semitones above tonic). */
export interface ScaleDegreeEntry {
  id: string;
  /** Semitone distance from tonic to the degree pitch. */
  semitonesFromTonic: number;
  /** Degree-style label for prompts and UI (no solfege). */
  label: string;
  /** When false, excluded from random scale-degree questions. */
  enabled: boolean;
}

/** v1 curriculum: 4th, 5th, and octave — same spans as interval v1, degree labels. */
export const SCALE_DEGREES: readonly ScaleDegreeEntry[] = [
  {
    id: "fourth",
    semitonesFromTonic: 5,
    label: "4th",
    enabled: true,
  },
  {
    id: "fifth",
    semitonesFromTonic: 7,
    label: "5th",
    enabled: true,
  },
  {
    id: "octave",
    semitonesFromTonic: 12,
    label: "Octave",
    enabled: true,
  },
] as const;

export function getScaleDegreeById(id: string): ScaleDegreeEntry | undefined {
  return SCALE_DEGREES.find((entry) => entry.id === id);
}
