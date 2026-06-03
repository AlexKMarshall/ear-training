import type { NoteRange } from "./notes.ts";

/** Classical voice categories; user-selectable in a future release. */
export type VoiceType = "bass" | "tenor" | "alto" | "soprano";

export interface VoiceRange extends NoteRange {
  /** e.g. "C3–G4" for display in settings UI (future). */
  label: string;
}

/**
 * Conservative comfortable ranges for ear training — not full professional
 * spans. A future "challenging" mode can extend each bound by a few semitones.
 */
export const VOICE_RANGES: Record<VoiceType, VoiceRange> = {
  /** G2–C4: low chest register without extreme sub-bass. */
  bass: { lowMidi: 43, highMidi: 60, label: "G2–C4" },
  /** C3–G4: typical tenor tessitura, one octave plus a fifth. */
  tenor: { lowMidi: 48, highMidi: 67, label: "C3–G4" },
  /** A3–D5: middle alto register, avoids alto 2 lows and whistle highs. */
  alto: { lowMidi: 57, highMidi: 74, label: "A3–D5" },
  /** C4–G5: standard soprano zone without top-of-range strain. */
  soprano: { lowMidi: 60, highMidi: 79, label: "C4–G5" },
};

/** Fixed until voice-type preference is wired up in the UI. */
export const ACTIVE_VOICE_TYPE: VoiceType = "tenor";

export function getActiveNoteRange(): NoteRange {
  const { label: _label, ...range } = VOICE_RANGES[ACTIVE_VOICE_TYPE];
  return range;
}
