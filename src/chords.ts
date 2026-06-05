import type { TargetNote } from "./notes.ts";

/** A three-note chord with a designated target note to sing. */
export interface ChordExercise {
  notes: [TargetNote, TargetNote, TargetNote];
  /** Index into `notes` of the pitch the user should sing. */
  targetIndex: number;
}

export function chordTarget(chordExercise: ChordExercise): TargetNote {
  return chordExercise.notes[chordExercise.targetIndex]!;
}

export function chordFrequenciesHz(question: ChordExercise): [number, number, number] {
  return question.notes.map((n) => n.hz) as [number, number, number];
}

export function chordMidis(question: ChordExercise): [number, number, number] {
  return question.notes.map((n) => n.midi) as [number, number, number];
}
