import type { IntervalEntry } from "./interval-config.ts";
import {
  getActiveIntervals,
  pickRandomInterval,
} from "./interval-preference.ts";
import {
  midiToHz,
  midiToNoteName,
  type NoteRange,
  type TargetNote,
} from "./notes.ts";
import type { SingTestQuestion } from "./sing-test-question.ts";

export type IntervalPresentation = "melodic" | "harmonic";

export interface IntervalQuestion {
  intervalId: string;
  semitones: number;
  presentation: IntervalPresentation;
  lower: TargetNote;
  upper: TargetNote;
}

function targetNote(midi: number): TargetNote {
  return {
    midi,
    hz: midiToHz(midi),
    name: midiToNoteName(midi),
  };
}

/** Lower MIDI values where lower + semitones still fits in range. */
export function validLowerMidis(
  range: NoteRange,
  semitones: number,
): number[] {
  const midis: number[] = [];
  const maxLower = range.highMidi - semitones;
  for (let midi = range.lowMidi; midi <= maxLower; midi++) {
    midis.push(midi);
  }
  return midis;
}

export function buildIntervalQuestion(
  interval: IntervalEntry,
  presentation: IntervalPresentation,
  lowerMidi: number,
): IntervalQuestion {
  const upperMidi = lowerMidi + interval.semitones;
  return {
    intervalId: interval.id,
    semitones: interval.semitones,
    presentation,
    lower: targetNote(lowerMidi),
    upper: targetNote(upperMidi),
  };
}

export function randomIntervalQuestion(
  presentation: IntervalPresentation,
  range: NoteRange,
  interval: IntervalEntry = pickRandomInterval(),
): IntervalQuestion {
  const lowers = validLowerMidis(range, interval.semitones);
  if (lowers.length === 0) {
    throw new Error(
      `No valid root for ${interval.label} in voice range (${range.lowMidi}–${range.highMidi})`,
    );
  }
  const lowerMidi = lowers[Math.floor(Math.random() * lowers.length)]!;
  return buildIntervalQuestion(interval, presentation, lowerMidi);
}

export function intervalToSingTestQuestion(
  intervalQuestion: IntervalQuestion,
): SingTestQuestion {
  return {
    target: intervalQuestion.upper,
    interval: intervalQuestion,
    intervalId: intervalQuestion.intervalId,
  };
}

export function randomIntervalSingQuestion(
  presentation: IntervalPresentation,
  range: NoteRange,
): SingTestQuestion {
  return intervalToSingTestQuestion(
    randomIntervalQuestion(presentation, range),
  );
}

/** Wrong-option labels for recognition (excludes correct id). */
export function intervalDistractorIds(
  correctId: string,
  count: number,
): string[] {
  const pool = getActiveIntervals()
    .map((entry) => entry.id)
    .filter((id) => id !== correctId);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
