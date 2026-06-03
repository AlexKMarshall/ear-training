/** A4 = 440 Hz; MIDI note 69 */
export const A4_HZ = 440;
export const A4_MIDI = 69;

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export interface NoteRange {
  lowMidi: number;
  highMidi: number;
}

/** Default exercise range; later configurable per voice type. */
export const DEFAULT_NOTE_RANGE: NoteRange = {
  lowMidi: 48, // C3
  highMidi: 60, // C4
};

export interface TargetNote {
  midi: number;
  hz: number;
  name: string;
}

export function midiToHz(midi: number): number {
  return A4_HZ * 2 ** ((midi - A4_MIDI) / 12);
}

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]!}${octave}`;
}

export function randomNoteInRange(
  range: NoteRange = DEFAULT_NOTE_RANGE,
): TargetNote {
  const span = range.highMidi - range.lowMidi + 1;
  const midi = range.lowMidi + Math.floor(Math.random() * span);
  return {
    midi,
    hz: midiToHz(midi),
    name: midiToNoteName(midi),
  };
}
