import { getIntervalById, type IntervalEntry } from "./interval-config.ts";
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

export interface IntervalChoice {
  id: string;
  label: string;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Multiple-choice options for interval recognition (correct + distractors). */
export function buildIntervalChoices(correctId: string): IntervalChoice[] {
  const active = getActiveIntervals();
  const correct = getIntervalById(correctId);
  if (!correct) {
    throw new Error(`Unknown interval id: ${correctId}`);
  }

  const others = active.filter((entry) => entry.id !== correctId);
  const distractorCount = Math.min(3, others.length);
  const distractors = shuffle(others).slice(0, distractorCount);
  let options: IntervalChoice[] = [
    { id: correct.id, label: correct.label },
    ...distractors.map((entry) => ({ id: entry.id, label: entry.label })),
  ];

  if (options.length < 4 && active.length > options.length) {
    options = active.map((entry) => ({ id: entry.id, label: entry.label }));
  }

  return shuffle(options);
}
