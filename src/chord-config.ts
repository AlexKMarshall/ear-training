import {
  buildChordQuestion,
  randomChordQuestion,
  type ChordType,
} from "./chord-types.ts";
import type { ChordQuestion } from "./chords.ts";
import type { NoteRange } from "./notes.ts";

/** Registry entry for a chord exercise type (future user include/exclude). */
export interface ChordTypeEntry extends ChordType {
  label: string;
  /** When false, excluded from random chord-mode questions. */
  enabled: boolean;
}

/** Major triad in root position; user sings the middle note (the third). */
export const MAJOR_TRIAD_SING_MIDDLE: ChordType = {
  id: "major-triad-sing-middle",
  voicing: [-4, 0, 3],
  targetIndex: 1,
  rangeAnchorIndex: 1,
};

/** Minor triad in root position; user sings the middle note (the minor third). */
export const MINOR_TRIAD_SING_MIDDLE: ChordType = {
  id: "minor-triad-sing-middle",
  voicing: [-3, 0, 4],
  targetIndex: 1,
  rangeAnchorIndex: 1,
};

/** Diminished triad in root position; user sings the middle note (the minor third). */
export const DIMINISHED_TRIAD_SING_MIDDLE: ChordType = {
  id: "diminished-triad-sing-middle",
  voicing: [-3, 0, 3],
  targetIndex: 1,
  rangeAnchorIndex: 1,
};

/** All supported chord types for sing-the-middle (and future) modes. */
export const CHORD_TYPES: readonly ChordTypeEntry[] = [
  {
    ...MAJOR_TRIAD_SING_MIDDLE,
    label: "Major triad",
    enabled: true,
  },
  {
    ...MINOR_TRIAD_SING_MIDDLE,
    label: "Minor triad",
    enabled: true,
  },
  {
    ...DIMINISHED_TRIAD_SING_MIDDLE,
    label: "Diminished triad",
    enabled: true,
  },
] as const;

export function getChordTypeById(id: string): ChordTypeEntry | undefined {
  return CHORD_TYPES.find((t) => t.id === id);
}

export function enabledChordTypes(): ChordType[] {
  return CHORD_TYPES.filter((t) => t.enabled);
}

/** Fixed C3 major triad (C3–E3–G3); user sings the middle note (E3). */
export function cMajorTriadAtC3(): ChordQuestion {
  return buildChordQuestion(MAJOR_TRIAD_SING_MIDDLE, 52);
}

/** Fixed C3 minor triad (C3–Eb3–G3); user sings the middle note (Eb3). */
export function cMinorTriadAtC3(): ChordQuestion {
  return buildChordQuestion(MINOR_TRIAD_SING_MIDDLE, 51);
}

/** Random major triad whose third falls within `range`; user sings the middle note. */
export function randomMajorTriadWithMiddleInRange(
  range: NoteRange,
): ChordQuestion {
  return randomChordQuestion(MAJOR_TRIAD_SING_MIDDLE, range);
}

/** Random minor triad whose third falls within `range`; user sings the middle note. */
export function randomMinorTriadWithMiddleInRange(
  range: NoteRange,
): ChordQuestion {
  return randomChordQuestion(MINOR_TRIAD_SING_MIDDLE, range);
}

/** Fixed C3 diminished triad (C3–Eb3–Gb3); user sings the middle note (Eb3). */
export function cDiminishedTriadAtC3(): ChordQuestion {
  return buildChordQuestion(DIMINISHED_TRIAD_SING_MIDDLE, 51);
}

/** Random diminished triad whose third falls within `range`; user sings the middle note. */
export function randomDiminishedTriadWithMiddleInRange(
  range: NoteRange,
): ChordQuestion {
  return randomChordQuestion(DIMINISHED_TRIAD_SING_MIDDLE, range);
}
