import type { ChordQualityIntervals, InversionId } from "./chord-inversions.ts"
import { voicingOffsetsFromAnchor } from "./chord-inversions.ts"
import type { ChordExercise } from "./chords.ts"
import {
  midiToHz,
  midiToNoteName,
  type NoteRange,
  randomNoteInRange,
  type TargetNote,
} from "./notes.ts"

/** Describes how to build and score a three-note chord exercise. */
export interface ChordType {
  id: string
  /** Root, third, and fifth as semitone offsets from the chord root. */
  quality: ChordQualityIntervals
}

function targetNote(midi: number): TargetNote {
  return { midi, hz: midiToHz(midi), name: midiToNoteName(midi) }
}

/** Build a chord question from a type, inversion, target voicing index, and anchor MIDI. */
export function buildChordExercise(
  type: ChordType,
  inversion: InversionId,
  targetIndex: 0 | 1 | 2,
  anchorMidi: number,
): ChordExercise {
  const voicing = voicingOffsetsFromAnchor(type.quality, inversion, targetIndex)
  const midis = voicing.map((offset) => anchorMidi + offset) as [number, number, number]
  return {
    notes: midis.map(targetNote) as [TargetNote, TargetNote, TargetNote],
    targetIndex,
  }
}

/** Randomize the anchor note within `range`, then build a chord question. */
export function randomChordExercise(
  type: ChordType,
  inversion: InversionId,
  targetIndex: 0 | 1 | 2,
  range: NoteRange,
): ChordExercise {
  const anchor = randomNoteInRange(range)
  return buildChordExercise(type, inversion, targetIndex, anchor.midi)
}
