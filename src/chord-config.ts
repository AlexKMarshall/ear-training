import type { InversionId } from "./chord-inversions.ts";
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

/** Major triad; user sings the middle voice of the voiced chord. */
export const MAJOR_TRIAD_SING_MIDDLE: ChordType = {
  id: "major-triad-sing-middle",
  quality: [0, 4, 7],
  targetIndex: 1,
  rangeAnchorIndex: 1,
};

/** Minor triad; user sings the middle voice of the voiced chord. */
export const MINOR_TRIAD_SING_MIDDLE: ChordType = {
  id: "minor-triad-sing-middle",
  quality: [0, 3, 7],
  targetIndex: 1,
  rangeAnchorIndex: 1,
};

/** Diminished triad; user sings the middle voice of the voiced chord. */
export const DIMINISHED_TRIAD_SING_MIDDLE: ChordType = {
  id: "diminished-triad-sing-middle",
  quality: [0, 3, 6],
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

/** Fixed C3 major triad in root position (C3–E3–G3); user sings E3. */
export function cMajorTriadAtC3(): ChordQuestion {
  return buildChordQuestion(MAJOR_TRIAD_SING_MIDDLE, "root", 52);
}

/** Fixed C3 minor triad in root position (C3–Eb3–G3); user sings Eb3. */
export function cMinorTriadAtC3(): ChordQuestion {
  return buildChordQuestion(MINOR_TRIAD_SING_MIDDLE, "root", 51);
}

/** Random major triad in root position; middle (third) falls within `range`. */
export function randomMajorTriadWithMiddleInRange(
  range: NoteRange,
): ChordQuestion {
  return randomChordQuestion(MAJOR_TRIAD_SING_MIDDLE, "root", range);
}

/** Random minor triad in root position; middle (third) falls within `range`. */
export function randomMinorTriadWithMiddleInRange(
  range: NoteRange,
): ChordQuestion {
  return randomChordQuestion(MINOR_TRIAD_SING_MIDDLE, "root", range);
}

/** Fixed C3 diminished triad in root position; user sings Eb3. */
export function cDiminishedTriadAtC3(): ChordQuestion {
  return buildChordQuestion(DIMINISHED_TRIAD_SING_MIDDLE, "root", 51);
}

/** Random diminished triad in root position; middle falls within `range`. */
export function randomDiminishedTriadWithMiddleInRange(
  range: NoteRange,
): ChordQuestion {
  return randomChordQuestion(DIMINISHED_TRIAD_SING_MIDDLE, "root", range);
}

/** Fixed major triad with the given inversion; middle note at `middleMidi`. */
export function majorTriadAtMiddle(
  inversion: InversionId,
  middleMidi: number,
): ChordQuestion {
  return buildChordQuestion(MAJOR_TRIAD_SING_MIDDLE, inversion, middleMidi);
}
