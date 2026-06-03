import { midiToHz, midiToNoteName, type TargetNote } from "./notes.ts";

/** A three-note chord with a designated target note to sing. */
export interface ChordQuestion {
  notes: [TargetNote, TargetNote, TargetNote];
  /** Index into `notes` of the pitch the user should sing. */
  targetIndex: number;
}

function targetNote(midi: number): TargetNote {
  return { midi, hz: midiToHz(midi), name: midiToNoteName(midi) };
}

/** Fixed C3 major triad (C3–E3–G3); user sings the middle note (E3). */
export function cMajorTriadAtC3(): ChordQuestion {
  return {
    notes: [targetNote(48), targetNote(52), targetNote(55)],
    targetIndex: 1,
  };
}

export function chordTarget(question: ChordQuestion): TargetNote {
  return question.notes[question.targetIndex]!;
}

export function chordFrequenciesHz(
  question: ChordQuestion,
): [number, number, number] {
  return question.notes.map((n) => n.hz) as [number, number, number];
}
