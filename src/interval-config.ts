/** Registry entry for an interval exercise (user can include/exclude). */
export interface IntervalEntry {
  id: string;
  /** Semitone distance from lower to upper note. */
  semitones: number;
  /** Degree-style label for answers and UI (no solfege). */
  label: string;
  /**
   * When false, excluded from picker and random questions until tier wiring.
   * Tier 2b rows stay false until the session planner (PR 4+); tier presets
   * use {@link DIATONIC_MAJOR_INTERVAL_IDS}, not this flag.
   */
  enabled: boolean;
}

/** Tier 2a: perfect fourth, fifth, and octave. */
export const INTERVAL_2A_IDS = ["perfect-fourth", "perfect-fifth", "perfect-octave"] as const;

/** Twelve ascending diatonic major intervals within one octave (tier 2b pool). */
export const DIATONIC_MAJOR_INTERVAL_IDS = [
  "minor-second",
  "major-second",
  "minor-third",
  "major-third",
  "perfect-fourth",
  "tritone",
  "perfect-fifth",
  "minor-sixth",
  "major-sixth",
  "minor-seventh",
  "major-seventh",
  "perfect-octave",
] as const;

/** v1 curriculum: perfect fourth, fifth, octave; full diatonic-within-octave set for tier 2b. */
export const INTERVALS: readonly IntervalEntry[] = [
  {
    id: "minor-second",
    semitones: 1,
    label: "Minor 2nd",
    enabled: false,
  },
  {
    id: "major-second",
    semitones: 2,
    label: "Major 2nd",
    enabled: false,
  },
  {
    id: "minor-third",
    semitones: 3,
    label: "Minor 3rd",
    enabled: false,
  },
  {
    id: "major-third",
    semitones: 4,
    label: "Major 3rd",
    enabled: false,
  },
  {
    id: "perfect-fourth",
    semitones: 5,
    label: "Perfect 4th",
    enabled: true,
  },
  {
    id: "tritone",
    semitones: 6,
    label: "Tritone",
    enabled: false,
  },
  {
    id: "perfect-fifth",
    semitones: 7,
    label: "Perfect 5th",
    enabled: true,
  },
  {
    id: "minor-sixth",
    semitones: 8,
    label: "Minor 6th",
    enabled: false,
  },
  {
    id: "major-sixth",
    semitones: 9,
    label: "Major 6th",
    enabled: false,
  },
  {
    id: "minor-seventh",
    semitones: 10,
    label: "Minor 7th",
    enabled: false,
  },
  {
    id: "major-seventh",
    semitones: 11,
    label: "Major 7th",
    enabled: false,
  },
  {
    id: "perfect-octave",
    semitones: 12,
    label: "Perfect octave",
    enabled: true,
  },
] as const;

export function getIntervalById(id: string): IntervalEntry | undefined {
  return INTERVALS.find((entry) => entry.id === id);
}

export function getIntervalsByIds(ids: readonly string[]): IntervalEntry[] {
  return ids
    .map((id) => getIntervalById(id))
    .filter((entry): entry is IntervalEntry => entry !== undefined);
}
