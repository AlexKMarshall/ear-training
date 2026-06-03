import { buildChordQuestion, randomChordQuestion, type ChordType } from "../chord-types.ts";
import type { ChordQuestion } from "../chords.ts";
import type { NoteRange } from "../notes.ts";

/** Major triad in root position; user sings the middle note (the third). */
export const MAJOR_TRIAD_SING_MIDDLE: ChordType = {
  id: "major-triad-sing-middle",
  voicing: [-4, 0, 3],
  targetIndex: 1,
  rangeAnchorIndex: 1,
};

/** Fixed C3 major triad (C3–E3–G3); user sings the middle note (E3). */
export function cMajorTriadAtC3(): ChordQuestion {
  return buildChordQuestion(MAJOR_TRIAD_SING_MIDDLE, 52);
}

/** Random major triad whose third falls within `range`; user sings the middle note. */
export function randomMajorTriadWithMiddleInRange(
  range: NoteRange,
): ChordQuestion {
  return randomChordQuestion(MAJOR_TRIAD_SING_MIDDLE, range);
}
