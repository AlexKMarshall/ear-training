import type { ChordQuestion } from "./chords.ts";
import {
  midiToHz,
  midiToNoteName,
  randomNoteInRange,
  type NoteRange,
  type TargetNote,
} from "./notes.ts";

/** Describes how to build and score a three-note chord exercise. */
export interface ChordType {
  id: string;
  /** Semitone offsets from the anchor note for each voice, low to high. */
  voicing: [number, number, number];
  /** Index into `voicing` of the pitch the user should sing. */
  targetIndex: number;
  /** Index into `voicing` whose MIDI must fall within range when randomizing. */
  rangeAnchorIndex: number;
}

function targetNote(midi: number): TargetNote {
  return { midi, hz: midiToHz(midi), name: midiToNoteName(midi) };
}

/** Build a chord question from a type definition and anchor MIDI. */
export function buildChordQuestion(
  type: ChordType,
  anchorMidi: number,
): ChordQuestion {
  const midis = type.voicing.map(
    (offset) => anchorMidi + offset,
  ) as [number, number, number];
  return {
    notes: midis.map(targetNote) as [TargetNote, TargetNote, TargetNote],
    targetIndex: type.targetIndex,
  };
}

/** Randomize the anchor note within `range`, then build a chord question. */
export function randomChordQuestion(
  type: ChordType,
  range: NoteRange,
): ChordQuestion {
  const anchor = randomNoteInRange(range);
  return buildChordQuestion(type, anchor.midi);
}
