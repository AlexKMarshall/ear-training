import type { InversionId } from "./chord-inversions.ts"
import { buildChordExercise, type ChordType, randomChordExercise } from "./chord-types.ts"
import type { ChordExercise } from "./chords.ts"
import type { NoteRange } from "./notes.ts"

/** Registry entry for a chord triad quality. */
export interface ChordTypeEntry extends ChordType {
  label: string
  /** When false, excluded from non-curriculum chord draws. */
  enabled: boolean
}

export const MAJOR_TRIAD: ChordType = {
  id: "major-triad",
  quality: [0, 4, 7],
}

export const MINOR_TRIAD: ChordType = {
  id: "minor-triad",
  quality: [0, 3, 7],
}

export const DIMINISHED_TRIAD: ChordType = {
  id: "diminished-triad",
  quality: [0, 3, 6],
}

const CHORD_TYPES: readonly ChordTypeEntry[] = [
  {
    ...MAJOR_TRIAD,
    label: "Major triad",
    enabled: true,
  },
  {
    ...MINOR_TRIAD,
    label: "Minor triad",
    enabled: true,
  },
  {
    ...DIMINISHED_TRIAD,
    label: "Diminished triad",
    enabled: false,
  },
] as const

export function getChordTypeById(id: string): ChordTypeEntry | undefined {
  return CHORD_TYPES.find((t) => t.id === id)
}

export function enabledChordTypes(): ChordType[] {
  return CHORD_TYPES.filter((t) => t.enabled)
}

/** Fixed C3 major triad in root position (C3–E3–G3); user sings E3. */
export function cMajorTriadAtC3(): ChordExercise {
  return buildChordExercise(MAJOR_TRIAD, "root", 1, 52)
}

/** Fixed C3 minor triad in root position (C3–Eb3–G3); user sings Eb3. */
export function cMinorTriadAtC3(): ChordExercise {
  return buildChordExercise(MINOR_TRIAD, "root", 1, 51)
}

/** Random major triad in root position; middle (third) falls within `range`. */
export function randomMajorTriadWithMiddleInRange(range: NoteRange): ChordExercise {
  return randomChordExercise(MAJOR_TRIAD, "root", 1, range)
}

/** Random minor triad in root position; middle (third) falls within `range`. */
export function randomMinorTriadWithMiddleInRange(range: NoteRange): ChordExercise {
  return randomChordExercise(MINOR_TRIAD, "root", 1, range)
}

/** Fixed C3 diminished triad in root position; user sings Eb3. */
export function cDiminishedTriadAtC3(): ChordExercise {
  return buildChordExercise(DIMINISHED_TRIAD, "root", 1, 51)
}

/** Random diminished triad in root position; middle falls within `range`. */
export function randomDiminishedTriadWithMiddleInRange(range: NoteRange): ChordExercise {
  return randomChordExercise(DIMINISHED_TRIAD, "root", 1, range)
}

/** Fixed major triad with the given inversion; anchor note at `anchorMidi` for `targetIndex`. */
export function majorTriadAtVoicingPosition(
  inversion: InversionId,
  targetIndex: 0 | 1 | 2,
  anchorMidi: number,
): ChordExercise {
  return buildChordExercise(MAJOR_TRIAD, inversion, targetIndex, anchorMidi)
}
