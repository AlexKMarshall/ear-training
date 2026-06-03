import type { TargetNote } from "./notes.ts";

/** A three-note chord with a designated target note to sing. */
export interface ChordQuestion {
  notes: [TargetNote, TargetNote, TargetNote];
  /** Index into `notes` of the pitch the user should sing. */
  targetIndex: number;
}

export function chordTarget(question: ChordQuestion): TargetNote {
  return question.notes[question.targetIndex]!;
}

export function chordFrequenciesHz(
  question: ChordQuestion,
): [number, number, number] {
  return question.notes.map((n) => n.hz) as [number, number, number];
}
