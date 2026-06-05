import type { ScaleDegreeEntry } from "./scale-degree-config.ts";
import {
  midiToHz,
  midiToNoteName,
  type NoteRange,
  type TargetNote,
} from "./notes.ts";
import type { LessonExercise } from "./lesson-exercise.ts";

export interface ScaleDegreeExercise {
  degreeId: string;
  semitonesFromTonic: number;
  tonic: TargetNote;
  target: TargetNote;
}

function targetNote(midi: number): TargetNote {
  return {
    midi,
    hz: midiToHz(midi),
    name: midiToNoteName(midi),
  };
}

/** Tonic MIDI values where both tonic and degree target fit in range. */
export function validTonicMidis(
  range: NoteRange,
  semitonesFromTonic: number,
): number[] {
  const midis: number[] = [];
  const maxTonic = range.highMidi - semitonesFromTonic;
  for (let midi = range.lowMidi; midi <= maxTonic; midi++) {
    midis.push(midi);
  }
  return midis;
}

export function buildScaleDegreeExercise(
  degree: ScaleDegreeEntry,
  tonicMidi: number,
): ScaleDegreeExercise {
  const targetMidi = tonicMidi + degree.semitonesFromTonic;
  return {
    degreeId: degree.id,
    semitonesFromTonic: degree.semitonesFromTonic,
    tonic: targetNote(tonicMidi),
    target: targetNote(targetMidi),
  };
}

/** Largest semitone span among degrees — tonic must fit all of them in range. */
export function maxSemitonesAmong(
  degrees: readonly ScaleDegreeEntry[],
): number {
  if (degrees.length === 0) {
    throw new Error("No scale degrees provided");
  }
  return Math.max(...degrees.map((entry) => entry.semitonesFromTonic));
}

/** Tonic MIDI values where every degree target fits in range. */
export function validLessonTonicMidis(
  range: NoteRange,
  degrees: readonly ScaleDegreeEntry[],
): number[] {
  return validTonicMidis(range, maxSemitonesAmong(degrees));
}

export function pickRandomLessonTonic(
  range: NoteRange,
  degrees: readonly ScaleDegreeEntry[],
): number {
  if (degrees.length === 0) {
    throw new Error("No scale degrees in tier pool");
  }
  const tonics = validLessonTonicMidis(range, degrees);
  if (tonics.length === 0) {
    throw new Error(
      `No valid tonic for selected degrees in voice range (${range.lowMidi}–${range.highMidi})`,
    );
  }
  return tonics[Math.floor(Math.random() * tonics.length)]!;
}

export function randomScaleDegreeExerciseForTonic(
  tonicMidi: number,
  degree: ScaleDegreeEntry,
): ScaleDegreeExercise {
  return buildScaleDegreeExercise(degree, tonicMidi);
}

export function randomScaleDegreeExercise(
  range: NoteRange,
  degree: ScaleDegreeEntry,
): ScaleDegreeExercise {
  const tonics = validTonicMidis(range, degree.semitonesFromTonic);
  if (tonics.length === 0) {
    throw new Error(
      `No valid tonic for ${degree.label} in voice range (${range.lowMidi}–${range.highMidi})`,
    );
  }
  const tonicMidi = tonics[Math.floor(Math.random() * tonics.length)]!;
  return buildScaleDegreeExercise(degree, tonicMidi);
}

export function scaleDegreeToLessonExercise(
  scaleDegreeQuestion: ScaleDegreeExercise,
): LessonExercise {
  return {
    target: scaleDegreeQuestion.target,
    scaleDegree: scaleDegreeQuestion,
    degreeId: scaleDegreeQuestion.degreeId,
  };
}

