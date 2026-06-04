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

/** Intro tier: perfect fourth, fifth, and octave. */
export const DEGREE_MAJOR_INTRO_IDS = ["fourth", "fifth", "octave"] as const;

/** Major diatonic within one octave (no unison). */
export const DEGREE_MAJOR_DIATONIC_IDS = [
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "octave",
] as const;

/** v1 curriculum registry; tier presets select pools, not only `enabled`. */
export const SCALE_DEGREES: readonly ScaleDegreeEntry[] = [
  {
    id: "second",
    semitonesFromTonic: 2,
    label: "2nd",
    enabled: false,
  },
  {
    id: "third",
    semitonesFromTonic: 4,
    label: "3rd",
    enabled: false,
  },
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
    id: "sixth",
    semitonesFromTonic: 9,
    label: "6th",
    enabled: false,
  },
  {
    id: "seventh",
    semitonesFromTonic: 11,
    label: "7th",
    enabled: false,
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
