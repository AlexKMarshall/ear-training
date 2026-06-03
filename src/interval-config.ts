/** Registry entry for an interval exercise (user can include/exclude). */
export interface IntervalEntry {
  id: string;
  /** Semitone distance from lower to upper note. */
  semitones: number;
  /** Degree-style label for answers and UI (no solfege). */
  label: string;
  /** When false, excluded from random interval questions. */
  enabled: boolean;
}

/** v1 curriculum: perfect fourth, fifth, and octave. */
export const INTERVALS: readonly IntervalEntry[] = [
  {
    id: "perfect-fourth",
    semitones: 5,
    label: "Perfect 4th",
    enabled: true,
  },
  {
    id: "perfect-fifth",
    semitones: 7,
    label: "Perfect 5th",
    enabled: true,
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
