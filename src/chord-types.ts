import type { InversionId } from "./chord-inversions.ts";
import { voicingOffsetsForInversion } from "./chord-inversions.ts";
import type { ChordQualityIntervals } from "./chord-inversions.ts";
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
  /** Root, third, and fifth as semitone offsets from the chord root. */
  quality: ChordQualityIntervals;
  /** Index into the voiced chord of the pitch the user should sing (always middle). */
  targetIndex: 1;
  /** Index whose MIDI must fall within range when randomizing (always middle). */
  rangeAnchorIndex: 1;
}

function voicingFor(
  type: ChordType,
  inversion: InversionId,
): [number, number, number] {
  return voicingOffsetsForInversion(type.quality, inversion);
}

function targetNote(midi: number): TargetNote {
  return { midi, hz: midiToHz(midi), name: midiToNoteName(midi) };
}

/** Build a chord question from a type, inversion, and middle-note MIDI. */
export function buildChordQuestion(
  type: ChordType,
  inversion: InversionId,
  middleMidi: number,
): ChordQuestion {
  const voicing = voicingFor(type, inversion);
  const midis = voicing.map(
    (offset) => middleMidi + offset,
  ) as [number, number, number];
  return {
    notes: midis.map(targetNote) as [TargetNote, TargetNote, TargetNote],
    targetIndex: type.targetIndex,
  };
}

/** Randomize the middle note within `range`, then build a chord question. */
export function randomChordQuestion(
  type: ChordType,
  inversion: InversionId,
  range: NoteRange,
): ChordQuestion {
  const middle = randomNoteInRange(range);
  return buildChordQuestion(type, inversion, middle.midi);
}
