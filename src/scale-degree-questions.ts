import { type ScaleDegreeEntry } from "./scale-degree-config.ts";
import {
  getActiveScaleDegrees,
  pickRandomScaleDegree,
} from "./scale-degree-preference.ts";
import {
  midiToHz,
  midiToNoteName,
  type NoteRange,
  type TargetNote,
} from "./notes.ts";
import type { SingTestQuestion } from "./sing-test-question.ts";

export interface ScaleDegreeQuestion {
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

export function buildScaleDegreeQuestion(
  degree: ScaleDegreeEntry,
  tonicMidi: number,
): ScaleDegreeQuestion {
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

/** Tonic MIDI values where every active degree target fits in range. */
export function validRoundTonicMidis(
  range: NoteRange,
  degrees: readonly ScaleDegreeEntry[] = getActiveScaleDegrees(),
): number[] {
  return validTonicMidis(range, maxSemitonesAmong(degrees));
}

export function pickRandomRoundTonic(
  range: NoteRange,
  degrees: readonly ScaleDegreeEntry[] = getActiveScaleDegrees(),
): number {
  if (degrees.length === 0) {
    throw new Error("No scale degrees are selected");
  }
  const tonics = validRoundTonicMidis(range, degrees);
  if (tonics.length === 0) {
    throw new Error(
      `No valid tonic for selected degrees in voice range (${range.lowMidi}–${range.highMidi})`,
    );
  }
  return tonics[Math.floor(Math.random() * tonics.length)]!;
}

export function randomScaleDegreeQuestionForTonic(
  tonicMidi: number,
  degree: ScaleDegreeEntry = pickRandomScaleDegree(),
): ScaleDegreeQuestion {
  return buildScaleDegreeQuestion(degree, tonicMidi);
}

export function randomScaleDegreeQuestion(
  range: NoteRange,
  degree: ScaleDegreeEntry = pickRandomScaleDegree(),
): ScaleDegreeQuestion {
  const tonics = validTonicMidis(range, degree.semitonesFromTonic);
  if (tonics.length === 0) {
    throw new Error(
      `No valid tonic for ${degree.label} in voice range (${range.lowMidi}–${range.highMidi})`,
    );
  }
  const tonicMidi = tonics[Math.floor(Math.random() * tonics.length)]!;
  return buildScaleDegreeQuestion(degree, tonicMidi);
}

export function scaleDegreeToSingTestQuestion(
  scaleDegreeQuestion: ScaleDegreeQuestion,
): SingTestQuestion {
  return {
    target: scaleDegreeQuestion.target,
    scaleDegree: scaleDegreeQuestion,
    degreeId: scaleDegreeQuestion.degreeId,
  };
}

export function randomScaleDegreeSingQuestion(
  range: NoteRange,
  tonicMidi: number = pickRandomRoundTonic(range),
): SingTestQuestion {
  return scaleDegreeToSingTestQuestion(
    randomScaleDegreeQuestionForTonic(tonicMidi),
  );
}
